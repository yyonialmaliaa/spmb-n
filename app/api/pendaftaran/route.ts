import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const data = await prisma.pendaftaran.findUnique({ where: { userId: session.userId } })
  return NextResponse.json({ data })
}

export async function POST(req: Request) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const body = await req.json()
    const existing = await prisma.pendaftaran.findUnique({ where: { userId: session.userId } })
    if (existing) return NextResponse.json({ error: 'Anda sudah melakukan pendaftaran' }, { status: 400 })
    if (!body.namaLengkap || !body.jenisKelamin || !body.agama || !body.jurusan) {
      return NextResponse.json({ error: 'Field wajib belum diisi' }, { status: 400 })
    }
    const pendaftaran = await prisma.pendaftaran.create({
      data: {
        userId: session.userId,
        namaLengkap: body.namaLengkap, namaPanggilan: body.namaPanggilan || null,
        tempatLahir: body.tempatLahir || null, tanggalLahir: body.tanggalLahir || null,
        ttl: body.ttl || `${body.tempatLahir || ''}, ${body.tanggalLahir || ''}`,
        jenisKelamin: body.jenisKelamin, agama: body.agama, anakKe: body.anakKe || null,
        alamat: body.alamat || '', rt: body.rt || null, rw: body.rw || null,
        kelurahan: body.kelurahan || null, kecamatan: body.kecamatan || null, kabupaten: body.kabupaten || null,
        beratBadan: body.beratBadan || null, tinggiBadan: body.tinggiBadan || null, golonganDarah: body.golonganDarah || null,
        nisn: body.nisn || null, nik: body.nik || null, noPribadi: body.noPribadi || null,
        ukuranSeragam: body.ukuranSeragam || null,
        namaPemberiReferensi: body.namaPemberiReferensi || null, noHpReferensi: body.noHpReferensi || null,
        asalSD: body.asalSD || null, asalSMP: body.asalSMP || null, asalSekolah: body.asalSMP || body.asalSekolah || null,
        jurusan: body.jurusan,
        namaAyah: body.namaAyah || null, ttlAyah: body.ttlAyah || null, pendidikanAyah: body.pendidikanAyah || null,
        pekerjaanAyah: body.pekerjaanAyah || null, penghasilanAyah: body.penghasilanAyah || null,
        noHpAyah: body.noHpAyah || null, alamatAyah: body.alamatAyah || null,
        namaIbu: body.namaIbu || null, ttlIbu: body.ttlIbu || null, pendidikanIbu: body.pendidikanIbu || null,
        pekerjaanIbu: body.pekerjaanIbu || null, penghasilanIbu: body.penghasilanIbu || null,
        noHpIbu: body.noHpIbu || null, alamatIbu: body.alamatIbu || null,
        namaWali: body.namaWali || null, ttlWali: body.ttlWali || null, pendidikanWali: body.pendidikanWali || null,
        pekerjaanWali: body.pekerjaanWali || null, penghasilanWali: body.penghasilanWali || null,
        noHpWali: body.noHpWali || null, alamatWali: body.alamatWali || null,
        namaOrtu: body.namaAyah || body.namaIbu || body.namaWali || null,
        noOrtu: body.noHpAyah || body.noHpIbu || body.noHpWali || null,
        fileIjazah: body.fileIjazah || null, fileAkte: body.fileAkte || null,
        fileKK: body.fileKK || null, fileKtpOrtu: body.fileKtpOrtu || null,
        fileKip: body.fileKip || null, fileFoto: body.fileFoto || null,
        status: 'pending',
      },
    })
    return NextResponse.json({ success: true, data: pendaftaran })
  } catch (err) {
    console.error('Pendaftaran error:', err)
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 })
  }
}

// PUT - revisi berkas kalau ditolak
export async function PUT(req: Request) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const body = await req.json()
    const existing = await prisma.pendaftaran.findUnique({ where: { userId: session.userId } })
    if (!existing) return NextResponse.json({ error: 'Data tidak ditemukan' }, { status: 404 })
    if (existing.status !== 'ditolak') {
      return NextResponse.json({ error: 'Revisi hanya bisa dilakukan ketika status ditolak' }, { status: 400 })
    }
    const updated = await prisma.pendaftaran.update({
      where: { userId: session.userId },
      data: {
        ...body,
        status: 'pending', // kembali ke pending setelah revisi
        alasanPenolakan: existing.alasanPenolakan, // simpan alasan lama
        revisiCount: { increment: 1 },
        lastRevisiAt: new Date(),
        catatan: null, // reset catatan admin
      },
    })
    return NextResponse.json({ success: true, data: updated })
  } catch (err) {
    console.error('Revisi error:', err)
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 })
  }
}
