'use client'

import Image from 'next/image'
import { Muncul, Singkap } from './gerak'

const BAB = [
  {
    kata: 'Belajar.',
    teks: 'Kelas bukan satu-satunya ruang belajar. Laboratorium, lapangan, studio, dan panggung sama-sama mengajar.',
    gambar: '/images/gakuen.jpg',
    alt: 'Kegiatan belajar peserta didik Citra Negara',
  },
  {
    kata: 'Berkarya.',
    teks: 'Dari band hingga tari, dari futsal hingga esport — setiap minat menemukan tempatnya untuk diasah dan ditampilkan.',
    gambar: '/images/band.jpg',
    alt: 'Penampilan band peserta didik Citra Negara',
  },
  {
    kata: 'Bertumbuh.',
    teks: 'Paskibra, pramuka, silat, taekwondo. Disiplin dan keberanian dilatih bukan lewat ceramah, tapi lewat kebiasaan.',
    gambar: '/images/paskibra.jpg',
    alt: 'Latihan paskibra peserta didik Citra Negara',
  },
]

/**
 * Tiga bab pengalaman, bergantian kiri-kanan. Setiap bab: satu kata besar,
 * satu foto besar, satu kalimat penopang.
 */
export function Experience() {
  return (
    <section className="lp-bagian">
      <div className="lp-wadah">
        <Muncul>
          <p className="lp-label">Pengalaman di Citra Negara</p>
        </Muncul>

        <div className="lp-pengalaman" style={{ display: 'grid', gap: 'clamp(4rem, 9vw, 9rem)', marginTop: 'clamp(3rem, 6vw, 5rem)' }}>
          {BAB.map((b, i) => (
            <div key={b.kata} className={`lp-editorial${i % 2 === 1 ? ' lp-editorial--balik' : ''}`}>
              <div>
                <Muncul>
                  <h3 className="lp-judul-raksasa" style={{ fontSize: 'clamp(2.8rem, 6.5vw, 6rem)' }}>
                    {b.kata}
                  </h3>
                </Muncul>
                <Muncul jeda={0.1}>
                  <p className="lp-teks" style={{ marginTop: '1.5rem', maxWidth: '38ch' }}>{b.teks}</p>
                </Muncul>
              </div>

              <Singkap>
                <div className="lp-bingkai lp-bingkai--lebar">
                  <Image
                    src={b.gambar}
                    alt={b.alt}
                    fill
                    loading="lazy"
                    sizes="(max-width: 900px) 100vw, 45vw"
                    style={{ objectFit: 'cover' }}
                  />
                </div>
              </Singkap>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
