'use client';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import Image from 'next/image';

const STATS = [
  { angka: '2010', label: 'Tahun Berdiri' },
  { angka: '35+',  label: 'Anggota Aktif' },
  { angka: '8',    label: 'Prestasi Diraih' },
  { angka: '100%', label: 'Dedikasi' },
];

const TUJUAN = [
  {
    icon: '🕌',
    judul: 'Kecerdasan Spiritual',
    deskripsi:
      'Melalui kajian dan ibadah rutin, IRMA membantu meningkatkan keimanan, ketakwaan, dan ketenangan batin setiap anggota.',
  },
  {
    icon: '🤲',
    judul: 'Ukhuwah Islamiyah',
    deskripsi:
      'IRMA adalah wadah sosial yang mengajarkan persaudaraan, solidaritas, dan kolaborasi dalam kebaikan (fastabiqul khairat).',
  },
  {
    icon: '📖',
    judul: 'Adab & Akhlak',
    deskripsi:
      'Siswa belajar etika pergaulan, rasa hormat, dan cara bersikap santun kepada guru, teman, maupun masyarakat luas.',
  },
];

const KEGIATAN = [
  { no: '01', nama: 'Pembinaan Dasar Islam',     detail: 'Tahsin/Tahfidz Al-Qur\'an, Fiqih, dan kajian kitab.' },
  { no: '02', nama: 'Aksi Sosial & Kemanusiaan', detail: 'Bakti sosial, santunan, dan peduli bencana.' },
  { no: '03', nama: 'Praktik Dakwah',            detail: 'Latihan MC, muadzin, imam, dan kultum.' },
  { no: '04', nama: 'Penyelenggaraan PHBI',       detail: 'Maulid, Isra Mi\'raj, dan Pesantren Kilat.' },
  { no: '05', nama: 'Pengembangan Mental Qur\'ani', detail: 'Mental tangguh dan menjadi teladan sebaya.' },
  { no: '06', nama: 'Keterampilan Organisasi',   detail: 'Public speaking, manajemen acara, administrasi.' },
];

