'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ChevronLeft, CheckCircle, Plus, Pencil, Trash2, Eye, LayoutDashboard } from 'lucide-react';

type TahunAjaran = { id: string; nama: string; aktif: boolean; createdAt: string };

export default function AdminTahunAjaranPage() {
  const [list, setList] = useState<TahunAjaran[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState('');
  const [toast, setToast] = useState('');
  const [namaBaru, setNamaBaru] = useState('');
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState('');
  const [editingNama, setEditingNama] = useState('');

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 4000); };

  const load = () => {
    setLoading(true);
    fetch('/api/admin/tahun-ajaran').then(r => r.json()).then(d => { setList(d.data || []); setLoading(false); });
  };
  useEffect(() => { load(); }, []);

  const handleAktifkan = async (t: TahunAjaran) => {
    if (!confirm(`Aktifkan tahun ajaran "${t.nama}"? Seluruh pendaftaran baru, harga, diskon, dan gelombang baru akan memakai tahun ajaran ini. Tahun ajaran yang sedang aktif sekarang akan otomatis menjadi tidak aktif.`)) return;
    setSavingId(t.id);
    const res = await fetch(`/api/admin/tahun-ajaran/${t.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ aktif: true }),
    });
    if (res.ok) { showToast(`✅ Tahun ajaran ${t.nama} diaktifkan`); load(); }
    else showToast('❌ Gagal mengaktifkan');
    setSavingId('');
  };

  const handleTambah = async () => {
    if (!namaBaru.trim()) { showToast('❌ Nama tahun ajaran wajib diisi'); return; }
    setAdding(true);
    const res = await fetch('/api/admin/tahun-ajaran', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nama: namaBaru.trim() }),
    });
    const d = await res.json();
    if (res.ok) { showToast('✅ Tahun ajaran ditambahkan (belum aktif)'); setNamaBaru(''); load(); }
    else showToast(`❌ ${d.error || 'Gagal menambah tahun ajaran'}`);
    setAdding(false);
  };

  const startEdit = (t: TahunAjaran) => { setEditingId(t.id); setEditingNama(t.nama); };
  const cancelEdit = () => { setEditingId(''); setEditingNama(''); };

  const handleSimpanEdit = async (t: TahunAjaran) => {
    if (!editingNama.trim()) { showToast('❌ Nama tidak boleh kosong'); return; }
    if (editingNama.trim() === t.nama) { cancelEdit(); return; }
    setSavingId(t.id);
    const res = await fetch(`/api/admin/tahun-ajaran/${t.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nama: editingNama.trim() }),
    });
    const d = await res.json();
    if (res.ok) { showToast('✅ Nama tahun ajaran diubah'); cancelEdit(); load(); }
    else showToast(`❌ ${d.error || 'Gagal mengubah nama'}`);
    setSavingId('');
  };

  const handleHapus = async (t: TahunAjaran) => {
    if (t.aktif) { showToast('❌ Tahun ajaran yang sedang aktif tidak boleh dihapus'); return; }
    if (!confirm(`Hapus tahun ajaran "${t.nama}"? Sistem akan mengecek dulu apakah tahun ajaran ini masih punya data.`)) return;

    setSavingId(t.id);
    let res = await fetch(`/api/admin/tahun-ajaran/${t.id}`, { method: 'DELETE' });
    let d = await res.json();

    if (res.status === 409 && d.error === 'confirm_required') {
      const lanjut = confirm(`⚠ ${d.message}\n\nKetik OK untuk tetap menghapus tahun ajaran ini beserta SELURUH data di atas secara permanen.`);
      if (!lanjut) { setSavingId(''); return; }
      res = await fetch(`/api/admin/tahun-ajaran/${t.id}?confirm=true`, { method: 'DELETE' });
      d = await res.json();
    }

    if (res.ok) { showToast(`✅ Tahun ajaran ${t.nama} dihapus`); load(); }
    else showToast(`❌ ${d.error || 'Gagal menghapus'}`);
    setSavingId('');
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--adm-bg)', fontFamily: 'Inter, sans-serif' }}>
      {toast && <div style={{ position: 'fixed', top: 24, right: 24, background: 'var(--adm-primary)', color: 'var(--adm-text-invert)', padding: '12px 20px', borderRadius: 10, fontSize: 13, fontWeight: 600, zIndex: 9999, maxWidth: 340 }}>{toast}</div>}

      <div style={{ background: 'var(--adm-primary)', padding: '16px 24px' }}>
        <div style={{ maxWidth: 800, margin: '0 auto', display: 'flex', alignItems: 'center', gap: 12 }}>
          <Link href="/admin/dashboard" style={{ color: 'rgba(255,255,255,0.7)', display: 'flex', alignItems: 'center' }}>
            <ChevronLeft size={20} />
          </Link>
          <h1 style={{ color: 'var(--adm-text-invert)', fontSize: 16, fontWeight: 700, margin: 0 }}>Tahun Ajaran</h1>
        </div>
      </div>

      <div style={{ maxWidth: 800, margin: '32px auto', padding: '0 24px' }}>
        <p style={{ color: 'var(--adm-text-muted)', fontSize: 13, marginBottom: 20, lineHeight: 1.6 }}>
          Tahun ajaran adalah sumber utama seluruh sistem SPMB. Hanya satu yang aktif dalam satu waktu — pendaftar, harga, diskon, gelombang, pembayaran, dan laporan yang baru selalu mengikuti tahun ajaran yang aktif. Data tahun ajaran lama tetap tersimpan terpisah dan bisa dibuka lewat "Lihat Kesimpulan" (ringkasan angka) atau "Lihat Data" (buka panel admin lengkap untuk tahun itu) tanpa mengubah tahun ajaran yang sedang berjalan.
        </p>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 40, color: 'var(--adm-text-faint)' }}>Memuat...</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}>
            {list.map(t => (
              <div key={t.id} style={{ background: 'var(--adm-surface)', borderRadius: 12, padding: 20, border: t.aktif ? '2px solid var(--adm-secondary)' : '1px solid var(--adm-text-faint)', display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: 140 }}>
                  {editingId === t.id ? (
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <input
                        value={editingNama} onChange={e => setEditingNama(e.target.value)} autoFocus
                        style={{ padding: '6px 10px', border: '1.5px solid var(--adm-secondary)', borderRadius: 8, fontSize: 14, fontWeight: 700, fontFamily: 'inherit' }}
                      />
                      <button onClick={() => handleSimpanEdit(t)} disabled={savingId === t.id} style={{ padding: '6px 12px', background: 'var(--adm-primary)', color: 'var(--adm-text-invert)', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>Simpan</button>
                      <button onClick={cancelEdit} style={{ padding: '6px 12px', background: 'transparent', color: 'var(--adm-text-muted)', border: '1px solid var(--adm-border)', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>Batal</button>
                    </div>
                  ) : (
                    <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--adm-text)', display: 'flex', alignItems: 'center', gap: 8 }}>
                      {t.nama}
                      {t.aktif && <span style={{ background: 'var(--adm-success-weak)', color: 'var(--adm-success)', fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 10 }}>AKTIF</span>}
                      <button onClick={() => startEdit(t)} title="Ubah nama" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--adm-text-faint)', display: 'flex', padding: 2 }}>
                        <Pencil size={13} />
                      </button>
                    </div>
                  )}
                  <div style={{ fontSize: 11, color: 'var(--adm-text-faint)', marginTop: 2 }}>
                    Dibuat {new Date(t.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                    {t.aktif && ' · Sedang Berjalan'}
                  </div>
                </div>

                <Link href={`/admin/tahun-ajaran/${t.id}`} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', background: 'var(--adm-info-weak)', color: 'var(--adm-info)', border: '1px solid var(--adm-info-border)', borderRadius: 8, fontSize: 12, fontWeight: 700, textDecoration: 'none' }}>
                  <Eye size={13} /> Lihat Kesimpulan
                </Link>

                <Link href={`/admin/dashboard?tahunAjaranId=${t.id}`} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', background: 'var(--adm-warning-weak)', color: 'var(--adm-warning)', border: '1px solid var(--adm-warning-border)', borderRadius: 8, fontSize: 12, fontWeight: 700, textDecoration: 'none' }}>
                  <LayoutDashboard size={13} /> Lihat Data
                </Link>

                {!t.aktif ? (
                  <button onClick={() => handleAktifkan(t)} disabled={savingId === t.id} style={{ padding: '8px 16px', background: 'var(--adm-primary)', color: 'var(--adm-text-invert)', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', opacity: savingId === t.id ? 0.6 : 1 }}>
                    Aktifkan
                  </button>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: 'var(--adm-success)', fontSize: 12, fontWeight: 600, padding: '8px 4px' }}>
                    <CheckCircle size={14} /> Sedang Berjalan
                  </div>
                )}

                <button onClick={() => handleHapus(t)} disabled={savingId === t.id || t.aktif} title={t.aktif ? 'Tahun ajaran aktif tidak bisa dihapus' : 'Hapus tahun ajaran'} style={{ padding: 8, background: t.aktif ? 'var(--adm-surface-alt)' : 'var(--adm-danger-weak)', color: t.aktif ? 'var(--adm-text-faint)' : 'var(--adm-danger)', border: 'none', borderRadius: 8, cursor: t.aktif ? 'not-allowed' : 'pointer', display: 'flex' }}>
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        )}

        <div style={{ display: 'flex', gap: 8, background: 'var(--adm-surface)', border: '1px solid var(--adm-border)', borderRadius: 12, padding: 16, flexWrap: 'wrap' }}>
          <input
            value={namaBaru} onChange={e => setNamaBaru(e.target.value)} placeholder="Contoh: 2027/2028"
            style={{ flex: 1, minWidth: 200, padding: '9px 12px', border: '1.5px solid var(--adm-border)', borderRadius: 8, fontSize: 13, fontFamily: 'inherit' }}
          />
          <button onClick={handleTambah} disabled={adding} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 16px', background: 'var(--adm-primary)', color: 'var(--adm-text-invert)', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', opacity: adding ? 0.6 : 1 }}>
            <Plus size={14} /> Tambah Tahun Ajaran
          </button>
        </div>
      </div>
    </div>
  );
}
