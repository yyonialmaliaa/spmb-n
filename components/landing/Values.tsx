'use client'

import { useId, useState } from 'react'
import { Muncul, JudulBaris } from './gerak'

// Enam nilai utama Citra Negara. Urutan ini SENGAJA tetap — ia dipakai
// sebagai penomoran 01–06 yang tampil di layar.
const NILAI = [
  {
    nama: 'Mutu',
    teks: 'Menjaga kualitas dalam pembelajaran, pelayanan, dan setiap pengalaman pendidikan agar peserta didik berkembang secara optimal.',
  },
  {
    nama: 'Amanah',
    teks: 'Menjalankan setiap tanggung jawab dengan jujur, penuh kepercayaan, dan sungguh-sungguh dalam mendampingi peserta didik.',
  },
  {
    nama: 'Nyaman',
    teks: 'Menciptakan lingkungan sekolah yang aman, positif, dan nyaman agar setiap peserta didik dapat belajar dan berkembang dengan baik.',
  },
  {
    nama: 'Taqwa',
    teks: 'Menumbuhkan nilai keimanan dan ketakwaan sebagai landasan dalam membentuk pribadi yang berakhlak dan bertanggung jawab.',
  },
  {
    nama: 'Aktif',
    teks: 'Mendorong peserta didik untuk aktif belajar, berpartisipasi, berkreasi, dan mengembangkan potensi melalui berbagai pengalaman.',
  },
  {
    nama: 'Profesional',
    teks: 'Membangun budaya kerja yang disiplin, kompeten, dan bertanggung jawab dalam memberikan pendidikan dan pelayanan terbaik.',
  },
]

/**
 * Enam nilai utama, sebagai daftar editorial bernomor — bukan kartu.
 *
 * Awalnya hanya nomor + nama yang terlihat. Deskripsi tersembunyi sampai
 * baris itu diklik, dan hanya SATU yang boleh terbuka sekaligus — mengklik
 * baris lain menutup yang sedang terbuka lalu membuka yang baru. Ini
 * disengaja: enam paragraf sekaligus akan membuat section ini terasa seperti
 * daftar FAQ, bukan pernyataan nilai yang tegas.
 *
 * Ekspansinya memakai trik `grid-template-rows: 0fr → 1fr` — animasi tinggi
 * yang mulus tanpa mengukur tinggi lewat JavaScript.
 */
export function Values() {
  const [aktif, setAktif] = useState<number | null>(null)
  const idBase = useId()

  return (
    <section className="lp-bagian">
      <div className="lp-wadah">
        <Muncul>
          <p className="lp-label">Nilai Citra Negara</p>
        </Muncul>
        <div style={{ marginTop: '1.2rem' }}>
          <JudulBaris larik={['Yang kami', 'pegang.']} className="lp-judul-besar" />
        </div>
        <Muncul jeda={0.1}>
          <p className="lp-teks" style={{ marginTop: '1.3rem', maxWidth: '58ch' }}>
            Enam nilai yang menjadi dasar kami dalam mendidik, mendampingi, dan
            bertumbuh bersama.
          </p>
        </Muncul>

        <ul className="lp-pegang-daftar" style={{ listStyle: 'none', margin: '2.4rem 0 0', padding: 0 }}>
          {NILAI.map((n, i) => {
            const no = String(i + 1).padStart(2, '0')
            const terbuka = aktif === i
            const idCaption = `${idBase}-caption-${no}`
            return (
              <Muncul
                as="li"
                key={n.nama}
                jeda={0.16 + i * 0.05}
                className={`lp-pegang-item${terbuka ? ' is-aktif' : ''}`}
              >
                <button
                  type="button"
                  className="lp-pegang-tombol"
                  aria-expanded={terbuka}
                  aria-controls={idCaption}
                  onClick={() => setAktif(terbuka ? null : i)}
                >
                  <span className="lp-pegang-no">{no}</span>
                  <span className="lp-pegang-nama">{n.nama}</span>
                  <span className="lp-pegang-tanda" aria-hidden="true">{terbuka ? '−' : '+'}</span>
                </button>

                <div
                  id={idCaption}
                  role="region"
                  className="lp-pegang-caption"
                  style={{ gridTemplateRows: terbuka ? '1fr' : '0fr' }}
                >
                  {/* Dua lapis, sengaja: elemen GRID ITEM (div ini) harus
                      tanpa padding sendiri supaya bisa menciut sampai 0 —
                      padding & jarak bawahnya dipindah ke <p> di dalamnya.
                      Padding pada grid item ikut dihitung sebagai tinggi
                      minimum baris walau overflow:hidden, jadi kalau
                      dibiarkan di sini captionnya tidak akan pernah benar-
                      benar tertutup (terbukti lewat uji: tersisa ~16px). */}
                  <div className="lp-pegang-caption-teks">
                    <p className="lp-teks lp-pegang-caption-isi">{n.teks}</p>
                  </div>
                </div>
              </Muncul>
            )
          })}
        </ul>
      </div>
    </section>
  )
}
