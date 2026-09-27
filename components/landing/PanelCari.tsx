'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { MinusCircle, Search, X, ArrowRight } from 'lucide-react'
import { cariSitus, TAUTAN_CEPAT } from './cariSitus'

/**
 * Panel geser dari kanan: pencarian situs + tautan cepat (dan menu utama di
 * layar sempit, tempat deret tautan navbar disembunyikan).
 *
 * Hasil pencarian yang menunjuk ke bagian halaman yang SEDANG dibuka
 * (/spmb#jadwal ketika sudah di /spmb) digulir langsung ke bagian itu;
 * yang lain berpindah halaman biasa. Dipasang hanya selama terbuka, jadi
 * kolom pencariannya selalu kosong lagi saat dibuka ulang.
 */
export function PanelCari({
  tutup,
  menu,
}: {
  tutup: () => void
  menu: { judul: string; href: string }[]
}) {
  const [kueri, setKueri] = useState('')
  const inputRef = useRef<HTMLInputElement | null>(null)
  const pathname = usePathname()
  const router = useRouter()

  const hasil = useMemo(() => cariSitus(kueri), [kueri])
  const mencari = kueri.trim().length > 0

  useEffect(() => {
    const t = window.setTimeout(() => inputRef.current?.focus(), 60)
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') tutup() }
    document.addEventListener('keydown', onKey)
    return () => { window.clearTimeout(t); document.removeEventListener('keydown', onKey) }
  }, [tutup])

  const pergi = (href: string, e?: React.SyntheticEvent) => {
    const [jalur, bagian] = href.split('#')
    if (bagian && jalur === pathname) {
      e?.preventDefault()
      tutup()
      requestAnimationFrame(() => {
        document.getElementById(bagian)?.scrollIntoView({ behavior: 'smooth' })
        window.history.replaceState(null, '', `#${bagian}`)
      })
      return
    }
    tutup()
    if (!e) router.push(href)
  }

  const kirim = (e: React.FormEvent) => {
    e.preventDefault()
    if (hasil[0]) pergi(hasil[0].href)
  }

  return (
    <>
      <div className="lp-cari-tirai" onClick={tutup} aria-hidden="true" />
      <div className="lp-cari-panel" role="dialog" aria-modal="true" aria-label="Menu dan pencarian">
        <button type="button" className="lp-cari-tutup" onClick={tutup} aria-label="Tutup">
          <X size={30} strokeWidth={1.8} />
        </button>

        <div className="lp-cari-isi">
          <form className="lp-cari-kolom" role="search" onSubmit={kirim}>
            <input
              ref={inputRef}
              type="search"
              value={kueri}
              onChange={e => setKueri(e.target.value)}
              placeholder="Kata kunci"
              aria-label="Cari di situs SPMB"
              autoComplete="off"
            />
            {mencari && (
              <button type="button" className="lp-cari-ikon" onClick={() => { setKueri(''); inputRef.current?.focus() }} aria-label="Hapus kata kunci">
                <MinusCircle size={22} strokeWidth={1.8} />
              </button>
            )}
            <button type="submit" className="lp-cari-ikon" aria-label="Cari">
              <Search size={22} strokeWidth={2.2} />
            </button>
          </form>

          {mencari ? (
            <section aria-live="polite">
              <h2 className="lp-cari-judul">Hasil Pencarian</h2>
              {hasil.length === 0 ? (
                <p className="lp-cari-kosong">
                  Tidak ada hasil untuk &ldquo;{kueri.trim()}&rdquo;. Coba kata lain, misalnya
                  <em> jadwal</em>, <em>biaya</em>, atau <em>persyaratan</em>.
                </p>
              ) : (
                <ul className="lp-cari-daftar">
                  {hasil.map(h => (
                    <li key={h.judul}>
                      <Link href={h.href} onClick={e => pergi(h.href, e)}>
                        <span className="lp-cari-hasil-judul">{h.judul}</span>
                        <span className="lp-cari-hasil-ket">{h.ket}</span>
                        <ArrowRight size={16} className="lp-cari-panah" />
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          ) : (
            <>
              <section className="lp-cari-menu">
                <h2 className="lp-cari-judul">Menu</h2>
                <ul className="lp-cari-daftar">
                  {menu.map(m => (
                    <li key={m.href}>
                      <Link href={m.href} onClick={e => pergi(m.href, e)}>{m.judul}</Link>
                    </li>
                  ))}
                </ul>
              </section>
              <section>
                <h2 className="lp-cari-judul">Tautan Cepat</h2>
                <ul className="lp-cari-daftar">
                  {TAUTAN_CEPAT.map(t => (
                    <li key={t.href}>
                      <Link href={t.href} onClick={e => pergi(t.href, e)}>{t.judul}</Link>
                    </li>
                  ))}
                </ul>
              </section>
            </>
          )}
        </div>
      </div>
    </>
  )
}
