'use client';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft, Download, Users, Wallet, DollarSign, Tag, Layers, FileText } from 'lucide-react';

function formatRupiah(n: number): string {
  return 'Rp' + n.toLocaleString('id-ID');
}

type HargaRow = { id: string; jurusan: string; kelas: string; nominal: number; aktif: boolean };
type DiskonRow = { id: string; jenis: string; tipeNominal: string; nominal: number; aktif: boolean };
type GelombangRow = { id: string; nama: string; untukAlumni: boolean; diskonPersen: number; aktif: boolean };
type Ringkasan = {
  tahunAjaran: { id: string; nama: string; aktif: boolean; createdAt: string };
  pendaftar: {
    total: number; smp: number; sma: number; smk: number; online: number; offline: number;
    draft: number; verified: number; diterima_berkas: number; ditolak: number; daftarUlang: number;
  };
  keuangan: {
    totalTagihan: number; totalDibayar: number; totalRefund: number; totalSisaBayar: number;
    totalDiskonNominal: number; jumlahCicilanTerverifikasi: number; jumlahMenungguVerifikasi: number;
  };
  harga: { smp: HargaRow[]; sma: HargaRow[]; smk: HargaRow[] };
  diskon: DiskonRow[];
  gelombang: { smp: GelombangRow[]; sma: GelombangRow[]; smk: GelombangRow[] };
  dokumenCount: number;
};

const statCard = (bg: string, border: string): React.CSSProperties => ({ background: bg, border: `1px solid ${border}`, borderRadius: 12, padding: '14px 16px' });
const statLabel: React.CSSProperties = { fontSize: 10, fontWeight: 700, color: 'var(--adm-text-faint)', textTransform: 'uppercase', letterSpacing: 0.3, marginBottom: 4 };
const statValue: React.CSSProperties = { fontSize: 20, fontWeight: 800, color: 'var(--adm-text)' };

