import { NextResponse } from 'next/server'
import { requirePermission } from '@/lib/adminSession'
import { prisma } from '@/lib/db'

// PUT - edit nama/diskon/periode, atau aktifkan gelombang ini
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const gate = await requirePermission('jadwal', 'update')
  if (!gate.ok) return gate.res

  try {
    const { id } = await params
    const body = await req.json()
    const current = await prisma.gelombang.findUnique({ where: { id } })
    if (!current) return NextResponse.json({ error: 'Gelombang tidak ditemukan' }, { status: 404 })

    if (body.aktif === true) {
      // Nonaktifkan gelombang lain di JALUR yang sama saja (tahunAjaran +
      // jenjang + untukAlumni) — bukan semua gelombang lintas jenjang,
      // supaya mengaktifkan gelombang SMK tidak menonaktifkan gelombang
      // SMP/SMA yang sedang berjalan.
      await prisma.gelombang.updateMany({
        where: { tahunAjaranId: current.tahunAjaranId, jenjang: current.jenjang, untukAlumni: current.untukAlumni },
        data: { aktif: false },
      })
    }

    const data: Record<string, any> = {}
    if (body.nama !== undefined) data.nama = body.nama
    if (body.diskonPersen !== undefined) data.diskonPersen = parseFloat(body.diskonPersen) || 0
    if (body.aktif !== undefined) data.aktif = body.aktif
    if (body.tanggalMulai !== undefined) data.tanggalMulai = body.tanggalMulai ? new Date(body.tanggalMulai) : null
    if (body.tanggalSelesai !== undefined) data.tanggalSelesai = body.tanggalSelesai ? new Date(body.tanggalSelesai) : null

    const updated = await prisma.gelombang.update({ where: { id }, data })
    return NextResponse.json({ success: true, data: updated })
  } catch (err) {
    console.error('Admin gelombang PUT error:', err)
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 })
  }
}

// DELETE - hapus gelombang (tidak boleh menghapus yang sedang aktif, supaya
// jalur itu tidak sampai tanpa gelombang aktif sama sekali)
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const gate = await requirePermission('jadwal', 'delete')
  if (!gate.ok) return gate.res

  try {
    const { id } = await params
    const current = await prisma.gelombang.findUnique({ where: { id } })
    if (!current) return NextResponse.json({ error: 'Gelombang tidak ditemukan' }, { status: 404 })
    if (current.aktif) {
      return NextResponse.json({ error: 'Tidak bisa menghapus gelombang yang sedang aktif. Aktifkan gelombang lain terlebih dahulu.' }, { status: 400 })
    }

    await prisma.gelombang.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Admin gelombang DELETE error:', err)
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 })
  }
}
