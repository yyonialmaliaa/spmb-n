import 'server-only'
import { unstable_cache } from 'next/cache'
import type { Kurs } from '@/components/landing/i18n/bahasa'

// ---------------------------------------------------------------------------
// Kurs rupiah untuk landing page /spmb: biaya ditampilkan dalam mata uang
// bahasa pilihan pengunjung (GBP, JPY, TRY, EUR, KRW — lihat DAFTAR_BAHASA).
// HANYA dipakai landing page; halaman lain tetap rupiah.
//
// Sumbernya kurs acuan Bank Sentral Eropa (ECB) lewat Frankfurter — gratis,
// tanpa kunci API. ECB memperbaruinya sekali tiap hari kerja, jadi cukup
// diambil ulang tiap 6 jam. Halaman landing `force-dynamic` (fetch-nya tidak
// pernah di-cache), karena itu hasilnya disimpan lewat unstable_cache.
//
// Diminta berbasis EUR (angka asli ECB, presisi penuh) lalu dihitung silang
// ke rupiah; basis IDR langsung hanya memberi dua angka penting.
// ---------------------------------------------------------------------------

const MATA_UANG = ['GBP', 'JPY', 'TRY', 'KRW'] as const

/** Cadangan bila sumber kurs tidak bisa dihubungi: kurs ECB 1 Oktober 2026
 *  (satuan per 1 euro). */
const CADANGAN = {
  tanggal: '2026-10-01',
  perEuro: { IDR: 20274.71, GBP: 0.85373, JPY: 178.49, TRY: 55.3993, KRW: 1537.96 } as Record<string, number>,
}

function keRupiah(tanggal: string, perEuro: Record<string, number>): Kurs {
  const idr = perEuro.IDR
  const per: Kurs['per'] = { EUR: 1 / idr }
  for (const m of MATA_UANG) if (perEuro[m]) per[m] = perEuro[m] / idr
  return { tanggal, per }
}

const ambil = unstable_cache(
  async (): Promise<Kurs> => {
    const res = await fetch(
      `https://api.frankfurter.dev/v1/latest?base=EUR&symbols=IDR,${MATA_UANG.join(',')}`,
      { signal: AbortSignal.timeout(4000) },
    )
    if (!res.ok) throw new Error(`Kurs: HTTP ${res.status}`)
    const data = (await res.json()) as { date?: string; rates?: Record<string, number> }
    if (!data.date || !data.rates?.IDR) throw new Error('Kurs: data tidak lengkap')
    return keRupiah(data.date, data.rates)
  },
  ['kurs-landing-idr'],
  { revalidate: 21600 },
)

/** Kapan terakhir sumber kurs gagal dihubungi (ms). */
let gagalTerakhir = 0

/**
 * Kurs terbaru. Bila sumbernya gagal, kurs cadangan yang dipakai, dan selama
 * 10 menit berikutnya tidak dicoba lagi — supaya halaman tidak menunggu batas
 * waktu permintaan di setiap kunjungan.
 */
export async function getKurs(): Promise<Kurs> {
  if (Date.now() - gagalTerakhir > 10 * 60_000) {
    try {
      return await ambil()
    } catch (err) {
      gagalTerakhir = Date.now()
      console.error('Kurs landing gagal diambil, memakai kurs cadangan:', err)
    }
  }
  return keRupiah(CADANGAN.tanggal, CADANGAN.perEuro)
}