export default function LihatDataTahunAjaranPage() {
  const params = useParams();
  const id = (Array.isArray(params.id) ? params.id[0] : params.id) as string;

  const [data, setData] = useState<Ringkasan | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState('');
  const [toast, setToast] = useState('');

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  useEffect(() => {
    if (!id) return;
    fetch(`/api/admin/tahun-ajaran/${id}/ringkasan`).then(r => r.json()).then(d => {
      setData(d.data || null);
      setLoading(false);
    });
  }, [id]);

  const downloadCsv = (filename: string, headers: string[], rows: (string | number)[][]) => {
    const csv = '﻿' + [headers, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\r\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
    a.download = filename;
    a.click();
  };

  const handleExportPendaftar = async () => {
    if (!data) return;
    setExporting('pendaftar');
    const res = await fetch(`/api/admin/pendaftar?tahunAjaranId=${id}`);
    const d = await res.json();
    const list = d.data || [];
    downloadCsv(
      `pendaftar-${data.tahunAjaran.nama.replace('/', '-')}.csv`,
      ['No', 'Nama Lengkap', 'Email', 'Jenjang', 'Jurusan', 'Kelas', 'Sumber Daftar', 'Status', 'NIK', 'No. WhatsApp', 'Tanggal Daftar'],
      list.map((p: any, i: number) => [
        i + 1, p.namaLengkap || '-', p.userEmail || '-', (p.jenjang || 'smk').toUpperCase(), p.jurusan || '-', p.kelas || '-',
        (p.sumberDaftar || 'online') === 'online' ? 'Online' : 'Offline', p.status,
        p.nik || '-', p.noPribadi || '-', new Date(p.createdAt).toLocaleDateString('id-ID'),
      ])
    );
    setExporting('');
  };

  const handleExportKeuangan = async () => {
    if (!data) return;
    setExporting('keuangan');
    const res = await fetch(`/api/admin/pendaftar?tahunAjaranId=${id}`);
    const d = await res.json();
    const list = d.data || [];
    downloadCsv(
      `keuangan-${data.tahunAjaran.nama.replace('/', '-')}.csv`,
      ['No', 'Nama Lengkap', 'Jenjang', 'Jurusan', 'Kelas', 'Gelombang', 'Total Tagihan', 'Diskon Gelombang', 'Diskon Tambahan', 'Status Pembayaran'],
      list.map((p: any, i: number) => [
        i + 1, p.namaLengkap || '-', (p.jenjang || 'smk').toUpperCase(), p.jurusan || '-', p.kelas || '-',
        p.gelombang || '-', p.totalTagihan || 0, p.gelombangDiskonNominal || 0, p.diskonNominal || 0, p.statusPembayaran || 'belum_bayar',
      ])
    );
    setExporting('');
  };

  const handleExportRingkasan = () => {
    if (!data) return;
    setExporting('ringkasan');
    const rows: (string | number)[][] = [
      ['Tahun Ajaran', data.tahunAjaran.nama],
      ['Status', data.tahunAjaran.aktif ? 'Aktif' : 'Tidak Aktif'],
      ['Total Pendaftar', data.pendaftar.total],
      ['Pendaftar SMP', data.pendaftar.smp],
      ['Pendaftar SMA', data.pendaftar.sma],
      ['Pendaftar SMK', data.pendaftar.smk],
      ['Pendaftar Online', data.pendaftar.online],
      ['Pendaftar Offline', data.pendaftar.offline],
      ['Draft (Belum Dikirim)', data.pendaftar.draft],
      ['Sedang Diverifikasi', data.pendaftar.verified],
      ['Terima Berkas', data.pendaftar.diterima_berkas],
      ['Tolak Berkas', data.pendaftar.ditolak],
      ['Sudah Daftar Ulang', data.pendaftar.daftarUlang],
      ['Total Tagihan', data.keuangan.totalTagihan],
      ['Total Dibayar', data.keuangan.totalDibayar],
      ['Total Diskon', data.keuangan.totalDiskonNominal],
      ['Total Dikembalikan (Refund)', data.keuangan.totalRefund],
      ['Total Sisa Pembayaran', data.keuangan.totalSisaBayar],
      ['Jumlah Cicilan Terverifikasi', data.keuangan.jumlahCicilanTerverifikasi],
      ['Jumlah Menunggu Verifikasi', data.keuangan.jumlahMenungguVerifikasi],
      ['Jumlah Jenis Diskon Tersedia', data.diskon.length],
      ['Jumlah Dokumen Persyaratan', data.dokumenCount],
    ];
    downloadCsv(`ringkasan-${data.tahunAjaran.nama.replace('/', '-')}.csv`, ['Keterangan', 'Nilai'], rows);
    setExporting('');
  };

  if (loading) return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--adm-text-faint)' }}>Memuat...</div>;
  if (!data) return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--adm-text-faint)' }}>Tahun ajaran tidak ditemukan</div>;

  const { tahunAjaran, pendaftar, keuangan, harga, diskon, gelombang } = data;
  const jenjangList: ('smp' | 'sma' | 'smk')[] = ['smp', 'sma', 'smk'];

  return (
    <div style={{ minHeight: '100vh', background: 'var(--adm-bg)', fontFamily: 'Inter, sans-serif' }}>
      {toast && <div style={{ position: 'fixed', top: 24, right: 24, background: 'var(--adm-primary)', color: 'var(--adm-text-invert)', padding: '12px 20px', borderRadius: 10, fontSize: 13, fontWeight: 600, zIndex: 9999 }}>{toast}</div>}

      <div style={{ background: 'var(--adm-primary)', padding: '18px 24px' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          <Link href="/admin/tahun-ajaran" style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'rgba(255,255,255,0.6)', fontSize: 12, textDecoration: 'none', marginBottom: 10, width: 'fit-content' }}>
            <ChevronLeft size={14} /> Kembali ke Tahun Ajaran
          </Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <h1 style={{ color: 'var(--adm-text-invert)', fontSize: 20, fontWeight: 700 }}>Lihat Kesimpulan — Tahun Ajaran {tahunAjaran.nama}</h1>
            <span style={{ background: tahunAjaran.aktif ? 'var(--adm-success-weak)' : 'rgba(255,255,255,0.1)', color: tahunAjaran.aktif ? 'var(--adm-success)' : 'rgba(255,255,255,0.6)', fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 10 }}>
              {tahunAjaran.aktif ? 'AKTIF' : 'TIDAK AKTIF (HISTORIS)'}
            </span>
          </div>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, marginTop: 4 }}>
            {tahunAjaran.aktif
              ? 'Seluruh data pendaftaran baru saat ini masuk ke tahun ajaran ini.'
              : 'Tahun ajaran ini tidak aktif — data di bawah bersifat historis dan tidak berubah.'}
          </p>
          <Link href={`/admin/dashboard?tahunAjaranId=${tahunAjaran.id}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 10, fontSize: 12, fontWeight: 700, color: 'var(--adm-secondary)', textDecoration: 'none' }}>
            Buka Panel Admin Lengkap untuk Tahun Ini →
          </Link>
        </div>
      </div>

      <div style={{ maxWidth: 1000, margin: '28px auto', padding: '0 24px', display: 'flex', flexDirection: 'column', gap: 24 }}>

        {/* Pendaftar */}
        <div style={{ background: 'var(--adm-surface)', borderRadius: 14, padding: 20, border: '1px solid var(--adm-border)' }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--adm-text)', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}><Users size={16} color="var(--adm-secondary)" /> Pendaftar</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 10 }}>
            <div style={statCard('var(--adm-text-faint)', 'var(--adm-text-faint)')}><div style={statLabel}>TOTAL</div><div style={statValue}>{pendaftar.total}</div></div>
            <div style={statCard('var(--adm-text-faint)', 'var(--adm-text-faint)')}><div style={statLabel}>SMP</div><div style={statValue}>{pendaftar.smp}</div></div>
            <div style={statCard('var(--adm-text-faint)', 'var(--adm-text-faint)')}><div style={statLabel}>SMA</div><div style={statValue}>{pendaftar.sma}</div></div>
            <div style={statCard('var(--adm-text-faint)', 'var(--adm-text-faint)')}><div style={statLabel}>SMK</div><div style={statValue}>{pendaftar.smk}</div></div>
            <div style={statCard('var(--adm-info-weak)', 'var(--adm-info-border)')}><div style={{ ...statLabel, color: 'var(--adm-info)' }}>ONLINE</div><div style={{ ...statValue, color: 'var(--adm-info)' }}>{pendaftar.online}</div></div>
            <div style={statCard('var(--adm-warning-weak)', 'var(--adm-warning-border)')}><div style={{ ...statLabel, color: 'var(--adm-warning)' }}>OFFLINE</div><div style={{ ...statValue, color: 'var(--adm-warning)' }}>{pendaftar.offline}</div></div>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12 }}>
            {[
              ['Draft', pendaftar.draft, 'var(--adm-text-muted)', 'var(--adm-text-faint)'],
              ['Sedang Diverifikasi', pendaftar.verified, 'var(--adm-info)', 'var(--adm-info-weak)'],
              ['Terima Berkas', pendaftar.diterima_berkas, 'var(--adm-success)', 'var(--adm-success-weak)'],
              ['Tolak Berkas', pendaftar.ditolak, 'var(--adm-danger)', 'var(--adm-danger-weak)'],
              ['Sudah Daftar Ulang', pendaftar.daftarUlang, 'var(--adm-warning)', 'var(--adm-warning-weak)'],
            ].map(([label, val, color, bg]: any) => (
              <span key={label} style={{ background: bg, color, fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 10 }}>{label}: {val}</span>
            ))}
          </div>
        </div>

        {/* Keuangan */}
        <div style={{ background: 'var(--adm-surface)', borderRadius: 14, padding: 20, border: '1px solid var(--adm-border)' }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--adm-text)', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}><Wallet size={16} color="var(--adm-secondary)" /> Keuangan</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 10 }}>
            <div style={statCard('var(--adm-text-faint)', 'var(--adm-text-faint)')}><div style={statLabel}>TOTAL TAGIHAN</div><div style={{ ...statValue, fontSize: 15 }}>{formatRupiah(keuangan.totalTagihan)}</div></div>
            <div style={statCard('var(--adm-success-weak)', 'var(--adm-success-border)')}><div style={{ ...statLabel, color: 'var(--adm-success)' }}>TOTAL DIBAYAR</div><div style={{ ...statValue, fontSize: 15, color: 'var(--adm-success)' }}>{formatRupiah(keuangan.totalDibayar)}</div></div>
            <div style={statCard('var(--adm-warning-weak)', 'var(--adm-warning-border)')}><div style={{ ...statLabel, color: 'var(--adm-warning)' }}>SISA PEMBAYARAN</div><div style={{ ...statValue, fontSize: 15, color: 'var(--adm-warning)' }}>{formatRupiah(keuangan.totalSisaBayar)}</div></div>
            <div style={statCard('var(--adm-info-weak)', 'var(--adm-info-border)')}><div style={{ ...statLabel, color: 'var(--adm-info)' }}>TOTAL DISKON</div><div style={{ ...statValue, fontSize: 15, color: 'var(--adm-info)' }}>{formatRupiah(keuangan.totalDiskonNominal)}</div></div>
            <div style={statCard('var(--adm-warning-weak)', 'var(--adm-warning-border)')}><div style={{ ...statLabel, color: 'var(--adm-warning)' }}>TOTAL DIKEMBALIKAN</div><div style={{ ...statValue, fontSize: 15, color: 'var(--adm-warning)' }}>{formatRupiah(keuangan.totalRefund)}</div></div>
            <div style={statCard('var(--adm-ungu-weak)', 'var(--adm-ungu-weak)')}><div style={{ ...statLabel, color: 'var(--adm-ungu)' }}>CICILAN TERVERIFIKASI</div><div style={{ ...statValue, fontSize: 15, color: 'var(--adm-ungu)' }}>{keuangan.jumlahCicilanTerverifikasi}</div></div>
          </div>
        </div>

        {/* Harga */}
        <div style={{ background: 'var(--adm-surface)', borderRadius: 14, padding: 20, border: '1px solid var(--adm-border)' }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--adm-text)', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}><DollarSign size={16} color="var(--adm-secondary)" /> Harga</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 14 }}>
            {jenjangList.map(j => (
              <div key={j}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--adm-secondary)', marginBottom: 6 }}>{j.toUpperCase()} ({harga[j].length} baris)</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 160, overflowY: 'auto' }}>
                  {harga[j].length === 0 ? <p style={{ fontSize: 11, color: 'var(--adm-text-faint)' }}>Belum ada harga</p> : harga[j].map(h => (
                    <div key={h.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, background: 'var(--adm-surface-alt)', borderRadius: 6, padding: '5px 8px', opacity: h.aktif ? 1 : 0.5 }}>
                      <span style={{ color: 'var(--adm-text)' }}>{j === 'smk' ? `${h.jurusan} — ${h.kelas}` : h.kelas}</span>
                      <span style={{ fontWeight: 700, color: 'var(--adm-text)' }}>{formatRupiah(h.nominal)}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Diskon */}
        <div style={{ background: 'var(--adm-surface)', borderRadius: 14, padding: 20, border: '1px solid var(--adm-border)' }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--adm-text)', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}><Tag size={16} color="var(--adm-secondary)" /> Diskon ({diskon.length})</h3>
          {diskon.length === 0 ? <p style={{ fontSize: 12, color: 'var(--adm-text-faint)' }}>Belum ada diskon untuk tahun ajaran ini.</p> : (
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {diskon.map(d => (
                <span key={d.id} style={{ background: d.aktif ? 'var(--adm-success-weak)' : 'var(--adm-surface-alt)', color: d.aktif ? 'var(--adm-success)' : 'var(--adm-text-faint)', fontSize: 12, fontWeight: 600, padding: '6px 12px', borderRadius: 10, border: `1px solid ${d.aktif ? 'var(--adm-success-border)' : 'var(--adm-text-faint)'}` }}>
                  {d.jenis} ({d.tipeNominal === 'persen' ? `${d.nominal}%` : formatRupiah(d.nominal)})
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Gelombang */}
        <div style={{ background: 'var(--adm-surface)', borderRadius: 14, padding: 20, border: '1px solid var(--adm-border)' }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--adm-text)', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}><Layers size={16} color="var(--adm-secondary)" /> Gelombang</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 14 }}>
            {jenjangList.map(j => (
              <div key={j}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--adm-secondary)', marginBottom: 6 }}>{j.toUpperCase()}</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {gelombang[j].length === 0 ? <p style={{ fontSize: 11, color: 'var(--adm-text-faint)' }}>Belum ada gelombang</p> : gelombang[j].map(g => (
                    <div key={g.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, background: 'var(--adm-surface-alt)', borderRadius: 6, padding: '5px 8px' }}>
                      <span style={{ color: 'var(--adm-text)' }}>{g.nama}{g.untukAlumni ? ' (Alumni)' : ''}</span>
                      {g.aktif && <span style={{ color: 'var(--adm-success)', fontWeight: 700 }}>AKTIF</span>}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Ekspor */}
        <div style={{ background: 'var(--adm-surface)', borderRadius: 14, padding: 20, border: '1px solid var(--adm-border)' }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--adm-text)', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 8 }}><FileText size={16} color="var(--adm-secondary)" /> Ekspor Data</h3>
          <p style={{ fontSize: 12, color: 'var(--adm-text-faint)', marginBottom: 14 }}>Ekspor hanya mengambil data dari tahun ajaran {tahunAjaran.nama} ini.</p>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button onClick={handleExportPendaftar} disabled={!!exporting} className="adm-btn adm-btn--primary adm-btn--sm">
              <Download size={14} /> {exporting === 'pendaftar' ? 'Mengekspor...' : 'Data Pendaftar'}
            </button>
            <button onClick={handleExportKeuangan} disabled={!!exporting} className="adm-btn adm-btn--primary adm-btn--sm">
              <Download size={14} /> {exporting === 'keuangan' ? 'Mengekspor...' : 'Data Keuangan'}
            </button>
            <button onClick={handleExportRingkasan} disabled={!!exporting} className="adm-btn adm-btn--primary adm-btn--sm">
              <Download size={14} /> {exporting === 'ringkasan' ? 'Mengekspor...' : 'Ringkasan Keseluruhan'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
