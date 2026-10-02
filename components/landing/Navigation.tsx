'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { PanelCari } from './PanelCari'
import { PilihBahasaNav } from './PilihBahasaNav'
import { useBahasa } from './i18n/PenyediaBahasa'

const BAGIAN = ['tentang', 'jenjang', 'alur', 'jadwal', 'biaya', 'persyaratan'] as const

/**
 * Navigasi utama.
 *
 * Di atas foto hero: lambang dan nama di tengah diapit garis emas tipis,
 * tombol menu & pencarian di ujung kanan, lalu enam tautan berjajar di
 * tengah pada baris kedua. Begitu pengguna mulai menggulir, ia merapat
 * menjadi satu baris ringkas berlatar dengan garis rambut di bawahnya —
 * dan bendera bahasa aktif muncul di samping tombol menu (PilihBahasaNav),
 * karena cincin bendera "Go Internasional" di hero sudah tidak terlihat.
 *
 * Di HP tinggal satu bilah (seluruh navigasi ada di panel samping): di
 * puncak halaman transparan di atas video dengan logo + nama sekolah; begitu
 * digulir berlatar hijau tua dengan nama sekolah saja. Bilah itu menyingkir
 * saat halaman digulir turun dan kembali begitu digulir naik (kelas
 * is-sembunyi, hanya berlaku di HP — lihat blok "TAMPILAN HP" di landing.css).
 */
export function Navigation() {
  const [lengket, setLengket] = useState(false)
  const [sembunyi, setSembunyi] = useState(false)
  const [panelBuka, setPanelBuka] = useState(false)
  const tutupPanel = useCallback(() => setPanelBuka(false), [])
  const pathname = usePathname()
  const { t } = useBahasa()
  const label = t.nav.tautan

  // Bagian-bagian ini (#tentang, #jenjang, dst.) hanya dirender di halaman
  // utama /spmb. Di halaman lain (mis. detail jenjang) id yang sama tidak
  // ada, jadi tautannya diarahkan ke "/spmb#bagian" — Next.js menggulir ke
  // bagian itu begitu halamannya terbuka.
  const diLandingUtama = pathname === '/spmb'

  useEffect(() => {
    let lalu = window.scrollY
    const cek = () => {
      const y = window.scrollY
      // Ambangnya rendah supaya perubahannya terasa segera setelah bergerak,
      // bukan setelah satu layar penuh terlewat.
      setLengket(y > 40)
      // Arah gulir; getaran kecil (< 5px) diabaikan dan tidak menggeser patokan.
      if (y <= 56) setSembunyi(false)
      else if (y > lalu + 4) setSembunyi(true)
      else if (y < lalu - 4) setSembunyi(false)
      else return
      lalu = y
    }
    cek()
    window.addEventListener('scroll', cek, { passive: true })
    return () => window.removeEventListener('scroll', cek)
  }, [])

  // Kunci gulir halaman selama panel menu & pencarian terbuka.
  useEffect(() => {
    document.body.style.overflow = panelBuka ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [panelBuka])

  return (
    <>
      <header
        className={`lp-nav${lengket ? ' is-lengket' : ''}${sembunyi ? ' is-sembunyi' : ''}`}
        // Fokus keyboard yang masuk ke bilah yang sedang menyingkir memunculkannya.
        onFocus={() => setSembunyi(false)}
      >
        <span className="lp-nav-garis lp-nav-kiri" aria-hidden="true" />

        <Link href="/spmb" className="lp-nav-merek" aria-label={t.nav.beranda}>
          {/* Logo yayasan (lebar, ±2,5:1); tingginya diatur di landing.css. */}
          <Image src="/images/logo-yatkj.png" alt="" width={900} height={362} priority />
          {/* lang="id": nama diri — huruf kapitalnya tidak ikut aturan bahasa
              aktif (di bahasa Turki "Citra" jadi "CİTRA"). */}
          <span lang="id">Citra Negara</span>
        </Link>

        <div className="lp-nav-kanan">
          <span className="lp-nav-garis" aria-hidden="true" />
          <PilihBahasaNav />
          <button
            type="button"
            className="lp-nav-cari"
            aria-label={t.nav.bukaMenu}
            aria-haspopup="dialog"
            aria-expanded={panelBuka}
            onClick={() => setPanelBuka(true)}
          >
            <svg width="38" height="28" viewBox="0 0 38 28" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
              <path d="M2 5h19M2 14h30M2 23h30" />
              <circle cx="28.5" cy="5.5" r="4.2" />
              <path d="M31.6 8.6l3.6 3.6" />
            </svg>
          </button>
        </div>

        <nav className="lp-nav-tautan" aria-label={t.nav.navigasi}>
          {BAGIAN.map(id => (
            diLandingUtama
              ? <a key={id} href={`#${id}`}>{label[id]}</a>
              : <Link key={id} href={`/spmb#${id}`}>{label[id]}</Link>
          ))}
        </nav>
      </header>

      {panelBuka && (
        <PanelCari
          tutup={tutupPanel}
          menu={BAGIAN.map(id => ({ judul: label[id], href: `/spmb#${id}` }))}
        />
      )}
    </>
  )
}