export default function IrmaPage() {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Barlow:wght@400;500;600;700&family=Barlow+Condensed:wght@600;700;800&display=swap');

        .irm-root {
          font-family: 'Barlow', sans-serif;
          background: #0d0a08;
          color: #e8e0d0;
          min-height: 100vh;
        }
        .irm-hero { position: relative; overflow: hidden; background: #0d0a08; }
        .irm-hero-img { position: relative; width: 100%; height: min(70vh, 600px); }
        .irm-hero-img img {
          object-fit: cover;
          object-position: center top;
          filter: brightness(0.45) contrast(1.1);
        }
        .irm-hero-overlay {
          position: absolute; inset: 0;
          background: linear-gradient(to bottom, transparent 20%, rgba(13,10,8,0.6) 60%, #0d0a08 100%);
        }
        .irm-hero-content {
          position: absolute; bottom: 0; left: 0; right: 0;
          padding: 0 clamp(24px, 6vw, 80px) clamp(40px, 6vw, 72px);
        }
        .irm-eyebrow {
          display: inline-flex; align-items: center; gap: 10px;
          font-family: 'Barlow Condensed', sans-serif;
          font-size: 13px; font-weight: 700; letter-spacing: 3px;
          text-transform: uppercase; color: #E8A44A; margin-bottom: 16px;
        }
        .irm-eyebrow::before {
          content: ''; display: block; width: 32px; height: 2px; background: #E8A44A;
        }
        .irm-title {
          font-family: 'Bebas Neue', sans-serif;
          font-size: clamp(72px, 12vw, 160px);
          line-height: 0.9; color: #fff; letter-spacing: 2px; margin: 0 0 20px;
        }
        .irm-title span { color: #E8A44A; }
        .irm-subtitle {
          max-width: 560px; font-size: clamp(15px, 1.8vw, 18px);
          color: rgba(232,224,208,0.75); line-height: 1.7;
        }
        .irm-stats {
          display: grid; grid-template-columns: repeat(4, 1fr);
          border-top: 1px solid rgba(232,164,74,0.2);
          border-bottom: 1px solid rgba(232,164,74,0.2);
        }
        @media (max-width: 640px) { .irm-stats { grid-template-columns: repeat(2, 1fr); } }
        .irm-stat {
          padding: 28px 20px; text-align: center;
          border-right: 1px solid rgba(232,164,74,0.15);
        }
        .irm-stat:last-child { border-right: none; }
        .irm-stat-num {
          font-family: 'Bebas Neue', sans-serif;
          font-size: 42px; color: #E8A44A; line-height: 1; margin-bottom: 6px;
        }
        .irm-stat-label {
          font-size: 11px; font-weight: 600; letter-spacing: 2px;
          text-transform: uppercase; color: rgba(232,224,208,0.5);
        }
        .irm-section {
          max-width: 1100px; margin: 0 auto;
          padding: clamp(56px, 8vw, 96px) clamp(24px, 6vw, 80px);
        }
        .irm-section-label {
          font-family: 'Barlow Condensed', sans-serif;
          font-size: 11px; font-weight: 700; letter-spacing: 3px;
          text-transform: uppercase; color: #E8A44A; margin-bottom: 12px;
        }
        .irm-section-heading {
          font-family: 'Bebas Neue', sans-serif;
          font-size: clamp(40px, 5vw, 64px); color: #fff; line-height: 1; margin-bottom: 48px;
        }
        .irm-tujuan-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 2px; }
        @media (max-width: 768px) { .irm-tujuan-grid { grid-template-columns: 1fr; } }
        .irm-tujuan-card {
          background: #160f08; padding: 36px 28px;
          border: 1px solid rgba(232,164,74,0.08);
          transition: background 0.2s, border-color 0.2s;
          position: relative; overflow: hidden;
        }
        .irm-tujuan-card::after {
          content: ''; position: absolute; bottom: 0; left: 0; right: 0;
          height: 2px; background: #E8A44A;
          transform: scaleX(0); transform-origin: left; transition: transform 0.3s ease;
        }
        .irm-tujuan-card:hover { background: #1e1408; border-color: rgba(232,164,74,0.2); }
        .irm-tujuan-card:hover::after { transform: scaleX(1); }
        .irm-tujuan-icon { font-size: 36px; margin-bottom: 20px; display: block; }
        .irm-tujuan-title {
          font-family: 'Barlow Condensed', sans-serif;
          font-size: 22px; font-weight: 800; color: #fff;
          text-transform: uppercase; letter-spacing: 1px; margin-bottom: 12px;
        }
        .irm-tujuan-desc { font-size: 14px; color: rgba(232,224,208,0.65); line-height: 1.75; }
        .irm-kegiatan-grid {
          display: grid; grid-template-columns: repeat(2, 1fr);
          gap: 1px; background: rgba(232,164,74,0.1);
        }
        @media (max-width: 640px) { .irm-kegiatan-grid { grid-template-columns: 1fr; } }
        .irm-kegiatan-item {
          background: #0d0a08; padding: 28px 32px;
          display: flex; align-items: flex-start; gap: 20px; transition: background 0.2s;
        }
        .irm-kegiatan-item:hover { background: #160f08; }
        .irm-kegiatan-no {
          font-family: 'Bebas Neue', sans-serif;
          font-size: 32px; color: rgba(232,164,74,0.3); line-height: 1; flex-shrink: 0; width: 40px;
        }
        .irm-kegiatan-nama {
          font-family: 'Barlow Condensed', sans-serif;
          font-size: 18px; font-weight: 700; color: #fff;
          text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;
        }
        .irm-kegiatan-detail { font-size: 13px; color: rgba(232,224,208,0.5); }
        .irm-divider {
          display: flex; align-items: center; gap: 16px;
          max-width: 1100px; margin: 0 auto;
          padding: 0 clamp(24px, 6vw, 80px); opacity: 0.25;
        }
        .irm-divider::before, .irm-divider::after {
          content: ''; flex: 1; height: 1px; background: #E8A44A;
        }
        .irm-divider-icon { font-size: 14px; }
      `}</style>

      <div className="irm-root">
        <Navbar />

        <main>
          {/* ── Hero ── */}
          <section className="irm-hero">
            <div className="irm-hero-img">
              <Image src="/images/irma.jpg" alt="IRMA SMK Citra Negara" fill priority />
              <div className="irm-hero-overlay" />
            </div>
            <div className="irm-hero-content">
              <div className="irm-eyebrow">Ekstrakurikuler SMK Citra Negara</div>
              <h1 className="irm-title">IR<span>MA</span></h1>
              <p className="irm-subtitle">
                Ikatan Remaja Masjid (IRMA) adalah organisasi yang vital di lingkungan sekolah.
                Tidak hanya memperdalam ilmu agama, IRMA juga mengajarkan soft skill,
                kepemimpinan, dan nilai-nilai Islam yang mulia.
              </p>
            </div>
          </section>

          {/* ── Stats ── */}
          <div className="irm-stats">
            {STATS.map(s => (
              <div key={s.label} className="irm-stat">
                <div className="irm-stat-num">{s.angka}</div>
                <div className="irm-stat-label">{s.label}</div>
              </div>
            ))}
          </div>

          {/* ── Tujuan ── */}
          <section className="irm-section">
            <div className="irm-section-label">Mengapa IRMA</div>
            <h2 className="irm-section-heading">TUJUAN KAMI</h2>
            <div className="irm-tujuan-grid">
              {TUJUAN.map(t => (
                <div key={t.judul} className="irm-tujuan-card">
                  <span className="irm-tujuan-icon">{t.icon}</span>
                  <div className="irm-tujuan-title">{t.judul}</div>
                  <p className="irm-tujuan-desc">{t.deskripsi}</p>
                </div>
              ))}
            </div>
          </section>

          <div className="irm-divider"><span className="irm-divider-icon">✦</span></div>

          {/* ── Kegiatan ── */}
          <section className="irm-section" style={{ paddingTop: 'clamp(40px, 5vw, 64px)' }}>
            <div className="irm-section-label">Program Kegiatan</div>
            <h2 className="irm-section-heading">KEGIATAN RUTIN</h2>
            <div className="irm-kegiatan-grid">
              {KEGIATAN.map(k => (
                <div key={k.no} className="irm-kegiatan-item">
                  <div className="irm-kegiatan-no">{k.no}</div>
                  <div>
                    <div className="irm-kegiatan-nama">{k.nama}</div>
                    <div className="irm-kegiatan-detail">{k.detail}</div>
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