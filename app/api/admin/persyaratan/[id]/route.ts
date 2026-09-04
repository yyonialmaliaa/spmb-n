import { NextResponse } from 'next/server'
import { requirePermission } from '@/lib/adminSession'
import { catatAudit, bedanya } from '@/lib/audit'
import { prisma } from '@/lib/db'

const FIELD_SAH = ['fileIjazah', 'fileAkte', 'fileKK', 'fileKtpOrtu', 'fileKip', 'fileFoto']

// PUT — ubah nama/deskripsi/wajib/aktif/urutan/fieldKey satu persyaratan.
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const gate = await requirePermission('persyaratan', 'update')
  if (!gate.ok) return gate.res

  try {
    const { id } = await params
    const body = await req.json().catch(() => null)
    if (!body) return NextResponse.json({ error: 'Permintaan tidak valid' }, { status: 400 })

    const lama = await prisma.dokumenPersyaratan.findUnique({ where: { id } })
    if (!lama) return NextResponse.json({ error: 'Persyaratan tidak ditemukan' }, { status: 404 })

    const data: Record<string, unknown> = {}
    if (body.nama !== undefined) {
      const nama = String(body.nama).trim()
      if (!nama) return NextResponse.json({ error: 'Nama tidak boleh kosong' }, { status: 400 })
      data.nama = nama
    }
    if (body.deskripsi !== undefined) data.deskripsi = String(body.deskripsi).trim() || null
    if (body.wajib !== undefined) data.wajib = !!body.wajib
    if (body.aktif !== undefined) data.aktif = !!body.aktif
    if (body.urutan !== undefined) data.urutan = Number(body.urutan) || 0
    if (body.fieldKey !== undefined) {
      if (body.fieldKey && !FIELD_SAH.includes(body.fieldKey)) {
        return NextResponse.json({ error: 'Kolom berkas tidak dikenal' }, { status: 400 })
      }
      data.fieldKey = body.fieldKey || null
    }
    // url/namaFile dipakai kategori daftar_ulang (template yang diunggah admin)
    if (body.url !== undefined) data.url = body.url || null
    if (body.namaFile !== undefined) data.namaFile = body.namaFile || null

    const updated = await prisma.dokumenPersyaratan.update({ where: { id }, data })

    const diff = bedanya(lama as unknown as Record<string, unknown>, data)
    if (diff.fields.length > 0) {
      await catatAudit({
        session: gate.session,
        aksi: 'update',
        entitas: 'persyaratan',
        entitasId: id,
        ringkasan: `Mengubah persyaratan "${lama.nama}" (${diff.fields.join(', ')})`,
        sebelum: diff.sebelum,
        sesudah: diff.sesudah,
        jenjang: lama.jenjang,
        tahunAjaranId: lama.tahunAjaranId,
        req,
      })
    }

    return NextResponse.json({ success: true, data: updated })
  } catch (err) {
    console.error('Persyaratan PUT error:', err)
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 })
  }
}

// DELETE — hapus satu persyaratan.
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const gate = await requirePermission('persyaratan', 'delete')
  if (!gate.ok) return gate.res

  try {
    const { id } = await params
    const lama = await prisma.dokumenPersyaratan.findUnique({ where: { id } })
    if (!lama) return NextResponse.json({ error: 'Persyaratan tidak ditemukan' }, { status: 404 })

    await prisma.dokumenPersyaratan.delete({ where: { id } })

    await catatAudit({
      session: gate.session,
      aksi: 'delete',
      entitas: 'persyaratan',
      entitasId: id,
      ringkasan: `Menghapus persyaratan "${lama.nama}" dari ${lama.jenjang.toUpperCase()}`,
      sebelum: { nama: lama.nama, kategori: lama.kategori, fieldKey: lama.fieldKey },
      jenjang: lama.jenjang,
      tahunAjaranId: lama.tahunAjaranId,
      req,
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Persyaratan DELETE error:', err)
    return NextResponse.json({ error: 'Gagal menghapus' }, { status: 500 })
  }
}
