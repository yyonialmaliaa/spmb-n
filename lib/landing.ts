import { prisma } from './db'
import { JENJANG_LABEL_FULL, JENJANG_SINGKAT, JURUSAN_SMK, type Jenjang } from './labels'

// ---------------------------------------------------------------------------
// Lapisan data landing page SPMB.
//
// Landing page BUKAN halaman statis: tahun ajaran, jadwal gelombang, harga,
// diskon, persyaratan, dan program keahlian semuanya dibaca dari sumber yang
// SAMA dengan yang dikelola admin. Kalau admin mengubah harga hari ini,
// halaman depan ikut berubah — tidak ada nominal yang ditulis tangan di JSX.
//
// Semua query di sini berjalan di server (React Server Component), jadi
// pengunjung tidak menunggu fetch dari browser dan angkanya sudah ada di HTML
// pertama — penting untuk halaman yang dibaca mesin pencari.
// ---------------------------------------------------------------------------

export const JENJANG_URUT: Jenjang[] = ['smp', 'sma', 'smk']

export type BarisHarga = {
  kelas: string
  jurusan: string
  nominal: number
}

export type BarisJadwal = {
  id: string
  nama: string
  untukAlumni: boolean
  tanggalMulai: string | null
  tanggalSelesai: string | null
  diskonPersen: number
  aktif: boolean
}

export type BarisSyarat = {
  id: string
  nama: string
  deskripsi: string | null
  wajib: boolean
}

export type DataJenjang = {
  jenjang: Jenjang
  /** "SMP" */
  singkat: string
  /** "SMP Citra Negara" */
  label: string
  harga: BarisHarga[]
  hargaTerendah: number | null
  jadwal: BarisJadwal[]
  gelombangAktif: BarisJadwal | null
  persyaratan: BarisSyarat[]
}

export type ProgramKeahlian = {
  kode: string
  nama: string
  /** Nama panjang persis seperti tersimpan di data Harga. */
  namaResmi: string
  warna: string
  gambar: string
}

export type DataLanding = {
  tahunAjaran: { id: string; nama: string } | null
  jenjang: DataJenjang[]
  programSMK: ProgramKeahlian[]
  /** Potongan biaya yang berlaku, dari tabel Diskon. */
  diskon: { jenis: string; tipeNominal: string; nominal: number }[]
}

/**
 * Foto per program keahlian. Memakai berkas yang MEMANG ada di public/images;
 * kalau sebuah program belum punya foto sendiri, ia jatuh ke foto umum
 * supaya tidak pernah ada gambar rusak di halaman depan.
 */
const GAMBAR_PROGRAM: Record<string, string> = {
  PPLG: '/images/esport.jpg',
  TJKT: '/images/tekon.jpg',
  DKV: '/images/gakuen.jpg',
  MPLB: '/images/irma.jpg',
  BDR: '/images/citter.jpg',
  PH: '/images/tari.jpg',
}
const GAMBAR_PROGRAM_CADANGAN = '/images/citter.jpg'

/** Foto besar per jenjang untuk panel horizontal & halaman detail. */
export const GAMBAR_JENJANG: Record<Jenjang, string> = {
  smp: '/images/pramuka.jpg',
  sma: '/images/paskibra.jpg',
  smk: '/images/tekon.jpg',
}

function keJadwal(g: {
  id: string
  nama: string
  untukAlumni: boolean
  tanggalMulai: Date | null
  tanggalSelesai: Date | null
  diskonPersen: number
  aktif: boolean
}): BarisJadwal {
  return {
    id: g.id,
    nama: g.nama,
    untukAlumni: g.untukAlumni,
    // Diserialisasi jadi string di server: objek Date tidak boleh menyeberang
    // ke client component apa adanya.
    tanggalMulai: g.tanggalMulai ? g.tanggalMulai.toISOString() : null,
    tanggalSelesai: g.tanggalSelesai ? g.tanggalSelesai.toISOString() : null,
    diskonPersen: g.diskonPersen,
    aktif: g.aktif,
  }
}

