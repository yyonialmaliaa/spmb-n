import { NextResponse } from 'next/server'
import { can, forbidden, requireJenjang, requirePermission } from '@/lib/adminSession'
import { catatAudit } from '@/lib/audit'
import { prisma } from '@/lib/db'
import { STATUS_PRA, statusEfektif, tanggalWib, isJenjangPra } from '@/lib/praPendaftaran'
import { ambilPersyaratanBawa, tandaiKedaluwarsa } from '@/lib/praPendaftaranServer'

type Ctx = { params: Promise<{ id: string }> }

// GET — detail satu pra-pendaftaran beserta berkas yang wajib dibawa.
export async function GET(_req: Request, { params }: Ctx) {
  const gate = await requirePermission('pra_pendaftaran', 'read')
  if (!gate.ok) return gate.res

  try {
    const { id } = await params
    const pra = await prisma.praPendaftaran.findUnique({
      where: { id },
      omit: { tokenAkses: true, ipHash: true },
      include: {
        tahunAjaran: { select: { nama: true, aktif: true } },
        pendaftaran: { select: { id: true, noPendaftaran: true, status: true } },
      },
    })
    if (!pra) return NextResponse.json({ error: 'Data pra-pendaftaran tidak ditemukan' }, { status: 404 })
    const tolak = requireJenjang(gate.session, pra.jenjang)
    if (tolak) return tolak

    const status = statusEfektif(pra.status, pra.batasKedatangan)
    if (status !== pra.status) await tandaiKedaluwarsa({ id })

    return NextResponse.json({
      data: {
        ...pra,
        status,
        persyaratan: isJenjangPra(pra.jenjang) ? await ambilPersyaratanBawa(pra.tahunAjaranId, pra.jenjang) : [],
      },
    })
  } catch (err) {
    console.error('Pra-pendaftaran detail GET error:', err)
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 })
  }
}

// PATCH { aksi: 'konfirmasi_kedatangan' | 'mulai_proses' } — perpindahan status dijaga atomik di database.
export async function PATCH(req: Request, { params }: Ctx) {
  const gate = await requirePermission('pra_pendaftaran', 'update')
  if (!gate.ok) return gate.res

  try {
    const { id } = await params
    const body = await req.json().catch(() => null)
    const aksi = body?.aksi
    if (aksi !== 'konfirmasi_kedatangan' && aksi !== 'mulai_proses') {
      return NextResponse.json({ error: 'Aksi tidak dikenal' }, { status: 400 })
    }

    const pra = await prisma.praPendaftaran.findUnique({ where: { id } })
    if (!pra) return NextResponse.json({ error: 'Data pra-pendaftaran tidak ditemukan' }, { status: 404 })
    const tolak = requireJenjang(gate.session, pra.jenjang)
    if (tolak) return tolak

    const sekarang = new Date()
    const statusKini = statusEfektif(pra.status, pra.batasKedatangan, sekarang)
    const konteksAudit = {
      session: gate.session,
      entitas: 'pra_pendaftaran' as const,
      entitasId: id,
      jenjang: pra.jenjang,
      tahunAjaranId: pra.tahunAjaranId,
      req,
    }

    if (aksi === 'konfirmasi_kedatangan') {
      const hasil = await prisma.praPendaftaran.updateMany({
        where: { id, status: 'menunggu', batasKedatangan: { gte: sekarang } },
        data: { status: 'datang', datangAt: sekarang, dikonfirmasiOleh: gate.session.namaLengkap || gate.session.email },
      })
      if (hasil.count === 0) {
        if (statusKini === 'kedaluwarsa') {
          await tandaiKedaluwarsa({ id })
          return NextResponse.json({
            error: `Pra-pendaftaran ini kedaluwarsa sejak ${tanggalWib(pra.batasKedatangan)} dan tidak dapat diproses lagi. Minta calon peserta didik mengisi pra-pendaftaran baru, atau daftarkan langsung lewat Pendaftar Offline.`,
          }, { status: 409 })
        }
        return NextResponse.json({ error: `Status saat ini sudah "${STATUS_PRA[statusKini].teks}".` }, { status: 409 })
      }
      await catatAudit({
        ...konteksAudit,
        aksi: 'update',
        ringkasan: `Mengonfirmasi kedatangan ${pra.namaLengkap} (${pra.noPraPendaftaran})`,
        sebelum: { status: pra.status },
        sesudah: { status: 'datang' },
      })
      return NextResponse.json({ success: true })
    }

    if (!can(gate.session.role, 'pendaftar', 'create')) return forbidden()
    if (statusKini === 'diproses') return NextResponse.json({ success: true })
    const hasil = await prisma.praPendaftaran.updateMany({
      where: { id, status: 'datang' },
      data: { status: 'diproses', diprosesAt: sekarang },
    })
    if (hasil.count === 0) {
      return NextResponse.json({
        error: statusKini === 'menunggu'
          ? 'Konfirmasi kedatangan calon peserta didik terlebih dahulu.'
          : `Status saat ini sudah "${STATUS_PRA[statusKini].teks}".`,
      }, { status: 409 })
    }
    await catatAudit({
      ...konteksAudit,
      aksi: 'update',
      ringkasan: `Mulai memproses pendaftaran resmi dari ${pra.noPraPendaftaran} (${pra.namaLengkap})`,
      sebelum: { status: 'datang' },
      sesudah: { status: 'diproses' },
    })
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Pra-pendaftaran PATCH error:', err)
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 })
  }
}
