import { NextResponse } from 'next/server'
import { requirePermission } from '@/lib/adminSession'
import { prisma } from '@/lib/db'
import { resolveTahunAjaran } from '@/lib/tahunAjaran'

const JENJANG_VALID = ['smp', 'sma', 'smk']

// GET ?jenjang=&tahunAjaranId= - semua harga (aktif & nonaktif) milik satu
// tahun ajaran (default: tahun ajaran aktif kalau tahunAjaranId tidak
// dikirim — dipakai halaman "Lihat Data" untuk membuka tahun ajaran lama).
export async function GET(req: Request) {
  const gate = await requirePermission('harga', 'read')
  if (!gate.ok) return gate.res

  try {
    const url = new URL(req.url)
    const jenjang = (url.searchParams.get('jenjang') || '').toLowerCase()
    if (!JENJANG_VALID.includes(jenjang)) {
      return NextResponse.json({ error: 'jenjang tidak valid' }, { status: 400 })
    }

    const tahunAjaran = await resolveTahunAjaran(url.searchParams.get('tahunAjaranId'))
    if (!tahunAjaran) return NextResponse.json({ data: [], tahunAjaran: null })

    const list = await prisma.harga.findMany({
      where: { tahunAjaranId: tahunAjaran.id, jenjang },
      orderBy: [{ jurusan: 'asc' }, { urutan: 'asc' }],
    })
    return NextResponse.json({ data: list, tahunAjaran: { id: tahunAjaran.id, nama: tahunAjaran.nama, aktif: tahunAjaran.aktif } })
  } catch (err) {
    console.error('Admin harga GET error:', err)
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 })
  }
}

// POST - tambah baris harga baru (jurusan/kelas baru). Ini yang jadi UI
// "tambah jurusan/kelas" dari sisi admin — satu baris = satu kombinasi
// jenjang+jurusan+kelas yang bisa dipilih pendaftar.
export async function POST(req: Request) {
  const gate = await requirePermission('harga', 'create')
  if (!gate.ok) return gate.res

  try {
    const body = await req.json()
    const jenjang = String(body.jenjang || '').toLowerCase()
    if (!JENJANG_VALID.includes(jenjang)) {
      return NextResponse.json({ error: 'jenjang tidak valid' }, { status: 400 })
    }

    const jurusan = jenjang === 'smk' ? String(body.jurusan || '').trim() : '-'
    if (jenjang === 'smk' && !jurusan) {
      return NextResponse.json({ error: 'Nama jurusan wajib diisi' }, { status: 400 })
    }

    const kelas = String(body.kelas || '').trim()
    if (!kelas) return NextResponse.json({ error: 'Nama kelas/program wajib diisi' }, { status: 400 })

    const nominal = Math.round(Number(body.nominal) || 0)
    if (!nominal || nominal <= 0) return NextResponse.json({ error: 'Nominal harga wajib diisi' }, { status: 400 })

    const tahunAjaran = await resolveTahunAjaran(body.tahunAjaranId)
    if (!tahunAjaran) return NextResponse.json({ error: 'Tahun ajaran aktif belum diatur' }, { status: 400 })

    const jumlah = await prisma.harga.count({ where: { tahunAjaranId: tahunAjaran.id, jenjang } })

    const created = await prisma.harga.create({
      data: { tahunAjaranId: tahunAjaran.id, jenjang, jurusan, kelas, nominal, urutan: jumlah },
    })
    return NextResponse.json({ success: true, data: created })
  } catch (err: any) {
    if (err?.code === 'P2002') {
      return NextResponse.json({ error: 'Kombinasi jurusan & kelas ini sudah ada' }, { status: 400 })
    }
    console.error('Admin harga POST error:', err)
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 })
  }
}
