'use client'

import {
  createContext, useContext, useEffect, useRef, useState, type ReactNode,
} from 'react'
import { useReducedMotion } from 'framer-motion'

// ---------------------------------------------------------------------------
// Penggerak sumbu utama halaman.
//
// Di layar lebar, SELURUH halaman bergerak MENDATAR: roda mouse ke bawah
// memajukan cerita ke kanan. Di ponsel dan ketika pengguna meminta gerak
// dikurangi, halaman kembali menurun seperti biasa — memaksa gulir mendatar
// di layar sentuh justru membuat halaman sulit dipakai.
//
// Cara kerjanya memakai gulir asli browser, bukan membajak roda mouse:
//
//   pembungkus : tinggi = 100vh + panjang jalur  (menyediakan ruang gulir)
//   panggung   : position sticky, tinggi 100vh   (yang terpaku di layar)
//   jalur      : deretan bab, digeser translateX mengikuti posisi gulir
//
// Karena gulirnya tetap gulir asli, papan ketik, bilah gulir, "Home/End",
// dan penggulir halus bawaan sistem semuanya tetap bekerja. Membajak event
// wheel akan mematikan semua itu.
// ---------------------------------------------------------------------------

export type Arah = 'menurun' | 'mendatar'

const KonteksArah = createContext<Arah>('menurun')

/**
 * Arah sumbu utama halaman saat ini.
 *
 * Dipakai komponen di dalamnya untuk MEMBALIK arahnya sendiri: deretan yang
 * tadinya mendatar (jenjang, program keahlian, alur) berubah menjadi menurun
 * ketika halaman induknya sudah mendatar — supaya tidak ada dua gulir
 * mendatar bersarang yang saling berebut.
 */
export function useArah(): Arah {
  return useContext(KonteksArah)
}

/** Ambang lebar layar yang dianggap cukup untuk pengalaman mendatar. */
const AMBANG_LEBAR = 1024

