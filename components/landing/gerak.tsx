'use client'

import { useEffect, useRef, useState, type ReactNode } from 'react'

// ---------------------------------------------------------------------------
// Primitif gerak untuk landing page.
//
// Dipakai bersama oleh seluruh section supaya "bahasa gerak" halaman ini
// konsisten: satu durasi, satu easing, satu cara menyingkap. Halaman ini
// seluruhnya bergulir MENURUN — tidak ada bagian yang bergeser ke samping.
// ---------------------------------------------------------------------------

/**
 * Menyalakan/mematikan kelas `is-tampak` mengikuti apakah elemen sedang di
 * layar.
 *
 * Bolak-balik dengan sengaja: begitu elemen digulir keluar layar, kelasnya
 * dicopot lagi supaya animasi masuknya bisa terulang saat digulir balik ke
 * situ (sama seperti gulir maju) — bukan cuma sekali muncul lalu diam
 * selamanya. IntersectionObserver, bukan listener scroll: browser yang
 * menghitung, jadi tidak ada pekerjaan per-frame di thread utama.
 */
export function useTampak<T extends HTMLElement>(ambang = 0.18) {
  const ref = useRef<T | null>(null)
  const [tampak, setTampak] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(
      entri => setTampak(entri[0].isIntersecting),
      { threshold: ambang, rootMargin: '0px 0px -8% 0px' },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [ambang])

  return { ref, tampak }
}

/** Blok yang naik perlahan sambil memudar masuk. */
export function Muncul({
  children,
  jeda = 0,
  as: Tag = 'div',
  className = '',
  ...sisa
}: {
  children: ReactNode
  jeda?: number
  as?: 'div' | 'section' | 'article' | 'li' | 'header'
  className?: string
} & React.HTMLAttributes<HTMLElement>) {
  const { ref, tampak } = useTampak<HTMLDivElement>()
  return (
    <Tag
      ref={ref as React.Ref<never>}
      className={`lp-muncul ${tampak ? 'is-tampak' : ''} ${className}`}
      style={{ transitionDelay: `${jeda}s`, ...(sisa.style || {}) }}
      {...sisa}
    >
      {children}
    </Tag>
  )
}

/** Gambar yang tersingkap dari bawah sambil mengecil dari 1.08 ke 1. */
export function Singkap({ children, className = '' }: { children: ReactNode; className?: string }) {
  const { ref, tampak } = useTampak<HTMLDivElement>(0.15)
  return (
    <div ref={ref} className={`lp-singkap ${tampak ? 'is-tampak' : ''} ${className}`}>
      {children}
    </div>
  )
}

/** Judul yang tersingkap baris demi baris. Tiap larik jadi satu baris. */
export function JudulBaris({
  larik,
  className = 'lp-judul-besar',
}: {
  larik: string[]
  className?: string
}) {
  const { ref, tampak } = useTampak<HTMLHeadingElement>(0.25)
  return (
    <h2 ref={ref} className={`${className} ${tampak ? 'is-tampak' : ''}`}>
      {larik.map(baris => (
        <span key={baris} className="lp-baris">
          <span>{baris}</span>
        </span>
      ))}
    </h2>
  )
}

// ---------------------------------------------------------------------------
// Progres lintasan: seberapa jauh sebuah bagian sudah melintasi layar.
//
// Dipakai untuk animasi yang TERIKAT POSISI GULIR — bukan dipicu hover atau
// klik.
// ---------------------------------------------------------------------------

function jepit(n: number) { return n < 0 ? 0 : n > 1 ? 1 : n }

function useProgres(
  ref: React.RefObject<HTMLElement | null>,
  ukur: (kotak: DOMRect) => number,
) {
  const [nilai, setNilai] = useState(0)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    let raf = 0
    const hitung = () => {
      raf = 0
      setNilai(jepit(ukur(el.getBoundingClientRect())))
    }
    const jadwalkan = () => { if (!raf) raf = requestAnimationFrame(hitung) }
    hitung()
    window.addEventListener('scroll', jadwalkan, { passive: true })
    window.addEventListener('resize', jadwalkan)
    return () => {
      if (raf) cancelAnimationFrame(raf)
      window.removeEventListener('scroll', jadwalkan)
      window.removeEventListener('resize', jadwalkan)
    }
    // `ukur` sengaja tidak jadi dependensi: pemanggil mengirim fungsi literal
    // yang identik tiap render, dan menjadikannya dependensi hanya akan
    // memasang-lepas listener setiap render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ref])

  return nilai
}

/**
 * 0 selama bagian masih penuh di layar, 1 ketika sudah sepenuhnya lewat.
 * Untuk animasi "keluar" — mis. hero yang mengecil saat ditinggalkan.
 */
export function useKeluar(ref: React.RefObject<HTMLElement | null>) {
  return useProgres(ref, k => -k.top / (k.height || 1))
}

/**
 * 0 ketika bagian masih di luar layar, 1 ketika sudah memenuhi layar.
 * Untuk animasi "masuk" — mis. gambar penutup yang membesar saat didekati.
 */
export function useMasuk(ref: React.RefObject<HTMLElement | null>) {
  return useProgres(ref, k => (window.innerHeight - k.top) / (window.innerHeight || 1))
}
