'use client';
import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { TopHeader } from '@/components/admin/TopHeader';
import { AuditTrail } from '@/components/admin/AuditTrail';
import { Plus, Trash2, ArrowRight } from 'lucide-react';

type HargaRow = { id: string; jenjang: string; jurusan: string; kelas: string; nominal: number; aktif: boolean };
type Pengaturan = { minimalPembayaranAwal: number; minimalCicilan: number };
type Jenjang = 'smp' | 'sma' | 'smk';

const JENJANG_LABEL: Record<Jenjang, string> = { smp: 'SMP', sma: 'SMA', smk: 'SMK' };

export default function AdminHargaPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--adm-text-faint)' }}>Memuat...</div>}>
      <AdminHargaInner />
    </Suspense>
  );
}

function AdminHargaInner() {
  const searchParams = useSearchParams();
  const jenjangParam = searchParams.get('jenjang');
  // Jenjang HANYA berasal dari URL — SMP/SMA/SMK masing-masing jadi halaman
  // terkunci sendiri-sendiri, tidak ada tab untuk pindah jenjang di sini.
  // Kalau belum ada jenjang di URL, tampilkan pemilih jenjang dulu.
  const jenjang: Jenjang | null = (['smp', 'sma', 'smk'].includes(jenjangParam || '') ? jenjangParam : null) as Jenjang | null;
  const tahunAjaranId = searchParams.get('tahunAjaranId') || '';
  const qsOnly = tahunAjaranId ? `?tahunAjaranId=${tahunAjaranId}` : '';
  const qsAmp = tahunAjaranId ? `&tahunAjaranId=${tahunAjaranId}` : '';

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


  const loadHarga = (j: string) => {
    setLoading(true);
    fetch(`/api/admin/harga?jenjang=${j}${qsAmp}`).then(r => r.json()).then(d => {
      setList(d.data || []);
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

  const inputStyle: React.CSSProperties = { padding: '7px 10px', border: '1px solid var(--adm-border)', borderRadius: 8, fontSize: 13, fontFamily: 'inherit' };


  return (
    <>
      {toast && <div style={{ position: 'fixed', top: 24, right: 24, background: 'var(--adm-primary)', color: 'var(--adm-text-invert)', padding: '12px 20px', borderRadius: 10, fontSize: 13, fontWeight: 600, zIndex: 9999, boxShadow: '0 8px 30px rgba(0,0,0,0.3)' }}>{toast}</div>}

      <TopHeader
        judul={`Harga${jenjang ? ` ${JENJANG_LABEL[jenjang]}` : ''}`}
        subjudul="Konfigurasi biaya pendidikan — acuan utama seluruh perhitungan tagihan SPMB."
        remah={[{ label: 'Manajemen' }, { label: 'Harga' }]}
      />

      <div>

        {!jenjang ? (
          <div style={{ maxWidth: 900, margin: '40px auto', padding: '0 24px' }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--adm-text)', marginBottom: 6 }}>Pilih Jenjang</h2>
            <p style={{ fontSize: 13, color: 'var(--adm-text-muted)', marginBottom: 24 }}>Harga SMP, SMA, dan SMK dikelola terpisah — pilih salah satu jenjang untuk mulai mengatur.</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14 }}>
              {(['smp', 'sma', 'smk'] as Jenjang[]).map(j => (
                <Link key={j} href={`/admin/harga?jenjang=${j}${qsAmp}`} style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 6, background: 'var(--adm-primary)', color: 'var(--adm-text-invert)', borderRadius: 14, padding: '22px 20px', textDecoration: 'none' }}>
                  <span style={{ fontSize: 22, fontWeight: 800, color: 'var(--adm-secondary)' }}>{JENJANG_LABEL[j]}</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 700, color: 'var(--adm-secondary)' }}>Kelola Harga <ArrowRight size={13} /></span>
                </Link>
              ))}
            </div>
          </div>
        ) : (
        <div style={{ maxWidth: 900, margin: '28px auto', padding: '0 24px', display: 'flex', flexDirection: 'column', gap: 28 }}>
          <p style={{ color: 'var(--adm-text-muted)', fontSize: 13, lineHeight: 1.6, margin: 0 }}>
            Harga di sini adalah acuan utama untuk seluruh perhitungan keuangan SPMB — total tagihan, cicilan, dan laporan semua mengambil dari sini. Mengubah harga tidak mengubah tagihan pendaftar yang sudah mulai membayar.
          </p>

          {/* Pengaturan minimal pembayaran */}
          <div style={{ background: 'var(--adm-surface)', borderRadius: 14, padding: 20, border: '1px solid var(--adm-border)' }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--adm-text)', marginBottom: 4 }}>Pengaturan Pembayaran</h3>
            <p style={{ fontSize: 12, color: 'var(--adm-text-faint)', marginBottom: 14 }}>Berlaku untuk seluruh jenjang pada tahun ajaran aktif.</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14, marginBottom: 14 }}>
              <div>
                <label style={{ fontSize: 12, color: 'var(--adm-text)', fontWeight: 600, display: 'block', marginBottom: 6 }}>Minimal Pembayaran Awal (syarat kirim formulir)</label>
                <input
                  type="text" inputMode="numeric" style={{ ...inputStyle, width: '100%' }}
                  value={pengaturan.minimalPembayaranAwal.toLocaleString('id-ID')}
                  onChange={e => setPengaturan(p => ({ ...p, minimalPembayaranAwal: parseInt(e.target.value.replace(/[^\d]/g, '')) || 0 }))}
                />
              </div>
              <div>
                <label style={{ fontSize: 12, color: 'var(--adm-text)', fontWeight: 600, display: 'block', marginBottom: 6 }}>Minimal Cicilan Berikutnya</label>
                <input
                  type="text" inputMode="numeric" style={{ ...inputStyle, width: '100%' }}
                  value={pengaturan.minimalCicilan.toLocaleString('id-ID')}
                  onChange={e => setPengaturan(p => ({ ...p, minimalCicilan: parseInt(e.target.value.replace(/[^\d]/g, '')) || 0 }))}
                />
              </div>
            </div>
            <button onClick={handleSimpanPengaturan} disabled={savingPengaturan} style={{ padding: '9px 18px', background: 'var(--adm-primary)', color: 'var(--adm-text-invert)', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', opacity: savingPengaturan ? 0.6 : 1 }}>
              {savingPengaturan ? 'Menyimpan...' : 'Simpan Pengaturan'}
            </button>
          </div>

          <div>
            <p style={{ fontSize: 12, color: 'var(--adm-text-faint)', margin: '0 0 16px' }}>
              {jenjang === 'smk'
                ? 'SMK: harga diatur per jurusan, kelas masuk (Kelas 10/11), dan program (Reguler/Plus).'
                : `${JENJANG_LABEL[jenjang]}: tidak ada jurusan — harga diatur per kelas masuk (Kelas ${jenjang === 'smp' ? '7/8' : '10/11'}) dan program (Reguler/Plus).`}
            </p>

            {loading ? (
              <div style={{ textAlign: 'center', padding: 40, color: 'var(--adm-text-faint)' }}>Memuat...</div>
            ) : (
              <div style={{ background: 'var(--adm-surface)', borderRadius: 14, border: '1px solid var(--adm-border)', overflow: 'hidden' }}>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                    <thead>
                      <tr style={{ background: 'var(--adm-surface-alt)' }}>
                        {jenjang === 'smk' && <th style={{ textAlign: 'left', padding: '10px 16px', fontWeight: 700, color: 'var(--adm-text)' }}>Jurusan</th>}
                        <th style={{ textAlign: 'left', padding: '10px 16px', fontWeight: 700, color: 'var(--adm-text)' }}>Kelas / Program</th>
                        <th style={{ textAlign: 'left', padding: '10px 16px', fontWeight: 700, color: 'var(--adm-text)' }}>Harga</th>
                        <th style={{ textAlign: 'center', padding: '10px 16px', fontWeight: 700, color: 'var(--adm-text)' }}>Aktif</th>
                        <th style={{ padding: '10px 16px' }}></th>
                      </tr>
                    </thead>
                    <tbody>
                      {list.length === 0 && (
                        <tr><td colSpan={jenjang === 'smk' ? 5 : 4} style={{ padding: 24, textAlign: 'center', color: 'var(--adm-text-faint)' }}>Belum ada harga untuk jenjang ini.</td></tr>
                      )}
                      {list.map(h => (
                        <tr key={h.id} style={{ borderTop: '1px solid var(--adm-border)', opacity: h.aktif ? 1 : 0.5 }}>
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
                            <input type="checkbox" checked={h.aktif} onChange={() => handleToggleAktif(h)} disabled={savingId === h.id} style={{ width: 18, height: 18, accentColor: 'var(--adm-secondary)', cursor: 'pointer' }} />
                          </td>
                          <td style={{ padding: '8px 16px' }}>
                            <button onClick={() => handleHapus(h)} disabled={savingId === h.id} title="Hapus" style={{ padding: 8, background: 'var(--adm-danger-weak)', color: 'var(--adm-danger)', border: 'none', borderRadius: 8, cursor: 'pointer', display: 'flex', opacity: savingId === h.id ? 0.6 : 1 }}>
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
                <div style={{ display: 'flex', gap: 8, padding: 16, borderTop: '1px solid var(--adm-border)', flexWrap: 'wrap', background: 'var(--adm-surface-alt)' }}>
                  {jenjang === 'smk' && (
                    <input value={jurusanBaru} onChange={e => setJurusanBaru(e.target.value)} placeholder="Nama jurusan baru" style={{ ...inputStyle, flex: 2, minWidth: 200 }} />
                  )}
                  <input value={kelasBaru} onChange={e => setKelasBaru(e.target.value)} placeholder={`Contoh: Kelas ${jenjang === 'smp' ? '7' : jenjang === 'sma' ? '10' : '10'} - REGULER`} list="kelas-suggestions" style={{ ...inputStyle, flex: 1, minWidth: 160 }} />
                  <input
                    value={nominalBaru ? Number(nominalBaru.replace(/[^\d]/g, '')).toLocaleString('id-ID') : ''}
                    onChange={e => setNominalBaru(e.target.value.replace(/[^\d]/g, ''))}
                    placeholder="Nominal harga" inputMode="numeric" style={{ ...inputStyle, flex: 1, minWidth: 140 }}
                  />
                  <button onClick={handleTambah} disabled={addingHarga} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 16px', background: 'var(--adm-primary)', color: 'var(--adm-text-invert)', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', opacity: addingHarga ? 0.6 : 1 }}>
                    <Plus size={14} /> Tambah
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
        )}
        <AuditTrail entitas="harga" judul="Riwayat Perubahan Harga" />
      </div>
    </>
  );
}
