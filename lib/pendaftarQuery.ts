import type { Prisma } from '@prisma/client'
import { prisma } from './db'

// Tulang punggung konsistensi data.
//
// Aturan "siapa yang dihitung sebagai pendaftar" dulu ditulis ulang di tiga
// tempat terpisah (app/api/admin/pendaftar, lib/laporanSpmb, dan ringkasan
// tahun ajaran). Ketiganya kebetulan identik — satu suntingan ceroboh dari
// berbeda. Sekarang semuanya mengimpor dari sini, sehingga "kalau Dashboard
// bilang 428, halaman Pendaftar juga 428" benar secara struktural, bukan
// kebetulan.

/**
 * Draft ONLINE = calon pendaftar masih mengisi formulirnya sendiri, belum
 * membayar minimal dan belum menekan "Kirim Formulir". Itu BELUM pendaftaran
 * yang masuk, jadi tidak boleh muncul atau terhitung di sisi admin.
 *
 * Draft OFFLINE tetap dihitung — itu draft yang dibuat ADMIN sendiri lewat
 * "Tambah Pendaftar Offline", dan admin memang perlu melihat serta
 * melanjutkannya.
 */
export const EXCLUDE_DRAFT_ONLINE = {
  NOT: { status: 'draft', sumberDaftar: 'online' },
} satisfies Prisma.PendaftaranWhereInput

export interface ScopePendaftar {
  tahunAjaranId: string
  /** null/undefined = semua jenjang (dipakai halaman Pilih Jenjang). */
  jenjang?: string | null
  /** Filter status opsional, mis. 'verified' untuk antrean Verifikasi. */
  status?: string | null
}

/**
 * Klausa `where` standar untuk setiap query pendaftar di sisi admin.
 * SELALU di-scope ke satu tahun ajaran; jenjang opsional.
 */
export function scopePendaftar({
  tahunAjaranId,
  jenjang,
  status,
}: ScopePendaftar): Prisma.PendaftaranWhereInput {
  return {
    tahunAjaranId,
    ...(jenjang ? { jenjang } : {}),
    ...(status ? { status } : {}),
    ...EXCLUDE_DRAFT_ONLINE,
  }
}

/**
 * Apakah baris ini draft online — yaitu calon pendaftar yang formulirnya
 * belum dikirim. Dipakai untuk menyaring di memori ketika satu query harus
 * melayani dua pertanyaan sekaligus (lihat ringkasan tahun ajaran).
 */
export function adalahDraftOnline(p: { status: string; sumberDaftar: string | null }): boolean {
  return p.status === 'draft' && (p.sumberDaftar || 'online') === 'online'
}

/**
 * Klausa `where` untuk halaman UANG: Tagihan, Pembayaran, Transaksi, dan
 * Laporan Keuangan.
 *
 * Sama dengan scopePendaftar(), KECUALI satu hal: draft online yang SUDAH
 * menyetor uang tetap disertakan.
 *
 * Kenapa harus berbeda — dan kenapa ini bukan pelonggaran yang sembarangan:
 * alur sistem MEWAJIBKAN pendaftar membayar minimal SEBELUM tombol "Kirim
 * Formulir" bisa ditekan (lihat app/api/pendaftaran/kirim/route.ts). Artinya
 * SETIAP pendaftar online pasti melewati keadaan "masih draft, tapi uangnya
 * sudah masuk". Kalau halaman uang ikut memakai aturan pendaftaran, setoran
 * pertama setiap pendaftar online mustahil terlihat — apalagi di-ACC — oleh
 * petugas loket, dan uang yang benar-benar sudah diterima sekolah tidak
 * pernah muncul di laporan keuangan.
 *
 * Aturan pengecualian draft online tetap benar untuk PENDAFTARAN: draft yang
 * ditinggalkan tidak boleh menggelembungkan jumlah pendaftar. Tapi draft yang
 * sudah menyetor uang bukan draft yang ditinggalkan — uangnya nyata dan wajib
 * dipertanggungjawabkan.
 */
export function scopePendaftarUang({
  tahunAjaranId,
  jenjang,
}: Omit<ScopePendaftar, 'status'>): Prisma.PendaftaranWhereInput {
  return {
    tahunAjaranId,
    ...(jenjang ? { jenjang } : {}),
    OR: [
      EXCLUDE_DRAFT_ONLINE,
      { pembayaranList: { some: {} } },
    ],
  }
}

/** Bentuk statistik yang dipakai bersama oleh dashboard & halaman Pendaftar. */
export interface StatsPendaftar {
  total: number
  verified: number
  diterima: number
  ditolak: number
  daftar_ulang: number
  menungguPembayaran: number
}

