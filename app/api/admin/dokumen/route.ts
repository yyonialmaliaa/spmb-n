import { NextResponse } from 'next/server'
import { requirePermission } from '@/lib/adminSession'
import { prisma } from '@/lib/db'
import { resolveTahunAjaran } from '@/lib/tahunAjaran'

const JENJANG_VALID = ['smp', 'sma', 'smk']

// PUT - upload/ganti file dokumen persyaratan daftar ulang UNTUK JENJANG
// TERTENTU, milik SATU TAHUN AJARAN (default aktif kalau tahunAjaranId
// tidak dikirim). SMP/SMA/SMK punya isi dokumen yang berbeda-beda, dan
// tahun ajaran yang berbeda juga bisa punya dokumen berbeda — jenjang wajib
// dikirim, tidak ada default global.
export async function PUT(req: Request) {
  const gate = await requirePermission('persyaratan', 'update')
  if (!gate.ok) return gate.res

  try {
    const { jenjang, jenis, nama, url, namaFile, tahunAjaranId } = await req.json()
    if (!JENJANG_VALID.includes(jenjang)) {
      return NextResponse.json({ error: 'jenjang tidak valid' }, { status: 400 })
    }
    if (!jenis || !url) {
      return NextResponse.json({ error: 'jenis & url wajib diisi' }, { status: 400 })
    }

    const tahunAjaran = await resolveTahunAjaran(tahunAjaranId)
    if (!tahunAjaran) return NextResponse.json({ error: 'Tahun ajaran aktif belum diatur' }, { status: 400 })

    // Route ini khusus template daftar ulang (yang punya file untuk diunduh).
    // Berkas persyaratan pendaftaran dikelola di /api/admin/persyaratan.
    const updated = await prisma.dokumenPersyaratan.upsert({
      where: {
        tahunAjaranId_jenjang_kategori_jenis: {
          tahunAjaranId: tahunAjaran.id,
          jenjang,
          kategori: 'daftar_ulang',
          jenis,
        },
      },
      update: { url, namaFile: namaFile || null },
      create: { tahunAjaranId: tahunAjaran.id, jenjang, kategori: 'daftar_ulang', jenis, nama: nama || jenis, url, namaFile: namaFile || null },
    })

    return NextResponse.json({ data: updated })
  } catch (err) {
    console.error('Dokumen PUT error:', err)
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 })
  }
}
