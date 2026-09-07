'use client';

import { useCallback, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { ExternalLink, FileText, GripVertical, Info, Plus, Trash2, Upload } from 'lucide-react';
import { TopHeader } from '@/components/admin/TopHeader';
import { useAdmin } from '@/components/admin/AdminProvider';
import {
  ConfirmModal, EmptyState, ErrorState, Modal, PermissionGate,
  SkeletonTabel, StatusBadge, Toast,
} from '@/components/admin/ui';
import { useMuatData, ambilJson } from '@/components/admin/useMuatData';
import { FIELD_BERKAS, KATEGORI_PERSYARATAN } from '@/lib/labels';

// ============================================================================
// PERSYARATAN — dua kategori dalam satu halaman:
//
//   Berkas Pendaftaran   : yang DIUNGGAH pendaftar. fieldKey memetakan tiap
//                          baris ke kolom file di Pendaftaran, sehingga
//                          halaman Verifikasi tahu berkas mana yang dicek.
//   Dokumen Daftar Ulang : template yang DIUNDUH pendaftar (tata tertib,
//                          surat pernyataan, surat perjanjian).
//
// Keduanya di-scope ke JENJANG + TAHUN AJARAN yang sedang aktif.
// ============================================================================

interface Baris {
  id: string;
  jenjang: string;
  kategori: string;
  jenis: string;
  nama: string;
  deskripsi: string | null;
  fieldKey: string | null;
  wajib: boolean;
  aktif: boolean;
  urutan: number;
  url: string | null;
  namaFile: string | null;
}

type Kategori = 'pendaftaran' | 'daftar_ulang';

export default function PersyaratanPage() {
  return <Suspense fallback={null}><PersyaratanInner /></Suspense>;
}

function PersyaratanInner() {
  const searchParams = useSearchParams();
  const { jenjang, jenjangSingkat, jenjangLabel, tahunAjaran } = useAdmin();
  const tahunAjaranId = searchParams.get('tahunAjaranId') || '';

  const [kategori, setKategori] = useState<Kategori>('pendaftaran');
  const [toast, setToast] = useState<string | null>(null);
  const [tambah, setTambah] = useState(false);
  const [hapus, setHapus] = useState<Baris | null>(null);
  const [memproses, setMemproses] = useState(false);

  const [form, setForm] = useState({ nama: '', deskripsi: '', fieldKey: '', wajib: true });
  const [mengunggahId, setMengunggahId] = useState<string | null>(null);

  const beriToast = (m: string) => { setToast(m); setTimeout(() => setToast(null), 3000); };

  const ambil = useCallback(
    async (sinyal: AbortSignal) => {
      if (!jenjang) return [] as Baris[];
      const qp = new URLSearchParams({ jenjang, kategori });
      if (tahunAjaranId) qp.set('tahunAjaranId', tahunAjaranId);
      const d = await ambilJson<{ data: Baris[] }>(`/api/admin/persyaratan?${qp}`, sinyal);
      return d.data ?? [];
    },
    [jenjang, kategori, tahunAjaranId],
  );

  const { data, loading, gagal, muatUlang: muat, setData } = useMuatData(ambil, [jenjang, kategori, tahunAjaranId]);
  const rows = data ?? [];
  const setRows = (fn: (r: Baris[]) => Baris[]) => setData(d => fn(d ?? []));

  const ubah = async (b: Baris, data: Record<string, unknown>) => {
    // Perbarui optimistis supaya toggle terasa responsif; muat ulang kalau gagal.
    setRows(rs => rs.map(r => (r.id === b.id ? { ...r, ...data } as Baris : r)));
    const res = await fetch(`/api/admin/persyaratan/${b.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const e = await res.json().catch(() => null);
      beriToast(e?.error || 'Gagal menyimpan');
      muat();
    }
  };

  // Upload berkas template untuk kategori "Dokumen Daftar Ulang" — ini
  // dokumen yang DIUNDUH pendaftar (tata tertib, surat pernyataan, dst),
  // beda dari kategori "Berkas Pendaftaran" yang justru DIUNGGAH pendaftar.
  const handleUpload = async (b: Baris, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { beriToast('Ukuran file maksimal 5MB'); return; }
    setMengunggahId(b.id);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('fieldName', `persyaratan-${b.id}`);
      const res = await fetch('/api/upload', { method: 'POST', body: fd });
      const d = await res.json();
      if (!res.ok) { beriToast(d.error || 'Gagal mengunggah file'); return; }
      await ubah(b, { url: d.path, namaFile: file.name });
      beriToast('Berkas berhasil diunggah');
    } catch {
      beriToast('Gagal mengunggah, coba lagi');
    } finally {
      setMengunggahId(null);
      e.target.value = '';
    }
  };

  const simpanBaru = async () => {
    if (!form.nama.trim()) { beriToast('Nama persyaratan wajib diisi'); return; }
    setMemproses(true);
    try {
      const res = await fetch('/api/admin/persyaratan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jenjang, kategori, tahunAjaranId: tahunAjaranId || undefined,
          nama: form.nama, deskripsi: form.deskripsi,
          fieldKey: kategori === 'pendaftaran' ? form.fieldKey || null : null,
          wajib: form.wajib,
        }),
      });
      if (!res.ok) {
        const e = await res.json().catch(() => null);
        beriToast(e?.error || 'Gagal menambah persyaratan');
        return;
      }
      beriToast('Persyaratan ditambahkan');
      setTambah(false);
      setForm({ nama: '', deskripsi: '', fieldKey: '', wajib: true });
      muat();
    } finally { setMemproses(false); }
  };

  const konfirmasiHapus = async () => {
    if (!hapus) return;
    setMemproses(true);
    try {
      const res = await fetch(`/api/admin/persyaratan/${hapus.id}`, { method: 'DELETE' });
      if (!res.ok) { beriToast('Gagal menghapus'); return; }
      beriToast('Persyaratan dihapus');
      setHapus(null);
      muat();
    } finally { setMemproses(false); }
  };

  // fieldKey yang sudah dipakai baris lain tidak boleh dipilih dua kali —
  // satu kolom file hanya boleh diwakili satu baris persyaratan.
  const terpakai = new Set(rows.map(r => r.fieldKey).filter(Boolean));

  return (
    <>
      <Toast pesan={toast} />
      <TopHeader
        judul={`Persyaratan${jenjangSingkat ? ` ${jenjangSingkat}` : ''}`}
        subjudul="Berkas yang wajib dikumpulkan pendaftar dan dokumen daftar ulang."
        remah={[{ label: 'Manajemen' }, { label: 'Persyaratan' }]}
        aksi={
          jenjang ? (
            <PermissionGate resource="persyaratan" action="create">
              <button className="adm-btn adm-btn--primary adm-btn--sm" onClick={() => setTambah(true)}>
                <Plus size={14} /> Tambah Persyaratan
              </button>
            </PermissionGate>
          ) : null
        }
      />

      <div className="adm-content">
        {!jenjang ? (
          <div className="adm-card">
            <EmptyState
              judul="Pilih jenjang terlebih dahulu"
              pesan="Persyaratan diatur terpisah untuk SMP, SMA, dan SMK. Gunakan tombol Ganti Jenjang di sidebar."
            />
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
              {(Object.keys(KATEGORI_PERSYARATAN) as Kategori[]).map(k => (
                <button
                  key={k}
                  onClick={() => setKategori(k)}
                  className={`adm-btn adm-btn--${kategori === k ? 'primary' : 'ghost'} adm-btn--sm`}
                >
                  {KATEGORI_PERSYARATAN[k]}
                </button>
              ))}
            </div>

            <div className="adm-banner adm-banner--info" style={{ marginBottom: 16 }}>
              <Info size={15} style={{ flexShrink: 0, marginTop: 1 }} />
              <div>
                {kategori === 'pendaftaran' ? (
                  <>
                    Berkas ini yang diperiksa di halaman <strong>Verifikasi</strong>. Kolom{' '}
                    <strong>Berkas Terkait</strong> menghubungkan tiap baris ke file yang diunggah pendaftar —
                    tanpa itu, berkasnya tidak akan muncul saat diverifikasi.
                  </>
                ) : (
                  <>
                    Dokumen ini <strong>diunduh</strong> pendaftar saat daftar ulang. Unggah berkasnya
                    lewat halaman Dokumen Daftar Ulang.
                  </>
                )}{' '}
                Berlaku untuk {jenjangLabel} TA {tahunAjaran?.nama}.
              </div>
            </div>

            <div className="adm-card">
              <div className="adm-card-head">
                <div className="adm-card-title">{KATEGORI_PERSYARATAN[kategori]}</div>
                <span style={{ fontSize: 12, color: 'var(--adm-text-muted)' }}>
                  {loading ? '…' : `${rows.length} item`}
                </span>
              </div>

              {loading ? (
                <SkeletonTabel baris={4} kolom={5} />
              ) : gagal ? (
                <ErrorState onCoba={muat} />
              ) : rows.length === 0 ? (
                <EmptyState
                  judul={`Belum ada ${KATEGORI_PERSYARATAN[kategori].toLowerCase()} untuk ${jenjangSingkat}`}
                  pesan={`Pada tahun ajaran ${tahunAjaran?.nama ?? 'ini'}. Tambahkan lewat tombol di kanan atas.`}
                />
              ) : (
                <div className="adm-table-wrap">
                  <table className="adm-table">
                    <thead>
                      <tr>
                        <th style={{ width: 44 }}>No</th>
                        <th>Nama Persyaratan</th>
                        {kategori === 'pendaftaran' && <th>Berkas Terkait</th>}
                        {kategori === 'daftar_ulang' && <th style={{ width: 220 }}>Berkas</th>}
                        <th style={{ width: 110 }}>Sifat</th>
                        <th style={{ width: 100 }}>Status</th>
                        <th style={{ width: 70, textAlign: 'right' }}>Aksi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((b, i) => (
                        <tr key={b.id} style={{ opacity: b.aktif ? 1 : 0.55 }}>
                          <td style={{ color: 'var(--adm-text-faint)', fontSize: 12 }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                              <GripVertical size={13} />
                              {String(i + 1).padStart(2, '0')}
                            </span>
                          </td>
                          <td>
                            <PermissionGate
                              resource="persyaratan"
                              action="update"
                              fallback={<span style={{ fontWeight: 550 }}>{b.nama}</span>}
                            >
                              <input
                                className="adm-input"
                                style={{ border: 'none', padding: '2px 0', fontWeight: 550, background: 'transparent' }}
                                defaultValue={b.nama}
                                onBlur={e => { if (e.target.value !== b.nama) ubah(b, { nama: e.target.value }); }}
                              />
                            </PermissionGate>
                            {b.deskripsi && (
                              <div style={{ fontSize: 11.5, color: 'var(--adm-text-muted)' }}>{b.deskripsi}</div>
                            )}
                          </td>

                          {kategori === 'pendaftaran' && (
                            <td>
                              <PermissionGate
                                resource="persyaratan"
                                action="update"
                                fallback={<span style={{ fontSize: 12 }}>{b.fieldKey ? FIELD_BERKAS[b.fieldKey] : '—'}</span>}
                              >
                                <select
                                  className="adm-select"
                                  style={{ fontSize: 12, padding: '5px 8px' }}
                                  value={b.fieldKey || ''}
                                  onChange={e => ubah(b, { fieldKey: e.target.value || null })}
                                >
                                  <option value="">— belum dipetakan —</option>
                                  {Object.entries(FIELD_BERKAS).map(([k, label]) => (
                                    <option key={k} value={k} disabled={terpakai.has(k) && k !== b.fieldKey}>
                                      {label}
                                    </option>
                                  ))}
                                </select>
                              </PermissionGate>
                            </td>
                          )}

                          {kategori === 'daftar_ulang' && (
                            <td>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                                {b.url ? (
                                  <a
                                    href={b.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: 'var(--adm-secondary)', fontWeight: 600, textDecoration: 'none', minWidth: 0, overflow: 'hidden' }}
                                  >
                                    <FileText size={13} style={{ flexShrink: 0 }} />
                                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{b.namaFile || 'Lihat berkas'}</span>
                                    <ExternalLink size={11} style={{ flexShrink: 0 }} />
                                  </a>
                                ) : (
                                  <span style={{ fontSize: 12, color: 'var(--adm-text-faint)' }}>Belum ada berkas</span>
                                )}
                                <PermissionGate resource="persyaratan" action="update">
                                  <label
                                    className="adm-btn adm-btn--ghost adm-btn--sm"
                                    style={{ cursor: mengunggahId === b.id ? 'wait' : 'pointer', flexShrink: 0 }}
                                  >
                                    <Upload size={12} />
                                    {mengunggahId === b.id ? 'Mengunggah…' : b.url ? 'Ganti' : 'Unggah'}
                                    <input
                                      type="file"
                                      accept=".doc,.docx,.pdf"
                                      onChange={e => handleUpload(b, e)}
                                      disabled={mengunggahId === b.id}
                                      style={{ display: 'none' }}
                                    />
                                  </label>
                                </PermissionGate>
                              </div>
                            </td>
                          )}

                          <td>
                            <PermissionGate
                              resource="persyaratan"
                              action="update"
                              fallback={<StatusBadge teks={b.wajib ? 'Wajib' : 'Opsional'} nada={b.wajib ? 'info' : 'netral'} />}
                            >
                              <button
                                onClick={() => ubah(b, { wajib: !b.wajib })}
                                style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
                                title="Klik untuk mengubah"
                              >
                                <StatusBadge teks={b.wajib ? 'Wajib' : 'Opsional'} nada={b.wajib ? 'info' : 'netral'} />
                              </button>
                            </PermissionGate>
                          </td>

                          <td>
                            <PermissionGate
                              resource="persyaratan"
                              action="update"
                              fallback={<StatusBadge teks={b.aktif ? 'Aktif' : 'Nonaktif'} nada={b.aktif ? 'sukses' : 'netral'} />}
                            >
                              <button
                                onClick={() => ubah(b, { aktif: !b.aktif })}
                                style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
                                title="Klik untuk mengubah"
                              >
                                <StatusBadge teks={b.aktif ? 'Aktif' : 'Nonaktif'} nada={b.aktif ? 'sukses' : 'netral'} />
                              </button>
                            </PermissionGate>
                          </td>

                          <td style={{ textAlign: 'right' }}>
                            <PermissionGate resource="persyaratan" action="delete">
                              <button
                                className="adm-btn adm-btn--danger adm-btn--sm"
                                onClick={() => setHapus(b)}
                                aria-label={`Hapus ${b.nama}`}
                              >
                                <Trash2 size={13} />
                              </button>
                            </PermissionGate>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {tambah && (
        <Modal
          judul={`Tambah ${KATEGORI_PERSYARATAN[kategori]}`}
          onTutup={() => setTambah(false)}
          footer={
            <>
              <button className="adm-btn adm-btn--ghost" onClick={() => setTambah(false)} disabled={memproses}>Batal</button>
              <button className="adm-btn adm-btn--primary" onClick={simpanBaru} disabled={memproses}>
                {memproses ? 'Menyimpan…' : 'Tambah'}
              </button>
            </>
          }
        >
          <div style={{ display: 'grid', gap: 14 }}>
            <div>
              <label className="adm-label" htmlFor="nama">Nama persyaratan</label>
              <input
                id="nama"
                className="adm-input"
                value={form.nama}
                onChange={e => setForm(f => ({ ...f, nama: e.target.value }))}
                placeholder="Contoh: Surat Keterangan Sehat"
              />
            </div>
            <div>
              <label className="adm-label" htmlFor="deskripsi">Keterangan (opsional)</label>
              <input
                id="deskripsi"
                className="adm-input"
                value={form.deskripsi}
                onChange={e => setForm(f => ({ ...f, deskripsi: e.target.value }))}
                placeholder="Petunjuk singkat untuk pendaftar"
              />
            </div>
            {kategori === 'pendaftaran' && (
              <div>
                <label className="adm-label" htmlFor="fieldKey">Berkas terkait</label>
                <select
                  id="fieldKey"
                  className="adm-select"
                  value={form.fieldKey}
                  onChange={e => setForm(f => ({ ...f, fieldKey: e.target.value }))}
                >
                  <option value="">— belum dipetakan —</option>
                  {Object.entries(FIELD_BERKAS).map(([k, label]) => (
                    <option key={k} value={k} disabled={terpakai.has(k)}>{label}</option>
                  ))}
                </select>
                <p style={{ fontSize: 11.5, color: 'var(--adm-text-muted)', marginTop: 5 }}>
                  Menentukan file mana yang dicek di halaman Verifikasi. Kosongkan bila persyaratan ini
                  belum punya kolom unggahan di formulir pendaftaran.
                </p>
              </div>
            )}
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
              <input
                type="checkbox"
                checked={form.wajib}
                onChange={e => setForm(f => ({ ...f, wajib: e.target.checked }))}
              />
              Wajib dikumpulkan
            </label>
          </div>
        </Modal>
      )}

      {hapus && (
        <ConfirmModal
          judul="Hapus persyaratan?"
          pesan={`"${hapus.nama}" akan dihapus dari daftar persyaratan ${jenjangSingkat}. Berkas yang sudah diunggah pendaftar tidak ikut terhapus.`}
          labelKonfirmasi="Hapus"
          nada="danger"
          memproses={memproses}
          onBatal={() => setHapus(null)}
          onKonfirmasi={konfirmasiHapus}
        />
      )}
    </>
  );
}
