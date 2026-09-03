'use client';
import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { LayoutDashboard, Users, BarChart2, DollarSign, Tag, LogOut, User, Plus, Trash2, Menu, X } from 'lucide-react';

type Diskon = { id: string; jenis: string; tipeNominal: string; nominal: number; aktif: boolean };
type Session = { namaLengkap?: string };

export default function AdminDiskonPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9CA3AF' }}>Memuat...</div>}>
      <AdminDiskonInner />
    </Suspense>
  );
}

function AdminDiskonInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const jenjang = (['smp', 'sma', 'smk'].includes(searchParams.get('jenjang') || '') ? searchParams.get('jenjang') : 'smp') as 'smp' | 'sma' | 'smk';
  const tahunAjaranId = searchParams.get('tahunAjaranId') || '';
  const qsOnly = tahunAjaranId ? `?tahunAjaranId=${tahunAjaranId}` : '';
  const qsAmp = tahunAjaranId ? `&tahunAjaranId=${tahunAjaranId}` : '';

  const [session, setSession] = useState<Session | null>(null);
  const [tahunAjaran, setTahunAjaran] = useState<{ id: string; nama: string; aktif: boolean } | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [list, setList] = useState<Diskon[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState('');
  const [toast, setToast] = useState('');

  const [jenisBaru, setJenisBaru] = useState('');
  const [tipeBaru, setTipeBaru] = useState<'rupiah' | 'persen'>('rupiah');
  const [nominalBaru, setNominalBaru] = useState('');
  const [adding, setAdding] = useState(false);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 2500); };
  const handleLogout = async () => { await fetch('/api/auth/logout', { method: 'POST' }); router.push('/'); };

  useEffect(() => {
    fetch('/api/auth/me').then(r => r.json()).then(d => {
      if (!d.user || d.user.role !== 'admin') { router.push('/login'); return; }
      setSession(d.user);
    });
  }, [router]);

  const load = () => {
    setLoading(true);
    fetch(`/api/admin/diskon${qsOnly}`).then(r => r.json()).then(d => { setList(d.data || []); setTahunAjaran(d.tahunAjaran || null); setLoading(false); });
  };
  useEffect(() => { load(); }, [tahunAjaranId]);

  const handleFieldChange = (id: string, key: 'jenis' | 'nominal', value: string) => {
    setList(l => l.map(d => d.id === id ? { ...d, [key]: key === 'nominal' ? (parseInt(value.replace(/[^\d]/g, '')) || 0) : value } : d));
  };

  const handleSimpanField = async (d: Diskon, key: 'jenis' | 'nominal') => {
    setSavingId(d.id);
    const res = await fetch(`/api/admin/diskon/${d.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ [key]: d[key] }),
    });
    const body = await res.json();
    if (res.ok) showToast('✅ Disimpan');
    else { showToast(`❌ ${body.error || 'Gagal menyimpan'}`); load(); }
    setSavingId('');
  };

  const handleTipeChange = async (d: Diskon, tipeNominal: 'rupiah' | 'persen') => {
    setSavingId(d.id);
    const res = await fetch(`/api/admin/diskon/${d.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tipeNominal }),
    });
    if (res.ok) { showToast('✅ Disimpan'); load(); }
    setSavingId('');
  };

  const handleToggleAktif = async (d: Diskon) => {
    setSavingId(d.id);
    const res = await fetch(`/api/admin/diskon/${d.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ aktif: !d.aktif }),
    });
    if (res.ok) { showToast('✅ Disimpan'); load(); }
    setSavingId('');
  };

  const handleHapus = async (d: Diskon) => {
    if (!confirm(`Hapus diskon "${d.jenis}"?`)) return;
    setSavingId(d.id);
    const res = await fetch(`/api/admin/diskon/${d.id}`, { method: 'DELETE' });
    if (res.ok) { showToast('✅ Dihapus'); load(); }
    else showToast('❌ Gagal menghapus');
    setSavingId('');
  };

  const handleTambah = async () => {
    if (!jenisBaru.trim()) { showToast('❌ Jenis diskon wajib diisi'); return; }
    const nominal = parseInt(nominalBaru.replace(/[^\d]/g, '')) || 0;
    if (!nominal) { showToast('❌ Nominal diskon wajib diisi'); return; }
    if (tipeBaru === 'persen' && nominal > 100) { showToast('❌ Diskon persen maksimal 100'); return; }

    setAdding(true);
    const res = await fetch('/api/admin/diskon', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jenis: jenisBaru, tipeNominal: tipeBaru, nominal, tahunAjaranId: tahunAjaranId || undefined }),
    });
    const d = await res.json();
    if (res.ok) {
      showToast('✅ Diskon ditambahkan');
      setJenisBaru(''); setNominalBaru(''); setTipeBaru('rupiah');
      load();
    } else {
      showToast(`❌ ${d.error || 'Gagal menambah diskon'}`);
    }
    setAdding(false);
  };

  const inputStyle: React.CSSProperties = { padding: '7px 10px', border: '1px solid #E5E7EB', borderRadius: 8, fontSize: 13, fontFamily: 'inherit' };

  return (
    <div className="admin-shell" style={{ minHeight: '100vh', background: '#F8F9FA', display: 'flex' }}>
      {toast && <div style={{ position: 'fixed', top: 24, right: 24, background: '#0A1628', color: 'white', padding: '12px 20px', borderRadius: 10, fontSize: 13, fontWeight: 600, zIndex: 9999, boxShadow: '0 8px 30px rgba(0,0,0,0.3)' }}>{toast}</div>}

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
              <div style={{ color: '#C8973A', fontSize: 10 }}>Admin Panel</div>
            </div>
          </Link>
        </div>
        <nav style={{ padding: '16px 12px', flex: 1 }}>
          {[
            { href: (jenjang ? `/admin/dashboard/${jenjang}` : '/admin/dashboard') + qsOnly, icon: LayoutDashboard, label: 'Dashboard' },
            { href: `/admin/pendaftar?jenjang=${jenjang}${qsAmp}`, icon: Users, label: 'Data Pendaftar' },
            { href: `/admin/harga?jenjang=${jenjang}${qsAmp}`, icon: DollarSign, label: 'Harga' },
            { href: `/admin/diskon?jenjang=${jenjang}${qsAmp}`, icon: Tag, label: 'Diskon', active: true },
            { href: `/admin/laporan?jenjang=${jenjang}${qsAmp}`, icon: BarChart2, label: 'Laporan' },
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
        <header style={{ background: 'white', borderBottom: '1px solid #E5E7EB', padding: '16px 28px' }}>
          <h1 style={{ fontSize: 18, fontWeight: 700, color: '#0B3B2E', marginBottom: 2 }}>Panel Diskon</h1>
          <p style={{ fontSize: 12, color: '#6B7280' }}>Data jenis diskon yang tersedia{tahunAjaran ? ` — TA ${tahunAjaran.nama}` : ''}</p>
        </header>
        {tahunAjaran && !tahunAjaran.aktif && (
          <div style={{ background: '#FFFBEB', borderBottom: '1px solid #FDE68A', padding: '8px 28px', fontSize: 12, color: '#92400E', fontWeight: 600 }}>
            📅 Sedang melihat data historis tahun ajaran <strong>{tahunAjaran.nama}</strong> (tidak aktif).
          </div>
        )}

        <div style={{ maxWidth: 900, margin: '28px auto', padding: '0 24px', display: 'flex', flexDirection: 'column', gap: 20 }}>
          <p style={{ color: '#6B7280', fontSize: 13, lineHeight: 1.6, margin: 0 }}>
            Diskon yang dibuat di sini <strong>belum langsung berlaku untuk siapa pun</strong> — ini hanya daftar pilihan. Untuk menerapkannya ke pendaftar tertentu, buka halaman <strong>Data Pendaftar → Detail → tab Keuangan</strong>, lalu pilih diskon yang sesuai di sana.
          </p>

          {loading ? (
            <div style={{ textAlign: 'center', padding: 40, color: '#9CA3AF' }}>Memuat...</div>
          ) : (
            <div style={{ background: 'white', borderRadius: 14, border: '1px solid #F3F4F6', overflow: 'hidden' }}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead>
                    <tr style={{ background: '#FAFAFA' }}>
                      <th style={{ textAlign: 'left', padding: '10px 16px', fontWeight: 700, color: '#0A1628' }}>Jenis Diskon</th>
                      <th style={{ textAlign: 'left', padding: '10px 16px', fontWeight: 700, color: '#0A1628' }}>Tipe</th>
                      <th style={{ textAlign: 'left', padding: '10px 16px', fontWeight: 700, color: '#0A1628' }}>Nominal</th>
                      <th style={{ textAlign: 'center', padding: '10px 16px', fontWeight: 700, color: '#0A1628' }}>Aktif</th>
                      <th style={{ padding: '10px 16px' }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {list.length === 0 && (
                      <tr><td colSpan={5} style={{ padding: 24, textAlign: 'center', color: '#9CA3AF' }}>Belum ada jenis diskon.</td></tr>
                    )}
                    {list.map(d => (
                      <tr key={d.id} style={{ borderTop: '1px solid #F3F4F6', opacity: d.aktif ? 1 : 0.5 }}>
                        <td style={{ padding: '8px 16px' }}>
                          <input
                            value={d.jenis} onChange={e => handleFieldChange(d.id, 'jenis', e.target.value)}
                            onBlur={() => handleSimpanField(d, 'jenis')}
                            style={{ ...inputStyle, width: '100%', minWidth: 200 }}
                          />
                        </td>
                        <td style={{ padding: '8px 16px' }}>
                          <select value={d.tipeNominal} onChange={e => handleTipeChange(d, e.target.value as 'rupiah' | 'persen')} style={{ ...inputStyle, minWidth: 100 }}>
                            <option value="rupiah">Rupiah</option>
                            <option value="persen">Persen</option>
                          </select>
                        </td>
                        <td style={{ padding: '8px 16px' }}>
                          <input
                            value={d.tipeNominal === 'persen' ? String(d.nominal) : d.nominal.toLocaleString('id-ID')}
                            onChange={e => handleFieldChange(d.id, 'nominal', e.target.value)}
                            onBlur={() => handleSimpanField(d, 'nominal')}
                            inputMode="numeric"
                            style={{ ...inputStyle, width: '100%', minWidth: 120 }}
                          />
                          <span style={{ fontSize: 11, color: '#9CA3AF', marginLeft: 6 }}>{d.tipeNominal === 'persen' ? '%' : ''}</span>
                        </td>
                        <td style={{ padding: '8px 16px', textAlign: 'center' }}>
                          <input type="checkbox" checked={d.aktif} onChange={() => handleToggleAktif(d)} disabled={savingId === d.id} style={{ width: 18, height: 18, accentColor: '#C8973A', cursor: 'pointer' }} />
                        </td>
                        <td style={{ padding: '8px 16px' }}>
                          <button onClick={() => handleHapus(d)} disabled={savingId === d.id} title="Hapus" style={{ padding: 8, background: '#FEF2F2', color: '#DC2626', border: 'none', borderRadius: 8, cursor: 'pointer', display: 'flex', opacity: savingId === d.id ? 0.6 : 1 }}>
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Tambah diskon baru */}
              <div style={{ display: 'flex', gap: 8, padding: 16, borderTop: '1px solid #F3F4F6', flexWrap: 'wrap', background: '#FAFAFA' }}>
                <input value={jenisBaru} onChange={e => setJenisBaru(e.target.value)} placeholder="Jenis diskon, mis. Anak Guru/Yayasan" style={{ ...inputStyle, flex: 2, minWidth: 200 }} />
                <select value={tipeBaru} onChange={e => setTipeBaru(e.target.value as 'rupiah' | 'persen')} style={{ ...inputStyle, minWidth: 100 }}>
                  <option value="rupiah">Rupiah</option>
                  <option value="persen">Persen</option>
                </select>
                <input
                  value={nominalBaru} onChange={e => setNominalBaru(e.target.value.replace(/[^\d]/g, ''))}
                  placeholder={tipeBaru === 'persen' ? 'Contoh: 10' : 'Contoh: 500000'}
                  inputMode="numeric" style={{ ...inputStyle, flex: 1, minWidth: 140 }}
                />
                <button onClick={handleTambah} disabled={adding} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 16px', background: '#0A1628', color: 'white', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', opacity: adding ? 0.6 : 1 }}>
                  <Plus size={14} /> Tambah
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
