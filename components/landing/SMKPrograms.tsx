'use client'

import Image from 'next/image'
import { Muncul, Lorong } from './gerak'
import type { ProgramKeahlian } from '@/lib/landing'

/**
 * Program keahlian — HANYA milik SMK.
 *
 * Daftarnya datang dari data Harga SMK yang benar-benar terdaftar di tahun
 * ajaran aktif, jadi tidak ada program karangan dan tidak ada program yang
 * tertinggal ketika sekolah menambah atau menutup satu jurusan.
 */
export function SMKPrograms({ program }: { program: ProgramKeahlian[] }) {
  if (program.length === 0) return null

  return (
    <section className="lp-bagian" style={{ paddingBottom: 0 }}>
      <Lorong label="Program keahlian SMK Citra Negara">
        {program.map(p => (
          <article key={p.kode} className="lp-program" style={{ scrollSnapAlign: 'center' }}>
            <div className="lp-program-media">
              <Image
                src={p.gambar}
                alt=""
                fill
                loading="lazy"
                sizes="(max-width: 900px) 72vw, 23rem"
                style={{ objectFit: 'cover' }}
              />
            </div>
            <div className="lp-program-isi">
              <span className="lp-program-kode">{p.kode}</span>
              <h3 className="lp-program-nama">{p.nama}</h3>
            </div>
          </article>
        ))}
      </Lorong>

      <div className="lp-wadah" style={{ paddingBottom: 'clamp(4rem, 8vw, 7rem)' }}>
        <Muncul>
          <p className="lp-teks" style={{ maxWidth: '46ch' }}>
            Program keahlian hanya tersedia pada jenjang SMK. SMP dan SMA
            Citra Negara tidak menggunakan pembagian jurusan.
          </p>
        </Muncul>
      </div>
    </section>
  )
}
