'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useEffect, useRef, useState } from 'react'
import { useReducedMotion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import { useMasuk } from './gerak'

/** Sama dengan video hero & tirai pembuka — satu video dipakai di seluruh halaman. */
const VIDEO_PENUTUP = '/videos/hero.mp4'
/** Jaring pengaman: dipakai sebagai poster DAN latar kalau video gagal/tidak diputar. */
const POSTER_PENUTUP = '/images/voli.jpg'

/**
 * Penutup: kartu video kecil bersudut membulat, bukan lagi foto/video
 * selebar layar.
 *
 * Sebelumnya videonya baru menyusut jadi kotak SETELAH pengguna menggulir
 * ke arah footer — ternyata itu salah baca referensi: kartunya harus SUDAH
 * kecil begitu bab ini tiba di layar, bukan menunggu gulir tambahan. Jadi
 * ukurannya sekarang TETAP (diatur CSS, lihat .lp-penutup-kartu), dan
 * satu-satunya gerak yang tersisa adalah zoom-in halus di dalam kartu itu
 * sendiri saat bab ini didekati (useMasuk) — persis pola yang sudah dipakai
 * di tempat lain di halaman ini.
 *
 * Latar di SEKELILING kartu sekarang mengikuti tema situs (putih di mode
 * terang, hijau tua di mode gelap) seperti section lain — bukan lagi
 * dipaksa hijau tua terus, karena videonya sudah tidak lagi memenuhi
 * seluruh section.
 */
export function FinalCTA({ tahunAjaran }: { tahunAjaran: string | null }) {
  const ref = useRef<HTMLElement | null>(null)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const kurangiGerak = useReducedMotion()
  const masuk = useMasuk(ref)
  const [videoGagal, setVideoGagal] = useState(false)
  // Videonya berukuran besar — jangan mulai mengunduhnya sejak halaman
  // dimuat kalau pengunjung belum tentu menggulir sejauh ini. rootMargin
  // 50% membuatnya mulai dimuat SEDIKIT sebelum benar-benar terlihat,
  // supaya frame pertama sudah siap begitu kartu ini muncul di layar.
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

  // Zoom-in halus di DALAM kartu (ukuran kartunya sendiri tetap) saat
  // bab ini didekati — bukan lagi menyusutkan kartunya.
  const skala = kurangiGerak ? 1.04 : 1 + masuk * 0.1
  // Teks menyusul gambar: baru mulai terbaca setelah setengah perjalanan.
  const munculTeks = kurangiGerak ? 1 : Math.max(0, Math.min(1, (masuk - 0.45) / 0.4))

  return (
    <section ref={ref} className="lp-penutup">
      <div className="lp-penutup-kartu">
        <div className="lp-penutup-media" style={{ transform: `scale(${skala})` }}>
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
              // membiarkan kartu penutup kosong.
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
              sizes="(max-width: 768px) 92vw, 880px"
              style={{ objectFit: 'cover' }}
            />
          )}
        </div>

        <div
          className="lp-penutup-isi"
          style={{ opacity: munculTeks, transform: `translateY(${(1 - munculTeks) * 28}px)` }}
        >
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