export function JalurMendatar({
  children,
  lapisan,
}: {
  children: ReactNode
  /**
   * Elemen yang harus MENGAMBANG di atas layar (penanda kemajuan, dsb).
   *
   * Sengaja punya slot sendiri di luar jalur: elemen `position: fixed` yang
   * berada di dalam elemen ber-`transform` akan menempel pada elemen itu,
   * bukan pada layar — sehingga ia ikut bergeser ke samping. Ditaruh di sini,
   * ia tetap berada di dalam Provider (jadi tahu arah sumbunya) tapi di luar
   * jalur yang digeser.
   */
  lapisan?: ReactNode
}) {
  const jalur = useRef<HTMLDivElement | null>(null)
  const kurangiGerak = useReducedMotion()

  const [mendatar, setMendatar] = useState(false)
  const [panjang, setPanjang] = useState(0)

  useEffect(() => {
    const rel = jalur.current
    if (!rel) return

    let jarak = 0
    let rafId = 0
    let kini = 0
    let tujuan = 0

    // Posisinya tidak dipetakan 1:1 ke gulir, melainkan MENGEJAR sasaran
    // sedikit demi sedikit tiap bingkai. Selisih 14% per bingkai cukup untuk
    // menghaluskan hentakan roda mouse (yang bergerak melompat 100-an piksel
    // sekaligus) tanpa membuat halaman terasa melayang atau tertinggal.
    const KEJAR = 0.14

    const lukis = () => {
      rel.style.transform = `translate3d(${-kini}px, 0, 0)`
    }

    const gerak = () => {
      const beda = tujuan - kini
      if (Math.abs(beda) < 0.15) {
        kini = tujuan
        rafId = 0
        lukis()
        return
      }
      kini += beda * KEJAR
      lukis()
      rafId = requestAnimationFrame(gerak)
    }

    const jadwalkan = () => {
      if (jarak <= 0) return
      tujuan = Math.min(Math.max(window.scrollY, 0), jarak)
      if (!rafId) rafId = requestAnimationFrame(gerak)
    }

    const ukur = () => {
      const boleh = window.innerWidth >= AMBANG_LEBAR && !kurangiGerak
      setMendatar(boleh)

      if (!boleh) {
        jarak = 0
        kini = tujuan = 0
        setPanjang(0)
        rel.style.transform = ''
        return
      }
      jarak = Math.max(0, rel.scrollWidth - window.innerWidth)
      setPanjang(jarak)
      // Saat mengukur ulang, posisinya diselaraskan seketika — bukan dikejar,
      // supaya perubahan ukuran jendela tidak terlihat seperti tergelincir.
      kini = tujuan = Math.min(Math.max(window.scrollY, 0), jarak)
      lukis()
    }

    ukur()

    const ro = new ResizeObserver(ukur)
    ro.observe(rel)
    window.addEventListener('resize', ukur)
    window.addEventListener('scroll', jadwalkan, { passive: true })

    // Tautan "#bagian" di navigasi tidak bisa mengandalkan scrollIntoView saat
    // halaman mendatar: SEMUA bab berada pada ketinggian yang sama, jadi
    // browser menganggapnya sudah terlihat dan tidak bergerak ke mana-mana.
    // Karena translateX = -scrollY, sebuah elemen yang berjarak X dari awal
    // jalur akan tepat berada di tepi kiri layar ketika scrollY = X.
    const keBagian = (e: MouseEvent) => {
      if (jarak <= 0) return
      const target = e.target as HTMLElement | null
      const tautan = target?.closest?.('a[href^="#"]') as HTMLAnchorElement | null
      if (!tautan) return
      const id = tautan.getAttribute('href')?.slice(1)
      if (!id) return
      const tujuan = document.getElementById(id)
      if (!tujuan) return

      e.preventDefault()
      const geser = tujuan.getBoundingClientRect().left - rel.getBoundingClientRect().left
      window.scrollTo({ top: Math.min(Math.max(geser, 0), jarak), behavior: 'smooth' })
    }
    document.addEventListener('click', keBagian)

    return () => {
      if (rafId) cancelAnimationFrame(rafId)
      ro.disconnect()
      window.removeEventListener('resize', ukur)
      window.removeEventListener('scroll', jadwalkan)
      document.removeEventListener('click', keBagian)
    }
  }, [kurangiGerak])

  return (
    <KonteksArah.Provider value={mendatar ? 'mendatar' : 'menurun'}>
      <>
        {lapisan}
        <div
          className={mendatar ? 'lp-jalur-bungkus' : undefined}
          style={mendatar ? { height: `calc(100svh + ${panjang}px)` } : undefined}
        >
          <div className={mendatar ? 'lp-panggung' : undefined}>
            <div ref={jalur} className={mendatar ? 'lp-jalur' : undefined}>
              {children}
            </div>
          </div>
        </div>
      </>
    </KonteksArah.Provider>
  )
}

/**
 * Satu bab cerita.
 *
 * Mendatar : selebar layar penuh, setinggi layar penuh.
 * Menurun  : blok biasa tanpa perlakuan khusus.
 *
 * Bab tidak mengurus warna sama sekali. Seluruh halaman memakai SATU latar
 * yang mengikuti tema: putih penuh di mode terang, hijau tua Citra Negara di
 * mode gelap. Karena hanya ada satu warna, tidak ada sambungan antar bab yang
 * perlu dijembatani — halaman ini memang satu bidang utuh.
 */
export function Bab({
  children,
  lebar = false,
  id,
  tinggi = false,
}: {
  children: ReactNode
  /** Bab yang butuh ruang lebih dari satu layar (mis. deretan bergambar). */
  lebar?: boolean
  id?: string
  /** Izinkan isinya lebih tinggi dari layar dan bergulir menurun sendiri. */
  tinggi?: boolean
}) {
  const arah = useArah()
  const mendatar = arah === 'mendatar'

  const kelas = [
    mendatar ? 'lp-bab' : 'lp-bab-tegak',
    mendatar && lebar ? 'lp-bab--lebar' : '',
    tinggi ? 'lp-bab--tinggi' : '',
  ].filter(Boolean).join(' ')

  return <div id={id} className={kelas}>{children}</div>
}
