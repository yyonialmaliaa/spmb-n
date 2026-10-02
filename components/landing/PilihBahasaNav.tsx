'use client'

import { useEffect, useId, useRef, useState } from 'react'
import { Check } from 'lucide-react'
import { Bendera } from './Bendera'
import { DAFTAR_BAHASA, infoBahasa } from './i18n/bahasa'
import { useBahasa } from './i18n/PenyediaBahasa'

/**
 * Bendera bahasa aktif di navbar — hanya tampil setelah halaman digulir
 * (navbar ringkas), ketika cincin bendera "Go Internasional" di hero sudah
 * tidak terlihat. Diklik → daftar enam bahasa. Di halaman yang tidak
 * diterjemahkan (detail jenjang) tidak dirender sama sekali.
 */
export function PilihBahasaNav() {
  const { bahasa, t, aktif, ganti } = useBahasa()
  const [buka, setBuka] = useState(false)
  const akar = useRef<HTMLDivElement | null>(null)
  const tombol = useRef<HTMLButtonElement | null>(null)
  const idDaftar = useId()

  useEffect(() => {
    if (!buka) return
    const luar = (e: PointerEvent) => {
      if (!akar.current?.contains(e.target as Node)) setBuka(false)
    }
    const esc = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      setBuka(false)
      tombol.current?.focus()
    }
    // Navbar kembali ke bentuk lebar di puncak halaman → daftar ditutup.
    const gulir = () => { if (window.scrollY <= 40) setBuka(false) }
    document.addEventListener('pointerdown', luar)
    document.addEventListener('keydown', esc)
    window.addEventListener('scroll', gulir, { passive: true })
    return () => {
      document.removeEventListener('pointerdown', luar)
      document.removeEventListener('keydown', esc)
      window.removeEventListener('scroll', gulir)
    }
  }, [buka])

  if (!aktif) return null
  const info = infoBahasa(bahasa)

  return (
    <div ref={akar} className="lp-nav-bahasa">
      <button
        ref={tombol}
        type="button"
        className="lp-nav-bahasa-tombol"
        aria-expanded={buka}
        aria-controls={idDaftar}
        aria-label={`${t.nav.bahasa}: ${info.nama}`}
        onClick={() => setBuka(v => !v)}
      >
        <span className="lp-bendera-bulat"><Bendera kode={bahasa} /></span>
        <span className="lp-nav-bahasa-kode" aria-hidden="true">{info.singkat}</span>
      </button>

      {buka && (
        <ul id={idDaftar} className="lp-nav-bahasa-daftar" aria-label={t.go.pilih}>
          {DAFTAR_BAHASA.map(b => (
            <li key={b.kode}>
              <button
                type="button"
                lang={b.kode}
                aria-current={b.kode === bahasa ? 'true' : undefined}
                onClick={() => {
                  setBuka(false)
                  if (b.kode !== bahasa) ganti(b.kode)
                }}
              >
                <span className="lp-bendera-bulat"><Bendera kode={b.kode} /></span>
                <span className="lp-nav-bahasa-nama">{b.nama}</span>
                {b.kode === bahasa && <Check size={16} strokeWidth={2.4} aria-hidden="true" />}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
