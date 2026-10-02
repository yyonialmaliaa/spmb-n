'use client'

import type { CSSProperties } from 'react'
import Image from 'next/image'
import { Muncul, JudulBaris } from './gerak'
import { LOGO_MITRA, type Logo } from './logoMitra'
import { useBahasa } from './i18n/PenyediaBahasa'
import { tandaiNama } from './i18n/namaDiri'

/**
 * Satu deret logo yang berjalan sendiri tanpa ujung. Isinya dirender dua
 * kali berdampingan lalu digeser -50% berulang-ulang, jadi sambungannya tidak
 * pernah terlihat. Salinan kedua disembunyikan dari pembaca layar dan tidak
 * bisa difokus.
 *
 * Logo abu-abu; berwarna saat disorot kursor atau diketuk/difokus (tabIndex),
 * dan deretnya berhenti selama itu supaya logonya sempat dilihat.
 */
function Deret({ logo, arah, durasi }: { logo: Logo[]; arah: 'kiri' | 'kanan'; durasi: number }) {
  const { t } = useBahasa()
  return (
    <div className="lp-mitra-pita">
      <div
        className={`lp-mitra-jalur lp-mitra-jalur--${arah}`}
        style={{ '--durasi': `${durasi}s` } as CSSProperties}
      >
        {[false, true].map(salinan => (
          <ul key={String(salinan)} className="lp-mitra-deret" aria-hidden={salinan || undefined}>
            {logo.map(l => (
              <li key={l.src} className="lp-mitra-logo" tabIndex={salinan ? -1 : 0}>
                <Image src={l.src} alt={salinan ? '' : t.mitra.logo(l.nama)} width={l.w} height={l.h} sizes="180px" />
              </li>
            ))}
          </ul>
        ))}
      </div>
    </div>
  )
}

/**
 * "Mengapa Citra Negara" — kerja sama dengan industri. Logo mitra diambil dari
 * public/images/mitra (versi web dari public/images/"kerja sama"; lihat
 * logoMitra.ts), dibagi dua deret yang berjalan berlawanan arah.
 */
export function MitraIndustri() {
  const tengah = Math.ceil(LOGO_MITRA.length / 2)
  const jumlah = Math.floor(LOGO_MITRA.length / 10) * 10
  const { t } = useBahasa()

  return (
    <section className="lp-bagian lp-mitra" aria-label={t.mitra.aria}>
      <div className="lp-wadah">
        <Muncul>
          <p className="lp-label">{tandaiNama(t.mitra.label)}</p>
        </Muncul>
        <div style={{ marginTop: '1.4rem' }}>
          <JudulBaris larik={t.mitra.judul} className="lp-judul-besar" />
        </div>
        <div className="lp-mitra-kepala">
          <Muncul jeda={0.1}>
            <p className="lp-teks lp-mitra-teks">{t.mitra.teks}</p>
          </Muncul>
          {jumlah > 0 && (
            <Muncul jeda={0.16}>
              <p className="lp-mitra-angka">
                <strong>{jumlah}+</strong>
                <span>{t.mitra.angka}</span>
              </p>
            </Muncul>
          )}
        </div>
      </div>

      <div className="lp-mitra-deretan" role="region" aria-label={t.mitra.logoAria}>
        <Deret logo={LOGO_MITRA.slice(0, tengah)} arah="kiri" durasi={tengah * 3.4} />
        <Deret logo={LOGO_MITRA.slice(tengah)} arah="kanan" durasi={(LOGO_MITRA.length - tengah) * 3.8} />
      </div>
    </section>
  )
}
