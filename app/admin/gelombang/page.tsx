'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ChevronLeft, Percent, CheckCircle, Plus, Trash2 } from 'lucide-react';

type Gelombang = { id: string; nama: string; urutan: number; diskonPersen: number; aktif: boolean; untukAlumni: boolean; jenjang: string };

const JENJANG_TABS: { value: 'smp' | 'sma' | 'smk'; label: string }[] = [
  { value: 'smp', label: 'SMP' },
  { value: 'sma', label: 'SMA' },
  { value: 'smk', label: 'SMK' },
];

export default function AdminGelombangPage() {
  const [jenjang, setJenjang] = useState<'smp' | 'sma' | 'smk'>('smp');
  const [list, setList] = useState<Gelombang[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState('');
  const [toast, setToast] = useState('');
  const [namaBaruUmum, setNamaBaruUmum] = useState('');
  const [namaBaruAlumni, setNamaBaruAlumni] = useState('');
  const [addingUmum, setAddingUmum] = useState(false);
  const [addingAlumni, setAddingAlumni] = useState(false);

  const load = (j: string) => {
    setLoading(true);
    fetch(`/api/admin/gelombang?jenjang=${j}`).then(r => r.json()).then(d => {
      setList(d.data || []);
      setLoading(false);
    });
  };
  useEffect(() => { load(jenjang); }, [jenjang]);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 2500); };

  const handleAktifkan = async (id: string) => {
    setSavingId(id);
    const res = await fetch(`/api/admin/gelombang/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ aktif: true }),
    });
    if (res.ok) { showToast('✅ Gelombang diaktifkan'); load(jenjang); }
    setSavingId('');
  };

  const handleDiskonChange = (id: string, val: string) => {
    setList(l => l.map(g => g.id === id ? { ...g, diskonPersen: parseFloat(val) || 0 } : g));
  };

  const handleSimpanDiskon = async (g: Gelombang) => {
    setSavingId(g.id);
    const res = await fetch(`/api/admin/gelombang/${g.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ diskonPersen: g.diskonPersen }),
    });
    if (res.ok) showToast('✅ Diskon disimpan');
    setSavingId('');
  };

  const handleHapus = async (g: Gelombang) => {
    if (g.aktif) { showToast('❌ Aktifkan gelombang lain dulu sebelum menghapus ini'); return; }
    if (!confirm(`Hapus "${g.nama}"?`)) return;
    setSavingId(g.id);
    const res = await fetch(`/api/admin/gelombang/${g.id}`, { method: 'DELETE' });
    const d = await res.json();
    if (res.ok) { showToast('✅ Gelombang dihapus'); load(jenjang); }
    else showToast(`❌ ${d.error || 'Gagal menghapus'}`);
    setSavingId('');
  };

  const handleTambah = async (untukAlumni: boolean, nama: string, reset: () => void, setAdding: (v: boolean) => void) => {
    if (!nama.trim()) return;
    setAdding(true);
    const res = await fetch('/api/admin/gelombang', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jenjang, untukAlumni, nama }),
    });
    const d = await res.json();
    if (res.ok) { showToast('✅ Gelombang ditambahkan'); reset(); load(jenjang); }
    else showToast(`❌ ${d.error || 'Gagal menambah gelombang'}`);
    setAdding(false);
  };

  const renderGroup = (groupList: Gelombang[]) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {groupList.map(g => (
        <div key={g.id} style={{ background: 'white', borderRadius: 12, padding: 20, border: g.aktif ? '2px solid #C8973A' : '1px solid #E5E7EB', display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 140 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#0A1628', display: 'flex', alignItems: 'center', gap: 8 }}>
              {g.nama}
              {g.aktif && <span style={{ background: '#D1FAE5', color: '#065F46', fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 10 }}>AKTIF</span>}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <label style={{ fontSize: 12, color: '#6B7280', fontWeight: 600 }}>Diskon:</label>
            <input
              type="number" min={0} max={100} step={0.5}
              value={g.diskonPersen}
              onChange={e => handleDiskonChange(g.id, e.target.value)}
              onBlur={() => handleSimpanDiskon(g)}
              style={{ width: 70, padding: '7px 8px', border: '1px solid #E5E7EB', borderRadius: 8, fontSize: 13, fontFamily: 'inherit' }}
            />
            <Percent size={14} color="#9CA3AF" />
          </div>

          {!g.aktif ? (
            <button onClick={() => handleAktifkan(g.id)} disabled={savingId === g.id} style={{ padding: '8px 16px', background: '#0A1628', color: 'white', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', opacity: savingId === g.id ? 0.6 : 1 }}>
              Aktifkan
            </button>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#065F46', fontSize: 12, fontWeight: 600, padding: '8px 12px' }}>
              <CheckCircle size={14} /> Sedang Berjalan
            </div>
          )}

          <button onClick={() => handleHapus(g)} disabled={savingId === g.id} title="Hapus gelombang" style={{ padding: 8, background: '#FEF2F2', color: '#DC2626', border: 'none', borderRadius: 8, cursor: 'pointer', display: 'flex', opacity: savingId === g.id ? 0.6 : 1 }}>
            <Trash2 size={14} />
          </button>
        </div>
      ))}
    </div>
  );

  const renderTambahForm = (nama: string, setNama: (v: string) => void, adding: boolean, setAdding: (v: boolean) => void, untukAlumni: boolean) => (
    <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
      <input
        type="text" value={nama} onChange={e => setNama(e.target.value)}
        placeholder="Nama gelombang baru, mis. Gelombang 4"
        style={{ flex: 1, padding: '9px 12px', border: '1.5px solid #E5E7EB', borderRadius: 8, fontSize: 13, fontFamily: 'inherit' }}
      />
      <button
        onClick={() => handleTambah(untukAlumni, nama, () => setNama(''), setAdding)}
        disabled={adding || !nama.trim()}
        style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 16px', background: '#0A1628', color: 'white', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', opacity: adding || !nama.trim() ? 0.6 : 1 }}
      >
        <Plus size={14} /> Tambah
      </button>
    </div>
  );

  const umum = list.filter(g => !g.untukAlumni);
  const alumni = list.filter(g => g.untukAlumni);

  return (
    <div style={{ minHeight: '100vh', background: '#F8F9FA', fontFamily: 'Inter, sans-serif' }}>
      <div style={{ background: '#0A1628', padding: '16px 24px' }}>
        <div style={{ maxWidth: 800, margin: '0 auto', display: 'flex', alignItems: 'center', gap: 12 }}>
          <Link href="/admin/dashboard" style={{ color: 'rgba(255,255,255,0.7)', display: 'flex', alignItems: 'center' }}>
            <ChevronLeft size={20} />
          </Link>
          <h1 style={{ color: 'white', fontSize: 16, fontWeight: 700, margin: 0 }}>Atur Gelombang & Diskon Pendaftaran</h1>
        </div>
      </div>

      <div style={{ maxWidth: 800, margin: '32px auto', padding: '0 24px' }}>
        <p style={{ color: '#6B7280', fontSize: 13, marginBottom: 20, lineHeight: 1.6 }}>
          Setiap jenjang punya gelombangnya sendiri-sendiri. Untuk SMA/SMK, pendaftar yang mengaku alumni SMP Citra Negara memakai jalur gelombang tersendiri. Aktifkan salah satu gelombang per jalur — diskon (%) otomatis dipotong dari harga di panel Harga.
        </p>

        {/* Tab jenjang */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
          {JENJANG_TABS.map(t => (
            <button
              key={t.value}
              onClick={() => setJenjang(t.value)}
              style={{
                padding: '9px 22px', borderRadius: 10, border: jenjang === t.value ? '2px solid #C8973A' : '1.5px solid #E5E7EB',
                background: jenjang === t.value ? '#FFFBEB' : 'white', color: jenjang === t.value ? '#92400E' : '#374151',
                fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit',
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {toast && (
          <div style={{ background: '#D1FAE5', color: '#065F46', padding: '10px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600, marginBottom: 16 }}>{toast}</div>
        )}

        {loading ? (
          <div style={{ textAlign: 'center', padding: 40, color: '#9CA3AF' }}>Memuat...</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
            <div>
              {jenjang !== 'smp' && <h3 style={{ fontSize: 13, fontWeight: 700, color: '#0B2A1C', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.3 }}>Jalur Umum</h3>}
              {umum.length > 0 ? renderGroup(umum) : <p style={{ fontSize: 13, color: '#9CA3AF' }}>Belum ada gelombang.</p>}
              {renderTambahForm(namaBaruUmum, setNamaBaruUmum, addingUmum, setAddingUmum, false)}
            </div>

            {jenjang !== 'smp' && (
              <div>
                <h3 style={{ fontSize: 13, fontWeight: 700, color: '#0B2A1C', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.3 }}>Jalur Alumni SMP Citra Negara</h3>
                <p style={{ fontSize: 12, color: '#9CA3AF', marginBottom: 12 }}>Khusus pendaftar {jenjang.toUpperCase()} yang alumni SMP Citra Negara — biasanya 2 gelombang.</p>
                {alumni.length > 0 ? renderGroup(alumni) : <p style={{ fontSize: 13, color: '#9CA3AF' }}>Belum ada gelombang.</p>}
                {renderTambahForm(namaBaruAlumni, setNamaBaruAlumni, addingAlumni, setAddingAlumni, true)}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
