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

// Kelas masuk yang valid untuk pendaftaran PINDAHAN — hanya tingkat 1–2 tiap
// jenjang, tidak boleh masuk di kelas terakhir (9 untuk SMP, 12 untuk SMA/SMK).
export function getKelasMasukOptions(jenjang: JenjangKelas): string[] {
  return jenjang === 'smp' ? ['Kelas 7', 'Kelas 8'] : ['Kelas 10', 'Kelas 11'];
}

// Kelas masuk untuk pendaftaran BARU — selalu tingkat awal jenjang, tidak
// perlu ditanya ke pengguna (tidak ada pilihan lain untuk siswa baru).
export function getKelasMasukBaru(jenjang: JenjangKelas): string {
  return jenjang === 'smp' ? 'Kelas 7' : 'Kelas 10';
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

// Filter baris Harga (field kelas = string lengkap "Kelas N - TIER") supaya
// hanya menampilkan tingkat yang relevan dengan Kelas Masuk yang sudah
// ditentukan — mencegah kombinasi yang saling bertentangan. Kalau tidak ada
// satu pun baris yang cocok dengan tingkat itu (mis. katalog lama belum
// mengikuti format "Kelas N - TIER"), tampilkan semua opsi apa adanya
// daripada menyembunyikan semuanya dan mengunci formulir.
export function filterKelasByTingkat<T extends { kelas: string }>(rows: T[], tingkat: string): T[] {
  const cocok = rows.filter(r => pecahKelasHarga(r.kelas).tingkat === tingkat);
  return cocok.length > 0 ? cocok : rows;
}
