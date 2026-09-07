import { prisma } from './db'
import type { Role } from './permissions'
import { JENJANG_SINGKAT, type Jenjang } from './labels'

// ---------------------------------------------------------------------------
// Notifikasi untuk admin — sistem memberi tahu petugas bahwa ada pekerjaan
// masuk. Bedakan dari lib/notifikasi.ts, yang arahnya admin -> pendaftar.
//
// Aturan tujuan (sesuai pembagian peran yang sudah berlaku di sistem):
//
//   pendaftar_baru               -> Admin SPMB / Front Office
//   revisi_masuk                 -> Admin SPMB / Front Office
//   pembayaran_perlu_verifikasi  -> Admin Keuangan / Loket
//   Super Admin                  -> melihat SEMUANYA
//
// "Super Admin melihat semuanya" sengaja ditegakkan di query (lihat
// whereNotifUntuk), bukan dengan menduplikasi baris notifikasi per peran.
// Kalau digandakan, menambah satu Super Admin baru berarti dia buta terhadap
// semua notifikasi yang terbit sebelum akunnya dibuat.
// ---------------------------------------------------------------------------

export type JenisNotifikasiAdmin =
  | 'pendaftar_baru'
  | 'revisi_masuk'
  | 'pembayaran_perlu_verifikasi'

/** Peran yang menjadi tujuan utama tiap jenis notifikasi. */
export const PERAN_TUJUAN: Record<JenisNotifikasiAdmin, Exclude<Role, 'user' | 'super_admin'>> = {
  pendaftar_baru: 'admin_spmb',
  revisi_masuk: 'admin_spmb',
  pembayaran_perlu_verifikasi: 'admin_keuangan',
}

/**
 * Penyaring notifikasi yang boleh dilihat sebuah peran.
 * Super Admin tidak disaring sama sekali — itu definisinya.
 */
export function whereNotifUntuk(role: Role) {
  return role === 'super_admin' ? {} : { peran: role }
}

type InputNotifikasi = {
  jenis: JenisNotifikasiAdmin
  judul: string
  pesan: string
  tautan?: string | null
  jenjang?: string | null
  tahunAjaranId?: string | null
  entitas?: string | null
  entitasId?: string | null
}

/**
 * Satu-satunya cara membuat notifikasi admin.
 *
 * Sengaja "fire and forget" yang aman: gagal mencatat notifikasi TIDAK BOLEH
 * menggagalkan aksi yang sedang berjalan. Seorang pendaftar tidak pantas
 * gagal mengirim formulir hanya karena baris notifikasi gagal ditulis.
 */
export async function kirimNotifikasiAdmin(input: InputNotifikasi) {
  try {
    await prisma.notifikasiAdmin.create({
      data: {
        jenis: input.jenis,
        peran: PERAN_TUJUAN[input.jenis],
        judul: input.judul,
        pesan: input.pesan,
        tautan: input.tautan ?? null,
        jenjang: input.jenjang ?? null,
        tahunAjaranId: input.tahunAjaranId ?? null,
        entitas: input.entitas ?? null,
        entitasId: input.entitasId ?? null,
      },
    })
  } catch (err) {
    console.error('Gagal membuat notifikasi admin:', err)
  }
}

/** "SMK" bila jenjang dikenali, selain itu string kosong yang aman dirangkai. */
function labelJenjang(jenjang?: string | null) {
  const j = (jenjang || '').toLowerCase() as Jenjang
  return JENJANG_SINGKAT[j] || ''
}

/**
 * Notifikasi Admin SPMB mengarah ke ANTREAN VERIFIKASI, bukan ke halaman data
 * pendaftar. Yang dituntut oleh notifikasi ini adalah tindakan memeriksa
 * berkas, dan itu pekerjaan halaman Verifikasi — halaman Pendaftar hanya
 * menampilkan data. Jenjang ikut dibawa supaya antreannya langsung tersaring;
 * tab bawaan halaman itu memang "Belum Diverifikasi".
 */
function tautanVerifikasi(jenjang?: string | null) {
  return `/admin/verifikasi${jenjang ? `?jenjang=${jenjang}` : ''}`
}

function rupiah(n: number) {
  return 'Rp' + Math.round(n).toLocaleString('id-ID')
}

// --- Pembungkus per peristiwa -----------------------------------------------
// Pesannya dirakit di sini, bukan di route, supaya kalimat untuk peristiwa
// yang sama tidak berbeda-beda tergantung siapa yang memanggilnya.

/** Pendaftar online menekan "Kirim Formulir" dan masuk antrean verifikasi. */
export function notifPendaftarBaru(p: {
  id: string
  namaLengkap: string | null
  jenjang: string | null
  tahunAjaranId: string
}) {
  const jj = labelJenjang(p.jenjang)
  return kirimNotifikasiAdmin({
    jenis: 'pendaftar_baru',
    judul: 'Pendaftar online baru',
    pesan: `${p.namaLengkap || 'Pendaftar baru'}${jj ? ` (${jj})` : ''} mengirim formulir dan menunggu verifikasi berkas.`,
    tautan: tautanVerifikasi(p.jenjang),
    jenjang: p.jenjang,
    tahunAjaranId: p.tahunAjaranId,
    entitas: 'pendaftaran',
    entitasId: p.id,
  })
}

/** Pendaftar yang berkasnya ditolak mengirim ulang perbaikan. */
export function notifRevisiMasuk(p: {
  id: string
  namaLengkap: string | null
  jenjang: string | null
  tahunAjaranId: string
  revisiKe: number
}) {
  const jj = labelJenjang(p.jenjang)
  return kirimNotifikasiAdmin({
    jenis: 'revisi_masuk',
    judul: 'Revisi berkas masuk',
    pesan: `${p.namaLengkap || 'Pendaftar'}${jj ? ` (${jj})` : ''} mengirim perbaikan berkas ke-${p.revisiKe} dan menunggu diperiksa ulang.`,
    tautan: tautanVerifikasi(p.jenjang),
    jenjang: p.jenjang,
    tahunAjaranId: p.tahunAjaranId,
    entitas: 'pendaftaran',
    entitasId: p.id,
  })
}

/** Bukti pembayaran disetor dan menunggu di-ACC petugas loket. */
export function notifPembayaranPerluVerifikasi(p: {
  pendaftaranId: string
  pembayaranId: string
  namaLengkap: string | null
  jenjang: string | null
  tahunAjaranId: string
  nominal: number
  angsuranKe: number
}) {
  const jj = labelJenjang(p.jenjang)
  return kirimNotifikasiAdmin({
    jenis: 'pembayaran_perlu_verifikasi',
    judul: 'Pembayaran menunggu verifikasi',
    pesan: `${p.namaLengkap || 'Pendaftar'}${jj ? ` (${jj})` : ''} menyetor ${rupiah(p.nominal)} (angsuran ke-${p.angsuranKe}). Bukti bayar perlu diperiksa dan di-ACC.`,
    tautan: `/admin/pembayaran${p.jenjang ? `?jenjang=${p.jenjang}` : ''}`,
    jenjang: p.jenjang,
    tahunAjaranId: p.tahunAjaranId,
    entitas: 'pembayaran',
    entitasId: p.pembayaranId,
  })
}
