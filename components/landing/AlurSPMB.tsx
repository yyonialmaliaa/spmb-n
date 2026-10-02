'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { ArrowRight, ClipboardList, FileDown, FolderCheck, School, ShieldCheck, BadgeCheck, type LucideIcon } from 'lucide-react'
import { Muncul, JudulBaris } from './gerak'
import { useBahasa } from './i18n/PenyediaBahasa'

// Alur utama "Daftar Sekarang" (pra-pendaftaran); pendaftaran online dengan
// akun tetap tersedia sebagai cadangan. Judul & teks tiap langkah ada di kamus
// bahasa (alur.langkah), dengan urutan yang sama dengan ikon di bawah.
const IKON: LucideIcon[] = [ClipboardList, FileDown, FolderCheck, School, ShieldCheck, BadgeCheck]

/**
 * Alur pendaftaran sebagai cerita MENURUN.
 *
 * Berbeda dari bab lain yang deretannya mendatar, bagian ini sengaja dibaca
 * dari atas ke bawah: satu langkah menyusul langkah lain, seperti orang yang
 * benar-benar menjalaninya. Langkah yang sedang berada di tengah layar
 * disorot, dan garis waktu di sebelahnya ikut terisi mengikuti posisi gulir.
 *
 * Sorotan ditentukan IntersectionObserver — bukan hover atau klik — sehingga
 * yang menggerakkannya memang posisi gulir pengguna.
 */
export function AlurSPMB() {
  const [aktif, setAktif] = useState(0)
  const wadah = useRef<HTMLOListElement | null>(null)
  const { t } = useBahasa()
  const langkah = t.alur.langkah
  const nomor = (i: number) => String(i + 1).padStart(2, '0')

  useEffect(() => {
    const el = wadah.current
    if (!el) return
    const baris = Array.from(el.querySelectorAll<HTMLElement>('[data-langkah]'))
    if (baris.length === 0) return

    const io = new IntersectionObserver(
      entri => {
        // Ambil yang paling dekat dengan tengah layar, bukan yang pertama
        // menyentuh tepi — supaya sorotannya terasa mengikuti mata.
        const terlihat = entri.filter(e => e.isIntersecting)
        if (terlihat.length === 0) return
        const tengah = window.innerHeight / 2
        let pilih = -1
        let jarakTerdekat = Infinity
        for (const e of terlihat) {
          const k = e.boundingClientRect
          const jarak = Math.abs(k.top + k.height / 2 - tengah)
          if (jarak < jarakTerdekat) {
            jarakTerdekat = jarak
            pilih = Number((e.target as HTMLElement).dataset.langkah)
          }
        }
        if (pilih >= 0) setAktif(pilih)
      },
      { rootMargin: '-35% 0px -35% 0px', threshold: 0 },
    )
    baris.forEach(b => io.observe(b))
    return () => io.disconnect()
  }, [])

  return (
    // id "alur" & label "Alur SPMB" ada di judul "CN · Alur SPMB" tepat di
    // atas bab ini (JenjangStory.tsx), bukan di sini.
    <section className="lp-bagian lp-alur" aria-label={t.jenjang.alurChip}>
      <div className="lp-wadah">
        <div className="lp-alur-grid">
          {/* Kepala menempel di tempatnya selagi langkah-langkahnya bergulir. */}
          <div className="lp-alur-kepala">
            <div>
              <JudulBaris larik={t.alur.judul} className="lp-judul-besar" />
            </div>
            <Muncul jeda={0.1}>
              <p className="lp-teks" style={{ marginTop: '1.2rem', maxWidth: '34ch' }}>
                {t.alur.teks}
              </p>
            </Muncul>

            <Muncul jeda={0.16}>
              <div className="lp-alur-kemajuan" aria-hidden="true">
                <span className="lp-alur-kemajuan-nomor">{nomor(aktif)}</span>
                <span className="lp-alur-kemajuan-rel">
                  <span
                    className="lp-alur-kemajuan-isi"
                    style={{ transform: `scaleX(${(aktif + 1) / langkah.length})` }}
                  />
                </span>
                <span className="lp-alur-kemajuan-total">{String(langkah.length).padStart(2, '0')}</span>
              </div>
            </Muncul>

            <Muncul jeda={0.22}>
              <Link href="/spmb/pra-pendaftaran" className="lp-tombol lp-tombol--utama" style={{ marginTop: '1.6rem' }}>
                {t.aksi.mulaiPra} <ArrowRight size={16} />
              </Link>
              <p className="lp-teks" style={{ marginTop: '1rem', fontSize: '0.88rem' }}>
                {t.alur.lebihSuka}{' '}
                <Link href="/register" className="lp-tautan" style={{ color: 'var(--lp-hijau)' }}>{t.aksi.daftarOnline}</Link>
              </p>
            </Muncul>
          </div>

          {/* Garis waktu menurun. */}
          <ol className="lp-alur-daftar" ref={wadah}>
            {langkah.map((l, i) => {
              const Ikon = IKON[i] ?? BadgeCheck
              const sudah = i <= aktif
              return (
                <li
                  key={i}
                  data-langkah={i}
                  className={`lp-alur-item${i === aktif ? ' is-aktif' : ''}${sudah ? ' is-lewat' : ''}`}
                >
                  <span className="lp-alur-simpul" aria-hidden="true">
                    <Ikon size={16} />
                  </span>
                  <div className="lp-alur-isi">
                    <span className="lp-alur-no">{nomor(i)}</span>
                    <h3 className="lp-alur-judul">{l.judul}</h3>
                    <p className="lp-alur-teks">{l.teks}</p>
                  </div>
                </li>
              )
            })}
          </ol>
        </div>
      </div>
    </section>
  )
}
