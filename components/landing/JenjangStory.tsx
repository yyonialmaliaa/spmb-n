'use client'

import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight } from 'lucide-react'
import { Muncul, JudulBaris, Lorong } from './gerak'
import { GAMBAR_JENJANG } from '@/lib/landing'
import type { Jenjang } from '@/lib/labels'

/**
 * Ringkasan naratif tiap jenjang. Sengaja disimpan di sini dan bukan di
 * database: ini teks pemasaran, bukan data operasional.
 *
 * SMP dan SMA TIDAK menyebut jurusan sama sekali — di sistem ini keduanya
 * memang tidak mengenal program keahlian.
 */
const CERITA: Record<Jenjang, { teks: string }> = {
  smp: { teks: 'Tiga tahun untuk membangun fondasi: kebiasaan belajar, keberanian bertanya, dan kemandirian yang terbawa seumur hidup.' },
  sma: { teks: 'Ruang untuk memperdalam akademik sekaligus menguji minat, hingga pilihan setelah lulus diambil dengan yakin.' },
  smk: { teks: 'Belajar dengan mengerjakan. Kompetensi diasah lewat praktik nyata, siap melangkah ke dunia kerja maupun pendidikan lanjutan.' },
}

export type PanelJenjang = {
  jenjang: Jenjang
  singkat: string
  label: string
}

export function JenjangStory({ daftar }: { daftar: PanelJenjang[] }) {
  return (
    <section id="jenjang" style={{ paddingTop: 'clamp(5rem, 11vw, 11rem)' }}>
      <div className="lp-wadah" style={{ marginBottom: 'clamp(2.5rem, 5vw, 4.5rem)' }}>
        <Muncul>
          <p className="lp-label">Tiga jenjang, satu naungan</p>
        </Muncul>
        <div style={{ marginTop: '1.4rem' }}>
          <JudulBaris larik={['Kenali jenjangmu.']} className="lp-judul-besar" />
        </div>
        <Muncul jeda={0.12}>
          <p className="lp-teks" style={{ marginTop: '1.6rem', maxWidth: '50ch' }}>
            Pilih salah satu untuk membaca lebih jauh — kurikulum, jadwal
            pendaftaran, biaya, dan persyaratannya.
          </p>
        </Muncul>
      </div>

      <Lorong label="Jenjang pendidikan Citra Negara">
        {daftar.map(j => (
          <Link
            key={j.jenjang}
            href={`/spmb/jenjang/${j.jenjang}`}
            className="lp-panel"
            style={{ scrollSnapAlign: 'center' }}
            aria-label={`Pelajari ${j.label}`}
          >
            <div className="lp-panel-media">
              <Image
                src={GAMBAR_JENJANG[j.jenjang]}
                alt=""
                fill
                sizes="(max-width: 900px) 80vw, 46rem"
                style={{ objectFit: 'cover' }}
              />
            </div>
            <div className="lp-panel-isi">
              <h3 className="lp-panel-judul">{j.singkat}</h3>
              <p className="lp-panel-sub">Citra Negara</p>
              <p className="lp-panel-teks">{CERITA[j.jenjang].teks}</p>
              <span className="lp-panel-cta">
                Jelajahi {j.singkat} <ArrowRight size={16} />
              </span>
            </div>
          </Link>
        ))}
      </Lorong>
    </section>
  )
}
