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
  /** Terjemahan nama & teks ke berbagai bahasa */
  terjemahan?: {
    en?: { nama: string; teks: string }
    ja?: { nama: string; teks: string }
    tr?: { nama: string; teks: string }
    de?: { nama: string; teks: string }
    ko?: { nama: string; teks: string }
  }
}

export const NILAI_MANTAP: NilaiMantap[] = [
  {
    nama: 'Mutu',
    teks: 'Menjaga kualitas dalam pembelajaran, pelayanan, dan setiap pengalaman pendidikan agar peserta didik berkembang secara optimal.',
    foto: '/images/bkst sma-107.jpg',
    terjemahan: {
      en: {
        nama: 'Quality',
        teks: 'Maintaining excellence in learning, service, and every educational experience so students develop optimally.',
      },
      ja: {
        nama: '質質',
        teks: '学習、サービス、教育経験全体における品質を維持し、生徒が最適に成長するよう支援します。',
      },
      tr: {
        nama: 'Kalite',
        teks: 'Öğrenme, hizmet ve her eğitim deneyiminde kaliteyi koruyarak öğrencilerin optimal şekilde gelişmesini sağlamak.',
      },
      de: {
        nama: 'Qualität',
        teks: 'Qualität in Unterricht, Service und jeder Lernerfahrung bewahren, damit Schüler optimal gedeihen.',
      },
      ko: {
        nama: '품질',
        teks: '학습, 서비스 및 모든 교육 경험에서 품질을 유지하여 학생이 최적으로 발전하도록 합니다.',
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
        teks: 'Fulfilling every responsibility with honesty, full trust, and sincerity in supporting students.',
      },
      ja: {
        nama: '信頼',
        teks: '学生をサポートする際に、誠実さ、信頼、そして真摯さを持つすべての責任を果たします。',
      },
      tr: {
        nama: 'Güven',
        teks: 'Öğrencileri desteklemede dürüstlük, tam güven ve samimiyetle her sorumluluğu yerine getirmek.',
      },
      de: {
        nama: 'Vertrauen',
        teks: 'Jede Verantwortung mit Ehrlichkeit, vollständigem Vertrauen und Aufrichtigkeit bei der Unterstützung von Schülern erfüllen.',
      },
      ko: {
        nama: '신뢰',
        teks: '학생을 지원할 때 정직성, 완전한 신뢰, 성실함으로 모든 책임을 이행합니다.',
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
        teks: 'Creating a safe, positive, and comfortable school environment so every student can learn and develop well.',
      },
      ja: {
        nama: '快適性',
        teks: 'すべての学生が快適に学習できるよう、安全で前向きで快適な学校環境を作成します。',
      },
      tr: {
        nama: 'Konfor',
        teks: 'Her öğrencinin iyi öğrenebileceği güvenli, olumlu ve rahat bir okul ortamı yaratmak.',
      },
      de: {
        nama: 'Komfort',
        teks: 'Schaffung einer sicheren, positiven und komfortablen Schulumgebung, damit jeder Schüler gut lernen und sich entwickeln kann.',
      },
      ko: {
        nama: '편안함',
        teks: '모든 학생이 편안하게 배우고 발전할 수 있도록 안전하고 긍정적이며 편안한 학교 환경을 조성합니다.',
      },
    },
  },
  {
    nama: 'Taqwa',
    teks: 'Menumbuhkan nilai keimanan dan ketakwaan sebagai landasan dalam membentuk pribadi yang berakhlak dan bertanggung jawab.',
    foto: '/images/cn beersholawat-238.jpg',
    terjemahan: {
      en: {
        nama: 'Piety',
        teks: 'Cultivating faith and piety values as a foundation for forming individuals with good character and responsibility.',
      },
      ja: {
        nama: '信仰心',
        teks: '信仰心と敬虔さの価値を育てることで、良い人格と責任感を持つ個人を形成する基盤とします。',
      },
      tr: {
        nama: 'Takva',
        teks: 'İman ve takva değerlerini geliştirerek, iyi ahlak ve sorumluluğa sahip bireylerin oluşturulmasının temelini sağlamak.',
      },
      de: {
        nama: 'Frömmigkeit',
        teks: 'Förderung von Glaubens- und Frömmigkeitswerten als Grundlage für die Bildung von Personen mit guter Moral und Verantwortung.',
      },
      ko: {
        nama: '경건함',
        teks: '신앙심과 경건함의 가치를 키워 좋은 인품과 책임감을 갖춘 개인을 형성하는 기초를 마련합니다.',
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
        teks: 'Encouraging students to actively learn, participate, create, and develop their potential through various experiences.',
      },
      ja: {
        nama: 'アクティブ',
        teks: '学生が積極的に学習し、参加し、創造し、様々な経験を通じて可能性を発展させることを促進します。',
      },
      tr: {
        nama: 'Aktif',
        teks: 'Öğrencilerin aktif olarak öğrenmesini, katılmasını, yaratmasını ve çeşitli deneyimler yoluyla potansiyellerini geliştirmesini teşvik etmek.',
      },
      de: {
        nama: 'Aktiv',
        teks: 'Schüler ermutigen, aktiv zu lernen, teilzunehmen, zu schaffen und ihr Potenzial durch verschiedene Erfahrungen zu entwickeln.',
      },
      ko: {
        nama: '적극적',
        teks: '학생들이 적극적으로 배우고, 참여하고, 창작하며 다양한 경험을 통해 잠재력을 개발하도록 장려합니다.',
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
        teks: 'Building a work culture that is disciplined, competent, and responsible in providing the best education and service.',
      },
      ja: {
        nama: 'プロフェッショナル',
        teks: '最高の教育とサービスを提供するために、規律正しく、能力があり、責任ある職場文化を構築します。',
      },
      tr: {
        nama: 'Profesyonel',
        teks: 'En iyi eğitim ve hizmeti sağlamak için disiplinli, yetkin ve sorumlu bir çalışma kültürü oluşturmak.',
      },
      de: {
        nama: 'Professionell',
        teks: 'Aufbau einer Arbeitskultur, die diszipliniert, kompetent und verantwortungsvoll bei der Erbringung der besten Bildung und Dienstleistungen ist.',
      },
      ko: {
        nama: '전문적',
        teks: '최고의 교육과 서비스를 제공하기 위해 규율 있고 유능하며 책임감 있는 업무 문화를 구축합니다.',
      },
    },
  },
]
