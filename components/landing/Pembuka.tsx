'use client'

import { useEffect, useRef, useState } from 'react'
import { useReducedMotion } from 'framer-motion'

// ---------------------------------------------------------------------------
// Tirai pembuka.
//
// Dua baris — "SPMB" di atas, "CITRA NEGARA" di bawah — naik cepat (seluruh
// baris selesai di bawah satu detik), lalu badan hurufnya sendiri menjadi
// LUBANG yang menembus ke video hero: bukan foto diam yang dipotong
// mengikuti bentuk huruf, tapi video yang benar-benar terlihat di baliknya.
// Garis emas ditarik, lalu tirai terangkat.
//
// Kenapa video, bukan `background-clip: text` seperti sebelumnya: CSS
// background sama sekali tidak bisa menerima elemen <video> sebagai
// sumbernya (hanya gambar/gradien) — jadi trik lama itu mustahil dipakai
// langsung untuk video. Jalan yang benar dan didukung standar adalah
// `mask-image` yang menunjuk ke `<mask>` SVG, lalu mask itu dipasang ke
// elemen <video> yang diletakkan tepat di atas kedua baris. Hasilnya: video
// hanya terlihat di area yang berbentuk huruf — persis "bolong ke videonya"
// yang diminta.
//
// Mask-nya dibangun dari elemen SVG <text> BIASA, BUKAN <foreignObject>
// berisi HTML. Sudah dicoba: <foreignObject> di dalam <mask> yang dirujuk
// lewat CSS mask-image dari elemen HTML biasa terbukti lewat uji browser
// TIDAK PERNAH ikut dilukis sama sekali (mask-nya kosong total, video jadi
// tidak tampak sedikit pun) — beda dengan <foreignObject> yang dipakai
// langsung untuk MENAMPILKAN sesuatu (itu bekerja normal), rupanya jalur
// rasterisasi <mask> di Chromium tidak melewati foreignObject-nya. <text>
// SVG murni tidak punya masalah itu. Supaya bentuk & posisinya tetap
// presisi menempel ke baris aslinya (yang ukurannya sendiri elastis lewat
// clamp()+vw), ukuran font/posisi tiap baris DIUKUR LANGSUNG dari elemen
// aslinya yang sudah dirender (getBoundingClientRect + getComputedStyle),
// bukan ditebak/disalin manual — sehingga tidak bisa meleset walau lebar
// layar berubah.
//
// Baris hurufnya sendiri TETAP diberi warna tinta padat sebagai keadaan
// dasar (langsung terbaca, dan jadi jaring pengaman kalau video gagal
// dimuat atau browser tidak mendukung `mask-image`) — begitu video siap,
// lapisan bertopeng itu memudar masuk MENUTUPI tinta itu di area huruf yang
// sama.
//
// Kenapa tirai ini ikut dirender di SERVER, bukan dimunculkan setelah React
// hidup: kalau ia baru muncul setelah hydration, pengunjung sempat melihat
// hero lebih dulu, tertutup tirai, lalu hero lagi. Judulnya harus jadi hal
// PERTAMA yang terlihat — jadi ia sudah ada di HTML pertama, dan skrip kecil
// di dalamnya menyembunyikannya seketika bila sesi ini sudah pernah
// melihatnya (lihat SKRIP_PEMBUKA di app/layout.tsx). Pola yang sama
// dipakai proyek ini untuk anti-kedip tema.
//
// Konten halaman tetap utuh di HTML sejak awal — ini hanya lapisan di atasnya,
// jadi mesin pencari dan pembaca layar tidak pernah menunggu animasi. Bisa
// dilewati kapan saja: tekan tombol apa pun, klik, gulir, atau tombol
// "Lewati". Pengguna yang meminta gerak dikurangi tidak melihatnya sama
// sekali (diatur di landing.css).
// ---------------------------------------------------------------------------

/** Lama tirai bertahan sebelum terangkat sendiri. */
const DURASI_TAHAN = 2000
/** Lama animasi terangkatnya — harus sama dengan durasi di landing.css. */
const DURASI_ANGKAT = 1100

/** Sama dengan video hero — inilah video yang "terlihat" lewat lubang huruf. */
const VIDEO_PEMBUKA = '/videos/hero.mp4'

/** Id `<mask>` SVG yang membentuk lubang video mengikuti bentuk kedua baris. */
const ID_MASK = 'lp-pembuka-video-mask'

/** Metrik satu baris, diukur langsung dari elemen aslinya yang sudah dirender. */
type MetrikBaris = {
  cx: number
  cy: number
  fontSize: string
  fontWeight: string
  fontFamily: string
  letterSpacing: string
}

