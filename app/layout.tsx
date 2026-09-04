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

export const metadata: Metadata = {
  title: 'SMK Citra Negara - Sekolah Menengah Kejuruan Unggulan',
  description: 'SMK Citra Negara - Mencetak generasi profesional dan berkarakter.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" data-scroll-behavior="smooth" className={inter.variable}>
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
