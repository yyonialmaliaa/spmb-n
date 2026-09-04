import { NextResponse } from 'next/server'
import { requirePermission } from '@/lib/adminSession'
import { catatAudit, bedanya, rupiah } from '@/lib/audit'
import { prisma } from '@/lib/db'

const nilaiDiskon = (d: { tipeNominal: string; nominal: number }) =>
  d.tipeNominal === 'persen' ? `${d.nominal}%` : rupiah(d.nominal)

// PUT - edit jenis/tipe nominal/nominal/aktif
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const gate = await requirePermission('diskon', 'update')
  if (!gate.ok) return gate.res

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

    const lama = await prisma.diskon.findUnique({ where: { id } })
    if (!lama) return NextResponse.json({ error: 'Data diskon tidak ditemukan' }, { status: 404 })

    const updated = await prisma.diskon.update({ where: { id }, data })

    const diff = bedanya(lama as unknown as Record<string, unknown>, data)
    if (diff.fields.length > 0) {
      const nilaiBerubah = diff.fields.includes('nominal') || diff.fields.includes('tipeNominal')
      await catatAudit({
        session: gate.session,
        aksi: 'update',
        entitas: 'diskon',
        entitasId: id,
        ringkasan: nilaiBerubah
          ? `Mengubah diskon "${lama.jenis}": ${nilaiDiskon(lama)} → ${nilaiDiskon(updated)}`
          : `Mengubah diskon "${lama.jenis}" (${diff.fields.join(', ')})`,
        sebelum: diff.sebelum,
        sesudah: diff.sesudah,
        tahunAjaranId: lama.tahunAjaranId,
        req,
      })
    }

    return NextResponse.json({ success: true, data: updated })
  } catch (err) {
    console.error('Admin diskon PUT error:', err)
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 })
  }
}

// DELETE - hapus jenis diskon (pendaftar yang sudah pakai tetap menyimpan
// snapshot diskonNominal-nya sendiri, tidak terpengaruh)
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const gate = await requirePermission('diskon', 'delete')
  if (!gate.ok) return gate.res

  try {
    const { id } = await params
    const lama = await prisma.diskon.findUnique({ where: { id } })
    await prisma.diskon.delete({ where: { id } })

    if (lama) {
      await catatAudit({
        session: gate.session,
        aksi: 'delete',
        entitas: 'diskon',
        entitasId: id,
        ringkasan: `Menghapus diskon "${lama.jenis}" (${nilaiDiskon(lama)})`,
        sebelum: { jenis: lama.jenis, nominal: lama.nominal, tipeNominal: lama.tipeNominal },
        tahunAjaranId: lama.tahunAjaranId,
        req,
      })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Admin diskon DELETE error:', err)
    return NextResponse.json({ error: 'Gagal menghapus' }, { status: 500 })
  }
}
