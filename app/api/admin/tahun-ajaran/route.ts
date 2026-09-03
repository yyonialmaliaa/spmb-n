import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/db'

async function requireAdmin() {
  const session = await getSession()
  return session && session.role === 'admin' ? session : null
}

// GET - daftar semua tahun ajaran (terbaru dulu)
export async function GET() {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const list = await prisma.tahunAjaran.findMany({ orderBy: { createdAt: 'desc' } })
    return NextResponse.json({ data: list })
  } catch (err) {
    console.error('Tahun ajaran GET error:', err)
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 })
  }
}

// POST - tambah tahun ajaran baru (mis. "2027/2028"). Dibuat TIDAK aktif
// dulu — admin mengaktifkannya secara eksplisit lewat PUT begitu siap,
// supaya membuat tahun baru tidak diam-diam memindahkan seluruh sistem.
export async function POST(req: Request) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await req.json()
    const nama = String(body.nama || '').trim()
    if (!nama) return NextResponse.json({ error: 'Nama tahun ajaran wajib diisi' }, { status: 400 })

    const created = await prisma.tahunAjaran.create({ data: { nama, aktif: false } })
    return NextResponse.json({ success: true, data: created })
  } catch (err: any) {
    if (err?.code === 'P2002') {
      return NextResponse.json({ error: 'Tahun ajaran ini sudah ada' }, { status: 400 })
    }
    console.error('Tahun ajaran POST error:', err)
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 })
  }
}
