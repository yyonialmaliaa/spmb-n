// Enam nilai utama Citra Negara — huruf pertamanya membentuk semboyan MANTAP.
// Dipakai deret nilai di hero beserta panel penjelasannya (PanelNilai).
// Urutan ini SENGAJA tetap: ia dipakai sebagai penomoran 01–06 di panel.

import type { Bahasa } from './i18n/bahasa'

type Teks = { nama: string; teks: string }

export type NilaiMantap = Teks & {
  /** Foto latar panel penjelasan di hero. */
  foto: string
  /** Titik fokus foto saat dipotong (object-position), bila bukan tengah. */
  posisi?: string
  /** Terjemahan nama & penjelasan untuk bahasa selain Indonesia. */
  terjemahan: Record<Exclude<Bahasa, 'id'>, Teks>
}

/** Nama & penjelasan satu nilai dalam bahasa aktif. */
export function teksNilai(nilai: NilaiMantap, b: Bahasa): Teks {
  return b === 'id' ? nilai : nilai.terjemahan[b]
}

export const NILAI_MANTAP: NilaiMantap[] = [
  {
    nama: 'Mutu',
    teks: 'Menjaga kualitas dalam pembelajaran, pelayanan, dan setiap pengalaman pendidikan agar peserta didik berkembang secara optimal.',
    foto: '/images/bkst sma-107.jpg',
    terjemahan: {
      en: {
        nama: 'Quality',
        teks: 'Upholding quality in teaching, service, and every learning experience so that every student can thrive.',
      },
      ja: {
        nama: '品質',
        teks: '授業、サービス、そしてあらゆる学びの体験において質を大切にし、一人ひとりが最大限に成長できるようにします。',
      },
      tr: {
        nama: 'Kalite',
        teks: 'Her öğrencinin en iyi şekilde gelişebilmesi için öğretimde, hizmette ve her eğitim deneyiminde kaliteyi koruruz.',
      },
      de: {
        nama: 'Qualität',
        teks: 'Wir sichern Qualität im Unterricht, im Service und in jeder Lernerfahrung, damit sich alle bestmöglich entfalten.',
      },
      ko: {
        nama: '품질',
        teks: '수업과 서비스, 모든 교육 경험에서 품질을 지켜 학생 한 명 한 명이 최대한 성장하도록 돕습니다.',
      },
    },
  },
  {
    nama: 'Amanah',
    teks: 'Menjalankan setiap tanggung jawab dengan jujur, penuh kepercayaan, dan sungguh-sungguh dalam mendampingi peserta didik.',
    foto: '/images/revit-111.jpg',
    terjemahan: {
      en: {
        nama: 'Trust',
        teks: 'Carrying out every responsibility honestly, faithfully, and wholeheartedly as we guide our students.',
      },
      ja: {
        nama: '誠実',
        teks: '誠実さと信頼を胸に、一つひとつの責任を真摯に果たしながら生徒に寄り添います。',
      },
      tr: {
        nama: 'Güven',
        teks: 'Öğrencilerimize eşlik ederken her sorumluluğu dürüstlükle, güvenle ve içtenlikle yerine getiririz.',
      },
      de: {
        nama: 'Vertrauen',
        teks: 'Wir erfüllen jede Verantwortung ehrlich, verlässlich und mit ganzem Einsatz, wenn wir junge Menschen begleiten.',
      },
      ko: {
        nama: '신뢰',
        teks: '정직과 신뢰를 바탕으로 모든 책임을 성실히 다하며 학생들과 함께합니다.',
      },
    },
  },
  {
    nama: 'Nyaman',
    teks: 'Menciptakan lingkungan sekolah yang aman, positif, dan nyaman agar setiap peserta didik dapat belajar dan berkembang dengan baik.',
    foto: '/images/17agst-66.jpg',
    terjemahan: {
      en: {
        nama: 'Comfort',
        teks: 'Creating a safe, positive, and welcoming school environment where every student can learn and grow well.',
      },
      ja: {
        nama: '安心',
        teks: 'すべての生徒がのびのびと学び成長できる、安全で前向きな、居心地のよい学校環境をつくります。',
      },
      tr: {
        nama: 'Huzur',
        teks: 'Her öğrencinin iyi öğrenip gelişebileceği güvenli, olumlu ve huzurlu bir okul ortamı oluştururuz.',
      },
      de: {
        nama: 'Geborgenheit',
        teks: 'Wir schaffen ein sicheres, positives und angenehmes Schulumfeld, in dem alle gut lernen und wachsen können.',
      },
      ko: {
        nama: '편안함',
        teks: '모든 학생이 잘 배우고 성장할 수 있도록 안전하고 긍정적이며 편안한 학교 환경을 만듭니다.',
      },
    },
  },
  {
    nama: 'Taqwa',
    teks: 'Menumbuhkan nilai keimanan dan ketakwaan sebagai landasan dalam membentuk pribadi yang berakhlak dan bertanggung jawab.',
    foto: '/images/cn beersholawat-238.jpg',
    terjemahan: {
      en: {
        nama: 'Faith',
        teks: 'Nurturing faith and devotion to God as the foundation for a person of good character and responsibility.',
      },
      ja: {
        nama: '信仰',
        teks: '信仰心と敬虔さを育み、品格と責任感を備えた人間を形づくる土台とします。',
      },
      tr: {
        nama: 'Takva',
        teks: 'İman ve takva değerlerini, güzel ahlaklı ve sorumluluk sahibi bireyler yetiştirmenin temeli olarak geliştiririz.',
      },
      de: {
        nama: 'Glaube',
        teks: 'Wir stärken Glauben und Gottesfurcht als Fundament für einen aufrichtigen, verantwortungsvollen Charakter.',
      },
      ko: {
        nama: '신앙',
        teks: '신앙심과 경건함을 길러 바른 인성과 책임감을 갖춘 사람으로 성장하는 토대로 삼습니다.',
      },
    },
  },
  {
    nama: 'Aktif',
    teks: 'Mendorong peserta didik untuk aktif belajar, berpartisipasi, berkreasi, dan mengembangkan potensi melalui berbagai pengalaman.',
    foto: '/images/AWS07115.jpg',
    posisi: '40% 50%',
    terjemahan: {
      en: {
        nama: 'Active',
        teks: 'Encouraging students to learn actively, take part, create, and develop their potential through a wide range of experiences.',
      },
      ja: {
        nama: '主体性',
        teks: '生徒が主体的に学び、参加し、創造し、さまざまな経験を通して可能性を伸ばせるよう後押しします。',
      },
      tr: {
        nama: 'Aktif',
        teks: 'Öğrencileri aktif öğrenmeye, katılmaya, üretmeye ve farklı deneyimlerle potansiyellerini geliştirmeye teşvik ederiz.',
      },
      de: {
        nama: 'Aktiv',
        teks: 'Wir ermutigen alle, aktiv zu lernen, mitzumachen, kreativ zu sein und ihr Potenzial in vielfältigen Erfahrungen zu entfalten.',
      },
      ko: {
        nama: '적극성',
        teks: '학생들이 적극적으로 배우고 참여하며 창작하고, 다양한 경험을 통해 잠재력을 키우도록 격려합니다.',
      },
    },
  },
  {
    nama: 'Profesional',
    teks: 'Membangun budaya kerja yang disiplin, kompeten, dan bertanggung jawab dalam memberikan pendidikan dan pelayanan terbaik.',
    foto: '/images/jepang indo.jpg',
    terjemahan: {
      en: {
        nama: 'Professional',
        teks: 'Building a disciplined, competent, and responsible work culture to deliver the best education and service.',
      },
      ja: {
        nama: 'プロ意識',
        teks: '規律を重んじ、能力と責任感をもって働く文化を築き、最良の教育とサービスを提供します。',
      },
      tr: {
        nama: 'Profesyonel',
        teks: 'En iyi eğitimi ve hizmeti sunmak için disiplinli, yetkin ve sorumlu bir çalışma kültürü inşa ederiz.',
      },
      de: {
        nama: 'Professionell',
        teks: 'Wir pflegen eine disziplinierte, kompetente und verantwortungsvolle Arbeitskultur für die beste Bildung und den besten Service.',
      },
      ko: {
        nama: '전문성',
        teks: '최고의 교육과 서비스를 위해 규율 있고 유능하며 책임감 있는 업무 문화를 만들어 갑니다.',
      },
    },
  },
]
