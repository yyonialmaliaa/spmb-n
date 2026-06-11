'use client';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import Image from 'next/image';

const STATS = [
  { angka: '2022', label: 'Tahun Berdiri' },
  { angka: '30+',  label: 'Anggota Aktif' },
  { angka: '15',   label: 'Prestasi Diraih' },
  { angka: '100%', label: 'Dedikasi' },
];

const TUJUAN = [
  {
    icon: '🎮',
    judul: 'Strategi & Taktik',
    deskripsi:
      'Esports melatih kemampuan pengambilan keputusan yang cepat dan tepat di bawah tekanan, serta kemampuan memecahkan masalah secara kritis.',
  },
  {
    icon: '🤝',
    judul: 'Kerjasama Tim',
    deskripsi:
      'Seperti olahraga beregu lainnya, Esports mengajarkan pentingnya komunikasi efektif, pembagian peran, dan kepercayaan antar anggota tim.',
  },
  {
    icon: '🏆',
    judul: 'Sportivitas Digital',
    deskripsi:
      'Siswa belajar etika digital, fair play, menghormati lawan, dan bersikap bijak dalam menghadapi kemenangan maupun kekalahan.',
  },
];

const KEGIATAN = [
  { no: '01', nama: 'Latihan Mekanik Dasar',        detail: 'Akurasi, pergerakan, dan penguasaan alat kontrol.' },
  { no: '02', nama: 'Analisis Pertandingan',         detail: 'Review rekaman untuk evaluasi dan perbaikan strategi.' },
  { no: '03', nama: 'Simulasi Pertandingan',         detail: 'Scrimmage melawan tim internal maupun eksternal.' },
  { no: '04', nama: 'Partisipasi Turnamen',          detail: 'Kompetisi Esports regional hingga nasional.' },
  { no: '05', nama: 'Pengembangan Mentalitas',       detail: 'Mental tangguh, manajemen emosi, dan fokus kritis.' },
  { no: '06', nama: 'Penyusunan Strategi',           detail: 'Drafting, rotasi peta, dan manajemen sumber daya tim.' },
];

