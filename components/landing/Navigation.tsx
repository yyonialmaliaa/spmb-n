'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { Menu, X } from 'lucide-react'

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
 * Komposisinya mengikuti kebiasaan situs sekolah editorial: lambang dan nama
 * di kiri, deret tautan bertulis kapital berjarak lega di kanan, lalu satu
 * ajakan yang paling menonjol di ujung. Rendah, lapang, dan tanpa ikon
 * berlebih — yang menahan perhatian adalah halamannya, bukan bilahnya.
 *
 * Di hero ia menyatu dengan gambar; begitu pengguna mulai bergerak, ia
 * berubah menjadi bilah tembus pandang dengan garis rambut di bawahnya.
 */
export function Navigation() {
  const [lengket, setLengket] = useState(false)
  const [menuBuka, setMenuBuka] = useState(false)
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

  // Kunci gulir halaman selama menu layar penuh terbuka.
  useEffect(() => {
    document.body.style.overflow = menuBuka ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [menuBuka])

  return (
    <>
      <header className={`lp-nav${lengket || menuBuka ? ' is-lengket' : ''}`}>
        <Link href="/spmb" className="lp-nav-merek" aria-label="Beranda SPMB Citra Negara">
          {/* Logo yayasan (lebar, ±2,5:1). Tinggi & lebar sama-sama diatur lewat
              style supaya Next tidak memperingatkan "width or height modified,
              but not the other". */}
          <Image
            src="/images/logo-yatkj.png"
            alt=""
            width={900}
            height={362}
            priority
            style={{ height: 40, width: 'auto' }}
          />
          <span>Citra Negara</span>
        </Link>

        <nav className="lp-nav-tautan" aria-label="Navigasi halaman">
          {BAGIAN.map(b => (
            diLandingUtama
              ? <a key={b.id} href={`#${b.id}`}>{b.label}</a>
              : <Link key={b.id} href={`/spmb#${b.id}`}>{b.label}</Link>
          ))}
        </nav>

        <div className="lp-nav-aksi">
          <Link href="/register" className="lp-nav-tombol">Daftar Sekarang</Link>
          <button
            type="button"
            className="lp-nav-hamburger"
            aria-label={menuBuka ? 'Tutup menu' : 'Buka menu'}
            aria-expanded={menuBuka}
            onClick={() => setMenuBuka(v => !v)}
          >
            {menuBuka ? <X size={21} /> : <Menu size={21} />}
          </button>
        </div>
      </header>

      {menuBuka && (
        <nav className="lp-menu" aria-label="Navigasi seluler">
          {BAGIAN.map(b => (
            diLandingUtama
              ? <a key={b.id} href={`#${b.id}`} onClick={() => setMenuBuka(false)}>{b.label}</a>
              : <Link key={b.id} href={`/spmb#${b.id}`} onClick={() => setMenuBuka(false)}>{b.label}</Link>
          ))}
          <Link href="/login" className="lp-menu-masuk" onClick={() => setMenuBuka(false)}>
            Masuk ke Akun
          </Link>
        </nav>
      )}
    </>
  )
}
