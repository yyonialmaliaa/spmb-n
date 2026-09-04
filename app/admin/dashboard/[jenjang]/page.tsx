'use client';
import { useState, useEffect, Suspense } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Users, Clock, CheckCircle, XCircle, ChevronRight, RefreshCw, ClipboardCheck } from 'lucide-react';
import { TopHeader } from '@/components/admin/TopHeader';
import { useAdmin } from '@/components/admin/AdminProvider';
import { PermissionGate } from '@/components/admin/ui';
import { IDENTITAS_PERAN } from '@/lib/permissions';
import { JENJANG_LABEL_FULL, type Jenjang } from '@/lib/labels';

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
  draft:           { label: 'Draft — Belum Dikirim', color: 'var(--adm-text-muted)', bg: '#F3F4F6' },
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
    <Suspense fallback={<div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--adm-text-faint)' }}>Memuat...</div>}>
      <AdminDashboardJenjangInner />
    </Suspense>
  );
}

function AdminDashboardJenjangInner() {
  const params = useParams();
  const searchParams = useSearchParams();
  const jenjangParam = (Array.isArray(params.jenjang) ? params.jenjang[0] : params.jenjang || 'smk').toLowerCase();
  const jenjang: Jenjang = (['smp', 'sma', 'smk'].includes(jenjangParam) ? jenjangParam : 'smk') as Jenjang;
  const tahunAjaranId = searchParams.get('tahunAjaranId') || '';
  const qs = tahunAjaranId ? `&tahunAjaranId=${tahunAjaranId}` : '';

  // Identitas, tahun ajaran, dan penjagaan akses kini datang dari
  // AdminProvider (lihat app/admin/layout.tsx) — tidak ada lagi
  // fetch('/api/auth/me') per halaman.
  const { href, role, can } = useAdmin();
  const identitas = IDENTITAS_PERAN[role];

  const [stats, setStats] = useState<Stats>({ total: 0, verified: 0, diterima: 0, ditolak: 0, daftar_ulang: 0, menungguPembayaran: 0, online: 0, offline: 0 });
  const [recent, setRecent] = useState<Pendaftaran[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Penyaringan jenjang kini di server, bukan lagi menyaring seluruh
    // pendaftar tiga jenjang di browser.
    const qp = new URLSearchParams({ jenjang });
    if (tahunAjaranId) qp.set('tahunAjaranId', tahunAjaranId);
    fetch(`/api/admin/pendaftar?${qp}`).then(r => r.json()).then(d => {
      const rows: Pendaftaran[] = d.data || [];
      setStats(computeStats(rows));
      setRecent(rows.slice(0, 6));
      setLoading(false);
    });
  }, [jenjang, tahunAjaranId]);

  const pct = (val: number) => stats.total > 0 ? Math.round((val / stats.total) * 100) : 0;

  return (
    <>
      <TopHeader
        judul={`Dashboard ${JENJANG_LABEL[jenjang]}`}
        subjudul={`Kelola proses SPMB jenjang ${JENJANG_LABEL_FULL[jenjang]} secara terstruktur dan efisien.`}
        remah={[{ label: `Dashboard ${JENJANG_LABEL[jenjang]}` }]}
        aksi={
          <Link href={href('/admin/pendaftar')} className="adm-btn adm-btn--ghost adm-btn--sm">
            Lihat Pendaftar
          </Link>
        }
      />

      <div className="adm-content">
          {/* Penanda area kerja peran — menegaskan bagian mana dari sistem
              yang menjadi tanggung jawab pengguna ini. */}
          <div
            style={{
              display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap',
              padding: '11px 14px', marginBottom: 18, borderRadius: 'var(--adm-r-md)',
              background: identitas.warnaLembut, borderLeft: `3px solid ${identitas.warna}`,
            }}
          >
            <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.05em', color: identitas.warna }}>
              {identitas.lencana}
            </span>
            <span style={{ fontSize: 12.5, color: 'var(--adm-text-muted)' }}>{identitas.area}</span>
            <span style={{ marginLeft: 'auto', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {can('verifikasi', 'update') && (
                <Link href={href('/admin/verifikasi')} className="adm-btn adm-btn--ghost adm-btn--sm">
                  Antrean Verifikasi
                </Link>
              )}
              {can('pembayaran', 'update') && (
                <Link href={href('/admin/pembayaran')} className="adm-btn adm-btn--ghost adm-btn--sm">
                  Antrean Pembayaran
                </Link>
              )}
              {can('pengguna', 'read') && (
                <Link href="/admin/pengguna" className="adm-btn adm-btn--ghost adm-btn--sm">
                  Pengguna Admin
                </Link>
              )}
            </span>
          </div>

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
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--adm-text)' }}>{card.label}</div>
                    <div style={{ fontSize: 11, color: 'var(--adm-text-faint)' }}>{card.desc}</div>
                  </div>
                  <ChevronRight size={18} color={card.color} />
                </div>
              </Link>
            ))}
            <PermissionGate resource="pendaftar" action="create">
              <Link href={`/admin/pendaftar/tambah?jenjang=${jenjang}${qs}`} style={{ textDecoration: 'none' }}>
                <div style={{ background: 'var(--adm-primary)', borderRadius: 14, padding: '18px 20px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, height: '100%' }}>
                  <span style={{ color: 'var(--adm-secondary)', fontSize: 13, fontWeight: 700 }}>+ Tambah Pendaftar Offline</span>
                </div>
              </Link>
            </PermissionGate>
          </div>

          {/* Kartu disaring per PERAN: Loket Keuangan tidak perlu corong
              verifikasi berkas, dan Front Office tidak dituntun ke antrean
              pembayaran yang bukan wewenangnya. Super Admin melihat semua. */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 16, marginBottom: 28 }}>
            {[
              { label: `Total Pendaftar ${JENJANG_LABEL[jenjang]}`, val: stats.total, color: 'var(--adm-text)', bg: '#F8F9FA', icon: Users, sub: 'Semua pendaftar', tampil: true },
              { label: 'Sedang Diverifikasi', val: stats.verified,  color: '#1E40AF', bg: '#EFF6FF', icon: RefreshCw,       sub: 'Sedang dicek admin', tampil: can('verifikasi', 'read') },
              { label: 'Terima Berkas',    val: stats.diterima,     color: '#059669', bg: '#F0FDF4', icon: CheckCircle,     sub: 'Berkas diterima', tampil: can('verifikasi', 'read') },
              { label: 'Tolak Berkas',     val: stats.ditolak,      color: '#DC2626', bg: '#FFF1F2', icon: XCircle,         sub: 'Perlu revisi', tampil: can('verifikasi', 'read') },
              { label: 'Daftar Ulang ✓',  val: stats.daftar_ulang, color: '#065F46', bg: '#F0FDF4', icon: ClipboardCheck,  sub: 'Sudah daftar ulang', tampil: can('status', 'read') || can('tagihan', 'update') },
              { label: 'Menunggu Bayar',   val: stats.menungguPembayaran || 0, color: '#D97706', bg: '#FFFBEB', icon: Clock, sub: 'Perlu verifikasi bayar', tampil: can('pembayaran', 'read') },
            ].filter(c => c.tampil).map(card => (
              <div key={card.label} style={{ background: 'var(--adm-surface)', borderRadius: 14, padding: '18px 20px', border: '1px solid var(--adm-border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  <div style={{ width: 40, height: 40, background: card.bg, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <card.icon size={20} color={card.color} />
                  </div>
                  <span style={{ fontSize: 11, color: 'var(--adm-text-faint)' }}>{pct(card.val)}%</span>
                </div>
                <div className="font-display" style={{ fontSize: 32, fontWeight: 700, color: card.color, lineHeight: 1 }}>{card.val}</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--adm-text)', marginTop: 5 }}>{card.label}</div>
                <div style={{ fontSize: 11, color: 'var(--adm-text-faint)', marginTop: 2 }}>{card.sub}</div>
              </div>
            ))}
          </div>

          {/* Tabel Pendaftar Terbaru */}
          <div style={{ background: 'var(--adm-surface)', borderRadius: 14, border: '1px solid var(--adm-border)' }}>
            <div style={{ padding: '18px 24px', borderBottom: '1px solid var(--adm-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--adm-text)' }}>Pendaftar {JENJANG_LABEL[jenjang]} Terbaru</h3>
              <Link href={`/admin/pendaftar?jenjang=${jenjang}${qs}`} style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--adm-secondary)', fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>
                Kelola Semua <ChevronRight size={14} />
              </Link>
            </div>
            {loading ? (
              <div style={{ padding: 40, textAlign: 'center', color: 'var(--adm-text-faint)' }}>Memuat...</div>
            ) : recent.length === 0 ? (
              <div style={{ padding: 48, textAlign: 'center', color: 'var(--adm-text-faint)', fontSize: 14 }}>Belum ada pendaftar {JENJANG_LABEL[jenjang]}</div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 640 }}>
                <thead>
                  <tr style={{ background: 'var(--adm-bg)' }}>
                    {['NAMA', 'JURUSAN', 'ASAL SEKOLAH', 'PEMBAYARAN', 'STATUS', 'AKSI'].map(h => (
                      <th key={h} style={{ padding: '11px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: 'var(--adm-text-muted)', borderBottom: '1px solid var(--adm-border)' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {recent.map(p => {
                    const sc = STATUS_CONFIG[p.status] || STATUS_CONFIG['verified'];
                    const jc = getJurusanColor(p.jurusan);
                    return (
                      <tr key={p.id} style={{ borderBottom: '1px solid var(--adm-border)' }}>
                        <td style={{ padding: '12px 16px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div style={{ width: 32, height: 32, borderRadius: '50%', background: `${jc}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: jc, flexShrink: 0 }}>
                              {getInitials(p.namaLengkap)}
                            </div>
                            <div>
                              <div style={{ fontWeight: 600, color: 'var(--adm-text)', fontSize: 13 }}>{p.namaLengkap}</div>
                              <div style={{ fontSize: 11, color: 'var(--adm-text-faint)' }}>{new Date(p.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <span style={{ background: `${jc}15`, color: jc, padding: '3px 8px', borderRadius: 6, fontSize: 11, fontWeight: 700 }}>
                            {jenjang === 'smk' ? getJurusanKode(p.jurusan) : jenjang.toUpperCase()}
                          </span>
                        </td>
                        <td style={{ padding: '12px 16px', fontSize: 13, color: 'var(--adm-text-muted)' }}>{p.asalSMP || p.asalSekolah || '-'}</td>
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
                          <Link href={`/admin/pendaftar?jenjang=${jenjang}${qs}`} style={{ background: 'var(--adm-neutral-weak)', color: 'var(--adm-text)', borderRadius: 6, padding: '5px 12px', fontSize: 12, fontWeight: 600, textDecoration: 'none' }}>
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
      </div>
    </>
  );
}
