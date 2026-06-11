'use client';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import Image from 'next/image';

const STATS = [
  { angka: '2018', label: 'Tahun Berdiri' },
  { angka: '40+',  label: 'Anggota Aktif' },
  { angka: '20',   label: 'Prestasi Diraih' },
  { angka: '100%', label: 'Dedikasi' },
];

const TUJUAN = [
  {
    icon: '💻',
    judul: 'Keterampilan Teknologi',
    deskripsi:
      'IT Club membantu siswa mengasah keterampilan TIK seperti pemrograman, desain web, dan administrasi jaringan secara profesional.',
  },
  {
    icon: '🚀',
    judul: 'Inovasi & Kreativitas',
    deskripsi:
      'Siswa diajak menciptakan solusi teknologi baru, mengembangkan aplikasi, dan merancang proyek kreatif menggunakan teknologi terkini.',
  },
  {
    icon: '🔒',
    judul: 'Siap Era Digital',
    deskripsi:
      'IT Club mempersiapkan siswa menghadapi tantangan era digital dengan memahami keamanan siber, big data, dan kecerdasan buatan.',
  },
];

const KEGIATAN = [
  { no: '01', nama: 'Pelatihan Teknis',          detail: 'Python, Java, desain grafis, dan manajemen database.' },
  { no: '02', nama: 'Kompetisi & Hackathon',      detail: 'Uji kemampuan dalam tantangan teknologi nyata.' },
  { no: '03', nama: 'Workshop & Seminar',         detail: 'Belajar dari profesional industri IT terkini.' },
  { no: '04', nama: 'Proyek Kolaboratif',         detail: 'Website sekolah, aplikasi mobile, sistem informasi.' },
  { no: '05', nama: 'Edukasi Keamanan Siber',     detail: 'Seminar cyber security untuk siswa dan orang tua.' },
  { no: '06', nama: 'Pengabdian Masyarakat',      detail: 'Pelatihan TIK untuk komunitas sekitar sekolah.' },
];

