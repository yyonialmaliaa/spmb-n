'use client';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import Image from 'next/image';

const STATS = [
  { angka: '2014', label: 'Tahun Berdiri' },
  { angka: '25+',  label: 'Anggota Aktif' },
  { angka: '11',   label: 'Prestasi Diraih' },
  { angka: '100%', label: 'Dedikasi' },
];

const TUJUAN = [
  {
    icon: '🎭',
    judul: 'Kreativitas',
    deskripsi:
      'Teater mendorong siswa berpikir kreatif dan inovatif dalam menciptakan karakter, alur cerita, dan pertunjukan yang memukau.',
  },
  {
    icon: '🎤',
    judul: 'Komunikasi & Kepercayaan Diri',
    deskripsi:
      'Melalui latihan dialog dan akting, siswa belajar berkomunikasi efektif sekaligus mengatasi rasa gugup di depan publik.',
  },
  {
    icon: '🌟',
    judul: 'Apresiasi Seni',
    deskripsi:
      'Siswa belajar menghargai seni teater, memahami berbagai aspek produksi panggung, dan kolaborasi lintas peran kreatif.',
  },
];

const KEGIATAN = [
  { no: '01', nama: 'Latihan Akting',            detail: 'Ekspresi wajah, gerakan tubuh, dan intonasi suara.' },
  { no: '02', nama: 'Pembacaan Naskah',           detail: 'Memahami karakter dan mengembangkan interpretasi peran.' },
  { no: '03', nama: 'Latihan Improvisasi',        detail: 'Kreativitas dan berpikir cepat dalam situasi tak terduga.' },
  { no: '04', nama: 'Produksi Pertunjukan',       detail: 'Latihan, pengaturan panggung, kostum, hingga pentas.' },
  { no: '05', nama: 'Kerja Kolaboratif',          detail: 'Kerjasama sutradara, penulis naskah, dan kru teknis.' },
  { no: '06', nama: 'Workshop & Pelatihan',       detail: 'Belajar dari profesional di bidang seni teater.' },
];

