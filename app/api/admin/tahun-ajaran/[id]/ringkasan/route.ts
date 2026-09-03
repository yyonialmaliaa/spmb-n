import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { hitungRingkasan } from '@/lib/pembayaran-utils'

async function requireAdmin() {
  const session = await getSession()
  return session && session.role === 'admin' ? session : null
}

// GET - ringkasan LENGKAP satu tahun ajaran: pendaftar, keuangan, harga,
// diskon, gelombang. Ini yang menjadi isi halaman "Lihat Data" — satu-
// satunya tempat admin bisa membuka data tahun ajaran manapun (aktif atau
// tidak) tanpa perlu mengubah tahun ajaran yang sedang berjalan.
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { id } = await params
    const tahunAjaran = await prisma.tahunAjaran.findUnique({ where: { id } })
    if (!tahunAjaran) return NextResponse.json({ error: 'Tahun ajaran tidak ditemukan' }, { status: 404 })

    // Draft ONLINE (calon pendaftar masih mengisi/menyimpan sendiri, belum
    // bayar minimal & klik "Kirim Formulir") BUKAN pendaftaran yang sudah
    // masuk — tidak dihitung di ringkasan ini sama sekali. Draft OFFLINE
    // (dibuat admin sendiri lewat "Tambah Pendaftar Offline") tetap dihitung.
    const [pendaftarList, harga, diskon, gelombang, dokumen] = await Promise.all([
      prisma.pendaftaran.findMany({
        where: { tahunAjaranId: id, NOT: { status: 'draft', sumberDaftar: 'online' } },
        include: { pembayaranList: true },
      }),
      prisma.harga.findMany({ where: { tahunAjaranId: id }, orderBy: [{ jenjang: 'asc' }, { jurusan: 'asc' }, { urutan: 'asc' }] }),
      prisma.diskon.findMany({ where: { tahunAjaranId: id }, orderBy: { createdAt: 'asc' } }),
      prisma.gelombang.findMany({ where: { tahunAjaranId: id }, orderBy: [{ jenjang: 'asc' }, { untukAlumni: 'asc' }, { urutan: 'asc' }] }),
      prisma.dokumenPersyaratan.count({ where: { tahunAjaranId: id } }),
    ])

    const byJenjang = (j: string) => pendaftarList.filter(p => p.jenjang === j).length

    const pendaftar = {
      total: pendaftarList.length,
      smp: byJenjang('smp'), sma: byJenjang('sma'), smk: byJenjang('smk'),
      online: pendaftarList.filter(p => (p.sumberDaftar || 'online') === 'online').length,
      offline: pendaftarList.filter(p => p.sumberDaftar === 'offline').length,
      draft: pendaftarList.filter(p => p.status === 'draft').length,
      verified: pendaftarList.filter(p => p.status === 'verified').length,
      diterima_berkas: pendaftarList.filter(p => p.status === 'diterima_berkas').length,
      ditolak: pendaftarList.filter(p => p.status === 'ditolak').length,
      daftarUlang: pendaftarList.filter(p => p.sudahDaftarUlang).length,
    }

    // Keuangan — dijumlahkan per pendaftar pakai fungsi yang SAMA dengan
    // yang dipakai di kwitansi/dashboard (lib/pembayaran-utils.ts), supaya
    // angkanya tidak pernah beda dengan yang dilihat admin/siswa satu-satu.
    let totalTagihan = 0, totalDibayar = 0, totalRefund = 0, totalSisaBayar = 0
    let totalDiskonNominal = 0, jumlahCicilanTerverifikasi = 0, jumlahMenungguVerifikasi = 0
    for (const p of pendaftarList) {
      const tagihan = p.totalTagihan || 0
      const ringkasan = hitungRingkasan(p.pembayaranList, tagihan)
      totalTagihan += tagihan
      totalDibayar += ringkasan.totalDibayar
      totalRefund += ringkasan.totalRefund
      totalSisaBayar += ringkasan.sisaBayar
      totalDiskonNominal += (p.gelombangDiskonNominal || 0) + (p.diskonNominal || 0)
      jumlahCicilanTerverifikasi += p.pembayaranList.filter(x => (x.jenis || 'bayar') === 'bayar' && x.status === 'lunas').length
      jumlahMenungguVerifikasi += p.pembayaranList.filter(x => x.status === 'menunggu_verifikasi').length
    }

    const keuangan = {
      totalTagihan, totalDibayar, totalRefund, totalSisaBayar, totalDiskonNominal,
      jumlahCicilanTerverifikasi, jumlahMenungguVerifikasi,
    }

    const hargaByJenjang = {
      smp: harga.filter(h => h.jenjang === 'smp'),
      sma: harga.filter(h => h.jenjang === 'sma'),
      smk: harga.filter(h => h.jenjang === 'smk'),
    }
    const gelombangByJenjang = {
      smp: gelombang.filter(g => g.jenjang === 'smp'),
      sma: gelombang.filter(g => g.jenjang === 'sma'),
      smk: gelombang.filter(g => g.jenjang === 'smk'),
    }

    return NextResponse.json({
      data: {
        tahunAjaran: { id: tahunAjaran.id, nama: tahunAjaran.nama, aktif: tahunAjaran.aktif, createdAt: tahunAjaran.createdAt },
        pendaftar,
        keuangan,
        harga: hargaByJenjang,
        diskon,
        gelombang: gelombangByJenjang,
        dokumenCount: dokumen,
      },
    })
  } catch (err) {
    console.error('Tahun ajaran ringkasan error:', err)
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 })
  }
}
