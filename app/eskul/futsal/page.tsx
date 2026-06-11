'use client';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import Image from 'next/image';

const STATS = [
  { angka: '2015', label: 'Tahun Berdiri' },
  { angka: '25+',  label: 'Anggota Aktif' },
  { angka: '12',   label: 'Prestasi Diraih' },
  { angka: '100%', label: 'Dedikasi' },
];

const TUJUAN = [
  {
    icon: '⚡',
    judul: 'Kebugaran Fisik',
    deskripsi:
      'Futsal membantu meningkatkan kebugaran fisik siswa melalui latihan yang intens dan pertandingan yang dinamis dan penuh semangat.',
  },
  {
    icon: '⚽',
    judul: 'Keterampilan Teknis',
    deskripsi:
      'Futsal merupakan versi mini sepak bola yang membantu siswa mengasah keterampilan dribbling, passing, dan shooting secara optimal.',
  },
  {
    icon: '🤝',
    judul: 'Kerjasama Tim',
    deskripsi:
      'Dalam futsal, kerjasama tim adalah kunci. Siswa belajar berkomunikasi, membangun kepercayaan, dan merancang strategi bersama.',
  },
];

const KEGIATAN = [
  { no: '01', nama: 'Latihan Teknik Dasar',    detail: 'Dribbling, passing, shooting, dan penguasaan bola.' },
  { no: '02', nama: 'Latihan Fisik',            detail: 'Jogging, sprint, dan latihan kekuatan tubuh.' },
  { no: '03', nama: 'Strategi & Taktik',        detail: 'Formasi, pergerakan tanpa bola, pola serangan.' },
  { no: '04', nama: 'Pertandingan Internal',    detail: 'Scrimmage antar anggota untuk uji kemampuan.' },
  { no: '05', nama: 'Partisipasi Turnamen',     detail: 'Kompetisi futsal regional hingga nasional.' },
  { no: '06', nama: 'Pengembangan Mentalitas',  detail: 'Sportivitas, fair play, dan mental pemenang.' },
];

