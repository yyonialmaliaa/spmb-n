'use client';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { CheckCircle, FileText, Calendar, AlertCircle, ChevronRight } from 'lucide-react';

const PERSYARATAN = [
  'Ijazah/SKHUN SMP/MTs (fotokopi)',
  'Kartu Keluarga (fotokopi)',
  'Akte Kelahiran (fotokopi)',
  'KTP orang tua/wali (fotokopi)',
  'Pas foto 3×4 berwarna (3 lembar)',
  'Surat keterangan sehat dari dokter',
  'Surat Keterangan Tidak Buta Warna (khusus jurusan TJKT, PPLG, dan DKV)',
];

const ALUR = [
  { no: 1, title: 'Buat Akun', desc: 'Daftarkan email Anda untuk membuat akun SPMB Online' },
  { no: 2, title: 'Isi Formulir', desc: 'Lengkapi data pribadi, data orang tua, dan pilih jurusan' },
  { no: 3, title: 'Upload Berkas', desc: 'Upload dokumen persyaratan dalam format PDF/JPG' },
  { no: 4, title: 'Submit', desc: 'Kirim formulir dan tunggu verifikasi dari admin sekolah' },
  { no: 5, title: 'Verifikasi', desc: 'Admin akan memverifikasi data dan berkas Anda' },
  { no: 6, title: 'Pengumuman', desc: 'Cek status penerimaan di dashboard akun Anda' },
];

