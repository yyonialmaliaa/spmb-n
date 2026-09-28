'use client'

import Image from 'next/image'
import { useRef, useState, useEffect } from 'react'
import { useReducedMotion } from 'framer-motion'
import { useGulirCss, useKeluar } from './gerak'
import { NILAI_MANTAP } from './nilaiMantap'
import { PanelNilai } from './PanelNilai'

/** Foto udara gedung sekolah. Foto ini juga yang membesar di akhir animasi
 *  pembuka (Pembuka.tsx) lalu "menjadi" latar hero — keduanya harus sama. */
export const FOTO_HERO = '/images/hero baru.png'

/** Video udara gedung sekolah sebagai latar hero */
export const VIDEO_HERO = '/videos/Video Project.mp4'

/** Skala latar saat halaman di posisi paling atas. Pembuka mengakhiri
 *  zoom-nya di angka yang sama supaya serah terimanya tidak bergeser. */
export const SKALA_HERO = 1.1

type BahasaNilai = 'id' | 'en' | 'ja' | 'tr' | 'de' | 'ko'

const DAFTAR_BAHASA: { key: BahasaNilai; label: string }[] = [
  { key: 'id', label: 'Bahasa' },
  { key: 'en', label: 'English' },
  { key: 'ja', label: '日本語' },
  { key: 'tr', label: 'Türkçe' },
  { key: 'de', label: 'Deutsch' },
  { key: 'ko', label: '한국어' },
]

/**
 * Hero setinggi satu layar penuh: video udara sekolah, lalu di tengah bawah
 * label SPMB (judul utama halaman) dan deret nilai sekolah (MANTAP) bersekat
 * garis tipis — komposisi khas situs sekolah internasional. Tiap nilai bisa
 * diklik untuk membuka panel foto + penjelasannya (PanelNilai).
 *
 * Transisi ke bab berikutnya ("Sebuah tempat") mengikuti posisi gulir, maju
 * maupun mundur: hero ikut tergulir naik seperti biasa, tetapi videonya
 * mengecil dari kiri, kanan, dan bawah (isinya tidak diperkecil) sampai
 * tinggal pita di atas — jarak ke bab berikutnya tampak jauh — sementara
 * teksnya ikut terpotong naik sambil memudar. Semuanya animasi
 * CSS berbasis posisi gulir (landing.css, blok "HERO → SEBUAH TEMPAT") yang
 * dikerjakan GPU — tanpa JavaScript per bingkai.
 *
 * Browser yang belum mendukung animasi semacam itu memakai efek lama: video
 * sedikit mengecil dan teks naik memudar lewat useKeluar. Pengguna yang
 * meminta gerak dikurangi melihatnya diam.
 */
