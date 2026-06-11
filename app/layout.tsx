import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'SMK Citra Negara - Sekolah Menengah Kejuruan Unggulan',
  description: 'SMK Citra Negara - Mencetak generasi profesional dan berkarakter.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}


