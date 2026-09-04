// Konfigurasi tampilan status — dipakai bersama oleh Dashboard & halaman
// Pendaftaran supaya label/warna/tahapan selalu konsisten di kedua tempat.
import { CheckCircle, XCircle, RefreshCw } from 'lucide-react';

export const STATUS_CONFIG: Record<string, {
  label: string; color: string; bg: string; border: string; icon: any; step: number; desc: string;
}> = {
  verified: {
    label: 'Sedang Diverifikasi', color: 'var(--adm-info)', bg: 'var(--adm-info-weak)', border: 'var(--adm-info-border)',
    icon: RefreshCw, step: 2, desc: 'Admin sedang memeriksa berkas dan nomor WhatsApp Anda. Harap tunggu.',
  },
  ditolak: {
    label: 'Berkas Ditolak', color: 'var(--adm-danger)', bg: 'var(--adm-danger-weak)', border: 'var(--adm-danger-border)',
    icon: XCircle, step: 1, desc: 'Admin menolak berkas Anda. Silakan perbaiki dan kirim ulang.',
  },
  diterima_berkas: {
    label: 'Diterima', color: 'var(--adm-success)', bg: 'var(--adm-success-weak)', border: 'var(--adm-success-border)',
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
  belum_bayar: { label: 'Belum Bayar', color: 'var(--adm-warning)', bg: 'var(--adm-warning-weak)', border: 'var(--adm-warning-border)' },
  cicilan_berjalan: { label: 'Cicilan Berjalan', color: 'var(--adm-ungu)', bg: 'var(--adm-ungu-weak)', border: 'var(--adm-ungu)' },
  menunggu_verifikasi: { label: 'Menunggu Verifikasi Admin', color: 'var(--adm-info)', bg: 'var(--adm-info-weak)', border: 'var(--adm-info-border)' },
  lunas: { label: 'Lunas', color: 'var(--adm-success)', bg: 'var(--adm-success-weak)', border: 'var(--adm-success-border)' },
  ditolak: { label: 'Ditolak, Silakan Ulangi', color: 'var(--adm-danger)', bg: 'var(--adm-danger-weak)', border: 'var(--adm-danger-border)' },
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
