import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

const JENJANG_VALID = ['smp', 'sma', 'smk']

// GET ?jenjang= - daftar harga AKTIF milik tahun ajaran aktif. Publik (dipakai
// halaman marketing & formulir pendaftaran) — acuan tunggal harga, supaya
// marketing copy tidak pernah beda dengan angka yang sungguhan dipakai.
export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const jenjang = (url.searchParams.get('jenjang') || '').toLowerCase()

    const tahunAjaran = await prisma.tahunAjaran.findFirst({ where: { aktif: true } })
    if (!tahunAjaran) return NextResponse.json({ data: [] })

    const where: Record<string, any> = { tahunAjaranId: tahunAjaran.id, aktif: true }
    if (JENJANG_VALID.includes(jenjang)) where.jenjang = jenjang

    const list = await prisma.harga.findMany({
      where,
      orderBy: [{ jenjang: 'asc' }, { urutan: 'asc' }],
      select: { id: true, jenjang: true, jurusan: true, kelas: true, nominal: true, urutan: true },
    })
    return NextResponse.json({ data: list })
  } catch (err) {
    console.error('Harga GET error:', err)
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 })
  }
}
