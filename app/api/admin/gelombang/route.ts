import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { resolveTahunAjaran } from '@/lib/tahunAjaran'

const JENJANG_VALID = ['smp', 'sma', 'smk']

// GET ?jenjang=smp|sma|smk&tahunAjaranId= - daftar gelombang milik satu
// tahun ajaran (default aktif) untuk jenjang tsb (jalur umum + jalur alumni
// SMP Citra Negara untuk sma/smk). Gelombang tidak lintas tahun ajaran.
export async function GET(req: Request) {
  const session = await getSession()
  if (!session || session.role !== 'admin') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const url = new URL(req.url)
    const jenjang = (url.searchParams.get('jenjang') || '').toLowerCase()
    if (!JENJANG_VALID.includes(jenjang)) {
      return NextResponse.json({ error: 'jenjang tidak valid' }, { status: 400 })
    }

    const tahunAjaran = await resolveTahunAjaran(url.searchParams.get('tahunAjaranId'))
    if (!tahunAjaran) return NextResponse.json({ data: [], tahunAjaran: null })

    const list = await prisma.gelombang.findMany({
      where: { tahunAjaranId: tahunAjaran.id, jenjang },
      orderBy: [{ untukAlumni: 'asc' }, { urutan: 'asc' }],
    })
    return NextResponse.json({ data: list, tahunAjaran: { id: tahunAjaran.id, nama: tahunAjaran.nama } })
  } catch (err) {
    console.error('Admin gelombang GET error:', err)
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 })
  }
}

// POST - tambah gelombang baru untuk jenjang (& jalur) tertentu
export async function POST(req: Request) {
  const session = await getSession()
  if (!session || session.role !== 'admin') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await req.json()
    const jenjang = String(body.jenjang || '').toLowerCase()
    if (!JENJANG_VALID.includes(jenjang)) {
      return NextResponse.json({ error: 'jenjang tidak valid' }, { status: 400 })
    }
    if (!body.nama || !String(body.nama).trim()) {
      return NextResponse.json({ error: 'Nama gelombang wajib diisi' }, { status: 400 })
    }
    // SMP tidak punya jalur alumni (SMP adalah jenjang masuk paling awal)
    const untukAlumni = jenjang !== 'smp' && body.untukAlumni === true

    const tahunAjaran = await resolveTahunAjaran(body.tahunAjaranId)
    if (!tahunAjaran) return NextResponse.json({ error: 'Tahun ajaran aktif belum diatur' }, { status: 400 })

    const jumlah = await prisma.gelombang.count({ where: { tahunAjaranId: tahunAjaran.id, jenjang, untukAlumni } })

    const created = await prisma.gelombang.create({
      data: {
        tahunAjaranId: tahunAjaran.id,
        jenjang,
        untukAlumni,
        nama: String(body.nama).trim(),
        urutan: jumlah + 1,
        diskonPersen: 0,
        aktif: jumlah === 0, // gelombang pertama di jalur ini otomatis jadi aktif
      },
    })
    return NextResponse.json({ success: true, data: created })
  } catch (err) {
    console.error('Admin gelombang POST error:', err)
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 })
  }
}