export default function ItClubPage() {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Barlow:wght@400;500;600;700&family=Barlow+Condensed:wght@600;700;800&display=swap');

        .itc-root {
          font-family: 'Barlow', sans-serif;
          background: #080a0d;
          color: #e8e0d0;
          min-height: 100vh;
        }
        .itc-hero { position: relative; overflow: hidden; background: #080a0d; }
        .itc-hero-img { position: relative; width: 100%; height: min(70vh, 600px); }
        .itc-hero-img img {
          object-fit: cover;
          object-position: center top;
          filter: brightness(0.45) contrast(1.1);
        }
        .itc-hero-overlay {
          position: absolute; inset: 0;
          background: linear-gradient(to bottom, transparent 20%, rgba(8,10,13,0.6) 60%, #080a0d 100%);
        }
        .itc-hero-content {
          position: absolute; bottom: 0; left: 0; right: 0;
          padding: 0 clamp(24px, 6vw, 80px) clamp(40px, 6vw, 72px);
        }
        .itc-eyebrow {
          display: inline-flex; align-items: center; gap: 10px;
          font-family: 'Barlow Condensed', sans-serif;
          font-size: 13px; font-weight: 700; letter-spacing: 3px;
          text-transform: uppercase; color: #3AC8A4; margin-bottom: 16px;
        }
        .itc-eyebrow::before {
          content: ''; display: block; width: 32px; height: 2px; background: #3AC8A4;
        }
        .itc-title {
          font-family: 'Bebas Neue', sans-serif;
          font-size: clamp(72px, 12vw, 160px);
          line-height: 0.9; color: #fff; letter-spacing: 2px; margin: 0 0 20px;
        }
        .itc-title span { color: #3AC8A4; }
        .itc-subtitle {
          max-width: 560px; font-size: clamp(15px, 1.8vw, 18px);
          color: rgba(232,224,208,0.75); line-height: 1.7;
        }
        .itc-stats {
          display: grid; grid-template-columns: repeat(4, 1fr);
          border-top: 1px solid rgba(58,200,164,0.2);
          border-bottom: 1px solid rgba(58,200,164,0.2);
        }
        @media (max-width: 640px) { .itc-stats { grid-template-columns: repeat(2, 1fr); } }
        .itc-stat {
          padding: 28px 20px; text-align: center;
          border-right: 1px solid rgba(58,200,164,0.15);
        }
        .itc-stat:last-child { border-right: none; }
        .itc-stat-num {
          font-family: 'Bebas Neue', sans-serif;
          font-size: 42px; color: #3AC8A4; line-height: 1; margin-bottom: 6px;
        }
        .itc-stat-label {
          font-size: 11px; font-weight: 600; letter-spacing: 2px;
          text-transform: uppercase; color: rgba(232,224,208,0.5);
        }
        .itc-section {
          max-width: 1100px; margin: 0 auto;
          padding: clamp(56px, 8vw, 96px) clamp(24px, 6vw, 80px);
        }
        .itc-section-label {
          font-family: 'Barlow Condensed', sans-serif;
          font-size: 11px; font-weight: 700; letter-spacing: 3px;
          text-transform: uppercase; color: #3AC8A4; margin-bottom: 12px;
        }
        .itc-section-heading {
          font-family: 'Bebas Neue', sans-serif;
          font-size: clamp(40px, 5vw, 64px); color: #fff; line-height: 1; margin-bottom: 48px;
        }
        .itc-tujuan-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 2px; }
        @media (max-width: 768px) { .itc-tujuan-grid { grid-template-columns: 1fr; } }
        .itc-tujuan-card {
          background: #0a0f14; padding: 36px 28px;
          border: 1px solid rgba(58,200,164,0.08);
          transition: background 0.2s, border-color 0.2s;
          position: relative; overflow: hidden;
        }
        .itc-tujuan-card::after {
          content: ''; position: absolute; bottom: 0; left: 0; right: 0;
          height: 2px; background: #3AC8A4;
          transform: scaleX(0); transform-origin: left; transition: transform 0.3s ease;
        }
        .itc-tujuan-card:hover { background: #0d1a16; border-color: rgba(58,200,164,0.2); }
        .itc-tujuan-card:hover::after { transform: scaleX(1); }
        .itc-tujuan-icon { font-size: 36px; margin-bottom: 20px; display: block; }
        .itc-tujuan-title {
          font-family: 'Barlow Condensed', sans-serif;
          font-size: 22px; font-weight: 800; color: #fff;
          text-transform: uppercase; letter-spacing: 1px; margin-bottom: 12px;
        }
        .itc-tujuan-desc { font-size: 14px; color: rgba(232,224,208,0.65); line-height: 1.75; }
        .itc-kegiatan-grid {
          display: grid; grid-template-columns: repeat(2, 1fr);
          gap: 1px; background: rgba(58,200,164,0.1);
        }
        @media (max-width: 640px) { .itc-kegiatan-grid { grid-template-columns: 1fr; } }
        .itc-kegiatan-item {
          background: #080a0d; padding: 28px 32px;
          display: flex; align-items: flex-start; gap: 20px; transition: background 0.2s;
        }
        .itc-kegiatan-item:hover { background: #0a0f14; }
        .itc-kegiatan-no {
          font-family: 'Bebas Neue', sans-serif;
          font-size: 32px; color: rgba(58,200,164,0.3); line-height: 1; flex-shrink: 0; width: 40px;
        }
        .itc-kegiatan-nama {
          font-family: 'Barlow Condensed', sans-serif;
          font-size: 18px; font-weight: 700; color: #fff;
          text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;
        }
        .itc-kegiatan-detail { font-size: 13px; color: rgba(232,224,208,0.5); }
        .itc-divider {
          display: flex; align-items: center; gap: 16px;
          max-width: 1100px; margin: 0 auto;
          padding: 0 clamp(24px, 6vw, 80px); opacity: 0.25;
        }
        .itc-divider::before, .itc-divider::after {
          content: ''; flex: 1; height: 1px; background: #3AC8A4;
        }
        .itc-divider-icon { font-size: 14px; }
      `}</style>

      <div className="itc-root">
        <Navbar />

        <main>
          {/* ── Hero ── */}
          <section className="itc-hero">
            <div className="itc-hero-img">
              <Image src="/images/itclub.jpg" alt="IT Club SMK Citra Negara" fill priority />
              <div className="itc-hero-overlay" />
            </div>
            <div className="itc-hero-content">
              <div className="itc-eyebrow">Ekstrakurikuler SMK Citra Negara</div>
              <h1 className="itc-title">IT <span>CLUB</span></h1>
              <p className="itc-subtitle">
                Ekstrakurikuler IT Club mengajak siswa menjelajahi dunia digital dan teknologi.
                Dari pemrograman hingga keamanan siber, kami mempersiapkan generasi inovator
                yang siap menghadapi era digital.
              </p>
            </div>
          </section>

          {/* ── Stats ── */}
          <div className="itc-stats">
            {STATS.map(s => (
              <div key={s.label} className="itc-stat">
                <div className="itc-stat-num">{s.angka}</div>
                <div className="itc-stat-label">{s.label}</div>
              </div>
            ))}
          </div>

          {/* ── Tujuan ── */}
          <section className="itc-section">
            <div className="itc-section-label">Mengapa IT Club</div>
            <h2 className="itc-section-heading">TUJUAN KAMI</h2>
            <div className="itc-tujuan-grid">
              {TUJUAN.map(t => (
                <div key={t.judul} className="itc-tujuan-card">
                  <span className="itc-tujuan-icon">{t.icon}</span>
                  <div className="itc-tujuan-title">{t.judul}</div>
                  <p className="itc-tujuan-desc">{t.deskripsi}</p>
                </div>
              ))}
            </div>
          </section>

          <div className="itc-divider"><span className="itc-divider-icon">✦</span></div>

          {/* ── Kegiatan ── */}
          <section className="itc-section" style={{ paddingTop: 'clamp(40px, 5vw, 64px)' }}>
            <div className="itc-section-label">Program Latihan</div>
            <h2 className="itc-section-heading">KEGIATAN RUTIN</h2>
            <div className="itc-kegiatan-grid">
              {KEGIATAN.map(k => (
                <div key={k.no} className="itc-kegiatan-item">
                  <div className="itc-kegiatan-no">{k.no}</div>
                  <div>
                    <div className="itc-kegiatan-nama">{k.nama}</div>
                    <div className="itc-kegiatan-detail">{k.detail}</div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </main>

        <Footer />
      </div>
    </>
  );
}