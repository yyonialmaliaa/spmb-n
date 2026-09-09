'use client'

import { useEffect, useRef, useState, type ReactNode } from 'react'
import { motion, useMotionValue, useReducedMotion, useSpring } from 'framer-motion'
import { useArah } from './JalurMendatar'

// ---------------------------------------------------------------------------
// Primitif gerak untuk landing page.
//
// Dipakai bersama oleh seluruh section supaya "bahasa gerak" halaman ini
// konsisten: satu durasi, satu easing, satu cara menyingkap.
//
// Catatan pustaka: proyek ini sudah memuat framer-motion, sedangkan GSAP
// belum. Pola sticky + translateX yang dijelaskan di spesifikasi (pin +
// scrub) dikerjakan di sini dengan motion value framer-motion yang digerakkan
// perhitungan posisi sendiri — hasil interaksinya sama persis, tanpa menambah
// dependensi baru.
// ---------------------------------------------------------------------------

/**
 * Menyalakan kelas `is-tampak` ketika elemen masuk layar.
 *
 * IntersectionObserver, bukan listener scroll: browser yang menghitung, jadi
 * tidak ada pekerjaan per-frame di thread utama.
 */
export function useTampak<T extends HTMLElement>(ambang = 0.18) {
  const ref = useRef<T | null>(null)
  const [tampak, setTampak] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    // Sekali tampak, biarkan tampak: konten tidak boleh menghilang lagi saat
    // pengguna menggulir balik.
    const io = new IntersectionObserver(
      entri => { if (entri[0].isIntersecting) { setTampak(true); io.disconnect() } },
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

/**
 * Lorong horizontal: gulir vertikal diubah jadi gerak mendatar.
 *
 *   pembungkus : tinggi = 100vh + jarak geser  (memberi ruang gulir)
 *   layar      : position sticky, tinggi 100vh (yang "dipaku" di layar)
 *   rel        : digeser translateX mengikuti progres gulir pembungkus
 *
 * Dua hal yang membuat versi ini kokoh:
 *
 * 1. STRUKTUR DOM DAN REF TIDAK PERNAH BERGANTI. Versi sebelumnya melakukan
 *    early-return ke tampilan sentuh sebelum ref sempat terpasang, sehingga
 *    useScroll menerima ref kosong ("Target ref is defined but not hydrated")
 *    dan ResizeObserver mengukur elemen yang keburu dilepas — jarak gesernya
 *    tidak pernah terisi dan lorongnya diam. Kini kedua mode memakai kerangka
 *    yang sama; hanya gaya dan penggeraknya yang berbeda.
 *
 * 2. POSISI DIHITUNG SENDIRI dari getBoundingClientRect, bukan lewat
 *    useScroll({ target }). Tidak ada lagi ketergantungan pada saat ref
 *    ter-hydrate, dan perhitungannya bisa dibaca langsung di sini.
 *
 * Jarak gesernya DIUKUR dari layout (bukan angka tetap) dan diukur ulang
 * lewat ResizeObserver, sehingga tetap benar ketika jendela berubah ukuran
 * atau font selesai dimuat.
 *
 * Di layar sempit dan ketika pengguna meminta gerak dikurangi, lorong berubah
 * menjadi geser-sentuh biasa dengan scroll-snap — jauh lebih nyaman di ponsel
 * daripada section yang dipaku.
 */
export function Lorong({
  children,
  label,
}: {
  children: ReactNode
  label: string
}) {
  const pembungkus = useRef<HTMLDivElement | null>(null)
  const rel = useRef<HTMLDivElement | null>(null)
  const kurangiGerak = useReducedMotion()
  const arah = useArah()

  // Ketika halaman induk SUDAH bergerak mendatar, deretan ini membalik arah
  // menjadi menurun. Dua gulir mendatar bersarang akan saling berebut roda
  // mouse dan membuat keduanya terasa macet.
  const halamanMendatar = arah === 'mendatar'

  // 'awal' = belum diukur. Render pertama (server & hydrate) selalu memakai
  // tampilan sentuh yang tetap bisa dipakai tanpa JavaScript, sehingga tidak
  // ada ketidakcocokan hydration. Mode sesungguhnya ditetapkan setelah mount.
  const [mode, setMode] = useState<'awal' | 'sentuh' | 'lorong'>('awal')
  const [jarak, setJarak] = useState(0)

  const x = useMotionValue(0)
  // Sedikit diperhalus supaya gerak mendatarnya tidak terasa patah-patah,
  // tanpa membuatnya melayang atau memantul.
  const xHalus = useSpring(x, { stiffness: 420, damping: 46, restDelta: 0.5 })

  useEffect(() => {
    const wrap = pembungkus.current
    const track = rel.current
    if (!wrap || !track) return

    let jarakKini = 0
    let rafId = 0

    const hitung = () => {
      rafId = 0
      if (jarakKini <= 0) { x.set(0); return }
      const kotak = wrap.getBoundingClientRect()
      const totalGulir = kotak.height - window.innerHeight
      if (totalGulir <= 0) { x.set(0); return }
      // Seberapa jauh bagian atas pembungkus sudah melewati puncak layar,
      // dibatasi pada rentang [0, totalGulir].
      const lewat = Math.min(Math.max(-kotak.top, 0), totalGulir)
      x.set(-(lewat / totalGulir) * jarakKini)
    }

    const jadwalkan = () => { if (!rafId) rafId = requestAnimationFrame(hitung) }

    const ukur = () => {
      const sempit = window.innerWidth < 900 || !!kurangiGerak || halamanMendatar
      if (sempit) {
        jarakKini = 0
        setJarak(0)
        setMode('sentuh')
        x.set(0)
        return
      }
      setMode('lorong')
      jarakKini = Math.max(0, track.scrollWidth - window.innerWidth)
      setJarak(jarakKini)
      hitung()
    }

    ukur()

    const ro = new ResizeObserver(ukur)
    ro.observe(track)
    window.addEventListener('resize', ukur)
    window.addEventListener('scroll', jadwalkan, { passive: true })

    return () => {
      if (rafId) cancelAnimationFrame(rafId)
      ro.disconnect()
      window.removeEventListener('resize', ukur)
      window.removeEventListener('scroll', jadwalkan)
    }
  }, [kurangiGerak, halamanMendatar, x])

  const modeLorong = mode === 'lorong' && !halamanMendatar

  // Tiga tampilan dari satu kerangka:
  //   lorong : dipaku di layar, rel digeser mendatar   (halaman menurun, layar lebar)
  //   tumpuk : bertumpuk menurun di dalam bab          (halaman mendatar)
  //   geser  : digeser jari mendatar                   (ponsel)
  const kelasLuar = halamanMendatar ? 'lp-tumpuk' : (modeLorong ? 'lp-lorong-layar' : 'lp-lorong-geser')

  return (
    <div
      ref={pembungkus}
      className={modeLorong ? 'lp-lorong' : undefined}
      style={modeLorong ? { height: `calc(100svh + ${jarak}px)` } : undefined}
      role="region"
      aria-label={label}
    >
      <div className={kelasLuar}>
        <motion.div
          ref={rel}
          className="lp-lorong-rel"
          style={modeLorong ? { x: xHalus } : undefined}
        >
          {children}
        </motion.div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Progres lintasan: seberapa jauh sebuah bagian sudah melintasi layar.
//
// Dipakai untuk animasi yang TERIKAT POSISI GULIR — bukan dipicu hover atau
// klik. Keduanya sadar arah: ketika halaman bergerak mendatar, yang diukur
// perpindahan mendatar; ketika menurun, yang diukur perpindahan menurun.
// ---------------------------------------------------------------------------

function jepit(n: number) { return n < 0 ? 0 : n > 1 ? 1 : n }

function useProgres(
  ref: React.RefObject<HTMLElement | null>,
  ukur: (kotak: DOMRect, mendatar: boolean) => number,
) {
  const arah = useArah()
  const mendatar = arah === 'mendatar'
  const [nilai, setNilai] = useState(0)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    let raf = 0

    // Dibaca ULANG TIAP BINGKAI, bukan cuma saat event 'scroll'.
    //
    // Di mode mendatar, posisi horizontal sesungguhnya digeser JalurMendatar
    // lewat animasi "mengejar" yang berjalan sendiri lewat requestAnimationFrame
    // selama beberapa bingkai SETELAH event scroll berhenti (lihat KEJAR di
    // JalurMendatar.tsx). Kalau progres ini hanya dihitung ulang saat event
    // scroll, ia membaca posisi SESAAT scroll terjadi — sebelum kejarannya
    // selesai — dan tidak pernah diperbarui lagi sampai ada scroll berikutnya.
    // Akibatnya nyata: zoom Hero/Penutup berhenti di tengah jalan, bukan di
    // nilai akhir yang seharusnya (terbukti lewat uji: skala mentok di 1.02,
    // bukan 1.16, pada satu lompatan scroll besar).
    //
    // Polling tiap bingkai membuatnya selalu sinkron dengan transform yang
    // sedang berlaku, baik yang sudah diam maupun yang masih mengejar. Saat
    // nilainya benar-benar diam, setState dengan angka yang identik tidak
    // memicu render ulang (React membandingkan primitif dengan Object.is),
    // jadi tidak ada biaya tambahan ketika halaman tidak sedang digulir.
    const detak = () => {
      setNilai(jepit(ukur(el.getBoundingClientRect(), mendatar)))
      raf = requestAnimationFrame(detak)
    }
    raf = requestAnimationFrame(detak)
    return () => cancelAnimationFrame(raf)
    // `ukur` sengaja tidak jadi dependensi: pemanggil mengirim fungsi literal
    // yang identik tiap render, dan menjadikannya dependensi hanya akan
    // memasang-lepas loop setiap render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mendatar, ref])

  return nilai
}

/**
 * 0 selama bagian masih penuh di layar, 1 ketika sudah sepenuhnya lewat.
 * Untuk animasi "keluar" — mis. hero yang mengecil saat ditinggalkan.
 */
export function useKeluar(ref: React.RefObject<HTMLElement | null>) {
  return useProgres(ref, (k, mendatar) =>
    mendatar ? -k.left / (k.width || 1) : -k.top / (k.height || 1),
  )
}

/**
 * 0 ketika bagian masih di luar layar, 1 ketika sudah memenuhi layar.
 * Untuk animasi "masuk" — mis. gambar penutup yang membesar saat didekati.
 */
export function useMasuk(ref: React.RefObject<HTMLElement | null>) {
  return useProgres(ref, (k, mendatar) =>
    mendatar
      ? (window.innerWidth - k.left) / (window.innerWidth || 1)
      : (window.innerHeight - k.top) / (window.innerHeight || 1),
  )
}

/**
 * 0 selagi bagian masih di puncak layar, 1 setelah tergulir sepenuhnya
 * lewat tepi ATAS — SELALU menurun, tidak ikut berbalik ke mendatar seperti
 * `useKeluar`.
 *
 * Dipakai untuk bab yang isinya bertumpuk MENURUN di dalam dirinya sendiri
 * (bab `tinggi`, mis. penutup yang diikuti footer) — gulir di dalam bab itu
 * selalu vertikal walau cerita di LUARnya sedang berjalan mendatar, jadi
 * mengukurnya lewat sumbu `arah` seperti `useKeluar` akan salah membaca
 * gulir mendatar padahal yang sebenarnya bergerak adalah isinya ke atas.
 */
export function useKeluarBawah(ref: React.RefObject<HTMLElement | null>) {
  return useProgres(ref, k => -k.top / (k.height || 1))
}
