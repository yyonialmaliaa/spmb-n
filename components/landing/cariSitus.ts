import { JURUSAN_SMK } from '@/lib/labels'
import type { Bahasa } from './i18n/bahasa'
import { KAMUS, type KunciCari } from './i18n/kamus'
import { namaJurusan } from './i18n/data'

// Indeks pencarian situs SPMB. Setiap entri menunjuk ke bagian halaman utama
// (/spmb#…) atau ke halaman lain; `kata` berisi sinonim yang biasa diketik
// calon pendaftar supaya "uang", "cicilan", atau "kapan" tetap menemukan
// bagian yang tepat walau judulnya berbeda.
//
// Judul & keterangan tiap entri ada di kamus bahasa (i18n/kamus), beserta
// kata kunci tambahan bahasa itu. Kata kunci bahasa Indonesia di bawah
// SELALU ikut dicari, apa pun bahasa yang aktif.

export type EntriCari = {
  judul: string
  ket: string
  href: string
  kata: string[]
}

const ENTRI: { kunci: KunciCari; href: string; kata: string[] }[] = [
  { kunci: 'daftar', href: '/spmb/pra-pendaftaran',
    kata: ['daftar', 'pra-pendaftaran', 'pra pendaftaran', 'mendaftar', 'formulir', 'antrean', 'bukti', 'spmb', 'ppdb'] },
  { kunci: 'daftarOnline', href: '/register',
    kata: ['registrasi', 'register', 'buat akun', 'akun', 'online', 'daring', 'pendaftaran online'] },
  { kunci: 'masuk', href: '/login',
    kata: ['masuk', 'login', 'akun', 'status', 'dashboard', 'cek pendaftaran', 'lupa'] },
  { kunci: 'tentang', href: '/spmb#tentang',
    kata: ['tentang', 'profil', 'sekolah', 'yayasan', 'at-taqwa', 'kemiri jaya', 'yatkj', 'citra negara'] },
  { kunci: 'nilai', href: '/spmb#nilai',
    kata: ['nilai', 'mantap', 'mutu', 'amanah', 'nyaman', 'taqwa', 'takwa', 'aktif', 'profesional', 'visi', 'misi', 'karakter'] },
  { kunci: 'jenjang', href: '/spmb#jenjang',
    kata: ['jenjang', 'tingkat', 'smp', 'sma', 'smk', 'sekolah'] },
  { kunci: 'smp', href: '/spmb/jenjang/smp',
    kata: ['smp', 'menengah pertama', 'kelas 7', 'lulusan sd', 'mi'] },
  { kunci: 'sma', href: '/spmb/jenjang/sma',
    kata: ['sma', 'menengah atas', 'mipa', 'ips', 'kelas 10', 'kuliah', 'ptn'] },
  { kunci: 'smk', href: '/spmb/jenjang/smk',
    kata: ['smk', 'kejuruan', 'jurusan', 'program keahlian', 'vokasi', 'kerja'] },
  { kunci: 'kegiatan', href: '/spmb#tentang',
    kata: ['kegiatan', 'ekstrakurikuler', 'ekskul', 'band', 'tari', 'futsal', 'esport', 'paskibra', 'pramuka', 'silat', 'taekwondo', 'olahraga'] },
  { kunci: 'alur', href: '/spmb#alur',
    kata: ['alur', 'cara daftar', 'cara mendaftar', 'langkah', 'tahapan', 'prosedur', 'proses', 'verifikasi'] },
  { kunci: 'jadwal', href: '/spmb#jadwal',
    kata: ['jadwal', 'gelombang', 'tanggal', 'kapan', 'dibuka', 'ditutup', 'periode', 'waktu', 'alumni', 'deadline'] },
  { kunci: 'biaya', href: '/spmb#biaya',
    kata: ['biaya', 'harga', 'uang', 'bayar', 'pembayaran', 'spp', 'cicilan', 'angsuran', 'diskon', 'potongan', 'reguler', 'plus', 'tarif'] },
  { kunci: 'persyaratan', href: '/spmb#persyaratan',
    kata: ['persyaratan', 'syarat', 'berkas', 'dokumen', 'ijazah', 'skl', 'akta', 'akte', 'kelahiran', 'kartu keluarga', 'kk', 'ktp', 'foto', 'upload'] },
  { kunci: 'mengapa', href: '/spmb#mengapa',
    kata: ['mengapa', 'kenapa', 'keunggulan', 'prestasi', 'fasilitas', 'alasan'] },
  { kunci: 'kontak', href: '/spmb#kontak',
    kata: ['kontak', 'hubungi', 'alamat', 'lokasi', 'telepon', 'telp', 'email', 'whatsapp', 'wa', 'bantuan', 'depok'] },
]

/** Tautan cepat yang tampil sebelum pengguna mengetik apa pun. */
const CEPAT: KunciCari[] = ['daftar', 'masuk', 'jadwal', 'biaya', 'persyaratan', 'alur']

const tembolok = new Map<Bahasa, EntriCari[]>()

/** Seluruh entri dalam bahasa `b`; program keahlian SMK disisipkan tepat
 *  setelah entri SMK, seperti urutan semula. */
function entriCari(b: Bahasa): EntriCari[] {
  const ada = tembolok.get(b)
  if (ada) return ada
  const c = KAMUS[b].cari
  const hasil: EntriCari[] = []
  for (const e of ENTRI) {
    const teks = c.entri[e.kunci]
    hasil.push({ judul: teks.judul, ket: teks.ket, href: e.href, kata: [...e.kata, ...teks.kata] })
    if (e.kunci === 'smk') {
      for (const j of JURUSAN_SMK) {
        hasil.push({
          judul: `${j.kode} — ${namaJurusan(j.nama, j.kode, b)}`,
          ket: c.programSmk,
          href: '/spmb/jenjang/smk',
          kata: [j.kode, j.nama, 'jurusan', 'program keahlian', 'smk'],
        })
      }
    }
  }
  tembolok.set(b, hasil)
  return hasil
}

export function tautanCepat(b: Bahasa): { judul: string; href: string }[] {
  return CEPAT.map(k => ({ judul: KAMUS[b].cari.entri[k].judul, href: ENTRI.find(e => e.kunci === k)!.href }))
}

// Huruf apa pun (Latin, kana, kanji, Hangul) dianggap bagian kata; tanda
// diakritik dibuang supaya "ucret" menemukan "ücret" dan "kayit" → "kayıt".
const TANDA = new RegExp('\\p{M}', 'gu')
const BUKAN_KATA = new RegExp('[^\\p{L}\\p{N}]+', 'gu')
const normal = (s: string) =>
  s.toLowerCase().normalize('NFKD').replace(TANDA, '').replace(/ı/g, 'i').replace(/ß/g, 'ss').replace(BUKAN_KATA, ' ').trim()

/**
 * Setiap kata yang diketik harus cocok dengan judul, kata kunci, atau
 * keterangan sebuah entri. Kecocokan di awal kata judul paling diutamakan.
 */
export function cariSitus(kueri: string, b: Bahasa, batas = 8): EntriCari[] {
  const kataKueri = normal(kueri).split(' ').filter(Boolean)
  if (kataKueri.length === 0) return []

  const berskor: { entri: EntriCari; skor: number; urutan: number }[] = []
  entriCari(b).forEach((entri, urutan) => {
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
