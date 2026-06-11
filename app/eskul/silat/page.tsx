'use client';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import Image from 'next/image';

const STATS = [
  { angka: '2009', label: 'Tahun Berdiri' },
  { angka: '40+',  label: 'Anggota Aktif' },
  { angka: '22',   label: 'Prestasi Diraih' },
  { angka: '100%', label: 'Dedikasi' },
];

const TUJUAN = [
  {
    icon: '🥊',
    judul: 'Bela Diri & Kebugaran',
    deskripsi:
      'Gerakan silat yang dinamis melatih kekuatan otot, kelenturan, kecepatan, dan daya tahan sekaligus membekali kemampuan self-defense.',
  },
  {
    icon: '🇮🇩',
    judul: 'Pelestarian Budaya',
    deskripsi:
      'Menumbuhkan rasa cinta dan bangga terhadap seni bela diri asli Indonesia di tengah arus globalisasi yang terus berkembang.',
  },
  {
    icon: '⚔️',
    judul: 'Karakter Pendekar',
    deskripsi:
      'Menanamkan nilai keberanian, kejujuran, kerendahan hati, dan pengendalian diri sebagai fondasi karakter siswa yang luhur.',
  },
];

const KEGIATAN = [
  { no: '01', nama: 'Latihan Teknik Dasar',     detail: 'Sikap pasang, kuda-kuda, pukulan, tendangan, bantingan.' },
  { no: '02', nama: 'Kategori Tanding (Laga)',   detail: 'Strategi serangan, pertahanan, dan aturan poin gelanggang.' },
  { no: '03', nama: 'Kategori Seni (TGR)',       detail: 'Jurus Tunggal, Ganda, dan Regu dengan ekspresi gerak.' },
  { no: '04', nama: 'Latihan Fisik & Napas',     detail: 'Stamina dan olah napas untuk performa maksimal.' },
  { no: '05', nama: 'Uji Tanding (Sparring)',    detail: 'Simulasi pertandingan internal dan latih tanding eksternal.' },
  { no: '06', nama: 'Keikutsertaan Kejuaraan',   detail: 'O2SN, POPDA, Kejurda hingga Kejurnas silat pelajar.' },
];

