'use client';
import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  GraduationCap, Users, LayoutDashboard, BarChart2,
  LogOut, User, Download, Printer, TrendingUp,
  CheckCircle, XCircle, Clock, Award, RefreshCw, ClipboardCheck, Menu, X,
  DollarSign, Tag
} from 'lucide-react';
import Image from 'next/image';

type Pendaftaran = {
  id: string; namaLengkap: string | null; jurusan: string | null; jenjang?: string; kelas?: string; asalSMP?: string; asalSekolah?: string;
  jenisKelamin: string | null; status: string;
  statusPembayaran?: string;
  sudahDaftarUlang?: boolean; createdAt: string;
};

type Stats = {
  total: number; verified: number;
  diterima: number; ditolak: number; daftar_ulang: number;
};

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  draft:           { label: 'Draft — Belum Dikirim', color: '#6B7280', bg: '#F3F4F6' },
  verified:        { label: 'Sedang Diverifikasi', color: '#1E40AF', bg: '#DBEAFE' },
  diterima_berkas: { label: 'Terima Berkas',        color: '#065F46', bg: '#D1FAE5' },
  ditolak:         { label: 'Tolak Berkas',         color: '#991B1B', bg: '#FEE2E2' },
};

const JURUSAN_LIST = [
  { kode: 'PPLG', color: '#1D4ED8' }, { kode: 'TJKT', color: '#4fcbeb' },
  { kode: 'DKV',  color: '#D97706' }, { kode: 'MPLB', color: '#EAB308' },
  { kode: 'BDR',  color: '#e2c9ad' }, { kode: 'PH',   color: '#16A34A' },
];

export default function AdminLaporan() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9CA3AF' }}>Memuat...</div>}>
      <AdminLaporanInner />
    </Suspense>
  );
}

function AdminLaporanInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const jenjangParam = (searchParams.get('jenjang') || '').toLowerCase();
  const jenjang: 'smp' | 'sma' | 'smk' | '' = (['smp', 'sma', 'smk'].includes(jenjangParam) ? jenjangParam : '') as any;
  const tahunAjaranId = searchParams.get('tahunAjaranId') || '';
  const qs = tahunAjaranId ? `&tahunAjaranId=${tahunAjaranId}` : '';
  const qsOnly = tahunAjaranId ? `?tahunAjaranId=${tahunAjaranId}` : '';
  const [session, setSession] = useState<{ namaLengkap?: string } | null>(null);
  const [tahunAjaran, setTahunAjaran] = useState<{ id: string; nama: string; aktif: boolean } | null>(null);
  const [dataAll, setDataAll] = useState<Pendaftaran[]>([]);
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const data = dataAll.filter(p => !jenjang || (p.jenjang || 'smk') === jenjang);
  const stats: Stats = {
    total: data.length,
    verified: data.filter(p => p.status === 'verified').length,
    diterima: data.filter(p => p.status === 'diterima_berkas').length,
    ditolak: data.filter(p => p.status === 'ditolak').length,
    daftar_ulang: data.filter(p => p.sudahDaftarUlang).length,
  };

  useEffect(() => {
    fetch('/api/auth/me').then(r => r.json()).then(d => {
      if (!d.user || d.user.role !== 'admin') { router.push('/login'); return; }
      setSession(d.user);
    });
    fetch(`/api/admin/pendaftar${qsOnly}`).then(r => r.json()).then(d => {
      setDataAll(d.data || []);
      setTahunAjaran(d.tahunAjaran || null);
      setLoading(false);
    });
  }, [router, tahunAjaranId]);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/');
  };

  const handleExportCSV = () => {
    const headers = ['No', 'Nama', 'Jenjang', 'Jurusan', 'Asal Sekolah', 'Jenis Kelamin', 'Status', 'Status Pembayaran', 'Daftar Ulang', 'Tanggal Daftar'];
    const rows = data.map((p, i) => [
      i + 1, p.namaLengkap, (p.jenjang || 'smk').toUpperCase(), p.jurusan, p.asalSMP || p.asalSekolah || '',
      p.jenisKelamin, p.status,
      p.statusPembayaran || 'belum_bayar',
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
    total:    data.filter(p => (p.jurusan || '').toUpperCase().includes(j.kode)).length,
    diterima: data.filter(p => (p.jurusan || '').toUpperCase().includes(j.kode) && p.status === 'diterima_berkas').length,
    ditolak:  data.filter(p => (p.jurusan || '').toUpperCase().includes(j.kode) && p.status === 'ditolak').length,
    verified: data.filter(p => (p.jurusan || '').toUpperCase().includes(j.kode) && p.status === 'verified').length,
    pct:      data.length > 0 ? Math.round((data.filter(p => (p.jurusan || '').toUpperCase().includes(j.kode)).length / data.length) * 100) : 0,
  })).sort((a, b) => b.total - a.total);

  const maxJurusan = Math.max(...jurusanStats.map(j => j.total), 1);

  // Gender stats
  const genderStats = data.reduce((acc, p) => {
    const k = p.jenisKelamin || 'Lainnya';
    acc[k] = (acc[k] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Tren pendaftar per bulan (11 bulan terakhir)
  const trenBulanan = (() => {
    const bulanList: { key: string; label: string }[] = [];
    const now = new Date();
    for (let i = 10; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      bulanList.push({ key: `${d.getFullYear()}-${d.getMonth()}`, label: d.toLocaleDateString('id-ID', { month: 'short' }) });
    }
    return bulanList.map(b => ({
      ...b,
      count: data.filter(p => { const d = new Date(p.createdAt); return `${d.getFullYear()}-${d.getMonth()}` === b.key; }).length,
    }));
  })();

  // Status pembayaran stats
  const bayarStats = {
    lunas: data.filter(p => p.statusPembayaran === 'lunas').length,
    menunggu: data.filter(p => p.statusPembayaran === 'menunggu_verifikasi').length,
    cicilan: data.filter(p => p.statusPembayaran === 'cicilan_berjalan').length,
    belum: data.filter(p => !p.statusPembayaran || p.statusPembayaran === 'belum_bayar').length,
    ditolak: data.filter(p => p.statusPembayaran === 'ditolak').length,
  };

  const tingkatDiterima = stats.total > 0 ? ((stats.diterima) / stats.total * 100).toFixed(1) : '0';

  return (
    <div className="admin-shell" style={{ minHeight: '100vh', background: '#F8F9FA', display: 'flex' }}>
      {/* Mobile topbar */}
      <div className="admin-mobile-topbar no-print">
        <button onClick={() => setMobileMenuOpen(true)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
          <Menu size={22} />
        </button>
        <span style={{ color: 'white', fontWeight: 700, fontSize: 13 }}>SMK Citra Negara</span>
        <div style={{ width: 22 }} />
      </div>
      {mobileMenuOpen && <div className="admin-overlay" onClick={() => setMobileMenuOpen(false)} />}

      {/* Sidebar */}
      <aside className={`admin-sidebar no-print${mobileMenuOpen ? ' sidebar-open' : ''}`} style={{ width: 240, background: 'linear-gradient(180deg, #123524 0%, #0B2A1C 100%)', flexShrink: 0, display: 'flex', flexDirection: 'column', position: 'relative' }}>
        <button onClick={() => setMobileMenuOpen(false)} className="sidebar-close-btn" style={{ position: 'absolute', top: 12, right: 12, background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: 8, color: 'white', width: 28, height: 28, alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
          <X size={16} />
        </button>
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
            { href: (jenjang ? `/admin/dashboard/${jenjang}` : '/admin/dashboard') + qsOnly, icon: LayoutDashboard, label: 'Dashboard' },
            { href: (jenjang ? `/admin/pendaftar?jenjang=${jenjang}` : '/admin/pendaftar') + (jenjang ? qs : qsOnly), icon: Users, label: 'Data Pendaftar' },
            { href: (jenjang ? `/admin/harga?jenjang=${jenjang}` : '/admin/harga') + (jenjang ? qs : qsOnly), icon: DollarSign, label: 'Harga' },
            { href: (jenjang ? `/admin/diskon?jenjang=${jenjang}` : '/admin/diskon') + (jenjang ? qs : qsOnly), icon: Tag, label: 'Diskon' },
            { href: (jenjang ? `/admin/laporan?jenjang=${jenjang}` : '/admin/laporan') + (jenjang ? qs : qsOnly), icon: BarChart2, label: 'Laporan', active: true },
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
      Laporan SPMB {jenjang ? jenjang.toUpperCase() : ''}
    </h1>

    <p
      style={{
        fontSize: 12,
        color: '#6B7280',
      }}
    >
      Analisis dan rekapitulasi data pendaftaran{tahunAjaran ? ` — TA ${tahunAjaran.nama}` : ''}
    </p>
  </div>

  <div style={{ display: 'flex', gap: 10 }}>
    {jenjang && (
      <a href={`/admin/dashboard/${jenjang}${qsOnly}`} style={{ fontSize: 12, color: '#C8973A', fontWeight: 600, textDecoration: 'none', display: 'flex', alignItems: 'center', padding: '9px 4px' }}>
        ← Dashboard {jenjang.toUpperCase()}
      </a>
    )}
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
{tahunAjaran && !tahunAjaran.aktif && (
  <div style={{ background: '#FFFBEB', borderBottom: '1px solid #FDE68A', padding: '8px 32px', fontSize: 12, color: '#92400E', fontWeight: 600 }}>
    📅 Sedang melihat data historis tahun ajaran <strong>{tahunAjaran.nama}</strong> (tidak aktif).
  </div>
)}

        <main style={{ padding: '28px 32px' }}>
          {/* Print header */}
          <div style={{ display: 'none', textAlign: 'center', marginBottom: 24, borderBottom: '2px solid #C8973A', paddingBottom: 16 }} className="print-only">
            <h2 style={{ fontSize: 20, fontWeight: 800, color: '#0A1628' }}>SMK CITRA NEGARA</h2>
            <p style={{ fontSize: 14, color: '#6B7280' }}>Laporan SPMB Tahun Ajaran 2026/2027</p>
            <p style={{ fontSize: 12, color: '#9CA3AF' }}>Dicetak: {new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
          </div>
          <style>{`@media print { .print-only { display: block !important; } .no-print { display: none !important; } }`}</style>

          {/* Ringkasan */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 16, marginBottom: 24 }}>
            {[
              { label: 'Total Pendaftar',  val: stats.total,        icon: Users,          color: '#0A1628', bg: '#F8F9FA' },
              { label: 'Terima Berkas',    val: stats.diterima,     icon: Award,          color: '#059669', bg: '#F0FDF4' },
              { label: 'Tolak Berkas',     val: stats.ditolak,      icon: XCircle,        color: '#DC2626', bg: '#FFF1F2' },
              { label: 'Tingkat Diterima', val: `${tingkatDiterima}%`, icon: TrendingUp, color: '#C8973A', bg: '#FFFBEB' },
              { label: 'Daftar Ulang ✓',  val: stats.daftar_ulang, icon: ClipboardCheck, color: '#065F46', bg: '#F0FDF4' },
              { label: 'Sudah Bayar Lunas', val: bayarStats.lunas, icon: CheckCircle,   color: '#5B21B6', bg: '#F5F3FF' },
              { label: 'Sedang Diverifikasi', val: stats.verified,  icon: Clock,          color: '#D97706', bg: '#FFFBEB' },
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

          {/* Statistik Pendaftaran Perbulan — grafik garis (dipindah dari Dashboard) */}
          <div style={{ background: 'white', borderRadius: 14, padding: 24, border: '1px solid #F3F4F6', marginBottom: 20 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: '#0A1628', marginBottom: 4 }}>Statistik Pendaftaran Perbulan</h3>
            <div className="font-display" style={{ fontSize: 26, fontWeight: 700, color: '#0A1628', marginTop: 10 }}>{stats.total}</div>
            <div style={{ fontSize: 12, color: '#9CA3AF', marginBottom: 16 }}>Total Pendaftar</div>
            {(() => {
              const maxVal = Math.max(...trenBulanan.map(t => t.count), 5);
              const yMax = Math.ceil(maxVal / 5) * 5;
              const w = 900, h = 220, padL = 34, padB = 26, padT = 10;
              const plotW = w - padL - 10, plotH = h - padB - padT;
              const step = trenBulanan.length > 1 ? plotW / (trenBulanan.length - 1) : 0;
              const pts = trenBulanan.map((t, i) => ({
                x: padL + i * step,
                y: padT + plotH - (t.count / yMax) * plotH,
              }));
              let path = pts.length ? `M ${pts[0].x} ${pts[0].y}` : '';
              for (let i = 0; i < pts.length - 1; i++) {
                const midX = (pts[i].x + pts[i + 1].x) / 2;
                path += ` C ${midX} ${pts[i].y}, ${midX} ${pts[i + 1].y}, ${pts[i + 1].x} ${pts[i + 1].y}`;
              }
              const gridLines = [0, 0.25, 0.5, 0.75, 1];
              return (
                <svg viewBox={`0 0 ${w} ${h}`} style={{ width: '100%', height: 'auto' }}>
                  {gridLines.map(g => {
                    const y = padT + plotH - g * plotH;
                    return (
                      <g key={g}>
                        <line x1={padL} y1={y} x2={w - 10} y2={y} stroke="#F0F0F0" strokeWidth={1} />
                        <text x={0} y={y + 4} fontSize={10} fill="#9CA3AF">{Math.round(g * yMax)}</text>
                      </g>
                    );
                  })}
                  {path && <path d={path} fill="none" stroke="#2563EB" strokeWidth={2.5} />}
                  {pts.map((p, i) => (
                    <circle key={i} cx={p.x} cy={p.y} r={4} fill="#2563EB" />
                  ))}
                  {trenBulanan.map((t, i) => (
                    <text key={t.key} x={padL + i * step} y={h - 6} fontSize={11} fill="#6B7280" textAnchor="middle">{t.label}</text>
                  ))}
                </svg>
              );
            })()}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
              <div style={{ width: 22, height: 10, background: '#2563EB', borderRadius: 2 }} />
              <span style={{ fontSize: 11, color: '#6B7280' }}>Total Pendaftar Per Bulan</span>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20, marginBottom: 24 }}>
            {/* Per Jurusan (SMK) */}
            {(!jenjang || jenjang === 'smk') && (
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
                    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 11, color: '#059669' }}>✓ {j.diterima} diterima</span>
                      <span style={{ fontSize: 11, color: '#DC2626' }}>✗ {j.ditolak} ditolak</span>
                      <span style={{ fontSize: 11, color: '#D97706' }}>⏳ {j.verified} diverifikasi</span>
                    </div>
                  </div>
                ))
              )}
            </div>
            )}

            {/* Status — Donut Chart */}
            <div style={{ background: 'white', borderRadius: 14, padding: 22, border: '1px solid #F3F4F6' }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: '#0A1628', marginBottom: 18 }}>Distribusi Status</h3>
              {stats.total === 0 ? (
                <p style={{ color: '#9CA3AF', fontSize: 13 }}>Belum ada data</p>
              ) : (() => {
                const segs = [
                  { label: 'Terima Berkas', val: stats.diterima, color: '#059669' },
                  { label: 'Sedang Diverifikasi', val: stats.verified, color: '#2563EB' },
                  { label: 'Tolak Berkas', val: stats.ditolak, color: '#DC2626' },
                ];
                let acc = 0;
                const gradientParts = segs.filter(s => s.val > 0).map(s => {
                  const start = (acc / stats.total) * 360;
                  acc += s.val;
                  const end = (acc / stats.total) * 360;
                  return `${s.color} ${start}deg ${end}deg`;
                });
                return (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap' }}>
                    <div style={{
                      width: 130, height: 130, borderRadius: '50%', flexShrink: 0,
                      background: `conic-gradient(${gradientParts.join(', ')})`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <div style={{ width: 78, height: 78, borderRadius: '50%', background: 'white', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                        <div className="font-display" style={{ fontSize: 22, fontWeight: 800, color: '#0A1628' }}>{stats.total}</div>
                        <div style={{ fontSize: 9, color: '#9CA3AF' }}>Total</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {segs.map(s => (
                        <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{ width: 10, height: 10, borderRadius: '50%', background: s.color, flexShrink: 0 }} />
                          <span style={{ fontSize: 12, color: '#374151' }}>{s.label}: <strong>{s.val}</strong> <span style={{ color: '#9CA3AF' }}>({stats.total > 0 ? Math.round((s.val / stats.total) * 100) : 0}%)</span></span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Pembayaran */}
            <div style={{ background: 'white', borderRadius: 14, padding: 22, border: '1px solid #F3F4F6' }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: '#0A1628', marginBottom: 18 }}>Status Pembayaran</h3>
              {[
                { label: 'Lunas', val: bayarStats.lunas, color: '#059669', bg: '#D1FAE5' },
                { label: 'Cicilan Berjalan', val: bayarStats.cicilan, color: '#7C3AED', bg: '#F5F3FF' },
                { label: 'Menunggu Verifikasi', val: bayarStats.menunggu, color: '#2563EB', bg: '#DBEAFE' },
                { label: 'Belum Bayar', val: bayarStats.belum, color: '#9CA3AF', bg: '#F3F4F6' },
                { label: 'Ditolak', val: bayarStats.ditolak, color: '#DC2626', bg: '#FEE2E2' },
              ].map(s => (
                <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                  <span style={{ background: s.bg, color: s.color, padding: '2px 8px', borderRadius: 8, fontSize: 10, fontWeight: 700, minWidth: 130, textAlign: 'center' }}>{s.label}</span>
                  <div style={{ flex: 1, height: 5, background: '#F3F4F6', borderRadius: 3 }}>
                    <div style={{ height: '100%', width: `${stats.total > 0 ? (s.val / stats.total) * 100 : 0}%`, background: s.color, borderRadius: 3 }} />
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#374151', minWidth: 22, textAlign: 'right' }}>{s.val}</span>
                </div>
              ))}
            </div>

            {/* Gender */}
            <div style={{ background: 'white', borderRadius: 14, padding: 20, border: '1px solid #F3F4F6' }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: '#0A1628', marginBottom: 14 }}>Jenis Kelamin</h3>
              {Object.keys(genderStats).length === 0 ? (
                <p style={{ color: '#9CA3AF', fontSize: 13 }}>Belum ada data</p>
              ) : (
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                  {Object.entries(genderStats).map(([gender, count]) => (
                    <div key={gender} style={{ flex: 1, minWidth: 110, background: gender === 'Laki-laki' ? '#EFF6FF' : '#FDF2F8', borderRadius: 10, padding: '14px 16px', textAlign: 'center' }}>
                      <div className="font-display" style={{ fontSize: 28, fontWeight: 700, color: gender === 'Laki-laki' ? '#2563EB' : '#DB2777' }}>{count}</div>
                      <div style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>{gender}</div>
                      <div style={{ fontSize: 11, color: '#9CA3AF' }}>{stats.total > 0 ? ((count / stats.total) * 100).toFixed(0) : 0}%</div>
                    </div>
                  ))}
                </div>
              )}
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
                      <th>Jenjang</th>
                      <th>Jurusan</th>
                      <th>Asal Sekolah</th>
                      <th>L/P</th>
                      <th>Status Bayar</th>
                      <th>Status</th>
                      <th>Daftar Ulang</th>
                      <th>Tgl Daftar</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.map((p, i) => {
                      const sc = STATUS_CONFIG[p.status] || STATUS_CONFIG['verified'];
                      const bayarLabel: Record<string, string> = { lunas: 'Lunas', menunggu_verifikasi: 'Menunggu', cicilan_berjalan: 'Cicilan Berjalan', belum_bayar: 'Belum Bayar', ditolak: 'Ditolak' };
                      return (
                        <tr key={p.id}>
                          <td style={{ color: '#9CA3AF', fontSize: 12 }}>{i + 1}</td>
                          <td style={{ fontWeight: 600, color: '#000000', fontSize: 13 }}>{p.namaLengkap || '(Belum diisi)'}</td>
                          <td style={{ fontSize: 11, color: '#6B7280', fontWeight: 700 }}>{(p.jenjang || 'smk').toUpperCase()}</td>
                          <td style={{ fontSize: 12, color: '#6B7280' }}>{p.jurusan || '-'}</td>
                          <td style={{ fontSize: 12, color: '#6B7280' }}>{p.asalSMP || p.asalSekolah || '-'}</td>
                          <td style={{ textAlign: 'center', fontSize: 12 }}>{p.jenisKelamin === 'Laki-laki' ? 'L' : p.jenisKelamin === 'Perempuan' ? 'P' : '-'}</td>
                          <td style={{ textAlign: 'center', fontSize: 12, color: '#6B7280' }}>
                            {bayarLabel[p.statusPembayaran || 'belum_bayar'] || p.statusPembayaran}
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
