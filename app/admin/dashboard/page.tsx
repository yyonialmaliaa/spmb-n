'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  GraduationCap, Users, Clock, CheckCircle, XCircle,
  LogOut, LayoutDashboard, BarChart2, User,
  TrendingUp, ChevronRight, Award, Calendar, RefreshCw, ClipboardCheck
} from 'lucide-react';
import Image from 'next/image';

type Stats = {
  total: number; pending: number; verified: number;
  diterima: number; ditolak: number; lulus: number;
  tidak_lulus: number; daftar_ulang: number;
};

type Pendaftaran = {
  id: string; namaLengkap: string; jurusan: string; asalSMP?: string; asalSekolah?: string;
  status: string; nilaiTes?: number; nilaiSeleksi?: number; createdAt: string; userEmail?: string;
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

function getJurusanColor(j: string) {
  const map: Record<string, string> = { PPLG: '#4F46E5', TJKT: '#0891B2', DKV: '#D97706', MPLB: '#059669', PM: '#DC2626', PH: '#7C3AED' };
  for (const [k, v] of Object.entries(map)) { if (j.toUpperCase().includes(k)) return v; }
  return '#6B7280';
}
function getInitials(name: string) { return name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase(); }
function getJurusanKode(j: string) {
  for (const k of ['PPLG','TJKT','DKV','MPLB','PM','PH']) { if (j.toUpperCase().includes(k)) return k; }
  return j.slice(0, 4).toUpperCase();
}

export default function AdminDashboard() {
  const router = useRouter();
  const [session, setSession] = useState<{ namaLengkap?: string } | null>(null);
  const [stats, setStats] = useState<Stats>({ total: 0, pending: 0, verified: 0, diterima: 0, ditolak: 0, lulus: 0, tidak_lulus: 0, daftar_ulang: 0 });
  const [recent, setRecent] = useState<Pendaftaran[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/auth/me').then(r => r.json()).then(d => {
      if (!d.user || d.user.role !== 'admin') { router.push('/login'); return; }
      setSession(d.user);
    });
    fetch('/api/admin/pendaftar').then(r => r.json()).then(d => {
      if (d.stats) setStats(d.stats);
      if (d.data) setRecent(d.data.slice(0, 6));
      setLoading(false);
    });
  }, [router]);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/');
  };

  const pct = (val: number) => stats.total > 0 ? Math.round((val / stats.total) * 100) : 0;

  return (
    <div style={{ minHeight: '100vh', background: '#F8F9FA', display: 'flex' }}>
      {/* Sidebar */}
      <aside style={{ width: 240, background: 'linear-gradient(180deg, #123524 0%, #0B2A1C 100%)', flexShrink: 0, display: 'flex', flexDirection: 'column' }}>
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
          <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.3)', letterSpacing: 1, marginBottom: 8, paddingLeft: 14 }}>MENU</div>
          {[
            { href: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard', active: true },
            { href: '/admin/pendaftar', icon: Users, label: 'Data Pendaftar' },
            { href: '/admin/laporan', icon: BarChart2, label: 'Laporan' },
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
  style={{
    background: 'white',
    borderBottom: '1px solid #E5E7EB',
    padding: '0 32px',
    height: 90,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  }}
>
  <div>
    <h1
      style={{
        fontSize: 18,
        fontWeight: 700,
        color: '#0B3B2E',
        marginBottom: 4,
      }}
    >
      Dashboard Admin
    </h1>

    <p
      style={{
        fontSize: 12,
        color: '#6B7280',
      }}
    >
      Pantau statistik dan aktivitas pendaftaran — TA 2026/2027
    </p>
  </div>

  <div
    style={{
      fontSize: 13,
      color: '#6B7280',
    }}
  >
    {new Date().toLocaleDateString('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })}
  </div>
</header>

        <main style={{ padding: '28px 32px' }}>
          {/* Stats Grid 8 kartu */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 28 }}>
            {[
              { label: 'Total Pendaftar',  val: stats.total,        color: '#0A1628', bg: '#F8F9FA', icon: Users,           sub: 'Semua pendaftar' },
              { label: 'Menunggu',         val: stats.pending,      color: '#D97706', bg: '#FFFBEB', icon: Clock,           sub: 'Perlu diverifikasi' },
              { label: 'Lulus',            val: stats.lulus,        color: '#059669', bg: '#F0FDF4', icon: Award,           sub: 'Lolos seleksi' },
              { label: 'Tidak Lulus',      val: stats.tidak_lulus,  color: '#DC2626', bg: '#FFF1F2', icon: XCircle,         sub: 'Tidak lolos' },
              { label: 'Berkas Diterima',  val: stats.diterima,     color: '#000000', bg: '#F0F9FF', icon: CheckCircle,     sub: 'Termasuk tes & lulus' },
              { label: 'Ditolak',          val: stats.ditolak,      color: '#991B1B', bg: '#FEF2F2', icon: XCircle,         sub: 'Perlu revisi' },
              { label: 'Daftar Ulang ✓',  val: stats.daftar_ulang, color: '#065F46', bg: '#F0FDF4', icon: ClipboardCheck,  sub: 'Sudah daftar ulang' },
              { label: 'Diverifikasi',     val: stats.verified,     color: '#1E40AF', bg: '#EFF6FF', icon: RefreshCw,       sub: 'Sedang dicek admin' },
            ].map(card => (
              <div key={card.label} style={{ background: 'white', borderRadius: 14, padding: '18px 20px', border: '1px solid #F3F4F6', transition: 'box-shadow 0.2s' }}
                onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.08)')}
                onMouseLeave={e => (e.currentTarget.style.boxShadow = 'none')}>
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

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 20, marginBottom: 24 }}>
            {/* Progress bar distribusi */}
            <div style={{ background: 'white', borderRadius: 14, padding: 24, border: '1px solid #F3F4F6' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: '#0A1628' }}>Distribusi Status Pendaftar</h3>
                <Link href="/admin/pendaftar" style={{ fontSize: 12, color: '#C8973A', fontWeight: 600, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
                  Lihat Semua <ChevronRight size={14} />
                </Link>
              </div>

              {stats.total > 0 ? (
                <>
                  {/* Bar */}
                  <div style={{ height: 14, background: '#F3F4F6', borderRadius: 7, overflow: 'hidden', display: 'flex', marginBottom: 16 }}>
                    {[
                      { val: stats.lulus + stats.daftar_ulang, color: '#047857' },
                      { val: stats.diterima, color: '#1D4ED8' },
                      { val: stats.verified, color: '#6D28D9' },
                      { val: stats.pending, color: '#D97706' },
                      { val: stats.ditolak + stats.tidak_lulus, color: '#B91C1C' },
                    ].filter(b => b.val > 0).map((b, i) => (
                      <div key={i} style={{ width: `${(b.val / stats.total) * 100}%`, background: b.color, transition: 'width 0.6s' }} />
                    ))}
                  </div>

                  {/* Legend */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    {[
                      { label: 'Lulus + Daftar Ulang', val: stats.lulus + stats.daftar_ulang, color: '#047857' },
                      { label: 'Berkas Diterima / Tes', val: stats.diterima, color: '#1D4ED8' },
                      { label: 'Diverifikasi', val: stats.verified, color: '#6D28D9' },
                      { label: 'Menunggu', val: stats.pending, color: '#D97706' },
                      { label: 'Ditolak + Tidak Lulus', val: stats.ditolak + stats.tidak_lulus, color: '#B91C1C' },
                    ].map(item => (
                      <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 10, height: 10, borderRadius: '50%', background: item.color, flexShrink: 0 }} />
                        <span style={{ fontSize: 12, color: '#6B7280' }}>{item.label}: <strong style={{ color: '#374151' }}>{item.val}</strong></span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div style={{ textAlign: 'center', padding: '24px 0', color: '#9CA3AF', fontSize: 13 }}>Belum ada data pendaftar</div>
              )}
            </div>

            {/* Alur SPMB */}
            <div style={{ background: '#122c1f', borderRadius: 14, padding: 22, color: 'white' }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: '#E8B84B', marginBottom: 18 }}>Alur Status SPMB</h3>
              {[
                { s: 'pending',         label: '1. Menunggu Verifikasi',    val: stats.pending },
                { s: 'verified',        label: '2. Sedang Diverifikasi',    val: stats.verified },
                { s: 'diterima_berkas', label: '3. Berkas Diterima',        val: stats.diterima },
                { s: 'ditolak',         label: '↩ Ditolak (bisa revisi)',   val: stats.ditolak },
                { s: 'tes',             label: '4. Jadwal Tes',             val: 0 },
                { s: 'lulus',           label: '5a. Lulus ✓',               val: stats.lulus },
                { s: 'tidak_lulus',     label: '5b. Tidak Lulus ✗',         val: stats.tidak_lulus },
                { s: 'daftar_ulang',    label: '6. Daftar Ulang Selesai',   val: stats.daftar_ulang },
              ].map(item => {
                const sc = STATUS_CONFIG[item.s];
                return (
                  <div key={item.s} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 9 }}>
                    <span style={{ background: sc.bg, color: sc.color, padding: '2px 8px', borderRadius: 8, fontSize: 10, fontWeight: 700, whiteSpace: 'nowrap', minWidth: 90, textAlign: 'center' }}>{sc.label}</span>
                    <div style={{ flex: 1, height: 4, background: 'rgba(255,255,255,0.08)', borderRadius: 2, overflow: 'hidden' }}>
                      {item.val > 0 && stats.total > 0 && <div style={{ height: '100%', width: `${(item.val / stats.total) * 100}%`, background: sc.bg, opacity: 0.8 }} />}
                    </div>
                    <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', minWidth: 24, textAlign: 'right' }}>{item.val}</span>
                  </div>
                );
              })}
              <div style={{ marginTop: 16, paddingTop: 14, borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                <Link href="/admin/laporan" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, background: 'rgba(200,151,58,0.15)', color: '#E8B84B', borderRadius: 8, padding: '9px', fontSize: 12, fontWeight: 600, textDecoration: 'none', border: '1px solid rgba(200,151,58,0.3)' }}>
                  <BarChart2 size={14} /> Lihat Laporan Lengkap
                </Link>
              </div>
            </div>
          </div>

          {/* Tabel Pendaftar Terbaru */}
          <div style={{ background: 'white', borderRadius: 14, border: '1px solid #F3F4F6' }}>
            <div style={{ padding: '18px 24px', borderBottom: '1px solid #F3F4F6', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: '#0A1628' }}>Pendaftar Terbaru</h3>
              <Link href="/admin/pendaftar" style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#C8973A', fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>
                Kelola Semua <ChevronRight size={14} />
              </Link>
            </div>
            {loading ? (
              <div style={{ padding: 40, textAlign: 'center', color: '#9CA3AF' }}>Memuat...</div>
            ) : recent.length === 0 ? (
              <div style={{ padding: 48, textAlign: 'center', color: '#9CA3AF', fontSize: 14 }}>Belum ada pendaftar</div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#F8F9FA' }}>
                    {['NAMA', 'JURUSAN', 'ASAL SEKOLAH', 'NILAI TES', 'STATUS', 'AKSI'].map(h => (
                      <th key={h} style={{ padding: '11px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#6B7280', borderBottom: '1px solid #E5E7EB' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {recent.map(p => {
                    const sc = STATUS_CONFIG[p.status] || STATUS_CONFIG['pending'];
                    const jc = getJurusanColor(p.jurusan);
                    return (
                      <tr key={p.id} style={{ borderBottom: '1px solid #F3F4F6' }}
                        onMouseEnter={e => (e.currentTarget.style.background = '#FAFBFC')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'white')}>
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
                          <span style={{ background: `${jc}15`, color: jc, padding: '3px 8px', borderRadius: 6, fontSize: 11, fontWeight: 700 }}>{getJurusanKode(p.jurusan)}</span>
                        </td>
                        <td style={{ padding: '12px 16px', fontSize: 13, color: '#6B7280' }}>{p.asalSMP || p.asalSekolah || '-'}</td>
                        <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                          {p.nilaiTes != null
                            ? <span style={{ fontWeight: 700, color: p.nilaiTes >= 70 ? '#059669' : '#DC2626', fontSize: 15 }}>{p.nilaiTes}</span>
                            : <span style={{ color: '#E5E7EB', fontSize: 12 }}>—</span>}
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <span style={{ background: sc.bg, color: sc.color, padding: '3px 10px', borderRadius: 12, fontSize: 11, fontWeight: 700 }}>{sc.label}</span>
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <Link href="/admin/pendaftar" style={{ background: '#F3F4F6', color: '#374151', borderRadius: 6, padding: '5px 12px', fontSize: 12, fontWeight: 600, textDecoration: 'none' }}>
                            Detail
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
