
'use client';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { Award } from 'lucide-react';

const PRESTASI = [
  {
    tahun: '2026',
    nama: 'JUARA 1 Ultimate Futsal Championship Sejabodetabek',
    kategori: 'Olahraga',
    foto: '/images/futsalcn2.jpg',
  },
  {
    tahun: '2025',
    nama: 'JUARA 1 Futsal Nation Region Depok',
    kategori: 'Olahraga',
    foto: '/images/futsalcn1.jpg',
  },
  {
    tahun: '2026',
    nama: 'JUARA 1 BATTLE IN STYLE DANCE COMPETITION | GARENA YOUTH CHAMPIONSHIP',
    kategori: 'Seni',
    foto: '/images/juaranusabeast.jpg',
  },
  {
    tahun: '2025',
    nama: 'JUARA 1 SEJABODETABEK TOURNAMEN ESPORT FREE FIRE PRAMBORS TOP COFFE GEN2ATION',
    kategori: 'Olahraga Elektronik',
    foto: '/images/esport.jpg',
  },
  {
    tahun: '2025',
    nama: 'JUARA UMUM KOLAKARYA TINGKAT JABODETABEK',
    kategori: 'Seni',
    foto: '/images/citter.jpg',
  },
  {
    tahun: '2025',
    nama: 'JUARA 1 TURNAMEN TAEKWONDO TINGKAT NASIONAL | MENDAGRI CUP 2025',
    kategori: 'Olahraga',
    foto: '/images/tekon.jpg',
  },
];

const KATEGORI_COLOR: Record<string, string> = {
  'Olahraga':           '#1E3A5F',
  'Olahraga Elektronik':'#3a96d0',
  'Seni':               '#DC2626',
  'Akademik':           '#024d20',
  'Organisasi':         '#92681A',
};

const ALL_KATEGORI = ['Semua', ...Array.from(new Set(PRESTASI.map(p => p.kategori)))];

export default function PrestasiPage() {
  // Filter state — use simple URL param approach via React state
  const [aktif, setAktif] = (function() {
    const { useState } = require('react');
    return useState('Semua');
  })();

  const filtered = aktif === 'Semua' ? PRESTASI : PRESTASI.filter(p => p.kategori === aktif);

  return (
    <>
      <Navbar />
      <main>
        {/* Hero */}
        <section className="hero-gradient" style={{ padding: '80px 24px' }}>
          <div style={{ maxWidth: 800, margin: '0 auto', textAlign: 'center' }}>
            <div className="gold-line" style={{ margin: '0 auto 20px' }} />
            <h1 className="font-display" style={{ fontSize: 48, color: 'white', marginBottom: 16 }}>
              Prestasi & Penghargaan
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 17, lineHeight: 1.7, maxWidth: 560, margin: '0 auto' }}>
              Deretan pencapaian membanggakan siswa-siswi SMK Citra Negara di berbagai bidang kompetisi.
            </p>
          </div>
        </section>

        {/* Stats bar */}
        <section style={{ background: '#023d17', padding: '22px 24px', borderBottom: '2px solid #C8973A' }}>
          <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', gap: 40, justifyContent: 'center', flexWrap: 'wrap' }}>
            {[
              { label: 'Total Prestasi', val: `${PRESTASI.length}+` },
              { label: 'Tingkat Nasional', val: '3' },
              { label: 'Tingkat Jabodetabek', val: '3' },
              { label: 'Bidang', val: '4' },
            ].map(s => (
              <div key={s.label} style={{ textAlign: 'center' }}>
                <div style={{ color: '#E8B84B', fontWeight: 800, fontSize: 22 }}>{s.val}</div>
                <div style={{ color: 'rgba(255,255,255,0.55)', fontSize: 11, marginTop: 2 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Filter tabs */}
        <section style={{ background: '#FAF7F0', padding: '32px 24px 0' }}>
          <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {ALL_KATEGORI.map(k => (
              <button
                key={k}
                onClick={() => setAktif(k)}
                style={{
                  padding: '8px 20px', borderRadius: 30,
                  fontSize: 13, fontWeight: 600, cursor: 'pointer',
                  border: '1.5px solid',
                  borderColor: aktif === k ? '#C8973A' : '#E2D9C8',
                  background: aktif === k ? '#C8973A' : 'white',
                  color: aktif === k ? '#0A1628' : '#6B7280',
                  transition: 'all 0.18s',
                }}
              >
                {k}
              </button>
            ))}
          </div>
        </section>

        {/* Cards grid */}
        <section style={{ padding: '32px 24px 70px', background: '#FAF7F0' }}>
          <div style={{
            maxWidth: 1100, margin: '0 auto',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: 24,
          }}>
            {filtered.map((p, i) => (
              <div
                key={i}
                style={{
                  background: 'white', borderRadius: 16, overflow: 'hidden',
                  border: '1px solid #F0EBE0',
                  boxShadow: '0 2px 12px rgba(10,22,40,0.06)',
                  transition: 'all 0.25s',
                  display: 'flex', flexDirection: 'column',
                }}
                onMouseEnter={e => {
                  const el = e.currentTarget as HTMLElement;
                  el.style.borderColor = '#C8973A';
                  el.style.transform = 'translateY(-4px)';
                  el.style.boxShadow = '0 8px 28px rgba(200,151,58,0.18)';
                }}
                onMouseLeave={e => {
                  const el = e.currentTarget as HTMLElement;
                  el.style.borderColor = '#F0EBE0';
                  el.style.transform = 'none';
                  el.style.boxShadow = '0 2px 12px rgba(10,22,40,0.06)';
                }}
              >
                {/* Foto */}
                <div style={{ position: 'relative', width: '100%', height: 210, overflow: 'hidden', background: '#F0EBE0' }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={p.foto}
                    alt={p.nama}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                  />
                  <div style={{
                    position: 'absolute', top: 12, left: 12,
                    background: KATEGORI_COLOR[p.kategori] ?? 'rgba(10,22,40,0.75)',
                    color: 'white', fontSize: 10, fontWeight: 800,
                    padding: '4px 10px', borderRadius: 20, letterSpacing: 0.5,
                  }}>{p.kategori}</div>
                  <div style={{
                    position: 'absolute', top: 12, right: 12,
                    background: 'linear-gradient(135deg,#C8973A,#E8B84B)',
                    color: '#0A1628', fontSize: 11, fontWeight: 800,
                    padding: '4px 10px', borderRadius: 20,
                  }}>{p.tahun}</div>
                </div>

                {/* Konten */}
                <div style={{ padding: '18px 20px', display: 'flex', alignItems: 'flex-start', gap: 14, flex: 1 }}>
                  <div style={{
                    width: 38, height: 38, flexShrink: 0,
                    background: 'linear-gradient(135deg,#C8973A,#E8B84B)',
                    borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Award size={18} color="#0A1628" />
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#0A1628', lineHeight: 1.5 }}>{p.nama}</div>
                </div>
              </div>
            ))}
          </div>

          {filtered.length === 0 && (
            <div style={{ textAlign: 'center', padding: '60px 0', color: '#9CA3AF', fontSize: 15 }}>
              Belum ada prestasi di kategori ini.
            </div>
          )}
        </section>
      </main>
      <Footer />
    </>
  );
}
