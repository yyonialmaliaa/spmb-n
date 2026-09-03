import { redirect } from 'next/navigation';

// Situs ini sekarang khusus untuk SPMB — beranda umum, tentang kami, program
// keahlian, ekstrakurikuler, dan prestasi sudah dihapus. "/" langsung
// diarahkan ke halaman utama SPMB.
export default function Home() {
  redirect('/spmb');
}
