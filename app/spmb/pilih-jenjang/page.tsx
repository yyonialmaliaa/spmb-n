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

  const card: React.CSSProperties = { background: 'var(--adm-surface)', borderRadius: 16, padding: 28, border: '1px solid var(--adm-border)' };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--adm-surface-alt)', fontFamily: 'Inter, sans-serif' }}>
      <div style={{ background: 'var(--cn-hijau)', padding: '16px 24px' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', display: 'flex', alignItems: 'center', gap: 12 }}>
          <Link href="/dashboard" style={{ color: 'rgba(255,255,255,0.85)', display: 'flex', alignItems: 'center' }}>
            <ChevronLeft size={20} />
          </Link>
          <h1 style={{ color: '#FFFFFF', fontSize: 16, fontWeight: 700, margin: 0 }}>Pendaftaran Peserta Didik Baru</h1>
        </div>
      </div>

      <div style={{ maxWidth: 900, margin: '32px auto', padding: '0 24px', display: 'flex', flexDirection: 'column', gap: 24 }}>

        {/* Alur Registrasi */}
        <div style={card}>
          <h2 className="font-display" style={{ fontSize: 20, color: 'var(--adm-text)', marginBottom: 4 }}>Alur Registrasi</h2>
          <p style={{ fontSize: 13, color: 'var(--adm-text-muted)', marginBottom: 20 }}>Semua proses dilakukan online, kecuali daftar ulang.</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
            {ALUR_REGISTRASI.map(a => (
              <div key={a.no} style={{ background: 'var(--adm-surface-alt)', borderRadius: 12, padding: 16 }}>
                <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'var(--cn-hijau)', color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 13, marginBottom: 10 }}>{a.no}</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--adm-text)', marginBottom: 4 }}>{a.judul}</div>
                <div style={{ fontSize: 12, color: 'var(--adm-text-muted)', lineHeight: 1.5 }}>{a.desc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Biaya Pendidikan */}
        <div style={card}>
          <h2 className="font-display" style={{ fontSize: 20, color: 'var(--adm-text)', marginBottom: 4 }}>Biaya Pendidikan Siswa Baru</h2>
          <p style={{ fontSize: 13, color: 'var(--adm-text-muted)', marginBottom: 20 }}>Tahun Pelajaran 2026/2027. Belum termasuk diskon gelombang & biaya opsional (rincian lengkap muncul saat pembayaran).</p>

          {/* SMP */}
          <div style={{ marginBottom: 22 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--cn-hijau)', marginBottom: 8 }}>SMP</div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {hargaSMP.map(h => (
                <div key={h.id} style={{ background: 'var(--adm-surface-alt)', borderRadius: 10, padding: '10px 16px', flex: 1, minWidth: 140 }}>
                  <div style={{ fontSize: 11, color: 'var(--adm-text-faint)' }}>{h.kelas}</div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--adm-text)' }}>{formatRupiah(h.nominal)}</div>
                </div>
              ))}
            </div>
          </div>

          {/* SMA */}
          <div style={{ marginBottom: 22 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--cn-hijau)', marginBottom: 8 }}>SMA</div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {hargaSMA.map(h => (
                <div key={h.id} style={{ background: 'var(--adm-surface-alt)', borderRadius: 10, padding: '10px 16px', flex: 1, minWidth: 140 }}>
                  <div style={{ fontSize: 11, color: 'var(--adm-text-faint)' }}>{h.kelas}</div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--adm-text)' }}>{formatRupiah(h.nominal)}</div>
                </div>
              ))}
            </div>
          </div>

          {/* SMK */}
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--cn-hijau)', marginBottom: 8 }}>SMK — Program Keahlian</div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: 'var(--adm-surface-alt)' }}>
                    <th style={{ textAlign: 'left', padding: '8px 12px', fontWeight: 700, color: 'var(--adm-text)' }}>Program Keahlian</th>
                    <th style={{ textAlign: 'left', padding: '8px 12px', fontWeight: 700, color: 'var(--adm-text)' }}>Kelas</th>
                    <th style={{ textAlign: 'right', padding: '8px 12px', fontWeight: 700, color: 'var(--adm-text)' }}>Biaya</th>
                  </tr>
                </thead>
                <tbody>
                  {smkGroups.map(([jurusan, rows]) => (
                    <Fragment key={jurusan}>
                      {rows.map((h, i) => (
                        <tr key={h.id} style={{ borderBottom: '1px solid var(--adm-border)' }}>
                          {i === 0 && <td rowSpan={rows.length} style={{ padding: '8px 12px', color: 'var(--adm-text)', verticalAlign: 'top' }}>{jurusan}</td>}
                          <td style={{ padding: '8px 12px', color: 'var(--adm-text-muted)' }}>{h.kelas}</td>
                          <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 700, color: 'var(--adm-text)' }}>{formatRupiah(h.nominal)}</td>
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
          <h2 className="font-display" style={{ fontSize: 20, color: 'var(--adm-text)', marginBottom: 4 }}>Pilih Jenjang Pendaftaran</h2>
          <p style={{ fontSize: 13, color: 'var(--adm-text-muted)', marginBottom: 20 }}>Pilih jenjang sekolah yang ingin Anda daftar.</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
            {(['smp', 'sma', 'smk'] as const).map(j => (
              <button
                key={j}
                onClick={() => router.push(`/spmb/daftar?jenjang=${j}`)}
                style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 8,
                  background: 'var(--cn-hijau)', color: '#FFFFFF', border: 'none', borderRadius: 14,
                  padding: '22px 20px', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left',
                }}
              >
                <span className="font-display" style={{ fontSize: 26, fontWeight: 800, color: 'var(--cn-emas)' }}>{JENJANG_LABEL[j]}</span>
                <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.85)' }}>Daftar sebagai calon siswa {JENJANG_LABEL[j]}</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 700, color: 'var(--cn-emas)', marginTop: 6 }}>
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
