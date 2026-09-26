'use client';

import { useCallback, useMemo, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { RotateCcw, Search } from 'lucide-react';
import { TopHeader } from '@/components/admin/TopHeader';
import { useAdmin } from '@/components/admin/AdminProvider';
import { EmptyState, ErrorState, SkeletonTabel, StatusBadge } from '@/components/admin/ui';
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
// Kolom "Kelengkapan Berkas" dibangun dari DokumenPersyaratan(kategori=
// 'pendaftaran') lewat fieldKey -> kolom file di Pendaftaran, jadi
// hitungannya mengikuti apa yang diatur admin di halaman Persyaratan.
//
// "Periksa" TIDAK membuka panel di halaman ini — langsung ke tab Verifikasi
// pada Detail Pendaftar, yang sudah jadi satu-satunya tempat pemeriksaan
// berkas sesungguhnya berlangsung (checklist per-dokumen, Setujui Semua,
// Tolak Berkas, gerbang keuangan). Menduplikasi aksi itu di sini hanya
// membuat dua tempat yang bisa berbeda perilaku.
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
  noPendaftaran?: string | null;
  [k: string]: unknown;
}

type Tab = 'verified' | 'diterima_berkas' | 'ditolak';

const TABS: { key: Tab; label: string }[] = [
  { key: 'verified', label: 'Belum Diverifikasi' },
  { key: 'diterima_berkas', label: 'Terverifikasi' },
  { key: 'ditolak', label: 'Ditolak / Perlu Perbaikan' },
];

// Format resmi "SPMB/0001/SMP/2026-2027/A7K9" (lihat lib/nomorPendaftaran.ts)
// dibuat sekali saat formulir dikirim dan disimpan di kolom noPendaftaran —
// cukup ditampilkan apa adanya. Baris lawas dari sebelum kolom itu ada belum
// punya nomor resmi; REG-YYYY-XXXXX murni jaring pengaman, bukan format baru.
function nomorTampil(p: Pendaftar) {
  return p.noPendaftaran || `REG-${new Date(p.createdAt).getFullYear()}-${p.id.slice(0, 5).toUpperCase()}`;
}

export default function VerifikasiPage() {
  return <Suspense fallback={null}><VerifikasiInner /></Suspense>;
}

function VerifikasiInner() {
  const searchParams = useSearchParams();
  const { jenjang, jenjangSingkat, href } = useAdmin();
  const tahunAjaranId = searchParams.get('tahunAjaranId') || '';

  const [tab, setTab] = useState<Tab>('verified');
  const [cari, setCari] = useState('');

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

  return (
    <>
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
                          {nomorTampil(p)}
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
                          <Link
                            href={href(`/admin/pendaftar/${p.id}`, { jenjang: p.jenjang || jenjang })}
                            className="adm-btn adm-btn--ghost adm-btn--sm"
                          >
                            Periksa
                          </Link>
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
    </>
  );
}
