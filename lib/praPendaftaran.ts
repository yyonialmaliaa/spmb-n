import { YAYASAN_INFO } from './biaya'
import type { Jenjang, NadaStatus } from './labels'

// Aturan pra-pendaftaran yang dipakai bersama formulir (browser) dan route API (server).

export const MASA_BERLAKU_HARI = 7

export type StatusPra = 'menunggu' | 'datang' | 'diproses' | 'selesai' | 'kedaluwarsa'

export const STATUS_PRA: Record<StatusPra, { teks: string; nada: NadaStatus }> = {
  menunggu: { teks: 'Menunggu Kedatangan', nada: 'peringatan' },
  datang: { teks: 'Sudah Datang', nada: 'info' },
  diproses: { teks: 'Diproses', nada: 'info' },
  selesai: { teks: 'Selesai', nada: 'sukses' },
  kedaluwarsa: { teks: 'Kedaluwarsa', nada: 'bahaya' },
}

export const STATUS_PRA_AKTIF: StatusPra[] = ['menunggu', 'datang', 'diproses']

export type BarisBawa = { nama: string; deskripsi: string | null; wajib: boolean; fieldKey: string | null }

/** Setiap dokumen dibawa 2 lembar; semuanya fotokopi kecuali pas foto. */
export function catatanBawa(b: BarisBawa): string {
  const pasFoto = b.fieldKey === 'fileFoto' || /pas\s*(foto|photo)/i.test(b.nama)
  return [pasFoto ? '2 lembar' : 'Fotokopi 2 lembar', b.deskripsi].filter(Boolean).join(' · ')
}

export function isStatusPra(v: unknown): v is StatusPra {
  return typeof v === 'string' && v in STATUS_PRA
}

export function statusEfektif(status: string, batasKedatangan: Date | string, sekarang = new Date()): StatusPra {
  const s = isStatusPra(status) ? status : 'menunggu'
  if (s === 'menunggu' && new Date(batasKedatangan).getTime() < sekarang.getTime()) return 'kedaluwarsa'
  return s
}

export const JENJANG_PRA: Jenjang[] = ['smp', 'sma', 'smk']

export function isJenjangPra(v: unknown): v is Jenjang {
  return typeof v === 'string' && (JENJANG_PRA as string[]).includes(v)
}

export function labelAsalSekolah(jenjang: Jenjang | '' | null | undefined): string {
  if (jenjang === 'smp') return 'Asal Sekolah (SD/MI)'
  if (jenjang === 'sma' || jenjang === 'smk') return 'Asal Sekolah (SMP/MTs)'
  return 'Asal Sekolah'
}

export function contohAsalSekolah(jenjang: Jenjang | '' | null | undefined): string {
  return jenjang === 'smp' ? 'Contoh: SDN Beji 1 Depok' : 'Contoh: SMPN 1 Depok'
}

// --- Tanggal (selalu zona WIB, apa pun zona waktu server/peramban) -----------

const ZONA = 'Asia/Jakarta'
const OFFSET_WIB_MS = 7 * 60 * 60 * 1000
const SEHARI_MS = 24 * 60 * 60 * 1000

export function tanggalWib(d: Date | string, denganJam = false): string {
  const t = new Date(d)
  const tgl = t.toLocaleDateString('id-ID', { timeZone: ZONA, day: '2-digit', month: 'long', year: 'numeric' })
  if (!denganJam) return tgl
  const jam = t.toLocaleTimeString('id-ID', { timeZone: ZONA, hour: '2-digit', minute: '2-digit' })
  return `${tgl}, ${jam} WIB`
}

/** "01 Okt 2026" — untuk kolom tabel yang sempit. */
export function tanggalSingkatWib(d: Date | string): string {
  return new Date(d).toLocaleDateString('id-ID', { timeZone: ZONA, day: '2-digit', month: 'short', year: 'numeric' })
}

export function jamWib(d: Date | string): string {
  return `${new Date(d).toLocaleTimeString('id-ID', { timeZone: ZONA, hour: '2-digit', minute: '2-digit' })} WIB`
}

