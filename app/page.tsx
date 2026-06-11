'use client';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { GraduationCap, CheckCircle, ArrowRight, Star, Monitor, Network, Camera, Calculator, FileText, Building } from 'lucide-react';

const JURUSAN = [
  { img: '/images/logopplg.png', kode: 'PPLG', nama: 'Pengembangan Perangkat Lunak dan Gim', desc: 'Coding, pengembangan aplikasi, database, UI/UX, game development, dan software engineering.', kuota: 72 },
  { img: '/images/logotjkt.png', kode: 'TJKT', nama: 'Teknik Jaringan Komputer dan Telekomunikasi', desc: 'Jaringan komputer, server, keamanan sistem, telekomunikasi, dan troubleshooting jaringan.', kuota: 72 },
  { img: '/images/logodkv.png', kode: 'DKV', nama: 'Desain Komunikasi Visual', desc: 'Desain grafis, ilustrasi, fotografi, animasi, videografi, dan branding kreatif.', kuota: 36 },
  { img: '/images/logopm.png', kode: 'PM', nama: 'Pemasaran', desc: 'Pemasaran, penjualan, promosi digital, e-commerce, dan layanan pelanggan.', kuota: 36 },
  { img: '/images/logomplb.png', kode: 'MPLB', nama: 'Manajemen Perkantoran dan Layanan Bisnis', desc: 'Administrasi, teknologi perkantoran, komunikasi bisnis, layanan pelanggan, dan manajemen dokumen.', kuota: 36 },
  { img: '/images/logoph.png', kode: 'PH', nama: 'Perhotelan', desc: 'Pelayanan hotel, tata graha. food & beverage, komunikasi industri, dan hospitality.', kuota: 36 },
];

const STATS = [
  { value: '1.200+', label: 'Siswa Aktif' },
  { value: '98%', label: 'Tingkat Kelulusan' },
  { value: '85%', label: 'Terserap Kerja/PT' },
  { value: '15+', label: 'Tahun Berdiri' },
];

