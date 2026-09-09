'use client'

import Image from 'next/image'
import { Muncul, Singkap, JudulBaris } from './gerak'

export function WhyCitraNegara() {
  return (
    <section className="lp-bagian">
      <div className="lp-wadah">
        <div className="lp-editorial lp-editorial--balik">
          <Singkap>
            <div className="lp-bingkai">
              <Image
                src="/images/juaranusabeast.jpg"
                alt="Peserta didik Citra Negara meraih penghargaan kompetisi"
                fill
                loading="lazy"
                sizes="(max-width: 900px) 100vw, 45vw"
                style={{ objectFit: 'cover' }}
              />
            </div>
          </Singkap>

          <div>
            <Muncul>
              <p className="lp-label">Mengapa Citra Negara</p>
            </Muncul>
            <div style={{ marginTop: '1.5rem' }}>
              <JudulBaris larik={['Tiga jenjang.', 'Satu standar.']} className="lp-judul-besar" />
            </div>
            <Muncul jeda={0.12}>
              <p className="lp-teks" style={{ marginTop: '1.8rem', maxWidth: '44ch' }}>
                Berpindah dari SMP ke SMA atau SMK di Citra Negara berarti
                melanjutkan, bukan memulai dari nol. Guru saling mengenal,
                catatan perkembangan berlanjut, dan cara kami mendampingi
                tetap sama.
              </p>
            </Muncul>
            <Muncul jeda={0.2}>
              <p className="lp-teks" style={{ marginTop: '1.3rem', maxWidth: '44ch' }}>
                Pendaftarannya pun satu pintu: satu akun, satu alur, satu
                tempat untuk memantau statusmu dari awal sampai diterima.
              </p>
            </Muncul>
          </div>
        </div>
      </div>
    </section>
  )
}
