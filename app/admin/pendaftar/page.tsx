'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  GraduationCap, Users, LayoutDashboard, BarChart2,
  LogOut, Search, X, Save, User, AlertCircle,
  CheckCircle, XCircle, Download, ChevronLeft, ChevronRight,
  Filter, Calendar, Award, RefreshCw, ClipboardCheck
} from 'lucide-react';
import Image from 'next/image';

type Pendaftaran = {
  id: string; namaLengkap: string; namaPanggilan?: string;
  tempatLahir?: string; tanggalLahir?: string; ttl?: string;
  jenisKelamin: string; agama: string; anakKe?: string;
  alamat: string; rt?: string; rw?: string;
  kelurahan?: string; kecamatan?: string; kabupaten?: string;
  nisn?: string; nik?: string; noPribadi?: string;
  asalSD?: string; asalSMP?: string; asalSekolah?: string;
  jurusan: string;
  namaAyah?: string; pekerjaanAyah?: string; noHpAyah?: string;
  namaIbu?: string; pekerjaanIbu?: string; noHpIbu?: string;
  namaWali?: string; noHpWali?: string;
  namaOrtu?: string; noOrtu?: string;
  status: string; nilaiSeleksi?: number; nilaiTes?: number; catatan?: string;
  alasanPenolakan?: string; jadwalTes?: string; lokasiTes?: string;
  infoTes?: string; pesanPengumuman?: string; revisiCount?: number;
  sudahDaftarUlang?: boolean; tanggalDaftarUlang?: string; catatanDaftarUlang?: string;
  fileIjazah?: string | null; fileAkte?: string | null;
  fileKK?: string | null; fileKtpOrtu?: string | null;
  fileKip?: string | null; fileFoto?: string | null;
  createdAt: string; userEmail?: string;
};

type Stats = {
  total: number; pending: number; verified: number;
  diterima: number; ditolak: number; lulus: number;
  tidak_lulus: number; daftar_ulang: number;
};

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  pending:         { label: 'Menunggu',         color: '#92400E', bg: '#FEF3C7' },
  verified:        { label: 'Diverifikasi',     color: '#1E40AF', bg: '#DBEAFE' },
  diterima_berkas: { label: 'Berkas Diterima',  color: '#065F46', bg: '#D1FAE5' },
  ditolak:         { label: 'Ditolak',          color: '#991B1B', bg: '#FEE2E2' },
  tes:             { label: 'Jadwal Tes',       color: '#5B21B6', bg: '#EDE9FE' },
  lulus:           { label: 'Lulus',            color: '#065F46', bg: '#D1FAE5' },
  tidak_lulus:     { label: 'Tidak Lulus',      color: '#991B1B', bg: '#FEE2E2' },
  daftar_ulang:    { label: 'Daftar Ulang ✓',  color: '#065F46', bg: '#D1FAE5' },
};

const JURUSAN_LIST = [
  { kode: 'PPLG', color: '#1D4ED8' }, { kode: 'TJKT', color: '#4fcbeb' },
  { kode: 'DKV',  color: '#D97706' }, { kode: 'MPLB', color: '#EAB308' },
  { kode: 'PM',   color: '#e2c9ad' }, { kode: 'PH',   color: '#16A34A' },
];

function getInitials(name: string) { return name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase(); }
function getRegNo(id: string, date: string) { const d = new Date(date); return `REG-${d.getFullYear()}-${id.slice(0, 5).toUpperCase()}`; }
function getJurusanKode(j: string) { for (const jj of JURUSAN_LIST) { if (j.toUpperCase().includes(jj.kode)) return jj.kode; } return j.slice(0, 4).toUpperCase(); }
function getJurusanColor(j: string) { for (const jj of JURUSAN_LIST) { if (j.toUpperCase().includes(jj.kode)) return jj.color; } return '#6B7280'; }

const ITEMS_PER_PAGE = 10;

