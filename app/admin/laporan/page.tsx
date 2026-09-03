'use client';
import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  Users, LayoutDashboard, BarChart2, LogOut, User, Download,
  CheckCircle, XCircle, ClipboardCheck, RefreshCw, Menu, X,
  DollarSign, Tag, AlertTriangle, TrendingUp, TrendingDown, Lightbulb,
  type LucideIcon,
} from 'lucide-react';
import Image from 'next/image';

// =====================================================================
// Laporan Analitik SPMB — SATU jenjang per halaman (jenjang datang dari
// URL ?jenjang=, mengikuti admin yang sedang berada di dashboard jenjang
// tsb — TIDAK ADA pemilih SMP/SMA/SMK di halaman ini, dan TIDAK ADA tabel
// nama pendaftar; itu tugas menu "Pendaftar"). Semua angka dihitung server-
// side lewat lib/laporanSpmb.ts, sudah di-scope ke jenjang + tahun ajaran
// aktif sebelum sampai ke browser — halaman ini murni menampilkan hasilnya.
// =====================================================================

type LaporanData = {
  jenjang: 'smp' | 'sma' | 'smk';
  tahunAjaran: { id: string; nama: string; aktif: boolean };
  generatedAt: string;
  ringkasan: { total: number; sedangDiverifikasi: number; diterima: number; ditolak: number; daftarUlang: number; masihDiproses: number };
  minatJurusan: { label: string; jumlah: number; persen: number; ranking: number }[] | null;
  minatKelas: { label: string; jumlah: number; persen: number; ranking: number }[];
  statusDistribusi: { status: string; label: string; jumlah: number; persen: number }[];
  tren: { periode: string; jumlah: number }[];
  trenInsight: { ramai: { periode: string; jumlah: number } | null; sepi: { periode: string; jumlah: number } | null };
  asalSekolah: { label: string; jumlah: number; ranking: number }[];
  genderKomposisi: { label: string; jumlah: number; persen: number }[];
  pembayaran: { totalTagihan: number; totalDibayar: number; totalRefund: number; totalAlokasi: number; kelebihanBayar: number; lunas: number; cicilan: number; menunggu: number; belumBayar: number; ditolakBayar: number };
  gelombang: { nama: string; jumlah: number; persen: number; verified: number; diterima: number }[];
  evaluasi: string[];
};

const JENJANG_VALID = ['smp', 'sma', 'smk'] as const;
const JENJANG_LABEL: Record<string, string> = { smp: 'SMP', sma: 'SMA', smk: 'SMK' };

