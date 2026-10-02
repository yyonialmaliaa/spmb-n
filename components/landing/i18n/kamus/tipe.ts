import type { Jenjang } from '@/lib/labels'

/** Entri pencarian situs (panel menu & pencarian). */
export type KunciCari =
  | 'daftar' | 'daftarOnline' | 'masuk' | 'tentang' | 'nilai' | 'jenjang'
  | 'smp' | 'sma' | 'smk' | 'kegiatan' | 'alur' | 'jadwal' | 'biaya'
  | 'persyaratan' | 'mengapa' | 'kontak'

/**
 * Seluruh teks landing page dalam satu bahasa. Bahasa Indonesia (id.ts)
 * adalah naskah aslinya; bahasa lain menerjemahkannya kunci demi kunci.
 * Data dari database (nama gelombang, persyaratan, program keahlian)
 * diterjemahkan terpisah di ../data.ts.
 */
export type Kamus = {
  meta: { judul: string; deskripsi: string }
  /** Label SPMB di hero, tirai pembuka, dan penutup: "{judul} · {tahun(ta)}". */
  label: { judul: string; tahun: (ta: string) => string }
  aksi: {
    daftarSekarang: string
    daftarOnline: string
    masuk: string
    mulaiPra: string
    lihatAlur: string
  }
  nav: {
    tautan: Record<'tentang' | 'jenjang' | 'alur' | 'jadwal' | 'biaya' | 'persyaratan', string>
    beranda: string
    bukaMenu: string
    navigasi: string
    bahasa: string
  }
  /** Tulisan "Go Internasional" di hero — "o"-nya pemilih bahasa. */
  go: { kata: string; petunjuk: string; pilih: string }
  hero: { nilaiAria: string }
  panelNilai: { tutup: string; sebelumnya: string; berikutnya: string }
  intro: { judul: string; paragraf: string[] }
  jenjang: {
    /**
     * Nama tiap jenjang di bahasa ini — di landing page menggantikan
     * "SMP/SMA/SMK" dan "SMP Citra Negara" dari database. `singkat` untuk tab,
     * tulisan raksasa, dan daftar ("Junior High"); `lengkap` untuk judul &
     * kalimat ("Citra Negara Junior High"). Kata panjang boleh diberi tanda
     * pemenggalan lunak (­) di `singkat`, karena tab-nya sempit.
     */
    nama: Record<Jenjang, { singkat: string; lengkap: string }>
    /** Kalimat sebelum tulisan raksasa "CN". */
    chip: string
    chipAria: string
    label: string
    paragraf: string
    cerita: Record<Jenjang, string>
    daftarAria: string
    website: (label: string) => string
    /** Label bab alur yang "dijatuhi" pita emas: "CN · {alurChip}". */
    alurChip: string
    /** Lebar kotak emas label itu, dalam em — mengikuti panjang teksnya. */
    alurChipLebar: number
  }
  alur: {
    judul: string[]
    teks: string
    langkah: { judul: string; teks: string }[]
    lebihSuka: string
  }
  jb: {
    judul: string
    tabAria: string
    sedangBerjalan: string
    potongan: (persen: number) => string
    biayaPendidikan: (label: string) => string
    keterangan: string
    biayaSegera: string
    caption: (label: string) => string
    programKeahlian: string
    tidakTersedia: string
    jalurUmum: string
    gelombangPendaftaran: string
    jadwalMenyusul: string
    jadwalDiumumkan: (label: string) => string
    jalurAlumni: string
    /** Ekor judul jalur alumni (disembunyikan di layar sempit). */
    jalurAlumniEkor: string
    potretAlt: (label: string) => string
    /** Catatan di bawah biaya yang dikonversi dari rupiah (selain bahasa
     *  Indonesia): tanggal kurs, dan bahwa pembayarannya tetap rupiah. */
    kurs: (tanggal: string) => string
  }
  syarat: {
    label: string
    judul: string[]
    seragam: (daftar: string) => string
    beda: string
    tabAria: string
    wajib: string
    bilaAda: string
  }
  mitra: {
    aria: string
    label: string
    judul: string[]
    teks: string
    angka: string
    logoAria: string
    logo: (nama: string) => string
  }
  penutup: { judul: string; formulirLengkap: string; sudahPunyaAkun: string }
  footer: {
    daftarOnline: string
    masukAkun: string
    alur: string
    tautan: string
    terhubung: string
    tautanAria: string
    bcAria: string
    hak: (ta: string) => string
  }
  cari: {
    dialog: string
    tutup: string
    placeholder: string
    aria: string
    hapus: string
    cari: string
    hasil: string
    /** "Tidak ada hasil …, misalnya " — contoh kata menyusul bercetak kuning. */
    kosong: (kueri: string) => string
    contoh: [string, string, string]
    pemisah: string
    atau: string
    akhir: string
    menu: string
    tautanCepat: string
    programSmk: string
    entri: Record<KunciCari, { judul: string; ket: string; kata: string[] }>
  }
  tanggal: { mulai: (t: string) => string; sampai: (t: string) => string }
}
