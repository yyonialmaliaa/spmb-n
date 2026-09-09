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
