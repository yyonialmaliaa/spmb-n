'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useEffect, useRef, useState } from 'react'
import { useReducedMotion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import { useKeluar } from './gerak'

/** Ganti path ini kalau berkas videonya diberi nama lain. */
const VIDEO_HERO = '/videos/hero.mp4'
/** Dipakai sebagai bingkai pertama (sebelum video siap) DAN sebagai latar
 *  untuk pengguna yang meminta gerak dikurangi — lihat catatan di bawah.
 *  BUKAN citter.jpg: itu poster promosi ramai (banyak teks/stiker/kode QR
 *  yang ditumpuk), bukan foto tenang. Sama seperti futsalcn1.jpg yang
 *  sudah diganti voli.jpg untuk FinalCTA. */
const POSTER_HERO = '/images/irma.jpg'

/**
 * Hero setinggi satu layar penuh.
 *
 * Judulnya muncul lebih dulu dan langsung terbaca. Begitu pengguna MULAI
 * bergerak, latar mengecil (zoom out) dan teks meredup — seluruhnya
 * digerakkan oleh POSISI GULIR, bukan hover atau klik. Jadi hero terasa
 * ditinggalkan, bukan sekadar tergulung pergi.
 *
 * Latarnya video, bukan lagi foto diam — tapi TIDAK untuk semua orang:
 * pengguna yang mengaktifkan "kurangi gerak" di sistemnya tetap melihat foto
 * diam (POSTER_HERO). Video yang berputar otomatis di latar adalah tepat
 * jenis gerak yang diminta dihindari oleh preferensi itu; kita menghormatinya
 * di sini, bukan cuma di transformasi zoom saja.
 */
export function Hero({ tahunAjaran }: { tahunAjaran: string | null }) {
  const ref = useRef<HTMLElement | null>(null)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const kurangiGerak = useReducedMotion()
  const keluar = useKeluar(ref)
  const [videoGagal, setVideoGagal] = useState(false)

  // Sebagian browser (terutama mobile) menolak autoplay lewat atribut HTML
  // begitu saja kalau elemennya baru dipasang setelah interaksi pengguna;
  // memanggil .play() secara eksplisit adalah jalan yang lebih tahan banting.
  // Kegagalannya (mis. autoplay diblokir) diabaikan dengan tenang — poster
  // gambar tetap tampil sebagai gantinya, bukan layar kosong.
  useEffect(() => {
    if (kurangiGerak) return
    videoRef.current?.play().catch(() => {})
  }, [kurangiGerak])

  // Gambar/video berangkat sedikit membesar lalu mengecil ke ukuran wajar;
  // teks naik dan memudar. Dipetakan langsung dari progres, tanpa pustaka animasi.
  const skala = kurangiGerak ? 1 : 1.14 - keluar * 0.18
  const naik = kurangiGerak ? 0 : keluar * 110
  const pudar = kurangiGerak ? 1 : Math.max(0, 1 - keluar * 1.6)

  const pakaiVideo = !kurangiGerak && !videoGagal

  return (
    <section ref={ref} className="lp-hero">
      <div className="lp-hero-media" style={{ transform: `scale(${skala})` }}>
        {pakaiVideo ? (
          <video
            ref={videoRef}
            key={VIDEO_HERO}
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
            poster={POSTER_HERO}
            aria-hidden="true"
            // Kalau berkas videonya belum ada / gagal dimuat, jatuh balik ke
            // foto diam alih-alih membiarkan kotak hero kosong.
            onError={() => setVideoGagal(true)}
          >
            <source src={VIDEO_HERO} type="video/mp4" />
          </video>
        ) : (
          <Image
            src={POSTER_HERO}
            alt="Suasana kegiatan siswa Citra Negara"
            fill
            priority
            sizes="100vw"
            style={{ objectFit: 'cover' }}
          />
        )}
      </div>
      <div className="lp-hero-tirai" />

      <div
        className="lp-hero-isi"
        style={{ transform: `translateY(${-naik}px)`, opacity: pudar }}
      >
        <div className="lp-wadah">
          <p className="lp-label lp-label--terang lp-hero-label">
            SPMB Citra Negara{tahunAjaran ? ` · TA ${tahunAjaran}` : ''}
          </p>

          <h1 className="lp-hero-judul">
            Langkah pertamamu<br />dimulai di sini.
          </h1>

          <p className="lp-hero-sub">
            Temukan ruang untuk belajar, bertumbuh, dan mempersiapkan langkah
            berikutnya bersama Citra Negara.
          </p>

          <div className="lp-hero-aksi">
            <Link href="/register" className="lp-tombol lp-tombol--terang">
              Daftar Sekarang <ArrowRight size={17} />
            </Link>
            <a href="#tentang" className="lp-tombol lp-tombol--hantu">
              Jelajahi Citra Negara
            </a>
          </div>
        </div>
      </div>

      <div className="lp-gulir-petunjuk" aria-hidden="true" style={{ opacity: pudar }}>
        <span>Scroll</span>
        <span className="lp-gulir-garis" />
      </div>
    </section>
  )
}
