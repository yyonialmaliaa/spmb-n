import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { resolveTahunAjaran } from '@/lib/tahunAjaran'

const JENJANG_VALID = ['smp', 'sma', 'smk']

// Field yang boleh diisi/diubah oleh admin lewat formulir offline. TIDAK ADA
// yang wajib (section B9) — admin boleh simpan sekalipun baru terisi
// sebagian, dan melengkapi sisanya kapan saja lewat PUT di
// /api/admin/pendaftar-offline/[id].
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

// POST - admin menyimpan formulir pendaftaran OFFLINE (siswa datang langsung
// ke sekolah). Cukup jenjang saja yang wajib — sisanya boleh kosong dan
// dilengkapi belakangan. Akun login TIDAK dibuat di sini — lihat
// /api/admin/pendaftar-offline/[id]/buat-akun (section C: satu data
// pendaftar yang sama dipakai untuk offline & online, akun dikaitkan
// belakangan begitu emailnya sudah diketahui).
export async function POST(req: Request) {
  const session = await getSession()
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const jenjang = JENJANG_VALID.includes(body.jenjang) ? body.jenjang : 'smk'

    const tahunAjaran = await resolveTahunAjaran(body.tahunAjaranId)
    if (!tahunAjaran) {
      return NextResponse.json({ error: 'Tahun ajaran aktif belum diatur, hubungi admin' }, { status: 400 })
    }

    const pendaftaran = await prisma.pendaftaran.create({
      data: {
        tahunAjaranId: tahunAjaran.id,
        jenjang,
        status: 'draft',
        sumberDaftar: 'offline',
        statusPembayaran: 'belum_bayar',
        waVerified: true, // diinput langsung oleh admin di sekolah, dianggap sudah terverifikasi
        ...pickEditableFields(body),
      },
    })
    return NextResponse.json({ success: true, data: pendaftaran })
  } catch (err) {
    console.error('Pendaftaran offline (draft) error:', err)
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 })
  }
}
