import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession()
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const { id } = await params
    const body = await req.json()

    const allowed = ['pending', 'verified', 'diterima_berkas', 'ditolak', 'tes', 'lulus', 'tidak_lulus']
    if (body.status && !allowed.includes(body.status)) {
      return NextResponse.json({ error: 'Status tidak valid' }, { status: 400 })
    }

    const updateData: Record<string, any> = {}

    if (body.status !== undefined)            updateData.status = body.status
    if (body.catatan !== undefined)            updateData.catatan = body.catatan
    if (body.alasanPenolakan !== undefined)    updateData.alasanPenolakan = body.alasanPenolakan
    if (body.jadwalTes !== undefined)          updateData.jadwalTes = body.jadwalTes
    if (body.lokasiTes !== undefined)          updateData.lokasiTes = body.lokasiTes
    if (body.infoTes !== undefined)            updateData.infoTes = body.infoTes
    if (body.pesanPengumuman !== undefined)    updateData.pesanPengumuman = body.pesanPengumuman
    if (body.catatanDaftarUlang !== undefined) updateData.catatanDaftarUlang = body.catatanDaftarUlang

    // Nilai tes & seleksi
    if (body.nilaiTes !== undefined && body.nilaiTes !== '') {
      updateData.nilaiTes = parseFloat(body.nilaiTes)
    }
    if (body.nilaiSeleksi !== undefined && body.nilaiSeleksi !== '') {
      updateData.nilaiSeleksi = parseFloat(body.nilaiSeleksi)
    }

    // Konfirmasi daftar ulang
    if (body.sudahDaftarUlang !== undefined) {
      updateData.sudahDaftarUlang = body.sudahDaftarUlang
      if (body.sudahDaftarUlang === true) {
        updateData.tanggalDaftarUlang = new Date()
        // Update status ke daftar_ulang selesai
        updateData.status = 'daftar_ulang'
      }
    }

    const updated = await prisma.pendaftaran.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json({ success: true, data: updated })
  } catch (err) {
    console.error('Update error:', err)
    return NextResponse.json({ error: 'Terjadi kesalahan' }, { status: 500 })
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession()
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  try {
    const { id } = await params
    await prisma.pendaftaran.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Data tidak ditemukan' }, { status: 404 })
  }
}
