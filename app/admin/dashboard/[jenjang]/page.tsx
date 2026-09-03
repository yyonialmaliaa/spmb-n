'use client';
import { useState, useEffect, Suspense } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  GraduationCap, Users, Clock, CheckCircle, XCircle,
  LogOut, LayoutDashboard, BarChart2, User,
  TrendingUp, ChevronRight, ChevronLeft, Award, RefreshCw, ClipboardCheck, Menu, X,
  DollarSign, Tag
} from 'lucide-react';
import Image from 'next/image';

type Stats = {
  total: number; verified: number;
  diterima: number; ditolak: number;
  daftar_ulang: number; menungguPembayaran?: number;
  online: number; offline: number;
};

type Pendaftaran = {
  id: string; namaLengkap: string | null; jurusan: string | null; jenjang?: string; kelas?: string; asalSMP?: string; asalSekolah?: string;
  status: string; createdAt: string; userEmail?: string;
  statusPembayaran?: string; sudahDaftarUlang?: boolean; sumberDaftar?: string;
};

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  draft:           { label: 'Draft — Belum Dikirim', color: '#6B7280', bg: '#F3F4F6' },
  verified:        { label: 'Sedang Diverifikasi', color: '#1E40AF', bg: '#DBEAFE' },
  diterima_berkas: { label: 'Terima Berkas',        color: '#065F46', bg: '#D1FAE5' },
  ditolak:         { label: 'Tolak Berkas',         color: '#991B1B', bg: '#FEE2E2' },
};

const JENJANG_LABEL: Record<string, string> = { smp: 'SMP', sma: 'SMA', smk: 'SMK' };

function getJurusanColor(j?: string | null) {
  const v = j || '';
  const map: Record<string, string> = { PPLG: '#4F46E5', TJKT: '#0891B2', DKV: '#D97706', MPLB: '#059669', BDR: '#DC2626', PH: '#7C3AED' };
  for (const [k, c] of Object.entries(map)) { if (v.toUpperCase().includes(k)) return c; }
  return '#6B7280';
}
function getInitials(name?: string | null) { const n = name || '?'; return n.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase(); }
function getJurusanKode(j?: string | null) {
  const v = j || '';
  for (const k of ['PPLG','TJKT','DKV','MPLB','BDR','PH']) { if (v.toUpperCase().includes(k)) return k; }
  return v ? v.slice(0, 4).toUpperCase() : '-';
}

function computeStats(data: Pendaftaran[]): Stats {
  return {
    total: data.length,
    verified: data.filter(p => p.status === 'verified').length,
    diterima: data.filter(p => p.status === 'diterima_berkas').length,
    ditolak: data.filter(p => p.status === 'ditolak').length,
    daftar_ulang: data.filter(p => p.sudahDaftarUlang).length,
    menungguPembayaran: data.filter(p => p.statusPembayaran === 'menunggu_verifikasi').length,
    online: data.filter(p => (p.sumberDaftar || 'online') === 'online').length,
    offline: data.filter(p => p.sumberDaftar === 'offline').length,
  };
}

export default function AdminDashboardJenjang() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9CA3AF' }}>Memuat...</div>}>
      <AdminDashboardJenjangInner />
    </Suspense>
  );
}

