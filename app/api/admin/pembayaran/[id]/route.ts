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
//
// KHUSUS Admin Keuangan (Loket) & Super Admin — walau Admin SPMB sekarang
// punya izin 'pembayaran':'update' juga (dipakai untuk lolos gerbang POST
// /api/admin/pembayaran saat "membantu input pembayaran", lihat komentar
// di lib/permissions.ts), MEMVERIFIKASI/MENOLAK bukti bayar yang disetor
// pendaftar online adalah pekerjaan keuangan yang berbeda dan TETAP bukan
// wewenang Front Office. Ditolak eksplisit di sini, sama seperti refund/
// alokasi ditolak eksplisit di app/api/admin/pembayaran/route.ts.
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const gate = await requirePermission('pembayaran', 'update')
  if (!gate.ok) return gate.res

  if (gate.session.role === 'admin_spmb') {
    return NextResponse.json(
      { error: 'Admin SPMB tidak dapat memverifikasi pembayaran. Hubungi Admin Keuangan.' },
      { status: 403 },
    )
  }

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
