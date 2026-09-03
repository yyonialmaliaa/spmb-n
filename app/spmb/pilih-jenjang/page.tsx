'use client';
import Link from 'next/link';
import { Fragment, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, ArrowRight } from 'lucide-react';
import { ALUR_REGISTRASI, JENJANG_LABEL } from '@/lib/biaya';
import { formatRupiah } from '@/lib/pembayaran-utils';

type HargaRow = { id: string; jenjang: string; jurusan: string; kelas: string; nominal: number; urutan: number };

export default function PilihJenjangPage() {
  const router = useRouter();
  const [harga, setHarga] = useState<HargaRow[]>([]);

  useEffect(() => {
    fetch('/api/harga').then(r => r.json()).then(d => setHarga(d.data || [])).catch(() => {});
  }, []);

  const hargaSMP = harga.filter(h => h.jenjang === 'smp');
  const hargaSMA = harga.filter(h => h.jenjang === 'sma');
  const smkByJurusan = harga.filter(h => h.jenjang === 'smk').reduce((acc, h) => {
    (acc[h.jurusan] ||= []).push(h);
    return acc;
  }, {} as Record<string, HargaRow[]>);
  const smkGroups = Object.entries(smkByJurusan).sort((a, b) => Math.min(...a[1].map(h => h.urutan)) - Math.min(...b[1].map(h => h.urutan)));

  const card: React.CSSProperties = { background: 'white', borderRadius: 16, padding: 28, border: '1px solid #F0EBE0' };

  return (
    <div style={{ minHeight: '100vh', background: '#FAF7F0', fontFamily: 'Inter, sans-serif' }}>
      <div style={{ background: '#0A1628', padding: '16px 24px' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', display: 'flex', alignItems: 'center', gap: 12 }}>
          <Link href="/dashboard" style={{ color: 'rgba(255,255,255,0.7)', display: 'flex', alignItems: 'center' }}>
            <ChevronLeft size={20} />
          </Link>
          <h1 style={{ color: 'white', fontSize: 16, fontWeight: 700, margin: 0 }}>Pendaftaran Peserta Didik Baru</h1>
        </div>
      </div>

      <div style={{ maxWidth: 900, margin: '32px auto', padding: '0 24px', display: 'flex', flexDirection: 'column', gap: 24 }}>

        {/* Alur Registrasi */}
        <div style={card}>
          <h2 className="font-display" style={{ fontSize: 20, color: '#0A1628', marginBottom: 4 }}>Alur Registrasi</h2>
          <p style={{ fontSize: 13, color: '#6B7280', marginBottom: 20 }}>Semua proses dilakukan online, kecuali daftar ulang.</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
            {ALUR_REGISTRASI.map(a => (
              <div key={a.no} style={{ background: '#FAFAFA', borderRadius: 12, padding: 16 }}>
                <div style={{ width: 30, height: 30, borderRadius: '50%', background: '#C8973A', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 13, marginBottom: 10 }}>{a.no}</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#0A1628', marginBottom: 4 }}>{a.judul}</div>
                <div style={{ fontSize: 12, color: '#6B7280', lineHeight: 1.5 }}>{a.desc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Biaya Pendidikan */}
        <div style={card}>
          <h2 className="font-display" style={{ fontSize: 20, color: '#0A1628', marginBottom: 4 }}>Biaya Pendidikan Siswa Baru</h2>
          <p style={{ fontSize: 13, color: '#6B7280', marginBottom: 20 }}>Tahun Pelajaran 2026/2027. Belum termasuk diskon gelombang & biaya opsional (rincian lengkap muncul saat pembayaran).</p>

          {/* SMP */}
          <div style={{ marginBottom: 22 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#C8973A', marginBottom: 8 }}>SMP</div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {hargaSMP.map(h => (
                <div key={h.id} style={{ background: '#FAFAFA', borderRadius: 10, padding: '10px 16px', flex: 1, minWidth: 140 }}>
                  <div style={{ fontSize: 11, color: '#9CA3AF' }}>{h.kelas}</div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: '#0A1628' }}>{formatRupiah(h.nominal)}</div>
                </div>
              ))}
            </div>
          </div>

          {/* SMA */}
          <div style={{ marginBottom: 22 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#C8973A', marginBottom: 8 }}>SMA</div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {hargaSMA.map(h => (
                <div key={h.id} style={{ background: '#FAFAFA', borderRadius: 10, padding: '10px 16px', flex: 1, minWidth: 140 }}>
                  <div style={{ fontSize: 11, color: '#9CA3AF' }}>{h.kelas}</div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: '#0A1628' }}>{formatRupiah(h.nominal)}</div>
                </div>
              ))}
            </div>
          </div>

          {/* SMK */}
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#C8973A', marginBottom: 8 }}>SMK — Program Keahlian</div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: '#F3EEE1' }}>
                    <th style={{ textAlign: 'left', padding: '8px 12px', fontWeight: 700, color: '#0A1628' }}>Program Keahlian</th>
                    <th style={{ textAlign: 'left', padding: '8px 12px', fontWeight: 700, color: '#0A1628' }}>Kelas</th>
                    <th style={{ textAlign: 'right', padding: '8px 12px', fontWeight: 700, color: '#0A1628' }}>Biaya</th>
                  </tr>
                </thead>
                <tbody>
                  {smkGroups.map(([jurusan, rows]) => (
                    <Fragment key={jurusan}>
                      {rows.map((h, i) => (
                        <tr key={h.id} style={{ borderBottom: '1px solid #F0EBE0' }}>
                          {i === 0 && <td rowSpan={rows.length} style={{ padding: '8px 12px', color: '#374151', verticalAlign: 'top' }}>{jurusan}</td>}
                          <td style={{ padding: '8px 12px', color: '#6B7280' }}>{h.kelas}</td>
                          <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 700, color: '#0A1628' }}>{formatRupiah(h.nominal)}</td>
                        </tr>
                      ))}
                    </Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Pilih Jenjang */}
        <div style={card}>
          <h2 className="font-display" style={{ fontSize: 20, color: '#0A1628', marginBottom: 4 }}>Pilih Jenjang Pendaftaran</h2>
          <p style={{ fontSize: 13, color: '#6B7280', marginBottom: 20 }}>Pilih jenjang sekolah yang ingin Anda daftar.</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
            {(['smp', 'sma', 'smk'] as const).map(j => (
              <button
                key={j}
                onClick={() => router.push(`/spmb/daftar?jenjang=${j}`)}
                style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 8,
                  background: '#0A1628', color: 'white', border: 'none', borderRadius: 14,
                  padding: '22px 20px', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left',
                }}
              >
                <span className="font-display" style={{ fontSize: 26, fontWeight: 800, color: '#E8B84B' }}>{JENJANG_LABEL[j]}</span>
                <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>Daftar sebagai calon siswa {JENJANG_LABEL[j]}</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 700, color: '#E8B84B', marginTop: 6 }}>
                  Daftar Sekarang <ArrowRight size={14} />
                </span>
              </button>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
