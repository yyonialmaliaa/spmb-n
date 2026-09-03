import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { resolveTahunAjaran } from '@/lib/tahunAjaran'

const JENJANG_VALID = ['smp', 'sma', 'smk']

// PUT - upload/ganti file dokumen persyaratan daftar ulang UNTUK JENJANG
// TERTENTU, milik SATU TAHUN AJARAN (default aktif kalau tahunAjaranId
// tidak dikirim). SMP/SMA/SMK punya isi dokumen yang berbeda-beda, dan
// tahun ajaran yang berbeda juga bisa punya dokumen berbeda — jenjang wajib
// dikirim, tidak ada default global.
export async function PUT(req: Request) {
  const session = await getSession()
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

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

    const updated = await prisma.dokumenPersyaratan.upsert({
      where: { tahunAjaranId_jenjang_jenis: { tahunAjaranId: tahunAjaran.id, jenjang, jenis } },
      update: { url, namaFile: namaFile || null },
      create: { tahunAjaranId: tahunAjaran.id, jenjang, jenis, nama: nama || jenis, url, namaFile: namaFile || null },
    })

    return NextResponse.json({ data: updated })
  } catch (err) {
    console.error('Dokumen PUT error:', err)
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 })
  }
}