export default function TheaterPage() {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Barlow:wght@400;500;600;700&family=Barlow+Condensed:wght@600;700;800&display=swap');

        .thr-root {
          font-family: 'Barlow', sans-serif;
          background: #0d0a0f;
          color: #e8e0d0;
          min-height: 100vh;
        }
        .thr-hero { position: relative; overflow: hidden; background: #0d0a0f; }
        .thr-hero-img { position: relative; width: 100%; height: min(70vh, 600px); }
        .thr-hero-img img {
          object-fit: cover;
          object-position: center top;
          filter: brightness(0.45) contrast(1.1);
        }
        .thr-hero-overlay {
          position: absolute; inset: 0;
          background: linear-gradient(to bottom, transparent 20%, rgba(13,10,15,0.6) 60%, #0d0a0f 100%);
        }
        .thr-hero-content {
          position: absolute; bottom: 0; left: 0; right: 0;
          padding: 0 clamp(24px, 6vw, 80px) clamp(40px, 6vw, 72px);
        }
        .thr-eyebrow {
          display: inline-flex; align-items: center; gap: 10px;
          font-family: 'Barlow Condensed', sans-serif;
          font-size: 13px; font-weight: 700; letter-spacing: 3px;
          text-transform: uppercase; color: #C87DD4; margin-bottom: 16px;
        }
        .thr-eyebrow::before {
          content: ''; display: block; width: 32px; height: 2px; background: #C87DD4;
        }
        .thr-title {
          font-family: 'Bebas Neue', sans-serif;
          font-size: clamp(72px, 12vw, 160px);
          line-height: 0.9; color: #fff; letter-spacing: 2px; margin: 0 0 20px;
        }
        .thr-title span { color: #C87DD4; }
        .thr-subtitle {
          max-width: 560px; font-size: clamp(15px, 1.8vw, 18px);
          color: rgba(232,224,208,0.75); line-height: 1.7;
        }
        .thr-stats {
          display: grid; grid-template-columns: repeat(4, 1fr);
          border-top: 1px solid rgba(200,125,212,0.2);
          border-bottom: 1px solid rgba(200,125,212,0.2);
        }
        @media (max-width: 640px) { .thr-stats { grid-template-columns: repeat(2, 1fr); } }
        .thr-stat {
          padding: 28px 20px; text-align: center;
          border-right: 1px solid rgba(200,125,212,0.15);
        }
        .thr-stat:last-child { border-right: none; }
        .thr-stat-num {
          font-family: 'Bebas Neue', sans-serif;
          font-size: 42px; color: #C87DD4; line-height: 1; margin-bottom: 6px;
        }
        .thr-stat-label {
          font-size: 11px; font-weight: 600; letter-spacing: 2px;
          text-transform: uppercase; color: rgba(232,224,208,0.5);
        }
        .thr-section {
          max-width: 1100px; margin: 0 auto;
          padding: clamp(56px, 8vw, 96px) clamp(24px, 6vw, 80px);
        }
        .thr-section-label {
          font-family: 'Barlow Condensed', sans-serif;
          font-size: 11px; font-weight: 700; letter-spacing: 3px;
          text-transform: uppercase; color: #C87DD4; margin-bottom: 12px;
        }
        .thr-section-heading {
          font-family: 'Bebas Neue', sans-serif;
          font-size: clamp(40px, 5vw, 64px); color: #fff; line-height: 1; margin-bottom: 48px;
        }
        .thr-tujuan-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 2px; }
        @media (max-width: 768px) { .thr-tujuan-grid { grid-template-columns: 1fr; } }
        .thr-tujuan-card {
          background: #130f18; padding: 36px 28px;
          border: 1px solid rgba(200,125,212,0.08);
          transition: background 0.2s, border-color 0.2s;
          position: relative; overflow: hidden;
        }
        .thr-tujuan-card::after {
          content: ''; position: absolute; bottom: 0; left: 0; right: 0;
          height: 2px; background: #C87DD4;
          transform: scaleX(0); transform-origin: left; transition: transform 0.3s ease;
        }
        .thr-tujuan-card:hover { background: #1a1222; border-color: rgba(200,125,212,0.2); }
        .thr-tujuan-card:hover::after { transform: scaleX(1); }
        .thr-tujuan-icon { font-size: 36px; margin-bottom: 20px; display: block; }
        .thr-tujuan-title {
          font-family: 'Barlow Condensed', sans-serif;
          font-size: 22px; font-weight: 800; color: #fff;
          text-transform: uppercase; letter-spacing: 1px; margin-bottom: 12px;
        }
        .thr-tujuan-desc { font-size: 14px; color: rgba(232,224,208,0.65); line-height: 1.75; }
        .thr-kegiatan-grid {
          display: grid; grid-template-columns: repeat(2, 1fr);
          gap: 1px; background: rgba(200,125,212,0.1);
        }
        @media (max-width: 640px) { .thr-kegiatan-grid { grid-template-columns: 1fr; } }
        .thr-kegiatan-item {
          background: #0d0a0f; padding: 28px 32px;
          display: flex; align-items: flex-start; gap: 20px; transition: background 0.2s;
        }
        .thr-kegiatan-item:hover { background: #130f18; }
        .thr-kegiatan-no {
          font-family: 'Bebas Neue', sans-serif;
          font-size: 32px; color: rgba(200,125,212,0.3); line-height: 1; flex-shrink: 0; width: 40px;
        }
        .thr-kegiatan-nama {
          font-family: 'Barlow Condensed', sans-serif;
          font-size: 18px; font-weight: 700; color: #fff;
          text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;
        }
        .thr-kegiatan-detail { font-size: 13px; color: rgba(232,224,208,0.5); }
        .thr-divider {
          display: flex; align-items: center; gap: 16px;
          max-width: 1100px; margin: 0 auto;
          padding: 0 clamp(24px, 6vw, 80px); opacity: 0.25;
        }
        .thr-divider::before, .thr-divider::after {
          content: ''; flex: 1; height: 1px; background: #C87DD4;
        }
        .thr-divider-icon { font-size: 14px; }
      `}</style>

      <div className="thr-root">
        <Navbar />

        <main>
          {/* ── Hero ── */}
          <section className="thr-hero">
            <div className="thr-hero-img">
              <Image src="/images/citter.jpg" alt="Theater SMK Citra Negara" fill priority />
              <div className="thr-hero-overlay" />
            </div>
            <div className="thr-hero-content">
              <div className="thr-eyebrow">Ekstrakurikuler SMK Citra Negara</div>
              <h1 className="thr-title">THE<span>ATER</span></h1>
              <p className="thr-subtitle">
                Teater menawarkan kesempatan bagi siswa untuk mengeksplorasi kreativitas dan
                mengembangkan keterampilan komunikasi. Dari akting hingga produksi panggung,
                kami membentuk seniman muda yang percaya diri.
              </p>
            </div>
          </section>

          {/* ── Stats ── */}
          <div className="thr-stats">
            {STATS.map(s => (
              <div key={s.label} className="thr-stat">
                <div className="thr-stat-num">{s.angka}</div>
                <div className="thr-stat-label">{s.label}</div>
              </div>
            ))}
          </div>

          {/* ── Tujuan ── */}
          <section className="thr-section">
            <div className="thr-section-label">Mengapa Theater</div>
            <h2 className="thr-section-heading">TUJUAN KAMI</h2>
            <div className="thr-tujuan-grid">
              {TUJUAN.map(t => (
                <div key={t.judul} className="thr-tujuan-card">
                  <span className="thr-tujuan-icon">{t.icon}</span>
                  <div className="thr-tujuan-title">{t.judul}</div>
                  <p className="thr-tujuan-desc">{t.deskripsi}</p>
                </div>
              ))}
            </div>
          </section>

          <div className="thr-divider"><span className="thr-divider-icon">✦</span></div>

          {/* ── Kegiatan ── */}
          <section className="thr-section" style={{ paddingTop: 'clamp(40px, 5vw, 64px)' }}>
            <div className="thr-section-label">Program Latihan</div>
            <h2 className="thr-section-heading">KEGIATAN RUTIN</h2>
            <div className="thr-kegiatan-grid">
              {KEGIATAN.map(k => (
                <div key={k.no} className="thr-kegiatan-item">
                  <div className="thr-kegiatan-no">{k.no}</div>
                  <div>
                    <div className="thr-kegiatan-nama">{k.nama}</div>
                    <div className="thr-kegiatan-detail">{k.detail}</div>
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