/** Seluruh data yang dibutuhkan halaman depan, dalam satu perjalanan ke DB. */
export async function getDataLanding(): Promise<DataLanding> {
  const tahunAjaran = await prisma.tahunAjaran.findFirst({ where: { aktif: true } })

  if (!tahunAjaran) {
    return { tahunAjaran: null, jenjang: [], programSMK: [], diskon: [] }
  }

  const [harga, gelombang, syarat, diskon] = await Promise.all([
    prisma.harga.findMany({
      where: { tahunAjaranId: tahunAjaran.id, aktif: true },
      orderBy: [{ jenjang: 'asc' }, { urutan: 'asc' }],
    }),
    prisma.gelombang.findMany({
      where: { tahunAjaranId: tahunAjaran.id },
      orderBy: [{ jenjang: 'asc' }, { untukAlumni: 'asc' }, { urutan: 'asc' }],
    }),
    prisma.dokumenPersyaratan.findMany({
      where: { tahunAjaranId: tahunAjaran.id, kategori: 'pendaftaran', aktif: true },
      orderBy: [{ jenjang: 'asc' }, { urutan: 'asc' }],
    }),
    prisma.diskon.findMany({
      where: { tahunAjaranId: tahunAjaran.id, aktif: true },
      orderBy: { createdAt: 'asc' },
    }),
  ])

  const jenjang: DataJenjang[] = JENJANG_URUT.map(j => {
    const barisHarga = harga
      .filter(h => h.jenjang === j)
      .map(h => ({ kelas: h.kelas, jurusan: h.jurusan, nominal: h.nominal }))
    const jadwal = gelombang.filter(g => g.jenjang === j).map(keJadwal)

    return {
      jenjang: j,
      singkat: JENJANG_SINGKAT[j],
      label: JENJANG_LABEL_FULL[j],
      harga: barisHarga,
      hargaTerendah: barisHarga.length > 0 ? Math.min(...barisHarga.map(h => h.nominal)) : null,
      jadwal,
      gelombangAktif: jadwal.find(g => g.aktif) ?? null,
      persyaratan: syarat
        .filter(s => s.jenjang === j)
        .map(s => ({ id: s.id, nama: s.nama, deskripsi: s.deskripsi, wajib: s.wajib })),
    }
  })

  // Program keahlian diambil dari data Harga SMK yang benar-benar ada —
  // TIDAK ditulis tangan. Kalau sekolah menutup satu program, ia hilang dari
  // halaman depan dengan sendirinya. Nama pendek & warnanya diambil dari
  // lib/labels.ts supaya identik dengan yang dipakai di sisi admin.
  const namaJurusanSMK = [...new Set(
    harga.filter(h => h.jenjang === 'smk' && h.jurusan && h.jurusan !== '-').map(h => h.jurusan),
  )]

  const programSMK: ProgramKeahlian[] = namaJurusanSMK.map(namaResmi => {
    const cocok = JURUSAN_SMK.find(x => namaResmi.toUpperCase().includes(x.kode))
    const kode = cocok?.kode ?? namaResmi.slice(0, 4).toUpperCase()
    return {
      kode,
      // Buang "(PPLG)" di ekor supaya judulnya bersih; kodenya sudah tampil terpisah.
      nama: namaResmi.replace(/\s*\([^)]*\)\s*$/, '').trim(),
      namaResmi,
      warna: cocok?.warna ?? 'var(--cn-hijau)',
      gambar: GAMBAR_PROGRAM[kode] ?? GAMBAR_PROGRAM_CADANGAN,
    }
  })

  return {
    tahunAjaran: { id: tahunAjaran.id, nama: tahunAjaran.nama },
    jenjang,
    programSMK,
    diskon: diskon.map(d => ({ jenis: d.jenis, tipeNominal: d.tipeNominal, nominal: d.nominal })),
  }
}

/** Data satu jenjang untuk halaman /spmb/jenjang/[jenjang]. */
export async function getDataSatuJenjang(j: Jenjang) {
  const semua = await getDataLanding()
  return {
    tahunAjaran: semua.tahunAjaran,
    data: semua.jenjang.find(x => x.jenjang === j) ?? null,
    // Program keahlian HANYA disertakan untuk SMK — SMP dan SMA tidak
    // mengenal jurusan, dan halamannya tidak boleh menampilkannya.
    programSMK: j === 'smk' ? semua.programSMK : [],
    diskon: semua.diskon,
  }
}

export function isJenjang(v: string): v is Jenjang {
  return (JENJANG_URUT as string[]).includes(v)
}
