'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  GraduationCap, Users, LayoutDashboard, BarChart2,
  LogOut, User, Download, Printer, TrendingUp,
  CheckCircle, XCircle, Clock, Award, RefreshCw, ClipboardCheck
} from 'lucide-react';
import Image from 'next/image';

type Pendaftaran = {
  id: string; namaLengkap: string; jurusan: string; asalSMP?: string; asalSekolah?: string;
  jenisKelamin: string; status: string; nilaiTes?: number; nilaiSeleksi?: number;
  sudahDaftarUlang?: boolean; createdAt: string;
};

type Stats = {
  total: number; pending: number; verified: number;
  diterima: number; ditolak: number; lulus: number;
  tidak_lulus: number; daftar_ulang: number;
};

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  pending:         { label: 'Menunggu',        color: '#92400E', bg: '#FEF3C7' },
  verified:        { label: 'Diverifikasi',    color: '#1E40AF', bg: '#DBEAFE' },
  diterima_berkas: { label: 'Berkas Diterima', color: '#065F46', bg: '#D1FAE5' },
  ditolak:         { label: 'Ditolak',         color: '#991B1B', bg: '#FEE2E2' },
  tes:             { label: 'Jadwal Tes',      color: '#5B21B6', bg: '#EDE9FE' },
  lulus:           { label: 'Lulus',           color: '#065F46', bg: '#D1FAE5' },
  tidak_lulus:     { label: 'Tidak Lulus',     color: '#991B1B', bg: '#FEE2E2' },
  daftar_ulang:    { label: 'Daftar Ulang ✓', color: '#065F46', bg: '#D1FAE5' },
};

const JURUSAN_LIST = [
  { kode: 'PPLG', color: '#1D4ED8' }, { kode: 'TJKT', color: '#4fcbeb' },
  { kode: 'DKV',  color: '#D97706' }, { kode: 'MPLB', color: '#EAB308' },
  { kode: 'PM',   color: '#e2c9ad' }, { kode: 'PH',   color: '#16A34A' },
];

