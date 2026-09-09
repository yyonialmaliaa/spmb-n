'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Menu, X } from 'lucide-react'

const TAUTAN = [
  { href: '#tentang', label: 'Tentang' },
  { href: '#jenjang', label: 'Jenjang' },
  { href: '#alur', label: 'SPMB' },
  { href: '#jadwal', label: 'Jadwal' },
  { href: '#biaya', label: 'Biaya' },
  { href: '#persyaratan', label: 'Persyaratan' },
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
          {/* logo.png intrinsiknya 32x27 (bukan persegi). Memaksa 30x30 membuat
              Next mencoba meluruskan rasio lewat CSS `height: auto`, yang lalu
              bentrok dengan aturan override `img[data-nimg]` di globals.css dan
              memicu peringatan dev "width or height modified, but not the
              other". Memakai ukuran asli menghilangkan pertentangan itu sama
              sekali, tanpa mengubah tampilannya (ia memang sudah terlihat
              seukuran ini). */}
          <Image
            src="/images/logo.png"
            alt=""
            width={32}
            height={27}
            style={{ objectFit: 'contain' }}
          />
          <span>Citra Negara</span>
        </Link>

        <nav className="lp-nav-tautan" aria-label="Navigasi halaman">
          {TAUTAN.map(t => <a key={t.href} href={t.href}>{t.label}</a>)}
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
          {TAUTAN.map(t => (
            <a key={t.href} href={t.href} onClick={() => setMenuBuka(false)}>{t.label}</a>
          ))}
          <Link href="/login" className="lp-menu-masuk" onClick={() => setMenuBuka(false)}>
            Masuk ke Akun
          </Link>
        </nav>
      )}
    </>
  )
}