function indeksHariWib(d: Date | string): number {
  return Math.floor((new Date(d).getTime() + OFFSET_WIB_MS) / SEHARI_MS)
}

/** Selisih hari kalender WIB sampai batas; 0 = hari terakhir, negatif = sudah lewat. */
export function sisaHari(batasKedatangan: Date | string, sekarang = new Date()): number {
  return indeksHariWib(batasKedatangan) - indeksHariWib(sekarang)
}

export function teksSisaHari(batasKedatangan: Date | string, sekarang = new Date()): string {
  if (new Date(batasKedatangan).getTime() < sekarang.getTime()) return 'Lewat batas'
  const sisa = sisaHari(batasKedatangan, sekarang)
  if (sisa <= 0) return 'Hari terakhir'
  return `Sisa ${sisa} hari`
}

// --- Nomor HP --------------------------------------------------------------

/** "+62 812-3456-7890" / "62812…" / "0812…" -> "081234567890"; null bila bukan nomor seluler Indonesia. */
export function normalisasiNoHp(nilai: unknown): string | null {
  if (typeof nilai !== 'string') return null
  let digit = nilai.trim().replace(/[\s().-]/g, '')
  if (digit.startsWith('+')) digit = digit.slice(1)
  if (!/^\d+$/.test(digit)) return null
  if (digit.startsWith('62')) digit = '0' + digit.slice(2)
  else if (digit.startsWith('8')) digit = '0' + digit
  return /^08[1-9]\d{7,10}$/.test(digit) ? digit : null
}

export function formatNoHp(no: string): string {
  const d = no.replace(/\D/g, '')
  return [d.slice(0, 4), d.slice(4, 8), d.slice(8)].filter(Boolean).join('-')
}

/** Format wa.me (62…) dari nomor yang sudah dinormalisasi. */
export function noWhatsApp(no: string): string {
  const d = no.replace(/\D/g, '')
  return d.startsWith('0') ? '62' + d.slice(1) : d
}

// --- Validasi & sanitasi ----------------------------------------------------

export const BATAS_PANJANG = {
  namaLengkap: 100,
  asalSekolah: 120,
  alamat: 300,
  email: 120,
  noHp: 20,
} as const

export type InputPra = {
  jenjang: string
  namaLengkap: string
  asalSekolah: string
  alamat: string
  noHp: string
  email: string
}

export type DataPra = Omit<InputPra, 'jenjang'> & { jenjang: Jenjang }

export type GalatPra = Partial<Record<keyof InputPra, string>>

function tersembunyi(cp: number): boolean {
  return cp <= 0x1f || (cp >= 0x7f && cp <= 0x9f) || (cp >= 0x200b && cp <= 0x200f) || cp === 0x2028 || cp === 0x2029 || cp === 0xfeff
}

/** Buang karakter kendali/tak terlihat, tanda kurung sudut, dan spasi berlebih; potong ke panjang maksimum. */
export function bersihkanTeks(nilai: unknown, maks: number): string {
  if (typeof nilai !== 'string') return ''
  let teks = ''
  for (const ch of nilai.normalize('NFKC')) teks += tersembunyi(ch.codePointAt(0)!) ? ' ' : ch
  return teks
    .replace(/[<>]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maks)
}

