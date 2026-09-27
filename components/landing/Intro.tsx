import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

/** Deret foto kegiatan di belakang kartu, kiri → kanan. Yang di tengah
 *  sebagian besar tertutup kartu, jadi foto-foto terkuat ada di kedua sisi. */
const DERET = [
  { src: '/images/cn beersholawat-248.jpg', alt: 'Pengibaran bendera pada upacara 17 Agustus' },
  { src: '/images/AWS06943.jpg', alt: 'Penampilan peserta didik pada acara Citra Negara Bersholawat' },
  { src: '/images/17agst-81.jpg', alt: 'Penampilan band peserta didik' },
  { src: '/images/cn beersholawat-171.jpg', alt: 'Peserta didik mengikuti upacara 17 Agustus' },
  { src: '/images/AWS03561.jpg', alt: 'Kegiatan kepramukaan peserta didik' },
  { src: '/images/AWS06417.jpg', alt: 'Grup hadroh pada acara Citra Negara Bersholawat' },
  { src: '/images/AWS05503.jpg', alt: 'Barisan peserta didik pada peringatan 17 Agustus' },
  { src: '/images/cn beersholawat-263.jpg', alt: 'Tim bola basket putri' },
  { src: '/images/HLB-73.jpg', alt: 'Barisan upacara peringatan 17 Agustus' },
  { src: '/images/AWS04610.jpg', alt: 'Tim bola voli dengan medali kejuaraan' },
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
          <Image 
  src={f.src} 
  alt="" 
  fill 
  sizes="(max-width: 720px) 50vw, (max-width: 1024px) 23vw, 25vw"
  quality={100}
  style={{ objectFit: 'cover' }} 
/>
          </div>
        ))}
      </div>

      <div className="lp-intro-kartu">
        <p className="lp-intro-label lp-intro-muncul">Citra Negara</p>
        <h2 id="lp-intro-judul" className="lp-intro-judul lp-intro-muncul">
          Temukan Potensi. Kembangkan Diri. Raih Masa Depan.
        </h2>
        <p className="lp-intro-teks lp-intro-muncul">
         Saatnya memilih lingkungan pendidikan yang mendukung langkah Anda untuk berkembang dan meraih cita-cita.
        </p>
        <p className="lp-intro-teks lp-intro-muncul">
        Citra Negara menaungi SMP, SMA, dan SMK dengan lingkungan belajar yang mendorong peserta didik untuk berprestasi, berkarya, dan mempersiapkan diri menghadapi masa depan.
        </p>
         <p className="lp-intro-teks lp-intro-muncul">
        Mari bergabung dan jadilah bagian dari keluarga besar Citra Negara.
         </p>
         
        <Link href="/register" className="lp-intro-tombol">
          Daftar Sekarang
          <span className="lp-intro-tombol-panah" aria-hidden="true"><ArrowRight size={16} /></span>
        </Link>
      </div>
    </section>
  )
}
