import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

/** Deret foto kegiatan di belakang kartu, kiri → kanan. Yang di tengah
 *  sebagian besar tertutup kartu, jadi foto-foto terkuat ada di kedua sisi. */
const DERET = [
  { src: '/images/17agst-43.jpg', alt: 'Pengibaran bendera pada upacara 17 Agustus' },
  { src: '/images/cn beersholawat-181.jpg', alt: 'Penampilan peserta didik pada acara Citra Negara Bersholawat' },
  { src: '/images/band.jpg', alt: 'Penampilan band peserta didik' },
  { src: '/images/17agst-55.jpg', alt: 'Peserta didik mengikuti upacara 17 Agustus' },
  { src: '/images/pramuka.jpg', alt: 'Kegiatan kepramukaan peserta didik' },
  { src: '/images/cn beersholawat-52.jpg', alt: 'Grup hadroh pada acara Citra Negara Bersholawat' },
  { src: '/images/17agst-85.jpg', alt: 'Barisan peserta didik pada peringatan 17 Agustus' },
  { src: '/images/basket.jpg', alt: 'Tim bola basket putri' },
  { src: '/images/17agst-66.jpg', alt: 'Barisan upacara peringatan 17 Agustus' },
  { src: '/images/voli.jpg', alt: 'Tim bola voli dengan medali kejuaraan' },
]

/**
 * Bab setelah hero: kartu hijau tua di tengah, di atas deretan foto kegiatan
 * yang lebih pendek dari kartunya (selebar layar, terpotong di kedua tepi).
 *
 * Gerakannya mengikuti posisi gulir (landing.css, blok "HERO → SEBUAH
 * TEMPAT"): foto-foto di belakang kartu berjalan ke samping (ke kiri saat
 * digulir turun, ke kanan saat naik); isi kartu muncul bergiliran — label,
 * judul, paragraf, lalu tombol yang tersingkap dari blur. Tanpa dukungan browser (atau bila
 * pengguna meminta gerak dikurangi) semuanya tampil diam dalam tata letak
 * yang sama.
 */
export function Intro() {
  return (
    <section id="tentang" className="lp-intro" aria-labelledby="lp-intro-judul">
      <div className="lp-intro-deret" aria-hidden="true">
        {DERET.map(f => (
          <div key={f.src} className="lp-intro-foto">
            <Image src={f.src} alt="" fill sizes="(max-width: 720px) 45vw, 19vw" style={{ objectFit: 'cover' }} />
          </div>
        ))}
      </div>

      <div className="lp-intro-kartu">
        <p className="lp-intro-label lp-intro-muncul">Citra Negara</p>
        <h2 id="lp-intro-judul" className="lp-intro-judul lp-intro-muncul">
          Sebuah tempat untuk bertumbuh.
        </h2>
        <p className="lp-intro-teks lp-intro-muncul">
          Citra Negara menaungi tiga jenjang pendidikan — SMP, SMA, dan SMK —
          yang berdiri di atas keyakinan yang sama: setiap peserta didik berhak
          atas ruang untuk mengenali dirinya, mencoba, dan menemukan arah.
        </p>
        <p className="lp-intro-teks lp-intro-muncul">
          Di bawah naungan Yayasan At-Taqwa Kemiri Jaya, kami merawat lingkungan
          belajar yang menuntut sekaligus menopang: cukup menantang untuk membuat
          bertumbuh, cukup hangat untuk membuat betah.
        </p>
        <Link href="/register" className="lp-intro-tombol">
          Daftar Sekarang
          <span className="lp-intro-tombol-panah" aria-hidden="true"><ArrowRight size={16} /></span>
        </Link>
      </div>
    </section>
  )
}
