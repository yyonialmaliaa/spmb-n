import { NextResponse } from 'next/server'
import { requirePermission } from '@/lib/adminSession'
import { prisma } from '@/lib/db'

const EDITABLE_FIELDS = [
  'namaLengkap', 'namaPanggilan', 'tempatLahir', 'tanggalLahir', 'ttl', 'jenisKelamin', 'agama', 'anakKe',
  'alamat', 'rt', 'rw', 'kelurahan', 'kecamatan', 'kabupaten', 'beratBadan', 'tinggiBadan', 'golonganDarah',
  'nisn', 'nik', 'noPribadi', 'ukuranSeragam', 'namaPemberiReferensi', 'noHpReferensi',
  'asalSD', 'asalSMP', 'asalSekolah', 'jurusan', 'kelas', 'tipePendaftaran', 'kelasMasuk', 'alumniSmpCitraNegara',
  'namaAyah', 'ttlAyah', 'pendidikanAyah', 'pekerjaanAyah', 'penghasilanAyah', 'noHpAyah', 'alamatAyah',
  'namaIbu', 'ttlIbu', 'pendidikanIbu', 'pekerjaanIbu', 'penghasilanIbu', 'noHpIbu', 'alamatIbu',
  'namaWali', 'ttlWali', 'pendidikanWali', 'pekerjaanWali', 'penghasilanWali', 'noHpWali', 'alamatWali',
  'namaOrtu', 'noOrtu', 'jenisIjazah', 'fileIjazah', 'fileAkte', 'fileKK', 'fileKtpOrtu', 'fileKip', 'fileFoto',
  'waVerified', 'catatan',
] as const

function pickEditableFields(body: Record<string, unknown>) {
  const data: Record<string, unknown> = {}
  for (const key of EDITABLE_FIELDS) {
    if (key in body) data[key] = body[key] === '' ? null : body[key]
  }
  return data
}

// PUT - admin melengkapi/mengoreksi biodata formulir pendaftar mana pun
// (online maupun offline, status apa pun) lewat halaman "Edit Formulir /
// Biodata" di Detail Lengkap. Tidak ada field wajib di sini — sama seperti
// pembuatan awal formulir offline (section B7/B9).
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const gate = await requirePermission('pendaftar', 'update')
  if (!gate.ok) return gate.res

  try {
    const { id } = await params
    const body = await req.json()

    const existing = await prisma.pendaftaran.findUnique({ where: { id } })
    if (!existing) return NextResponse.json({ error: 'Data tidak ditemukan' }, { status: 404 })

    const updated = await prisma.pendaftaran.update({
      where: { id },
      data: pickEditableFields(body),
    })
    return NextResponse.json({ success: true, data: updated })
  } catch (err) {
    console.error('Pendaftaran offline (update) error:', err)
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 })
  }
}
