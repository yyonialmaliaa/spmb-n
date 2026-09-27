'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { PanelCari } from './PanelCari'

const BAGIAN = [
  { id: 'tentang', label: 'Tentang' },
  { id: 'jenjang', label: 'Jenjang' },
  { id: 'alur', label: 'SPMB' },
  { id: 'jadwal', label: 'Jadwal' },
  { id: 'biaya', label: 'Biaya' },
  { id: 'persyaratan', label: 'Persyaratan' },
]

/**
 * Navigasi utama.
 *
 * Di atas foto hero: lambang dan nama di tengah diapit garis emas tipis,
 * tombol menu & pencarian di ujung kanan, lalu enam tautan berjajar di
 * tengah pada baris kedua. Begitu pengguna mulai menggulir, ia merapat
 * menjadi satu baris ringkas berlatar dengan garis rambut di bawahnya.
 */
export function Navigation() {
  const [lengket, setLengket] = useState(false)
  const [panelBuka, setPanelBuka] = useState(false)
  const tutupPanel = useCallback(() => setPanelBuka(false), [])
  const pathname = usePathname()

  // Bagian-bagian ini (#tentang, #jenjang, dst.) hanya dirender di halaman
  // utama /spmb. Di halaman lain (mis. detail jenjang) id yang sama tidak
  // ada, jadi tautannya diarahkan ke "/spmb#bagian" — Next.js menggulir ke
  // bagian itu begitu halamannya terbuka.
  const diLandingUtama = pathname === '/spmb'

  useEffect(() => {
    // Ambangnya rendah supaya perubahannya terasa segera setelah bergerak,
    // bukan setelah satu layar penuh terlewat.
    const cek = () => setLengket(window.scrollY > 40)
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
      <header className={`lp-nav${lengket ? ' is-lengket' : ''}`}>
        <span className="lp-nav-garis lp-nav-kiri" aria-hidden="true" />

        <Link href="/spmb" className="lp-nav-merek" aria-label="Beranda SPMB Citra Negara">
          {/* Logo yayasan (lebar, ±2,5:1); tingginya diatur di landing.css. */}
          <Image src="/images/logo-yatkj.png" alt="" width={900} height={362} priority />
          <span>Citra Negara</span>
        </Link>

        <div className="lp-nav-kanan">
          <span className="lp-nav-garis" aria-hidden="true" />
          <button
            type="button"
            className="lp-nav-cari"
            aria-label="Buka menu dan pencarian"
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

        <nav className="lp-nav-tautan" aria-label="Navigasi halaman">
          {BAGIAN.map(b => (
            diLandingUtama
              ? <a key={b.id} href={`#${b.id}`}>{b.label}</a>
              : <Link key={b.id} href={`/spmb#${b.id}`}>{b.label}</Link>
          ))}
        </nav>
      </header>

      {panelBuka && (
        <PanelCari
          tutup={tutupPanel}
          menu={BAGIAN.map(b => ({ judul: b.label, href: `/spmb#${b.id}` }))}
        />
      )}
    </>
  )
}
