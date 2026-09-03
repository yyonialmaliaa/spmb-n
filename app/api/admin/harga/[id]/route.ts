import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/db'

async function requireAdmin() {
  const session = await getSession()
  return session && session.role === 'admin' ? session : null
}

// PUT - edit nominal/jurusan/kelas/aktif untuk satu baris harga
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { id } = await params
    const body = await req.json()
    const data: Record<string, any> = {}

    if (body.nominal !== undefined) {
      const nominal = Math.round(Number(body.nominal) || 0)
      if (!nominal || nominal <= 0) return NextResponse.json({ error: 'Nominal tidak valid' }, { status: 400 })
      data.nominal = nominal
    }
    if (body.jurusan !== undefined) data.jurusan = String(body.jurusan).trim() || '-'
    if (body.kelas !== undefined) {
      const kelas = String(body.kelas).trim()
      if (!kelas) return NextResponse.json({ error: 'Nama kelas/program tidak boleh kosong' }, { status: 400 })
      data.kelas = kelas
    }
    if (body.aktif !== undefined) data.aktif = !!body.aktif

    const updated = await prisma.harga.update({ where: { id }, data })
    return NextResponse.json({ success: true, data: updated })
  } catch (err: any) {
    if (err?.code === 'P2002') {
      return NextResponse.json({ error: 'Kombinasi jurusan & kelas ini sudah ada' }, { status: 400 })
    }
    console.error('Admin harga PUT error:', err)
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 })
  }
}

// DELETE - hapus baris harga. Pendaftar yang totalTagihan-nya sudah terkunci
// tidak terpengaruh (snapshot hargaPokok tetap tersimpan di data mereka).
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { id } = await params
    await prisma.harga.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Admin harga DELETE error:', err)
    return NextResponse.json({ error: 'Gagal menghapus' }, { status: 500 })
  }
}
