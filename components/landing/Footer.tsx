'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { YAYASAN_INFO } from '@/lib/biaya'

const BAGIAN = [
  { id: 'tentang', label: 'Tentang' },
  { id: 'jenjang', label: 'Jenjang' },
  { id: 'alur', label: 'Alur SPMB' },
  { id: 'jadwal', label: 'Jadwal' },
  { id: 'biaya', label: 'Biaya' },
  { id: 'persyaratan', label: 'Persyaratan' },
]

const JENJANG = [
  { href: '/spmb/jenjang/smp', label: 'SMP Citra Negara' },
  { href: '/spmb/jenjang/sma', label: 'SMA Citra Negara' },
  { href: '/spmb/jenjang/smk', label: 'SMK Citra Negara' },
]

export function Footer({ tahunAjaran }: { tahunAjaran: string | null }) {
  // Sama seperti Navigation: bagian-bagian ini cuma ada di halaman utama
  // /spmb, jadi di halaman lain (detail jenjang) tautannya harus balik ke
  // sana dulu (lihat komentar di Navigation.tsx).
  const diLandingUtama = usePathname() === '/spmb'

  return (
    <footer className="lp-footer">
      <div className="lp-wadah">
        <div className="lp-footer-grid">
          <div>
            <p style={{ fontFamily: 'var(--lp-serif)', fontSize: '1.5rem', color: 'var(--lp-tinta)', margin: 0 }}>
              Citra Negara
            </p>
            <p style={{ fontSize: '0.78rem', letterSpacing: '0.18em', textTransform: 'uppercase', marginTop: '0.5rem' }}>
              SPMB{tahunAjaran ? ` · TA ${tahunAjaran}` : ''}
            </p>
            <p style={{ fontSize: '0.9rem', lineHeight: 1.7, marginTop: '1.4rem', maxWidth: '34ch' }}>
              {YAYASAN_INFO.nama}
              <br />
              {YAYASAN_INFO.alamat}
            </p>
          </div>

          <nav aria-label="Tautan halaman">
            <p style={{ fontSize: '0.72rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--lp-tinta-samar)', marginBottom: '1rem' }}>
              Halaman
            </p>
            <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: '0.65rem', fontSize: '0.92rem' }}>
              {BAGIAN.map(b => (
                <li key={b.id}>
                  {diLandingUtama
                    ? <a href={`#${b.id}`}>{b.label}</a>
                    : <Link href={`/spmb#${b.id}`} scroll={false}>{b.label}</Link>}
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-label="Jenjang dan kontak">
            <p style={{ fontSize: '0.72rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--lp-tinta-samar)', marginBottom: '1rem' }}>
              Jenjang
            </p>
            <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: '0.65rem', fontSize: '0.92rem' }}>
              {JENJANG.map(t => <li key={t.href}><Link href={t.href}>{t.label}</Link></li>)}
            </ul>

            <p style={{ fontSize: '0.72rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--lp-tinta-samar)', margin: '1.8rem 0 1rem' }}>
              Kontak
            </p>
            <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: '0.65rem', fontSize: '0.92rem' }}>
              <li><a href={`mailto:${YAYASAN_INFO.email}`}>{YAYASAN_INFO.email}</a></li>
              <li><a href={`tel:${YAYASAN_INFO.telp.replace(/-/g, '')}`}>{YAYASAN_INFO.telp}</a></li>
            </ul>
          </nav>
        </div>

        <div
          style={{
            marginTop: 'clamp(3rem, 6vw, 5rem)',
            paddingTop: '1.6rem',
            borderTop: '1px solid var(--lp-garis)',
            display: 'flex',
            flexWrap: 'wrap',
            gap: '1rem',
            justifyContent: 'space-between',
            fontSize: '0.82rem',
          }}
        >
          <span>
            © {new Date().getFullYear()} Citra Negara. All rights reserved.
            <br />
            Website developed by Yoni Al&apos;fiani Amalia
          </span>
          <span style={{ display: 'flex', gap: '1.4rem' }}>
            <Link href="/login">Masuk</Link>
            <Link href="/register">Daftar</Link>
          </span>
        </div>
      </div>
    </footer>
  )
}
