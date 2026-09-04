'use client'

import { Moon, Sun } from 'lucide-react'
import { useTema } from './TemaProvider'

/**
 * Tombol ganti tema terang/gelap.
 *
 * `gaya="chip"` menyatu dengan chip lain di header portal; `gaya="ikon"`
 * dipakai di tempat sempit (portal siswa, halaman login).
 */
export function TemaToggle({ gaya = 'chip' }: { gaya?: 'chip' | 'ikon' }) {
  const { tema, gantiTema } = useTema()
  const gelap = tema === 'gelap'
  const label = gelap ? 'Beralih ke tema terang' : 'Beralih ke tema gelap'

  if (gaya === 'ikon') {
    return (
      <button
        onClick={gantiTema}
        aria-label={label}
        title={label}
        style={{
          width: 34, height: 34, borderRadius: 999,
          border: '1px solid var(--adm-border)', background: 'var(--adm-kaca)',
          color: 'var(--adm-text-muted)', cursor: 'pointer',
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        }}
      >
        {gelap ? <Sun size={15} /> : <Moon size={15} />}
      </button>
    )
  }

  return (
    <button onClick={gantiTema} className="adm-chip" aria-label={label} title={label} style={{ cursor: 'pointer', fontFamily: 'inherit' }}>
      {gelap ? <Sun size={13} /> : <Moon size={13} />}
      {gelap ? 'Terang' : 'Gelap'}
    </button>
  )
}
