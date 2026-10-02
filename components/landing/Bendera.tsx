import type { Bahasa } from './i18n/bahasa'

/**
 * Bendera tiap bahasa sebagai SVG persegi — dipotong bulat oleh CSS
 * pembungkusnya. Digambar langsung (bukan berkas gambar) supaya tajam di
 * ukuran berapa pun, dan tanpa id internal supaya aman dipasang berkali-kali
 * di satu halaman.
 *
 * Bendera yang lambangnya tidak di tengah dipusatkan ulang lewat viewBox:
 * Inggris dipotong bagian tengahnya, Turki digeser ke bulan-bintangnya.
 */
const ATRIBUT = {
  xmlns: 'http://www.w3.org/2000/svg',
  preserveAspectRatio: 'xMidYMid slice',
  'aria-hidden': true,
  focusable: false,
} as const

export function Bendera({ kode, className }: { kode: Bahasa; className?: string }) {
  switch (kode) {
    case 'id':
      return (
        <svg {...ATRIBUT} className={className} viewBox="0 0 30 30">
          <rect width="30" height="15" fill="#E70011" />
          <rect y="15" width="30" height="15" fill="#FFFFFF" />
        </svg>
      )
    case 'en':
      // Union Jack 60×30, diambil kotak tengahnya.
      return (
        <svg {...ATRIBUT} className={className} viewBox="15 0 30 30">
          <rect width="60" height="30" fill="#012169" />
          <path d="M0,0L60,30M60,0L0,30" stroke="#FFFFFF" strokeWidth="6" />
          <path
            fill="#C8102E"
            d="M0,0L30,15L29.106,16.789L-0.894,1.789ZM60,30L30,15L30.894,13.211L60.894,28.211ZM60,0L30,15L29.106,13.211L59.106,-1.789ZM0,30L30,15L30.894,16.789L0.894,31.789Z"
          />
          <path d="M30,0V30M0,15H60" stroke="#FFFFFF" strokeWidth="10" />
          <path d="M30,0V30M0,15H60" stroke="#C8102E" strokeWidth="6" />
        </svg>
      )
    case 'ja':
      return (
        <svg {...ATRIBUT} className={className} viewBox="0 0 30 30">
          <rect width="30" height="30" fill="#FFFFFF" />
          <circle cx="15" cy="15" r="8.4" fill="#BC002D" />
        </svg>
      )
    case 'tr':
      // Bendera 1200×800; kotak tampilan dipusatkan ke bulan sabit & bintang.
      return (
        <svg {...ATRIBUT} className={className} viewBox="174 80 640 640">
          <rect width="1200" height="800" fill="#E30A17" />
          <circle cx="425" cy="400" r="200" fill="#FFFFFF" />
          <circle cx="475" cy="400" r="160" fill="#E30A17" />
          <polygon
            fill="#FFFFFF"
            points="583.334,400 764.235,458.779 652.431,304.894 652.431,495.106 764.235,341.221"
          />
        </svg>
      )
    case 'de':
      return (
        <svg {...ATRIBUT} className={className} viewBox="0 0 30 30">
          <rect width="30" height="10" fill="#000000" />
          <rect y="10" width="30" height="10" fill="#DD0000" />
          <rect y="20" width="30" height="10" fill="#FFCE00" />
        </svg>
      )
    case 'ko':
      // Taegukgi: taegeuk di tengah, empat trigram di sudut. Kotak tampilan
      // sedikit diperlebar supaya trigramnya tidak terpotong lingkaran.
      return (
        <svg {...ATRIBUT} className={className} viewBox="-28 -28 56 56">
          <rect x="-28" y="-28" width="56" height="56" fill="#FFFFFF" />
          <g transform="rotate(-56.3099325)">
            <path d="M-6-25H6M-6-22H6M-6-19H6M-6,19H6M-6,22H6M-6,25H6" stroke="#000000" strokeWidth="2" />
            <path d="M0,17V27" stroke="#FFFFFF" strokeWidth="1" />
            <circle r="12" fill="#CD2E3A" />
            <path d="M0-12A6,6 0 0 0 0,0A6,6 0 0 1 0,12A12,12 0 0 1 0-12Z" fill="#0047A0" />
          </g>
          <g transform="rotate(-123.6900675)">
            <path d="M-6-25H6M-6-22H6M-6-19H6M-6,19H6M-6,22H6M-6,25H6" stroke="#000000" strokeWidth="2" />
            <path d="M0-23.5V-20.5M0,17V20.5M0,23.5V26.5" stroke="#FFFFFF" strokeWidth="1" />
          </g>
        </svg>
      )
  }
}
