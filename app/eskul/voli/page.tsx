'use client';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import Image from 'next/image';

const STATS = [
  { angka: '2012', label: 'Tahun Berdiri' },
  { angka: '30+',  label: 'Anggota Aktif' },
  { angka: '14',   label: 'Prestasi Diraih' },
  { angka: '100%', label: 'Dedikasi' },
];

const TUJUAN = [
  {
    icon: '🏐',
    judul: 'Kebugaran Fisik',
    deskripsi:
      'Latihan dan pertandingan voli membantu meningkatkan kekuatan, kelincahan, dan daya tahan tubuh secara menyeluruh.',
  },
  {
    icon: '🤝',
    judul: 'Kerjasama Tim',
    deskripsi:
      'Voli adalah olahraga tim yang mengajarkan pentingnya kerja sama, komunikasi efektif, dan strategi bersama di lapangan.',
  },
  {
    icon: '🏆',
    judul: 'Sportivitas',
    deskripsi:
      'Siswa belajar tentang sportivitas, fair play, dan cara menghadapi kemenangan maupun kekalahan dengan sikap positif.',
  },
];

const KEGIATAN = [
  { no: '01', nama: 'Latihan Teknik Dasar',      detail: 'Servis, passing, setting, dan smashing.' },
  { no: '02', nama: 'Latihan Fisik',              detail: 'Lari, jumping, dan strength training.' },
  { no: '03', nama: 'Simulasi Pertandingan',      detail: 'Praktik strategi dan taktik tim di lapangan.' },
  { no: '04', nama: 'Turnamen Internal & Eksternal', detail: 'Kompetisi di dalam dan luar sekolah.' },
  { no: '05', nama: 'Pengembangan Mentalitas',    detail: 'Mental pemenang, fokus di bawah tekanan.' },
  { no: '06', nama: 'Strategi & Taktik',          detail: 'Formasi serangan dan pertahanan tim.' },
];

