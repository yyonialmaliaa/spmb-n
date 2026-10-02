'use client'

import type { ReactNode } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { ChevronsRight } from 'lucide-react'
import { YAYASAN_INFO } from '@/lib/biaya'
import { LOGO_BUSINESS_CENTRE } from './logoMitra'
import { useBahasa } from './i18n/PenyediaBahasa'

const BAGIAN = ['tentang', 'jenjang', 'alur', 'jadwal', 'biaya', 'persyaratan'] as const

// Nomor WhatsApp sekolah (dari nomor telepon) — format wa.me: 62xxxxxxxxxx.
const NOMOR_WA = '62' + YAYASAN_INFO.telp.replace(/\D/g, '').replace(/^0/, '')

const ikon = (d: ReactNode) => (
  <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">{d}</svg>
)

/**
 * Media sosial sekolah. Selama link-nya kosong, ikonnya tetap tampil dan bisa
 * diklik, hanya belum mengarah ke mana pun — tidak error.
 */
const SOSIAL: { kode: string; nama: string; href: string; ikon: ReactNode }[] = [
  {
    kode: 'instagram',
    nama: 'Instagram',
    href: 'https://www.instagram.com/smkcitranegaradepok', // masukkan link Instagram di sini, contoh: 'https://instagram.com/akun'
    ikon: ikon(
      <g fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="3" width="18" height="18" rx="5" />
        <circle cx="12" cy="12" r="4" />
        <circle cx="17.5" cy="6.5" r="0.6" fill="currentColor" />
      </g>,
    ),
  },
  {
    kode: 'tiktok',
    nama: 'TikTok',
    href: '', // masukkan link TikTok di sini
    ikon: ikon(
      <path
        fill="currentColor"
        d="M16.6 5.82A4.28 4.28 0 0 1 15.54 3h-3.09v12.4a2.59 2.59 0 0 1-2.59 2.5c-1.42 0-2.6-1.16-2.6-2.6 0-1.72 1.66-3.01 3.37-2.48V9.66c-3.45-.46-6.47 2.22-6.47 5.64 0 3.33 2.76 5.7 5.69 5.7 3.14 0 5.69-2.55 5.69-5.7V9.01a7.35 7.35 0 0 0 4.3 1.38V7.3s-1.88.09-3.24-1.48z"
      />,
    ),
  },
  {
    kode: 'youtube',
    nama: 'YouTube',
    href: 'https://www.youtube.com/@citranegaratv9070', // masukkan link YouTube di sini
    ikon: ikon(
      <path
        fill="currentColor"
        fillRule="evenodd"
        d="M21.6 7.2a2.5 2.5 0 0 0-1.77-1.77C18.27 5 12 5 12 5s-6.27 0-7.83.43A2.5 2.5 0 0 0 2.4 7.2 26 26 0 0 0 2 12a26 26 0 0 0 .4 4.8 2.5 2.5 0 0 0 1.77 1.77C5.73 19 12 19 12 19s6.27 0 7.83-.43a2.5 2.5 0 0 0 1.77-1.77A26 26 0 0 0 22 12a26 26 0 0 0-.4-4.8zM10 15V9l5.2 3z"
      />,
    ),
  },
  {
    kode: 'whatsapp',
    nama: 'WhatsApp',
    href: `https://wa.me/6281325269477`,
    ikon: ikon(
      <path
        fill="currentColor"
        d="M18.4 5.6A8.9 8.9 0 0 0 12 3a8.94 8.94 0 0 0-7.73 13.42L3 21l4.7-1.23A8.93 8.93 0 0 0 12 20.9h.01A8.94 8.94 0 0 0 18.4 5.6zM12 19.4a7.4 7.4 0 0 1-3.78-1.04l-.27-.16-2.79.73.75-2.72-.18-.28A7.44 7.44 0 1 1 12 19.4zm4.08-5.57c-.22-.11-1.32-.65-1.53-.72-.2-.08-.35-.11-.5.11-.15.22-.58.72-.71.87-.13.15-.26.17-.49.06a6.1 6.1 0 0 1-1.8-1.11 6.74 6.74 0 0 1-1.24-1.55c-.13-.22 0-.34.1-.45.1-.1.22-.26.33-.39.11-.13.15-.22.22-.37.07-.15.04-.28-.02-.39-.06-.11-.5-1.2-.68-1.65-.18-.43-.36-.37-.5-.38h-.43a.82.82 0 0 0-.6.28 2.5 2.5 0 0 0-.78 1.86 4.34 4.34 0 0 0 .91 2.3 9.93 9.93 0 0 0 3.8 3.36c.53.23.95.37 1.27.47.53.17 1.02.15 1.4.09.43-.06 1.32-.54 1.5-1.06.19-.52.19-.97.13-1.06-.05-.1-.2-.15-.42-.26z"
      />,
    ),
  },
]

