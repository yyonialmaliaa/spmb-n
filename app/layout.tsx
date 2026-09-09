import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { TemaProvider, SKRIP_TEMA } from '@/components/TemaProvider';
import './globals.css';

// Inter dimuat lewat next/font (bukan @import Google Fonts seperti Playfair &
// Plus Jakarta di globals.css) sehingga di-self-host, tidak menghalangi
// render, dan tidak menimbulkan pergeseran layout. Variabelnya dipakai oleh
// .adm-root di app/admin/admin.css; <body> tetap Plus Jakarta Sans supaya
// halaman publik dan portal siswa tidak ikut berubah.
const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

// Anti-kedip tirai pembuka SPMB — dipasang di root layout, BUKAN di
// app/spmb/page.tsx maupun di komponen client Pembuka.tsx.
//
// Dulu skrip ini dirender langsung di dalam JSX halaman /spmb (sebuah
// Server Component). Itu ternyata tetap memicu peringatan React "Encountered
// a script tag while rendering React component": next/script sendiri
// menegaskan bahwa skrip beforeInteractive/inline yang perlu berjalan
// sebelum hydration WAJIB ditempatkan di root layout, bukan di halaman biasa
// — di situ pula (di dalam <head>) SATU-SATUNYA lokasi React tidak
// memperlakukan <script> sebagai bagian dari pohon render biasa (yang kalau
// suatu saat "di-render ulang" lewat commit DOM, bukan diurai browser dari
// HTML mentah, script itu TIDAK akan pernah tereksekusi — persis yang
// diperingatkan React). SKRIP_TEMA di bawah sudah lebih dulu memakai pola
// ini; skrip pembuka ini sekadar mengikutinya.
//
// Dibatasi hanya berjalan di /spmb (bukan seluruh situs) supaya penanda
// "sudah pernah lihat tirai pembuka" tidak ikut tersentuh saat pengunjung
// membuka halaman login/admin/dashboard lebih dulu.
const SKRIP_PEMBUKA = `(function(){try{
if (location.pathname !== '/spmb') return;
var k='spmb-pembuka-tayang';
if(sessionStorage.getItem(k)==='1'){document.documentElement.setAttribute('data-pembuka','lewat')}
else{sessionStorage.setItem(k,'1')}
}catch(x){}})();`

// Metadata di sini berlaku untuk SELURUH situs — SPMB, portal pendaftar, dan
// admin ketiga jenjang. Karena itu penyebutannya tingkat institusi ("Citra
// Negara"), bukan satu jenjang. Sebelumnya tertulis "SMK Citra Negara",
// sehingga halaman SMP dan SMA pun ikut terdeskripsikan sebagai SMK.
// Jenjang yang spesifik disebutkan oleh masing-masing halaman.
export const metadata: Metadata = {
  title: 'SPMB Citra Negara - Penerimaan Murid Baru',
  description: 'Sistem Penerimaan Murid Baru Citra Negara — jenjang SMP, SMA, dan SMK.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="id"
      data-scroll-behavior="smooth"
      className={inter.variable}
      // Skrip anti-kedip di bawah mengubah atribut data-tema pada elemen ini
      // SEBELUM React sempat hydrate (server tidak tahu preferensi tema
      // pengguna). Tanpa suppressHydrationWarning, React membandingkan HTML
      // dari server (tanpa data-tema) dengan DOM yang sudah diubah skrip
      // dan salah menganggapnya sebagai bug — padahal ini memang perilaku
      // yang disengaja. Ini pola resmi yang sama dipakai library next-themes.
      suppressHydrationWarning
    >
      <head>
        {/* Anti-kedip: memasang data-tema sebelum halaman dilukis, sehingga
            pengguna bertema gelap tidak pernah melihat kilatan putih. */}
        <script dangerouslySetInnerHTML={{ __html: SKRIP_TEMA }} />
        {/* Anti-kedip tirai pembuka SPMB — lihat penjelasan SKRIP_PEMBUKA
            di atas untuk kenapa ia harus tinggal di sini. */}
        <script dangerouslySetInnerHTML={{ __html: SKRIP_PEMBUKA }} />
      </head>
      <body>
        <TemaProvider>{children}</TemaProvider>
      </body>
    </html>
  );
}
