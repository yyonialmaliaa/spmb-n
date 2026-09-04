'use client';

import { useCallback, useMemo, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Info, Megaphone, Search } from 'lucide-react';
import { TopHeader } from '@/components/admin/TopHeader';
import { useAdmin } from '@/components/admin/AdminProvider';
import {
  ConfirmModal, EmptyState, ErrorState, Modal, PermissionGate,
  SkeletonStat, SkeletonTabel, StatCard, StatusBadge, Toast,
} from '@/components/admin/ui';
import { useMuatData, ambilJson } from '@/components/admin/useMuatData';
import { labelStatusPembayaran, labelStatusPendaftaran } from '@/lib/labels';

// ============================================================================
// STATUS SPMB — perjalanan pendaftar dari terdaftar sampai daftar ulang.
//
// PENTING: halaman ini memisahkan dua hal yang sering tertukar —
//   STATUS PENDAFTARAN : draft -> verified -> diterima_berkas / ditolak
//   STATUS PEMBAYARAN  : belum_bayar -> cicilan_berjalan -> lunas
// Keduanya ditampilkan berdampingan untuk satu pendaftar, tapi merupakan data
// yang berbeda dan tidak pernah saling menggantikan.
//
// Status yang dipakai persis status yang sudah ada di sistem — tidak ada
// status baru yang diciptakan di sini.
// ============================================================================

interface Pendaftar {
  id: string;
  namaLengkap: string | null;
  jurusan?: string | null;
  kelas?: string | null;
  status: string;
  statusPembayaran?: string;
  sudahDaftarUlang?: boolean;
  nilaiSeleksi?: number | null;
  pesanPengumuman?: string | null;
  createdAt: string;
}

const FILTER: { key: string; label: string }[] = [
  { key: '', label: 'Semua' },
  { key: 'verified', label: 'Menunggu Verifikasi' },
  { key: 'diterima_berkas', label: 'Lulus Seleksi' },
  { key: 'ditolak', label: 'Tidak Lolos' },
];

export default function StatusPage() {
  return <Suspense fallback={null}><StatusInner /></Suspense>;
}

