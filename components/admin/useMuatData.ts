'use client'

import { useCallback, useEffect, useState } from 'react'

// Pola muat-data yang dipakai seluruh halaman admin: ambil data, tampilkan
// skeleton saat menunggu, tampilkan ErrorState kalau gagal, dan sediakan
// fungsi muat ulang.
//
// Kenapa hook sendiri, bukan useEffect langsung di tiap halaman:
// memanggil setLoading(true) SINKRON di dalam badan useEffect memicu render
// berantai (render -> effect -> render lagi). Di sini penanda "sedang memuat"
// disetel saat RENDER ketika kunci dependensi berubah — pola yang memang
// disarankan React untuk menyesuaikan state terhadap perubahan prop —
// sementara useEffect hanya berisi pemanggilan async-nya.
//
// Sekaligus menangani balapan request: respons dari permintaan lama diabaikan
// kalau dependensinya sudah berganti (mis. admin cepat berpindah tab).

export interface HasilMuat<T> {
  data: T | null
  loading: boolean
  gagal: boolean
  /** Muat ulang manual — dipakai tombol "Coba Lagi" dan setelah mutasi. */
  muatUlang: () => void
  /** Ubah data di memori tanpa request (pembaruan optimistis). */
  setData: React.Dispatch<React.SetStateAction<T | null>>
}

export function useMuatData<T>(
  ambil: (sinyal: AbortSignal) => Promise<T>,
  deps: readonly unknown[],
): HasilMuat<T> {
  const kunci = JSON.stringify(deps)

  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [gagal, setGagal] = useState(false)
  const [ulang, setUlang] = useState(0)

  // Penyesuaian state saat render: begitu dependensi berubah, kembalikan ke
  // kondisi "sedang memuat" sebelum effect-nya jalan, tanpa render tambahan.
  const [kunciLama, setKunciLama] = useState(kunci)
  if (kunci !== kunciLama) {
    setKunciLama(kunci)
    setLoading(true)
    setGagal(false)
  }

  useEffect(() => {
    const ac = new AbortController()
    ambil(ac.signal)
      .then(hasil => {
        if (ac.signal.aborted) return
        setData(hasil)
        setGagal(false)
        setLoading(false)
      })
      .catch(err => {
        // Pembatalan bukan kegagalan — jangan tampilkan ErrorState karenanya.
        if (ac.signal.aborted || (err as Error)?.name === 'AbortError') return
        console.error('Gagal memuat data admin:', err)
        setGagal(true)
        setLoading(false)
      })
    return () => ac.abort()
    // `kunci` sengaja dipakai sebagai pengganti spread deps supaya jumlah
    // dependensi tetap konstan antar render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kunci, ulang])

  const muatUlang = useCallback(() => setUlang(n => n + 1), [])

  return { data, loading, gagal, muatUlang, setData }
}

/** Pembungkus fetch: melempar bila respons bukan 2xx, agar ditangkap useMuatData. */
export async function ambilJson<T>(url: string, sinyal?: AbortSignal): Promise<T> {
  const res = await fetch(url, { signal: sinyal })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json() as Promise<T>
}