export default function SPMBPage() {
  return (
    <>
      <Navbar />
      <main>
        {/* Hero */}
        <section className="hero-gradient" style={{ padding: '80px 24px' }}>
          <div style={{ maxWidth: 800, margin: '0 auto', textAlign: 'center' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(200,151,58,0.15)', border: '1px solid rgba(200,151,58,0.3)', borderRadius: 20, padding: '6px 16px', color: '#E8B84B', fontSize: 12, fontWeight: 600, marginBottom: 20 }}>
              SPMB 2026/2027
            </div>
            <h1 className="font-display" style={{ fontSize: 48, color: 'white', marginBottom: 16 }}>
              Sistem Penerimaan<br />Peserta Didik Baru
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 17, lineHeight: 1.7, marginBottom: 36, maxWidth: 560, margin: '0 auto 36px' }}>
              Pendaftaran online SMK Citra Negara tahun ajaran 2026/2027. 
              Proses mudah, transparan, dan dapat dipantau secara real-time.
            </p>
            <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link href="/register" className="btn-primary" style={{ fontSize: 16 }}>Daftar Sekarang</Link>
              <Link href="/login" className="btn-outline" style={{ fontSize: 16 }}>Sudah Punya Akun</Link>
            </div>
          </div>
        </section>

        {/* Jadwal */}
        <section style={{ padding: '70px 24px', background: 'white' }}>
          <div style={{ maxWidth: 1100, margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: 48 }}>
              <div className="gold-line" style={{ margin: '0 auto 16px' }} />
              <h2 className="font-display" style={{ fontSize: 36, color: '#000000' }}>Jadwal SPMB</h2>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 20 }}>
              {[
                { fase: 'Pendaftaran Online', tgl: '1 Juni – 15 Juli 2026', status: 'open' },
                { fase: 'Pengumpulan Berkas', tgl: '1 Juni – 17 Juli 2026', status: 'open' },
                { fase: 'Verifikasi Admin', tgl: '16 – 20 Juli 2026', status: 'upcoming' },
                { fase: 'Seleksi & Penilaian', tgl: '22 – 24 Juli 2026', status: 'upcoming' },
                { fase: 'Pengumuman Hasil', tgl: '25 Juli 2026', status: 'upcoming' },
                { fase: 'Daftar Ulang', tgl: '26 – 31 Juli 2026', status: 'upcoming' },
              ].map((item, i) => (
                <div key={i} style={{ background: item.status === 'open' ? 'rgb(7, 71, 15)' : 'white', border: `1.5px solid ${item.status === 'open' ? '#C8973A' : '#C8973A'}`, borderRadius: 14, padding: 22 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                    <Calendar size={16} color={item.status === 'open' ? '#C8973A' : '#C8973A'} />
                    {item.status === 'open' && <span style={{ background: '#C8973A', color: '#0A1628', fontSize: 9, fontWeight: 800, padding: '2px 8px', borderRadius: 10 }}>BUKA</span>}
                  </div>
                  <h4 style={{ fontSize: 14, fontWeight: 700, color: item.status === 'open' ? 'white' : '#28250a', marginBottom: 6 }}>{item.fase}</h4>
                  <p style={{ fontSize: 12, color: item.status === 'open' ? '#E8B84B' : '#9CA3AF' }}>{item.tgl}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Alur */}
        <section style={{ padding: '70px 24px', background: '#FAF7F0' }}>
          <div style={{ maxWidth: 900, margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: 48 }}>
              <div className="gold-line" style={{ margin: '0 auto 16px' }} />
              <h2 className="font-display" style={{ fontSize: 36, color: '#0A1628' }}>Alur Pendaftaran</h2>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {ALUR.map((step, i) => (
                <div key={step.no} style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'linear-gradient(135deg,#C8973A,#E8B84B)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 16, color: '#0A1628', flexShrink: 0 }}>{step.no}</div>
                    {i < ALUR.length - 1 && <div style={{ width: 2, height: 36, background: '#E5E7EB', margin: '4px 0' }} />}
                  </div>
                  <div style={{ background: 'white', borderRadius: 12, padding: '16px 20px', flex: 1, border: '1px solid #F0EBE0', marginBottom: 4 }}>
                    <h4 style={{ fontSize: 15, fontWeight: 700, color: '#0A1628', marginBottom: 4 }}>{step.title}</h4>
                    <p style={{ fontSize: 13, color: '#6B7280' }}>{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Persyaratan */}
        <section style={{ padding: '70px 24px', background: 'white' }}>
          <div style={{ maxWidth: 1100, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 60, alignItems: 'center' }}>
            <div>
              <div className="gold-line" style={{ marginBottom: 16 }} />
              <h2 className="font-display" style={{ fontSize: 36, color: '#0A1628', marginBottom: 16 }}>Persyaratan Dokumen</h2>
              <p style={{ color: '#6B7280', marginBottom: 28, fontSize: 15, lineHeight: 1.7 }}>
                Berikut adalah berkas persyaratan yang wajib diserahkan ke sekolah untuk proses verifikasi pendaftaran.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {PERSYARATAN.map((item, i) => (
                  <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                    <CheckCircle size={18} color="#C8973A" style={{ flexShrink: 0 }} />
                    <span style={{ fontSize: 14, color: '#374151' }}>{item}</span>
                  </div>
                ))}
              </div>
              <div style={{ background: '#FEF3C7', border: '1px solid #FDE68A', borderRadius: 10, padding: 16, marginTop: 24, display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <AlertCircle size={16} color="#92400E" style={{ flexShrink: 0, marginTop: 2 }} />
                <p style={{ fontSize: 13, color: '#92400E', lineHeight: 1.5 }}>
                  Setelah mengirimkan formulir pendaftaran secara online, calon peserta didik wajib menyerahkan fotokopi berkas persyaratan ke sekolah paling lambat 3 (tiga) hari kerja.
                </p>
              </div>
            </div>
            <div style={{ background: '#02513b', borderRadius: 20, padding: 36, color: 'white' }}>
              <h3 className="font-display" style={{ fontSize: 26, color: 'white', marginBottom: 8 }}>Mulai Daftar Sekarang</h3>
              <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14, lineHeight: 1.7, marginBottom: 28 }}>
                Proses pendaftaran 100% online. Buat akun, isi formulir, dan upload berkas dari rumah.
              </p>
              {['Buat akun gratis', 'Isi formulir online', 'Upload dokumen digital', 'Pantau status real-time'].map((f, i) => (
                <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 14, alignItems: 'center' }}>
                  <div style={{ width: 24, height: 24, background: 'rgba(200,151,58,0.2)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <ChevronRight size={14} color="#C8973A" />
                  </div>
                  <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.8)' }}>{f}</span>
                </div>
              ))}
              <Link href="/register" className="btn-primary" style={{ display: 'block', textAlign: 'center', marginTop: 28, fontSize: 15 }}>
                Daftar Sekarang →
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}