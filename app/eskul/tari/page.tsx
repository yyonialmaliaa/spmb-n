'use client';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import Image from 'next/image';

const STATS = [
  { angka: '2013', label: 'Tahun Berdiri' },
  { angka: '28+',  label: 'Anggota Aktif' },
  { angka: '16',   label: 'Prestasi Diraih' },
  { angka: '100%', label: 'Dedikasi' },
];

const TUJUAN = [
  {
    icon: '💃',
    judul: 'Kreativitas & Ekspresi',
    deskripsi:
      'Tari membantu siswa mengekspresikan kreativitas melalui gerakan, ritme, dan koreografi yang indah dan penuh makna.',
  },
  {
    icon: '🌸',
    judul: 'Kebugaran & Kelenturan',
    deskripsi:
      'Latihan rutin tari meningkatkan kekuatan, kelenturan, keseimbangan, dan kebugaran fisik siswa secara menyeluruh.',
  },
  {
    icon: '🏛️',
    judul: 'Apresiasi Budaya',
    deskripsi:
      'Melalui tarian tradisional dan modern, siswa belajar menghargai kekayaan budaya Nusantara dan dunia.',
  },
];

const KEGIATAN = [
  { no: '01', nama: 'Latihan Teknik Dasar',      detail: 'Gerakan dasar, ritme, dan postur tubuh yang benar.' },
  { no: '02', nama: 'Latihan Koreografi',         detail: 'Koreografi tari tradisional hingga tari modern.' },
  { no: '03', nama: 'Pertunjukan & Penampilan',   detail: 'Tampil di acara sekolah, festival, dan kompetisi.' },
  { no: '04', nama: 'Workshop & Kelas Master',    detail: 'Belajar langsung dari penari profesional.' },
  { no: '05', nama: 'Eksplorasi Budaya',          detail: 'Mempelajari tari dari berbagai budaya Nusantara.' },
  { no: '06', nama: 'Kolaborasi Seni',            detail: 'Berkolaborasi dengan teater dan musik sekolah.' },
];

