'use client';
import { useState, useEffect, Suspense } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { TopHeader } from '@/components/admin/TopHeader';
import { AuditTrail } from '@/components/admin/AuditTrail';

type Diskon = { id: string; jenis: string; tipeNominal: string; nominal: number; aktif: boolean };

export default function AdminDiskonPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--adm-text-faint)' }}>Memuat...</div>}>
      <AdminDiskonInner />
    </Suspense>
  );
}

function AdminDiskonInner() {
  const searchParams = useSearchParams();
  const tahunAjaranId = searchParams.get('tahunAjaranId') || '';
  const qsOnly = tahunAjaranId ? `?tahunAjaranId=${tahunAjaranId}` : '';

  const [list, setList] = useState<Diskon[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState('');
  const [toast, setToast] = useState('');

  const [jenisBaru, setJenisBaru] = useState('');
  const [tipeBaru, setTipeBaru] = useState<'rupiah' | 'persen'>('rupiah');
  const [nominalBaru, setNominalBaru] = useState('');
  const [adding, setAdding] = useState(false);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 2500); };


  const load = () => {
    setLoading(true);
    fetch(`/api/admin/diskon${qsOnly}`).then(r => r.json()).then(d => { setList(d.data || []); setLoading(false); });
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

  const inputStyle: React.CSSProperties = { padding: '7px 10px', border: '1px solid var(--adm-border)', borderRadius: 8, fontSize: 13, fontFamily: 'inherit' };

  return (
    <>
      {toast && <div style={{ position: 'fixed', top: 24, right: 24, background: 'var(--adm-primary)', color: 'var(--adm-text-invert)', padding: '12px 20px', borderRadius: 10, fontSize: 13, fontWeight: 600, zIndex: 9999, boxShadow: '0 8px 30px rgba(0,0,0,0.3)' }}>{toast}</div>}

      <TopHeader
        judul="Diskon"
        subjudul="Konfigurasi potongan biaya. Diskon di sini adalah daftar pilihan, belum diterapkan ke pendaftar."
        remah={[{ label: 'Manajemen' }, { label: 'Diskon' }]}
      />

      <div>

        <div style={{ maxWidth: 900, margin: '28px auto', padding: '0 24px', display: 'flex', flexDirection: 'column', gap: 20 }}>
          <p style={{ color: 'var(--adm-text-muted)', fontSize: 13, lineHeight: 1.6, margin: 0 }}>
            Diskon yang dibuat di sini <strong>belum langsung berlaku untuk siapa pun</strong> — ini hanya daftar pilihan. Untuk menerapkannya ke pendaftar tertentu, buka halaman <strong>Data Pendaftar → Detail → tab Keuangan</strong>, lalu pilih diskon yang sesuai di sana.
          </p>

          {loading ? (
            <div style={{ textAlign: 'center', padding: 40, color: 'var(--adm-text-faint)' }}>Memuat...</div>
          ) : (
            <div style={{ background: 'var(--adm-surface)', borderRadius: 14, border: '1px solid var(--adm-border)', overflow: 'hidden' }}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead>
                    <tr style={{ background: '#FAFAFA' }}>
                      <th style={{ textAlign: 'left', padding: '10px 16px', fontWeight: 700, color: 'var(--adm-text)' }}>Jenis Diskon</th>
                      <th style={{ textAlign: 'left', padding: '10px 16px', fontWeight: 700, color: 'var(--adm-text)' }}>Tipe</th>
                      <th style={{ textAlign: 'left', padding: '10px 16px', fontWeight: 700, color: 'var(--adm-text)' }}>Nominal</th>
                      <th style={{ textAlign: 'center', padding: '10px 16px', fontWeight: 700, color: 'var(--adm-text)' }}>Aktif</th>
                      <th style={{ padding: '10px 16px' }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {list.length === 0 && (
                      <tr><td colSpan={5} style={{ padding: 24, textAlign: 'center', color: 'var(--adm-text-faint)' }}>Belum ada jenis diskon.</td></tr>
                    )}
                    {list.map(d => (
                      <tr key={d.id} style={{ borderTop: '1px solid var(--adm-border)', opacity: d.aktif ? 1 : 0.5 }}>
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
                          <span style={{ fontSize: 11, color: 'var(--adm-text-faint)', marginLeft: 6 }}>{d.tipeNominal === 'persen' ? '%' : ''}</span>
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
              <div style={{ display: 'flex', gap: 8, padding: 16, borderTop: '1px solid var(--adm-border)', flexWrap: 'wrap', background: '#FAFAFA' }}>
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
                <button onClick={handleTambah} disabled={adding} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 16px', background: 'var(--adm-primary)', color: 'var(--adm-text-invert)', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', opacity: adding ? 0.6 : 1 }}>
                  <Plus size={14} /> Tambah
                </button>
              </div>
            </div>
          )}
        </div>
        <AuditTrail entitas="diskon" judul="Riwayat Perubahan Diskon" />
      </div>
    </>
  );
}
