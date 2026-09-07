'use client';

import { useCallback, useMemo, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle2, ExternalLink, FileText, RotateCcw, Search, XCircle } from 'lucide-react';
import { TopHeader } from '@/components/admin/TopHeader';
import { useAdmin } from '@/components/admin/AdminProvider';
import {
  ConfirmModal, EmptyState, ErrorState, PermissionGate,
  SkeletonTabel, StatusBadge, Toast,
} from '@/components/admin/ui';
import { useMuatData, ambilJson } from '@/components/admin/useMuatData';
import { FIELD_BERKAS, labelStatusPendaftaran } from '@/lib/labels';

// ============================================================================
// VERIFIKASI — antrean pemeriksaan BERKAS.
//
// Halaman ini murni tampilan atas data yang sudah ada: tidak ada tabel
// verifikasi per-dokumen. Status yang dipakai persis status sistem yang
// sudah berjalan:
//   verified        -> berkas masuk, menunggu diperiksa
//   diterima_berkas -> berkas terverifikasi
//   ditolak         -> ditolak, alasannya wajib diisi
// "Perlu perbaikan" diwakili pendaftar ditolak yang sudah mengirim revisi
// (revisiCount > 0), sesuai alur revisi yang sudah ada di sisi siswa.
//
// Checklist dokumen dibangun dari DokumenPersyaratan(kategori='pendaftaran')
// lewat fieldKey -> kolom file di Pendaftaran, jadi daftar berkasnya
// mengikuti apa yang diatur admin di halaman Persyaratan.
// ============================================================================

interface Persyaratan {
  id: string; jenis: string; nama: string; fieldKey: string | null;
  jenjang: string;
  wajib: boolean; aktif: boolean; urutan: number;
}

interface Pendaftar {
  id: string;
  namaLengkap: string | null;
  nisn?: string | null;
  nik?: string | null;
  jenjang?: string;
  jurusan?: string | null;
  status: string;
  alasanPenolakan?: string | null;
  revisiCount?: number;
  lastRevisiAt?: string | null;
  waVerified?: boolean;
  createdAt: string;
  userEmail?: string | null;
  [k: string]: unknown;
}

type Tab = 'verified' | 'diterima_berkas' | 'ditolak';

const TABS: { key: Tab; label: string }[] = [
  { key: 'verified', label: 'Belum Diverifikasi' },
  { key: 'diterima_berkas', label: 'Terverifikasi' },
  { key: 'ditolak', label: 'Ditolak / Perlu Perbaikan' },
];

function noPendaftaran(id: string, tgl: string) {
  return `REG-${new Date(tgl).getFullYear()}-${id.slice(0, 5).toUpperCase()}`;
}

export default function VerifikasiPage() {
  return <Suspense fallback={null}><VerifikasiInner /></Suspense>;
}