function formatRupiah(n: number) {
  return 'Rp' + n.toLocaleString('id-ID');
}

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
  const jenjangValid = (JENJANG_VALID as readonly string[]).includes(jenjangParam);
  const jenjang = jenjangValid ? (jenjangParam as 'smp' | 'sma' | 'smk') : null;
  const tahunAjaranId = searchParams.get('tahunAjaranId') || '';
  const qsOnly = tahunAjaranId ? `?tahunAjaranId=${tahunAjaranId}` : '';
  const qs = tahunAjaranId ? `&tahunAjaranId=${tahunAjaranId}` : '';

  const [session, setSession] = useState<{ namaLengkap?: string } | null>(null);
  const [laporan, setLaporan] = useState<LaporanData | null>(null);
  const [belumAdaTahunAjaran, setBelumAdaTahunAjaran] = useState(false);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    fetch('/api/auth/me').then(r => r.json()).then(d => {
      if (!d.user || d.user.role !== 'admin') { router.push('/login'); return; }
      setSession(d.user);
    });
  }, [router]);

  useEffect(() => {
    if (!jenjang) return;
    const query = tahunAjaranId ? `&tahunAjaranId=${tahunAjaranId}` : '';
    fetch(`/api/admin/laporan?jenjang=${jenjang}${query}`).then(r => r.json()).then(d => {
      if (!d.data) { setBelumAdaTahunAjaran(true); setLaporan(null); } else { setBelumAdaTahunAjaran(false); setLaporan(d.data); }
      setLoading(false);
    });
  }, [jenjang, tahunAjaranId]);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/');
  };

  const handleExport = async () => {
    if (!jenjang) return;
    setExporting(true);
    setExportError('');
    try {
      const res = await fetch(`/api/admin/laporan/export?jenjang=${jenjang}${qs}`);
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        setExportError(err?.error || 'Gagal membuat file Excel');
        return;
      }
      const blob = await res.blob();
      const disposition = res.headers.get('Content-Disposition') || '';
      const match = disposition.match(/filename="(.+)"/);
      const namaFile = match?.[1] || `Laporan_SPMB_${JENJANG_LABEL[jenjang]}.xlsx`;
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = namaFile;
      a.click();
      URL.revokeObjectURL(a.href);
    } catch {
      setExportError('Terjadi kesalahan jaringan');
    } finally {
      setExporting(false);
    }
  };

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
              <div style={{ color: '#C8973A', fontSize: 10 }}>Admin Panel{jenjang ? ` — ${JENJANG_LABEL[jenjang]}` : ''}</div>
            </div>
          </Link>
        </div>
        <nav style={{ padding: '16px 12px', flex: 1 }}>
          {jenjang && (
            <Link href={`/admin/dashboard/${jenjang}${qsOnly}`} className="sidebar-link" style={{ marginBottom: 12, color: 'rgba(255,255,255,0.5)', fontSize: 12 }}>
              <LayoutDashboard size={15} /> Dashboard {JENJANG_LABEL[jenjang]}
            </Link>
          )}
          {[
            { href: (jenjang ? `/admin/dashboard/${jenjang}` : '/admin/dashboard') + qsOnly, icon: LayoutDashboard, label: 'Dashboard' },
            { href: (jenjang ? `/admin/pendaftar?jenjang=${jenjang}` : '/admin/pendaftar') + (jenjang ? qs : qsOnly), icon: Users, label: 'Data Pendaftar' },
            { href: (jenjang ? `/admin/harga?jenjang=${jenjang}` : '/admin/harga') + (jenjang ? qs : qsOnly), icon: DollarSign, label: 'Harga' },
            { href: (jenjang ? `/admin/diskon?jenjang=${jenjang}` : '/admin/diskon') + (jenjang ? qs : qsOnly), icon: Tag, label: 'Diskon' },
            { href: '/admin/laporan' + (jenjang ? `?jenjang=${jenjang}` + qs : qsOnly), icon: BarChart2, label: 'Laporan', active: true },
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
        <header style={{ background: 'white', borderBottom: '1px solid #E5E7EB', padding: '20px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 style={{ fontSize: 18, fontWeight: 700, color: '#0B3B2E', marginBottom: 6 }}>
              Laporan SPMB {jenjang ? JENJANG_LABEL[jenjang] : ''}
            </h1>
            <p style={{ fontSize: 12, color: '#6B7280' }}>
              {laporan ? `TA ${laporan.tahunAjaran.nama}${!laporan.tahunAjaran.aktif ? ' (tidak aktif)' : ''} · Analisis & evaluasi SPMB` : 'Laporan analitik SPMB per jenjang'}
            </p>
          </div>
          {jenjang && laporan && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
              <button
                onClick={handleExport}
                disabled={exporting}
                style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 18px', background: '#123524', border: 'none', borderRadius: 8, color: '#E8B84B', fontSize: 13, fontWeight: 600, cursor: exporting ? 'not-allowed' : 'pointer', fontFamily: 'inherit', opacity: exporting ? 0.7 : 1 }}
              >
                <Download size={15} />
                {exporting ? 'Menyiapkan...' : 'Export Laporan Excel'}
              </button>
              {exportError && <span style={{ fontSize: 11.5, color: '#DC2626' }}>{exportError}</span>}
            </div>
          )}
        </header>

        <main style={{ padding: '28px 32px' }}>
          {!jenjang ? (
            <PilihJenjangPrompt qsOnly={qsOnly} />
          ) : loading ? (
            <div style={{ padding: 48, textAlign: 'center', color: '#9CA3AF' }}>Memuat laporan...</div>
          ) : belumAdaTahunAjaran ? (
            <TidakAdaTahunAjaran />
          ) : laporan ? (
            <LaporanKonten data={laporan} />
          ) : null}
        </main>
      </div>
    </div>
  );
}

function PilihJenjangPrompt({ qsOnly }: { qsOnly: string }) {
  return (
    <div style={{ background: 'white', borderRadius: 14, border: '1px solid #F3F4F6', padding: 40, textAlign: 'center', maxWidth: 560, margin: '40px auto' }}>
      <BarChart2 size={32} color="#C8973A" style={{ marginBottom: 14 }} />
      <h2 style={{ fontSize: 16, fontWeight: 700, color: '#0B3B2E', marginBottom: 8 }}>Pilih Jenjang Terlebih Dahulu</h2>
      <p style={{ fontSize: 13, color: '#6B7280', marginBottom: 22, lineHeight: 1.6 }}>
        Laporan SPMB selalu ditampilkan per jenjang. Buka Dashboard jenjang yang ingin dilihat, lalu klik menu Laporan dari sana.
      </p>
      <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
        {JENJANG_VALID.map(j => (
          <Link key={j} href={`/admin/dashboard/${j}${qsOnly}`} style={{ padding: '10px 22px', background: '#123524', color: '#E8B84B', borderRadius: 8, fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>
            Dashboard {JENJANG_LABEL[j]}
          </Link>
        ))}
      </div>
    </div>
  );
}

function TidakAdaTahunAjaran() {
  return (
    <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 14, padding: 32, textAlign: 'center', maxWidth: 560, margin: '40px auto' }}>
      <AlertTriangle size={28} color="#B45309" style={{ marginBottom: 12 }} />
      <h2 style={{ fontSize: 15, fontWeight: 700, color: '#92400E', marginBottom: 6 }}>Belum Ada Tahun Ajaran Aktif</h2>
      <p style={{ fontSize: 13, color: '#92400E', lineHeight: 1.6, marginBottom: 18 }}>
        Laporan tidak dapat ditampilkan atau diexport sampai admin mengaktifkan sebuah tahun ajaran.
      </p>
      <Link href="/admin/tahun-ajaran" style={{ padding: '9px 18px', background: '#92400E', color: 'white', borderRadius: 8, fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>
        Atur Tahun Ajaran
      </Link>
    </div>
  );
}

// =====================================================================
// Isi laporan — sengaja berurutan: Ringkasan → Minat → Status → Tren →
// Asal Sekolah → Jenis Kelamin → Pembayaran → Gelombang → Evaluasi.
// =====================================================================
function LaporanKonten({ data }: { data: LaporanData }) {
  const r = data.ringkasan;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 1100 }}>
      {/* Ringkasan SPMB */}
      <Section title="Ringkasan SPMB">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 14 }}>
          <Kpi label="Total Pendaftar" val={r.total} icon={Users} color="#0A1628" bg="#F8F9FA" />
          <Kpi label="Sedang Diverifikasi" val={r.sedangDiverifikasi} icon={RefreshCw} color="#1E40AF" bg="#EFF6FF" />
          <Kpi label="Diterima" val={r.diterima} icon={CheckCircle} color="#059669" bg="#F0FDF4" />
          <Kpi label="Ditolak" val={r.ditolak} icon={XCircle} color="#DC2626" bg="#FFF1F2" />
          <Kpi label="Sudah Daftar Ulang" val={r.daftarUlang} icon={ClipboardCheck} color="#065F46" bg="#F0FDF4" />
          <Kpi label="Masih Diproses" val={r.masihDiproses} icon={AlertTriangle} color="#D97706" bg="#FFFBEB" />
        </div>
      </Section>

      {/* Analisis Minat */}
      {data.jenjang === 'smk' && data.minatJurusan && data.minatJurusan.length > 0 && (
        <Section title="Analisis Minat — Program Keahlian" subtitle="Diurutkan dari yang paling banyak diminati">
          <MinatTable rows={data.minatJurusan} />
          <MinatInsight rows={data.minatJurusan} satuan="program keahlian" />
        </Section>
      )}

      {data.minatKelas.length > 0 && (
        <Section title={data.jenjang === 'smk' ? 'Analisis Kelas' : 'Analisis Minat — Kelas'} subtitle="Sebaran pilihan kelas pendaftar">
          <MinatTable rows={data.minatKelas} />
        </Section>
      )}

      {/* Distribusi Status */}
      <Section title="Distribusi Status Pendaftaran">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
          <div>
            <div style={{ height: 14, background: '#F3F4F6', borderRadius: 7, overflow: 'hidden', display: 'flex', marginBottom: 16 }}>
              {data.statusDistribusi.filter(s => s.jumlah > 0).map((s, i) => (
                <div key={i} style={{ width: `${s.persen}%`, background: warnaStatus(s.status), transition: 'width 0.5s' }} />
              ))}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {data.statusDistribusi.map(s => (
                <div key={s.status} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: warnaStatus(s.status), flexShrink: 0 }} />
                  <span style={{ fontSize: 12.5, color: '#374151', flex: 1 }}>{s.label}</span>
                  <span style={{ fontSize: 12.5, fontWeight: 700, color: '#0A1628' }}>{s.jumlah} <span style={{ color: '#9CA3AF', fontWeight: 500 }}>({s.persen}%)</span></span>
                </div>
              ))}
            </div>
          </div>
          {r.total > 0 && (() => {
            const segs = data.statusDistribusi.filter(s => s.jumlah > 0);
            let acc = 0;
            const parts = segs.map(s => {
              const start = (acc / r.total) * 360; acc += s.jumlah; const end = (acc / r.total) * 360;
              return `${warnaStatus(s.status)} ${start}deg ${end}deg`;
            });
            return (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ width: 140, height: 140, borderRadius: '50%', background: `conic-gradient(${parts.join(', ')})`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <div style={{ width: 84, height: 84, borderRadius: '50%', background: 'white', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                    <div className="font-display" style={{ fontSize: 24, fontWeight: 800, color: '#0A1628' }}>{r.total}</div>
                    <div style={{ fontSize: 9, color: '#9CA3AF' }}>Total</div>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      </Section>

      {/* Tren Pendaftaran */}
      <Section title="Tren Pendaftaran">
        {data.tren.length === 0 ? (
          <EmptyNote text="Belum ada data untuk ditampilkan." />
        ) : (
          <>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10, height: 150, padding: '0 4px', overflowX: 'auto' }}>
              {data.tren.map(t => {
                const maxTren = Math.max(...data.tren.map(x => x.jumlah), 1);
                return (
                  <div key={t.periode} style={{ flex: '0 0 auto', minWidth: 40, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', height: '100%' }}>
                    <span style={{ fontSize: 11.5, fontWeight: 700, color: '#0A1628', marginBottom: 6 }}>{t.jumlah > 0 ? t.jumlah : ''}</span>
                    <div style={{ width: '100%', maxWidth: 36, height: `${t.jumlah > 0 ? Math.max((t.jumlah / maxTren) * 100, 6) : 3}%`, background: t.jumlah > 0 ? 'linear-gradient(180deg, #C8973A, #A97B26)' : '#F3F4F6', borderRadius: '6px 6px 2px 2px', transition: 'height 0.5s' }} />
                    <span style={{ fontSize: 10.5, color: '#9CA3AF', marginTop: 8, whiteSpace: 'nowrap' }}>{t.periode}</span>
                  </div>
                );
              })}
            </div>
            <div style={{ display: 'flex', gap: 20, marginTop: 18, flexWrap: 'wrap' }}>
              {data.trenInsight.ramai && (
                <InsightPill icon={TrendingUp} color="#059669" bg="#F0FDF4" text={`Paling ramai: ${data.trenInsight.ramai.periode} (${data.trenInsight.ramai.jumlah} pendaftar)`} />
              )}
              {data.trenInsight.sepi && (
                <InsightPill icon={TrendingDown} color="#B45309" bg="#FFFBEB" text={`Paling sepi: ${data.trenInsight.sepi.periode} (${data.trenInsight.sepi.jumlah} pendaftar)`} />
              )}
            </div>
          </>
        )}
      </Section>

      {/* Asal Sekolah */}
      <Section title="Asal Sekolah Pendaftar" subtitle="10 asal sekolah terbanyak">
        {data.asalSekolah.length === 0 ? (
          <EmptyNote text="Belum ada data asal sekolah." />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {data.asalSekolah.map(a => (
              <div key={a.label} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '9px 4px', borderBottom: '1px solid #F3F4F6' }}>
                <span style={{ width: 22, height: 22, borderRadius: '50%', background: a.ranking <= 3 ? '#FFFBEB' : '#F8F9FA', color: a.ranking <= 3 ? '#B45309' : '#9CA3AF', fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{a.ranking}</span>
                <span style={{ fontSize: 13, color: '#374151', flex: 1 }}>{a.label}</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#0A1628' }}>{a.jumlah}</span>
              </div>
            ))}
          </div>
        )}
      </Section>

      {/* Jenis Kelamin */}
      {data.genderKomposisi.length > 0 && (
        <Section title="Komposisi Jenis Kelamin">
          <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
            {data.genderKomposisi.map(g => (
              <div key={g.label} style={{ flex: 1, minWidth: 130, background: g.label === 'Laki-laki' ? '#EFF6FF' : g.label === 'Perempuan' ? '#FDF2F8' : '#F8F9FA', borderRadius: 12, padding: '16px 18px', textAlign: 'center' }}>
                <div className="font-display" style={{ fontSize: 26, fontWeight: 700, color: g.label === 'Laki-laki' ? '#2563EB' : g.label === 'Perempuan' ? '#DB2777' : '#6B7280' }}>{g.jumlah}</div>
                <div style={{ fontSize: 12, color: '#6B7280', marginTop: 3 }}>{g.label}</div>
                <div style={{ fontSize: 11, color: '#9CA3AF' }}>{g.persen}%</div>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Pembayaran */}
      <Section title="Ringkasan Pembayaran">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 14, marginBottom: 18 }}>
          <Kpi label="Total Tagihan" val={formatRupiah(data.pembayaran.totalTagihan)} icon={DollarSign} color="#0A1628" bg="#F8F9FA" />
          <Kpi label="Total Pembayaran Masuk" val={formatRupiah(data.pembayaran.totalDibayar)} icon={CheckCircle} color="#059669" bg="#F0FDF4" />
          {data.pembayaran.totalRefund > 0 && <Kpi label="Dana Dikembalikan" val={formatRupiah(data.pembayaran.totalRefund)} icon={AlertTriangle} color="#B45309" bg="#FFFBEB" />}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[
            { label: 'Lunas', val: data.pembayaran.lunas, color: '#059669', bg: '#D1FAE5' },
            { label: 'Cicilan Berjalan', val: data.pembayaran.cicilan, color: '#7C3AED', bg: '#F5F3FF' },
            { label: 'Menunggu Verifikasi', val: data.pembayaran.menunggu, color: '#2563EB', bg: '#DBEAFE' },
            { label: 'Belum Bayar', val: data.pembayaran.belumBayar, color: '#9CA3AF', bg: '#F3F4F6' },
          ].map(s => (
            <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ background: s.bg, color: s.color, padding: '2px 8px', borderRadius: 8, fontSize: 10.5, fontWeight: 700, minWidth: 140, textAlign: 'center' }}>{s.label}</span>
              <div style={{ flex: 1, height: 6, background: '#F3F4F6', borderRadius: 3 }}>
                <div style={{ height: '100%', width: `${r.total > 0 ? (s.val / r.total) * 100 : 0}%`, background: s.color, borderRadius: 3 }} />
              </div>
              <span style={{ fontSize: 12.5, fontWeight: 700, color: '#374151', minWidth: 24, textAlign: 'right' }}>{s.val}</span>
            </div>
          ))}
        </div>
      </Section>

      {/* Gelombang */}
      {data.gelombang.length > 0 && (
        <Section title="Performa Gelombang Pendaftaran">
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, minWidth: 480 }}>
              <thead>
                <tr style={{ background: '#F8F9FA' }}>
                  {['Gelombang', 'Pendaftar', 'Persentase', 'Terverifikasi', 'Diterima'].map(h => (
                    <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#6B7280', borderBottom: '1px solid #E5E7EB' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.gelombang.map(g => (
                  <tr key={g.nama} style={{ borderBottom: '1px solid #F3F4F6' }}>
                    <td style={{ padding: '10px 14px', fontWeight: 600, color: '#0A1628' }}>{g.nama}</td>
                    <td style={{ padding: '10px 14px', color: '#374151' }}>{g.jumlah}</td>
                    <td style={{ padding: '10px 14px', color: '#6B7280' }}>{g.persen}%</td>
                    <td style={{ padding: '10px 14px', color: '#1E40AF' }}>{g.verified}</td>
                    <td style={{ padding: '10px 14px', color: '#059669' }}>{g.diterima}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>
      )}

      {/* Ringkasan Evaluasi */}
      <Section title="Ringkasan Evaluasi" subtitle="Insight otomatis berdasarkan data — bukan keputusan, hanya bahan evaluasi sekolah">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {data.evaluasi.map((kalimat, i) => (
            <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', background: '#FAF7F0', borderRadius: 10, padding: '12px 14px' }}>
              <Lightbulb size={15} color="#C8973A" style={{ flexShrink: 0, marginTop: 1 }} />
              <p style={{ fontSize: 13, color: '#374151', lineHeight: 1.6, margin: 0 }}>{kalimat}</p>
            </div>
          ))}
        </div>
      </Section>
    </div>
  );
}

function warnaStatus(status: string) {
  const map: Record<string, string> = { draft: '#9CA3AF', verified: '#2563EB', diterima_berkas: '#059669', ditolak: '#DC2626' };
  return map[status] || '#6B7280';
}

function Section({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div style={{ background: 'white', borderRadius: 14, padding: 24, border: '1px solid #F3F4F6' }}>
      <h3 style={{ fontSize: 15, fontWeight: 700, color: '#0A1628', marginBottom: subtitle ? 3 : 16 }}>{title}</h3>
      {subtitle && <p style={{ fontSize: 12, color: '#9CA3AF', marginBottom: 16 }}>{subtitle}</p>}
      {children}
    </div>
  );
}

function Kpi({ label, val, icon: Icon, color, bg }: { label: string; val: number | string; icon: LucideIcon; color: string; bg: string }) {
  return (
    <div style={{ background: bg, borderRadius: 12, padding: '14px 16px', border: `1px solid ${color}18` }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <Icon size={15} color={color} />
      </div>
      <div className="font-display" style={{ fontSize: 22, fontWeight: 700, color, lineHeight: 1.1 }}>{val}</div>
      <div style={{ fontSize: 11.5, color: '#6B7280', marginTop: 4 }}>{label}</div>
    </div>
  );
}

function MinatTable({ rows }: { rows: { label: string; jumlah: number; persen: number; ranking: number }[] }) {
  const maxVal = Math.max(...rows.map(r => r.jumlah), 1);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {rows.map(row => (
        <div key={row.label}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#0A1628' }}>#{row.ranking} · {row.label}</span>
            <span style={{ fontSize: 12, color: '#6B7280' }}>{row.jumlah} ({row.persen}%)</span>
          </div>
          <div style={{ height: 8, background: '#F3F4F6', borderRadius: 4, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${(row.jumlah / maxVal) * 100}%`, background: 'linear-gradient(90deg, #123524, #C8973A)', borderRadius: 4 }} />
          </div>
        </div>
      ))}
    </div>
  );
}

function MinatInsight({ rows, satuan }: { rows: { label: string; jumlah: number; persen: number }[]; satuan: string }) {
  if (rows.length === 0) return null;
  const terbanyak = rows[0];
  const tersedikit = rows[rows.length - 1];
  return (
    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 18 }}>
      <InsightPill icon={TrendingUp} color="#059669" bg="#F0FDF4" text={`${satuan[0].toUpperCase()}${satuan.slice(1)} paling diminati: ${terbanyak.label} (${terbanyak.jumlah})`} />
      {rows.length > 1 && (
        <InsightPill icon={TrendingDown} color="#B45309" bg="#FFFBEB" text={`Paling sedikit diminati: ${tersedikit.label} (${tersedikit.jumlah})`} />
      )}
    </div>
  );
}

function InsightPill({ icon: Icon, color, bg, text }: { icon: LucideIcon; color: string; bg: string; text: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: bg, color, padding: '8px 14px', borderRadius: 20, fontSize: 12.5, fontWeight: 600 }}>
      <Icon size={14} /> {text}
    </div>
  );
}

function EmptyNote({ text }: { text: string }) {
  return <p style={{ color: '#9CA3AF', fontSize: 13 }}>{text}</p>;
}
