import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { resolveTahunAjaran } from '@/lib/tahunAjaran'

const DEFAULT_DOKUMEN = [
  { jenis: 'tata_tertib', nama: 'Tata Tertib Sekolah' },
  { jenis: 'surat_pernyataan', nama: 'Surat Pernyataan Tata Tertib Peserta Didik' },
  { jenis: 'surat_perjanjian', nama: 'Surat Perjanjian Kesanggupan Membayar Biaya Pendidikan' },
]

const JENJANG_VALID = ['smp', 'sma', 'smk']

// GET - ambil daftar dokumen persyaratan daftar ulang UNTUK JENJANG TERTENTU,
// milik TAHUN AJARAN pendaftar yang login (auto-buat 3 default kalau belum
// ada untuk kombinasi itu). Bisa diakses siapa saja yang sudah login (siswa
// & admin). Kalau ?jenjang= tidak dikirim, dipakai jenjang dari pendaftaran
// milik user yang login — begitu juga tahun ajarannya.
export async function GET(req: Request) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const url = new URL(req.url)
    let jenjang = (url.searchParams.get('jenjang') || '').toLowerCase()
    let tahunAjaranId = url.searchParams.get('tahunAjaranId')

    if (!JENJANG_VALID.includes(jenjang) || !tahunAjaranId) {
      const pendaftaran = await prisma.pendaftaran.findUnique({ where: { userId: session.userId } })
      if (!JENJANG_VALID.includes(jenjang)) jenjang = pendaftaran?.jenjang || 'smk'
      if (!tahunAjaranId) tahunAjaranId = pendaftaran?.tahunAjaranId || null
    }

    const tahunAjaran = await resolveTahunAjaran(tahunAjaranId)
    if (!tahunAjaran) return NextResponse.json({ data: [] })

    let list = await prisma.dokumenPersyaratan.findMany({ where: { tahunAjaranId: tahunAjaran.id, jenjang } })
    if (list.length === 0) {
      await prisma.dokumenPersyaratan.createMany({ data: DEFAULT_DOKUMEN.map(d => ({ ...d, jenjang, tahunAjaranId: tahunAjaran.id })) })
      list = await prisma.dokumenPersyaratan.findMany({ where: { tahunAjaranId: tahunAjaran.id, jenjang } })
    }
    // urutkan sesuai DEFAULT_DOKUMEN
    const order = DEFAULT_DOKUMEN.map(d => d.jenis)
    list.sort((a, b) => order.indexOf(a.jenis) - order.indexOf(b.jenis))
    return NextResponse.json({ data: list, tahunAjaran: { id: tahunAjaran.id, nama: tahunAjaran.nama } })
  } catch (err) {
    console.error('Dokumen GET error:', err)
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 })
  }
}
