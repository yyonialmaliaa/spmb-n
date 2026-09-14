// Pemformat tanggal untuk landing page.
//
// Modul MURNI — tanpa 'use client' dan tanpa prisma — supaya bisa dipakai
// server component maupun client component. Sebelumnya fungsi ini tinggal di
// dalam komponen client, sehingga halaman server yang memanggilnya langsung
// gagal dengan "Attempted to call tanggalPendek() from the server".

/** "12 Jan 2026". Mengembalikan null untuk tanggal kosong. */
export function tanggalPendek(iso: string | null): string | null {
  if (!iso) return null
  return new Date(iso).toLocaleDateString('id-ID', {
    day: 'numeric', month: 'short', year: 'numeric',
  })
}

/** "12 Jan 2026 — 31 Mar 2026", atau kalimat pengganti bila tanggal belum diisi. */
export function rentangTanggal(mulai: string | null, selesai: string | null): string {
  const a = tanggalPendek(mulai)
  const b = tanggalPendek(selesai)
  if (a && b) return `${a} — ${b}`
  if (a) return `Mulai ${a}`
  if (b) return `Sampai ${b}`
  return 'Jadwal menyusul'
}

/** WIB tidak mengenal DST, jadi selalu tetap +7 jam dari UTC. */
const OFFSET_WIB_MS = 7 * 60 * 60 * 1000

/**
 * Rentang [mulai, selesai) yang mewakili "00:00:00 WIB hari ini" sampai
 * "00:00:00 WIB besok", sebagai instan UTC — dipakai untuk statistik
 * "Hari Ini" (Dashboard, lihat lib/pendaftarQuery.ts).
 *
 * SENGAJA tidak memakai `new Date().setHours(0,0,0,0)` — itu mengikuti zona
 * waktu tempat proses Node berjalan, yang di server produksi (mis. Vercel)
 * lazimnya UTC, BUKAN WIB. Kalau dibiarkan begitu, "hari ini" baru berganti
 * jam 07:00 pagi WIB, bukan tengah malam — pendaftar/pembayaran dini hari
 * akan salah terhitung masuk hari sebelumnya. Fungsi ini menghitung batas
 * hari secara eksplisit di zona Jakarta, terlepas dari zona waktu server.
 */
export function rentangHariIniWib(sekarang: Date = new Date()): { mulai: Date; selesai: Date } {
  const digeser = new Date(sekarang.getTime() + OFFSET_WIB_MS)
  const tengahMalamWibDalamUtc =
    Date.UTC(digeser.getUTCFullYear(), digeser.getUTCMonth(), digeser.getUTCDate(), 0, 0, 0) - OFFSET_WIB_MS
  const mulai = new Date(tengahMalamWibDalamUtc)
  const selesai = new Date(tengahMalamWibDalamUtc + 24 * 60 * 60 * 1000)
  return { mulai, selesai }
}
