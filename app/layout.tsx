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
      </head>
      <body>
        <TemaProvider>{children}</TemaProvider>
      </body>
    </html>
  );
}