export default function TariPage() {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Barlow:wght@400;500;600;700&family=Barlow+Condensed:wght@600;700;800&display=swap');

        .tri-root {
          font-family: 'Barlow', sans-serif;
          background: #0d080b;
          color: #e8e0d0;
          min-height: 100vh;
        }
        .tri-hero { position: relative; overflow: hidden; background: #0d080b; }
        .tri-hero-img { position: relative; width: 100%; height: min(70vh, 600px); }
        .tri-hero-img img {
          object-fit: cover;
          object-position: center top;
          filter: brightness(0.45) contrast(1.1);
        }
        .tri-hero-overlay {
          position: absolute; inset: 0;
          background: linear-gradient(to bottom, transparent 20%, rgba(13,8,11,0.6) 60%, #0d080b 100%);
        }
        .tri-hero-content {
          position: absolute; bottom: 0; left: 0; right: 0;
          padding: 0 clamp(24px, 6vw, 80px) clamp(40px, 6vw, 72px);
        }
        .tri-eyebrow {
          display: inline-flex; align-items: center; gap: 10px;
          font-family: 'Barlow Condensed', sans-serif;
          font-size: 13px; font-weight: 700; letter-spacing: 3px;
          text-transform: uppercase; color: #E06FA0; margin-bottom: 16px;
        }
        .tri-eyebrow::before {
          content: ''; display: block; width: 32px; height: 2px; background: #E06FA0;
        }
        .tri-title {
          font-family: 'Bebas Neue', sans-serif;
          font-size: clamp(72px, 12vw, 160px);
          line-height: 0.9; color: #fff; letter-spacing: 2px; margin: 0 0 20px;
        }
        .tri-title span { color: #E06FA0; }
        .tri-subtitle {
          max-width: 560px; font-size: clamp(15px, 1.8vw, 18px);
          color: rgba(232,224,208,0.75); line-height: 1.7;
        }
        .tri-stats {
          display: grid; grid-template-columns: repeat(4, 1fr);
          border-top: 1px solid rgba(224,111,160,0.2);
          border-bottom: 1px solid rgba(224,111,160,0.2);
        }
        @media (max-width: 640px) { .tri-stats { grid-template-columns: repeat(2, 1fr); } }
        .tri-stat {
          padding: 28px 20px; text-align: center;
          border-right: 1px solid rgba(224,111,160,0.15);
        }
        .tri-stat:last-child { border-right: none; }
        .tri-stat-num {
          font-family: 'Bebas Neue', sans-serif;
          font-size: 42px; color: #E06FA0; line-height: 1; margin-bottom: 6px;
        }
        .tri-stat-label {
          font-size: 11px; font-weight: 600; letter-spacing: 2px;
          text-transform: uppercase; color: rgba(232,224,208,0.5);
        }
        .tri-section {
          max-width: 1100px; margin: 0 auto;
          padding: clamp(56px, 8vw, 96px) clamp(24px, 6vw, 80px);
        }
        .tri-section-label {
          font-family: 'Barlow Condensed', sans-serif;
          font-size: 11px; font-weight: 700; letter-spacing: 3px;
          text-transform: uppercase; color: #E06FA0; margin-bottom: 12px;
        }
        .tri-section-heading {
          font-family: 'Bebas Neue', sans-serif;
          font-size: clamp(40px, 5vw, 64px); color: #fff; line-height: 1; margin-bottom: 48px;
        }
        .tri-tujuan-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 2px; }
        @media (max-width: 768px) { .tri-tujuan-grid { grid-template-columns: 1fr; } }
        .tri-tujuan-card {
          background: #170a10; padding: 36px 28px;
          border: 1px solid rgba(224,111,160,0.08);
          transition: background 0.2s, border-color 0.2s;
          position: relative; overflow: hidden;
        }
        .tri-tujuan-card::after {
          content: ''; position: absolute; bottom: 0; left: 0; right: 0;
          height: 2px; background: #E06FA0;
          transform: scaleX(0); transform-origin: left; transition: transform 0.3s ease;
        }
        .tri-tujuan-card:hover { background: #200d16; border-color: rgba(224,111,160,0.2); }
        .tri-tujuan-card:hover::after { transform: scaleX(1); }
        .tri-tujuan-icon { font-size: 36px; margin-bottom: 20px; display: block; }
        .tri-tujuan-title {
          font-family: 'Barlow Condensed', sans-serif;
          font-size: 22px; font-weight: 800; color: #fff;
          text-transform: uppercase; letter-spacing: 1px; margin-bottom: 12px;
        }
        .tri-tujuan-desc { font-size: 14px; color: rgba(232,224,208,0.65); line-height: 1.75; }
        .tri-kegiatan-grid {
          display: grid; grid-template-columns: repeat(2, 1fr);
          gap: 1px; background: rgba(224,111,160,0.1);
        }
        @media (max-width: 640px) { .tri-kegiatan-grid { grid-template-columns: 1fr; } }
        .tri-kegiatan-item {
          background: #0d080b; padding: 28px 32px;
          display: flex; align-items: flex-start; gap: 20px; transition: background 0.2s;
        }
        .tri-kegiatan-item:hover { background: #170a10; }
        .tri-kegiatan-no {
          font-family: 'Bebas Neue', sans-serif;
          font-size: 32px; color: rgba(224,111,160,0.3); line-height: 1; flex-shrink: 0; width: 40px;
        }
        .tri-kegiatan-nama {
          font-family: 'Barlow Condensed', sans-serif;
          font-size: 18px; font-weight: 700; color: #fff;
          text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;
        }
        .tri-kegiatan-detail { font-size: 13px; color: rgba(232,224,208,0.5); }
        .tri-divider {
          display: flex; align-items: center; gap: 16px;
          max-width: 1100px; margin: 0 auto;
          padding: 0 clamp(24px, 6vw, 80px); opacity: 0.25;
        }
        .tri-divider::before, .tri-divider::after {
          content: ''; flex: 1; height: 1px; background: #E06FA0;
        }
        .tri-divider-icon { font-size: 14px; }
      `}</style>

      <div className="tri-root">
        <Navbar />

        <main>
          {/* ── Hero ── */}
          <section className="tri-hero">
            <div className="tri-hero-img">
              <Image src="/images/tari.jpg" alt="Tari SMK Citra Negara" fill priority />
              <div className="tri-hero-overlay" />
            </div>
            <div className="tri-hero-content">
              <div className="tri-eyebrow">Ekstrakurikuler SMK Citra Negara</div>
              <h1 className="tri-title">SE<span>NI TARI</span></h1>
              <p className="tri-subtitle">
                Ekstrakurikuler tari memungkinkan siswa mengekspresikan diri melalui seni dan
                gerakan. Dari tari tradisional hingga modern, kami membentuk penari muda yang
                berkarakter dan berbudaya.
              </p>
            </div>
          </section>

          {/* ── Stats ── */}
          <div className="tri-stats">
            {STATS.map(s => (
              <div key={s.label} className="tri-stat">
                <div className="tri-stat-num">{s.angka}</div>
                <div className="tri-stat-label">{s.label}</div>
              </div>
            ))}
          </div>

          {/* ── Tujuan ── */}
          <section className="tri-section">
            <div className="tri-section-label">Mengapa Seni Tari</div>
            <h2 className="tri-section-heading">TUJUAN KAMI</h2>
            <div className="tri-tujuan-grid">
              {TUJUAN.map(t => (
                <div key={t.judul} className="tri-tujuan-card">
                  <span className="tri-tujuan-icon">{t.icon}</span>
                  <div className="tri-tujuan-title">{t.judul}</div>
                  <p className="tri-tujuan-desc">{t.deskripsi}</p>
                </div>
              ))}
            </div>
          </section>

          <div className="tri-divider"><span className="tri-divider-icon">✦</span></div>

          {/* ── Kegiatan ── */}
          <section className="tri-section" style={{ paddingTop: 'clamp(40px, 5vw, 64px)' }}>
            <div className="tri-section-label">Program Latihan</div>
            <h2 className="tri-section-heading">KEGIATAN RUTIN</h2>
            <div className="tri-kegiatan-grid">
              {KEGIATAN.map(k => (
                <div key={k.no} className="tri-kegiatan-item">
                  <div className="tri-kegiatan-no">{k.no}</div>
                  <div>
                    <div className="tri-kegiatan-nama">{k.nama}</div>
                    <div className="tri-kegiatan-detail">{k.detail}</div>
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