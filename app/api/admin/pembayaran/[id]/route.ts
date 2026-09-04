import { NextResponse } from 'next/server'
import { requirePermission } from '@/lib/adminSession'
import { catatAudit } from '@/lib/audit'
import { prisma } from '@/lib/db'
import { recalculatePembayaran, formatRupiah } from '@/lib/keuangan'
import { kirimNotifikasi } from '@/lib/notifikasi'

// GET - detail satu cicilan pembayaran + data pendaftar terkait (untuk cetak kwitansi)
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const gate = await requirePermission('pembayaran', 'read')
  if (!gate.ok) return gate.res
  try {
    const { id } = await params
    const cicilan = await prisma.pembayaran.findUnique({
      where: { id },
      include: { pendaftaran: true },
    })
    if (!cicilan) return NextResponse.json({ error: 'Data tidak ditemukan' }, { status: 404 })
    return NextResponse.json({ data: cicilan })
  } catch (err) {
    console.error('Get cicilan error:', err)
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 })
  }
}

// PUT - admin verifikasi (lunas) atau tolak satu cicilan pembayaran
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const gate = await requirePermission('pembayaran', 'update')
  if (!gate.ok) return gate.res

  try {
    const { id } = await params
    const { status, catatanAdmin } = await req.json()

    if (!['lunas', 'ditolak', 'menunggu_verifikasi'].includes(status)) {
      return NextResponse.json({ error: 'Status tidak valid' }, { status: 400 })
    }

    const cicilan = await prisma.pembayaran.findUnique({ where: { id } })
    if (!cicilan) return NextResponse.json({ error: 'Data cicilan tidak ditemukan' }, { status: 404 })

    await prisma.pembayaran.update({
      where: { id },
      data: {
        status,
        catatanAdmin: catatanAdmin ?? null,
        tanggalVerifikasi: status !== 'menunggu_verifikasi' ? new Date() : null,
      },
    })

    const pendaftaranUpdated = await recalculatePembayaran(cicilan.pendaftaranId)

    if (status !== cicilan.status) {
      const pendaftar = await prisma.pendaftaran.findUnique({
        where: { id: cicilan.pendaftaranId },
        select: { namaLengkap: true, jenjang: true, tahunAjaranId: true },
      })
      const aksiLabel = status === 'lunas' ? 'Memverifikasi' : status === 'ditolak' ? 'Menolak' : 'Mengembalikan ke menunggu'
      await catatAudit({
        session: gate.session,
        aksi: status === 'lunas' ? 'verify' : status === 'ditolak' ? 'reject' : 'update',
        entitas: 'pembayaran',
        entitasId: id,
        ringkasan: `${aksiLabel} pembayaran ${formatRupiah(cicilan.nominal)} (cicilan ke-${cicilan.angsuranKe}) atas nama ${pendaftar?.namaLengkap || 'pendaftar'}`,
        sebelum: { status: cicilan.status },
        sesudah: { status, catatanAdmin: catatanAdmin ?? null },
        jenjang: pendaftar?.jenjang ?? null,
        tahunAjaranId: pendaftar?.tahunAjaranId ?? null,
        req,
      })
    }

    // Notifikasi ke pendaftar — hanya untuk cicilan "bayar" milik pendaftar
    // sendiri (bukan refund/alokasi yang sudah dinotifikasi saat dibuat, dan
    // memang selalu langsung berstatus lunas jadi tidak lewat verifikasi ini).
    if ((cicilan.jenis || 'bayar') === 'bayar' && status !== 'menunggu_verifikasi') {
      await kirimNotifikasi(
        cicilan.pendaftaranId,
        status === 'lunas'
          ? `Pembayaran cicilan ke-${cicilan.angsuranKe} sebesar ${formatRupiah(cicilan.nominal)} telah diverifikasi.`
          : `Bukti pembayaran cicilan ke-${cicilan.angsuranKe} ditolak.${catatanAdmin ? ` Catatan: ${catatanAdmin}` : ''}`
      )
    }

    return NextResponse.json({ success: true, data: pendaftaranUpdated })
  } catch (err) {
    console.error('Verifikasi cicilan error:', err)
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 })
  }
}
