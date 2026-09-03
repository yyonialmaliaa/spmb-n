// =====================================================================
// Konfigurasi umum SPMB yang BUKAN angka harga — harga pendidikan
// sekarang sepenuhnya dikelola lewat Panel Harga admin (model Harga di
// prisma/schema.prisma, dibaca lewat /api/harga & lib/keuangan.ts).
// Jangan tambahkan tabel biaya hardcode lagi di sini.
// =====================================================================

export type Jenjang = 'smp' | 'sma' | 'smk';

export const JENJANG_LABEL: Record<Jenjang, string> = {
  smp: 'SMP',
  sma: 'SMA',
  smk: 'SMK',
};

// ---------------------------------------------------------------------
// Info rekening tujuan pembayaran — GANTI dengan data rekening sekolah
// yang sebenarnya sebelum dipakai!
// ---------------------------------------------------------------------
export const BANK_TUJUAN = {
  bank: 'BANK BRI',
  nomorRekening: '00830101404505',
  atasNama: 'YAYASAN AT-TAQWA KEMIRI JAYA',
};

// ---------------------------------------------------------------------
// Info yayasan/sekolah — dipakai di kepala surat kwitansi cetak.
// Sesuaikan lagi kalau ada perubahan alamat/kontak.
// ---------------------------------------------------------------------
export const YAYASAN_INFO = {
  nama: 'YAYASAN AT-TAQWA KEMIRI JAYA',
  alamat: 'Jl. Raya Tanah Baru No.99, Kemiri Jaya, Beji, Depok 16421',
  kota: 'Depok',
  email: 'info@citranegara.sch.id',
  telp: '0813-2526-9477',
};

export function formatRupiah(n: number): string {
  return 'Rp' + n.toLocaleString('id-ID');
}

// ---------------------------------------------------------------------
// Alur Registrasi (dipakai di halaman /spmb/pilih-jenjang) — sesuai alur
// SISTEM INI (semua online, tanpa perlu print/datang ke sekolah kecuali
// saat daftar ulang). Edit teksnya kalau alurnya berubah.
// ---------------------------------------------------------------------
export const ALUR_REGISTRASI = [
  { no: 1, judul: 'Isi Formulir Online', desc: 'Buat akun & isi formulir pendaftaran secara online, upload berkas yang dibutuhkan.' },
  { no: 2, judul: 'Verifikasi Berkas & WhatsApp', desc: 'Admin memeriksa kelengkapan berkas dan memverifikasi nomor WhatsApp aktif Anda.' },
  { no: 3, judul: 'Bayar Biaya Pendaftaran', desc: 'Lakukan pembayaran (offline di sekolah / transfer online) dan upload bukti pembayaran.' },
  { no: 4, judul: 'Proses Seleksi', desc: 'Panitia memproses seleksi berdasarkan berkas dan ketentuan yang berlaku.' },
  { no: 5, judul: 'Pengumuman Hasil', desc: 'Hasil seleksi (lulus/tidak lulus) dapat dilihat langsung di dashboard akun Anda.' },
  { no: 6, judul: 'Daftar Ulang', desc: 'Bagi yang dinyatakan lulus, datang ke sekolah untuk melakukan daftar ulang.' },
];
