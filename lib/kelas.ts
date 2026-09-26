// Helper murni (client-safe, TIDAK import prisma) seputar "Kelas Masuk"
// (tingkat/grade yang dimasuki) dan "Kelas" (tingkatan program REGULER/PLUS
// dari Panel Harga). Dipakai SAMA PERSIS oleh formulir online
// (app/spmb/daftar) dan formulir offline admin (app/admin/pendaftar/tambah)
// supaya kedua formulir tidak pernah berbeda logika/tampilan.
//
// Baris Harga.kelas berformat "Kelas {tingkat} - {TIER}" (mis. "Kelas 10 -
// REGULER") — satu string ini sekaligus menyimpan tingkat (grade) DAN tier
// program. Kalau ditampilkan mentah sebagai pilihan "Kelas", pengguna terasa
// ditanya tingkat/kelasnya DUA KALI: sekali lewat "Kelas Masuk" (untuk
// pendaftaran pindahan), sekali lagi lewat isi dropdown "Kelas" ini — dan
// keduanya bisa saling bertentangan (mis. Kelas Masuk = Kelas 11, tapi
// dropdown Kelas menampilkan "Kelas 10 - REGULER"). Fungsi di bawah ini
// memecah tingkat & tier supaya UI hanya menanyakan tingkat SEKALI, lalu
// dropdown "Kelas" difilter ke tingkat itu dan hanya menampilkan tier-nya.

export type JenjangKelas = 'smp' | 'sma' | 'smk';

// Semua tingkat tiap jenjang, termasuk kelas terakhir (9 untuk SMP, 12 untuk
// SMA/SMK). Dipakai sebagai pilihan "Kelas Masuk" pendaftaran PINDAHAN dan
// sebagai tingkat tujuan MUTASI (lib/mutasi.ts). Harga tiap tingkat tetap
// wajib ada di Panel Harga — tingkat tanpa harga tampil "belum ada harga".
export function getKelasMasukOptions(jenjang: JenjangKelas): string[] {
  return jenjang === 'smp' ? ['Kelas 7', 'Kelas 8', 'Kelas 9'] : ['Kelas 10', 'Kelas 11', 'Kelas 12'];
}

// Asal sekolah yang ditanyakan: hanya pendaftar SMP BARU yang datang dari
// SD/MI. Pindahan SMP (masuk Kelas 8/9) datang dari SMP/MTs lain, sama
// seperti SMA/SMK. Tipe yang belum dipilih diperlakukan sebagai baru.
export function asalDariSD(jenjang: string | null | undefined, tipePendaftaran: string | null | undefined): boolean {
  return jenjang === 'smp' && tipePendaftaran !== 'pindahan';
}

// Kelas masuk untuk pendaftaran BARU — selalu tingkat awal jenjang, tidak
// perlu ditanya ke pengguna (tidak ada pilihan lain untuk siswa baru).
export function getKelasMasukBaru(jenjang: JenjangKelas): string {
  return jenjang === 'smp' ? 'Kelas 7' : 'Kelas 10';
}

export interface DataFormulirWajib {
  jenjang?: string | null;
  tipePendaftaran?: string | null;
  kelasMasuk?: string | null;
  kelas?: string | null;
  asalSD?: string | null;
  asalSMP?: string | null;
  namaLengkap?: string | null;
  jenisKelamin?: string | null;
  agama?: string | null;
  noPribadi?: string | null;
  tempatLahir?: string | null;
  tanggalLahir?: string | null;
  alamat?: string | null;
  jurusan?: string | null;
  nik?: string | null;
  alumniSmpCitraNegara?: boolean | null;
  fileIjazah?: string | null;
  fileAkte?: string | null;
  fileKK?: string | null;
  fileKtpOrtu?: string | null;
  fileFoto?: string | null;
}

const kosong = (v: string | null | undefined) => !v || !v.trim();

