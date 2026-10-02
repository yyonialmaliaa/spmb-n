'use client'

import { Fragment, useRef, useState, type CSSProperties, type KeyboardEvent } from 'react'
import Image from 'next/image'
import { Bendera } from './Bendera'
import { LOGO_MITRA_GO } from './logoMitra'
import { DAFTAR_BAHASA, infoBahasa, type Bahasa } from './i18n/bahasa'
import { useBahasa } from './i18n/PenyediaBahasa'

/**
 * "Go Internasional" — tulisan besar di sisi kiri hero yang sekaligus menjadi
 * pemilih bahasa landing page.
 *
 * Huruf "o" pada "Go" adalah cincin berisi enam bendera (Indonesia, Inggris,
 * Jepang, Turki, Jerman, Korea) yang mengorbit pelan. Mengklik salah satu
 * bendera menerjemahkan seluruh landing page ke bahasa itu; bendera bahasa
 * yang aktif bercincin kuning. Orbit berhenti selama kursor/fokus berada di
 * cincin supaya benderanya mudah dipilih. Di sebelahnya, catatan kecil
 * menyebut nama bahasa (yang aktif, atau yang sedang disorot).
 *
 * Bagi pembaca layar, cincin ini radiogroup biasa: Tab masuk ke bendera
 * aktif, panah kiri/kanan berpindah bahasa.
 *
 * Di bawahnya, branding kemitraan program: "In Partnership with" + logo
 * Anabuki × Makara UI Academy. Sengaja lebih kecil dari tulisan utama dan
 * dari logo Citra Negara di navbar — Citra Negara tetap merek utama, kedua
 * mitra pendukung. Logonya dipakai apa adanya di atas kartu terang, karena
 * tulisan "Makara UI Academy" berwarna hitam dan tak terbaca di atas video.
 * Teks kemitraan tetap bahasa Inggris di semua bahasa (bagian dari branding,
 * seperti "Go International").
 *
 * Gerak masuknya (huruf naik, cincin tergambar, bendera bermunculan satu per
 * satu, "Internasional" tersusun huruf demi huruf) diatur di landing.css,
 * blok "GO INTERNASIONAL" — termasuk menunggu tirai pembuka selesai.
 */
export function GoInternasional() {
  const { bahasa, t, ganti: gantiBahasa } = useBahasa()
  const [sorot, setSorot] = useState<Bahasa | null>(null)
  // Sudah pernah ganti bahasa dari sini → kata kedua tersusun ulang tanpa
  // jeda gerak pembukaan.
  const [diganti, setDiganti] = useState(false)
  const tombol = useRef<(HTMLButtonElement | null)[]>([])
  const tampil = infoBahasa(sorot ?? bahasa)

  const ganti = (b: Bahasa) => {
    if (b === bahasa) return
    setDiganti(true)
    gantiBahasa(b)
  }

  const tekan = (e: KeyboardEvent, i: number) => {
    const n = DAFTAR_BAHASA.length
    const ke =
      e.key === 'ArrowRight' || e.key === 'ArrowDown' ? (i + 1) % n
      : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? (i - 1 + n) % n
      : e.key === 'Home' ? 0
      : e.key === 'End' ? n - 1
      : -1
    if (ke < 0) return
    e.preventDefault()
    tombol.current[ke]?.focus()
    ganti(DAFTAR_BAHASA[ke].kode)
  }

  return (
    <div className="lp-go">
      <p className="lp-sr">Go {t.go.kata}</p>

      <div className="lp-go-kata">
        <span className="lp-go-g" aria-hidden="true">G</span>
        <div
          className="lp-go-o"
          role="radiogroup"
          aria-label={t.go.pilih}
          onPointerLeave={() => setSorot(null)}
        >
          {/* Garis huruf "o" — melewati titik tengah keenam bendera. */}
          <svg className="lp-go-cincin" viewBox="0 0 100 100" aria-hidden="true">
            <circle cx="50" cy="50" r="36" pathLength={100} />
          </svg>
          <div className="lp-go-orbit">
            {DAFTAR_BAHASA.map((b, i) => (
              <button
                key={b.kode}
                ref={el => { tombol.current[i] = el }}
                type="button"
                role="radio"
                aria-checked={b.kode === bahasa}
                aria-label={b.nama}
                lang={b.kode}
                tabIndex={b.kode === bahasa ? 0 : -1}
                className="lp-go-bendera"
                style={{ '--i': i } as CSSProperties}
                onClick={() => ganti(b.kode)}
                onKeyDown={e => tekan(e, i)}
                onPointerEnter={() => setSorot(b.kode)}
                onFocus={() => setSorot(b.kode)}
                onBlur={() => setSorot(null)}
              >
                <span className="lp-go-bendera-isi">
                  <Bendera kode={b.kode} />
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Catatan di kanan cincin: nama bahasa aktif/disorot + petunjuk. */}
        <div className="lp-go-catatan" aria-hidden="true">
          <span className="lp-go-garis" />
          <span className="lp-go-catatan-teks">
            <span key={tampil.kode} className="lp-go-nama" lang={tampil.kode}>{tampil.nama}</span>
            <span className="lp-go-petunjuk">{t.go.petunjuk}</span>
          </span>
        </div>
      </div>

      {/* Dipasang ulang tiap ganti bahasa supaya hurufnya tersusun lagi. */}
      <p key={t.go.kata} className={`lp-go-dua${diganti ? ' is-ganti' : ''}`} aria-hidden="true">
        {[...t.go.kata].map((h, k) => (
          <span key={k} style={{ '--k': k } as CSSProperties}>{h}</span>
        ))}
      </p>

      <div className="lp-go-mitra" lang="en">
        <p className="lp-go-mitra-label">In Partnership with</p>
        <div className="lp-go-mitra-kartu">
          {LOGO_MITRA_GO.map((l, i) => (
            <Fragment key={l.src}>
              {i > 0 && <span className="lp-go-mitra-kali" aria-hidden="true">×</span>}
              <Image src={l.src} alt={l.nama} width={l.w} height={l.h} sizes="120px" />
            </Fragment>
          ))}
        </div>
      </div>
    </div>
  )
}