export function Hero({ tahunAjaran }: { tahunAjaran: string | null }) {
  const ref = useRef<HTMLElement | null>(null)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const kurangiGerak = useReducedMotion()
  const gulirCss = useGulirCss()
  const keluar = useKeluar(ref, !gulirCss)
  const tombolNilai = useRef<(HTMLButtonElement | null)[]>([])
  const [nilaiAktif, setNilaiAktif] = useState<number | null>(null)
  const [bahasaAktif, setBahasaAktif] = useState<BahasaNilai>('id')
  // Panel baru dipasang begitu ada tanda minat (kursor mendekat / fokus /
  // sentuhan) — cukup awal untuk memuat fotonya sebelum diklik, tanpa
  // membebani pemuatan pertama halaman.
  const [panelSiap, setPanelSiap] = useState(false)
  const [videoGagal, setVideoGagal] = useState(false)
  const [dekat, setDekat] = useState(false)

  const siapkan = () => { if (!panelSiap) setPanelSiap(true) }

  // Video dimulai muat sedikit sebelum benar-benar terlihat
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

  const skala = kurangiGerak ? 1 : SKALA_HERO - keluar * 0.1
  const naik = kurangiGerak ? 0 : keluar * 110
  const pudar = kurangiGerak ? 1 : Math.max(0, 1 - keluar * 1.6)
  // Bila CSS yang menggerakkan, gaya inline tidak dipasang sama sekali.
  const gayaMedia = gulirCss ? undefined : { transform: `scale(${skala})` }
  const gayaIsi = gulirCss ? undefined : { transform: `translateY(${-naik}px)`, opacity: pudar }

  const getNama = (index: number) => {
    const nilai = NILAI_MANTAP[index]
    if (bahasaAktif === 'id') return nilai.nama
    const terjemahan = nilai.terjemahan?.[bahasaAktif as keyof typeof nilai.terjemahan]
    return terjemahan?.nama || nilai.nama
  }

  return (
    <section ref={ref} className="lp-hero-panggung">
      <div className="lp-hero">
        {/* Bingkai media: video atau foto fallback */}
        <div className="lp-hero-bingkai">
          <div className="lp-hero-media" style={gayaMedia}>
            {pakaiVideo ? (
              <video
                ref={videoRef}
                key={VIDEO_HERO}
                autoPlay
                muted
                loop
                playsInline
                preload="auto"
                poster={FOTO_HERO}
                aria-hidden="true"
                onError={() => setVideoGagal(true)}
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
              >
                <source src={VIDEO_HERO} type="video/mp4" />
              </video>
            ) : (
              <Image
                src={FOTO_HERO}
                alt="Gedung sekolah Citra Negara dilihat dari udara"
                fill
                preload
                sizes="100vw"
                style={{ objectFit: 'cover' }}
              />
            )}
          </div>
          <div className="lp-hero-tirai" />
        </div>
        {/* Penutup berwarna latar halaman: saat hero digulir keluar, ketiganya
            melebar dari tepi sehingga media tampak MENGECIL dari kiri, kanan,
            dan bawah tanpa isinya ikut diperkecil (transform saja — ringan). */}
        <div className="lp-hero-sisi lp-hero-sisi--kiri" aria-hidden="true" />
        <div className="lp-hero-sisi lp-hero-sisi--kanan" aria-hidden="true" />
        <div className="lp-hero-sisi lp-hero-sisi--bawah" aria-hidden="true" />

        <div className="lp-hero-isi" style={gayaIsi}>
          <div className="lp-hero-tengah">
            {/* Judul utama (h1) halaman — tampil sebagai label kecil. */}
            <h1 className="lp-label lp-label--terang lp-hero-label">
              SPMB SMP-SMA-SMK Citra Negara{tahunAjaran && <> · <span style={{ whiteSpace: 'nowrap' }}>TA {tahunAjaran}</span></>}
            </h1>

            {/* Toggle bahasa */}
            <div className="lp-hero-bahasa">
              {DAFTAR_BAHASA.map(lang => (
                <button
                  key={lang.key}
                  type="button"
                  className={`lp-hero-bahasa-tombol ${bahasaAktif === lang.key ? 'is-aktif' : ''}`}
                  onClick={() => setBahasaAktif(lang.key)}
                >
                  {lang.label}
                </button>
              ))}
            </div>

            <div
              className="lp-hero-nilai"
              role="group"
              aria-label="Nilai MANTAP Citra Negara"
              onPointerEnter={siapkan}
              onFocus={siapkan}
              onTouchStart={siapkan}
            >
              {NILAI_MANTAP.map((n, i) => (
                <button
                  key={n.nama}
                  ref={el => { tombolNilai.current[i] = el }}
                  type="button"
                  className="lp-hero-nilai-tombol"
                  aria-haspopup="dialog"
                  onClick={() => { siapkan(); setNilaiAktif(i) }}
                >
                  {/* Teksnya dibungkus supaya yang terangkat saat disorot hanya
                      kata ini — sekat tegak (border tombol) tetap diam. */}
                  <span 
                    className="lp-hero-nilai-kata"
                    key={`${i}-${bahasaAktif}`}
                  >
                    {getNama(i)}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Di luar .lp-hero: elemen sticky membentuk konteks tumpukan sendiri
          (panel akan tertimpa bab berikutnya), dan transform pada .lp-hero-isi
          membuat position:fixed milik keturunannya ikut bergeser. */}
      {panelSiap && (
        <PanelNilai 
          aktif={nilaiAktif} 
          setAktif={setNilaiAktif} 
          asal={i => tombolNilai.current[i] ?? null}
          bahasa={bahasaAktif}
        />
      )}
    </section>
  )
}
