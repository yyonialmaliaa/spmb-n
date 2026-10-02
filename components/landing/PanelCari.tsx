'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Check, MinusCircle, Search, X, ArrowRight } from 'lucide-react'
import { cariSitus, tautanCepat } from './cariSitus'
import { Bendera } from './Bendera'
import { MEDIA_HP } from './gerak'
import { DAFTAR_BAHASA } from './i18n/bahasa'
import { useBahasa } from './i18n/PenyediaBahasa'

/**
 * Panel geser dari kanan: pencarian situs + tautan cepat (dan menu utama di
 * layar sempit, tempat deret tautan navbar disembunyikan).
 *
 * Hasil pencarian yang menunjuk ke bagian halaman yang SEDANG dibuka
 * (/spmb#jadwal ketika sudah di /spmb) digulir langsung ke bagian itu;
 * yang lain berpindah halaman biasa. Dipasang hanya selama terbuka, jadi
 * kolom pencariannya selalu kosong lagi saat dibuka ulang.
 *
 * Di HP panel ini satu-satunya navigasi (bilah atasnya hanya nama sekolah +
 * tombol menu), jadi pilihan bahasa — yang di layar lebar ada di navbar —
 * ikut di sini, dan kolom pencarian tidak langsung difokus supaya membuka
 * menu tidak memunculkan papan ketik.
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
  const panelRef = useRef<HTMLDivElement | null>(null)
  const pathname = usePathname()
  const router = useRouter()
  const { bahasa, t, aktif: bisaGantiBahasa, ganti: gantiBahasa } = useBahasa()
  const c = t.cari

  const hasil = useMemo(() => cariSitus(kueri, bahasa), [kueri, bahasa])
  const mencari = kueri.trim().length > 0

  useEffect(() => {
    const t = window.setTimeout(() => {
      if (window.matchMedia(MEDIA_HP).matches) panelRef.current?.focus({ preventScroll: true })
      else inputRef.current?.focus()
    }, 60)
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
      <div ref={panelRef} className="lp-cari-panel" role="dialog" aria-modal="true" aria-label={c.dialog} tabIndex={-1}>
        <button type="button" className="lp-cari-tutup" onClick={tutup} aria-label={c.tutup}>
          <X size={30} strokeWidth={1.8} />
        </button>

        <div className="lp-cari-isi">
          <form className="lp-cari-kolom" role="search" onSubmit={kirim}>
            <input
              ref={inputRef}
              type="search"
              value={kueri}
              onChange={e => setKueri(e.target.value)}
              placeholder={c.placeholder}
              aria-label={c.aria}
              autoComplete="off"
            />
            {mencari && (
              <button type="button" className="lp-cari-ikon" onClick={() => { setKueri(''); inputRef.current?.focus() }} aria-label={c.hapus}>
                <MinusCircle size={22} strokeWidth={1.8} />
              </button>
            )}
            <button type="submit" className="lp-cari-ikon" aria-label={c.cari}>
              <Search size={22} strokeWidth={2.2} />
            </button>
          </form>

          {mencari ? (
            <section aria-live="polite">
              <h2 className="lp-cari-judul">{c.hasil}</h2>
              {hasil.length === 0 ? (
                <p className="lp-cari-kosong">
                  {c.kosong(kueri.trim())}
                  <em>{c.contoh[0]}</em>{c.pemisah}<em>{c.contoh[1]}</em>{c.atau}<em>{c.contoh[2]}</em>{c.akhir}
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
                <h2 className="lp-cari-judul">{c.menu}</h2>
                <ul className="lp-cari-daftar">
                  {menu.map(m => (
                    <li key={m.href}>
                      <Link href={m.href} onClick={e => pergi(m.href, e)}>{m.judul}</Link>
                    </li>
                  ))}
                </ul>
              </section>
              <section>
                <h2 className="lp-cari-judul">{c.tautanCepat}</h2>
                <ul className="lp-cari-daftar">
                  {tautanCepat(bahasa).map(tc => (
                    <li key={tc.href}>
                      <Link href={tc.href} onClick={e => pergi(tc.href, e)}>{tc.judul}</Link>
                    </li>
                  ))}
                </ul>
              </section>
              {bisaGantiBahasa && (
                <section className="lp-cari-bahasa">
                  <h2 className="lp-cari-judul">{t.nav.bahasa}</h2>
                  <ul className="lp-cari-bahasa-daftar" aria-label={t.go.pilih}>
                    {DAFTAR_BAHASA.map(b => (
                      <li key={b.kode}>
                        <button
                          type="button"
                          lang={b.kode}
                          aria-current={b.kode === bahasa ? 'true' : undefined}
                          onClick={() => { if (b.kode !== bahasa) gantiBahasa(b.kode) }}
                        >
                          <span className="lp-bendera-bulat"><Bendera kode={b.kode} /></span>
                          <span className="lp-cari-bahasa-nama">{b.nama}</span>
                          {b.kode === bahasa && <Check size={16} strokeWidth={2.4} aria-hidden="true" />}
                        </button>
                      </li>
                    ))}
                  </ul>
                </section>
              )}
            </>
          )}
        </div>
      </div>
    </>
  )
}
