import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { notifRevisiMasuk } from '@/lib/notifikasiAdmin'

const JENJANG_VALID = ['smp', 'sma', 'smk']

// Field yang boleh diisi/diubah lewat draft (POST awal & PATCH autosave).
// Tidak ada satupun yang wajib di tahap ini (baru wajib saat "kirim" —
// lihat app/api/pendaftaran/kirim/route.ts) — sesuai section A3 (simpan
// sementara) & B9 (formulir offline tidak wajib lengkap).
const EDITABLE_FIELDS = [
  'namaLengkap', 'namaPanggilan', 'tempatLahir', 'tanggalLahir', 'ttl', 'jenisKelamin', 'agama', 'anakKe',
  'alamat', 'rt', 'rw', 'kelurahan', 'kecamatan', 'kabupaten', 'beratBadan', 'tinggiBadan', 'golonganDarah',
  'nisn', 'nik', 'noPribadi', 'ukuranSeragam', 'namaPemberiReferensi', 'noHpReferensi',
  'asalSD', 'asalSMP', 'asalSekolah', 'jurusan', 'kelas', 'tipePendaftaran', 'kelasMasuk', 'alumniSmpCitraNegara',
  'namaAyah', 'ttlAyah', 'pendidikanAyah', 'pekerjaanAyah', 'penghasilanAyah', 'noHpAyah', 'alamatAyah',
  'namaIbu', 'ttlIbu', 'pendidikanIbu', 'pekerjaanIbu', 'penghasilanIbu', 'noHpIbu', 'alamatIbu',
  'namaWali', 'ttlWali', 'pendidikanWali', 'pekerjaanWali', 'penghasilanWali', 'noHpWali', 'alamatWali',
  'namaOrtu', 'noOrtu', 'jenisIjazah', 'fileIjazah', 'fileAkte', 'fileKK', 'fileKtpOrtu', 'fileKip', 'fileFoto',
  'lastStep',
] as const

function pickEditableFields(body: Record<string, unknown>) {
  const data: Record<string, unknown> = {}
  for (const key of EDITABLE_FIELDS) {
    if (key in body) data[key] = body[key] === '' ? null : body[key]
  }
  return data
}

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const data = await prisma.pendaftaran.findUnique({ where: { userId: session.userId } })
  return NextResponse.json({ data })
}

// POST - membuat draft pendaftaran baru (belum terkirim ke admin). Boleh
// kosong/tidak lengkap — lihat EDITABLE_FIELDS di atas.
export async function POST(req: Request) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const body = await req.json()

    const existing = await prisma.pendaftaran.findUnique({ where: { userId: session.userId } })
    if (existing) return NextResponse.json({ error: 'Anda sudah memiliki data pendaftaran' }, { status: 400 })

    const tahunAjaran = await prisma.tahunAjaran.findFirst({ where: { aktif: true } })
    if (!tahunAjaran) {
      return NextResponse.json({ error: 'Tahun ajaran aktif belum diatur, hubungi admin' }, { status: 400 })
    }

    const jenjang = JENJANG_VALID.includes(body.jenjang) ? body.jenjang : 'smk'

    const pendaftaran = await prisma.pendaftaran.create({
      data: {
        userId: session.userId,
        tahunAjaranId: tahunAjaran.id,
        jenjang,
        status: 'draft',
        sumberDaftar: 'online',
        statusPembayaran: 'belum_bayar',
        ...pickEditableFields(body),
      },
    })
    return NextResponse.json({ success: true, data: pendaftaran })
  } catch (err) {
    console.error('Pendaftaran (draft) error:', err)
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 })
  }
}

// PATCH - autosave draft yang sudah ada ("Simpan Sementara"). Hanya boleh
// selama status masih "draft" — begitu terkirim (lihat /kirim), data biodata
// tidak lagi bisa diubah lewat sini (revisi berkas dipotong lewat PUT).
export async function PATCH(req: Request) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const body = await req.json()
    const existing = await prisma.pendaftaran.findUnique({ where: { userId: session.userId } })
    if (!existing) return NextResponse.json({ error: 'Data pendaftaran belum dibuat' }, { status: 404 })
    if (existing.status !== 'draft') {
      return NextResponse.json({ error: 'Formulir sudah dikirim, tidak bisa diubah lagi di sini' }, { status: 400 })
    }

    const updated = await prisma.pendaftaran.update({
      where: { userId: session.userId },
      data: pickEditableFields(body),
    })
    return NextResponse.json({ success: true, data: updated })
  } catch (err) {
    console.error('Pendaftaran (autosave) error:', err)
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 })
  }
}

// PUT - revisi berkas kalau status ditolak. Syarat asal SD/MI vs asal SMP
// dicek dari data yang SUDAH TERSIMPAN di record (jenjang/tipePendaftaran),
// bukan dari body request — body revisi hanya berisi field berkas yang
// diunggah ulang, jadi memvalidasi terhadap body akan selalu gagal.
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

    const isSMP = existing.jenjang === 'smp'
    const isBaru = existing.tipePendaftaran !== 'pindahan'
    const asalSD = 'asalSD' in body ? body.asalSD : existing.asalSD
    const asalSMP = 'asalSMP' in body ? body.asalSMP : existing.asalSMP

    if (isSMP && isBaru && !asalSD) {
      return NextResponse.json({ error: 'Asal SD/MI wajib diisi untuk pendaftaran SMP baru' }, { status: 400 })
    }
    if (!isSMP && !asalSMP) {
      return NextResponse.json({ error: 'Asal SMP/MTs wajib diisi' }, { status: 400 })
    }

    const updated = await prisma.pendaftaran.update({
      where: { userId: session.userId },
      data: {
        ...pickEditableFields(body),
        status: 'verified', // kembali ke Sedang Diverifikasi setelah revisi
        alasanPenolakan: existing.alasanPenolakan, // simpan alasan lama
        revisiCount: { increment: 1 },
        lastRevisiAt: new Date(),
        catatan: null, // reset catatan admin
      },
    })

    // Revisi kembali masuk antrean verifikasi, jadi Front Office perlu tahu —
    // sama seperti pendaftar baru, hanya kalimatnya yang berbeda.
    await notifRevisiMasuk({
      id: updated.id,
      namaLengkap: updated.namaLengkap,
      jenjang: updated.jenjang,
      tahunAjaranId: updated.tahunAjaranId,
      revisiKe: updated.revisiCount,
    })

    return NextResponse.json({ success: true, data: updated })
  } catch (err) {
    console.error('Revisi error:', err)
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 })
  }
}