export default function VoliPage() {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Barlow:wght@400;500;600;700&family=Barlow+Condensed:wght@600;700;800&display=swap');

        .vli-root {
          font-family: 'Barlow', sans-serif;
          background: #0d0808;
          color: #e8e0d0;
          min-height: 100vh;
        }
        .vli-hero { position: relative; overflow: hidden; background: #0d0808; }
        .vli-hero-img { position: relative; width: 100%; height: min(70vh, 600px); }
        .vli-hero-img img {
          object-fit: cover;
          object-position: center top;
          filter: brightness(0.45) contrast(1.1);
        }
        .vli-hero-overlay {
          position: absolute; inset: 0;
          background: linear-gradient(to bottom, transparent 20%, rgba(13,8,8,0.6) 60%, #0d0808 100%);
        }
        .vli-hero-content {
          position: absolute; bottom: 0; left: 0; right: 0;
          padding: 0 clamp(24px, 6vw, 80px) clamp(40px, 6vw, 72px);
        }
        .vli-eyebrow {
          display: inline-flex; align-items: center; gap: 10px;
          font-family: 'Barlow Condensed', sans-serif;
          font-size: 13px; font-weight: 700; letter-spacing: 3px;
          text-transform: uppercase; color: #E85A3A; margin-bottom: 16px;
        }
        .vli-eyebrow::before {
          content: ''; display: block; width: 32px; height: 2px; background: #E85A3A;
        }
        .vli-title {
          font-family: 'Bebas Neue', sans-serif;
          font-size: clamp(72px, 12vw, 160px);
          line-height: 0.9; color: #fff; letter-spacing: 2px; margin: 0 0 20px;
        }
        .vli-title span { color: #E85A3A; }
        .vli-subtitle {
          max-width: 560px; font-size: clamp(15px, 1.8vw, 18px);
          color: rgba(232,224,208,0.75); line-height: 1.7;
        }
        .vli-stats {
          display: grid; grid-template-columns: repeat(4, 1fr);
          border-top: 1px solid rgba(232,90,58,0.2);
          border-bottom: 1px solid rgba(232,90,58,0.2);
        }
        @media (max-width: 640px) { .vli-stats { grid-template-columns: repeat(2, 1fr); } }
        .vli-stat {
          padding: 28px 20px; text-align: center;
          border-right: 1px solid rgba(232,90,58,0.15);
        }
        .vli-stat:last-child { border-right: none; }
        .vli-stat-num {
          font-family: 'Bebas Neue', sans-serif;
          font-size: 42px; color: #E85A3A; line-height: 1; margin-bottom: 6px;
        }
        .vli-stat-label {
          font-size: 11px; font-weight: 600; letter-spacing: 2px;
          text-transform: uppercase; color: rgba(232,224,208,0.5);
        }
        .vli-section {
          max-width: 1100px; margin: 0 auto;
          padding: clamp(56px, 8vw, 96px) clamp(24px, 6vw, 80px);
        }
        .vli-section-label {
          font-family: 'Barlow Condensed', sans-serif;
          font-size: 11px; font-weight: 700; letter-spacing: 3px;
          text-transform: uppercase; color: #E85A3A; margin-bottom: 12px;
        }
        .vli-section-heading {
          font-family: 'Bebas Neue', sans-serif;
          font-size: clamp(40px, 5vw, 64px); color: #fff; line-height: 1; margin-bottom: 48px;
        }
        .vli-tujuan-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 2px; }
        @media (max-width: 768px) { .vli-tujuan-grid { grid-template-columns: 1fr; } }
        .vli-tujuan-card {
          background: #150a0a; padding: 36px 28px;
          border: 1px solid rgba(232,90,58,0.08);
          transition: background 0.2s, border-color 0.2s;
          position: relative; overflow: hidden;
        }
        .vli-tujuan-card::after {
          content: ''; position: absolute; bottom: 0; left: 0; right: 0;
          height: 2px; background: #E85A3A;
          transform: scaleX(0); transform-origin: left; transition: transform 0.3s ease;
        }
        .vli-tujuan-card:hover { background: #1e0d0d; border-color: rgba(232,90,58,0.2); }
        .vli-tujuan-card:hover::after { transform: scaleX(1); }
        .vli-tujuan-icon { font-size: 36px; margin-bottom: 20px; display: block; }
        .vli-tujuan-title {
          font-family: 'Barlow Condensed', sans-serif;
          font-size: 22px; font-weight: 800; color: #fff;
          text-transform: uppercase; letter-spacing: 1px; margin-bottom: 12px;
        }
        .vli-tujuan-desc { font-size: 14px; color: rgba(232,224,208,0.65); line-height: 1.75; }
        .vli-kegiatan-grid {
          display: grid; grid-template-columns: repeat(2, 1fr);
          gap: 1px; background: rgba(232,90,58,0.1);
        }
        @media (max-width: 640px) { .vli-kegiatan-grid { grid-template-columns: 1fr; } }
        .vli-kegiatan-item {
          background: #0d0808; padding: 28px 32px;
          display: flex; align-items: flex-start; gap: 20px; transition: background 0.2s;
        }
        .vli-kegiatan-item:hover { background: #150a0a; }
        .vli-kegiatan-no {
          font-family: 'Bebas Neue', sans-serif;
          font-size: 32px; color: rgba(232,90,58,0.3); line-height: 1; flex-shrink: 0; width: 40px;
        }
        .vli-kegiatan-nama {
          font-family: 'Barlow Condensed', sans-serif;
          font-size: 18px; font-weight: 700; color: #fff;
          text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;
        }
        .vli-kegiatan-detail { font-size: 13px; color: rgba(232,224,208,0.5); }
        .vli-divider {
          display: flex; align-items: center; gap: 16px;
          max-width: 1100px; margin: 0 auto;
          padding: 0 clamp(24px, 6vw, 80px); opacity: 0.25;
        }
        .vli-divider::before, .vli-divider::after {
          content: ''; flex: 1; height: 1px; background: #E85A3A;
        }
        .vli-divider-icon { font-size: 14px; }
      `}</style>

      <div className="vli-root">
        <Navbar />

        <main>
          {/* ── Hero ── */}
          <section className="vli-hero">
            <div className="vli-hero-img">
              <Image src="/images/voli.jpg" alt="Voli SMK Citra Negara" fill priority />
              <div className="vli-hero-overlay" />
            </div>
            <div className="vli-hero-content">
              <div className="vli-eyebrow">Ekstrakurikuler SMK Citra Negara</div>
              <h1 className="vli-title">VO<span>LI</span></h1>
              <p className="vli-subtitle">
                Voli adalah olahraga yang digemari banyak pelajar. Tidak hanya melatih fisik,
                voli membangun kerjasama tim, kedisiplinan, dan mentalitas juara yang tangguh
                di setiap sesi latihan.
              </p>
            </div>
          </section>

          {/* ── Stats ── */}
          <div className="vli-stats">
            {STATS.map(s => (
              <div key={s.label} className="vli-stat">
                <div className="vli-stat-num">{s.angka}</div>
                <div className="vli-stat-label">{s.label}</div>
              </div>
            ))}
          </div>

          {/* ── Tujuan ── */}
          <section className="vli-section">
            <div className="vli-section-label">Mengapa Voli</div>
            <h2 className="vli-section-heading">TUJUAN KAMI</h2>
            <div className="vli-tujuan-grid">
              {TUJUAN.map(t => (
                <div key={t.judul} className="vli-tujuan-card">
                  <span className="vli-tujuan-icon">{t.icon}</span>
                  <div className="vli-tujuan-title">{t.judul}</div>
                  <p className="vli-tujuan-desc">{t.deskripsi}</p>
                </div>
              ))}
            </div>
          </section>

          <div className="vli-divider"><span className="vli-divider-icon">✦</span></div>

          {/* ── Kegiatan ── */}
          <section className="vli-section" style={{ paddingTop: 'clamp(40px, 5vw, 64px)' }}>
            <div className="vli-section-label">Program Latihan</div>
            <h2 className="vli-section-heading">KEGIATAN RUTIN</h2>
            <div className="vli-kegiatan-grid">
              {KEGIATAN.map(k => (
                <div key={k.no} className="vli-kegiatan-item">
                  <div className="vli-kegiatan-no">{k.no}</div>
                  <div>
                    <div className="vli-kegiatan-nama">{k.nama}</div>
                    <div className="vli-kegiatan-detail">{k.detail}</div>
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