/** Memecah kata jadi huruf agar tiap huruf bisa naik dengan jeda sendiri. */
function Huruf({ kata, mulai, langkah }: { kata: string; mulai: number; langkah: number }) {
  return (
    <>
      {Array.from(kata).map((h, i) => (
        <span
          key={`${h}-${i}`}
          // .lp-huruf memakai white-space: pre, jadi spasi biasa tetap terjaga.
          className="lp-huruf"
          style={{ animationDelay: `${mulai + i * langkah}s` }}
        >
          {h}
        </span>
      ))}
    </>
  )
}

export function Pembuka() {
  const ref = useRef<HTMLDivElement | null>(null)
  const teksRef = useRef<HTMLDivElement | null>(null)
  const satuRef = useRef<HTMLSpanElement | null>(null)
  const duaRef = useRef<HTMLSpanElement | null>(null)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const kurangiGerak = useReducedMotion()
  const [pergi, setPergi] = useState(false)
  const [selesai, setSelesai] = useState(false)
  const [videoGagal, setVideoGagal] = useState(false)
  // Default AMAN adalah false: baris tetap tinta padat sampai terbukti
  // browsernya bisa memotong <video> lewat mask SVG. Kalau langsung
  // diasumsikan didukung lalu ternyata tidak, videonya akan tampil sebagai
  // kotak penuh tanpa terpotong sama sekali menutupi seluruh tirai.
  const [dukungMask, setDukungMask] = useState(false)
  // Ukuran nyata (px) dari .lp-pembuka-teks, dipakai sebagai kanvas <svg>
  // tempat <text> mask digambar (koordinatnya harus dalam sistem yang sama).
  const [ukuran, setUkuran] = useState({ w: 0, h: 0 })
  // Metrik tiap baris (pusat + jenis huruf), diukur langsung dari elemen
  // ASLI yang sudah dirender browser — bukan ditebak — supaya <text> di
  // dalam mask presisi menumpuk tepat di atas baris aslinya di segala
  // ukuran layar. null selama belum sempat diukur (server render / belum
  // mount): dipakai untuk MENUNDA render lapisan video supaya tidak pernah
  // sempat tampil tak-bertopeng walau sekejap.
  const [baris, setBaris] = useState<{ satu: MetrikBaris | null; dua: MetrikBaris | null }>({
    satu: null,
    dua: null,
  })

  useEffect(() => {
    try {
      const css = (globalThis as { CSS?: { supports?: (p: string, v: string) => boolean } }).CSS
      setDukungMask(
        !!css?.supports &&
          (css.supports('mask-image', `url(#${ID_MASK})`) ||
            css.supports('-webkit-mask-image', `url(#${ID_MASK})`))
      )
    } catch {
      // Tetap false — jaring pengaman tinta padat yang berlaku.
    }
  }, [])

  useEffect(() => {
    const teks = teksRef.current
    const s1 = satuRef.current
    const s2 = duaRef.current
    if (!teks || !s1 || !s2) return

    const ambil = (el: HTMLElement, rTeks: DOMRect): MetrikBaris => {
      const r = el.getBoundingClientRect()
      const cs = getComputedStyle(el)
      return {
        cx: r.left - rTeks.left + r.width / 2,
        cy: r.top - rTeks.top + r.height / 2,
        fontSize: cs.fontSize,
        fontWeight: cs.fontWeight,
        fontFamily: cs.fontFamily,
        letterSpacing: cs.letterSpacing,
      }
    }
    const ukur = () => {
      const rTeks = teks.getBoundingClientRect()
      setUkuran({ w: Math.ceil(rTeks.width), h: Math.ceil(rTeks.height) })
      setBaris({ satu: ambil(s1, rTeks), dua: ambil(s2, rTeks) })
    }
    ukur()
    const ro = new ResizeObserver(ukur)
    ro.observe(teks)
    return () => ro.disconnect()
  }, [])

  const tampilkanVideo =
    !kurangiGerak && dukungMask && !videoGagal && ukuran.w > 0 && ukuran.h > 0 && !!baris.satu && !!baris.dua

  useEffect(() => {
    if (!tampilkanVideo) return
    videoRef.current?.play().catch(() => {})
  }, [tampilkanVideo])

  useEffect(() => {
    // Sesi ini sudah pernah melihatnya. Penandanya dipasang SKRIP_PEMBUKA di
    // app/spmb/page.tsx sebelum halaman dilukis, dan CSS sudah menyembunyikan
    // tirainya sejak bingkai pertama — jadi di sini cukup tidak memasang
    // pewaktu maupun pendengar apa pun. Sengaja tidak memanggil setState:
    // selain memicu render berantai, melepasnya dari DOM juga akan berbeda
    // dari HTML yang dikirim server.
    if (document.documentElement.dataset.pembuka === 'lewat') return

    const semula = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const tutup = () => setPergi(true)
    const pewaktu = setTimeout(tutup, DURASI_TAHAN)
    window.addEventListener('keydown', tutup)
    window.addEventListener('pointerdown', tutup)
    window.addEventListener('wheel', tutup, { passive: true })

    return () => {
      document.body.style.overflow = semula
      clearTimeout(pewaktu)
      window.removeEventListener('keydown', tutup)
      window.removeEventListener('pointerdown', tutup)
      window.removeEventListener('wheel', tutup)
    }
  }, [])

  // Lepaskan dari DOM setelah animasi terangkatnya selesai.
  useEffect(() => {
    if (!pergi) return
    document.body.style.overflow = ''
    const t = setTimeout(() => setSelesai(true), DURASI_ANGKAT)
    return () => clearTimeout(t)
  }, [pergi])

  if (selesai) return null

  return (
    <div
      ref={ref}
      className={`lp-pembuka${pergi ? ' is-pergi' : ''}`}
      // Murni dekorasi: isinya sudah ada di halaman, jadi pembaca layar tidak
      // perlu membacanya dua kali.
      aria-hidden="true"
    >
      <div className="lp-pembuka-latar" />

      <div className="lp-pembuka-teks" ref={teksRef}>
        <span ref={satuRef} className="lp-pembuka-baris lp-pembuka-baris--satu">
          <Huruf kata="SPMB" mulai={0.04} langkah={0.03} />
        </span>
        <span ref={duaRef} className="lp-pembuka-baris lp-pembuka-baris--dua">
          <Huruf kata="CITRA NEGARA" mulai={0.17} langkah={0.014} />
        </span>

        {tampilkanVideo && (
          <div className="lp-pembuka-video-lapis">
            <video
              ref={videoRef}
              key={VIDEO_PEMBUKA}
              autoPlay
              muted
              loop
              playsInline
              preload="auto"
              onError={() => setVideoGagal(true)}
            >
              <source src={VIDEO_PEMBUKA} type="video/mp4" />
            </video>
          </div>
        )}
      </div>

      {tampilkanVideo && baris.satu && baris.dua && (
        // SVG ini tidak pernah tampil sendiri, cuma wadah definisi <mask>
        // yang dirujuk lewat mask-image di landing.css — tapi width/height
        // di sini TETAP harus ukuran piksel sungguhan (bukan 0), supaya
        // koordinat cx/cy hasil pengukuran di atas jatuh di tempat yang benar.
        <svg
          width={ukuran.w}
          height={ukuran.h}
          // position:absolute saja — TANPA width/height:0 (akan membuat isi
          // mask salah skala) dan TANPA visibility:hidden. <defs> tidak
          // pernah melukis apa pun sendiri jadi elemen ini tidak akan
          // terlihat, TAPI visibility:hidden di sini terbukti lewat uji
          // browser justru mematikan mask-nya juga: Chromium tidak
          // merender isi <mask> sama sekali untuk dirujuk mask-image ketika
          // <svg> induknya visibility:hidden, walau referensinya sendiri
          // valid — video jadi tidak tampak sedikit pun lewat lubang mana
          // pun (sudah dibuktikan dengan mask persegi putih penuh yang
          // seharusnya menampakkan videonya utuh, tapi tetap kosong sampai
          // visibility:hidden ini dilepas).
          style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none' }}
          aria-hidden="true"
          focusable="false"
        >
          <defs>
            <mask id={ID_MASK} maskContentUnits="userSpaceOnUse">
              {/* <text> SVG murni, BUKAN <foreignObject> — lihat catatan
                  panjang di kepala berkas ini untuk alasannya. Putih pekat =
                  bagian yang jadi "lubang" tampak pada mask; textAnchor +
                  dominantBaseline "middle"/"central" menaruh pusat glyph
                  tepat di titik (cx, cy) yang sudah diukur dari baris asli. */}
              <text
                x={baris.satu.cx}
                y={baris.satu.cy}
                textAnchor="middle"
                dominantBaseline="central"
                style={{
                  fill: '#fff',
                  fontFamily: baris.satu.fontFamily,
                  fontWeight: baris.satu.fontWeight,
                  fontSize: baris.satu.fontSize,
                  letterSpacing: baris.satu.letterSpacing,
                }}
              >
                SPMB
              </text>
              <text
                x={baris.dua.cx}
                y={baris.dua.cy}
                textAnchor="middle"
                dominantBaseline="central"
                style={{
                  fill: '#fff',
                  fontFamily: baris.dua.fontFamily,
                  fontWeight: baris.dua.fontWeight,
                  fontSize: baris.dua.fontSize,
                  letterSpacing: baris.dua.letterSpacing,
                }}
              >
                CITRA NEGARA
              </text>
            </mask>
          </defs>
        </svg>
      )}

      <span className="lp-pembuka-garis" />
      <span className="lp-pembuka-tahun">Penerimaan Murid Baru</span>

      <button
        type="button"
        className="lp-pembuka-lewati"
        onClick={() => setPergi(true)}
        tabIndex={-1}
      >
        Lewati
      </button>
    </div>
  )
}
