'use client';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import Image from 'next/image';

const STATS = [
  { angka: '2011', label: 'Tahun Berdiri' },
  { angka: '35+',  label: 'Anggota Aktif' },
  { angka: '18',   label: 'Prestasi Diraih' },
  { angka: '100%', label: 'Dedikasi' },
];

const TUJUAN = [
  {
    icon: '🥋',
    judul: 'Kedisiplinan',
    deskripsi:
      'Taekwondo mengajarkan disiplin tinggi melalui latihan terstruktur dan aturan ketat yang membentuk karakter kuat.',
  },
  {
    icon: '💪',
    judul: 'Kebugaran & Bela Diri',
    deskripsi:
      'Latihan fisik intensif meningkatkan kekuatan, kelincahan, dan ketahanan tubuh sekaligus membekali keterampilan bela diri nyata.',
  },
  {
    icon: '🏅',
    judul: 'Karakter Positif',
    deskripsi:
      'Taekwondo menanamkan kepercayaan diri, rasa hormat, keberanian, dan sportivitas dalam setiap aspek kehidupan siswa.',
  },
];

const KEGIATAN = [
  { no: '01', nama: 'Latihan Teknik Dasar',    detail: 'Tendangan, pukulan, blok, dan teknik jatuhan.' },
  { no: '02', nama: 'Poomsae',                  detail: 'Rangkaian gerakan teknik dasar secara terstruktur.' },
  { no: '03', nama: 'Sparring',                 detail: 'Teknik bertarung aman dengan pelindung tubuh.' },
  { no: '04', nama: 'Latihan Fisik',            detail: 'Lari, push-up, sit-up, dan latihan kebugaran.' },
  { no: '05', nama: 'Kenaikan Tingkat',         detail: 'Ujian sabuk sebagai tolok ukur peningkatan kemampuan.' },
  { no: '06', nama: 'Partisipasi Kejuaraan',    detail: 'Kompetisi taekwondo lokal hingga regional.' },
];

