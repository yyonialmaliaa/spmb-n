'use client'

import { useEffect, useState } from 'react'
import { useArah } from './JalurMendatar'

// ---------------------------------------------------------------------------
// Penanda kemajuan perjalanan mendatar.
//
// Halaman yang bergerak ke samping perlu memberi tahu dua hal yang di halaman
// biasa sudah dijawab oleh bilah gulir: "saya di mana" dan "masih berapa
// jauh". Tanpa itu, pengunjung tidak tahu apakah halaman ini panjang atau
// pendek, dan berhenti terlalu cepat.
//
// Titik-titiknya juga bisa diklik untuk melompat ke bab mana pun.
// Hanya tampil ketika sumbu utamanya memang mendatar.
// ---------------------------------------------------------------------------

export function Kemajuan({ bab }: { bab: string[] }) {
  const arah = useArah()
  const mendatar = arah === 'mendatar'

  const [maju, setMaju] = useState(0)
  const [kini, setKini] = useState(0)

  useEffect(() => {
    if (!mendatar) return

    let rafId = 0
    const hitung = () => {
      rafId = 0
      const maks = document.documentElement.scrollHeight - window.innerHeight
      setMaju(maks > 0 ? Math.min(Math.max(window.scrollY / maks, 0), 1) : 0)

      // Bab mana yang sedang menempati tengah layar.
      //
      // Dihitung dari POSISI GULIR, bukan dari kotak elemen di layar. Jalur
      // digeser dengan animasi yang mengejar sasaran, jadi kotaknya masih
      // bergerak beberapa saat setelah gulir berhenti — membacanya di situ
      // membuat nomor babnya tertinggal beberapa langkah.
      //
      // Selisih dua kotak (bab dikurangi jalur) aman dipakai karena keduanya
      // terkena transform yang sama, sehingga geserannya saling meniadakan
      // dan yang tersisa adalah posisi bab DI DALAM jalur.
      const rel = document.querySelector<HTMLElement>('.lp-jalur')
      const daftar = [...document.querySelectorAll<HTMLElement>('.lp-bab')]
      if (!rel || daftar.length === 0) return
      const dasar = rel.getBoundingClientRect().left
      const titik = window.scrollY + window.innerWidth / 2
      const idx = daftar.findIndex(el => {
        const k = el.getBoundingClientRect()
        const kiri = k.left - dasar
        return titik >= kiri && titik < kiri + k.width
      })
      if (idx >= 0) setKini(idx)
    }
    const jadwalkan = () => { if (!rafId) rafId = requestAnimationFrame(hitung) }

    hitung()
    window.addEventListener('scroll', jadwalkan, { passive: true })
    window.addEventListener('resize', jadwalkan)
    return () => {
      if (rafId) cancelAnimationFrame(rafId)
      window.removeEventListener('scroll', jadwalkan)
      window.removeEventListener('resize', jadwalkan)
    }
  }, [mendatar])

  if (!mendatar) return null

  const lompat = (i: number) => {
    const el = document.querySelectorAll<HTMLElement>('.lp-bab')[i]
    const rel = document.querySelector<HTMLElement>('.lp-jalur')
    if (!el || !rel) return
    // translateX = -scrollY, jadi jarak bab dari awal jalur = posisi gulirnya.
    const geser = el.getBoundingClientRect().left - rel.getBoundingClientRect().left
    window.scrollTo({ top: Math.max(geser, 0), behavior: 'smooth' })
  }

  return (
    <div className="lp-kemajuan">
      {/* Nomor dan nama dibungkus satu keping berlatar buram. Penanda ini
          membentang selebar layar, jadi di titik sambungan ia bisa berada di
          atas bab terang sementara warnanya sudah mengikuti bab gelap —
          kepingnya yang menjamin teksnya tetap terbaca di nada mana pun. */}
      <span className="lp-kemajuan-label">
        <span className="lp-kemajuan-nomor">
          {String(kini + 1).padStart(2, '0')}
          <span className="lp-kemajuan-total"> / {String(bab.length).padStart(2, '0')}</span>
        </span>
        <span className="lp-kemajuan-nama">{bab[kini] ?? ''}</span>
      </span>

      <span className="lp-kemajuan-rel" role="presentation">
        <span className="lp-kemajuan-isi" style={{ transform: `scaleX(${maju})` }} />
      </span>

      <span className="lp-kemajuan-titik">
        {bab.map((nama, i) => (
          <button
            key={nama}
            type="button"
            onClick={() => lompat(i)}
            aria-label={`Ke bab ${nama}`}
            aria-current={i === kini ? 'true' : undefined}
            className={`lp-titik${i === kini ? ' is-kini' : ''}`}
          />
        ))}
      </span>
    </div>
  )
}