function StatusInner() {
  const searchParams = useSearchParams();
  const { jenjang, jenjangSingkat } = useAdmin();
  const tahunAjaranId = searchParams.get('tahunAjaranId') || '';

  const [filter, setFilter] = useState('');
  const [cari, setCari] = useState('');
  const [toast, setToast] = useState<string | null>(null);

  const [pengumuman, setPengumuman] = useState<Pendaftar | null>(null);
  const [teksPengumuman, setTeksPengumuman] = useState('');
  const [konfirmasiDU, setKonfirmasiDU] = useState<Pendaftar | null>(null);
  const [memproses, setMemproses] = useState(false);

  const beriToast = (m: string) => { setToast(m); setTimeout(() => setToast(null), 3000); };

  const ambil = useCallback(
    async (sinyal: AbortSignal) => {
      const qp = new URLSearchParams();
      if (jenjang) qp.set('jenjang', jenjang);
      if (tahunAjaranId) qp.set('tahunAjaranId', tahunAjaranId);
      const d = await ambilJson<{ data: Pendaftar[] }>(`/api/admin/pendaftar?${qp}`, sinyal);
      return d.data ?? [];
    },
    [jenjang, tahunAjaranId],
  );

  const { data, loading, gagal, muatUlang: muat } = useMuatData(ambil, [jenjang, tahunAjaranId]);
  const rows = useMemo(() => data ?? [], [data]);

  const ringkasan = useMemo(() => ({
    total: rows.length,
    menunggu: rows.filter(r => r.status === 'verified').length,
    lulus: rows.filter(r => r.status === 'diterima_berkas').length,
    daftarUlang: rows.filter(r => r.sudahDaftarUlang).length,
    tidakLolos: rows.filter(r => r.status === 'ditolak').length,
  }), [rows]);

  const tersaring = useMemo(() => {
    const q = cari.trim().toLowerCase();
    return rows.filter(r =>
      (!filter || r.status === filter) &&
      (!q || (r.namaLengkap || '').toLowerCase().includes(q)),
    );
  }, [rows, filter, cari]);

  const simpan = async (id: string, body: Record<string, unknown>, pesanSukses: string) => {
    setMemproses(true);
    try {
      const res = await fetch(`/api/admin/pendaftar/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const e = await res.json().catch(() => null);
        beriToast(e?.error || 'Gagal menyimpan');
        return false;
      }
      beriToast(pesanSukses);
      muat();
      return true;
    } finally { setMemproses(false); }
  };

  return (
    <>
      <Toast pesan={toast} />
      <TopHeader
        judul={`Status SPMB${jenjangSingkat ? ` ${jenjangSingkat}` : ''}`}
        subjudul="Perjalanan pendaftar dari berkas masuk sampai daftar ulang."
        remah={[{ label: 'Pendaftaran' }, { label: 'Status' }]}
      />

      <div className="adm-content">
        {/* Penegasan pemisahan dua konsep yang sering tertukar. */}
        <div className="adm-banner adm-banner--info" style={{ marginBottom: 18 }}>
          <Info size={15} style={{ flexShrink: 0, marginTop: 1 }} />
          <div>
            <strong>Status Pendaftaran</strong> dan <strong>Status Pembayaran</strong> adalah dua data yang berbeda.
            Pendaftar bisa <em>Lulus Seleksi</em> tetapi <em>Belum Lunas</em> — keduanya ditampilkan berdampingan di tabel di bawah.
          </div>
        </div>

        {loading ? <SkeletonStat jumlah={5} /> : (
          <div className="adm-grid-stat" style={{ marginBottom: 20 }}>
            <StatCard label="Total Pendaftar" nilai={ringkasan.total} />
            <StatCard label="Menunggu Verifikasi" nilai={ringkasan.menunggu} nada="peringatan" />
            <StatCard label="Lulus Seleksi" nilai={ringkasan.lulus} nada="sukses" />
            <StatCard label="Daftar Ulang" nilai={ringkasan.daftarUlang} nada="info" />
            <StatCard label="Tidak Lolos" nilai={ringkasan.tidakLolos} nada="bahaya" />
          </div>
        )}

        <div className="adm-card">
          <div className="adm-card-head" style={{ flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {FILTER.map(f => (
                <button
                  key={f.key}
                  onClick={() => setFilter(f.key)}
                  className={`adm-btn adm-btn--${filter === f.key ? 'primary' : 'ghost'} adm-btn--sm`}
                >
                  {f.label}
                </button>
              ))}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 200 }}>
              <Search size={15} color="var(--adm-text-faint)" />
              <input
                className="adm-input"
                style={{ border: 'none', padding: '4px 0' }}
                placeholder="Cari nama…"
                value={cari}
                onChange={e => setCari(e.target.value)}
              />
            </div>
          </div>

          {loading ? (
            <SkeletonTabel baris={6} kolom={6} />
          ) : gagal ? (
            <ErrorState onCoba={muat} />
          ) : tersaring.length === 0 ? (
            <EmptyState
              judul="Belum ada pendaftar pada filter ini"
              pesan={jenjang ? `Jenjang ${jenjangSingkat}, tahun ajaran yang sedang dibuka.` : 'Pilih jenjang terlebih dahulu.'}
            />
          ) : (
            <div className="adm-table-wrap">
              <table className="adm-table">
                <thead>
                  <tr>
                    <th>Nama</th>
                    <th>Pilihan</th>
                    <th>Status Pendaftaran</th>
                    <th>Status Pembayaran</th>
                    <th>Daftar Ulang</th>
                    <th style={{ textAlign: 'right' }}>Tindakan</th>
                  </tr>
                </thead>
                <tbody>
                  {tersaring.map(p => {
                    const sp = labelStatusPendaftaran(p.status);
                    const sb = labelStatusPembayaran(p.statusPembayaran);
                    return (
                      <tr key={p.id}>
                        <td>
                          <Link href={`/admin/pendaftar/${p.id}`} style={{ fontWeight: 600, color: 'var(--adm-text)', textDecoration: 'none' }}>
                            {p.namaLengkap || '—'}
                          </Link>
                        </td>
                        <td style={{ fontSize: 12.5, color: 'var(--adm-text-muted)' }}>
                          {p.jurusan || p.kelas || '—'}
                        </td>
                        <td><StatusBadge teks={sp.teks} nada={sp.nada} /></td>
                        <td><StatusBadge teks={sb.teks} nada={sb.nada} /></td>
                        <td>
                          {p.sudahDaftarUlang
                            ? <StatusBadge teks="Sudah" nada="sukses" />
                            : <span style={{ fontSize: 12, color: 'var(--adm-text-faint)' }}>Belum</span>}
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <PermissionGate
                            resource="status"
                            action="update"
                            fallback={
                              <Link href={`/admin/pendaftar/${p.id}`} className="adm-btn adm-btn--ghost adm-btn--sm">
                                Lihat Detail
                              </Link>
                            }
                          >
                            <div style={{ display: 'inline-flex', gap: 6 }}>
                              <button
                                className="adm-btn adm-btn--ghost adm-btn--sm"
                                onClick={() => { setPengumuman(p); setTeksPengumuman(p.pesanPengumuman || ''); }}
                              >
                                <Megaphone size={13} /> Pengumuman
                              </button>
                              {p.status === 'diterima_berkas' && !p.sudahDaftarUlang && (
                                <button className="adm-btn adm-btn--success adm-btn--sm" onClick={() => setKonfirmasiDU(p)}>
                                  Konfirmasi Daftar Ulang
                                </button>
                              )}
                            </div>
                          </PermissionGate>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {pengumuman && (
        <Modal
          judul={`Pengumuman untuk ${pengumuman.namaLengkap || 'pendaftar'}`}
          onTutup={() => setPengumuman(null)}
          footer={
            <>
              <button className="adm-btn adm-btn--ghost" onClick={() => setPengumuman(null)} disabled={memproses}>Batal</button>
              <button
                className="adm-btn adm-btn--primary"
                disabled={memproses}
                onClick={async () => {
                  const ok = await simpan(pengumuman.id, { pesanPengumuman: teksPengumuman }, 'Pengumuman tersimpan');
                  if (ok) setPengumuman(null);
                }}
              >
                {memproses ? 'Menyimpan…' : 'Simpan Pengumuman'}
              </button>
            </>
          }
        >
          <p style={{ fontSize: 13, color: 'var(--adm-text-muted)', marginBottom: 12 }}>
            Pesan ini tampil di dashboard pendaftar. Pendaftar juga menerima notifikasi bahwa ada pengumuman baru.
          </p>
          <textarea
            className="adm-input"
            rows={5}
            value={teksPengumuman}
            onChange={e => setTeksPengumuman(e.target.value)}
            placeholder="Contoh: Selamat, Anda diterima. Daftar ulang paling lambat 30 Juni di ruang Tata Usaha."
          />
        </Modal>
      )}

      {konfirmasiDU && (
        <ConfirmModal
          judul="Konfirmasi daftar ulang?"
          pesan={`${konfirmasiDU.namaLengkap || 'Pendaftar ini'} akan ditandai sudah melakukan daftar ulang. Status pendaftarannya tetap Lulus Seleksi — daftar ulang dicatat terpisah.`}
          labelKonfirmasi="Ya, Konfirmasi"
          memproses={memproses}
          onBatal={() => setKonfirmasiDU(null)}
          onKonfirmasi={async () => {
            const ok = await simpan(konfirmasiDU.id, { sudahDaftarUlang: true }, 'Daftar ulang dikonfirmasi');
            if (ok) setKonfirmasiDU(null);
          }}
        />
      )}
    </>
  );
}
