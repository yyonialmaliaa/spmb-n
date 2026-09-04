import { NextResponse } from 'next/server'
import { requirePermission } from '@/lib/adminSession'
import { catatAudit, bedanya, rupiah } from '@/lib/audit'
import { prisma } from '@/lib/db'

// PUT - edit nominal/jurusan/kelas/aktif untuk satu baris harga
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const gate = await requirePermission('harga', 'update')
  if (!gate.ok) return gate.res

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

    // Ambil kondisi sebelum diubah supaya jejak audit bisa menyebut nominal
    // lama -> nominal baru, bukan sekadar "harga diubah".
    const lama = await prisma.harga.findUnique({ where: { id } })
    if (!lama) return NextResponse.json({ error: 'Data harga tidak ditemukan' }, { status: 404 })

    const updated = await prisma.harga.update({ where: { id }, data })

    const diff = bedanya(lama as unknown as Record<string, unknown>, data)
    if (diff.fields.length > 0) {
      const ringkasan = diff.fields.includes('nominal')
        ? `Mengubah harga ${lama.jenjang.toUpperCase()} ${lama.jurusan !== '-' ? lama.jurusan + ' ' : ''}${lama.kelas}: ${rupiah(lama.nominal)} → ${rupiah(updated.nominal)}`
        : `Mengubah harga ${lama.jenjang.toUpperCase()} ${lama.kelas} (${diff.fields.join(', ')})`
      await catatAudit({
        session: gate.session,
        aksi: 'update',
        entitas: 'harga',
        entitasId: id,
        ringkasan,
        sebelum: diff.sebelum,
        sesudah: diff.sesudah,
        jenjang: lama.jenjang,
        tahunAjaranId: lama.tahunAjaranId,
        req,
      })
    }

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
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const gate = await requirePermission('harga', 'delete')
  if (!gate.ok) return gate.res

  try {
    const { id } = await params
    const lama = await prisma.harga.findUnique({ where: { id } })
    await prisma.harga.delete({ where: { id } })
    if (lama) {
      await catatAudit({
        session: gate.session,
        aksi: 'delete',
        entitas: 'harga',
        entitasId: id,
        ringkasan: `Menghapus harga ${lama.jenjang.toUpperCase()} ${lama.jurusan !== '-' ? lama.jurusan + ' ' : ''}${lama.kelas} (${rupiah(lama.nominal)})`,
        sebelum: { nominal: lama.nominal, jurusan: lama.jurusan, kelas: lama.kelas },
        jenjang: lama.jenjang,
        tahunAjaranId: lama.tahunAjaranId,
        req,
      })
    }
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Admin harga DELETE error:', err)
    return NextResponse.json({ error: 'Gagal menghapus' }, { status: 500 })
  }
}