export function Footer({ tahunAjaran }: { tahunAjaran: string | null }) {
  // Sama seperti Navigation: bagian-bagian ini cuma ada di halaman utama
  // /spmb, jadi di halaman lain (detail jenjang) tautannya harus balik ke
  // sana dulu (lihat komentar di Navigation.tsx).
  const diLandingUtama = usePathname() === '/spmb'
  const { t } = useBahasa()
  // Di footer, tautan bab alur memakai nama lengkapnya ("Alur SPMB").
  const label = { ...t.nav.tautan, alur: t.footer.alur }

  return (
    <footer id="kontak" className="lp-footer">
      <div className="lp-wadah">
        <Image
          src="/images/logo-yatkj.png"
          alt="Yayasan At-Taqwa Kemiri Jaya — Citra Negara"
          width={900}
          height={362}
          className="lp-footer-logo"
        />

        <div className="lp-footer-grid">
          <div>
            <h2 className="lp-footer-judul lp-footer-judul--besar">Citra Negara</h2>
            <address className="lp-footer-alamat">
              <span>{YAYASAN_INFO.nama}</span>
              <span>{YAYASAN_INFO.alamat}</span>
              <a href={`tel:${YAYASAN_INFO.telp.replace(/\D/g, '')}`}>{YAYASAN_INFO.telp}</a>
              <a href={`mailto:${YAYASAN_INFO.email}`}>{YAYASAN_INFO.email}</a>
            </address>
            <Link href="/spmb/pra-pendaftaran" className="lp-footer-tombol">
              {t.aksi.daftarSekarang}
              <ChevronsRight size={18} strokeWidth={2.4} aria-hidden="true" />
            </Link>
          </div>

          <nav aria-label={t.footer.tautanAria}>
            <h2 className="lp-footer-judul">{t.footer.tautan}</h2>
            <ul className="lp-footer-tautan">
              {BAGIAN.map(id => (
                <li key={id}>
                  {diLandingUtama
                    ? <a href={`#${id}`}>{label[id]}</a>
                    : <Link href={`/spmb#${id}`}>{label[id]}</Link>}
                </li>
              ))}
              <li><Link href="/register">{t.footer.daftarOnline}</Link></li>
              <li><Link href="/login">{t.footer.masukAkun}</Link></li>
            </ul>
          </nav>

          <div>
            <h2 className="lp-footer-judul">{t.footer.terhubung}</h2>
            <ul className="lp-footer-sosial">
              {SOSIAL.map(s => (
                <li key={s.kode}>
                  <a
                    {...(s.href
                      ? { href: s.href, target: '_blank', rel: 'noopener noreferrer' }
                      : { tabIndex: 0, 'aria-disabled': true })}
                    className={`lp-footer-sosial-ikon lp-footer-sosial-ikon--${s.kode}`}
                    aria-label={s.nama}
                    title={s.nama}
                  >
                    {s.ikon}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <p className="lp-footer-hak">
          © {new Date().getFullYear()} Citra Negara{tahunAjaran ? ` · ${t.footer.hak(tahunAjaran)}` : ''}
          <span> · Website developed by Yoni Al&apos;fiani Amalia</span>
        </p>
      </div>

      {/* Deret paling bawah: business centre. Abu-abu; berwarna saat disorot
          atau diketuk (tabIndex supaya ketukan di HP memberi fokus). */}
      <div className="lp-footer-bc">
        <div className="lp-wadah">
          <ul className="lp-footer-bc-deret" aria-label={t.footer.bcAria}>
            {LOGO_BUSINESS_CENTRE.map(l => (
              <li key={l.src} className="lp-footer-bc-logo" tabIndex={0}>
                <Image src={l.src} alt={`Logo ${l.nama}`} width={l.w} height={l.h} sizes="140px" />
              </li>
            ))}
          </ul>
        </div>
      </div>
    </footer>
  )
}