export default function AdminLaporan() {
  const router = useRouter();
  const [session, setSession] = useState<{ namaLengkap?: string } | null>(null);
  const [data, setData] = useState<Pendaftaran[]>([]);
  const [stats, setStats] = useState<Stats>({ total: 0, pending: 0, verified: 0, diterima: 0, ditolak: 0, lulus: 0, tidak_lulus: 0, daftar_ulang: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/auth/me').then(r => r.json()).then(d => {
      if (!d.user || d.user.role !== 'admin') { router.push('/login'); return; }
      setSession(d.user);
    });
    fetch('/api/admin/pendaftar').then(r => r.json()).then(d => {
      setData(d.data || []);
      setStats(d.stats || { total: 0, pending: 0, verified: 0, diterima: 0, ditolak: 0, lulus: 0, tidak_lulus: 0, daftar_ulang: 0 });
      setLoading(false);
    });
  }, [router]);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/');
  };

  const handleExportCSV = () => {
    const headers = ['No', 'Nama', 'Jurusan', 'Asal Sekolah', 'Jenis Kelamin', 'Status', 'Nilai Tes', 'Nilai Seleksi', 'Daftar Ulang', 'Tanggal Daftar'];
    const rows = data.map((p, i) => [
      i + 1, p.namaLengkap, p.jurusan, p.asalSMP || p.asalSekolah || '',
      p.jenisKelamin, p.status,
      p.nilaiTes ?? '', p.nilaiSeleksi ?? '',
      p.sudahDaftarUlang ? 'Ya' : 'Belum',
      new Date(p.createdAt).toLocaleDateString('id-ID'),
    ]);
    const csv = [headers, ...rows].map(r => r.map(v => `"${v}"`).join(',')).join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    a.download = `laporan-spmb-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  };

  const handlePrint = () => window.print();

  // Per jurusan stats
  const jurusanStats = JURUSAN_LIST.map(j => ({
    ...j,
    total:    data.filter(p => p.jurusan.toUpperCase().includes(j.kode)).length,
    lulus:    data.filter(p => p.jurusan.toUpperCase().includes(j.kode) && ['lulus','daftar_ulang'].includes(p.status)).length,
    ditolak:  data.filter(p => p.jurusan.toUpperCase().includes(j.kode) && p.status === 'ditolak').length,
    pending:  data.filter(p => p.jurusan.toUpperCase().includes(j.kode) && p.status === 'pending').length,
    pct:      data.length > 0 ? Math.round((data.filter(p => p.jurusan.toUpperCase().includes(j.kode)).length / data.length) * 100) : 0,
  })).sort((a, b) => b.total - a.total);

  const maxJurusan = Math.max(...jurusanStats.map(j => j.total), 1);

  // Gender stats
  const genderStats = data.reduce((acc, p) => {
    const k = p.jenisKelamin || 'Lainnya';
    acc[k] = (acc[k] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Nilai stats
  const withNilaiTes = data.filter(p => p.nilaiTes != null);
  const avgNilaiTes = withNilaiTes.length > 0
    ? (withNilaiTes.reduce((s, p) => s + (p.nilaiTes || 0), 0) / withNilaiTes.length).toFixed(1)
    : '—';
  const maxNilai = withNilaiTes.length > 0 ? Math.max(...withNilaiTes.map(p => p.nilaiTes || 0)) : 0;
  const minNilai = withNilaiTes.length > 0 ? Math.min(...withNilaiTes.map(p => p.nilaiTes || 0)) : 0;
  const tingkatKelulusan = stats.total > 0 ? ((stats.lulus + stats.daftar_ulang) / stats.total * 100).toFixed(1) : '0';

  return (
    <div style={{ minHeight: '100vh', background: '#F8F9FA', display: 'flex' }}>
      {/* Sidebar */}
      <aside style={{ width: 240, background: 'linear-gradient(180deg, #123524 0%, #0B2A1C 100%)', flexShrink: 0, display: 'flex', flexDirection: 'column' }} className="no-print">
        <div style={{ padding: '24px 20px 20px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
             <div
              style={{
                width: 38,
                height: 38,
                borderRadius: 10,
                overflow: "hidden",
                position: "relative",
              }}
            >
              <Image
                src="/images/logo.png"
                alt="Logo SMK Citra Negara"
                width={38}
                height={38}
                style={{ objectFit: "cover" }}
              />
            </div>
            <div>
              <div style={{ color: 'white', fontWeight: 700, fontSize: 13 }}>SMK Citra Negara</div>
              <div style={{ color: '#C8973A', fontSize: 10 }}>Admin Panel</div>
            </div>
          </Link>
        </div>
        <nav style={{ padding: '16px 12px', flex: 1 }}>
          {[
            { href: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
            { href: '/admin/pendaftar', icon: Users, label: 'Data Pendaftar' },
            { href: '/admin/laporan', icon: BarChart2, label: 'Laporan', active: true },
          ].map(item => (
            <Link key={item.href} href={item.href} className="sidebar-link" style={{ marginBottom: 4, background: item.active ? 'rgba(200,151,58,0.15)' : undefined, color: item.active ? '#C8973A' : undefined }}>
              <item.icon size={17} />{item.label}
            </Link>
          ))}
        </nav>
        <div style={{ padding: '16px 12px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', background: 'rgba(255,255,255,0.05)', borderRadius: 10, marginBottom: 8 }}>
            <div style={{ width: 32, height: 32, background: 'rgba(200,151,58,0.2)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <User size={16} color="#C8973A" />
            </div>
            <div>
              <div style={{ color: 'white', fontSize: 12, fontWeight: 600 }}>{session?.namaLengkap}</div>
              <div style={{ color: '#C8973A', fontSize: 10 }}>Administrator</div>
            </div>
          </div>
          <button onClick={handleLogout} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '9px 12px', background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', borderRadius: 8, fontSize: 12, fontFamily: 'inherit' }}>
            <LogOut size={15} /> Keluar
          </button>
        </div>
      </aside>

      {/* Main */}
      <div style={{ flex: 1, overflow: 'auto' }}>
        <header
  className="no-print"
  style={{
    background: 'white',
    borderBottom: '1px solid #E5E7EB',
    padding: '20px 32px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  }}
>
  <div>
    <h1
      style={{
        fontSize: 18,
        fontWeight: 700,
        color: '#0B3B2E',
        marginBottom: 6,
      }}
    >
      Laporan SPMB
    </h1>

    <p
      style={{
        fontSize: 12,
        color: '#6B7280',
      }}
    >
      Analisis dan rekapitulasi data pendaftaran — TA 2026/2027
    </p>
  </div>

  <div style={{ display: 'flex', gap: 10 }}>
    <button
      onClick={handleExportCSV}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 7,
        padding: '8px 16px',
        background: '#F0FDF4',
        border: '1px solid #BBF7D0',
        borderRadius: 8,
        color: '#059669',
        fontSize: 13,
        fontWeight: 600,
        cursor: 'pointer',
        fontFamily: 'inherit',
      }}
    >
      <Download size={15} />
      Export CSV
    </button>

    <button
      onClick={handlePrint}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 7,
        padding: '8px 16px',
        background: '#0B3B2E',
        border: 'none',
        borderRadius: 8,
        color: 'white',
        fontSize: 13,
        fontWeight: 600,
        cursor: 'pointer',
        fontFamily: 'inherit',
      }}
    >
      <Printer size={15} />
      Cetak
    </button>
  </div>
</header>

        <main style={{ padding: '28px 32px' }}>
          {/* Print header */}
          <div style={{ display: 'none', textAlign: 'center', marginBottom: 24, borderBottom: '2px solid #C8973A', paddingBottom: 16 }} className="print-only">
            <h2 style={{ fontSize: 20, fontWeight: 800, color: '#0A1628' }}>SMK CITRA NEGARA</h2>
            <p style={{ fontSize: 14, color: '#6B7280' }}>Laporan SPMB Tahun Ajaran 2026/2027</p>
            <p style={{ fontSize: 12, color: '#9CA3AF' }}>Dicetak: {new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
          </div>
          <style>{`@media print { .print-only { display: block !important; } .no-print { display: none !important; } }`}</style>

          {/* Ringkasan 8 kartu */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
            {[
              { label: 'Total Pendaftar',  val: stats.total,        icon: Users,          color: '#0A1628', bg: '#F8F9FA' },
              { label: 'Lulus',            val: stats.lulus,        icon: Award,          color: '#059669', bg: '#F0FDF4' },
              { label: 'Tidak Lulus',      val: stats.tidak_lulus,  icon: XCircle,        color: '#DC2626', bg: '#FFF1F2' },
              { label: 'Tingkat Kelulusan', val: `${tingkatKelulusan}%`, icon: TrendingUp, color: '#C8973A', bg: '#FFFBEB' },
              { label: 'Daftar Ulang ✓',  val: stats.daftar_ulang, icon: ClipboardCheck, color: '#065F46', bg: '#F0FDF4' },
              { label: 'Ditolak',          val: stats.ditolak,      icon: XCircle,        color: '#991B1B', bg: '#FEF2F2' },
              { label: 'Rata-rata Nilai Tes', val: avgNilaiTes,     icon: BarChart2,      color: '#5B21B6', bg: '#F5F3FF' },
              { label: 'Menunggu Proses',  val: stats.pending + stats.verified, icon: Clock, color: '#D97706', bg: '#FFFBEB' },
            ].map(c => (
              <div key={c.label} style={{ background: 'white', borderRadius: 14, padding: '18px 20px', border: '1px solid #F3F4F6' }}>
                <div style={{ width: 40, height: 40, background: c.bg, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                  <c.icon size={20} color={c.color} />
                </div>
                <div className="font-display" style={{ fontSize: 30, fontWeight: 700, color: c.color, lineHeight: 1 }}>{c.val}</div>
                <div style={{ fontSize: 12, color: '#6B7280', marginTop: 5 }}>{c.label}</div>
              </div>
            ))}
          </div>

          {/* Nilai Statistik */}
          {withNilaiTes.length > 0 && (
            <div style={{ background: 'white', borderRadius: 14, padding: 22, border: '1px solid #F3F4F6', marginBottom: 20 }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: '#0A1628', marginBottom: 16 }}>Statistik Nilai Tes</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 16 }}>
                {[
                  { label: 'Nilai Tertinggi', val: maxNilai, color: '#059669' },
                  { label: 'Nilai Terendah', val: minNilai, color: '#DC2626' },
                  { label: 'Rata-rata', val: avgNilaiTes, color: '#C8973A' },
                ].map(n => (
                  <div key={n.label} style={{ background: '#FAFAFA', borderRadius: 10, padding: '14px 18px', textAlign: 'center' }}>
                    <div className="font-display" style={{ fontSize: 32, fontWeight: 700, color: n.color }}>{n.val}</div>
                    <div style={{ fontSize: 12, color: '#6B7280', marginTop: 4 }}>{n.label}</div>
                  </div>
                ))}
              </div>
              {/* Distribusi nilai */}
              <div>
                <p style={{ fontSize: 12, color: '#6B7280', marginBottom: 10 }}>Distribusi nilai ({withNilaiTes.length} siswa sudah dinilai):</p>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {[
                    { label: '90–100', count: withNilaiTes.filter(p => (p.nilaiTes||0) >= 90).length, color: '#059669' },
                    { label: '80–89',  count: withNilaiTes.filter(p => (p.nilaiTes||0) >= 80 && (p.nilaiTes||0) < 90).length, color: '#0891B2' },
                    { label: '70–79',  count: withNilaiTes.filter(p => (p.nilaiTes||0) >= 70 && (p.nilaiTes||0) < 80).length, color: '#D97706' },
                    { label: '< 70',   count: withNilaiTes.filter(p => (p.nilaiTes||0) < 70).length, color: '#DC2626' },
                  ].map(d => (
                    <div key={d.label} style={{ background: `${d.color}10`, border: `1px solid ${d.color}30`, borderRadius: 8, padding: '8px 14px', textAlign: 'center' }}>
                      <div style={{ fontSize: 18, fontWeight: 700, color: d.color }}>{d.count}</div>
                      <div style={{ fontSize: 11, color: '#6B7280' }}>{d.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
            {/* Per Jurusan */}
            <div style={{ background: 'white', borderRadius: 14, padding: 22, border: '1px solid #F3F4F6' }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: '#0A1628', marginBottom: 18 }}>Pendaftar per Jurusan</h3>
              {jurusanStats.filter(j => j.total > 0).length === 0 ? (
                <p style={{ color: '#9CA3AF', fontSize: 13 }}>Belum ada data</p>
              ) : (
                jurusanStats.map(j => j.total > 0 && (
                  <div key={j.kode} style={{ marginBottom: 16 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: j.color }}>{j.kode}</span>
                      <span style={{ fontSize: 12, color: '#6B7280' }}>{j.total} ({j.pct}%)</span>
                    </div>
                    <div style={{ height: 8, background: '#F3F4F6', borderRadius: 4, overflow: 'hidden', marginBottom: 5 }}>
                      <div style={{ height: '100%', width: `${(j.total / maxJurusan) * 100}%`, background: j.color, borderRadius: 4 }} />
                    </div>
                    <div style={{ display: 'flex', gap: 12 }}>
                      <span style={{ fontSize: 11, color: '#059669' }}>✓ {j.lulus} lulus</span>
                      <span style={{ fontSize: 11, color: '#DC2626' }}>✗ {j.ditolak} ditolak</span>
                      <span style={{ fontSize: 11, color: '#D97706' }}>⏳ {j.pending} menunggu</span>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Status & Gender */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Status breakdown */}
              <div style={{ background: 'white', borderRadius: 14, padding: 20, border: '1px solid #F3F4F6' }}>
                <h3 style={{ fontSize: 14, fontWeight: 700, color: '#0A1628', marginBottom: 14 }}>Breakdown Status</h3>
                {[
                  { label: 'Daftar Ulang ✓', val: stats.daftar_ulang,  color: '#059669', bg: '#D1FAE5' },
                  { label: 'Lulus',           val: stats.lulus,          color: '#059669', bg: '#D1FAE5' },
                  { label: 'Berkas Diterima', val: stats.diterima,       color: '#0891B2', bg: '#DBEAFE' },
                  { label: 'Diverifikasi',    val: stats.verified,       color: '#2563EB', bg: '#EFF6FF' },
                  { label: 'Menunggu',        val: stats.pending,        color: '#D97706', bg: '#FEF3C7' },
                  { label: 'Ditolak',         val: stats.ditolak,        color: '#DC2626', bg: '#FEE2E2' },
                  { label: 'Tidak Lulus',     val: stats.tidak_lulus,    color: '#991B1B', bg: '#FEE2E2' },
                ].map(s => (
                  <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 9 }}>
                    <span style={{ background: s.bg, color: s.color, padding: '2px 8px', borderRadius: 8, fontSize: 10, fontWeight: 700, minWidth: 100, textAlign: 'center' }}>{s.label}</span>
                    <div style={{ flex: 1, height: 5, background: '#F3F4F6', borderRadius: 3 }}>
                      <div style={{ height: '100%', width: `${stats.total > 0 ? (s.val / stats.total) * 100 : 0}%`, background: s.color, borderRadius: 3 }} />
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#374151', minWidth: 24, textAlign: 'right' }}>{s.val}</span>
                    <span style={{ fontSize: 11, color: '#9CA3AF', minWidth: 30 }}>{stats.total > 0 ? ((s.val / stats.total) * 100).toFixed(0) : 0}%</span>
                  </div>
                ))}
              </div>

              {/* Gender */}
              <div style={{ background: 'white', borderRadius: 14, padding: 20, border: '1px solid #F3F4F6' }}>
                <h3 style={{ fontSize: 14, fontWeight: 700, color: '#0A1628', marginBottom: 14 }}>Jenis Kelamin</h3>
                {Object.keys(genderStats).length === 0 ? (
                  <p style={{ color: '#9CA3AF', fontSize: 13 }}>Belum ada data</p>
                ) : (
                  <div style={{ display: 'flex', gap: 12 }}>
                    {Object.entries(genderStats).map(([gender, count]) => (
                      <div key={gender} style={{ flex: 1, background: gender === 'Laki-laki' ? '#EFF6FF' : '#FDF2F8', borderRadius: 10, padding: '14px 16px', textAlign: 'center' }}>
                        <div style={{ fontSize: 28, marginBottom: 4 }}></div>
                        <div className="font-display" style={{ fontSize: 28, fontWeight: 700, color: gender === 'Laki-laki' ? '#2563EB' : '#DB2777' }}>{count}</div>
                        <div style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>{gender}</div>
                        <div style={{ fontSize: 11, color: '#9CA3AF' }}>{stats.total > 0 ? ((count / stats.total) * 100).toFixed(0) : 0}%</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Tabel Rekap Lengkap */}
          <div style={{ background: 'white', borderRadius: 14, border: '1px solid #F3F4F6', overflow: 'hidden' }}>
            <div style={{ padding: '18px 24px', borderBottom: '1px solid #F3F4F6', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: '#0A1628' }}>Rekapitulasi Seluruh Pendaftar</h3>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <span style={{ fontSize: 12, color: '#9CA3AF' }}>{data.length} total</span>
                <Link href="/admin/pendaftar" style={{ fontSize: 13, color: '#C8973A', fontWeight: 600, textDecoration: 'none' }}>Kelola →</Link>
              </div>
            </div>
            {data.length === 0 ? (
              <div style={{ padding: 48, textAlign: 'center', color: '#9CA3AF', fontSize: 14 }}>Belum ada data pendaftar</div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th style={{ width: 36 }}>#</th>
                      <th>Nama Lengkap</th>
                      <th>Jurusan</th>
                      <th>Asal Sekolah</th>
                      <th>L/P</th>
                      <th>Nilai Tes</th>
                      <th>Nilai Seleksi</th>
                      <th>Status</th>
                      <th>Daftar Ulang</th>
                      <th>Tgl Daftar</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.map((p, i) => {
                      const sc = STATUS_CONFIG[p.status] || STATUS_CONFIG['pending'];
                      return (
                        <tr key={p.id}>
                          <td style={{ color: '#9CA3AF', fontSize: 12 }}>{i + 1}</td>
                          <td style={{ fontWeight: 600, color: '#000000', fontSize: 13 }}>{p.namaLengkap}</td>
                          <td style={{ fontSize: 12, color: '#6B7280' }}>{p.jurusan}</td>
                          <td style={{ fontSize: 12, color: '#6B7280' }}>{p.asalSMP || p.asalSekolah || '-'}</td>
                          <td style={{ textAlign: 'center', fontSize: 12 }}>{p.jenisKelamin === 'Laki-laki' ? 'L' : 'P'}</td>
                          <td style={{ textAlign: 'center', fontWeight: 700, color: p.nilaiTes != null && p.nilaiTes >= 70 ? '#059669' : '#DC2626', fontSize: 14 }}>
                            {p.nilaiTes != null ? p.nilaiTes : '—'}
                          </td>
                          <td style={{ textAlign: 'center', fontWeight: 600, color: '#C8973A', fontSize: 13 }}>
                            {p.nilaiSeleksi != null ? p.nilaiSeleksi : '—'}
                          </td>
                          <td>
                            <span style={{ background: sc.bg, color: sc.color, padding: '3px 9px', borderRadius: 10, fontSize: 11, fontWeight: 700 }}>
                              {sc.label}
                            </span>
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            {p.sudahDaftarUlang
                              ? <span style={{ color: '#059669', fontSize: 13, fontWeight: 700 }}>✓</span>
                              : <span style={{ color: '#D1D5DB', fontSize: 12 }}>—</span>}
                          </td>
                          <td style={{ fontSize: 11, color: '#9CA3AF' }}>{new Date(p.createdAt).toLocaleDateString('id-ID')}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