export default function HomePage() {
  return (
    <>
      <Navbar />
      <main>
        {/* HERO */}
        <section className="hero-gradient" style={{ padding: '100px 24px 120px' }}>
          <div style={{ maxWidth: 1200, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 60, alignItems: 'center' }}>
            <div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(200,151,58,0.15)', border: '1px solid rgba(200,151,58,0.3)', borderRadius: 20, padding: '6px 16px', color: '#E8B84B', fontSize: 12, fontWeight: 600, marginBottom: 24 }}>
                <Star size={12} fill="#E8B84B" /> PENERIMAAN PESERTA DIDIK BARU 2026/2027
              </div>
              <h1 className="font-display" style={{ fontSize: 56, color: 'white', lineHeight: 1.15, marginBottom: 24, fontWeight: 700 }}>
                Raih Masa Depan <span style={{ color: '#E8B84B' }}>Cerah Bersama</span> SMK Citra Negara
              </h1>
              <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: 17, lineHeight: 1.7, marginBottom: 36, maxWidth: 480 }}>
                Bergabunglah dengan ribuan alumni sukses. Pendidikan kejuruan berkualitas tinggi dengan kurikulum industri terkini.
              </p>
              <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                <Link href="/spmb" className="btn-primary" style={{ fontSize: 15 }}>Daftar SPMB Sekarang →</Link>
                <Link href="/tentang" className="btn-outline" style={{ fontSize: 15 }}>Pelajari Lebih Lanjut</Link>
              </div>
              <div style={{ display: 'flex', gap: 32, marginTop: 48, flexWrap: 'wrap' }}>
                {STATS.map(s => (
                  <div key={s.label}>
                    <div className="font-display" style={{ color: '#E8B84B', fontSize: 28, fontWeight: 700 }}>{s.value}</div>
                    <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12 }}>{s.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Timeline Card */}
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <div style={{ background: 'rgba(255,255,255,0.06)', backdropFilter: 'blur(20px)', border: '1px solid rgba(200,151,58,0.3)', borderRadius: 20, padding: 36, width: '100%', maxWidth: 380 }}>
                <h3 className="font-display" style={{ color: 'white', fontSize: 22, marginBottom: 6 }}>Jadwal SPMB 2026</h3>
                <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, marginBottom: 24 }}>Tahun Ajaran 2026/2027</p>
                {[
                  { fase: 'Pembukaan Pendaftaran', tgl: '1 Juni – 15 Juli 2026', aktif: true },
                  { fase: 'Verifikasi Berkas', tgl: '16 – 20 Juli 2026', aktif: false },
                  { fase: 'Seleksi & Pengumuman', tgl: '22 – 25 Juli 2026', aktif: false },
                  { fase: 'Daftar Ulang', tgl: '26 – 31 Juli 2026', aktif: false },
                ].map((item, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 14, padding: '12px 0', borderBottom: i < 3 ? '1px solid rgba(255,255,255,0.08)' : 'none' }}>
                    <div style={{ width: 32, height: 32, borderRadius: '50%', background: item.aktif ? 'linear-gradient(135deg,#C8973A,#E8B84B)' : 'rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 13, fontWeight: 700, color: item.aktif ? '#0A1628' : 'rgba(255,255,255,0.3)' }}>{i + 1}</div>
                    <div>
                      <div style={{ color: item.aktif ? 'white' : 'rgba(255,255,255,0.5)', fontSize: 13, fontWeight: 600 }}>{item.fase}</div>
                      <div style={{ color: item.aktif ? '#E8B84B' : 'rgba(255,255,255,0.3)', fontSize: 12, marginTop: 2 }}>{item.tgl}</div>
                    </div>
                  </div>
                ))}
                <Link href="/register" className="btn-primary" style={{ display: 'block', textAlign: 'center', marginTop: 24, fontSize: 14 }}>Mulai Pendaftaran</Link>
              </div>
            </div>
          </div>
        </section>

        {/* JURUSAN */}
        <section style={{ padding: '80px 24px', background: 'white' }}>
          <div style={{ maxWidth: 1200, margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: 56 }}>
              <div className="gold-line" style={{ margin: '0 auto 16px' }} />
              <h2 className="font-display" style={{ fontSize: 38, color: '#0A1628', marginBottom: 12 }}>Program Keahlian</h2>
              <p style={{ color: '#6B7280', maxWidth: 500, margin: '0 auto', fontSize: 16 }}>Pilih jurusan sesuai minat dan bakat.</p>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20, }} >
              {JURUSAN.map(j => (
                <div key={j.kode} style={{ background: 'white', border: '1.5px solid #F0EBE0', borderRadius: 14, padding: 24, transition: 'all 0.2s', cursor: 'pointer' }}
                  onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = '#C8973A'; el.style.transform = 'translateY(-4px)'; el.style.boxShadow = '0 8px 30px rgba(200,151,58,0.15)'; }}
                  onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = '#F0EBE0'; el.style.transform = 'none'; el.style.boxShadow = 'none'; }}>
                  <div style={{ marginBottom: 16, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                  <img src={j.img} alt={j.kode} style={{ width: 70, height: 70, objectFit: 'contain' }} />
                  <div style={{ background: '#C8973A', color: 'white', fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 4 }}>{j.kode}</div>
                 </div>
                  <h3 style={{ fontSize: 15, fontWeight: 700, color: '#0A1628', marginBottom: 8, lineHeight: 1.3 }}>{j.nama}</h3>
                  <p style={{ fontSize: 12, color: '#6B7280', lineHeight: 1.5, marginBottom: 12 }}>{j.desc}</p>
                  <div style={{ fontSize: 12, color: '#C8973A', fontWeight: 600 }}>Kuota: {j.kuota} siswa</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FASILITAS */}
        <section style={{ padding: '80px 24px', background: '#FAF7F0' }}>
          <div style={{ maxWidth: 1200, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 60, alignItems: 'center' }}>
            <div>
              <div className="gold-line" style={{ marginBottom: 16 }} />
              <h2 className="font-display" style={{ fontSize: 38, color: '#0A1628', marginBottom: 16 }}>Fasilitas Sekolah</h2>
              <p style={{ color: '#6B7280', lineHeight: 1.8, marginBottom: 32, fontSize: 16 }}>Lingkungan belajar terbaik dengan fasilitas modern yang mendukung proses pembelajaran berkualitas tinggi.</p>
              {['Tersedia Lab Untuk Masinng-Masing Jurusan', 'Tersedia WiFi Untuk Siswa/i di Setiap Gedung & Lantai', 'Ruang Perpustakaan', 'Auditorium', 'Studio Multimedia', 'Kantin', '2 Lapangan (Gedung A & Gedung E)', 'CN Digital Printing oleh Multimedia', 'Bank Mini'].map((f, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                  <CheckCircle size={18} color="#C8973A" />
                  <span style={{ fontSize: 14, color: '#374151' }}>{f}</span>
                </div>
              ))}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              {[
                { label: '7 Lab Komputer', val: '150+', sub: 'Unit Komputer', bg: '#17713b' },
                { label: 'Internet', val: '1 Gbps', sub: 'Starlink', bg: '#cf962b' },
                { label: 'Akreditasi', val: 'A', sub: 'BAN-S/M', bg: '#0f4c35' },
                { label: 'Alumni', val: '5000+', sub: 'Tersebar Nasional', bg: '#093b1e' },
              ].map((item, i) => (
                <div key={i} style={{ background: item.bg, borderRadius: 16, padding: 28, color: 'white' }}>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', marginBottom: 8 }}>{item.label}</div>
                  <div className="font-display" style={{ fontSize: 36, fontWeight: 700, color: item.bg === '#C8973A' ? '#0A1628' : '#E8B84B' }}>{item.val}</div>
                  <div style={{ fontSize: 12, color: item.bg === '#C8973A' ? 'rgba(10,22,40,0.6)' : 'rgba(255,255,255,0.5)', marginTop: 4 }}>{item.sub}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section style={{ padding: '80px 24px', background: '#15803d' }}>
          <div style={{ maxWidth: 700, margin: '0 auto', textAlign: 'center' }}>
            <h2 className="font-display" style={{ color: 'white', fontSize: 40, marginBottom: 16 }}>Siap Bergabung?</h2>
            <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: 16, lineHeight: 1.7, marginBottom: 36 }}>Pendaftaran Peserta Didik Baru tahun ajaran 2026/2027 sudah dibuka. Jangan lewatkan kesempatan ini!</p>
            <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link href="/register" className="btn-primary" style={{ fontSize: 16 }}>Daftar Sekarang</Link>
              <Link href="/spmb" className="btn-outline" style={{ fontSize: 16 }}>Info SPMB</Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
