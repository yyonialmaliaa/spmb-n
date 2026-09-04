'use client';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { CheckCircle, FileText, Calendar, AlertCircle, ChevronRight } from 'lucide-react';
import { Fragment } from 'react';
import { formatRupiah } from '@/lib/pembayaran-utils';

type HargaRow = { id: string; jenjang: string; jurusan: string; kelas: string; nominal: number; urutan: number };

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
  const [gelombangAktif, setGelombangAktif] = useState<{ nama: string; diskonPersen: number } | null>(null);
  const [harga, setHarga] = useState<HargaRow[]>([]);

  useEffect(() => {
    fetch('/api/gelombang').then(r => r.json()).then(d => {
      const aktif = (d.data || []).find((g: any) => g.aktif);
      if (aktif) setGelombangAktif({ nama: aktif.nama, diskonPersen: aktif.diskonPersen });
    }).catch(() => {});
    fetch('/api/harga').then(r => r.json()).then(d => setHarga(d.data || [])).catch(() => {});
  }, []);

  const hargaSMP = harga.filter(h => h.jenjang === 'smp');
  const hargaSMA = harga.filter(h => h.jenjang === 'sma');
  const smkByJurusan = harga.filter(h => h.jenjang === 'smk').reduce((acc, h) => {
    (acc[h.jurusan] ||= []).push(h);
    return acc;
  }, {} as Record<string, HargaRow[]>);
  const smkGroups = Object.entries(smkByJurusan).sort((a, b) => Math.min(...a[1].map(h => h.urutan)) - Math.min(...b[1].map(h => h.urutan)));

  const diskon = gelombangAktif?.diskonPersen || 0;
  const hargaSetelahDiskon = (harga: number) => Math.round(harga * (1 - diskon / 100));

  const HargaTampil = ({ harga }: { harga: number }) => (
    diskon > 0 ? (
      <span>
        <span style={{ textDecoration: 'line-through', color: 'var(--adm-text-faint)', fontSize: 12, marginRight: 6 }}>{formatRupiah(harga)}</span>
        <span>{formatRupiah(hargaSetelahDiskon(harga))}</span>
      </span>
    ) : <span>{formatRupiah(harga)}</span>
  );

  return (
    <>
      <Navbar />
      <main>
        {/* Hero */}
        <section className="hero-gradient" style={{ padding: '80px 24px' }}>
          <div style={{ maxWidth: 800, margin: '0 auto', textAlign: 'center' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(200,151,58,0.15)', border: '1px solid rgba(200,151,58,0.3)', borderRadius: 20, padding: '6px 16px', color: 'var(--cn-emas-terang)', fontSize: 12, fontWeight: 600, marginBottom: 20 }}>
              SPMB 2026/2027
            </div>
            <h1 className="font-display" style={{ fontSize: 48, color: 'var(--adm-text)', marginBottom: 16 }}>
              Sistem Penerimaan<br />Peserta Didik Baru
            </h1>
            <p style={{ color: 'var(--adm-text-muted)', fontSize: 17, lineHeight: 1.7, marginBottom: 36, maxWidth: 560, margin: '0 auto 36px' }}>
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
        <section style={{ padding: '70px 24px', background: 'var(--adm-surface)' }}>
          <div style={{ maxWidth: 1100, margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: 48 }}>
              <div className="gold-line" style={{ margin: '0 auto 16px' }} />
              <h2 className="font-display" style={{ fontSize: 36, color: 'var(--adm-text)' }}>Jadwal SPMB</h2>
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
                <div key={i} style={{ background: item.status === 'open' ? 'var(--adm-success-weak)' : 'var(--adm-surface)', border: `1.5px solid ${item.status === 'open' ? 'var(--cn-hijau)' : 'var(--adm-border)'}`, borderRadius: 14, padding: 22 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                    <Calendar size={16} color={item.status === 'open' ? 'var(--cn-hijau)' : 'var(--adm-text-faint)'} />
                    {item.status === 'open' && <span style={{ background: 'var(--cn-emas)', color: 'var(--adm-text)', fontSize: 9, fontWeight: 800, padding: '2px 8px', borderRadius: 10 }}>BUKA</span>}
                  </div>
                  <h4 style={{ fontSize: 14, fontWeight: 700, color: 'var(--adm-text)', marginBottom: 6 }}>{item.fase}</h4>
                  <p style={{ fontSize: 12, color: item.status === 'open' ? 'var(--cn-hijau)' : 'var(--adm-text-faint)' }}>{item.tgl}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Alur */}
        <section style={{ padding: '70px 24px', background: 'var(--adm-surface-alt)' }}>
          <div style={{ maxWidth: 900, margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: 48 }}>
              <div className="gold-line" style={{ margin: '0 auto 16px' }} />
              <h2 className="font-display" style={{ fontSize: 36, color: 'var(--adm-text)' }}>Alur Pendaftaran</h2>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {ALUR.map((step, i) => (
                <div key={step.no} style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'var(--cn-hijau)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 16, color: '#FFFFFF', flexShrink: 0 }}>{step.no}</div>
                    {i < ALUR.length - 1 && <div style={{ width: 2, height: 36, background: 'var(--adm-border)', margin: '4px 0' }} />}
                  </div>
                  <div style={{ background: 'var(--adm-surface)', borderRadius: 12, padding: '16px 20px', flex: 1, border: '1px solid #F0EBE0', marginBottom: 4 }}>
                    <h4 style={{ fontSize: 15, fontWeight: 700, color: 'var(--adm-text)', marginBottom: 4 }}>{step.title}</h4>
                    <p style={{ fontSize: 13, color: 'var(--adm-text-muted)' }}>{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Biaya Pendidikan */}
        <section style={{ padding: '70px 24px', background: 'var(--adm-surface)' }}>
          <div style={{ maxWidth: 1100, margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: 16 }}>
              <div className="gold-line" style={{ margin: '0 auto 16px' }} />
              <h2 className="font-display" style={{ fontSize: 36, color: 'var(--adm-text)' }}>Biaya Pendidikan Siswa Baru</h2>
              <p style={{ fontSize: 13, color: 'var(--adm-text-muted)', marginTop: 10 }}>Tahun Pelajaran 2026/2027. Belum termasuk biaya opsional (rincian lengkap muncul saat pembayaran).</p>
              {gelombangAktif && diskon > 0 && (
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'var(--adm-warning-weak)', border: '1px solid #FDE68A', borderRadius: 20, padding: '6px 16px', marginTop: 14 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--adm-warning)' }}>🎉 {gelombangAktif.nama} aktif — diskon {diskon}%</span>
                </div>
              )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 20, marginTop: 32, marginBottom: 20 }}>
              {/* SMP */}
              <div style={{ background: 'var(--adm-surface-alt)', borderRadius: 16, padding: 24, border: '1px solid #F0EBE0' }}>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--cn-emas)', marginBottom: 14 }}>SMP</h3>
                {hargaSMP.map(h => (
                  <div key={h.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #F0EBE0' }}>
                    <span style={{ fontSize: 13, color: 'var(--adm-text-muted)' }}>{h.kelas}</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--adm-text)' }}><HargaTampil harga={h.nominal} /></span>
                  </div>
                ))}
              </div>

              {/* SMA */}
              <div style={{ background: 'var(--adm-surface-alt)', borderRadius: 16, padding: 24, border: '1px solid #F0EBE0' }}>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--cn-emas)', marginBottom: 14 }}>SMA</h3>
                {hargaSMA.map(h => (
                  <div key={h.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #F0EBE0' }}>
                    <span style={{ fontSize: 13, color: 'var(--adm-text-muted)' }}>{h.kelas}</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--adm-text)' }}><HargaTampil harga={h.nominal} /></span>
                  </div>
                ))}
              </div>

              {/* SMK */}
              <div style={{ background: 'var(--adm-surface-alt)', borderRadius: 16, padding: 24, border: '1px solid #F0EBE0', gridColumn: 'span 1' }}>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--cn-emas)', marginBottom: 14 }}>SMK — Semua Jurusan</h3>
                <p style={{ fontSize: 12, color: 'var(--adm-text-faint)' }}>Bervariasi per program keahlian. Lihat rincian lengkap di tabel bawah.</p>
              </div>
            </div>

            {/* Tabel SMK */}
            <div style={{ overflowX: 'auto', border: '1px solid #F0EBE0', borderRadius: 14 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, minWidth: 480 }}>
                <thead>
                  <tr style={{ background: 'var(--adm-surface-alt)' }}>
                    <th style={{ textAlign: 'left', padding: '10px 16px', fontWeight: 700, color: 'var(--adm-text)' }}>Program Keahlian</th>
                    <th style={{ textAlign: 'left', padding: '10px 16px', fontWeight: 700, color: 'var(--adm-text)' }}>Kelas</th>
                    <th style={{ textAlign: 'right', padding: '10px 16px', fontWeight: 700, color: 'var(--adm-text)' }}>Biaya</th>
                  </tr>
                </thead>
                <tbody>
                  {smkGroups.map(([jurusan, rows]) => (
                    <Fragment key={jurusan}>
                      {rows.map((h, i) => (
                        <tr key={h.id} style={{ borderTop: '1px solid #F0EBE0' }}>
                          {i === 0 && <td rowSpan={rows.length} style={{ padding: '10px 16px', color: 'var(--adm-text)', verticalAlign: 'top' }}>{jurusan}</td>}
                          <td style={{ padding: '10px 16px', color: 'var(--adm-text-muted)' }}>{h.kelas}</td>
                          <td style={{ padding: '10px 16px', textAlign: 'right', fontWeight: 700, color: 'var(--adm-text)' }}><HargaTampil harga={h.nominal} /></td>
                        </tr>
                      ))}
                    </Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* Persyaratan */}
        <section style={{ padding: '70px 24px', background: 'var(--adm-surface)' }}>
          <div style={{ maxWidth: 1100, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 60, alignItems: 'center' }}>
            <div>
              <div className="gold-line" style={{ marginBottom: 16 }} />
              <h2 className="font-display" style={{ fontSize: 36, color: 'var(--adm-text)', marginBottom: 16 }}>Persyaratan Dokumen</h2>
              <p style={{ color: 'var(--adm-text-muted)', marginBottom: 28, fontSize: 15, lineHeight: 1.7 }}>
                Berikut adalah berkas persyaratan yang wajib diserahkan ke sekolah untuk proses verifikasi pendaftaran.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {PERSYARATAN.map((item, i) => (
                  <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                    <CheckCircle size={18} color="var(--cn-hijau)" style={{ flexShrink: 0 }} />
                    <span style={{ fontSize: 14, color: 'var(--adm-text)' }}>{item}</span>
                  </div>
                ))}
              </div>
              <div style={{ background: 'var(--adm-warning-weak)', border: '1px solid var(--adm-warning-border)', borderRadius: 10, padding: 16, marginTop: 24, display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <AlertCircle size={16} color="var(--adm-warning)" style={{ flexShrink: 0, marginTop: 2 }} />
                <p style={{ fontSize: 13, color: 'var(--adm-warning)', lineHeight: 1.5 }}>
                  Setelah mengirimkan formulir pendaftaran secara online, calon peserta didik wajib menyerahkan fotokopi berkas persyaratan ke sekolah paling lambat 3 (tiga) hari kerja.
                </p>
              </div>
            </div>
            {/* Kartu ini SENGAJA berlatar hijau pekat (identitas, bukan
                permukaan netral) — jadi seluruh teks di dalamnya harus warna
                tetap yang kontras dengan hijau, BUKAN token var(--adm-text)
                yang dikalibrasi untuk permukaan putih/gelap netral. Tanpa
                ini, teks jadi nyaris tidak terbaca (navy-di-atas-hijau). */}
            <div style={{ background: 'var(--cn-hijau)', borderRadius: 20, padding: 36, color: '#FFFFFF' }}>
              <h3 className="font-display" style={{ fontSize: 26, color: '#FFFFFF', marginBottom: 8 }}>Mulai Daftar Sekarang</h3>
              <p style={{ color: 'rgba(255,255,255,0.82)', fontSize: 14, lineHeight: 1.7, marginBottom: 28 }}>
                Proses pendaftaran 100% online. Buat akun, isi formulir, dan upload berkas dari rumah.
              </p>
              {['Buat akun gratis', 'Isi formulir online', 'Upload dokumen digital', 'Pantau status real-time'].map((f, i) => (
                <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 14, alignItems: 'center' }}>
                  <div style={{ width: 24, height: 24, background: 'rgba(255,255,255,0.18)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <ChevronRight size={14} color="#FFFFFF" />
                  </div>
                  <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.82)' }}>{f}</span>
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