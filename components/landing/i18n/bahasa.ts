// Daftar bahasa landing page SPMB beserta pemformat angka & tanggalnya.
//
// Modul MURNI — tanpa 'use client' — supaya bisa dipakai halaman server
// (membaca kuki bahasa sebelum merender) maupun komponen client. Terjemahan
// HANYA berlaku di landing page /spmb: pra-pendaftaran, formulir, portal, dan
// admin tetap berbahasa Indonesia.

import { formatRupiah } from '@/lib/pembayaran-utils'

export type Bahasa = 'id' | 'en' | 'ja' | 'tr' | 'de' | 'ko'

export type InfoBahasa = {
  kode: Bahasa
  /** Nama bahasa dalam bahasanya sendiri — begitulah pengunjung mencarinya. */
  nama: string
  /** Kode singkat di tombol bahasa navbar. */
  singkat: string
  /** Locale untuk Intl (tanggal & mata uang). */
  locale: string
  /** Mata uang negara asal bahasa ini (sesuai benderanya) — biaya di landing
   *  page dikonversi dari rupiah ke mata uang ini. */
  mataUang: string
}

/** Urutan bendera di huruf "o" (searah jarum jam dari atas). */
export const DAFTAR_BAHASA: InfoBahasa[] = [
  { kode: 'id', nama: 'Indonesia', singkat: 'ID', locale: 'id-ID', mataUang: 'IDR' },
  { kode: 'en', nama: 'English', singkat: 'EN', locale: 'en-GB', mataUang: 'GBP' },
  { kode: 'ja', nama: '日本語', singkat: 'JA', locale: 'ja-JP', mataUang: 'JPY' },
  { kode: 'tr', nama: 'Türkçe', singkat: 'TR', locale: 'tr-TR', mataUang: 'TRY' },
  { kode: 'de', nama: 'Deutsch', singkat: 'DE', locale: 'de-DE', mataUang: 'EUR' },
  { kode: 'ko', nama: '한국어', singkat: 'KO', locale: 'ko-KR', mataUang: 'KRW' },
]

/**
 * Kurs untuk menampilkan biaya dalam mata uang bahasa pilihan: berapa satuan
 * mata uang itu senilai 1 rupiah (`per.GBP` = 0,000042 → Rp1 = £0,000042),
 * beserta tanggal kursnya ("2026-10-01"). Diambil di server — lihat lib/kurs.ts.
 */
export type Kurs = { tanggal: string; per: Partial<Record<string, number>> }

export const BAHASA_AWAL: Bahasa = 'id'

/** Pilihan bahasa disimpan di kuki (bukan localStorage) supaya server sudah
 *  merender bahasa yang benar sejak HTML pertama — tanpa kedip. */
export const KUKI_BAHASA = 'spmb-bahasa'

export function bacaBahasa(nilai: string | null | undefined): Bahasa {
  return DAFTAR_BAHASA.some(b => b.kode === nilai) ? (nilai as Bahasa) : BAHASA_AWAL
}

export function infoBahasa(kode: Bahasa): InfoBahasa {
  return DAFTAR_BAHASA.find(b => b.kode === kode) ?? DAFTAR_BAHASA[0]
}

/** Ada kurs untuk mata uang bahasa `b` — biaya ditampilkan hasil konversinya. */
export function bisaKonversi(b: Bahasa, kurs?: Kurs | null): boolean {
  return b !== 'id' && !!kurs?.per[infoBahasa(b).mataUang]
}

/**
 * Nominal biaya (dalam rupiah) untuk bahasa `b`.
 *
 * Bahasa Indonesia tetap rupiah dengan format lama ("Rp3.500.000"). Bahasa
 * lain dikonversi ke mata uang negaranya ("£147", "¥30,800", "173 €") dan
 * dibulatkan ke 3 angka penting — ini taksiran, pembayarannya tetap rupiah.
 * Tanpa kurs, tetap rupiah dengan pengelompokan angka setempat supaya titik
 * ribuan tidak terbaca sebagai desimal ("Rp 3,500,000").
 */
export function formatUang(n: number, b: Bahasa, kurs?: Kurs | null): string {
  if (b === 'id') return formatRupiah(n)
  const { locale, mataUang } = infoBahasa(b)
  const per = kurs?.per[mataUang]
  if (per) {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: mataUang,
      currencyDisplay: 'narrowSymbol',
      maximumSignificantDigits: 3,
    }).format(n * per)
  }
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: 'IDR',
    currencyDisplay: 'narrowSymbol',
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
  }).format(n)
}

/** "12 Jan 2026" menurut bahasa aktif. */
export function formatTanggal(iso: string | null, b: Bahasa): string | null {
  if (!iso) return null
  return new Date(iso).toLocaleDateString(infoBahasa(b).locale, {
    day: 'numeric', month: 'short', year: 'numeric',
  })
}