export default function AdminPendaftar() {
  const router = useRouter();
  const [session, setSession] = useState<{ namaLengkap?: string } | null>(null);
  const [data, setData] = useState<Pendaftaran[]>([]);
  const [stats, setStats] = useState<Stats>({ total: 0, pending: 0, verified: 0, diterima: 0, ditolak: 0, lulus: 0, tidak_lulus: 0, daftar_ulang: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterJurusan, setFilterJurusan] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Pendaftaran | null>(null);
  const [editModal, setEditModal] = useState(false);
  const [editForm, setEditForm] = useState({
    status: '', nilaiSeleksi: '', nilaiTes: '', catatan: '',
    alasanPenolakan: '', jadwalTes: '', lokasiTes: '', infoTes: '',
    pesanPengumuman: '', catatanDaftarUlang: '',
  });
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState('');

  useEffect(() => {
    fetch('/api/auth/me').then(r => r.json()).then(d => {
      if (!d.user || d.user.role !== 'admin') { router.push('/login'); return; }
      setSession(d.user);
    });
    loadData();
  }, [router]);

  const loadData = () => {
    setLoading(true);
    fetch('/api/admin/pendaftar').then(r => r.json()).then(d => {
      setData(d.data || []);
      setStats(d.stats || { total: 0, pending: 0, verified: 0, diterima: 0, ditolak: 0, lulus: 0, tidak_lulus: 0, daftar_ulang: 0 });
      setLoading(false);
    });
  };

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  const openEdit = (p: Pendaftaran, defaultStatus?: string) => {
    setSelected(p);
    setEditForm({
      status: defaultStatus || p.status,
      nilaiSeleksi: p.nilaiSeleksi?.toString() || '',
      nilaiTes: p.nilaiTes?.toString() || '',
      catatan: p.catatan || '',
      alasanPenolakan: p.alasanPenolakan || '',
      jadwalTes: p.jadwalTes || '',
      lokasiTes: p.lokasiTes || 'SMK Citra Negara',
      infoTes: p.infoTes || '',
      pesanPengumuman: p.pesanPengumuman || '',
      catatanDaftarUlang: p.catatanDaftarUlang || '',
    });
    setEditModal(true);
  };

  const handleSave = async () => {
    if (!selected) return;
    setSaving(true);
    const res = await fetch(`/api/admin/pendaftar/${selected.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status: editForm.status,
        nilaiSeleksi: editForm.nilaiSeleksi || undefined,
        nilaiTes: editForm.nilaiTes || undefined,
        catatan: editForm.catatan,
        alasanPenolakan: editForm.alasanPenolakan,
        jadwalTes: editForm.jadwalTes,
        lokasiTes: editForm.lokasiTes,
        infoTes: editForm.infoTes,
        pesanPengumuman: editForm.pesanPengumuman,
        catatanDaftarUlang: editForm.catatanDaftarUlang,
      }),
    });
    if (res.ok) { setEditModal(false); setSelected(null); loadData(); showToast('✅ Data berhasil diperbarui'); }
    setSaving(false);
  };

  // Konfirmasi daftar ulang langsung
  const handleKonfirmasiDaftarUlang = async (id: string) => {
    if (!confirm('Konfirmasi bahwa siswa ini sudah melakukan daftar ulang offline?')) return;
    const res = await fetch(`/api/admin/pendaftar/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sudahDaftarUlang: true }),
    });
    if (res.ok) { loadData(); setSelected(null); showToast('✅ Daftar ulang dikonfirmasi'); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Yakin ingin menghapus data ini?')) return;
    const res = await fetch(`/api/admin/pendaftar/${id}`, { method: 'DELETE' });
    if (res.ok) { loadData(); setSelected(null); showToast('🗑 Data dihapus'); }
  };

  const handleLogout = async () => { await fetch('/api/auth/logout', { method: 'POST' }); router.push('/'); };

 

  const filtered = data.filter(p =>
    (!search || p.namaLengkap.toLowerCase().includes(search.toLowerCase()) || (p.userEmail || '').toLowerCase().includes(search.toLowerCase()))
    && (!filterJurusan || p.jurusan.toUpperCase().includes(filterJurusan))
    && (!filterStatus || p.status === filterStatus)
  );
  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const paginated = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);
  const jurusanStats = JURUSAN_LIST.map(j => ({
    ...j,
    count: data.filter(p => p.jurusan.toUpperCase().includes(j.kode)).length,
    pct: data.length > 0 ? Math.round((data.filter(p => p.jurusan.toUpperCase().includes(j.kode)).length / data.length) * 100) : 0,
  })).sort((a, b) => b.count - a.count);

  const inp: React.CSSProperties = { width: '100%', padding: '9px 12px', border: '1.5px solid #D1D5DB', borderRadius: 8, fontSize: 13, fontFamily: 'inherit', background: 'white', outline: 'none' };
  const showAlasan      = editForm.status === 'ditolak';
  const showTesFields   = ['diterima_berkas', 'tes'].includes(editForm.status);
  const showPengumuman  = ['lulus', 'tidak_lulus'].includes(editForm.status);
  const showDaftarUlang = editForm.status === 'daftar_ulang';

  return (
    <div style={{ minHeight: '100vh', background: '#F8F9FA', display: 'flex' }}>
      {toast && <div style={{ position: 'fixed', top: 24, right: 24, background: '#0A1628', color: 'white', padding: '12px 20px', borderRadius: 10, fontSize: 13, fontWeight: 600, zIndex: 9999, boxShadow: '0 8px 30px rgba(0,0,0,0.3)' }}>{toast}</div>}

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
          {[
            { href: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
            { href: '/admin/pendaftar', icon: Users, label: 'Data Pendaftar', active: true },
            { href: '/admin/laporan', icon: BarChart2, label: 'Laporan' },
          ].map(item => (
            <Link key={item.href} href={item.href} className="sidebar-link" style={{ marginBottom: 4, background: item.active ? 'rgba(200,151,58,0.15)' : undefined, color: item.active ? '#C8973A' : undefined }}>
              <item.icon size={17} />{item.label}
            </Link>
          ))}
        </nav>
        <div style={{ padding: '16px 12px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', background: 'rgba(255,255,255,0.05)', borderRadius: 10, marginBottom: 8 }}>
            <div style={{ width: 32, height: 32, background: 'rgba(200,151,58,0.2)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><User size={16} color="#C8973A" /></div>
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
        <header style={{ background: 'white', borderBottom: '1px solid #E5E7EB', padding: '16px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h1 style={{ fontSize: 18, fontWeight: 700, color: '#0B3B2E', marginBottom: 2 }}>Data Pendaftar Siswa Baru</h1>
            <p style={{ fontSize: 12, color: '#6B7280' }}>Kelola pendaftaran siswa — TA 2026/2027</p>
          </div>
          
        </header>

        <main style={{ padding: '24px 28px' }}>
          {/* Stats - 8 kartu */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 24 }}>
            {[
              { label: 'Total',         val: stats.total,        color: '#0A1628' },
              { label: 'Menunggu',      val: stats.pending,      color: '#D97706' },
              { label: 'Lulus',         val: stats.lulus,        color: '#059669' },
              { label: 'Tidak Lulus',   val: stats.tidak_lulus,  color: '#DC2626' },
              { label: 'Berkas Diterima', val: stats.diterima,   color: '#0891B2' },
              { label: 'Ditolak',       val: stats.ditolak,      color: '#991B1B' },
              { label: 'Daftar Ulang ✓', val: stats.daftar_ulang, color: '#065F46' },
              { label: 'Diverifikasi',  val: stats.verified,     color: '#1E40AF' },
            ].map(c => (
              <div key={c.label} style={{ background: 'white', borderRadius: 12, padding: '16px 18px', border: '1px solid #F3F4F6' }}>
                <div className="font-display" style={{ fontSize: 28, fontWeight: 700, color: c.color, lineHeight: 1 }}>{c.val}</div>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#6B7280', marginTop: 5 }}>{c.label}</div>
              </div>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 260px', gap: 20 }}>
            <div>
              {/* Filter */}
              <div style={{ background: 'white', borderRadius: 12, padding: '12px 16px', marginBottom: 14, display: 'flex', gap: 10, alignItems: 'center', border: '1px solid #F3F4F6', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 160 }}>
                  <Search size={14} color="#9CA3AF" />
                  <input placeholder="Cari nama, email..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} style={{ flex: 1, border: 'none', outline: 'none', fontSize: 13, fontFamily: 'inherit', background: 'transparent' }} />
                  {search && <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF' }}><X size={14} /></button>}
                </div>
                <select value={filterJurusan} onChange={e => { setFilterJurusan(e.target.value); setPage(1); }} style={{ border: '1px solid #E5E7EB', borderRadius: 7, padding: '6px 10px', fontSize: 12, fontFamily: 'inherit', outline: 'none' }}>
                  <option value="">Semua Jurusan</option>
                  {JURUSAN_LIST.map(j => <option key={j.kode} value={j.kode}>{j.kode}</option>)}
                </select>
                <select value={filterStatus} onChange={e => { setFilterStatus(e.target.value); setPage(1); }} style={{ border: '1px solid #E5E7EB', borderRadius: 7, padding: '6px 10px', fontSize: 12, fontFamily: 'inherit', outline: 'none' }}>
                  <option value="">Semua Status</option>
                  <option value="pending">Menunggu</option>
                  <option value="verified">Diverifikasi</option>
                  <option value="diterima_berkas">Berkas Diterima</option>
                  <option value="ditolak">Ditolak</option>
                  <option value="tes">Jadwal Tes</option>
                  <option value="lulus">Lulus</option>
                  <option value="tidak_lulus">Tidak Lulus</option>
                  <option value="daftar_ulang">Daftar Ulang</option>
                </select>
                {(filterJurusan || filterStatus) && <button onClick={() => { setFilterJurusan(''); setFilterStatus(''); }} style={{ fontSize: 11, color: '#C8973A', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>Reset</button>}
              </div>

              {/* Table */}
              <div style={{ background: 'white', borderRadius: 14, border: '1px solid #F3F4F6', overflow: 'hidden' }}>
                {loading ? (
                  <div style={{ padding: 60, textAlign: 'center', color: '#9CA3AF' }}>Memuat...</div>
                ) : paginated.length === 0 ? (
                  <div style={{ padding: 60, textAlign: 'center' }}><AlertCircle size={32} color="#E5E7EB" style={{ margin: '0 auto 10px' }} /><p style={{ color: '#9CA3AF' }}>Tidak ada data</p></div>
                ) : (
                  <>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ background: '#F8F9FA', borderBottom: '1px solid #E5E7EB' }}>
                          {['NAMA', 'JURUSAN', 'TGL DAFTAR', 'ASAL SEKOLAH', 'STATUS', 'AKSI'].map(h => (
                            <th key={h} style={{ padding: '11px 14px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#6B7280' }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {paginated.map(p => {
                          const sc = STATUS_CONFIG[p.status] || STATUS_CONFIG['pending'];
                          const jc = getJurusanColor(p.jurusan);
                          return (
                            <tr key={p.id} style={{ borderBottom: '1px solid #F3F4F6' }}
                              onMouseEnter={e => (e.currentTarget.style.background = '#FAFBFC')}
                              onMouseLeave={e => (e.currentTarget.style.background = 'white')}>
                              <td style={{ padding: '11px 14px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                                  <div style={{ width: 32, height: 32, borderRadius: '50%', background: `${jc}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: jc, flexShrink: 0 }}>{getInitials(p.namaLengkap)}</div>
                                  <div>
                                    <div style={{ fontWeight: 600, color: '#0A1628', fontSize: 13 }}>{p.namaLengkap}</div>
                                    <div style={{ fontSize: 10, color: '#9CA3AF' }}>{getRegNo(p.id, p.createdAt)}</div>
                                    {(p.revisiCount || 0) > 0 && <div style={{ fontSize: 9, color: '#EA580C', fontWeight: 600 }}>Revisi {p.revisiCount}x</div>}
                                  </div>
                                </div>
                              </td>
                              <td style={{ padding: '11px 14px' }}>
                                <span style={{ background: `${jc}15`, color: jc, padding: '3px 8px', borderRadius: 6, fontSize: 11, fontWeight: 700 }}>{getJurusanKode(p.jurusan)}</span>
                              </td>
                              <td style={{ padding: '11px 14px', fontSize: 12, color: '#6B7280' }}>{new Date(p.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                              <td style={{ padding: '11px 14px', fontSize: 12, color: '#6B7280', maxWidth: 120 }}>
                                <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.asalSMP || p.asalSekolah || '-'}</div>
                              </td>
                              <td style={{ padding: '11px 14px' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                                  <span style={{ background: sc.bg, color: sc.color, padding: '3px 9px', borderRadius: 12, fontSize: 11, fontWeight: 700, width: 'fit-content' }}>{sc.label}</span>
                                  {p.nilaiTes != null && <span style={{ fontSize: 10, color: '#6B7280' }}>Nilai Tes: <strong>{p.nilaiTes}</strong></span>}
                                </div>
                              </td>
                              <td style={{ padding: '11px 14px' }}>
                                <button onClick={() => { setSelected(p); setEditModal(false); }} style={{ background: '#0A1628', color: 'white', border: 'none', borderRadius: 7, padding: '6px 12px', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>Detail</button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                    <div style={{ padding: '12px 16px', borderTop: '1px solid #F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: 12, color: '#9CA3AF' }}>{filtered.length} pendaftar</span>
                      <div style={{ display: 'flex', gap: 5 }}>
                        <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} style={{ width: 28, height: 28, border: '1px solid #E5E7EB', background: 'white', borderRadius: 6, cursor: page === 1 ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: page === 1 ? 0.4 : 1 }}><ChevronLeft size={14} /></button>
                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => i + 1).map(n => (
                          <button key={n} onClick={() => setPage(n)} style={{ width: 28, height: 28, border: '1px solid', borderColor: page === n ? '#C8973A' : '#E5E7EB', background: page === n ? '#C8973A' : 'white', color: page === n ? '#0A1628' : '#374151', borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: 600, fontFamily: 'inherit' }}>{n}</button>
                        ))}
                        <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} style={{ width: 28, height: 28, border: '1px solid #E5E7EB', background: 'white', borderRadius: 6, cursor: page === totalPages ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: page === totalPages ? 0.4 : 1 }}><ChevronRight size={14} /></button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Right Panel */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ background: 'white', borderRadius: 14, padding: 18, border: '1px solid #F3F4F6' }}>
                <h3 style={{ fontSize: 13, fontWeight: 700, color: '#0A1628', marginBottom: 14 }}>Statistik Jurusan</h3>
                {jurusanStats.map(j => (
                  <div key={j.kode} style={{ marginBottom: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: j.color }}>{j.kode}</span>
                      <span style={{ fontSize: 11, color: '#6B7280' }}>{j.count} ({j.pct}%)</span>
                    </div>
                    <div style={{ height: 5, background: '#F3F4F6', borderRadius: 3 }}>
                      <div style={{ height: '100%', width: `${j.pct}%`, background: j.color, borderRadius: 3 }} />
                    </div>
                  </div>
                ))}
              </div>

              

            </div>
          </div>
        </main>
      </div>

      {/* DETAIL MODAL */}
      {selected && !editModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }} onClick={() => setSelected(null)}>
          <div style={{ background: '#F8F9FA', borderRadius: 20, width: '100%', maxWidth: 820, maxHeight: '90vh', overflow: 'auto' }} onClick={e => e.stopPropagation()}>
            <div style={{ background: 'white', padding: '16px 22px', borderBottom: '1px solid #E5E7EB', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 1, borderRadius: '20px 20px 0 0' }}>
              <div>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: '#0A1628' }}>Detail Pendaftar — {getRegNo(selected.id, selected.createdAt)}</h3>
                <p style={{ fontSize: 11, color: '#9CA3AF' }}>Dashboard › Verifikasi › Detail</p>
              </div>
              <button onClick={() => setSelected(null)} style={{ background: '#F3F4F6', border: 'none', borderRadius: 8, width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><X size={15} /></button>
            </div>

            <div style={{ padding: 18, display: 'grid', gridTemplateColumns: '1fr 240px', gap: 16 }}>
              {/* LEFT */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {/* Profil */}
                <div style={{ background: 'white', borderRadius: 14, padding: 18, border: '1px solid #E5E7EB' }}>
                  <div style={{ display: 'flex', gap: 14, alignItems: 'center', marginBottom: 14 }}>
                    <div style={{ width: 56, height: 56, borderRadius: 12, background: `${getJurusanColor(selected.jurusan)}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 800, color: getJurusanColor(selected.jurusan) }}>{getInitials(selected.namaLengkap)}</div>
                    <div>
                      <div style={{ fontSize: 16, fontWeight: 800, color: '#0A1628' }}>{selected.namaLengkap}</div>
                      <div style={{ fontSize: 12, color: '#6B7280', marginBottom: 2 }}>{selected.jurusan}</div>
                      {selected.userEmail && (
                        <div style={{ fontSize: 11, color: '#6B7280', marginBottom: 7 }}>
                           {selected.userEmail}
                        </div>
                      )}
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        {(() => { const sc = STATUS_CONFIG[selected.status] || STATUS_CONFIG['pending']; return <span style={{ background: sc.bg, color: sc.color, padding: '2px 10px', borderRadius: 10, fontSize: 11, fontWeight: 700 }}>{sc.label}</span>; })()}
                        {(selected.revisiCount || 0) > 0 && <span style={{ fontSize: 11, color: '#EA580C', background: '#FFF7ED', padding: '2px 8px', borderRadius: 10, fontWeight: 600 }}>Revisi {selected.revisiCount}x</span>}
                        {selected.sudahDaftarUlang && <span style={{ fontSize: 11, color: '#065F46', background: '#D1FAE5', padding: '2px 8px', borderRadius: 10, fontWeight: 600 }}>Daftar Ulang ✓</span>}
                      </div>
                    </div>
                  </div>

                  {/* Nilai */}
                  {(selected.nilaiTes != null || selected.nilaiSeleksi != null) && (
                    <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
                      {selected.nilaiTes != null && (
                        <div style={{ flex: 1, background: '#F0FDF4', borderRadius: 10, padding: '10px 14px', textAlign: 'center' }}>
                          <div style={{ fontSize: 10, color: '#6B7280', fontWeight: 600, marginBottom: 3 }}>NILAI TES</div>
                          <div className="font-display" style={{ fontSize: 28, fontWeight: 800, color: '#059669' }}>{selected.nilaiTes}</div>
                        </div>
                      )}
                      {selected.nilaiSeleksi != null && (
                        <div style={{ flex: 1, background: '#FFFBEB', borderRadius: 10, padding: '10px 14px', textAlign: 'center' }}>
                          <div style={{ fontSize: 10, color: '#6B7280', fontWeight: 600, marginBottom: 3 }}>NILAI SELEKSI</div>
                          <div className="font-display" style={{ fontSize: 28, fontWeight: 800, color: '#C8973A' }}>{selected.nilaiSeleksi}</div>
                        </div>
                      )}
                    </div>
                  )}

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                    {[
                      ['TTL', selected.ttl || `${selected.tempatLahir || '-'}, ${selected.tanggalLahir || '-'}`],
                      ['Jenis Kelamin', selected.jenisKelamin], ['Agama', selected.agama],
                      ['NIK', selected.nik || '-'], ['NISN', selected.nisn || '-'],
                      ['No. HP', selected.noPribadi || '-'],
                      ['Alamat', `${selected.alamat}${selected.rt ? `, RT ${selected.rt}/RW ${selected.rw}` : ''}`],
                      ['Kec/Kab', `${selected.kecamatan || '-'}, ${selected.kabupaten || '-'}`],
                    ].map(([l, v]) => (
                      <div key={l} style={{ background: '#FAFAFA', borderRadius: 8, padding: '7px 10px' }}>
                        <div style={{ fontSize: 10, color: '#9CA3AF', fontWeight: 600, marginBottom: 2 }}>{l}</div>
                        <div style={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>{v || '-'}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Akademik */}
                <div style={{ background: 'white', borderRadius: 14, padding: 16, border: '1px solid #E5E7EB' }}>
                  <h4 style={{ fontSize: 13, fontWeight: 700, color: '#0A1628', marginBottom: 10 }}>📚 Data Akademik</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                    {[['Jurusan', selected.jurusan], ['Asal SMP', selected.asalSMP || selected.asalSekolah || '-'], ['Asal SD', selected.asalSD || '-'], ['NISN', selected.nisn || '-']].map(([l, v]) => (
                      <div key={l} style={{ background: '#FAFAFA', borderRadius: 8, padding: '7px 10px' }}>
                        <div style={{ fontSize: 10, color: '#9CA3AF', fontWeight: 600, marginBottom: 2 }}>{l}</div>
                        <div style={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>{v}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Orang Tua */}
                <div style={{ background: 'white', borderRadius: 14, padding: 16, border: '1px solid #E5E7EB' }}>
                  <h4 style={{ fontSize: 13, fontWeight: 700, color: '#0A1628', marginBottom: 10 }}>👨‍👩‍👦 Data Orang Tua</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                    {[['Nama Ayah', selected.namaAyah || selected.namaOrtu || '-'], ['Pekerjaan Ayah', selected.pekerjaanAyah || '-'], ['Nama Ibu', selected.namaIbu || '-'], ['Pekerjaan Ibu', selected.pekerjaanIbu || '-'], ['HP Ortu', selected.noHpAyah || selected.noHpIbu || selected.noOrtu || '-'], ['Nama Wali', selected.namaWali || '-']].map(([l, v]) => (
                      <div key={l} style={{ background: '#FAFAFA', borderRadius: 8, padding: '7px 10px' }}>
                        <div style={{ fontSize: 10, color: '#9CA3AF', fontWeight: 600, marginBottom: 2 }}>{l}</div>
                        <div style={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>{v}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Dokumen */}
                <div style={{ background: 'white', borderRadius: 14, padding: 16, border: '1px solid #E5E7EB' }}>
                  <h4 style={{ fontSize: 13, fontWeight: 700, color: '#0A1628', marginBottom: 10 }}>📎 Dokumen Pendukung</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                    {[
                      { label: 'Ijazah', path: selected.fileIjazah },
                      { label: 'Akte', path: selected.fileAkte },
                      { label: 'Kartu KK', path: selected.fileKK },
                      { label: 'KTP Ortu', path: selected.fileKtpOrtu },
                      { label: 'Kartu KIP', path: selected.fileKip },
                      { label: 'Pas Foto', path: selected.fileFoto },
                    ].map(dok => {
                      const isImg = dok.path && /\.(jpg|jpeg|png)$/i.test(dok.path);
                      return (
                        <div key={dok.label} style={{ background: dok.path ? '#F0FDF4' : '#F8F9FA', borderRadius: 10, padding: 10, textAlign: 'center', border: `1px solid ${dok.path ? '#86EFAC' : '#E5E7EB'}`, cursor: dok.path ? 'pointer' : 'default' }}
                          onClick={() => dok.path && window.open(dok.path, '_blank')}>
                          {isImg ? <img src={dok.path!} alt={dok.label} style={{ width: '100%', height: 52, objectFit: 'cover', borderRadius: 6, marginBottom: 5 }} /> : <div style={{ fontSize: 24, marginBottom: 5 }}>{dok.path ? '📄' : '📂'}</div>}
                          <div style={{ fontSize: 10, fontWeight: 700, color: dok.path ? '#16A34A' : '#6B7280' }}>{dok.label}</div>
                          <div style={{ fontSize: 9, color: dok.path ? '#16A34A' : '#9CA3AF', marginTop: 2 }}>{dok.path ? '✓ Klik lihat' : 'Belum upload'}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Jadwal Tes */}
                {selected.jadwalTes && (
                  <div style={{ background: '#0A1628', borderRadius: 14, padding: 16, color: 'white' }}>
                    <h4 style={{ fontSize: 13, fontWeight: 700, color: '#E8B84B', marginBottom: 10 }}>📅 Jadwal Tes Terkirim</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
                      <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 8, padding: '9px 12px' }}>
                        <div style={{ fontSize: 10, color: '#C8973A', fontWeight: 700, marginBottom: 3 }}>JADWAL</div>
                        <div style={{ fontSize: 12, fontWeight: 600 }}>{selected.jadwalTes}</div>
                      </div>
                      <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 8, padding: '9px 12px' }}>
                        <div style={{ fontSize: 10, color: '#C8973A', fontWeight: 700, marginBottom: 3 }}>LOKASI</div>
                        <div style={{ fontSize: 12, fontWeight: 600 }}>{selected.lokasiTes}</div>
                      </div>
                    </div>
                    {selected.infoTes && <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', margin: 0, whiteSpace: 'pre-line' }}>{selected.infoTes}</p>}
                  </div>
                )}

                {/* Daftar Ulang Info */}
                {selected.sudahDaftarUlang && (
                  <div style={{ background: '#D1FAE5', borderRadius: 14, padding: 16, border: '1px solid #A7F3D0' }}>
                    <h4 style={{ fontSize: 13, fontWeight: 700, color: '#065F46', marginBottom: 8 }}>✅ Daftar Ulang Dikonfirmasi</h4>
                    {selected.tanggalDaftarUlang && <p style={{ fontSize: 12, color: '#065F46', margin: 0 }}>Tanggal: {new Date(selected.tanggalDaftarUlang).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>}
                    {selected.catatanDaftarUlang && <p style={{ fontSize: 12, color: '#047857', marginTop: 6, margin: 0 }}>{selected.catatanDaftarUlang}</p>}
                  </div>
                )}
              </div>

              {/* RIGHT - Panel */}
              <div style={{ position: 'sticky', top: 60, alignSelf: 'flex-start' }}>
                <div style={{ background: 'white', borderRadius: 14, padding: 16, border: '1px solid #E5E7EB' }}>
                  <h4 style={{ fontSize: 13, fontWeight: 700, color: '#0A1628', marginBottom: 12 }}>Panel Verifikasi</h4>

                  {(() => { const sc = STATUS_CONFIG[selected.status] || STATUS_CONFIG['pending']; return (
                    <div style={{ background: sc.bg, borderRadius: 8, padding: '9px 12px', marginBottom: 14 }}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: sc.color, marginBottom: 2 }}>STATUS SAAT INI</div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: sc.color }}>{sc.label}</div>
                    </div>
                  ); })()}

                  <div style={{ fontSize: 11, fontWeight: 700, color: '#374151', marginBottom: 8 }}>UBAH STATUS</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 14 }}>
                    {[
                      { s: 'verified',        label: ' Sedang Diverifikasi', color: '#1E40AF', bg: '#EFF6FF', border: '#BFDBFE' },
                      { s: 'diterima_berkas', label: ' Terima Berkas',       color: '#065F46', bg: '#F0FDF4', border: '#A7F3D0' },
                      { s: 'ditolak',         label: ' Tolak Berkas',        color: '#DC2626', bg: '#FFF1F2', border: '#FECDD3' },
                      { s: 'tes',             label: ' Set Jadwal Tes',      color: '#5B21B6', bg: '#F5F3FF', border: '#DDD6FE' },
                      { s: 'lulus',           label: ' Lulus',               color: '#065F46', bg: '#F0FDF4', border: '#A7F3D0' },
                      { s: 'tidak_lulus',     label: ' Tidak Lulus',         color: '#991B1B', bg: '#FEF2F2', border: '#FECACA' },
                    ].map(btn => (
                      <button key={btn.s} onClick={() => openEdit(selected, btn.s)} style={{ width: '100%', padding: '8px 10px', background: btn.bg, border: `1px solid ${btn.border}`, borderRadius: 8, color: btn.color, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left' }}>
                        {btn.label}
                      </button>
                    ))}

                    {/* Tombol Konfirmasi Daftar Ulang - hanya jika lulus */}
                    {(selected.status === 'lulus' || selected.status === 'daftar_ulang') && (
                      <button
                        onClick={() => selected.sudahDaftarUlang ? null : handleKonfirmasiDaftarUlang(selected.id)}
                        disabled={selected.sudahDaftarUlang}
                        style={{ width: '100%', padding: '8px 10px', background: selected.sudahDaftarUlang ? '#D1FAE5' : '#ECFDF5', border: `1px solid ${selected.sudahDaftarUlang ? '#A7F3D0' : '#6EE7B7'}`, borderRadius: 8, color: '#065F46', fontSize: 12, fontWeight: 700, cursor: selected.sudahDaftarUlang ? 'not-allowed' : 'pointer', fontFamily: 'inherit', textAlign: 'left', opacity: selected.sudahDaftarUlang ? 0.7 : 1 }}>
                        {selected.sudahDaftarUlang ? '✓ Daftar Ulang Sudah Dikonfirmasi' : '📋 Konfirmasi Daftar Ulang Offline'}
                      </button>
                    )}
                  </div>

                  {/* Input Nilai Tes Cepat */}
                  {(selected.status === 'tes' || selected.status === 'lulus' || selected.status === 'tidak_lulus') && (
                    <div style={{ background: '#FFFBEB', borderRadius: 8, padding: 10, border: '1px solid #FDE68A', marginBottom: 12 }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: '#92400E', marginBottom: 6 }}>📊 INPUT NILAI TES</div>
                      <p style={{ fontSize: 11, color: '#92400E', marginBottom: 8 }}>Gunakan tombol Lulus/Tidak Lulus untuk input nilai tes dan pengumuman.</p>
                    </div>
                  )}

                  <button onClick={() => handleDelete(selected.id)} style={{ width: '100%', background: '#FFF1F2', color: '#DC2626', border: '1px solid #FECDD3', borderRadius: 8, padding: '8px', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
                    🗑 Hapus Data
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* EDIT STATUS MODAL */}
      {editModal && selected && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }} onClick={() => setEditModal(false)}>
          <div style={{ background: 'white', borderRadius: 20, width: '100%', maxWidth: 500, maxHeight: '88vh', overflow: 'auto' }} onClick={e => e.stopPropagation()}>
            <div style={{ padding: '18px 22px', borderBottom: '1px solid #F3F4F6', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, background: 'white', zIndex: 1 }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: '#0A1628' }}>Update Status — {selected.namaLengkap}</h3>
              <button onClick={() => setEditModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF' }}><X size={18} /></button>
            </div>
            <div style={{ padding: '18px 22px' }}>

              {/* Status dropdown */}
              <div style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 5 }}>Status *</label>
                <select style={inp} value={editForm.status} onChange={e => setEditForm(f => ({ ...f, status: e.target.value }))}>
                  <option value="pending">Menunggu Verifikasi</option>
                  <option value="verified">Sedang Diverifikasi</option>
                  <option value="diterima_berkas">Berkas Diterima</option>
                  <option value="ditolak">Ditolak</option>
                  <option value="tes">Jadwal Tes</option>
                  <option value="lulus">Lulus</option>
                  <option value="tidak_lulus">Tidak Lulus</option>
                  <option value="daftar_ulang">Daftar Ulang Selesai</option>
                </select>
              </div>

              {/* DITOLAK */}
              {showAlasan && (
                <div style={{ marginBottom: 14, background: '#FFF7ED', borderRadius: 10, padding: 14, border: '1px solid #FED7AA' }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#C2410C', marginBottom: 8 }}>❌ Alasan Penolakan <span style={{ fontWeight: 400 }}>(dikirim ke siswa)</span></div>
                  <textarea style={{ ...inp, minHeight: 80, resize: 'vertical', background: 'white', marginBottom: 8 }} value={editForm.alasanPenolakan} onChange={e => setEditForm(f => ({ ...f, alasanPenolakan: e.target.value }))} placeholder="Contoh: Scan ijazah kurang jelas, mohon upload ulang..." />
                  <textarea style={{ ...inp, minHeight: 60, resize: 'vertical', background: 'white' }} value={editForm.catatan} onChange={e => setEditForm(f => ({ ...f, catatan: e.target.value }))} placeholder="Catatan tambahan (opsional)..." />
                </div>
              )}

              {/* JADWAL TES */}
              {showTesFields && (
                <div style={{ marginBottom: 14, background: '#F5F3FF', borderRadius: 10, padding: 14, border: '1px solid #DDD6FE' }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#5B21B6', marginBottom: 10 }}>📅 Jadwal Tes</div>
                  <div style={{ marginBottom: 8 }}>
                    <label style={{ fontSize: 11, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Tanggal & Waktu *</label>
                    <input style={inp} value={editForm.jadwalTes} onChange={e => setEditForm(f => ({ ...f, jadwalTes: e.target.value }))} placeholder="Senin, 28 Juli 2026 pukul 08.00 WIB" />
                  </div>
                  <div style={{ marginBottom: 8 }}>
                    <label style={{ fontSize: 11, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Lokasi</label>
                    <input style={inp} value={editForm.lokasiTes} onChange={e => setEditForm(f => ({ ...f, lokasiTes: e.target.value }))} placeholder="SMK Citra Negara — Aula Utama" />
                  </div>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Info Tambahan</label>
                    <textarea style={{ ...inp, minHeight: 70, resize: 'vertical' }} value={editForm.infoTes} onChange={e => setEditForm(f => ({ ...f, infoTes: e.target.value }))} placeholder="Harap datang 15 menit sebelum tes. Bawa kartu identitas..." />
                  </div>
                </div>
              )}

              {/* PENGUMUMAN LULUS / TIDAK LULUS */}
              {showPengumuman && (
                <div style={{ marginBottom: 14, background: editForm.status === 'lulus' ? '#F0FDF4' : '#FEF2F2', borderRadius: 10, padding: 14, border: `1px solid ${editForm.status === 'lulus' ? '#A7F3D0' : '#FECACA'}` }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: editForm.status === 'lulus' ? '#065F46' : '#991B1B', marginBottom: 10 }}>
                    {editForm.status === 'lulus' ? '🏆 Pengumuman Kelulusan' : '😔 Pengumuman Tidak Lulus'}
                  </div>

                  {/* Nilai Tes */}
                  <div style={{ marginBottom: 8 }}>
                    <label style={{ fontSize: 11, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Nilai Tes</label>
                    <input type="number" min="0" max="100" step="0.1" style={inp} value={editForm.nilaiTes} onChange={e => setEditForm(f => ({ ...f, nilaiTes: e.target.value }))} placeholder="Contoh: 85.5" />
                  </div>

                  {/* Nilai Seleksi */}
                  <div style={{ marginBottom: 8 }}>
                    <label style={{ fontSize: 11, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Nilai Seleksi Akhir</label>
                    <input type="number" min="0" max="100" step="0.1" style={inp} value={editForm.nilaiSeleksi} onChange={e => setEditForm(f => ({ ...f, nilaiSeleksi: e.target.value }))} placeholder="Contoh: 82.0" />
                  </div>

                  {/* Pesan */}
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Pesan untuk Siswa <span style={{ fontWeight: 400 }}>(tampil di dashboard)</span></label>
                    <textarea style={{ ...inp, minHeight: 80, resize: 'vertical' }} value={editForm.pesanPengumuman} onChange={e => setEditForm(f => ({ ...f, pesanPengumuman: e.target.value }))} placeholder={editForm.status === 'lulus' ? 'Selamat! Silakan datang untuk daftar ulang pada tanggal...' : 'Terima kasih atas partisipasi Anda. Kami berharap...'} />
                  </div>
                </div>
              )}

              {/* DAFTAR ULANG */}
              {showDaftarUlang && (
                <div style={{ marginBottom: 14, background: '#F0FDF4', borderRadius: 10, padding: 14, border: '1px solid #A7F3D0' }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#065F46', marginBottom: 8 }}>📋 Konfirmasi Daftar Ulang</div>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Catatan (opsional)</label>
                    <textarea style={{ ...inp, minHeight: 60, resize: 'vertical' }} value={editForm.catatanDaftarUlang} onChange={e => setEditForm(f => ({ ...f, catatanDaftarUlang: e.target.value }))} placeholder="Catatan daftar ulang..." />
                  </div>
                </div>
              )}

              {/* Catatan Umum */}
              {!showAlasan && !showPengumuman && !showTesFields && !showDaftarUlang && (
                <div style={{ marginBottom: 14 }}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 5 }}>Catatan (opsional)</label>
                  <textarea style={{ ...inp, minHeight: 70, resize: 'vertical' }} value={editForm.catatan} onChange={e => setEditForm(f => ({ ...f, catatan: e.target.value }))} placeholder="Catatan untuk siswa..." />
                </div>
              )}

              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={() => setEditModal(false)} style={{ flex: 1, padding: '11px', border: '1.5px solid #E5E7EB', borderRadius: 8, background: 'transparent', color: '#6B7280', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600, fontSize: 13 }}>Batal</button>
                <button onClick={handleSave} disabled={saving} className="btn-primary" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontSize: 13, opacity: saving ? 0.7 : 1 }}>
                  <Save size={14} /> {saving ? 'Menyimpan...' : 'Simpan & Kirim'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