// Field wajib formulir pendaftaran online (semua kolom bertanda * yang
// tersimpan) — SATU definisi yang dipakai bersama oleh gembok menu &
// dashboard portal siswa, endpoint "Kirim Formulir", dan pembayaran oleh
// siswa, supaya tidak ada tempat yang menganggap formulir "lengkap"
// sementara tempat lain menolaknya. Validasi per langkah di
// app/spmb/daftar harus mencakup semua isian di sini. Mengembalikan label
// yang masih kosong, urut sesuai tampilan formulir, sehingga bisa langsung
// ditampilkan ke pengguna.
export function kekuranganFormulir(p: DataFormulirWajib): string[] {
  const dariSD = asalDariSD(p.jenjang, p.tipePendaftaran);
  const kurang: string[] = [];
  if (kosong(p.namaLengkap)) kurang.push('Nama lengkap');
  if (kosong(p.noPribadi)) kurang.push('Nomor WhatsApp');
  if (kosong(p.jenisKelamin)) kurang.push('Jenis kelamin');
  if (kosong(p.agama)) kurang.push('Agama');
  if (kosong(p.tempatLahir)) kurang.push('Tempat lahir');
  if (kosong(p.tanggalLahir)) kurang.push('Tanggal lahir');
  if (!p.nik || p.nik.length !== 16) kurang.push('NIK (16 digit)');
  if (kosong(p.alamat)) kurang.push('Alamat');
  if (p.tipePendaftaran === 'pindahan' && kosong(p.kelasMasuk)) kurang.push('Kelas masuk');
  if (p.jenjang !== 'smp' && kosong(p.jurusan)) kurang.push('Jurusan');
  if (kosong(p.kelas)) kurang.push('Kelas');
  if (dariSD ? kosong(p.asalSD) : kosong(p.asalSMP)) kurang.push(dariSD ? 'Asal SD/MI' : 'Asal SMP/MTs');
  // null = belum dijawab; false = sudah dijawab "Tidak".
  if (p.jenjang !== 'smp' && (p.alumniSmpCitraNegara === null || p.alumniSmpCitraNegara === undefined)) kurang.push('Status alumni SMP Citra Negara');
  return [...kurang, ...kekuranganBerkas(p)];
}

// Hanya berkas wajib yang belum diupload — yang ditampilkan ke pendaftar di
// Dashboard (isian data cukup diarahkan ke formulir, tidak dirinci satu-satu).
export function kekuranganBerkas(p: DataFormulirWajib): string[] {
  const kurang: string[] = [];
  if (!p.fileIjazah) kurang.push('Ijazah/SKL');
  if (!p.fileAkte) kurang.push('Akta Kelahiran');
  if (!p.fileKK) kurang.push('Kartu Keluarga');
  if (!p.fileKtpOrtu) kurang.push('KTP Orang Tua');
  if (!p.fileFoto) kurang.push('Pas Foto');
  return kurang;
}

export function formulirLengkap(p: DataFormulirWajib): boolean {
  return kekuranganFormulir(p).length === 0;
}

// Selama formulir masih draft, menu Pendaftaran/Pembayaran/Dokumen, total
// tagihan, dan pembayaran oleh siswa baru dibuka setelah field wajibnya
// lengkap. Begitu bukan draft lagi (sudah dikirim, sedang diverifikasi,
// ditolak untuk revisi, diterima), portal tidak pernah dikunci ulang —
// walau ada berkas yang sedang diminta revisi.
export function perluLengkapiFormulir(p: DataFormulirWajib & { status?: string | null }): boolean {
  return p.status === 'draft' && !formulirLengkap(p);
}

// Pecah "Kelas 10 - REGULER" jadi { tingkat: "Kelas 10", tier: "REGULER" }.
// Kalau formatnya tidak sesuai pola (data lama/tidak standar), tingkat
// dikembalikan kosong dan tier = string aslinya apa adanya (tidak pernah
// membuang data, hanya gagal memecahnya).
export function pecahKelasHarga(kelasHarga: string): { tingkat: string; tier: string } {
  const idx = kelasHarga.lastIndexOf(' - ');
  if (idx === -1) return { tingkat: '', tier: kelasHarga };
  return { tingkat: kelasHarga.slice(0, idx), tier: kelasHarga.slice(idx + 3) };
}

export function labelTier(tier: string): string {
  if (tier === 'REGULER') return 'Reguler';
  if (tier === 'PLUS') return 'Plus';
  return tier;
}

// Filter baris Harga (field kelas = string lengkap "Kelas N - TIER") ke SATU
// tingkat — mencegah kombinasi yang saling bertentangan. Kalau tingkat itu
// belum punya baris, hasilnya KOSONG (formulir menampilkan "belum ada
// harga"), bukan harga tingkat lain: dropdown program hanya menampilkan
// "Reguler/Plus", jadi pendaftar Kelas 12 yang disodori baris Kelas 10 akan
// ditagih harga Kelas 10 tanpa sadar. Hanya katalog lama yang sama sekali
// belum berformat "Kelas N - TIER" yang ditampilkan apa adanya.
export function filterKelasByTingkat<T extends { kelas: string }>(rows: T[], tingkat: string): T[] {
  const berTingkat = rows.some(r => pecahKelasHarga(r.kelas).tingkat);
  return berTingkat ? rows.filter(r => pecahKelasHarga(r.kelas).tingkat === tingkat) : rows;
}
