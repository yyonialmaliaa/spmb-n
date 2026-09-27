import { JURUSAN_SMK } from '@/lib/labels'
import { YAYASAN_INFO } from '@/lib/biaya'

// Indeks pencarian situs SPMB. Setiap entri menunjuk ke bagian halaman utama
// (/spmb#…) atau ke halaman lain; `kata` berisi sinonim yang biasa diketik
// calon pendaftar supaya "uang", "cicilan", atau "kapan" tetap menemukan
// bagian yang tepat walau judulnya berbeda.

export type EntriCari = {
  judul: string
  ket: string
  href: string
  kata: string[]
}

export const ENTRI_CARI: EntriCari[] = [
  { judul: 'Daftar Sekarang', ket: 'Buat akun dan mulai mengisi formulir pendaftaran', href: '/register',
    kata: ['daftar', 'registrasi', 'register', 'buat akun', 'mendaftar', 'formulir', 'pendaftaran online', 'spmb', 'ppdb'] },
  { judul: 'Masuk ke Akun', ket: 'Lanjutkan pendaftaran atau cek status', href: '/login',
    kata: ['masuk', 'login', 'akun', 'status', 'dashboard', 'cek pendaftaran', 'lupa'] },
  { judul: 'Tentang Citra Negara', ket: 'Mengenal sekolah dan yayasan', href: '/spmb#tentang',
    kata: ['tentang', 'profil', 'sekolah', 'yayasan', 'at-taqwa', 'kemiri jaya', 'yatkj', 'citra negara'] },
  { judul: 'Nilai MANTAP', ket: 'Mutu, Amanah, Nyaman, Taqwa, Aktif, Profesional', href: '/spmb#nilai',
    kata: ['nilai', 'mantap', 'mutu', 'amanah', 'nyaman', 'taqwa', 'takwa', 'aktif', 'profesional', 'visi', 'misi', 'karakter'] },
  { judul: 'Jenjang Pendidikan', ket: 'SMP, SMA, dan SMK dalam satu naungan', href: '/spmb#jenjang',
    kata: ['jenjang', 'tingkat', 'smp', 'sma', 'smk', 'sekolah'] },
  { judul: 'SMP Citra Negara', ket: 'Sekolah menengah pertama', href: '/spmb/jenjang/smp',
    kata: ['smp', 'menengah pertama', 'kelas 7', 'lulusan sd', 'mi'] },
  { judul: 'SMA Citra Negara', ket: 'Sekolah menengah atas', href: '/spmb/jenjang/sma',
    kata: ['sma', 'menengah atas', 'mipa', 'ips', 'kelas 10', 'kuliah', 'ptn'] },
  { judul: 'SMK Citra Negara', ket: 'Sekolah menengah kejuruan', href: '/spmb/jenjang/smk',
    kata: ['smk', 'kejuruan', 'jurusan', 'program keahlian', 'vokasi', 'kerja'] },
  ...JURUSAN_SMK.map(j => ({
    judul: `${j.kode} — ${j.nama}`,
    ket: 'Program keahlian SMK',
    href: '/spmb/jenjang/smk',
    kata: [j.kode, j.nama, 'jurusan', 'program keahlian', 'smk'],
  })),
  { judul: 'Kegiatan & Ekstrakurikuler', ket: 'Kehidupan siswa di luar kelas', href: '/spmb#tentang',
    kata: ['kegiatan', 'ekstrakurikuler', 'ekskul', 'band', 'tari', 'futsal', 'esport', 'paskibra', 'pramuka', 'silat', 'taekwondo', 'olahraga'] },
  { judul: 'Alur Pendaftaran', ket: 'Langkah-langkah mendaftar secara daring', href: '/spmb#alur',
    kata: ['alur', 'cara daftar', 'cara mendaftar', 'langkah', 'tahapan', 'prosedur', 'proses', 'verifikasi'] },
  { judul: 'Jadwal SPMB', ket: 'Gelombang dan tanggal pendaftaran', href: '/spmb#jadwal',
    kata: ['jadwal', 'gelombang', 'tanggal', 'kapan', 'dibuka', 'ditutup', 'periode', 'waktu', 'alumni', 'deadline'] },
  { judul: 'Biaya Pendidikan', ket: 'Rincian biaya, potongan, dan cicilan', href: '/spmb#biaya',
    kata: ['biaya', 'harga', 'uang', 'bayar', 'pembayaran', 'spp', 'cicilan', 'angsuran', 'diskon', 'potongan', 'reguler', 'plus', 'tarif'] },
  { judul: 'Persyaratan Pendaftaran', ket: 'Berkas yang perlu disiapkan', href: '/spmb#persyaratan',
    kata: ['persyaratan', 'syarat', 'berkas', 'dokumen', 'ijazah', 'skl', 'akta', 'akte', 'kelahiran', 'kartu keluarga', 'kk', 'ktp', 'foto', 'kip', 'upload'] },
  { judul: 'Mengapa Citra Negara', ket: 'Alasan memilih Citra Negara', href: '/spmb#mengapa',
    kata: ['mengapa', 'kenapa', 'keunggulan', 'prestasi', 'fasilitas', 'alasan'] },
  { judul: 'Kontak & Lokasi', ket: `${YAYASAN_INFO.telp} · ${YAYASAN_INFO.email}`, href: '/spmb#kontak',
    kata: ['kontak', 'hubungi', 'alamat', 'lokasi', 'telepon', 'telp', 'email', 'whatsapp', 'wa', 'bantuan', 'depok'] },
]

/** Tautan cepat yang tampil sebelum pengguna mengetik apa pun. */
export const TAUTAN_CEPAT: { judul: string; href: string }[] = [
  { judul: 'Daftar Sekarang', href: '/register' },
  { judul: 'Masuk ke Akun', href: '/login' },
  { judul: 'Jadwal SPMB', href: '/spmb#jadwal' },
  { judul: 'Biaya Pendidikan', href: '/spmb#biaya' },
  { judul: 'Persyaratan Pendaftaran', href: '/spmb#persyaratan' },
  { judul: 'Alur Pendaftaran', href: '/spmb#alur' },
]

const normal = (s: string) =>
  s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, ' ').trim()

/**
 * Setiap kata yang diketik harus cocok dengan judul, kata kunci, atau
 * keterangan sebuah entri. Kecocokan di awal kata judul paling diutamakan.
 */
export function cariSitus(kueri: string, batas = 8): EntriCari[] {
  const kataKueri = normal(kueri).split(' ').filter(Boolean)
  if (kataKueri.length === 0) return []

  const berskor: { entri: EntriCari; skor: number; urutan: number }[] = []
  ENTRI_CARI.forEach((entri, urutan) => {
    const judul = normal(entri.judul)
    const kataJudul = judul.split(' ')
    const kunci = entri.kata.map(normal)
    const ket = normal(entri.ket)
    let skor = 0
    for (const k of kataKueri) {
      if (kataJudul.some(t => t.startsWith(k))) skor += 3
      else if (judul.includes(k)) skor += 2
      else if (kunci.some(x => x.split(' ').some(t => t.startsWith(k)))) skor += 1.5
      else if (kunci.some(x => x.includes(k)) || ket.includes(k)) skor += 1
      else return
    }
    berskor.push({ entri, skor, urutan })
  })

  return berskor
    .sort((a, b) => b.skor - a.skor || a.urutan - b.urutan)
    .slice(0, batas)
    .map(x => x.entri)
}
