// Bentuk baris "Export Biodata" — SENGAJA murni (tanpa prisma/server-only),
// dipindahkan apa adanya dari components/admin/PendaftarView.tsx supaya bisa
// dipakai dari halaman lain (app/admin/laporan) tanpa mengubah SATU PUN
// kolom/urutan/teksnya. Kalau butuh mengubah isi export biodata, ubah di
// sini — jangan tulis ulang di halaman pemanggil.

export const LABEL_STATUS_VERIFIKASI: Record<string, string> = {
  draft: 'Draft — Belum Dikirim',
  verified: 'Sedang Diverifikasi',
  diterima_berkas: 'Terima Berkas',
  ditolak: 'Tolak Berkas',
}

export const LABEL_STATUS_BAYAR_BIODATA: Record<string, string> = {
  belum_bayar: 'Belum Bayar',
  cicilan_berjalan: 'Angsuran Berjalan',
  menunggu_verifikasi: 'Menunggu Verifikasi',
  lunas: 'Lunas',
  ditolak: 'Ditolak',
  dikembalikan: 'Dikembalikan',
}

export const HEADER_BIODATA = [
  'No', 'Sumber Daftar', 'Status Verifikasi', 'Status Pembayaran', 'Email Akun',
  'Nama Lengkap', 'Nama Panggilan', 'Tempat Lahir', 'Tanggal Lahir', 'Jenis Kelamin', 'Agama', 'Anak Ke',
  'Berat Badan', 'Tinggi Badan', 'Golongan Darah', 'Ukuran Seragam',
  'NIK', 'NISN', 'No. WhatsApp', 'WA Terverifikasi',
  'Alamat', 'RT', 'RW', 'Kelurahan', 'Kecamatan', 'Kab/Kota',
  'Nama Pemberi Referensi', 'No. HP Referensi',
  'Jenjang', 'Jurusan', 'Kelas', 'Tipe Pendaftaran', 'Kelas Masuk (Pindahan)',
  'Asal SD', 'Asal SMP',
  'Nama Ayah', 'TTL Ayah', 'Pendidikan Ayah', 'Pekerjaan Ayah', 'Penghasilan Ayah', 'No. HP Ayah', 'Alamat Ayah',
  'Nama Ibu', 'TTL Ibu', 'Pendidikan Ibu', 'Pekerjaan Ibu', 'Penghasilan Ibu', 'No. HP Ibu', 'Alamat Ibu',
  'Nama Wali', 'TTL Wali', 'Pendidikan Wali', 'Pekerjaan Wali', 'Penghasilan Wali', 'No. HP Wali', 'Alamat Wali',
  'Gelombang', 'Total Tagihan',
  'Sudah Daftar Ulang', 'Tanggal Daftar Ulang', 'Catatan Daftar Ulang',
  'Catatan Admin', 'Alasan Penolakan', 'Pesan Pengumuman',
  'File Ijazah', 'File Akte', 'File KK', 'File KTP Ortu', 'File Foto',
  'Tanggal Daftar',
] as const

export interface PendaftaranBiodata {
  sumberDaftar?: string; status: string; statusPembayaran?: string; userEmail?: string;
  namaLengkap: string | null; namaPanggilan?: string; tempatLahir?: string; tanggalLahir?: string;
  jenisKelamin: string | null; agama: string | null; anakKe?: string;
  beratBadan?: string; tinggiBadan?: string; golonganDarah?: string; ukuranSeragam?: string;
  nik?: string; nisn?: string; noPribadi?: string; waVerified?: boolean;
  alamat: string | null; rt?: string; rw?: string; kelurahan?: string; kecamatan?: string; kabupaten?: string;
  namaPemberiReferensi?: string; noHpReferensi?: string;
  jenjang?: string; jurusan: string | null; kelas?: string; tipePendaftaran?: string; kelasMasuk?: string;
  asalSD?: string; asalSMP?: string; asalSekolah?: string;
  namaAyah?: string; ttlAyah?: string; pendidikanAyah?: string; pekerjaanAyah?: string; penghasilanAyah?: string; noHpAyah?: string; alamatAyah?: string;
  namaIbu?: string; ttlIbu?: string; pendidikanIbu?: string; pekerjaanIbu?: string; penghasilanIbu?: string; noHpIbu?: string; alamatIbu?: string;
  namaWali?: string; ttlWali?: string; pendidikanWali?: string; pekerjaanWali?: string; penghasilanWali?: string; noHpWali?: string; alamatWali?: string;
  gelombang?: string; totalTagihan?: number;
  sudahDaftarUlang?: boolean; tanggalDaftarUlang?: string; catatanDaftarUlang?: string;
  catatan?: string; alasanPenolakan?: string; pesanPengumuman?: string;
  fileIjazah?: string | null; fileAkte?: string | null; fileKK?: string | null; fileKtpOrtu?: string | null; fileFoto?: string | null;
  createdAt: string;
}

export function barisBiodata(p: PendaftaranBiodata, index: number): (string | number)[] {
  return [
    index + 1, (p.sumberDaftar || 'online') === 'online' ? 'Online' : 'Offline',
    LABEL_STATUS_VERIFIKASI[p.status] || p.status, LABEL_STATUS_BAYAR_BIODATA[p.statusPembayaran || 'belum_bayar'] || p.statusPembayaran || '-',
    p.userEmail || '-',
    p.namaLengkap || '-', p.namaPanggilan || '-', p.tempatLahir || '-', p.tanggalLahir || '-', p.jenisKelamin || '-', p.agama || '-', p.anakKe || '-',
    p.beratBadan || '-', p.tinggiBadan || '-', p.golonganDarah || '-', p.ukuranSeragam || '-',
    p.nik || '-', p.nisn || '-', p.noPribadi || '-', p.waVerified ? 'Ya' : 'Belum',
    p.alamat || '-', p.rt || '-', p.rw || '-', p.kelurahan || '-', p.kecamatan || '-', p.kabupaten || '-',
    p.namaPemberiReferensi || '-', p.noHpReferensi || '-',
    (p.jenjang || 'smk').toUpperCase(), p.jurusan || '-', p.kelas || '-', p.tipePendaftaran === 'pindahan' ? 'Pindahan' : 'Baru', p.kelasMasuk || '-',
    p.asalSD || '-', p.asalSMP || p.asalSekolah || '-',
    p.namaAyah || '-', p.ttlAyah || '-', p.pendidikanAyah || '-', p.pekerjaanAyah || '-', p.penghasilanAyah || '-', p.noHpAyah || '-', p.alamatAyah || '-',
    p.namaIbu || '-', p.ttlIbu || '-', p.pendidikanIbu || '-', p.pekerjaanIbu || '-', p.penghasilanIbu || '-', p.noHpIbu || '-', p.alamatIbu || '-',
    p.namaWali || '-', p.ttlWali || '-', p.pendidikanWali || '-', p.pekerjaanWali || '-', p.penghasilanWali || '-', p.noHpWali || '-', p.alamatWali || '-',
    p.gelombang || '-', p.totalTagihan ?? 0,
    p.sudahDaftarUlang ? 'Ya' : 'Belum', p.tanggalDaftarUlang ? new Date(p.tanggalDaftarUlang).toLocaleDateString('id-ID') : '-', p.catatanDaftarUlang || '-',
    p.catatan || '-', p.alasanPenolakan || '-', p.pesanPengumuman || '-',
    p.fileIjazah || '-', p.fileAkte || '-', p.fileKK || '-', p.fileKtpOrtu || '-', p.fileFoto || '-',
    new Date(p.createdAt).toLocaleDateString('id-ID'),
  ]
}
