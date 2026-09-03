import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/db'

async function requireAdmin() {
  const session = await getSession()
  return session && session.role === 'admin' ? session : null
}

// PUT - edit jenis/tipe nominal/nominal/aktif
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { id } = await params
    const body = await req.json()
    const data: Record<string, any> = {}

    if (body.jenis !== undefined) {
      const jenis = String(body.jenis).trim()
      if (!jenis) return NextResponse.json({ error: 'Jenis diskon tidak boleh kosong' }, { status: 400 })
      data.jenis = jenis
    }
    if (body.tipeNominal !== undefined) data.tipeNominal = body.tipeNominal === 'persen' ? 'persen' : 'rupiah'
    if (body.nominal !== undefined) {
      const nominal = Math.round(Number(body.nominal) || 0)
      if (!nominal || nominal <= 0) return NextResponse.json({ error: 'Nominal tidak valid' }, { status: 400 })
      data.nominal = nominal
    }
    if (body.aktif !== undefined) data.aktif = !!body.aktif

    const updated = await prisma.diskon.update({ where: { id }, data })
    return NextResponse.json({ success: true, data: updated })
  } catch (err) {
    console.error('Admin diskon PUT error:', err)
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 })
  }
}

// DELETE - hapus jenis diskon (pendaftar yang sudah pakai tetap menyimpan
// snapshot diskonNominal-nya sendiri, tidak terpengaruh)
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { id } = await params
    await prisma.diskon.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Admin diskon DELETE error:', err)
    return NextResponse.json({ error: 'Gagal menghapus' }, { status: 500 })
  }
}
