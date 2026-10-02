// Terjemahan data yang dikelola admin di database: nama gelombang, tipe
// kelas, program keahlian SMK, dan nama berkas persyaratan.
//
// Sengaja COCOK PERSIS (bukan menebak kata kunci): nilai yang dikenali
// diterjemahkan, sedangkan isian baru buatan admin tampil apa adanya dalam
// bahasa Indonesia — lebih baik tidak diterjemahkan daripada diterjemahkan
// salah (mis. "KTP Wali" jangan sampai terbaca "KTP orang tua").

import type { Bahasa } from './bahasa'

type Terjemahan = Partial<Record<Exclude<Bahasa, 'id'>, string>>

const rapikan = (s: string) => s.toLowerCase().replace(/\s+/g, ' ').trim()

/** "Gelombang 2" / "Gelombang Alumni 1" — pola penamaan bawaan seed. */
export function namaGelombang(nama: string, b: Bahasa): string {
  if (b === 'id') return nama
  const alumni = nama.match(/^gelombang\s+alumni\s+(\d+)$/i)
  if (alumni) {
    const n = alumni[1]
    return { en: `Alumni Round ${n}`, ja: `内部進学 第${n}期`, tr: `Mezun ${n}. Dönem`, de: `Alumni-Phase ${n}`, ko: `졸업생 ${n}차` }[b]
  }
  const umum = nama.match(/^gelombang\s+(\d+)$/i)
  if (umum) {
    const n = umum[1]
    return { en: `Round ${n}`, ja: `第${n}期`, tr: `${n}. Dönem`, de: `Phase ${n}`, ko: `${n}차 모집` }[b]
  }
  return nama
}

const TIPE_KELAS: Record<string, Terjemahan> = {
  reguler: { en: 'Regular', ja: 'レギュラー', tr: 'Standart', de: 'Regulär', ko: '일반반' },
  plus: { en: 'Plus', ja: 'プラス', tr: 'Plus', de: 'Plus', ko: '플러스반' },
  biaya: { en: 'Fee', ja: '費用', tr: 'Ücret', de: 'Kosten', ko: '학비' },
}

/** Tipe kelas di tabel biaya ("Reguler", "Plus"). */
export function tipeKelasLokal(tipe: string, b: Bahasa): string {
  if (b === 'id') return tipe
  return TIPE_KELAS[rapikan(tipe)]?.[b] ?? tipe
}

const JURUSAN: Record<string, Terjemahan> = {
  PPLG: { en: 'Software & Game Development', ja: 'ソフトウェア・ゲーム開発', tr: 'Yazılım ve Oyun Geliştirme', de: 'Software- und Spieleentwicklung', ko: '소프트웨어·게임 개발' },
  MPLB: { en: 'Office Management & Business Services', ja: 'オフィス管理・ビジネスサービス', tr: 'Büro Yönetimi ve İş Hizmetleri', de: 'Büromanagement und Geschäftsdienste', ko: '사무 관리·비즈니스 서비스' },
  TJKT: { en: 'Computer Networks & Telecommunications', ja: 'コンピュータネットワーク・通信', tr: 'Bilgisayar Ağları ve Telekomünikasyon', de: 'Computernetzwerke und Telekommunikation', ko: '컴퓨터 네트워크·통신' },
  DKV: { en: 'Visual Communication Design', ja: 'ビジュアルコミュニケーションデザイン', tr: 'Görsel İletişim Tasarımı', de: 'Kommunikationsdesign', ko: '시각 커뮤니케이션 디자인' },
  PH: { en: 'Hospitality', ja: 'ホテル・観光', tr: 'Otelcilik', de: 'Hotellerie', ko: '호텔 관광' },
  BDR: { en: 'Digital Business & Retail', ja: 'デジタルビジネス・小売', tr: 'Dijital İş ve Perakende', de: 'Digital Business und Einzelhandel', ko: '디지털 비즈니스·유통' },
}

/** Nama program keahlian SMK, dicocokkan lewat kodenya ("PPLG"). */
export function namaJurusan(nama: string, kode: string | null, b: Bahasa): string {
  if (b === 'id' || !kode) return nama
  return JURUSAN[kode.toUpperCase()]?.[b] ?? nama
}

const SYARAT: Record<string, Terjemahan> = {
  [rapikan('Ijazah atau Surat Keterangan Lulus (SKL) yang telah dilegalisir')]: {
    en: 'Legalized diploma or certificate of graduation (SKL)',
    ja: '認証済みの卒業証書または卒業証明書（SKL）',
    tr: 'Onaylı diploma veya mezuniyet belgesi (SKL)',
    de: 'Beglaubigtes Abschlusszeugnis oder Abschlussbescheinigung (SKL)',
    ko: '인증된 졸업장 또는 졸업 증명서(SKL)',
  },
  [rapikan('Akte Kelahiran / Surat Keterangan Lahir')]: {
    en: 'Birth certificate or birth registration letter',
    ja: '出生証明書',
    tr: 'Doğum belgesi',
    de: 'Geburtsurkunde oder Geburtsbescheinigung',
    ko: '출생증명서',
  },
  [rapikan('Kartu Keluarga')]: {
    en: 'Family Card (Kartu Keluarga)',
    ja: '家族カード（Kartu Keluarga）',
    tr: 'Aile kartı (Kartu Keluarga)',
    de: 'Familienkarte (Kartu Keluarga)',
    ko: '가족관계 카드(Kartu Keluarga)',
  },
  [rapikan('KTP Ayah dan Ibu')]: {
    en: 'ID cards of both parents (KTP)',
    ja: '父母の身分証明書（KTP）',
    tr: 'Anne ve babanın kimlik kartları (KTP)',
    de: 'Personalausweise beider Eltern (KTP)',
    ko: '부모님 신분증(KTP)',
  },
  [rapikan('Pas Photo Siswa Ukuran 3x4 (Kode Warna #FF0000 atau #0000FF)')]: {
    en: 'Student photo, 3×4 (background #FF0000 or #0000FF)',
    ja: '生徒の証明写真 3×4（背景色 #FF0000 または #0000FF）',
    tr: 'Öğrencinin 3×4 vesikalık fotoğrafı (arka plan #FF0000 veya #0000FF)',
    de: 'Passfoto 3 × 4 (Hintergrund #FF0000 oder #0000FF)',
    ko: '학생 증명사진 3×4(배경색 #FF0000 또는 #0000FF)',
  },
}

/** Nama berkas persyaratan pendaftaran. */
export function namaSyarat(nama: string, b: Bahasa): string {
  if (b === 'id') return nama
  return SYARAT[rapikan(nama)]?.[b] ?? nama
}