export const STATS_KOSONG: StatsPendaftar = {
  total: 0,
  verified: 0,
  diterima: 0,
  ditolak: 0,
  daftar_ulang: 0,
  menungguPembayaran: 0,
}

type BarisStat = {
  status: string
  sudahDaftarUlang: boolean
  statusPembayaran: string
}

/** Hitung statistik dari baris yang SUDAH di-scope lewat scopePendaftar(). */
export function hitungStats(rows: BarisStat[]): StatsPendaftar {
  return {
    total: rows.length,
    verified: rows.filter(p => p.status === 'verified').length,
    diterima: rows.filter(p => p.status === 'diterima_berkas').length,
    ditolak: rows.filter(p => p.status === 'ditolak').length,
    daftar_ulang: rows.filter(p => p.sudahDaftarUlang).length,
    menungguPembayaran: rows.filter(p => p.statusPembayaran === 'menunggu_verifikasi').length,
  }
}

export const JENJANG_VALID = ['smp', 'sma', 'smk'] as const
export type Jenjang = (typeof JENJANG_VALID)[number]

export function isJenjangValid(v: string | null | undefined): v is Jenjang {
  return !!v && (JENJANG_VALID as readonly string[]).includes(v)
}

export interface RingkasanJenjang {
  jenjang: Jenjang
  total: number
  butuhVerifikasi: number
  terverifikasi: number
  sudahDaftarUlang: number
  /** Jumlah program keahlian aktif — dipakai badge kartu SMK. */
  jumlahJurusan: number
  gelombang: { nama: string; tanggalMulai: Date | null; tanggalSelesai: Date | null } | null
}

export interface PeriodeSpmb {
  mulai: Date | null
  selesai: Date | null
}

/**
 * Angka untuk kartu di halaman Pilih Jenjang, dihitung di DATABASE
 * (groupBy), bukan dengan mengirim seluruh baris pendaftar ke browser
 * seperti sebelumnya.
 */
export async function ringkasanPerJenjang(tahunAjaranId: string): Promise<RingkasanJenjang[]> {
  const [perStatus, perDaftarUlang, gelombangAktif, jurusan] = await Promise.all([
    prisma.pendaftaran.groupBy({
      by: ['jenjang', 'status'],
      where: scopePendaftar({ tahunAjaranId }),
      _count: { _all: true },
    }),
    prisma.pendaftaran.groupBy({
      by: ['jenjang'],
      where: { ...scopePendaftar({ tahunAjaranId }), sudahDaftarUlang: true },
      _count: { _all: true },
    }),
    prisma.gelombang.findMany({
      where: { tahunAjaranId, aktif: true, untukAlumni: false },
      select: { jenjang: true, nama: true, tanggalMulai: true, tanggalSelesai: true },
    }),
    // Program keahlian dihitung dari katalog Harga yang aktif, bukan angka
    // hardcoded — jadi badge SMK ikut benar saat jurusan bertambah/berkurang.
    prisma.harga.findMany({
      where: { tahunAjaranId, aktif: true, NOT: { jurusan: '-' } },
      select: { jenjang: true, jurusan: true },
      distinct: ['jenjang', 'jurusan'],
    }),
  ])

  return JENJANG_VALID.map(jenjang => {
    const baris = perStatus.filter(r => r.jenjang === jenjang)
    const g = gelombangAktif.find(x => x.jenjang === jenjang)
    return {
      jenjang,
      total: baris.reduce((n, r) => n + r._count._all, 0),
      butuhVerifikasi: baris.find(r => r.status === 'verified')?._count._all ?? 0,
      terverifikasi: baris.find(r => r.status === 'diterima_berkas')?._count._all ?? 0,
      sudahDaftarUlang: perDaftarUlang.find(r => r.jenjang === jenjang)?._count._all ?? 0,
      jumlahJurusan: jurusan.filter(x => x.jenjang === jenjang).length,
      gelombang: g
        ? { nama: g.nama, tanggalMulai: g.tanggalMulai, tanggalSelesai: g.tanggalSelesai }
        : null,
    }
  })
}

/**
 * Rentang periode SPMB satu tahun ajaran: tanggal mulai paling awal sampai
 * tanggal selesai paling akhir di seluruh gelombang.
 */
export async function periodeSpmb(tahunAjaranId: string): Promise<PeriodeSpmb> {
  const agg = await prisma.gelombang.aggregate({
    where: { tahunAjaranId },
    _min: { tanggalMulai: true },
    _max: { tanggalSelesai: true },
  })
  return { mulai: agg._min.tanggalMulai, selesai: agg._max.tanggalSelesai }
}
