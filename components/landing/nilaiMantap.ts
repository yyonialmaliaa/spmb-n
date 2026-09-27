// Enam nilai utama Citra Negara — huruf pertamanya membentuk semboyan MANTAP.
// Dipakai deret nilai di hero beserta panel penjelasannya (PanelNilai).
// Urutan ini SENGAJA tetap: ia dipakai sebagai penomoran 01–06 di panel.

export type NilaiMantap = {
  nama: string
  teks: string
  /** Foto latar panel penjelasan di hero. */
  foto: string
  /** Titik fokus foto saat dipotong (object-position), bila bukan tengah. */
  posisi?: string
}

export const NILAI_MANTAP: NilaiMantap[] = [
  {
    nama: 'Mutu',
    teks: 'Menjaga kualitas dalam pembelajaran, pelayanan, dan setiap pengalaman pendidikan agar peserta didik berkembang secara optimal.',
    foto: '/images/bkst sma-107.jpg',
  },
  {
    nama: 'Amanah',
    teks: 'Menjalankan setiap tanggung jawab dengan jujur, penuh kepercayaan, dan sungguh-sungguh dalam mendampingi peserta didik.',
    foto: '/images/revit-111.jpg',
  },
  {
    nama: 'Nyaman',
    teks: 'Menciptakan lingkungan sekolah yang aman, positif, dan nyaman agar setiap peserta didik dapat belajar dan berkembang dengan baik.',
    foto: '/images/17agst-66.jpg',
  },
  {
    nama: 'Taqwa',
    teks: 'Menumbuhkan nilai keimanan dan ketakwaan sebagai landasan dalam membentuk pribadi yang berakhlak dan bertanggung jawab.',
    foto: '/images/cn beersholawat-238.jpg',
  },
  {
    nama: 'Aktif',
    teks: 'Mendorong peserta didik untuk aktif belajar, berpartisipasi, berkreasi, dan mengembangkan potensi melalui berbagai pengalaman.',
    foto: '/images/AWS07115.jpg',
    posisi: '40% 50%',
  },
  {
    nama: 'Profesional',
    teks: 'Membangun budaya kerja yang disiplin, kompeten, dan bertanggung jawab dalam memberikan pendidikan dan pelayanan terbaik.',
    foto: '/images/jepang indo.jpg',
  },
]