const POLA_NAMA = /^[\p{L}\p{M}][\p{L}\p{M} .,'’-]*$/u
const POLA_SEKOLAH = /^[\p{L}\p{M}\p{N} .,'’()\/&-]+$/u
const POLA_EMAIL = /^[a-z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)*\.[a-z]{2,24}$/

function jumlahHuruf(s: string): number {
  return (s.match(/\p{L}/gu) || []).length
}

export function validasiPraPendaftaran(
  input: Partial<Record<keyof InputPra, unknown>>,
): { ok: true; data: DataPra } | { ok: false; galat: GalatPra } {
  const galat: GalatPra = {}

  const jenjang = typeof input.jenjang === 'string' ? input.jenjang.trim().toLowerCase() : ''
  if (!isJenjangPra(jenjang)) galat.jenjang = 'Pilih jenjang sekolah yang dituju.'

  const namaLengkap = bersihkanTeks(input.namaLengkap, BATAS_PANJANG.namaLengkap)
  if (!namaLengkap) galat.namaLengkap = 'Nama lengkap wajib diisi.'
  else if (namaLengkap.length < 3 || jumlahHuruf(namaLengkap) < 2) galat.namaLengkap = 'Nama lengkap terlalu pendek.'
  else if (!POLA_NAMA.test(namaLengkap)) galat.namaLengkap = 'Nama hanya boleh berisi huruf, spasi, titik, koma, apostrof, atau tanda hubung.'

  const asalSekolah = bersihkanTeks(input.asalSekolah, BATAS_PANJANG.asalSekolah)
  if (!asalSekolah) galat.asalSekolah = 'Asal sekolah wajib diisi.'
  else if (asalSekolah.length < 3 || jumlahHuruf(asalSekolah) < 2) galat.asalSekolah = 'Tulis nama sekolah dengan lengkap.'
  else if (!POLA_SEKOLAH.test(asalSekolah)) galat.asalSekolah = 'Nama sekolah berisi karakter yang tidak diizinkan.'

  const alamat = bersihkanTeks(input.alamat, BATAS_PANJANG.alamat)
  if (!alamat) galat.alamat = 'Alamat wajib diisi.'
  else if (alamat.length < 10 || jumlahHuruf(alamat) < 5) galat.alamat = 'Tulis alamat dengan lengkap (jalan, RT/RW, kelurahan, kota).'

  const noHpMentah = bersihkanTeks(input.noHp, BATAS_PANJANG.noHp)
  const noHp = normalisasiNoHp(noHpMentah)
  if (!noHpMentah) galat.noHp = 'Nomor HP/WhatsApp wajib diisi.'
  else if (!noHp) galat.noHp = 'Gunakan nomor HP Indonesia yang aktif, contoh 081234567890.'

  const email = bersihkanTeks(input.email, BATAS_PANJANG.email).toLowerCase()
  if (!email) galat.email = 'Email wajib diisi.'
  else if (!POLA_EMAIL.test(email)) galat.email = 'Format email belum benar, contoh nama@gmail.com.'

  if (Object.keys(galat).length > 0) return { ok: false, galat }
  return {
    ok: true,
    data: { jenjang: jenjang as Jenjang, namaLengkap, asalSekolah, alamat, noHp: noHp as string, email },
  }
}

/** Butir "Petunjuk Kedatangan" — dipakai bersama PDF dan pratinjau bukti agar isinya selalu sama. */
export function butirPetunjuk(batasKedatangan: Date | string): string[] {
  return [
    'Silakan datang ke sekolah dengan membawa Bukti Pra-Pendaftaran beserta seluruh dokumen yang dipersyaratkan untuk melanjutkan proses pendaftaran.',
    `Datang paling lambat ${tanggalWib(batasKedatangan)}. Lewat dari tanggal tersebut, pra-pendaftaran otomatis kedaluwarsa dan tidak dapat diproses.`,
    'Tunjukkan bukti ini, dicetak atau dari layar ponsel, kepada petugas SPMB di sekolah.',
    'Jam buka Citra Negara: Senin – Jumat, 07:00 – 15:30 · Sabtu, 07:00 – 13:00.',
    `Lokasi: Gedung C, Front Office Citra Negara, ${YAYASAN_INFO.alamat}. Informasi: ${YAYASAN_INFO.telp} (WhatsApp) · ${YAYASAN_INFO.email}.`,
  ]
}

/** "Bukti-Pra-Pendaftaran-PRA-0001-SMK-2027-2028-A7K9.pdf" */
export function namaBerkasBukti(noPraPendaftaran: string): string {
  return `Bukti-Pra-Pendaftaran-${noPraPendaftaran.replace(/[^A-Za-z0-9-]+/g, '-')}.pdf`
}