export default function EsportPage() {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Barlow:wght@400;500;600;700&family=Barlow+Condensed:wght@600;700;800&display=swap');

        .esp-root {
          font-family: 'Barlow', sans-serif;
          background: #08080d;
          color: #e8e0d0;
          min-height: 100vh;
        }
        .esp-hero { position: relative; overflow: hidden; background: #08080d; }
        .esp-hero-img { position: relative; width: 100%; height: min(70vh, 600px); }
        .esp-hero-img img {
          object-fit: cover;
          object-position: center top;
          filter: brightness(0.45) contrast(1.1);
        }
        .esp-hero-overlay {
          position: absolute; inset: 0;
          background: linear-gradient(to bottom, transparent 20%, rgba(8,8,13,0.6) 60%, #08080d 100%);
        }
        .esp-hero-content {
          position: absolute; bottom: 0; left: 0; right: 0;
          padding: 0 clamp(24px, 6vw, 80px) clamp(40px, 6vw, 72px);
        }
        .esp-eyebrow {
          display: inline-flex; align-items: center; gap: 10px;
          font-family: 'Barlow Condensed', sans-serif;
          font-size: 13px; font-weight: 700; letter-spacing: 3px;
          text-transform: uppercase; color: #7C6AFA; margin-bottom: 16px;
        }
        .esp-eyebrow::before {
          content: ''; display: block; width: 32px; height: 2px; background: #7C6AFA;
        }
        .esp-title {
          font-family: 'Bebas Neue', sans-serif;
          font-size: clamp(72px, 12vw, 160px);
          line-height: 0.9; color: #fff; letter-spacing: 2px; margin: 0 0 20px;
        }
        .esp-title span { color: #7C6AFA; }
        .esp-subtitle {
          max-width: 560px; font-size: clamp(15px, 1.8vw, 18px);
          color: rgba(232,224,208,0.75); line-height: 1.7;
        }
        .esp-stats {
          display: grid; grid-template-columns: repeat(4, 1fr);
          border-top: 1px solid rgba(124,106,250,0.2);
          border-bottom: 1px solid rgba(124,106,250,0.2);
        }
        @media (max-width: 640px) { .esp-stats { grid-template-columns: repeat(2, 1fr); } }
        .esp-stat {
          padding: 28px 20px; text-align: center;
          border-right: 1px solid rgba(124,106,250,0.15);
        }
        .esp-stat:last-child { border-right: none; }
        .esp-stat-num {
          font-family: 'Bebas Neue', sans-serif;
          font-size: 42px; color: #7C6AFA; line-height: 1; margin-bottom: 6px;
        }
        .esp-stat-label {
          font-size: 11px; font-weight: 600; letter-spacing: 2px;
          text-transform: uppercase; color: rgba(232,224,208,0.5);
        }
        .esp-section {
          max-width: 1100px; margin: 0 auto;
          padding: clamp(56px, 8vw, 96px) clamp(24px, 6vw, 80px);
        }
        .esp-section-label {
          font-family: 'Barlow Condensed', sans-serif;
          font-size: 11px; font-weight: 700; letter-spacing: 3px;
          text-transform: uppercase; color: #7C6AFA; margin-bottom: 12px;
        }
        .esp-section-heading {
          font-family: 'Bebas Neue', sans-serif;
          font-size: clamp(40px, 5vw, 64px); color: #fff; line-height: 1; margin-bottom: 48px;
        }
        .esp-tujuan-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 2px; }
        @media (max-width: 768px) { .esp-tujuan-grid { grid-template-columns: 1fr; } }
        .esp-tujuan-card {
          background: #0f0f1a; padding: 36px 28px;
          border: 1px solid rgba(124,106,250,0.08);
          transition: background 0.2s, border-color 0.2s;
          position: relative; overflow: hidden;
        }
        .esp-tujuan-card::after {
          content: ''; position: absolute; bottom: 0; left: 0; right: 0;
          height: 2px; background: #7C6AFA;
          transform: scaleX(0); transform-origin: left; transition: transform 0.3s ease;
        }
        .esp-tujuan-card:hover { background: #13132a; border-color: rgba(124,106,250,0.2); }
        .esp-tujuan-card:hover::after { transform: scaleX(1); }
        .esp-tujuan-icon { font-size: 36px; margin-bottom: 20px; display: block; }
        .esp-tujuan-title {
          font-family: 'Barlow Condensed', sans-serif;
          font-size: 22px; font-weight: 800; color: #fff;
          text-transform: uppercase; letter-spacing: 1px; margin-bottom: 12px;
        }
        .esp-tujuan-desc { font-size: 14px; color: rgba(232,224,208,0.65); line-height: 1.75; }
        .esp-kegiatan-grid {
          display: grid; grid-template-columns: repeat(2, 1fr);
          gap: 1px; background: rgba(124,106,250,0.1);
        }
        @media (max-width: 640px) { .esp-kegiatan-grid { grid-template-columns: 1fr; } }
        .esp-kegiatan-item {
          background: #08080d; padding: 28px 32px;
          display: flex; align-items: flex-start; gap: 20px; transition: background 0.2s;
        }
        .esp-kegiatan-item:hover { background: #0f0f1a; }
        .esp-kegiatan-no {
          font-family: 'Bebas Neue', sans-serif;
          font-size: 32px; color: rgba(124,106,250,0.3); line-height: 1; flex-shrink: 0; width: 40px;
        }
        .esp-kegiatan-nama {
          font-family: 'Barlow Condensed', sans-serif;
          font-size: 18px; font-weight: 700; color: #fff;
          text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;
        }
        .esp-kegiatan-detail { font-size: 13px; color: rgba(232,224,208,0.5); }
        .esp-divider {
          display: flex; align-items: center; gap: 16px;
          max-width: 1100px; margin: 0 auto;
          padding: 0 clamp(24px, 6vw, 80px); opacity: 0.25;
        }
        .esp-divider::before, .esp-divider::after {
          content: ''; flex: 1; height: 1px; background: #7C6AFA;
        }
        .esp-divider-icon { font-size: 14px; }
      `}</style>

      <div className="esp-root">
        <Navbar />

        <main>
          {/* ── Hero ── */}
          <section className="esp-hero">
            <div className="esp-hero-img">
              <Image src="/images/esprot.jpg" alt="Esport SMK Citra Negara" fill priority />
              <div className="esp-hero-overlay" />
            </div>
            <div className="esp-hero-content">
              <div className="esp-eyebrow">Ekstrakurikuler SMK Citra Negara</div>
              <h1 className="esp-title">E<span>SPORT</span></h1>
              <p className="esp-subtitle">
                Esports (Electronic Sports) adalah salah satu cabang aktivitas yang sangat berkembang
                di era digital. Ekstrakurikuler Esports tidak hanya menawarkan sarana penyaluran hobi,
                tetapi juga mengajarkan manajemen strategi, kerjasama tim, dan pengendalian diri.
              </p>
            </div>
          </section>

          {/* ── Stats ── */}
          <div className="esp-stats">
            {STATS.map(s => (
              <div key={s.label} className="esp-stat">
                <div className="esp-stat-num">{s.angka}</div>
                <div className="esp-stat-label">{s.label}</div>
              </div>
            ))}
          </div>

          {/* ── Tujuan ── */}
          <section className="esp-section">
            <div className="esp-section-label">Mengapa Esport</div>
            <h2 className="esp-section-heading">TUJUAN KAMI</h2>
            <div className="esp-tujuan-grid">
              {TUJUAN.map(t => (
                <div key={t.judul} className="esp-tujuan-card">
                  <span className="esp-tujuan-icon">{t.icon}</span>
                  <div className="esp-tujuan-title">{t.judul}</div>
                  <p className="esp-tujuan-desc">{t.deskripsi}</p>
                </div>
              ))}
            </div>
          </section>

          <div className="esp-divider"><span className="esp-divider-icon">✦</span></div>

          {/* ── Kegiatan ── */}
          <section className="esp-section" style={{ paddingTop: 'clamp(40px, 5vw, 64px)' }}>
            <div className="esp-section-label">Program Latihan</div>
            <h2 className="esp-section-heading">KEGIATAN RUTIN</h2>
            <div className="esp-kegiatan-grid">
              {KEGIATAN.map(k => (
                <div key={k.no} className="esp-kegiatan-item">
                  <div className="esp-kegiatan-no">{k.no}</div>
                  <div>
                    <div className="esp-kegiatan-nama">{k.nama}</div>
                    <div className="esp-kegiatan-detail">{k.detail}</div>
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