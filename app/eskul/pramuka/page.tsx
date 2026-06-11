'use client';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import Image from 'next/image';

const STATS = [
  { angka: '1961', label: 'Tahun Berdiri' },
  { angka: '40+',  label: 'Anggota Aktif' },
  { angka: '10',   label: 'Prestasi Diraih' },
  { angka: '100%', label: 'Dedikasi' },
];

const TUJUAN = [
  {
    icon: '⛺',
    judul: 'Kedisiplinan',
    deskripsi:
      'Pramuka mengajarkan pentingnya kedisiplinan melalui berbagai kegiatan terstruktur dan aturan yang membentuk karakter kuat.',
  },
  {
    icon: '🌿',
    judul: 'Cinta Alam',
    deskripsi:
      'Melalui kegiatan di alam terbuka, Pramuka menumbuhkan kesadaran untuk menjaga dan menghargai lingkungan sekitar.',
  },
  {
    icon: '👑',
    judul: 'Karakter & Kepemimpinan',
    deskripsi:
      'Menanamkan nilai kepemimpinan, tanggung jawab, kerjasama, dan kepedulian terhadap sesama dalam setiap kegiatan.',
  },
];

const KEGIATAN = [
  { no: '01', nama: 'Latihan Rutin',              detail: 'Tali-temali, mendirikan tenda, dan api unggun.' },
  { no: '02', nama: 'Kegiatan Kemah',             detail: 'Hiking, penjelajahan, dan permainan menantang.' },
  { no: '03', nama: 'Lomba & Kompetisi',          detail: 'Tingkat sekolah, daerah, hingga nasional.' },
  { no: '04', nama: 'Pengabdian Masyarakat',      detail: 'Bakti sosial, penanaman pohon, dan lingkungan.' },
  { no: '05', nama: 'Kegiatan Kepemimpinan',      detail: 'Ketua regu, pemimpin upacara, dan peran aktif.' },
  { no: '06', nama: 'Pelatihan & Kursus',         detail: 'Pertolongan pertama, navigasi, dan survival.' },
];

