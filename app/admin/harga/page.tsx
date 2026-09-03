'use client';
import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { LayoutDashboard, Users, BarChart2, DollarSign, Tag, LogOut, User, Plus, Trash2, Menu, X, ArrowRight } from 'lucide-react';

type HargaRow = { id: string; jenjang: string; jurusan: string; kelas: string; nominal: number; aktif: boolean };
type Pengaturan = { minimalPembayaranAwal: number; minimalCicilan: number };
type Session = { namaLengkap?: string };
type Jenjang = 'smp' | 'sma' | 'smk';

const JENJANG_LABEL: Record<Jenjang, string> = { smp: 'SMP', sma: 'SMA', smk: 'SMK' };

function formatRupiah(n: number): string {
  return 'Rp' + n.toLocaleString('id-ID');
}

export default function AdminHargaPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9CA3AF' }}>Memuat...</div>}>
      <AdminHargaInner />
    </Suspense>
  );
}

function AdminHargaInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const jenjangParam = searchParams.get('jenjang');
  // Jenjang HANYA berasal dari URL — SMP/SMA/SMK masing-masing jadi halaman
  // terkunci sendiri-sendiri, tidak ada tab untuk pindah jenjang di sini.
  // Kalau belum ada jenjang di URL, tampilkan pemilih jenjang dulu.
  const jenjang: Jenjang | null = (['smp', 'sma', 'smk'].includes(jenjangParam || '') ? jenjangParam : null) as Jenjang | null;
  const tahunAjaranId = searchParams.get('tahunAjaranId') || '';
  const qsOnly = tahunAjaranId ? `?tahunAjaranId=${tahunAjaranId}` : '';
  const qsAmp = tahunAjaranId ? `&tahunAjaranId=${tahunAjaranId}` : '';

  const [session, setSession] = useState<Session | null>(null);
  const [tahunAjaran, setTahunAjaran] = useState<{ id: string; nama: string; aktif: boolean } | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [list, setList] = useState<HargaRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState('');
  const [toast, setToast] = useState('');

  const [jurusanBaru, setJurusanBaru] = useState('');
  const [kelasBaru, setKelasBaru] = useState('');
  const [nominalBaru, setNominalBaru] = useState('');
  const [addingHarga, setAddingHarga] = useState(false);

  const [pengaturan, setPengaturan] = useState<Pengaturan>({ minimalPembayaranAwal: 200000, minimalCicilan: 100000 });
  const [savingPengaturan, setSavingPengaturan] = useState(false);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 2500); };
  const handleLogout = async () => { await fetch('/api/auth/logout', { method: 'POST' }); router.push('/'); };

  useEffect(() => {
    fetch('/api/auth/me').then(r => r.json()).then(d => {
      if (!d.user || d.user.role !== 'admin') { router.push('/login'); return; }
      setSession(d.user);
    });
  }, [router]);

  const loadHarga = (j: string) => {
    setLoading(true);
    fetch(`/api/admin/harga?jenjang=${j}${qsAmp}`).then(r => r.json()).then(d => {
      setList(d.data || []);
      setTahunAjaran(d.tahunAjaran || null);
      setLoading(false);
    });
  };
  useEffect(() => { if (jenjang) loadHarga(jenjang); }, [jenjang, tahunAjaranId]);

  useEffect(() => {
    fetch(`/api/admin/pengaturan-keuangan${qsOnly}`).then(r => r.json()).then(d => {
      if (d.data) setPengaturan({ minimalPembayaranAwal: d.data.minimalPembayaranAwal, minimalCicilan: d.data.minimalCicilan });
    });
  }, [tahunAjaranId]);

  const handleSimpanPengaturan = async () => {
    setSavingPengaturan(true);
    const res = await fetch('/api/admin/pengaturan-keuangan', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...pengaturan, tahunAjaranId: tahunAjaranId || undefined }),
    });
    if (res.ok) showToast('✅ Pengaturan pembayaran disimpan');
    else showToast('❌ Gagal menyimpan pengaturan');
    setSavingPengaturan(false);
  };

  const handleFieldChange = (id: string, key: 'jurusan' | 'kelas' | 'nominal', value: string) => {
    setList(l => l.map(h => h.id === id ? { ...h, [key]: key === 'nominal' ? (parseInt(value.replace(/[^\d]/g, '')) || 0) : value } : h));
  };

  const handleSimpanField = async (h: HargaRow, key: 'jurusan' | 'kelas' | 'nominal') => {
    if (!jenjang) return;
    setSavingId(h.id);
    const res = await fetch(`/api/admin/harga/${h.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ [key]: h[key] }),
    });
    const d = await res.json();
    if (res.ok) showToast('✅ Disimpan');
    else { showToast(`❌ ${d.error || 'Gagal menyimpan'}`); loadHarga(jenjang); }
    setSavingId('');
  };

  const handleToggleAktif = async (h: HargaRow) => {
    if (!jenjang) return;
    setSavingId(h.id);
    const res = await fetch(`/api/admin/harga/${h.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ aktif: !h.aktif }),
    });
    if (res.ok) { showToast('✅ Disimpan'); loadHarga(jenjang); }
    setSavingId('');
  };

  const handleHapus = async (h: HargaRow) => {
    if (!jenjang) return;
    if (!confirm(`Hapus harga "${jenjang === 'smk' ? h.jurusan + ' — ' : ''}${h.kelas}"?`)) return;
    setSavingId(h.id);
    const res = await fetch(`/api/admin/harga/${h.id}`, { method: 'DELETE' });
    if (res.ok) { showToast('✅ Dihapus'); loadHarga(jenjang); }
    else showToast('❌ Gagal menghapus');
    setSavingId('');
  };

  const handleTambah = async () => {
    if (!jenjang) return;
    if (!kelasBaru.trim()) { showToast('❌ Nama kelas/program wajib diisi'); return; }
    if (jenjang === 'smk' && !jurusanBaru.trim()) { showToast('❌ Nama jurusan wajib diisi'); return; }
    const nominal = parseInt(nominalBaru.replace(/[^\d]/g, '')) || 0;
    if (!nominal) { showToast('❌ Nominal harga wajib diisi'); return; }

    setAddingHarga(true);
    const res = await fetch('/api/admin/harga', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jenjang, jurusan: jurusanBaru, kelas: kelasBaru, nominal, tahunAjaranId: tahunAjaranId || undefined }),
    });
    const d = await res.json();
    if (res.ok) {
      showToast('✅ Harga ditambahkan');
      setJurusanBaru(''); setKelasBaru(''); setNominalBaru('');
      loadHarga(jenjang);
    } else {
      showToast(`❌ ${d.error || 'Gagal menambah harga'}`);
    }
    setAddingHarga(false);
  };

  const inputStyle: React.CSSProperties = { padding: '7px 10px', border: '1px solid #E5E7EB', borderRadius: 8, fontSize: 13, fontFamily: 'inherit' };

  const sidebarLinks = [
    { href: (jenjang ? `/admin/dashboard/${jenjang}` : '/admin/dashboard') + qsOnly, icon: LayoutDashboard, label: 'Dashboard' },
    { href: (jenjang ? `/admin/pendaftar?jenjang=${jenjang}` : '/admin/pendaftar') + (jenjang ? qsAmp : qsOnly), icon: Users, label: 'Data Pendaftar' },
    { href: `/admin/harga${qsOnly}`, icon: DollarSign, label: 'Harga', active: true },
    { href: (jenjang ? `/admin/diskon?jenjang=${jenjang}` : '/admin/diskon') + (jenjang ? qsAmp : qsOnly), icon: Tag, label: 'Diskon' },
    { href: (jenjang ? `/admin/laporan?jenjang=${jenjang}` : '/admin/laporan') + (jenjang ? qsAmp : qsOnly), icon: BarChart2, label: 'Laporan' },
  ];

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
              <div style={{ color: '#C8973A', fontSize: 10 }}>Admin Panel{jenjang ? ` — ${JENJANG_LABEL[jenjang]}` : ''}</div>
            </div>
          </Link>
        </div>
        <nav style={{ padding: '16px 12px', flex: 1 }}>
          {sidebarLinks.map(item => (
            <Link key={item.label} href={item.href} className="sidebar-link" style={{ marginBottom: 4, background: item.active ? 'rgba(200,151,58,0.15)' : undefined, color: item.active ? '#C8973A' : undefined }}>
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
          <h1 style={{ fontSize: 18, fontWeight: 700, color: '#0B3B2E', marginBottom: 2 }}>Panel Harga{jenjang ? ` — ${JENJANG_LABEL[jenjang]}` : ''}</h1>
          <p style={{ fontSize: 12, color: '#6B7280' }}>Acuan utama harga untuk seluruh sistem keuangan SPMB{tahunAjaran ? ` — TA ${tahunAjaran.nama}` : ''}</p>
        </header>
        {tahunAjaran && !tahunAjaran.aktif && (
          <div style={{ background: '#FFFBEB', borderBottom: '1px solid #FDE68A', padding: '8px 28px', fontSize: 12, color: '#92400E', fontWeight: 600 }}>
            📅 Sedang melihat data historis tahun ajaran <strong>{tahunAjaran.nama}</strong> (tidak aktif).
          </div>
        )}

        {!jenjang ? (
          <div style={{ maxWidth: 900, margin: '40px auto', padding: '0 24px' }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: '#0A1628', marginBottom: 6 }}>Pilih Jenjang</h2>
            <p style={{ fontSize: 13, color: '#6B7280', marginBottom: 24 }}>Harga SMP, SMA, dan SMK dikelola terpisah — pilih salah satu jenjang untuk mulai mengatur.</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14 }}>
              {(['smp', 'sma', 'smk'] as Jenjang[]).map(j => (
                <Link key={j} href={`/admin/harga?jenjang=${j}${qsAmp}`} style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 6, background: '#0A1628', color: 'white', borderRadius: 14, padding: '22px 20px', textDecoration: 'none' }}>
                  <span style={{ fontSize: 22, fontWeight: 800, color: '#E8B84B' }}>{JENJANG_LABEL[j]}</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 700, color: '#E8B84B' }}>Kelola Harga <ArrowRight size={13} /></span>
                </Link>
              ))}
            </div>
          </div>
        ) : (
        <div style={{ maxWidth: 900, margin: '28px auto', padding: '0 24px', display: 'flex', flexDirection: 'column', gap: 28 }}>
          <p style={{ color: '#6B7280', fontSize: 13, lineHeight: 1.6, margin: 0 }}>
            Harga di sini adalah acuan utama untuk seluruh perhitungan keuangan SPMB — total tagihan, cicilan, dan laporan semua mengambil dari sini. Mengubah harga tidak mengubah tagihan pendaftar yang sudah mulai membayar.
          </p>

          {/* Pengaturan minimal pembayaran */}
          <div style={{ background: 'white', borderRadius: 14, padding: 20, border: '1px solid #F3F4F6' }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: '#0A1628', marginBottom: 4 }}>Pengaturan Pembayaran</h3>
            <p style={{ fontSize: 12, color: '#9CA3AF', marginBottom: 14 }}>Berlaku untuk seluruh jenjang pada tahun ajaran aktif.</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14, marginBottom: 14 }}>
              <div>
                <label style={{ fontSize: 12, color: '#374151', fontWeight: 600, display: 'block', marginBottom: 6 }}>Minimal Pembayaran Awal (syarat kirim formulir)</label>
                <input
                  type="text" inputMode="numeric" style={{ ...inputStyle, width: '100%' }}
                  value={pengaturan.minimalPembayaranAwal.toLocaleString('id-ID')}
                  onChange={e => setPengaturan(p => ({ ...p, minimalPembayaranAwal: parseInt(e.target.value.replace(/[^\d]/g, '')) || 0 }))}
                />
              </div>
              <div>
                <label style={{ fontSize: 12, color: '#374151', fontWeight: 600, display: 'block', marginBottom: 6 }}>Minimal Cicilan Berikutnya</label>
                <input
                  type="text" inputMode="numeric" style={{ ...inputStyle, width: '100%' }}
                  value={pengaturan.minimalCicilan.toLocaleString('id-ID')}
                  onChange={e => setPengaturan(p => ({ ...p, minimalCicilan: parseInt(e.target.value.replace(/[^\d]/g, '')) || 0 }))}
                />
              </div>
            </div>
            <button onClick={handleSimpanPengaturan} disabled={savingPengaturan} style={{ padding: '9px 18px', background: '#0A1628', color: 'white', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', opacity: savingPengaturan ? 0.6 : 1 }}>
              {savingPengaturan ? 'Menyimpan...' : 'Simpan Pengaturan'}
            </button>
          </div>

          <div>
            <p style={{ fontSize: 12, color: '#9CA3AF', margin: '0 0 16px' }}>
              {jenjang === 'smk'
                ? 'SMK: harga diatur per jurusan, kelas masuk (Kelas 10/11), dan program (Reguler/Plus).'
                : `${JENJANG_LABEL[jenjang]}: tidak ada jurusan — harga diatur per kelas masuk (Kelas ${jenjang === 'smp' ? '7/8' : '10/11'}) dan program (Reguler/Plus).`}
            </p>

            {loading ? (
              <div style={{ textAlign: 'center', padding: 40, color: '#9CA3AF' }}>Memuat...</div>
            ) : (
              <div style={{ background: 'white', borderRadius: 14, border: '1px solid #F3F4F6', overflow: 'hidden' }}>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                    <thead>
                      <tr style={{ background: '#FAFAFA' }}>
                        {jenjang === 'smk' && <th style={{ textAlign: 'left', padding: '10px 16px', fontWeight: 700, color: '#0A1628' }}>Jurusan</th>}
                        <th style={{ textAlign: 'left', padding: '10px 16px', fontWeight: 700, color: '#0A1628' }}>Kelas / Program</th>
                        <th style={{ textAlign: 'left', padding: '10px 16px', fontWeight: 700, color: '#0A1628' }}>Harga</th>
                        <th style={{ textAlign: 'center', padding: '10px 16px', fontWeight: 700, color: '#0A1628' }}>Aktif</th>
                        <th style={{ padding: '10px 16px' }}></th>
                      </tr>
                    </thead>
                    <tbody>
                      {list.length === 0 && (
                        <tr><td colSpan={jenjang === 'smk' ? 5 : 4} style={{ padding: 24, textAlign: 'center', color: '#9CA3AF' }}>Belum ada harga untuk jenjang ini.</td></tr>
                      )}
                      {list.map(h => (
                        <tr key={h.id} style={{ borderTop: '1px solid #F3F4F6', opacity: h.aktif ? 1 : 0.5 }}>
                          {jenjang === 'smk' && (
                            <td style={{ padding: '8px 16px' }}>
                              <input
                                value={h.jurusan} onChange={e => handleFieldChange(h.id, 'jurusan', e.target.value)}
                                onBlur={() => handleSimpanField(h, 'jurusan')}
                                style={{ ...inputStyle, width: '100%', minWidth: 220 }}
                              />
                            </td>
                          )}
                          <td style={{ padding: '8px 16px' }}>
                            <input
                              value={h.kelas} onChange={e => handleFieldChange(h.id, 'kelas', e.target.value)}
                              onBlur={() => handleSimpanField(h, 'kelas')}
                              list="kelas-suggestions"
                              style={{ ...inputStyle, width: '100%', minWidth: 170 }}
                            />
                          </td>
                          <td style={{ padding: '8px 16px' }}>
                            <input
                              value={h.nominal.toLocaleString('id-ID')} onChange={e => handleFieldChange(h.id, 'nominal', e.target.value)}
                              onBlur={() => handleSimpanField(h, 'nominal')}
                              inputMode="numeric"
                              style={{ ...inputStyle, width: '100%', minWidth: 140 }}
                            />
                          </td>
                          <td style={{ padding: '8px 16px', textAlign: 'center' }}>
                            <input type="checkbox" checked={h.aktif} onChange={() => handleToggleAktif(h)} disabled={savingId === h.id} style={{ width: 18, height: 18, accentColor: '#C8973A', cursor: 'pointer' }} />
                          </td>
                          <td style={{ padding: '8px 16px' }}>
                            <button onClick={() => handleHapus(h)} disabled={savingId === h.id} title="Hapus" style={{ padding: 8, background: '#FEF2F2', color: '#DC2626', border: 'none', borderRadius: 8, cursor: 'pointer', display: 'flex', opacity: savingId === h.id ? 0.6 : 1 }}>
                              <Trash2 size={14} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <datalist id="kelas-suggestions">
                    <option value="REGULER" />
                    <option value="PLUS" />
                    {jenjang === 'smp' && <><option value="Kelas 7 - REGULER" /><option value="Kelas 7 - PLUS" /><option value="Kelas 8 - REGULER" /><option value="Kelas 8 - PLUS" /></>}
                    {(jenjang === 'sma' || jenjang === 'smk') && <><option value="Kelas 10 - REGULER" /><option value="Kelas 10 - PLUS" /><option value="Kelas 11 - REGULER" /><option value="Kelas 11 - PLUS" /></>}
                  </datalist>
                </div>

                {/* Tambah baris baru */}
                <div style={{ display: 'flex', gap: 8, padding: 16, borderTop: '1px solid #F3F4F6', flexWrap: 'wrap', background: '#FAFAFA' }}>
                  {jenjang === 'smk' && (
                    <input value={jurusanBaru} onChange={e => setJurusanBaru(e.target.value)} placeholder="Nama jurusan baru" style={{ ...inputStyle, flex: 2, minWidth: 200 }} />
                  )}
                  <input value={kelasBaru} onChange={e => setKelasBaru(e.target.value)} placeholder={`Contoh: Kelas ${jenjang === 'smp' ? '7' : jenjang === 'sma' ? '10' : '10'} - REGULER`} list="kelas-suggestions" style={{ ...inputStyle, flex: 1, minWidth: 160 }} />
                  <input
                    value={nominalBaru ? Number(nominalBaru.replace(/[^\d]/g, '')).toLocaleString('id-ID') : ''}
                    onChange={e => setNominalBaru(e.target.value.replace(/[^\d]/g, ''))}
                    placeholder="Nominal harga" inputMode="numeric" style={{ ...inputStyle, flex: 1, minWidth: 140 }}
                  />
                  <button onClick={handleTambah} disabled={addingHarga} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 16px', background: '#0A1628', color: 'white', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', opacity: addingHarga ? 0.6 : 1 }}>
                    <Plus size={14} /> Tambah
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
        )}
      </div>
    </div>
  );
}