function AdminDashboardJenjangInner() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const jenjangParam = (Array.isArray(params.jenjang) ? params.jenjang[0] : params.jenjang || 'smk').toLowerCase();
  const jenjang: 'smp' | 'sma' | 'smk' = (['smp', 'sma', 'smk'].includes(jenjangParam) ? jenjangParam : 'smk') as any;
  const tahunAjaranId = searchParams.get('tahunAjaranId') || '';
  const qs = tahunAjaranId ? `&tahunAjaranId=${tahunAjaranId}` : '';
  const qsOnly = tahunAjaranId ? `?tahunAjaranId=${tahunAjaranId}` : '';

  const [session, setSession] = useState<{ namaLengkap?: string } | null>(null);
  const [tahunAjaran, setTahunAjaran] = useState<{ id: string; nama: string; aktif: boolean } | null>(null);
  const [stats, setStats] = useState<Stats>({ total: 0, verified: 0, diterima: 0, ditolak: 0, daftar_ulang: 0, menungguPembayaran: 0, online: 0, offline: 0 });
  const [recent, setRecent] = useState<Pendaftaran[]>([]);
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    fetch('/api/auth/me').then(r => r.json()).then(d => {
      if (!d.user || d.user.role !== 'admin') { router.push('/login'); return; }
      setSession(d.user);
    });
    fetch(`/api/admin/pendaftar${qsOnly}`).then(r => r.json()).then(d => {
      const all: Pendaftaran[] = d.data || [];
      const filtered = all.filter(p => (p.jenjang || 'smk') === jenjang);
      setStats(computeStats(filtered));
      setRecent(filtered.slice(0, 6));
      setTahunAjaran(d.tahunAjaran || null);
      setLoading(false);
    });
  }, [router, jenjang, tahunAjaranId]);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/');
  };

  const pct = (val: number) => stats.total > 0 ? Math.round((val / stats.total) * 100) : 0;

  return (
    <div className="admin-shell" style={{ minHeight: '100vh', background: '#F8F9FA', display: 'flex' }}>
      {/* Mobile topbar */}
      <div className="admin-mobile-topbar">
        <button onClick={() => setMobileMenuOpen(true)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
          <Menu size={22} />
        </button>
        <span style={{ color: 'white', fontWeight: 700, fontSize: 13 }}>SMK Citra Negara</span>
        <div style={{ width: 22 }} />
      </div>
      {mobileMenuOpen && <div className="admin-overlay" onClick={() => setMobileMenuOpen(false)} />}

      {/* Sidebar */}
      <aside className={`admin-sidebar${mobileMenuOpen ? ' sidebar-open' : ''}`} style={{ width: 240, background: 'linear-gradient(180deg, #123524 0%, #0B2A1C 100%)', flexShrink: 0, display: 'flex', flexDirection: 'column', position: 'relative' }}>
        <button onClick={() => setMobileMenuOpen(false)} className="sidebar-close-btn" style={{ position: 'absolute', top: 12, right: 12, background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: 8, color: 'white', width: 28, height: 28, alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
          <X size={16} />
        </button>
        <div style={{ padding: '24px 20px 20px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
             <div style={{ width: 38, height: 38, borderRadius: 10, overflow: 'hidden', position: 'relative' }}>
              <Image src="/images/logo.png" alt="Logo SMK Citra Negara" width={38} height={38} style={{ objectFit: 'cover' }} />
            </div>
            <div>
              <div style={{ color: 'white', fontWeight: 700, fontSize: 13 }}>SMK Citra Negara</div>
              <div style={{ color: '#C8973A', fontSize: 10 }}>Admin Panel — {JENJANG_LABEL[jenjang]}</div>
            </div>
          </Link>
        </div>
        <nav style={{ padding: '16px 12px', flex: 1 }}>
          <Link href={`/admin/dashboard${qsOnly}`} className="sidebar-link" style={{ marginBottom: 12, color: 'rgba(255,255,255,0.5)', fontSize: 12 }}>
            <ChevronLeft size={15} /> Semua Jenjang
          </Link>
          <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.3)', letterSpacing: 1, marginBottom: 8, paddingLeft: 14 }}>MENU — {JENJANG_LABEL[jenjang]}</div>
          {[
            { href: `/admin/dashboard/${jenjang}${qsOnly}`, icon: LayoutDashboard, label: 'Dashboard', active: true },
            { href: `/admin/pendaftar?jenjang=${jenjang}${qs}`, icon: Users, label: 'Data Pendaftar' },
            { href: `/admin/harga?jenjang=${jenjang}${qs}`, icon: DollarSign, label: 'Harga' },
            { href: `/admin/diskon?jenjang=${jenjang}${qs}`, icon: Tag, label: 'Diskon' },
            { href: `/admin/laporan?jenjang=${jenjang}${qs}`, icon: BarChart2, label: 'Laporan' },
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
        <header style={{ background: 'white', borderBottom: '1px solid #E5E7EB', padding: '0 32px', minHeight: 90, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div style={{ padding: '16px 0' }}>
            <h1 style={{ fontSize: 18, fontWeight: 700, color: '#0B3B2E', marginBottom: 4 }}>Dashboard {JENJANG_LABEL[jenjang]}</h1>
            <p style={{ fontSize: 12, color: '#6B7280' }}>Statistik dan aktivitas pendaftaran {JENJANG_LABEL[jenjang]}{tahunAjaran ? ` — TA ${tahunAjaran.nama}` : ''}</p>
          </div>
          <div style={{ fontSize: 13, color: '#6B7280' }}>
            {new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </div>
        </header>

        <main style={{ padding: '28px 32px' }}>
          {tahunAjaran && !tahunAjaran.aktif && (
            <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 10, padding: '10px 14px', marginBottom: 20, fontSize: 12, color: '#92400E', fontWeight: 600 }}>
              📅 Sedang melihat data historis tahun ajaran <strong>{tahunAjaran.nama}</strong> (tidak aktif).
            </div>
          )}
          {/* Stats Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 16, marginBottom: 20 }}>
            {[
              { href: `/admin/pendaftar?jenjang=${jenjang}&sumber=online${qs}`,  label: 'Pendaftar Online',  val: stats.online,  color: '#1E40AF', bg: '#EFF6FF', desc: 'Isi formulir sendiri' },
              { href: `/admin/pendaftar?jenjang=${jenjang}&sumber=offline${qs}`, label: 'Pendaftar Offline', val: stats.offline, color: '#C2410C', bg: '#FFF7ED', desc: 'Didaftarkan admin' },
            ].map(card => (
              <Link key={card.label} href={card.href} style={{ textDecoration: 'none' }}>
                <div style={{ background: card.bg, borderRadius: 14, padding: '18px 20px', border: `1px solid ${card.color}22`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div className="font-display" style={{ fontSize: 28, fontWeight: 700, color: card.color }}>{card.val}</div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>{card.label}</div>
                    <div style={{ fontSize: 11, color: '#9CA3AF' }}>{card.desc}</div>
                  </div>
                  <ChevronRight size={18} color={card.color} />
                </div>
              </Link>
            ))}
            <Link href={`/admin/pendaftar/tambah?jenjang=${jenjang}${qs}`} style={{ textDecoration: 'none' }}>
              <div style={{ background: '#0A1628', borderRadius: 14, padding: '18px 20px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, height: '100%' }}>
                <span style={{ color: '#E8B84B', fontSize: 13, fontWeight: 700 }}>+ Tambah Pendaftar Offline</span>
              </div>
            </Link>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 16, marginBottom: 28 }}>
            {[
              { label: `Total Pendaftar ${JENJANG_LABEL[jenjang]}`, val: stats.total, color: '#0A1628', bg: '#F8F9FA', icon: Users, sub: 'Semua pendaftar' },
              { label: 'Sedang Diverifikasi', val: stats.verified,  color: '#1E40AF', bg: '#EFF6FF', icon: RefreshCw,       sub: 'Sedang dicek admin' },
              { label: 'Terima Berkas',    val: stats.diterima,     color: '#059669', bg: '#F0FDF4', icon: CheckCircle,     sub: 'Berkas diterima' },
              { label: 'Tolak Berkas',     val: stats.ditolak,      color: '#DC2626', bg: '#FFF1F2', icon: XCircle,         sub: 'Perlu revisi' },
              { label: 'Daftar Ulang ✓',  val: stats.daftar_ulang, color: '#065F46', bg: '#F0FDF4', icon: ClipboardCheck,  sub: 'Sudah daftar ulang' },
              { label: 'Menunggu Bayar',   val: stats.menungguPembayaran || 0, color: '#D97706', bg: '#FFFBEB', icon: Clock, sub: 'Perlu verifikasi bayar' },
            ].map(card => (
              <div key={card.label} style={{ background: 'white', borderRadius: 14, padding: '18px 20px', border: '1px solid #F3F4F6' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  <div style={{ width: 40, height: 40, background: card.bg, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <card.icon size={20} color={card.color} />
                  </div>
                  <span style={{ fontSize: 11, color: '#9CA3AF' }}>{pct(card.val)}%</span>
                </div>
                <div className="font-display" style={{ fontSize: 32, fontWeight: 700, color: card.color, lineHeight: 1 }}>{card.val}</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#374151', marginTop: 5 }}>{card.label}</div>
                <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 2 }}>{card.sub}</div>
              </div>
            ))}
          </div>

          {/* Tabel Pendaftar Terbaru */}
          <div style={{ background: 'white', borderRadius: 14, border: '1px solid #F3F4F6' }}>
            <div style={{ padding: '18px 24px', borderBottom: '1px solid #F3F4F6', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: '#0A1628' }}>Pendaftar {JENJANG_LABEL[jenjang]} Terbaru</h3>
              <Link href={`/admin/pendaftar?jenjang=${jenjang}${qs}`} style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#C8973A', fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>
                Kelola Semua <ChevronRight size={14} />
              </Link>
            </div>
            {loading ? (
              <div style={{ padding: 40, textAlign: 'center', color: '#9CA3AF' }}>Memuat...</div>
            ) : recent.length === 0 ? (
              <div style={{ padding: 48, textAlign: 'center', color: '#9CA3AF', fontSize: 14 }}>Belum ada pendaftar {JENJANG_LABEL[jenjang]}</div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 640 }}>
                <thead>
                  <tr style={{ background: '#F8F9FA' }}>
                    {['NAMA', 'JURUSAN', 'ASAL SEKOLAH', 'PEMBAYARAN', 'STATUS', 'AKSI'].map(h => (
                      <th key={h} style={{ padding: '11px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#6B7280', borderBottom: '1px solid #E5E7EB' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {recent.map(p => {
                    const sc = STATUS_CONFIG[p.status] || STATUS_CONFIG['verified'];
                    const jc = getJurusanColor(p.jurusan);
                    return (
                      <tr key={p.id} style={{ borderBottom: '1px solid #F3F4F6' }}>
                        <td style={{ padding: '12px 16px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div style={{ width: 32, height: 32, borderRadius: '50%', background: `${jc}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: jc, flexShrink: 0 }}>
                              {getInitials(p.namaLengkap)}
                            </div>
                            <div>
                              <div style={{ fontWeight: 600, color: '#0A1628', fontSize: 13 }}>{p.namaLengkap}</div>
                              <div style={{ fontSize: 11, color: '#9CA3AF' }}>{new Date(p.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <span style={{ background: `${jc}15`, color: jc, padding: '3px 8px', borderRadius: 6, fontSize: 11, fontWeight: 700 }}>
                            {jenjang === 'smk' ? getJurusanKode(p.jurusan) : jenjang.toUpperCase()}
                          </span>
                        </td>
                        <td style={{ padding: '12px 16px', fontSize: 13, color: '#6B7280' }}>{p.asalSMP || p.asalSekolah || '-'}</td>
                        <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                          {(() => {
                            const sb = p.statusPembayaran || 'belum_bayar';
                            const map: Record<string, { l: string; c: string }> = {
                              belum_bayar: { l: 'Belum Bayar', c: '#9CA3AF' },
                              cicilan_berjalan: { l: 'Cicilan Berjalan', c: '#7C3AED' },
                              menunggu_verifikasi: { l: 'Menunggu', c: '#1E40AF' },
                              lunas: { l: 'Lunas', c: '#059669' },
                              ditolak: { l: 'Ditolak', c: '#DC2626' },
                            };
                            return <span style={{ fontWeight: 700, color: map[sb]?.c || '#9CA3AF', fontSize: 12 }}>{map[sb]?.l || sb}</span>;
                          })()}
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <span style={{ background: sc.bg, color: sc.color, padding: '3px 10px', borderRadius: 12, fontSize: 11, fontWeight: 700 }}>{sc.label}</span>
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <Link href={`/admin/pendaftar?jenjang=${jenjang}${qs}`} style={{ background: '#F3F4F6', color: '#374151', borderRadius: 6, padding: '5px 12px', fontSize: 12, fontWeight: 600, textDecoration: 'none' }}>
                            Detail
                          </Link>
                        </td>
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
