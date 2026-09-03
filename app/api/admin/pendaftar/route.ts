import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { resolveTahunAjaran } from '@/lib/tahunAjaran'

// GET ?tahunAjaranId= - daftar pendaftar milik SATU tahun ajaran (default:
// tahun ajaran aktif). Ini yang membuat Dashboard/Data Pendaftar/Laporan
// otomatis menampilkan data tahun ajaran yang sedang berjalan tanpa
// tercampur data tahun ajaran lain — lihat lib/tahunAjaran.ts.
export async function GET(req: Request) {
  const session = await getSession()
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const url = new URL(req.url)
  const tahunAjaran = await resolveTahunAjaran(url.searchParams.get('tahunAjaranId'))
  if (!tahunAjaran) {
    return NextResponse.json({ data: [], stats: { total: 0, verified: 0, diterima: 0, ditolak: 0, daftar_ulang: 0, menungguPembayaran: 0 }, tahunAjaran: null })
  }

  // Draft ONLINE (calon pendaftar masih mengisi/menyimpan sendiri, belum
  // bayar minimal & klik "Kirim Formulir") BUKAN pendaftaran yang sudah
  // masuk — tidak boleh muncul/dihitung di sisi admin sama sekali. Draft
  // OFFLINE tetap ditampilkan (itu draft yang dibuat ADMIN sendiri lewat
  // "Tambah Pendaftar Offline", admin memang perlu melihat & melanjutkannya).
  const data = await prisma.pendaftaran.findMany({
    where: {
      tahunAjaranId: tahunAjaran.id,
      NOT: { status: 'draft', sumberDaftar: 'online' },
    },
    include: { user: { select: { email: true } }, pembayaranList: true },
    orderBy: { createdAt: 'desc' },
  })

  const stats = {
    total:    data.length,
    verified: data.filter(p => p.status === 'verified').length,
    diterima: data.filter(p => p.status === 'diterima_berkas').length,
    ditolak:  data.filter(p => p.status === 'ditolak').length,
    daftar_ulang: data.filter(p => p.sudahDaftarUlang).length,
    menungguPembayaran: data.filter(p => p.statusPembayaran === 'menunggu_verifikasi').length,
  }

  const enriched = data.map(p => ({ ...p, userEmail: p.user?.email ?? null }))
  return NextResponse.json({ data: enriched, stats, tahunAjaran: { id: tahunAjaran.id, nama: tahunAjaran.nama, aktif: tahunAjaran.aktif } })
}