export default function TaekwondoPage() {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Barlow:wght@400;500;600;700&family=Barlow+Condensed:wght@600;700;800&display=swap');

        .tkw-root {
          font-family: 'Barlow', sans-serif;
          background: #080b0d;
          color: #e8e0d0;
          min-height: 100vh;
        }
        .tkw-hero { position: relative; overflow: hidden; background: #080b0d; }
        .tkw-hero-img { position: relative; width: 100%; height: min(70vh, 600px); }
        .tkw-hero-img img {
          object-fit: cover;
          object-position: center top;
          filter: brightness(0.45) contrast(1.1);
        }
        .tkw-hero-overlay {
          position: absolute; inset: 0;
          background: linear-gradient(to bottom, transparent 20%, rgba(8,11,13,0.6) 60%, #080b0d 100%);
        }
        .tkw-hero-content {
          position: absolute; bottom: 0; left: 0; right: 0;
          padding: 0 clamp(24px, 6vw, 80px) clamp(40px, 6vw, 72px);
        }
        .tkw-eyebrow {
          display: inline-flex; align-items: center; gap: 10px;
          font-family: 'Barlow Condensed', sans-serif;
          font-size: 13px; font-weight: 700; letter-spacing: 3px;
          text-transform: uppercase; color: #4AA8E8; margin-bottom: 16px;
        }
        .tkw-eyebrow::before {
          content: ''; display: block; width: 32px; height: 2px; background: #4AA8E8;
        }
        .tkw-title {
          font-family: 'Bebas Neue', sans-serif;
          font-size: clamp(72px, 12vw, 160px);
          line-height: 0.9; color: #fff; letter-spacing: 2px; margin: 0 0 20px;
        }
        .tkw-title span { color: #4AA8E8; }
        .tkw-subtitle {
          max-width: 560px; font-size: clamp(15px, 1.8vw, 18px);
          color: rgba(232,224,208,0.75); line-height: 1.7;
        }
        .tkw-stats {
          display: grid; grid-template-columns: repeat(4, 1fr);
          border-top: 1px solid rgba(74,168,232,0.2);
          border-bottom: 1px solid rgba(74,168,232,0.2);
        }
        @media (max-width: 640px) { .tkw-stats { grid-template-columns: repeat(2, 1fr); } }
        .tkw-stat {
          padding: 28px 20px; text-align: center;
          border-right: 1px solid rgba(74,168,232,0.15);
        }
        .tkw-stat:last-child { border-right: none; }
        .tkw-stat-num {
          font-family: 'Bebas Neue', sans-serif;
          font-size: 42px; color: #4AA8E8; line-height: 1; margin-bottom: 6px;
        }
        .tkw-stat-label {
          font-size: 11px; font-weight: 600; letter-spacing: 2px;
          text-transform: uppercase; color: rgba(232,224,208,0.5);
        }
        .tkw-section {
          max-width: 1100px; margin: 0 auto;
          padding: clamp(56px, 8vw, 96px) clamp(24px, 6vw, 80px);
        }
        .tkw-section-label {
          font-family: 'Barlow Condensed', sans-serif;
          font-size: 11px; font-weight: 700; letter-spacing: 3px;
          text-transform: uppercase; color: #4AA8E8; margin-bottom: 12px;
        }
        .tkw-section-heading {
          font-family: 'Bebas Neue', sans-serif;
          font-size: clamp(40px, 5vw, 64px); color: #fff; line-height: 1; margin-bottom: 48px;
        }
        .tkw-tujuan-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 2px; }
        @media (max-width: 768px) { .tkw-tujuan-grid { grid-template-columns: 1fr; } }
        .tkw-tujuan-card {
          background: #0a1018; padding: 36px 28px;
          border: 1px solid rgba(74,168,232,0.08);
          transition: background 0.2s, border-color 0.2s;
          position: relative; overflow: hidden;
        }
        .tkw-tujuan-card::after {
          content: ''; position: absolute; bottom: 0; left: 0; right: 0;
          height: 2px; background: #4AA8E8;
          transform: scaleX(0); transform-origin: left; transition: transform 0.3s ease;
        }
        .tkw-tujuan-card:hover { background: #0d1620; border-color: rgba(74,168,232,0.2); }
        .tkw-tujuan-card:hover::after { transform: scaleX(1); }
        .tkw-tujuan-icon { font-size: 36px; margin-bottom: 20px; display: block; }
        .tkw-tujuan-title {
          font-family: 'Barlow Condensed', sans-serif;
          font-size: 22px; font-weight: 800; color: #fff;
          text-transform: uppercase; letter-spacing: 1px; margin-bottom: 12px;
        }
        .tkw-tujuan-desc { font-size: 14px; color: rgba(232,224,208,0.65); line-height: 1.75; }
        .tkw-kegiatan-grid {
          display: grid; grid-template-columns: repeat(2, 1fr);
          gap: 1px; background: rgba(74,168,232,0.1);
        }
        @media (max-width: 640px) { .tkw-kegiatan-grid { grid-template-columns: 1fr; } }
        .tkw-kegiatan-item {
          background: #080b0d; padding: 28px 32px;
          display: flex; align-items: flex-start; gap: 20px; transition: background 0.2s;
        }
        .tkw-kegiatan-item:hover { background: #0a1018; }
        .tkw-kegiatan-no {
          font-family: 'Bebas Neue', sans-serif;
          font-size: 32px; color: rgba(74,168,232,0.3); line-height: 1; flex-shrink: 0; width: 40px;
        }
        .tkw-kegiatan-nama {
          font-family: 'Barlow Condensed', sans-serif;
          font-size: 18px; font-weight: 700; color: #fff;
          text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;
        }
        .tkw-kegiatan-detail { font-size: 13px; color: rgba(232,224,208,0.5); }
        .tkw-divider {
          display: flex; align-items: center; gap: 16px;
          max-width: 1100px; margin: 0 auto;
          padding: 0 clamp(24px, 6vw, 80px); opacity: 0.25;
        }
        .tkw-divider::before, .tkw-divider::after {
          content: ''; flex: 1; height: 1px; background: #4AA8E8;
        }
        .tkw-divider-icon { font-size: 14px; }
      `}</style>

      <div className="tkw-root">
        <Navbar />

        <main>
          {/* ── Hero ── */}
          <section className="tkw-hero">
            <div className="tkw-hero-img">
              <Image src="/images/taekwondo.jpg" alt="Taekwondo SMK Citra Negara" fill priority />
              <div className="tkw-hero-overlay" />
            </div>
            <div className="tkw-hero-content">
              <div className="tkw-eyebrow">Ekstrakurikuler SMK Citra Negara</div>
              <h1 className="tkw-title">TAEK<span>WONDO</span></h1>
              <p className="tkw-subtitle">
                Taekwondo menawarkan lebih dari sekadar keterampilan bela diri. Kami membentuk
                siswa yang disiplin, tangguh, dan berkarakter melalui seni bela diri Korea
                yang penuh nilai kehidupan.
              </p>
            </div>
          </section>

          {/* ── Stats ── */}
          <div className="tkw-stats">
            {STATS.map(s => (
              <div key={s.label} className="tkw-stat">
                <div className="tkw-stat-num">{s.angka}</div>
                <div className="tkw-stat-label">{s.label}</div>
              </div>
            ))}
          </div>

          {/* ── Tujuan ── */}
          <section className="tkw-section">
            <div className="tkw-section-label">Mengapa Taekwondo</div>
            <h2 className="tkw-section-heading">TUJUAN KAMI</h2>
            <div className="tkw-tujuan-grid">
              {TUJUAN.map(t => (
                <div key={t.judul} className="tkw-tujuan-card">
                  <span className="tkw-tujuan-icon">{t.icon}</span>
                  <div className="tkw-tujuan-title">{t.judul}</div>
                  <p className="tkw-tujuan-desc">{t.deskripsi}</p>
                </div>
              ))}
            </div>
          </section>

          <div className="tkw-divider"><span className="tkw-divider-icon">✦</span></div>

          {/* ── Kegiatan ── */}
          <section className="tkw-section" style={{ paddingTop: 'clamp(40px, 5vw, 64px)' }}>
            <div className="tkw-section-label">Program Latihan</div>
            <h2 className="tkw-section-heading">KEGIATAN RUTIN</h2>
            <div className="tkw-kegiatan-grid">
              {KEGIATAN.map(k => (
                <div key={k.no} className="tkw-kegiatan-item">
                  <div className="tkw-kegiatan-no">{k.no}</div>
                  <div>
                    <div className="tkw-kegiatan-nama">{k.nama}</div>
                    <div className="tkw-kegiatan-detail">{k.detail}</div>
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