export default function PramukaPage() {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Barlow:wght@400;500;600;700&family=Barlow+Condensed:wght@600;700;800&display=swap');

        .psk-root {
          font-family: 'Barlow', sans-serif;
          background: #080d0a;
          color: #e8e0d0;
          min-height: 100vh;
        }
        .psk-hero { position: relative; overflow: hidden; background: #080d0a; }
        .psk-hero-img { position: relative; width: 100%; height: min(70vh, 600px); }
        .psk-hero-img img {
          object-fit: cover;
          object-position: center top;
          filter: brightness(0.45) contrast(1.1);
        }
        .psk-hero-overlay {
          position: absolute; inset: 0;
          background: linear-gradient(to bottom, transparent 20%, rgba(8,13,10,0.6) 60%, #080d0a 100%);
        }
        .psk-hero-content {
          position: absolute; bottom: 0; left: 0; right: 0;
          padding: 0 clamp(24px, 6vw, 80px) clamp(40px, 6vw, 72px);
        }
        .psk-eyebrow {
          display: inline-flex; align-items: center; gap: 10px;
          font-family: 'Barlow Condensed', sans-serif;
          font-size: 13px; font-weight: 700; letter-spacing: 3px;
          text-transform: uppercase; color: #C8973A; margin-bottom: 16px;
        }
        .psk-eyebrow::before {
          content: ''; display: block; width: 32px; height: 2px; background: #C8973A;
        }
        .psk-title {
          font-family: 'Bebas Neue', sans-serif;
          font-size: clamp(72px, 12vw, 160px);
          line-height: 0.9; color: #fff; letter-spacing: 2px; margin: 0 0 20px;
        }
        .psk-title span { color: #C8973A; }
        .psk-subtitle {
          max-width: 560px; font-size: clamp(15px, 1.8vw, 18px);
          color: rgba(232,224,208,0.75); line-height: 1.7;
        }
        .psk-stats {
          display: grid; grid-template-columns: repeat(4, 1fr);
          border-top: 1px solid rgba(200,151,58,0.2);
          border-bottom: 1px solid rgba(200,151,58,0.2);
        }
        @media (max-width: 640px) { .psk-stats { grid-template-columns: repeat(2, 1fr); } }
        .psk-stat {
          padding: 28px 20px; text-align: center;
          border-right: 1px solid rgba(200,151,58,0.15);
        }
        .psk-stat:last-child { border-right: none; }
        .psk-stat-num {
          font-family: 'Bebas Neue', sans-serif;
          font-size: 42px; color: #C8973A; line-height: 1; margin-bottom: 6px;
        }
        .psk-stat-label {
          font-size: 11px; font-weight: 600; letter-spacing: 2px;
          text-transform: uppercase; color: rgba(232,224,208,0.5);
        }
        .psk-section {
          max-width: 1100px; margin: 0 auto;
          padding: clamp(56px, 8vw, 96px) clamp(24px, 6vw, 80px);
        }
        .psk-section-label {
          font-family: 'Barlow Condensed', sans-serif;
          font-size: 11px; font-weight: 700; letter-spacing: 3px;
          text-transform: uppercase; color: #C8973A; margin-bottom: 12px;
        }
        .psk-section-heading {
          font-family: 'Bebas Neue', sans-serif;
          font-size: clamp(40px, 5vw, 64px); color: #fff; line-height: 1; margin-bottom: 48px;
        }
        .psk-tujuan-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 2px; }
        @media (max-width: 768px) { .psk-tujuan-grid { grid-template-columns: 1fr; } }
        .psk-tujuan-card {
          background: #0f1a12; padding: 36px 28px;
          border: 1px solid rgba(200,151,58,0.08);
          transition: background 0.2s, border-color 0.2s;
          position: relative; overflow: hidden;
        }
        .psk-tujuan-card::after {
          content: ''; position: absolute; bottom: 0; left: 0; right: 0;
          height: 2px; background: #C8973A;
          transform: scaleX(0); transform-origin: left; transition: transform 0.3s ease;
        }
        .psk-tujuan-card:hover { background: #131f16; border-color: rgba(200,151,58,0.2); }
        .psk-tujuan-card:hover::after { transform: scaleX(1); }
        .psk-tujuan-icon { font-size: 36px; margin-bottom: 20px; display: block; }
        .psk-tujuan-title {
          font-family: 'Barlow Condensed', sans-serif;
          font-size: 22px; font-weight: 800; color: #fff;
          text-transform: uppercase; letter-spacing: 1px; margin-bottom: 12px;
        }
        .psk-tujuan-desc { font-size: 14px; color: rgba(232,224,208,0.65); line-height: 1.75; }
        .psk-kegiatan-grid {
          display: grid; grid-template-columns: repeat(2, 1fr);
          gap: 1px; background: rgba(200,151,58,0.1);
        }
        @media (max-width: 640px) { .psk-kegiatan-grid { grid-template-columns: 1fr; } }
        .psk-kegiatan-item {
          background: #080d0a; padding: 28px 32px;
          display: flex; align-items: flex-start; gap: 20px; transition: background 0.2s;
        }
        .psk-kegiatan-item:hover { background: #0f1a12; }
        .psk-kegiatan-no {
          font-family: 'Bebas Neue', sans-serif;
          font-size: 32px; color: rgba(200,151,58,0.3); line-height: 1; flex-shrink: 0; width: 40px;
        }
        .psk-kegiatan-nama {
          font-family: 'Barlow Condensed', sans-serif;
          font-size: 18px; font-weight: 700; color: #fff;
          text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;
        }
        .psk-kegiatan-detail { font-size: 13px; color: rgba(232,224,208,0.5); }
        .psk-divider {
          display: flex; align-items: center; gap: 16px;
          max-width: 1100px; margin: 0 auto;
          padding: 0 clamp(24px, 6vw, 80px); opacity: 0.25;
        }
        .psk-divider::before, .psk-divider::after {
          content: ''; flex: 1; height: 1px; background: #C8973A;
        }
        .psk-divider-icon { font-size: 14px; }
      `}</style>

      <div className="psk-root">
        <Navbar />

        <main>
          {/* ── Hero ── */}
          <section className="psk-hero">
            <div className="psk-hero-img">
              <Image src="/images/pramuka.jpg" alt="Pramuka SMK Citra Negara" fill priority />
              <div className="psk-hero-overlay" />
            </div>
            <div className="psk-hero-content">
              <div className="psk-eyebrow">Ekstrakurikuler SMK Citra Negara</div>
              <h1 className="psk-title">PRA<span>MUKA</span></h1>
              <p className="psk-subtitle">
                Lebih dari sekadar kegiatan alam — Pramuka adalah tempat menempa karakter, kedisiplinan, dan jiwa pengabdian sejati untuk bangsa dan lingkungan.
              </p>
            </div>
          </section>

          {/* ── Stats ── */}
          <div className="psk-stats">
            {STATS.map(s => (
              <div key={s.label} className="psk-stat">
                <div className="psk-stat-num">{s.angka}</div>
                <div className="psk-stat-label">{s.label}</div>
              </div>
            ))}
          </div>

          {/* ── Tujuan ── */}
          <section className="psk-section">
            <div className="psk-section-label">Mengapa Pramuka</div>
            <h2 className="psk-section-heading">TUJUAN KAMI</h2>
            <div className="psk-tujuan-grid">
              {TUJUAN.map(t => (
                <div key={t.judul} className="psk-tujuan-card">
                  <span className="psk-tujuan-icon">{t.icon}</span>
                  <div className="psk-tujuan-title">{t.judul}</div>
                  <p className="psk-tujuan-desc">{t.deskripsi}</p>
                </div>
              ))}
            </div>
          </section>

          <div className="psk-divider"><span className="psk-divider-icon">✦</span></div>

          {/* ── Kegiatan ── */}
          <section className="psk-section" style={{ paddingTop: 'clamp(40px, 5vw, 64px)' }}>
            <div className="psk-section-label">Program Latihan</div>
            <h2 className="psk-section-heading">KEGIATAN RUTIN</h2>
            <div className="psk-kegiatan-grid">
              {KEGIATAN.map(k => (
                <div key={k.no} className="psk-kegiatan-item">
                  <div className="psk-kegiatan-no">{k.no}</div>
                  <div>
                    <div className="psk-kegiatan-nama">{k.nama}</div>
                    <div className="psk-kegiatan-detail">{k.detail}</div>
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