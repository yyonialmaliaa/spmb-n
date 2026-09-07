'use client';
import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Percent, CheckCircle, Plus, Trash2, CalendarClock } from 'lucide-react';
import { TopHeader } from '@/components/admin/TopHeader';
import { useAdmin } from '@/components/admin/AdminProvider';
import { EmptyState } from '@/components/admin/ui';

type Gelombang = {
  id: string; nama: string; urutan: number; diskonPersen: number;
  aktif: boolean; untukAlumni: boolean; jenjang: string;
  tanggalMulai: string | null; tanggalSelesai: string | null;
};

/** ISO -> nilai <input type="date"> (YYYY-MM-DD). */
const keTanggalInput = (v: string | null) => (v ? new Date(v).toISOString().slice(0, 10) : '');

export default function AdminGelombangPage() {
  return <Suspense fallback={null}><AdminGelombangInner /></Suspense>;
}

function AdminGelombangInner() {
  // Jenjang mengikuti konteks sidebar, bukan tab sendiri — supaya halaman ini
  // tunduk pada jenjang aktif seperti seluruh modul lainnya.
  const { jenjang: jenjangKonteks, jenjangSingkat, tahunAjaran } = useAdmin();
  const searchParams = useSearchParams();
  const tahunAjaranId = searchParams.get('tahunAjaranId') || '';
  const jenjang = jenjangKonteks ?? 'smk';
  const [list, setList] = useState<Gelombang[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState('');
  const [toast, setToast] = useState('');
  const [namaBaruUmum, setNamaBaruUmum] = useState('');
  const [namaBaruAlumni, setNamaBaruAlumni] = useState('');
  const [addingUmum, setAddingUmum] = useState(false);
  const [addingAlumni, setAddingAlumni] = useState(false);

  // Tanpa tahunAjaranId, halaman ini SELALU menampilkan tahun ajaran aktif —
  // walau admin sedang membuka tahun ajaran historis. Itu bug lama.
  const load = (j: string) => {
    setLoading(true);
    const qp = new URLSearchParams({ jenjang: j });
    if (tahunAjaranId) qp.set('tahunAjaranId', tahunAjaranId);
    fetch(`/api/admin/gelombang?${qp}`).then(r => r.json()).then(d => {
      setList(d.data || []);
      setLoading(false);
    });
  };
  // `load` sengaja tidak masuk dependensi: fungsinya dibuat ulang tiap render
  // dan hanya bergantung pada jenjang + tahun ajaran yang sudah terdaftar.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load(jenjang); }, [jenjang, tahunAjaranId]);

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

  // Tanggal mulai/selesai sudah didukung schema & endpoint PUT sejak awal,
  // tetapi tidak pernah ditampilkan — padahal itulah inti "Jadwal SPMB".
  const handleTanggal = async (g: Gelombang, medan: 'tanggalMulai' | 'tanggalSelesai', nilai: string) => {
    setList(l => l.map(x => (x.id === g.id ? { ...x, [medan]: nilai || null } : x)));
    setSavingId(g.id);
    const res = await fetch(`/api/admin/gelombang/${g.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ [medan]: nilai || null }),
    });
    if (res.ok) showToast('Jadwal disimpan');
    else { showToast('Gagal menyimpan jadwal'); load(jenjang); }
    setSavingId('');
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
        <div key={g.id} style={{ background: 'var(--adm-surface)', borderRadius: 12, padding: 20, border: g.aktif ? '2px solid var(--adm-secondary)' : '1px solid var(--adm-border)', display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 140 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--adm-text)', display: 'flex', alignItems: 'center', gap: 8 }}>
              {g.nama}
              {g.aktif && <span style={{ background: 'var(--adm-success-weak)', color: 'var(--adm-success)', fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 10 }}>AKTIF</span>}
            </div>
          </div>

          {/* Periode gelombang — kolom ini sudah ada di basis data sejak awal
              tapi belum pernah bisa diisi dari panel. */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            <CalendarClock size={14} color="var(--adm-text-faint)" />
            <input
              type="date"
              aria-label={`Tanggal mulai ${g.nama}`}
              value={keTanggalInput(g.tanggalMulai)}
              onChange={e => handleTanggal(g, 'tanggalMulai', e.target.value)}
              style={{ padding: '6px 8px', border: '1px solid var(--adm-border)', borderRadius: 8, fontSize: 12, fontFamily: 'inherit', background: 'var(--adm-surface)', color: 'var(--adm-text)' }}
            />
            <span style={{ color: 'var(--adm-text-faint)', fontSize: 12 }}>–</span>
            <input
              type="date"
              aria-label={`Tanggal selesai ${g.nama}`}
              value={keTanggalInput(g.tanggalSelesai)}
              min={keTanggalInput(g.tanggalMulai) || undefined}
              onChange={e => handleTanggal(g, 'tanggalSelesai', e.target.value)}
              style={{ padding: '6px 8px', border: '1px solid var(--adm-border)', borderRadius: 8, fontSize: 12, fontFamily: 'inherit', background: 'var(--adm-surface)', color: 'var(--adm-text)' }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <label style={{ fontSize: 12, color: 'var(--adm-text-muted)', fontWeight: 600 }}>Diskon:</label>
            <input
              type="number" min={0} max={100} step={0.5}
              value={g.diskonPersen}
              onChange={e => handleDiskonChange(g.id, e.target.value)}
              onBlur={() => handleSimpanDiskon(g)}
              style={{ width: 70, padding: '7px 8px', border: '1px solid var(--adm-border)', borderRadius: 8, fontSize: 13, fontFamily: 'inherit' }}
            />
            <Percent size={14} color="var(--adm-text-faint)" />
          </div>

          {!g.aktif ? (
            <button onClick={() => handleAktifkan(g.id)} disabled={savingId === g.id} style={{ padding: '8px 16px', background: 'var(--adm-primary)', color: 'var(--adm-text-invert)', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', opacity: savingId === g.id ? 0.6 : 1 }}>
              Aktifkan
            </button>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: 'var(--adm-success)', fontSize: 12, fontWeight: 600, padding: '8px 12px' }}>
              <CheckCircle size={14} /> Sedang Berjalan
            </div>
          )}

          <button onClick={() => handleHapus(g)} disabled={savingId === g.id} title="Hapus gelombang" style={{ padding: 8, background: 'var(--adm-danger-weak)', color: 'var(--adm-danger)', border: 'none', borderRadius: 8, cursor: 'pointer', display: 'flex', opacity: savingId === g.id ? 0.6 : 1 }}>
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
        style={{ flex: 1, padding: '9px 12px', border: '1.5px solid var(--adm-border)', borderRadius: 8, fontSize: 13, fontFamily: 'inherit' }}
      />
      <button
        onClick={() => handleTambah(untukAlumni, nama, () => setNama(''), setAdding)}
        disabled={adding || !nama.trim()}
        style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 16px', background: 'var(--adm-primary)', color: 'var(--adm-text-invert)', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', opacity: adding || !nama.trim() ? 0.6 : 1 }}
      >
        <Plus size={14} /> Tambah
      </button>
    </div>
  );

  const umum = list.filter(g => !g.untukAlumni);
  const alumni = list.filter(g => g.untukAlumni);

  return (
    <>
      <TopHeader
        judul={`Jadwal SPMB${jenjangSingkat ? ` ${jenjangSingkat}` : ''}`}
        subjudul="Gelombang pendaftaran, periode, dan diskon yang berlaku."
        remah={[{ label: 'Manajemen' }, { label: 'Jadwal SPMB' }]}
      />

      <div className="adm-content" style={{ maxWidth: 900 }}>
        <p style={{ color: 'var(--adm-text-muted)', fontSize: 13, marginBottom: 20, lineHeight: 1.6 }}>
          Gelombang berlaku per jenjang dan per tahun ajaran. Untuk SMA/SMK, pendaftar alumni SMP Citra
          Negara memakai jalur tersendiri. Aktifkan satu gelombang per jalur — diskonnya otomatis
          memotong harga dari panel Harga. Berlaku untuk TA {tahunAjaran?.nama}.
        </p>

        {toast && (
          <div style={{ background: 'var(--adm-success-weak)', color: 'var(--adm-success)', padding: '10px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600, marginBottom: 16 }}>{toast}</div>
        )}

        {loading ? (
          <div style={{ textAlign: 'center', padding: 40, color: 'var(--adm-text-faint)' }}>Memuat...</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
            <div>
              {jenjang !== 'smp' && <h3 style={{ fontSize: 13, fontWeight: 700, color: 'var(--adm-text)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.3 }}>Jalur Umum</h3>}
              {umum.length > 0 ? renderGroup(umum) : <p style={{ fontSize: 13, color: 'var(--adm-text-faint)' }}>Belum ada gelombang.</p>}
              {renderTambahForm(namaBaruUmum, setNamaBaruUmum, addingUmum, setAddingUmum, false)}
            </div>

            {jenjang !== 'smp' && (
              <div>
                <h3 style={{ fontSize: 13, fontWeight: 700, color: 'var(--adm-text)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.3 }}>Jalur Alumni SMP Citra Negara</h3>
                <p style={{ fontSize: 12, color: 'var(--adm-text-faint)', marginBottom: 12 }}>Khusus pendaftar {jenjang.toUpperCase()} yang alumni SMP Citra Negara — biasanya 2 gelombang.</p>
                {alumni.length > 0 ? renderGroup(alumni) : <p style={{ fontSize: 13, color: 'var(--adm-text-faint)' }}>Belum ada gelombang.</p>}
                {renderTambahForm(namaBaruAlumni, setNamaBaruAlumni, addingAlumni, setAddingAlumni, true)}
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
