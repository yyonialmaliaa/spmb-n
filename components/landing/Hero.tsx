'use client'

import Image from 'next/image'
import { useRef, useState, useEffect } from 'react'
import { useReducedMotion } from 'framer-motion'
import { useGulirCss, useHp, useKeluar } from './gerak'
import { NILAI_MANTAP, teksNilai } from './nilaiMantap'
import { PanelNilai } from './PanelNilai'
import { GoInternasional } from './GoInternasional'
import { useBahasa } from './i18n/PenyediaBahasa'
import { tandaiNama } from './i18n/namaDiri'

/** Foto udara gedung sekolah. Foto ini juga yang membesar di akhir animasi
 *  pembuka (Pembuka.tsx) lalu "menjadi" latar hero — keduanya harus sama. */
export const FOTO_HERO = '/images/hero baru.png'

/** Video udara gedung sekolah sebagai latar hero */
export const VIDEO_HERO = '/videos/Video Project.mp4'

/** Skala latar saat halaman di posisi paling atas. Pembuka mengakhiri
 *  zoom-nya di angka yang sama supaya serah terimanya tidak bergeser. */
export const SKALA_HERO = 1.1

/**
 * Hero setinggi satu layar penuh: video udara sekolah; di sisi kiri tulisan
 * besar "Go Internasional" yang huruf "o"-nya cincin bendera pemilih bahasa
 * (GoInternasional); di tengah bawah label SPMB (judul utama halaman) dan
 * deret nilai sekolah (MANTAP) bersekat garis tipis — komposisi khas situs
 * sekolah internasional. Tiap nilai bisa diklik untuk membuka panel foto +
 * penjelasannya (PanelNilai).
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
 *
 * Di HP tidak ada efek gulir: video tampil melebar (16:9) di bawah navbar
 * yang transparan, dan "Go Internasional", label, serta deret nilai pindah
 * ke blok hijau tua di bawah video — memudar masuk tipis saat halaman
 * dibuka (landing.css, blok "TAMPILAN HP").
 */
export function Hero({ tahunAjaran }: { tahunAjaran: string | null }) {
  const ref = useRef<HTMLElement | null>(null)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const kurangiGerak = useReducedMotion()
  const gulirCss = useGulirCss()
  const hp = useHp()
  // Efek gulir lama (JS) hanya untuk browser tanpa animasi CSS berbasis gulir
  // — dan tidak di HP.
  const gulirJs = !gulirCss && !hp
  const keluar = useKeluar(ref, gulirJs)
  const tombolNilai = useRef<(HTMLButtonElement | null)[]>([])
  const [nilaiAktif, setNilaiAktif] = useState<number | null>(null)
  const { bahasa, t } = useBahasa()
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
  // Bila CSS yang menggerakkan (atau di HP), gaya inline tidak dipasang sama sekali.
  const gayaMedia = gulirJs ? { transform: `scale(${skala})` } : undefined
  const gayaIsi = gulirJs ? { transform: `translateY(${-naik}px)`, opacity: pudar } : undefined

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
          {/* Ruang kosong di kiri antara navbar dan label: tulisan besar
              "Go Internasional" — huruf "o"-nya pemilih bahasa. */}
          <div className="lp-go-wadah">
            <GoInternasional />
          </div>

          <div className="lp-hero-tengah">
            {/* Judul utama (h1) halaman — tampil sebagai label kecil. Kata-
                katanya juga dipakai tirai pembuka (Pembuka.tsx), yang
                menerbangkan tiap kata ke posisinya di sini. */}
            <h1 className="lp-label lp-label--terang lp-hero-label">
              {tandaiNama(t.label.judul)}{tahunAjaran && <> · <span style={{ whiteSpace: 'nowrap' }}>{t.label.tahun(tahunAjaran)}</span></>}
            </h1>

            <div
              className="lp-hero-nilai"
              role="group"
              aria-label={t.hero.nilaiAria}
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
                  <span className="lp-hero-nilai-kata">
                    {teksNilai(n, bahasa).nama}
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
        />
      )}
    </section>
  )
}
