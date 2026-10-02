import type { ReactNode } from 'react'

const NAMA = 'Citra Negara'

/**
 * Menandai "Citra Negara" di dalam teks terjemahan sebagai bahasa Indonesia
 * (lang="id"). Nama diri tidak boleh ikut aturan huruf kapital bahasa aktif:
 * di bahasa Turki, text-transform: uppercase mengubah "Citra" menjadi
 * "CİTRA" (i bertitik).
 */
export function tandaiNama(teks: string): ReactNode {
  const bagian = teks.split(NAMA)
  if (bagian.length === 1) return teks
  return bagian.flatMap((b, i) => (i === 0 ? [b] : [<span key={i} lang="id">{NAMA}</span>, b]))
}
