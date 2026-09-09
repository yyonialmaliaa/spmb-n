'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useEffect, useRef, useState } from 'react'
import { useReducedMotion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import { useKeluarBawah, useMasuk } from './gerak'

/** Sama dengan video hero & tirai pembuka — satu video dipakai di seluruh halaman. */
const VIDEO_PENUTUP = '/videos/hero.mp4'
/** Jaring pengaman: dipakai sebagai poster DAN latar kalau video gagal/tidak diputar. */
const POSTER_PENUTUP = '/images/voli.jpg'

/** Radius kotak penuh saat "ditarik ke dalam" — sama dengan .lp-bingkai di tempat lain. */
const RADIUS_KOTAK = 10

/**
 * Penutup selebar layar.
 *
 * Dua gerak terpisah, sengaja tidak saling bergantung:
 *
 * 1. KEDATANGAN (useMasuk) — kebalikan dari hero: semakin dekat pengguna ke
 *    bab ini, gambarnya justru MEMBESAR perlahan (zoom in) dan teksnya
 *    muncul bertahap di atasnya.
 * 2. KEPERGIAN (useKeluarBawah) — bab ini digabung SATU bab dengan footer
 *    (lihat app/spmb/page.tsx), jadi menggulir lagi di sini berarti
 *    menyusuri ke footer, bukan berpindah bab. Video latarnya menyusut dari
 *    ukuran biasa (penuh layar) jadi kotak kecil bersudut membulat yang
 *    "ditarik ke dalam" — memberi ruang napas sebelum footer muncul, alih-
 *    alih berhenti mendadak di tepi layar.
 *
 * Terikat posisi gulir, jadi lajunya ditentukan pengguna sendiri — bukan
 * pewaktu.
 */
export function FinalCTA({ tahunAjaran }: { tahunAjaran: string | null }) {
  const ref = useRef<HTMLElement | null>(null)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const kurangiGerak = useReducedMotion()
  const masuk = useMasuk(ref)
  const keluarBawah = useKeluarBawah(ref)
  const [videoGagal, setVideoGagal] = useState(false)
  // Bab ini biasanya bab TERAKHIR yang dicapai pengunjung, dan videonya
  // berukuran besar — jangan mulai mengunduhnya sejak halaman dimuat kalau
  // pengunjung belum tentu menggulir sejauh itu. rootMargin 50% membuatnya
  // mulai dimuat SEDIKIT sebelum benar-benar terlihat, supaya frame pertama
  // sudah siap begitu bagian ini muncul di layar.
  const [dekat, setDekat] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(
      entri => { if (entri[0].isIntersecting) { setDekat(true); io.disconnect() } },
      { rootMargin: '50% 0px' },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  const pakaiVideo = !kurangiGerak && !videoGagal && dekat

  useEffect(() => {
    if (!pakaiVideo) return
    videoRef.current?.play().catch(() => {})
  }, [pakaiVideo])

  const skala = kurangiGerak ? 1.04 : 1 + masuk * 0.16
  // Teks menyusul gambar: baru mulai terbaca setelah setengah perjalanan.
  const munculTeks = kurangiGerak ? 1 : Math.max(0, Math.min(1, (masuk - 0.45) / 0.4))

  // 0 = penuh layar seperti biasa, 1 = kotak sudah sepenuhnya "ditarik ke
  // dalam". Selesai di 60% perjalanan keluar supaya kotaknya sempat diam
  // sejenak (bukan masih menyusut tepat saat footer terpotong tepi layar).
  const kotak = kurangiGerak ? 0 : Math.max(0, Math.min(1, keluarBawah / 0.6))
  // calc() dengan pengali angka polos, BUKAN window.innerWidth: komponen ini
  // dirender di server dulu (SSR) sebelum sempat hydrate, dan `window` tidak
  // ada sama sekali di lingkungan itu — membacanya langsung di badan render
  // (bukan di dalam useEffect) akan melempar ReferenceError. calc() juga
  // otomatis ikut berubah saat jendela di-resize, tanpa listener tambahan.
  const insetX = `calc(${kotak} * clamp(2rem, 12vw, 9rem))`
  const insetY = `calc(${kotak} * clamp(1.5rem, 6vh, 4rem))`

  return (
    <section ref={ref} className="lp-penutup">
      <div
        className="lp-penutup-media"
        style={{
          transform: `scale(${skala})`,
          top: insetY, right: insetX, bottom: insetY, left: insetX,
          borderRadius: kotak * RADIUS_KOTAK,
        }}
      >
        {pakaiVideo ? (
          <video
            ref={videoRef}
            key={VIDEO_PENUTUP}
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
            poster={POSTER_PENUTUP}
            aria-hidden="true"
            // Kalau videonya gagal dimuat, jatuh balik ke foto diam alih-alih
            // membiarkan kotak penutup kosong.
            onError={() => setVideoGagal(true)}
          >
            <source src={VIDEO_PENUTUP} type="video/mp4" />
          </video>
        ) : (
          /* futsalcn1.jpg (dipakai sebelumnya) ternyata poster kejuaraan penuh
             teks & stiker baked-in, bukan foto polos — tanpa overlay gelap,
             teks CTA di atasnya bentrok dengan teks poster itu sendiri.
             voli.jpg foto tim yang tenang, cukup lapang untuk judul di
             atasnya terbaca lewat bayangan teks saja. */
          <Image
            src={POSTER_PENUTUP}
            alt=""
            fill
            loading="lazy"
            sizes="100vw"
            style={{ objectFit: 'cover' }}
          />
        )}
      </div>

      <div
        className="lp-penutup-isi"
        style={{ opacity: munculTeks, transform: `translateY(${(1 - munculTeks) * 28}px)` }}
      >
        <div className="lp-wadah">
          <p className="lp-label lp-label--terang">
            SPMB Citra Negara{tahunAjaran ? ` · TA ${tahunAjaran}` : ''}
          </p>

          <h2 className="lp-judul-raksasa lp-penutup-judul">
            Siap memulai langkahmu?
          </h2>

          <div className="lp-penutup-aksi">
            <Link href="/register" className="lp-tombol lp-tombol--terang">
              Daftar Sekarang <ArrowRight size={18} />
            </Link>
            {/* Padat, bukan transparan (lp-tombol--hantu): tanpa overlay gelap di
                atas foto, tombol tembus pandang bisa hilang di bagian foto yang
                terang. Latar padat menjamin tombolnya tetap terbaca di mana pun
                ia jatuh di atas foto. */}
            <a href="#alur" className="lp-tombol lp-tombol--gelap">Lihat Alur</a>
          </div>

          <p className="lp-penutup-masuk">
            Sudah punya akun? <Link href="/login" className="lp-tautan">Masuk di sini</Link>
          </p>
        </div>
      </div>
    </section>
  )
}
