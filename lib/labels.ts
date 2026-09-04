// Satu tempat untuk seluruh label yang tampil ke admin.
//
// Sebelumnya nama institusi di-hardcode "SMK Citra Negara" di setiap halaman
// admin — termasuk saat konteksnya SMP atau SMA. Nama yayasan adalah
// "Citra Negara"; "SMK Citra Negara" hanya benar ketika jenjang aktifnya
// memang SMK.
//
// Modul ini murni (tanpa prisma / next), jadi aman diimpor server & client.

export const NAMA_INSTITUSI = 'Citra Negara'
export const NAMA_SISTEM = 'SPMB ADMIN'

export type Jenjang = 'smp' | 'sma' | 'smk'

/** "SMP" — untuk judul ringkas: "Dashboard SMP". */
export const JENJANG_SINGKAT: Record<Jenjang, string> = {
  smp: 'SMP',
  sma: 'SMA',
  smk: 'SMK',
}

/** "SMP Citra Negara" — untuk kartu pilih jenjang & indikator konteks. */
export const JENJANG_LABEL_FULL: Record<Jenjang, string> = {
  smp: 'SMP Citra Negara',
  sma: 'SMA Citra Negara',
  smk: 'SMK Citra Negara',
}

/**
 * Badge jenjang pada kartu pemilihan.
 *
 * Ini keterangan JENJANG, bukan daftar jurusan — halaman Pilih Jenjang tidak
 * boleh meminta admin memilih jurusan. Untuk SMK jumlah program keahlian
 * dihitung dari data (lihat badgeJenjang()), bukan angka hardcoded yang bisa
 * basi ketika jurusan bertambah.
 */
export const JENJANG_BADGE: Record<Jenjang, string> = {
  smp: 'Menengah Pertama',
  sma: 'MIPA & IPS',
  smk: 'Menengah Kejuruan',
}

export function badgeJenjang(j: Jenjang, jumlahJurusan: number): string {
  if (j === 'smk' && jumlahJurusan > 0) {
    return `${jumlahJurusan} Program Keahlian`
  }
  return JENJANG_BADGE[j]
}

/** Keterangan singkat di bawah nama jenjang pada kartu pemilihan. */
export const JENJANG_SUBJUDUL: Record<Jenjang, string> = {
  smp: 'Kurikulum Merdeka · Kelas Reguler & Unggulan',
  sma: 'Peminatan Akademik Persiapan PTN',
  smk: 'Pendidikan vokasi siap kerja & wirausaha',
}

/** Inisial untuk kotak logo / avatar. */
export function inisial(nama: string | null | undefined, fallback = '?'): string {
  const n = (nama || '').trim()
  if (!n) return fallback
  return n
    .split(/\s+/)
    .slice(0, 2)
    .map(w => w[0])
    .join('')
    .toUpperCase()
}

/**
 * Judul halaman yang sadar konteks: namaHalaman('Dashboard', 'smp')
 * -> "Dashboard SMP". Tanpa jenjang -> "Dashboard".
 */
export function namaHalaman(dasar: string, jenjang?: Jenjang | string | null): string {
  const j = jenjang && jenjang in JENJANG_SINGKAT ? JENJANG_SINGKAT[jenjang as Jenjang] : null
  return j ? `${dasar} ${j}` : dasar
}

/** "Dashboard SMP — Citra Negara" untuk breadcrumb & <title>. */
export function judulLengkap(dasar: string, jenjang?: Jenjang | string | null): string {
  return `${namaHalaman(dasar, jenjang)} — ${NAMA_INSTITUSI}`
}

// ---------------------------------------------------------------------------
// STATUS PENDAFTARAN — berbeda dari STATUS PEMBAYARAN di bawah. Keduanya
// boleh tampil berdampingan pada satu pendaftar, tapi tidak boleh dicampur.
// ---------------------------------------------------------------------------

export type NadaStatus = 'netral' | 'info' | 'sukses' | 'peringatan' | 'bahaya'

export interface Label {
  teks: string
  nada: NadaStatus
}

export const STATUS_PENDAFTARAN: Record<string, Label> = {
  draft: { teks: 'Belum Dikirim', nada: 'netral' },
  verified: { teks: 'Menunggu Verifikasi', nada: 'peringatan' },
  diterima_berkas: { teks: 'Terverifikasi', nada: 'sukses' },
  ditolak: { teks: 'Ditolak', nada: 'bahaya' },
}

export const STATUS_PEMBAYARAN: Record<string, Label> = {
  belum_bayar: { teks: 'Belum Bayar', nada: 'netral' },
  menunggu_verifikasi: { teks: 'Menunggu Verifikasi', nada: 'peringatan' },
  cicilan_berjalan: { teks: 'Cicilan Berjalan', nada: 'info' },
  lunas: { teks: 'Lunas', nada: 'sukses' },
  ditolak: { teks: 'Ditolak', nada: 'bahaya' },
}

export const STATUS_TRANSAKSI: Record<string, Label> = {
  menunggu_verifikasi: { teks: 'Menunggu Verifikasi', nada: 'peringatan' },
  lunas: { teks: 'Terverifikasi', nada: 'sukses' },
  ditolak: { teks: 'Ditolak', nada: 'bahaya' },
}

export const JENIS_TRANSAKSI: Record<string, Label> = {
  bayar: { teks: 'Pembayaran', nada: 'sukses' },
  refund: { teks: 'Pengembalian', nada: 'peringatan' },
  alokasi: { teks: 'Alokasi', nada: 'info' },
}

const LABEL_TIDAK_DIKENAL: Label = { teks: '—', nada: 'netral' }

export function labelStatusPendaftaran(v: string | null | undefined): Label {
  return (v && STATUS_PENDAFTARAN[v]) || LABEL_TIDAK_DIKENAL
}

export function labelStatusPembayaran(v: string | null | undefined): Label {
  return (v && STATUS_PEMBAYARAN[v]) || LABEL_TIDAK_DIKENAL
}

export const KATEGORI_PERSYARATAN = {
  pendaftaran: 'Berkas Pendaftaran',
  daftar_ulang: 'Dokumen Daftar Ulang',
} as const

/**
 * fieldKey yang boleh dipakai baris persyaratan kategori "pendaftaran".
 * Terbatas pada kolom file yang BENAR-BENAR ada di model Pendaftaran —
 * menambah nilai di luar daftar ini akan membuat berkas tidak pernah
 * terbaca oleh halaman Verifikasi.
 */
export const FIELD_BERKAS: Record<string, string> = {
  fileIjazah: 'Ijazah / SKL',
  fileAkte: 'Akte Kelahiran',
  fileKK: 'Kartu Keluarga',
  fileKtpOrtu: 'KTP Orang Tua',
  fileKip: 'KIP / PKH / KKS',
  fileFoto: 'Pas Foto',
}