function VerifikasiInner() {
  const searchParams = useSearchParams();
  const { jenjang, jenjangSingkat, can } = useAdmin();
  const tahunAjaranId = searchParams.get('tahunAjaranId') || '';

  const [tab, setTab] = useState<Tab>('verified');
  const [cari, setCari] = useState('');
  const [dipilih, setDipilih] = useState<Pendaftar | null>(null);
  const [konfirmasi, setKonfirmasi] = useState<'terima' | 'tolak' | null>(null);
  const [alasan, setAlasan] = useState('');
  const [memproses, setMemproses] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const beriToast = (m: string) => { setToast(m); setTimeout(() => setToast(null), 3000); };

  const ambil = useCallback(
    async (sinyal: AbortSignal) => {
      const qp = new URLSearchParams({ status: tab });
      if (jenjang) qp.set('jenjang', jenjang);
      if (tahunAjaranId) qp.set('tahunAjaranId', tahunAjaranId);

      const qs = new URLSearchParams({ kategori: 'pendaftaran' });
      if (jenjang) qs.set('jenjang', jenjang);
      if (tahunAjaranId) qs.set('tahunAjaranId', tahunAjaranId);

      const [p, s] = await Promise.all([
        ambilJson<{ data: Pendaftar[] }>(`/api/admin/pendaftar?${qp}`, sinyal),
        // Persyaratan opsional: kalau role ini tidak boleh membacanya,
        // checklist berkas kosong tapi antreannya tetap tampil.
        ambilJson<{ data: Persyaratan[] }>(`/api/admin/persyaratan?${qs}`, sinyal).catch(() => ({ data: [] })),
      ]);
      return {
        rows: p.data ?? [],
        syarat: (s.data ?? []).filter(x => x.aktif && x.fieldKey),
      };
    },
    [tab, jenjang, tahunAjaranId],
  );

  const { data, loading, gagal, muatUlang: muat } = useMuatData(ambil, [tab, jenjang, tahunAjaranId]);
  const rows = data?.rows ?? [];
  const syarat = data?.syarat ?? [];

  const tersaring = useMemo(() => {
    const q = cari.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(r =>
      (r.namaLengkap || '').toLowerCase().includes(q) ||
      (r.nisn || '').includes(q) ||
      (r.nik || '').includes(q),
    );
  }, [rows, cari]);

  const simpanStatus = async (status: 'diterima_berkas' | 'ditolak') => {
    if (!dipilih) return;
    setMemproses(true);
    try {
      const res = await fetch(`/api/admin/pendaftar/${dipilih.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(
          status === 'ditolak'
            ? { status, alasanPenolakan: alasan }
            : { status },
        ),
      });
      if (!res.ok) {
        const e = await res.json().catch(() => null);
        beriToast(e?.error || 'Gagal menyimpan perubahan');
        return;
      }
      beriToast(status === 'ditolak' ? 'Berkas ditolak' : 'Berkas diverifikasi');
      setKonfirmasi(null);
      setDipilih(null);
      setAlasan('');
      muat();
    } finally {
      setMemproses(false);
    }
  };

  // Checklist berkas milik SATU pendaftar, jadi persyaratannya harus
  // persyaratan jenjang pendaftar itu sendiri.
  //
  // Ketika admin belum memilih jenjang, /api/admin/persyaratan mengirim baris
  // untuk KETIGA jenjang. Dulu semuanya dipetakan apa adanya, sehingga tiap
  // berkas muncul tiga kali (18 baris, bukan 6) — dan yang lebih berbahaya,
  // hitungan "berkas wajib lengkap" ikut terkali tiga sehingga tidak pernah
  // bisa terpenuhi. Nama berkas yang sama di tiga jenjang itu pula yang
  // memicu peringatan duplicate key React.
  const berkasDari = (p: Pendaftar) => {
    const sesuaiJenjang = p.jenjang ? syarat.filter(s => s.jenjang === p.jenjang) : [];
    // Cadangan: pendaftar tanpa jenjang (data lama) tetap dapat checklist —
    // ambil satu wakil per fieldKey supaya tidak ada berkas ganda.
    const dipakai = sesuaiJenjang.length > 0
      ? sesuaiJenjang
      : syarat.filter((s, i, arr) => arr.findIndex(x => x.fieldKey === s.fieldKey) === i);

    return dipakai.map(s => ({
      id: s.id,
      nama: s.nama,
      wajib: s.wajib,
      url: (p[s.fieldKey as string] as string | null) || null,
      label: FIELD_BERKAS[s.fieldKey as string] || s.nama,
    }));
  };

  const bolehUbah = can('verifikasi', 'update');

  return (
    <>
      <Toast pesan={toast} />
      <TopHeader
        judul={`Verifikasi${jenjangSingkat ? ` ${jenjangSingkat}` : ''}`}
        subjudul="Pemeriksaan kelengkapan dan keabsahan berkas pendaftaran."
        remah={[{ label: 'Pendaftaran' }, { label: 'Verifikasi' }]}
      />

      <div className="adm-content">
        <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
          {TABS.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`adm-btn adm-btn--${tab === t.key ? 'primary' : 'ghost'} adm-btn--sm`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="adm-card">
          <div className="adm-card-head">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, maxWidth: 340 }}>
              <Search size={15} color="var(--adm-text-faint)" />
              <input
                className="adm-input"
                style={{ border: 'none', padding: '4px 0' }}
                placeholder="Cari nama, NISN, atau NIK…"
                value={cari}
                onChange={e => setCari(e.target.value)}
              />
            </div>
            <span style={{ fontSize: 12, color: 'var(--adm-text-muted)' }}>
              {loading ? '…' : `${tersaring.length} pendaftar`}
            </span>
          </div>

          {loading ? (
            <SkeletonTabel baris={5} kolom={5} />
          ) : gagal ? (
            <ErrorState onCoba={muat} />
          ) : tersaring.length === 0 ? (
            <EmptyState
              judul={
                tab === 'verified'
                  ? 'Tidak ada berkas yang menunggu verifikasi'
                  : tab === 'diterima_berkas'
                    ? 'Belum ada berkas yang terverifikasi'
                    : 'Tidak ada berkas yang ditolak'
              }
              pesan={
                jenjang
                  ? `Untuk jenjang ${jenjangSingkat} pada tahun ajaran yang sedang dibuka.`
                  : 'Pilih jenjang terlebih dahulu untuk melihat antrean verifikasi.'
              }
            />
          ) : (
            <div className="adm-table-wrap">
              <table className="adm-table">
                <thead>
                  <tr>
                    <th>Nama</th>
                    <th>No. Pendaftaran</th>
                    <th>Kelengkapan Berkas</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'right' }}>Tindakan</th>
                  </tr>
                </thead>
                <tbody>
                  {tersaring.map(p => {
                    const berkas = berkasDari(p);
                    const wajib = berkas.filter(b => b.wajib);
                    const lengkap = wajib.filter(b => b.url).length;
                    const semuaAda = wajib.length > 0 && lengkap === wajib.length;
                    const st = labelStatusPendaftaran(p.status);

                    return (
                      <tr key={p.id}>
                        <td>
                          <div style={{ fontWeight: 600 }}>{p.namaLengkap || '—'}</div>
                          <div style={{ fontSize: 11.5, color: 'var(--adm-text-muted)' }}>
                            {p.userEmail || 'Pendaftar offline'}
                          </div>
                        </td>
                        <td style={{ fontFamily: 'ui-monospace, monospace', fontSize: 12 }}>
                          {noPendaftaran(p.id, p.createdAt)}
                        </td>
                        <td>
                          {wajib.length === 0 ? (
                            <span style={{ fontSize: 12, color: 'var(--adm-text-faint)' }}>Persyaratan belum diatur</span>
                          ) : (
                            <StatusBadge
                              teks={`${lengkap}/${wajib.length} berkas wajib`}
                              nada={semuaAda ? 'sukses' : 'peringatan'}
                            />
                          )}
                          {(p.revisiCount ?? 0) > 0 && (
                            <div style={{ fontSize: 11, color: 'var(--adm-info)', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                              <RotateCcw size={11} /> Revisi ke-{p.revisiCount}
                            </div>
                          )}
                        </td>
                        <td><StatusBadge teks={st.teks} nada={st.nada} /></td>
                        <td style={{ textAlign: 'right' }}>
                          <button
                            className="adm-btn adm-btn--ghost adm-btn--sm"
                            onClick={() => setDipilih(p)}
                          >
                            Periksa
                          </button>
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

      {/* -------- Panel pemeriksaan berkas -------- */}
      {dipilih && !konfirmasi && (
        <div className="adm-overlay" onClick={e => { if (e.target === e.currentTarget) setDipilih(null); }}>
          <div className="adm-modal" style={{ maxWidth: 620 }}>
            <div className="adm-card-head">
              <div>
                <div className="adm-card-title">{dipilih.namaLengkap || 'Pendaftar'}</div>
                <div style={{ fontSize: 11.5, color: 'var(--adm-text-muted)', marginTop: 2 }}>
                  {noPendaftaran(dipilih.id, dipilih.createdAt)}
                  {dipilih.jurusan ? ` · ${dipilih.jurusan}` : ''}
                </div>
              </div>
              <button onClick={() => setDipilih(null)} aria-label="Tutup" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--adm-text-muted)' }}>
                <XCircle size={18} />
              </button>
            </div>

            <div style={{ padding: '16px 20px' }}>
              <div className="adm-label">Berkas Persyaratan</div>
              {berkasDari(dipilih).length === 0 ? (
                <p style={{ fontSize: 13, color: 'var(--adm-text-muted)' }}>
                  Persyaratan berkas untuk jenjang ini belum diatur.{' '}
                  <Link href="/admin/persyaratan" style={{ color: 'var(--adm-primary)' }}>Atur sekarang →</Link>
                </p>
              ) : (
                <div style={{ display: 'grid', gap: 8 }}>
                  {berkasDari(dipilih).map(b => (
                    <div
                      key={b.id}
                      style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10,
                        padding: '9px 12px', border: '1px solid var(--adm-border)',
                        borderRadius: 'var(--adm-r-sm)', background: 'var(--adm-surface-alt)',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 9, minWidth: 0 }}>
                        <FileText size={15} color="var(--adm-text-faint)" style={{ flexShrink: 0 }} />
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontSize: 13, fontWeight: 550, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {b.label}
                          </div>
                          {!b.wajib && <div style={{ fontSize: 11, color: 'var(--adm-text-faint)' }}>Opsional</div>}
                        </div>
                      </div>
                      {b.url ? (
                        <a href={b.url} target="_blank" rel="noopener noreferrer" className="adm-btn adm-btn--ghost adm-btn--sm">
                          Lihat <ExternalLink size={12} />
                        </a>
                      ) : (
                        <StatusBadge teks={b.wajib ? 'Belum diunggah' : 'Tidak ada'} nada={b.wajib ? 'bahaya' : 'netral'} />
                      )}
                    </div>
                  ))}
                </div>
              )}

              {dipilih.alasanPenolakan && (
                <div className="adm-banner adm-banner--danger" style={{ marginTop: 14 }}>
                  <div><strong>Alasan penolakan sebelumnya:</strong> {dipilih.alasanPenolakan}</div>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, padding: '12px 20px', borderTop: '1px solid var(--adm-border)', background: 'var(--adm-surface-alt)' }}>
              <Link href={`/admin/pendaftar/${dipilih.id}`} className="adm-btn adm-btn--ghost adm-btn--sm">
                Buka Detail Lengkap
              </Link>
              <PermissionGate
                resource="verifikasi"
                action="update"
                fallback={<span style={{ fontSize: 12, color: 'var(--adm-text-muted)' }}>Mode tampilan</span>}
              >
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="adm-btn adm-btn--danger adm-btn--sm" onClick={() => setKonfirmasi('tolak')}>
                    <XCircle size={14} /> Tolak
                  </button>
                  <button className="adm-btn adm-btn--success adm-btn--sm" onClick={() => setKonfirmasi('terima')}>
                    <CheckCircle2 size={14} /> Verifikasi
                  </button>
                </div>
              </PermissionGate>
            </div>
          </div>
        </div>
      )}

      {/* -------- Konfirmasi -------- */}
      {konfirmasi === 'terima' && dipilih && bolehUbah && (
        <ConfirmModal
          judul="Verifikasi berkas pendaftar?"
          pesan={`Berkas ${dipilih.namaLengkap || 'pendaftar ini'} akan dinyatakan terverifikasi, dan pendaftar menerima notifikasi.`}
          labelKonfirmasi="Ya, Verifikasi"
          nada="primary"
          memproses={memproses}
          onBatal={() => setKonfirmasi(null)}
          onKonfirmasi={() => simpanStatus('diterima_berkas')}
        />
      )}

      {konfirmasi === 'tolak' && dipilih && bolehUbah && (
        <ConfirmModal
          judul="Tolak berkas pendaftar?"
          pesan="Pendaftar akan diminta memperbaiki berkasnya. Tuliskan alasan yang jelas agar mereka tahu apa yang harus diperbaiki."
          labelKonfirmasi="Tolak Berkas"
          nada="danger"
          memproses={memproses}
          detail={
            <div>
              <label className="adm-label" htmlFor="alasan">Alasan penolakan</label>
              <textarea
                id="alasan"
                className="adm-input"
                rows={3}
                value={alasan}
                onChange={e => setAlasan(e.target.value)}
                placeholder="Contoh: Scan Kartu Keluarga tidak terbaca, mohon unggah ulang."
              />
            </div>
          }
          onBatal={() => setKonfirmasi(null)}
          onKonfirmasi={() => {
            if (!alasan.trim()) { beriToast('Alasan penolakan wajib diisi'); return; }
            simpanStatus('ditolak');
          }}
        />
      )}
    </>
  );
}
