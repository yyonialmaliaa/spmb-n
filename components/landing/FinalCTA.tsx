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
 * Penutup: kartu video yang MULAI selebar layar (persis video biasa) lalu
 * menyusut jadi kartu kecil bersudut membulat begitu babnya tiba — bukan
 * lagi kartu kecil yang diam dari awal.
 *
 * Ukuran akhirnya (kecil, bersudut membulat) tetap diatur lewat CSS seperti
 * sebelumnya (lihat .lp-penutup-kartu), tapi sekarang dibungkus animasi:
 * kartunya diukur (offsetWidth/Height, TIDAK terpengaruh transform) lalu
 * di-scale UP sampai menutupi layar penuh saat bab ini baru mulai terlihat,
 * dan discale turun ke 1 (ukuran alaminya) seiring bab-nya mendekat penuh
 * (useMasuk 0→1) — jadi terasa seperti video besar yang menyusut jadi
 * kartu, persis saat pengguna tiba di bagian ini, BUKAN menunggu gulir
 * tambahan setelah tiba (itu salah baca referensi versi sebelumnya).
 * Sudut membulatnya ikut diinterpolasi 0→22px selaras dengan skalanya.
 *
 * Latar di SEKELILING kartu mengikuti tema situs (putih di mode terang,
 * hijau tua di mode gelap) seperti section lain, karena begitu kartunya
 * sudah mengecil ia tidak lagi memenuhi seluruh section.
 */
export function FinalCTA({ tahunAjaran }: { tahunAjaran: string | null }) {
  const ref = useRef<HTMLElement | null>(null)
  const kartuRef = useRef<HTMLDivElement | null>(null)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const kurangiGerak = useReducedMotion()
  const masuk = useMasuk(ref)
  const [videoGagal, setVideoGagal] = useState(false)
  // Skala yang dibutuhkan supaya kartu (ukuran alaminya, dari CSS) menutupi
  // seluruh layar. Diukur dari offsetWidth/Height — bukan
  // getBoundingClientRect — supaya TIDAK ikut terbaca lebih besar/kecil oleh
  // transform scale yang sedang kita terapkan sendiri di bawah.
  const [skalaAwal, setSkalaAwal] = useState(1)

  useEffect(() => {
    const kartu = kartuRef.current
    if (!kartu) return
    const ukur = () => {
      const { offsetWidth: w, offsetHeight: h } = kartu
      if (!w || !h) return
      setSkalaAwal(Math.max(window.innerWidth / w, window.innerHeight / h))
    }
    ukur()
    const ro = new ResizeObserver(ukur)
    ro.observe(kartu)
    window.addEventListener('resize', ukur)
    return () => { ro.disconnect(); window.removeEventListener('resize', ukur) }
  }, [])
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

  // Kartu LUARnya: dari menutupi layar penuh (skalaAwal) menyusut ke ukuran
  // alaminya (1) begitu bab ini tiba — inilah transisi "video normal jadi
  // kartu kecil" yang diminta. Sudutnya ikut membulat dari 0 ke 22px.
  const skalaKartu = kurangiGerak ? 1 : skalaAwal + (1 - skalaAwal) * masuk
  const radiusKartu = kurangiGerak ? 22 : masuk * 22
  // Zoom-in halus TAMBAHAN di DALAM kartu (lapisan videonya sendiri) saat
  // bab ini didekati — efek tekstur kecil di atas transisi ukuran di atas.
  const skala = kurangiGerak ? 1.04 : 1 + masuk * 0.1
  // Teks menyusul gambar: baru mulai terbaca setelah setengah perjalanan.
  const munculTeks = kurangiGerak ? 1 : Math.max(0, Math.min(1, (masuk - 0.45) / 0.4))

  return (
    <section ref={ref} className="lp-penutup">
      <div
        ref={kartuRef}
        className="lp-penutup-kartu"
        style={{ transform: `scale(${skalaKartu})`, borderRadius: `${radiusKartu}px` }}
      >
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
