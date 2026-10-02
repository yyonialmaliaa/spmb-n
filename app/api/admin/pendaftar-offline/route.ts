import { NextResponse } from 'next/server'
import { can, forbidden, requireJenjang, requirePermission, type AdminSession } from '@/lib/adminSession'
import { catatAudit } from '@/lib/audit'
import { prisma } from '@/lib/db'
import { resolveTahunAjaran } from '@/lib/tahunAjaran'
import { buatNomorPendaftaran } from '@/lib/nomorPendaftaran'

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
  'namaOrtu', 'noOrtu', 'jenisIjazah', 'fileIjazah', 'fileAkte', 'fileKK', 'fileKtpOrtu', 'fileFoto',
  'waVerified', 'catatan',
] as const

function pickEditableFields(body: Record<string, unknown>) {
  const data: Record<string, unknown> = {}
  for (const key of EDITABLE_FIELDS) {
    if (key in body) data[key] = body[key] === '' ? null : body[key]
  }
  return data
}

class PraSudahDiproses extends Error {}

/** Pendaftaran resmi dari pra-pendaftaran: nomor resmi, data, dan tautan dibuat dalam satu transaksi. */
async function buatDariPra(req: Request, session: AdminSession, praPendaftaranId: string, body: Record<string, unknown>) {
  if (!can(session.role, 'pra_pendaftaran', 'update')) return forbidden()

  const pra = await prisma.praPendaftaran.findUnique({
    where: { id: praPendaftaranId },
    include: { tahunAjaran: { select: { nama: true } } },
  })
  if (!pra) return NextResponse.json({ error: 'Data pra-pendaftaran tidak ditemukan' }, { status: 404 })
  const tolak = requireJenjang(session, pra.jenjang)
  if (tolak) return tolak
  if (pra.pendaftaranId || pra.status === 'selesai') {
    return NextResponse.json({ error: 'Pra-pendaftaran ini sudah diproses menjadi pendaftaran resmi.' }, { status: 409 })
  }
  if (pra.status !== 'datang' && pra.status !== 'diproses') {
    return NextResponse.json({ error: 'Konfirmasi kedatangan calon peserta didik terlebih dahulu.' }, { status: 409 })
  }

  try {
    const sekarang = new Date()
    const pendaftaran = await prisma.$transaction(async tx => {
      const noPendaftaran = await buatNomorPendaftaran(
        { tahunAjaranId: pra.tahunAjaranId, tahunAjaranNama: pra.tahunAjaran.nama, jenjang: pra.jenjang },
        tx,
      )
      const dibuat = await tx.pendaftaran.create({
        data: {
          tahunAjaranId: pra.tahunAjaranId,
          jenjang: pra.jenjang,
          status: 'draft',
          sumberDaftar: 'offline',
          statusPembayaran: 'belum_bayar',
          waVerified: true,
          noPendaftaran,
          submittedAt: sekarang,
          ...pickEditableFields(body),
        },
      })
      const tautan = await tx.praPendaftaran.updateMany({
        where: { id: pra.id, pendaftaranId: null, status: { in: ['datang', 'diproses'] } },
        data: { pendaftaranId: dibuat.id, status: 'selesai', selesaiAt: sekarang, diprosesAt: pra.diprosesAt ?? sekarang },
      })
      if (tautan.count !== 1) throw new PraSudahDiproses()
      return dibuat
    })

    await catatAudit({
      session,
      aksi: 'create',
      entitas: 'pra_pendaftaran',
      entitasId: pra.id,
      ringkasan: `Memproses ${pra.noPraPendaftaran} (${pra.namaLengkap}) menjadi pendaftaran resmi ${pendaftaran.noPendaftaran}`,
      sesudah: { pendaftaranId: pendaftaran.id, noPendaftaran: pendaftaran.noPendaftaran, status: 'selesai' },
      jenjang: pra.jenjang,
      tahunAjaranId: pra.tahunAjaranId,
      req,
    })
    return NextResponse.json({ success: true, data: pendaftaran })
  } catch (err) {
    if (err instanceof PraSudahDiproses) {
      return NextResponse.json({ error: 'Pra-pendaftaran ini baru saja diproses petugas lain.' }, { status: 409 })
    }
    throw err
  }
}

// POST - admin menyimpan formulir pendaftaran OFFLINE (siswa datang langsung
// ke sekolah). Cukup jenjang saja yang wajib — sisanya boleh kosong dan
// dilengkapi belakangan. Akun login TIDAK dibuat di sini — lihat
// /api/admin/pendaftar-offline/[id]/buat-akun (section C: satu data
// pendaftar yang sama dipakai untuk offline & online, akun dikaitkan
// belakangan begitu emailnya sudah diketahui).
export async function POST(req: Request) {
  const gate = await requirePermission('pendaftar', 'create')
  if (!gate.ok) return gate.res

  try {
    const body = await req.json()
    if (typeof body.praPendaftaranId === 'string' && body.praPendaftaranId) {
      return await buatDariPra(req, gate.session, body.praPendaftaranId, body)
    }
    const jenjang = JENJANG_VALID.includes(body.jenjang) ? body.jenjang : 'smk'

    const tahunAjaran = await resolveTahunAjaran(body.tahunAjaranId)
    if (!tahunAjaran) {
      return NextResponse.json({ error: 'Tahun ajaran aktif belum diatur, hubungi admin' }, { status: 400 })
    }

    // Offline TIDAK melalui "Kirim Formulir" terpisah (lihat catatan
    // EXCLUDE_DRAFT_ONLINE di lib/pendaftarQuery.ts: draft offline sudah
    // dihitung sejak dibuat) — jadi "formulir berhasil dikirim" untuk jalur
    // ini adalah SAAT INI JUGA, bukan menunggu transisi status nanti.
    const noPendaftaran = await buatNomorPendaftaran({
      tahunAjaranId: tahunAjaran.id,
      tahunAjaranNama: tahunAjaran.nama,
      jenjang,
    })

    const pendaftaran = await prisma.pendaftaran.create({
      data: {
        tahunAjaranId: tahunAjaran.id,
        jenjang,
        status: 'draft',
        sumberDaftar: 'offline',
        statusPembayaran: 'belum_bayar',
        waVerified: true, // diinput langsung oleh admin di sekolah, dianggap sudah terverifikasi
        noPendaftaran,
        submittedAt: new Date(),
        ...pickEditableFields(body),
      },
    })
    return NextResponse.json({ success: true, data: pendaftaran })
  } catch (err) {
    console.error('Pendaftaran offline (draft) error:', err)
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 })
  }
}
