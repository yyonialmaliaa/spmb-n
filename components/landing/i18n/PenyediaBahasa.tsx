'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { flushSync } from 'react-dom'
import { BAHASA_AWAL, KUKI_BAHASA, bacaBahasa, type Bahasa } from './bahasa'
import { KAMUS, type Kamus } from './kamus'

type NilaiBahasa = {
  bahasa: Bahasa
  t: Kamus
  /** false di halaman yang tidak diterjemahkan (mis. detail jenjang): teksnya
   *  tetap bahasa Indonesia dan pemilih bahasa tidak ditampilkan. */
  aktif: boolean
  ganti: (b: Bahasa) => void
}

const KonteksBahasa = createContext<NilaiBahasa | null>(null)

const BAWAAN: NilaiBahasa = { bahasa: BAHASA_AWAL, t: KAMUS[BAHASA_AWAL], aktif: false, ganti: () => {} }

/** Bahasa landing page yang sedang aktif beserta kamusnya. */
export function useBahasa(): NilaiBahasa {
  return useContext(KonteksBahasa) ?? BAWAAN
}

function bacaKuki(): Bahasa | null {
  const m = document.cookie.match(new RegExp(`(?:^|; )${KUKI_BAHASA}=([^;]*)`))
  return m ? bacaBahasa(decodeURIComponent(m[1])) : null
}

/**
 * Pembungkus landing page: menyediakan bahasa aktif dan merender .lp-root
 * dengan atribut `lang` yang sesuai (pemilihan font CJK, huruf kapital
 * Turki, pemenggalan kata Jerman, dan pembaca layar bergantung padanya).
 *
 * `awal` dibaca server dari kuki, jadi HTML pertama sudah dalam bahasa
 * pilihan pengunjung. Mengganti bahasa tidak memuat ulang halaman: teks
 * bertukar di tempat dengan transisi silang-pudar (View Transitions), dan
 * pilihannya disimpan di kuki untuk kunjungan berikutnya.
 */
export function PenyediaBahasa({
  awal,
  className,
  children,
}: {
  awal: Bahasa
  className?: string
  children: ReactNode
}) {
  // Kuki tetap dibaca di browser: kembali lewat tombol Back bisa memakai
  // halaman simpanan router yang dirender dengan bahasa lama. Saat hydration
  // isinya sama dengan `awal` (server membaca kuki yang sama), jadi tidak ada
  // ketidakcocokan.
  const [bahasa, setBahasa] = useState<Bahasa>(() =>
    typeof document === 'undefined' ? awal : (bacaKuki() ?? awal),
  )
  const t = KAMUS[bahasa]

  useEffect(() => {
    document.title = t.meta.judul
  }, [t])

  const ganti = useCallback((b: Bahasa) => {
    document.cookie = `${KUKI_BAHASA}=${b}; path=/spmb; max-age=31536000; SameSite=Lax`
    const terapkan = () => setBahasa(b)
    if (!('startViewTransition' in document) || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      terapkan()
      return
    }
    // flushSync: DOM harus sudah berganti bahasa saat callback selesai,
    // supaya browser memotret keadaan "sesudah" yang benar.
    document.startViewTransition(() => flushSync(terapkan))
  }, [])

  const nilai = useMemo(() => ({ bahasa, t, aktif: true, ganti }), [bahasa, t, ganti])

  return (
    <KonteksBahasa.Provider value={nilai}>
      <div className={className} lang={bahasa}>
        {children}
      </div>
    </KonteksBahasa.Provider>
  )
}