export default function SilatPage() {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Barlow:wght@400;500;600;700&family=Barlow+Condensed:wght@600;700;800&display=swap');

        .slt-root {
          font-family: 'Barlow', sans-serif;
          background: #0d0b08;
          color: #e8e0d0;
          min-height: 100vh;
        }
        .slt-hero { position: relative; overflow: hidden; background: #0d0b08; }
        .slt-hero-img { position: relative; width: 100%; height: min(70vh, 600px); }
        .slt-hero-img img {
          object-fit: cover;
          object-position: center top;
          filter: brightness(0.45) contrast(1.1);
        }
        .slt-hero-overlay {
          position: absolute; inset: 0;
          background: linear-gradient(to bottom, transparent 20%, rgba(13,11,8,0.6) 60%, #0d0b08 100%);
        }
        .slt-hero-content {
          position: absolute; bottom: 0; left: 0; right: 0;
          padding: 0 clamp(24px, 6vw, 80px) clamp(40px, 6vw, 72px);
        }
        .slt-eyebrow {
          display: inline-flex; align-items: center; gap: 10px;
          font-family: 'Barlow Condensed', sans-serif;
          font-size: 13px; font-weight: 700; letter-spacing: 3px;
          text-transform: uppercase; color: #D4A44A; margin-bottom: 16px;
        }
        .slt-eyebrow::before {
          content: ''; display: block; width: 32px; height: 2px; background: #D4A44A;
        }
        .slt-title {
          font-family: 'Bebas Neue', sans-serif;
          font-size: clamp(72px, 12vw, 160px);
          line-height: 0.9; color: #fff; letter-spacing: 2px; margin: 0 0 20px;
        }
        .slt-title span { color: #D4A44A; }
        .slt-subtitle {
          max-width: 560px; font-size: clamp(15px, 1.8vw, 18px);
          color: rgba(232,224,208,0.75); line-height: 1.7;
        }
        .slt-stats {
          display: grid; grid-template-columns: repeat(4, 1fr);
          border-top: 1px solid rgba(212,164,74,0.2);
          border-bottom: 1px solid rgba(212,164,74,0.2);
        }
        @media (max-width: 640px) { .slt-stats { grid-template-columns: repeat(2, 1fr); } }
        .slt-stat {
          padding: 28px 20px; text-align: center;
          border-right: 1px solid rgba(212,164,74,0.15);
        }
        .slt-stat:last-child { border-right: none; }
        .slt-stat-num {
          font-family: 'Bebas Neue', sans-serif;
          font-size: 42px; color: #D4A44A; line-height: 1; margin-bottom: 6px;
        }
        .slt-stat-label {
          font-size: 11px; font-weight: 600; letter-spacing: 2px;
          text-transform: uppercase; color: rgba(232,224,208,0.5);
        }
        .slt-section {
          max-width: 1100px; margin: 0 auto;
          padding: clamp(56px, 8vw, 96px) clamp(24px, 6vw, 80px);
        }
        .slt-section-label {
          font-family: 'Barlow Condensed', sans-serif;
          font-size: 11px; font-weight: 700; letter-spacing: 3px;
          text-transform: uppercase; color: #D4A44A; margin-bottom: 12px;
        }
        .slt-section-heading {
          font-family: 'Bebas Neue', sans-serif;
          font-size: clamp(40px, 5vw, 64px); color: #fff; line-height: 1; margin-bottom: 48px;
        }
        .slt-tujuan-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 2px; }
        @media (max-width: 768px) { .slt-tujuan-grid { grid-template-columns: 1fr; } }
        .slt-tujuan-card {
          background: #181208; padding: 36px 28px;
          border: 1px solid rgba(212,164,74,0.08);
          transition: background 0.2s, border-color 0.2s;
          position: relative; overflow: hidden;
        }
        .slt-tujuan-card::after {
          content: ''; position: absolute; bottom: 0; left: 0; right: 0;
          height: 2px; background: #D4A44A;
          transform: scaleX(0); transform-origin: left; transition: transform 0.3s ease;
        }
        .slt-tujuan-card:hover { background: #221a0a; border-color: rgba(212,164,74,0.2); }
        .slt-tujuan-card:hover::after { transform: scaleX(1); }
        .slt-tujuan-icon { font-size: 36px; margin-bottom: 20px; display: block; }
        .slt-tujuan-title {
          font-family: 'Barlow Condensed', sans-serif;
          font-size: 22px; font-weight: 800; color: #fff;
          text-transform: uppercase; letter-spacing: 1px; margin-bottom: 12px;
        }
        .slt-tujuan-desc { font-size: 14px; color: rgba(232,224,208,0.65); line-height: 1.75; }
        .slt-kegiatan-grid {
          display: grid; grid-template-columns: repeat(2, 1fr);
          gap: 1px; background: rgba(212,164,74,0.1);
        }
        @media (max-width: 640px) { .slt-kegiatan-grid { grid-template-columns: 1fr; } }
        .slt-kegiatan-item {
          background: #0d0b08; padding: 28px 32px;
          display: flex; align-items: flex-start; gap: 20px; transition: background 0.2s;
        }
        .slt-kegiatan-item:hover { background: #181208; }
        .slt-kegiatan-no {
          font-family: 'Bebas Neue', sans-serif;
          font-size: 32px; color: rgba(212,164,74,0.3); line-height: 1; flex-shrink: 0; width: 40px;
        }
        .slt-kegiatan-nama {
          font-family: 'Barlow Condensed', sans-serif;
          font-size: 18px; font-weight: 700; color: #fff;
          text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;
        }
        .slt-kegiatan-detail { font-size: 13px; color: rgba(232,224,208,0.5); }
        .slt-divider {
          display: flex; align-items: center; gap: 16px;
          max-width: 1100px; margin: 0 auto;
          padding: 0 clamp(24px, 6vw, 80px); opacity: 0.25;
        }
        .slt-divider::before, .slt-divider::after {
          content: ''; flex: 1; height: 1px; background: #D4A44A;
        }
        .slt-divider-icon { font-size: 14px; }
      `}</style>

      <div className="slt-root">
        <Navbar />

        <main>
          {/* ── Hero ── */}
          <section className="slt-hero">
            <div className="slt-hero-img">
              <Image src="/images/silat.jpg" alt="Pencak Silat SMK Citra Negara" fill priority />
              <div className="slt-hero-overlay" />
            </div>
            <div className="slt-hero-content">
              <div className="slt-eyebrow">Ekstrakurikuler SMK Citra Negara</div>
              <h1 className="slt-title">PENCAK<span> SILAT</span></h1>
              <p className="slt-subtitle">
                Pencak Silat adalah seni bela diri asli Indonesia yang telah diakui dunia.
                Kami hadir untuk melestarikan warisan budaya bangsa sekaligus membentuk
                karakter siswa yang tangguh dan berbudi pekerti luhur.
              </p>
            </div>
          </section>

          {/* ── Stats ── */}
          <div className="slt-stats">
            {STATS.map(s => (
              <div key={s.label} className="slt-stat">
                <div className="slt-stat-num">{s.angka}</div>
                <div className="slt-stat-label">{s.label}</div>
              </div>
            ))}
          </div>

          {/* ── Tujuan ── */}
          <section className="slt-section">
            <div className="slt-section-label">Mengapa Pencak Silat</div>
            <h2 className="slt-section-heading">TUJUAN KAMI</h2>
            <div className="slt-tujuan-grid">
              {TUJUAN.map(t => (
                <div key={t.judul} className="slt-tujuan-card">
                  <span className="slt-tujuan-icon">{t.icon}</span>
                  <div className="slt-tujuan-title">{t.judul}</div>
                  <p className="slt-tujuan-desc">{t.deskripsi}</p>
                </div>
              ))}
            </div>
          </section>

          <div className="slt-divider"><span className="slt-divider-icon">✦</span></div>

          {/* ── Kegiatan ── */}
          <section className="slt-section" style={{ paddingTop: 'clamp(40px, 5vw, 64px)' }}>
            <div className="slt-section-label">Program Latihan</div>
            <h2 className="slt-section-heading">KEGIATAN RUTIN</h2>
            <div className="slt-kegiatan-grid">
              {KEGIATAN.map(k => (
                <div key={k.no} className="slt-kegiatan-item">
                  <div className="slt-kegiatan-no">{k.no}</div>
                  <div>
                    <div className="slt-kegiatan-nama">{k.nama}</div>
                    <div className="slt-kegiatan-detail">{k.detail}</div>
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