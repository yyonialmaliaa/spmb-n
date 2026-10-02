import { Playfair_Display, Plus_Jakarta_Sans } from 'next/font/google'

// Font landing page SPMB (dipakai landing.css lewat --lp-serif & --lp-sans).
//
// Dulu keduanya dimuat lewat @import Google Fonts di app/globals.css, tetapi
// @import itu terbuang saat CSS dibundel (aturan @font-face Inter dari
// next/font ikut di depannya, sehingga @import tidak lagi di awal berkas dan
// diabaikan browser) — halaman selama ini tampil dengan font cadangan
// (Georgia & font sistem). next/font menyimpan berkasnya di server sendiri
// dan memuatnya tanpa pergeseran tata letak. latin-ext untuk huruf Turki
// (ş, ğ, İ, ı) dan Jerman.
//
// Sengaja hanya dipasang di halaman landing (/spmb dan detail jenjang) —
// pra-pendaftaran, formulir, portal, dan admin tidak berubah.
const serif = Playfair_Display({
  subsets: ['latin', 'latin-ext'],
  style: ['normal', 'italic'],
  variable: '--font-lp-serif',
  display: 'swap',
})

const sans = Plus_Jakarta_Sans({
  subsets: ['latin', 'latin-ext'],
  variable: '--font-lp-sans',
  display: 'swap',
})

/** Kelas untuk elemen .lp-root: mendefinisikan --font-lp-serif & --font-lp-sans. */
export const kelasFontLanding = `${serif.variable} ${sans.variable}`