export default function futsalPage() {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Barlow:wght@400;500;600;700&family=Barlow+Condensed:wght@600;700;800&display=swap');

        .fts-root {
          font-family: 'Barlow', sans-serif;
          background: #080d0a;
          color: #e8e0d0;
          min-height: 100vh;
        }
        .fts-hero { position: relative; overflow: hidden; background: #080d0a; }
        .fts-hero-img { position: relative; width: 100%; height: min(70vh, 600px); }
        .fts-hero-img img {
          object-fit: cover;
          object-position: center top;
          filter: brightness(0.45) contrast(1.1);
        }
        .fts-hero-overlay {
          position: absolute; inset: 0;
          background: linear-gradient(to bottom, transparent 20%, rgba(8,13,10,0.6) 60%, #080d0a 100%);
        }
        .fts-hero-content {
          position: absolute; bottom: 0; left: 0; right: 0;
          padding: 0 clamp(24px, 6vw, 80px) clamp(40px, 6vw, 72px);
        }
        .fts-eyebrow {
          display: inline-flex; align-items: center; gap: 10px;
          font-family: 'Barlow Condensed', sans-serif;
          font-size: 13px; font-weight: 700; letter-spacing: 3px;
          text-transform: uppercase; color: #3AB8C8; margin-bottom: 16px;
        }
        .fts-eyebrow::before {
          content: ''; display: block; width: 32px; height: 2px; background: #3AB8C8;
        }
        .fts-title {
          font-family: 'Bebas Neue', sans-serif;
          font-size: clamp(72px, 12vw, 160px);
          line-height: 0.9; color: #fff; letter-spacing: 2px; margin: 0 0 20px;
        }
        .fts-title span { color: #3AB8C8; }
        .fts-subtitle {
          max-width: 560px; font-size: clamp(15px, 1.8vw, 18px);
          color: rgba(232,224,208,0.75); line-height: 1.7;
        }
        .fts-stats {
          display: grid; grid-template-columns: repeat(4, 1fr);
          border-top: 1px solid rgba(58,184,200,0.2);
          border-bottom: 1px solid rgba(58,184,200,0.2);
        }
        @media (max-width: 640px) { .fts-stats { grid-template-columns: repeat(2, 1fr); } }
        .fts-stat {
          padding: 28px 20px; text-align: center;
          border-right: 1px solid rgba(58,184,200,0.15);
        }
        .fts-stat:last-child { border-right: none; }
        .fts-stat-num {
          font-family: 'Bebas Neue', sans-serif;
          font-size: 42px; color: #3AB8C8; line-height: 1; margin-bottom: 6px;
        }
        .fts-stat-label {
          font-size: 11px; font-weight: 600; letter-spacing: 2px;
          text-transform: uppercase; color: rgba(232,224,208,0.5);
        }
        .fts-section {
          max-width: 1100px; margin: 0 auto;
          padding: clamp(56px, 8vw, 96px) clamp(24px, 6vw, 80px);
        }
        .fts-section-label {
          font-family: 'Barlow Condensed', sans-serif;
          font-size: 11px; font-weight: 700; letter-spacing: 3px;
          text-transform: uppercase; color: #3AB8C8; margin-bottom: 12px;
        }
        .fts-section-heading {
          font-family: 'Bebas Neue', sans-serif;
          font-size: clamp(40px, 5vw, 64px); color: #fff; line-height: 1; margin-bottom: 48px;
        }
        .fts-tujuan-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 2px; }
        @media (max-width: 768px) { .fts-tujuan-grid { grid-template-columns: 1fr; } }
        .fts-tujuan-card {
          background: #0a1214; padding: 36px 28px;
          border: 1px solid rgba(58,184,200,0.08);
          transition: background 0.2s, border-color 0.2s;
          position: relative; overflow: hidden;
        }
        .fts-tujuan-card::after {
          content: ''; position: absolute; bottom: 0; left: 0; right: 0;
          height: 2px; background: #3AB8C8;
          transform: scaleX(0); transform-origin: left; transition: transform 0.3s ease;
        }
        .fts-tujuan-card:hover { background: #0d1a1e; border-color: rgba(58,184,200,0.2); }
        .fts-tujuan-card:hover::after { transform: scaleX(1); }
        .fts-tujuan-icon { font-size: 36px; margin-bottom: 20px; display: block; }
        .fts-tujuan-title {
          font-family: 'Barlow Condensed', sans-serif;
          font-size: 22px; font-weight: 800; color: #fff;
          text-transform: uppercase; letter-spacing: 1px; margin-bottom: 12px;
        }
        .fts-tujuan-desc { font-size: 14px; color: rgba(232,224,208,0.65); line-height: 1.75; }
        .fts-kegiatan-grid {
          display: grid; grid-template-columns: repeat(2, 1fr);
          gap: 1px; background: rgba(58,184,200,0.1);
        }
        @media (max-width: 640px) { .fts-kegiatan-grid { grid-template-columns: 1fr; } }
        .fts-kegiatan-item {
          background: #080d0a; padding: 28px 32px;
          display: flex; align-items: flex-start; gap: 20px; transition: background 0.2s;
        }
        .fts-kegiatan-item:hover { background: #0a1214; }
        .fts-kegiatan-no {
          font-family: 'Bebas Neue', sans-serif;
          font-size: 32px; color: rgba(58,184,200,0.3); line-height: 1; flex-shrink: 0; width: 40px;
        }
        .fts-kegiatan-nama {
          font-family: 'Barlow Condensed', sans-serif;
          font-size: 18px; font-weight: 700; color: #fff;
          text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;
        }
        .fts-kegiatan-detail { font-size: 13px; color: rgba(232,224,208,0.5); }
        .fts-divider {
          display: flex; align-items: center; gap: 16px;
          max-width: 1100px; margin: 0 auto;
          padding: 0 clamp(24px, 6vw, 80px); opacity: 0.25;
        }
        .fts-divider::before, .fts-divider::after {
          content: ''; flex: 1; height: 1px; background: #3AB8C8;
        }
        .fts-divider-icon { font-size: 14px; }
      `}</style>

      <div className="fts-root">
        <Navbar />

        <main>
          {/* ── Hero ── */}
          <section className="fts-hero">
            <div className="fts-hero-img">
              <Image src="/images/putsal.jpg" alt="Futsal SMK Citra Negara" fill priority />
              <div className="fts-hero-overlay" />
            </div>
            <div className="fts-hero-content">
              <div className="fts-eyebrow">Ekstrakurikuler SMK Citra Negara</div>
              <h1 className="fts-title">FUT<span>SAL</span></h1>
              <p className="fts-subtitle">
                Futsal adalah salah satu ekstrakurikuler yang sangat diminati di kalangan pelajar.
                Tidak hanya melatih fisik, futsal juga membangun strategi, kerjasama tim, dan
                mentalitas juara yang tangguh.
              </p>
            </div>
          </section>

          {/* ── Stats ── */}
          <div className="fts-stats">
            {STATS.map(s => (
              <div key={s.label} className="fts-stat">
                <div className="fts-stat-num">{s.angka}</div>
                <div className="fts-stat-label">{s.label}</div>
              </div>
            ))}
          </div>

          {/* ── Tujuan ── */}
          <section className="fts-section">
            <div className="fts-section-label">Mengapa Futsal</div>
            <h2 className="fts-section-heading">TUJUAN KAMI</h2>
            <div className="fts-tujuan-grid">
              {TUJUAN.map(t => (
                <div key={t.judul} className="fts-tujuan-card">
                  <span className="fts-tujuan-icon">{t.icon}</span>
                  <div className="fts-tujuan-title">{t.judul}</div>
                  <p className="fts-tujuan-desc">{t.deskripsi}</p>
                </div>
              ))}
            </div>
          </section>

          <div className="fts-divider"><span className="fts-divider-icon">✦</span></div>

          {/* ── Kegiatan ── */}
          <section className="fts-section" style={{ paddingTop: 'clamp(40px, 5vw, 64px)' }}>
            <div className="fts-section-label">Program Latihan</div>
            <h2 className="fts-section-heading">KEGIATAN RUTIN</h2>
            <div className="fts-kegiatan-grid">
              {KEGIATAN.map(k => (
                <div key={k.no} className="fts-kegiatan-item">
                  <div className="fts-kegiatan-no">{k.no}</div>
                  <div>
                    <div className="fts-kegiatan-nama">{k.nama}</div>
                    <div className="fts-kegiatan-detail">{k.detail}</div>
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