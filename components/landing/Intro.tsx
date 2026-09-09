'use client'

import Image from 'next/image'
import { Muncul, Singkap, JudulBaris } from './gerak'

/**
 * Bab pembuka setelah hero: sengaja lapang, tanpa kartu.
 * Tipografi besar di kiri, satu foto tegak di kanan.
 */
export function Intro() {
  return (
    <section id="tentang" className="lp-bagian">
      <div className="lp-wadah">
        <div className="lp-editorial">
          <div>
            <Muncul>
              <p className="lp-label">Citra Negara</p>
            </Muncul>

            <div style={{ marginTop: '1.6rem' }}>
              <JudulBaris larik={['Sebuah tempat', 'untuk bertumbuh.']} className="lp-judul-besar" />
            </div>

            <Muncul jeda={0.12}>
              <p className="lp-teks" style={{ marginTop: '2rem', maxWidth: '46ch' }}>
                Citra Negara menaungi tiga jenjang pendidikan — SMP, SMA, dan SMK —
                yang berdiri di atas keyakinan yang sama: setiap peserta didik
                berhak atas ruang untuk mengenali dirinya, mencoba, dan
                menemukan arah.
              </p>
            </Muncul>

            <Muncul jeda={0.2}>
              <p className="lp-teks" style={{ marginTop: '1.4rem', maxWidth: '46ch' }}>
                Di bawah naungan Yayasan At-Taqwa Kemiri Jaya, kami merawat
                lingkungan belajar yang menuntut sekaligus menopang: cukup
                menantang untuk membuat bertumbuh, cukup hangat untuk membuat
                betah.
              </p>
            </Muncul>
          </div>

          <Singkap>
            <div className="lp-bingkai">
              <Image
                src="/images/pramuka.jpg"
                alt="Kegiatan kepramukaan peserta didik Citra Negara"
                fill
                sizes="(max-width: 900px) 100vw, 45vw"
                style={{ objectFit: 'cover' }}
              />
            </div>
          </Singkap>
        </div>
      </div>
    </section>
  )
}
