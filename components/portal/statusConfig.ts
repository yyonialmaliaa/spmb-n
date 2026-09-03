// Konfigurasi tampilan status — dipakai bersama oleh Dashboard & halaman
// Pendaftaran supaya label/warna/tahapan selalu konsisten di kedua tempat.
import { CheckCircle, XCircle, RefreshCw } from 'lucide-react';

export const STATUS_CONFIG: Record<string, {
  label: string; color: string; bg: string; border: string; icon: any; step: number; desc: string;
}> = {
  verified: {
    label: 'Sedang Diverifikasi', color: '#1E40AF', bg: '#DBEAFE', border: '#BFDBFE',
    icon: RefreshCw, step: 2, desc: 'Admin sedang memeriksa berkas dan nomor WhatsApp Anda. Harap tunggu.',
  },
  ditolak: {
    label: 'Berkas Ditolak', color: '#991B1B', bg: '#FEE2E2', border: '#FECACA',
    icon: XCircle, step: 1, desc: 'Admin menolak berkas Anda. Silakan perbaiki dan kirim ulang.',
  },
  diterima_berkas: {
    label: 'Diterima', color: '#065F46', bg: '#D1FAE5', border: '#A7F3D0',
    icon: CheckCircle, step: 3, desc: 'Selamat! Berkas Anda diterima. Informasi lebih lanjut akan disampaikan melalui WhatsApp.',
  },
};

export const TAHAPAN = [
  { step: 1, label: 'Pendaftaran', sub: 'Submit formulir' },
  { step: 2, label: 'Verifikasi', sub: 'Cek berkas & WA' },
  { step: 3, label: 'Pengumuman', sub: 'Hasil verifikasi' },
];

// Teks "Selanjutnya" — ditampilkan menyatu di dalam card Status Pendaftaran
// (bukan card "Tahapan Selanjutnya" terpisah). Cuma teks ringkas; tombol
// tindakannya sendiri (kalau ada) tetap di card "Yang Perlu Dilakukan" pada
// Dashboard, supaya tidak ada tombol yang tampil dobel di dua tempat.
export function teksSelanjutnya(status: string, sudahDaftarUlang?: boolean): string {
  if (status === 'ditolak') return 'Perbaiki berkas Anda sesuai catatan admin, lalu kirim ulang.';
  if (status === 'verified') return 'Tunggu admin memverifikasi berkas dan nomor WhatsApp Anda.';
  if (status === 'diterima_berkas') {
    return sudahDaftarUlang
      ? 'Tidak ada tindakan lebih lanjut. Selamat bergabung di SMK Citra Negara!'
      : 'Lakukan daftar ulang sesuai informasi yang akan disampaikan melalui WhatsApp.';
  }
  return '';
}

export const STATUS_BAYAR_CONFIG: Record<string, { label: string; color: string; bg: string; border: string }> = {
  belum_bayar: { label: 'Belum Bayar', color: '#92400E', bg: '#FEF3C7', border: '#FDE68A' },
  cicilan_berjalan: { label: 'Cicilan Berjalan', color: '#5B21B6', bg: '#F5F3FF', border: '#DDD6FE' },
  menunggu_verifikasi: { label: 'Menunggu Verifikasi Admin', color: '#1E40AF', bg: '#DBEAFE', border: '#BFDBFE' },
  lunas: { label: 'Lunas', color: '#065F46', bg: '#D1FAE5', border: '#A7F3D0' },
  ditolak: { label: 'Ditolak, Silakan Ulangi', color: '#991B1B', bg: '#FEE2E2', border: '#FECACA' },
};

// Daftar berkas wajib SPMB — dipakai bersama oleh Dashboard, Pendaftaran, dan
// Dokumen supaya nama field & label selalu sama. "wajib: false" untuk KIP
// (section F formulir pendaftaran) — tidak dihitung sebagai kekurangan.
export function daftarBerkas(p: { fileIjazah?: string; fileAkte?: string; fileKK?: string; fileKtpOrtu?: string; fileKip?: string; fileFoto?: string }) {
  return [
    { key: 'ijazah', label: 'Ijazah / SKL', path: p.fileIjazah, wajib: true },
    { key: 'akte', label: 'Akta Kelahiran', path: p.fileAkte, wajib: true },
    { key: 'kk', label: 'Kartu Keluarga', path: p.fileKK, wajib: true },
    { key: 'ktpOrtu', label: 'KTP Orang Tua', path: p.fileKtpOrtu, wajib: true },
    { key: 'kip', label: 'Kartu KIP', path: p.fileKip, wajib: false },
    { key: 'foto', label: 'Pas Foto', path: p.fileFoto, wajib: true },
  ];
}
