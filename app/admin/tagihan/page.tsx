'use client';

import { useCallback, useMemo, useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Info, Search } from 'lucide-react';
import { TopHeader } from '@/components/admin/TopHeader';
import { useAdmin } from '@/components/admin/AdminProvider';
import { useMuatData, ambilJson } from '@/components/admin/useMuatData';
import {
  EmptyState, ErrorState, ReadOnlyBanner, SkeletonStat, SkeletonTabel,
  StatCard, StatusBadge,
} from '@/components/admin/ui';
import { labelStatusPembayaran } from '@/lib/labels';
import { formatRupiah } from '@/lib/pembayaran-utils';

// ============================================================================
// TAGIHAN — berapa yang HARUS dibayar tiap pendaftar.
//
// Rantainya: Harga (aturan) − Diskon (aturan) = Tagihan (per pendaftar)
//            → Pembayaran (uang masuk) → Transaksi (riwayat).
// Halaman ini berhenti di Tagihan; uang yang benar-benar masuk ada di menu
// Pembayaran, riwayatnya di menu Transaksi.
// ============================================================================

interface Baris {
  id: string;
  namaLengkap: string | null;
  pilihan: string | null;
  hargaPokok: number | null;
  gelombang: string | null;
  gelombangDiskonNominal: number;
  diskonNama: string | null;
  diskonNominal: number;
  totalTagihan: number | null;
  terkunci: boolean;
  totalDibayar: number;
  sisaBayar: number;
  kelebihanBayar: number;
  statusPembayaran: string;
}

interface Ringkasan {
  jumlahPendaftar: number;
  totalTagihan: number;
  totalDibayar: number;
  totalSisa: number;
  belumTerkunci: number;
  tanpaTagihan: number;
}

const FILTER = [
  { key: '', label: 'Semua' },
  { key: 'belum_lunas', label: 'Belum Lunas' },
  { key: 'belum_terkunci', label: 'Belum Terkunci' },
  { key: 'tanpa_tagihan', label: 'Tanpa Tagihan' },
];

export default function TagihanPage() {
  return <Suspense fallback={null}><TagihanInner /></Suspense>;
}

function TagihanInner() {
  const searchParams = useSearchParams();
  const { jenjang, jenjangSingkat } = useAdmin();
  const tahunAjaranId = searchParams.get('tahunAjaranId') || '';

  const [filter, setFilter] = useState('');
  const [cari, setCari] = useState('');

  const ambil = useCallback(
    (sinyal: AbortSignal) => {
      const qp = new URLSearchParams();
      if (jenjang) qp.set('jenjang', jenjang);
      if (tahunAjaranId) qp.set('tahunAjaranId', tahunAjaranId);
      return ambilJson<{ data: Baris[]; ringkasan: Ringkasan | null }>(`/api/admin/tagihan?${qp}`, sinyal);
    },
    [jenjang, tahunAjaranId],
  );

  const { data, loading, gagal, muatUlang } = useMuatData(ambil, [jenjang, tahunAjaranId]);
  const rows = useMemo(() => data?.data ?? [], [data]);
  const ringkasan = data?.ringkasan ?? null;

  const tersaring = useMemo(() => {
    const q = cari.trim().toLowerCase();
    return rows.filter(r => {
      if (q && !(r.namaLengkap || '').toLowerCase().includes(q)) return false;
      if (filter === 'belum_lunas') return r.sisaBayar > 0;
      if (filter === 'belum_terkunci') return !r.terkunci;
      if (filter === 'tanpa_tagihan') return !r.totalTagihan;
      return true;
    });
  }, [rows, filter, cari]);

  return (
    <>
      <TopHeader
        judul={`Tagihan${jenjangSingkat ? ` ${jenjangSingkat}` : ''}`}
        subjudul="Jumlah yang harus dibayar tiap pendaftar, hasil Harga dikurangi Diskon."
        remah={[{ label: 'Keuangan' }, { label: 'Tagihan' }]}
      />

      <div className="adm-content">
        <ReadOnlyBanner
          resource="tagihan"
          pesan="Anda dapat melihat seluruh tagihan. Penyesuaian nilai tagihan hanya dapat dilakukan oleh Admin Keuangan."
        />

        {loading ? <SkeletonStat jumlah={4} /> : ringkasan && (
          <div className="adm-grid-stat" style={{ marginBottom: 20 }}>
            <StatCard label="Total Tagihan" nilai={formatRupiah(ringkasan.totalTagihan)} keterangan={`${ringkasan.jumlahPendaftar} pendaftar`} />
            <StatCard label="Sudah Dibayar" nilai={formatRupiah(ringkasan.totalDibayar)} nada="sukses" />
            <StatCard label="Belum Tertagih" nilai={formatRupiah(ringkasan.totalSisa)} nada={ringkasan.totalSisa > 0 ? 'peringatan' : 'sukses'} />
            <StatCard
              label="Belum Terkunci"
              nilai={ringkasan.belumTerkunci}
              nada={ringkasan.belumTerkunci > 0 ? 'info' : 'netral'}
              keterangan="Tagihan masih mengikuti harga terbaru"
            />
          </div>
        )}

        <div className="adm-banner adm-banner--info" style={{ marginBottom: 16 }}>
          <Info size={15} style={{ flexShrink: 0, marginTop: 1 }} />
          <div>
            Tagihan <strong>dikunci</strong> saat pendaftar melakukan pembayaran pertama, supaya nominal
            yang sudah disepakati tidak berubah ketika harga diperbarui. Yang belum terkunci akan
            mengikuti harga terbaru secara otomatis.
          </div>
        </div>

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
            <SkeletonTabel baris={6} kolom={7} />
          ) : gagal ? (
            <ErrorState onCoba={muatUlang} />
          ) : tersaring.length === 0 ? (
            <EmptyState
              judul="Belum ada tagihan pada filter ini"
              pesan={jenjang ? `Jenjang ${jenjangSingkat}, tahun ajaran yang sedang dibuka.` : 'Pilih jenjang terlebih dahulu.'}
            />
          ) : (
            <div className="adm-table-wrap">
              <table className="adm-table">
                <thead>
                  <tr>
                    <th style={{ width: 44 }}>No</th>
                    <th>Pendaftar</th>
                    <th style={{ textAlign: 'right' }}>Harga Pokok</th>
                    <th style={{ textAlign: 'right' }}>Diskon</th>
                    <th style={{ textAlign: 'right' }}>Tagihan</th>
                    <th style={{ textAlign: 'right' }}>Dibayar</th>
                    <th style={{ textAlign: 'right' }}>Sisa</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {tersaring.map((r, i) => {
                    const totalDiskon = r.diskonNominal + r.gelombangDiskonNominal;
                    const sb = labelStatusPembayaran(r.statusPembayaran);
                    return (
                      <tr key={r.id}>
                        <td style={{ color: 'var(--adm-text-faint)', fontSize: 12 }}>{String(i + 1).padStart(2, '0')}</td>
                        <td>
                          <Link href={`/admin/pendaftar/${r.id}`} style={{ fontWeight: 600, color: 'var(--adm-text)', textDecoration: 'none' }}>
                            {r.namaLengkap || '—'}
                          </Link>
                          <div style={{ fontSize: 11.5, color: 'var(--adm-text-muted)' }}>
                            {r.pilihan || '—'}{r.gelombang ? ` · ${r.gelombang}` : ''}
                          </div>
                        </td>
                        <td style={{ textAlign: 'right' }}>{r.hargaPokok ? formatRupiah(r.hargaPokok) : '—'}</td>
                        <td style={{ textAlign: 'right', color: totalDiskon > 0 ? 'var(--adm-success)' : undefined }}>
                          {totalDiskon > 0 ? `− ${formatRupiah(totalDiskon)}` : '—'}
                          {r.diskonNama && (
                            <div style={{ fontSize: 11, color: 'var(--adm-text-muted)' }}>{r.diskonNama}</div>
                          )}
                        </td>
                        <td style={{ textAlign: 'right', fontWeight: 650 }}>
                          {r.totalTagihan ? formatRupiah(r.totalTagihan) : <span style={{ color: 'var(--adm-text-faint)' }}>Belum dihitung</span>}
                          <div style={{ marginTop: 3 }}>
                            <StatusBadge teks={r.terkunci ? 'Terkunci' : 'Mengikuti harga'} nada={r.terkunci ? 'netral' : 'info'} />
                          </div>
                        </td>
                        <td style={{ textAlign: 'right', color: 'var(--adm-success)' }}>{formatRupiah(r.totalDibayar)}</td>
                        <td style={{ textAlign: 'right', fontWeight: 650, color: r.sisaBayar > 0 ? 'var(--adm-warning)' : 'var(--adm-success)' }}>
                          {formatRupiah(r.sisaBayar)}
                          {r.kelebihanBayar > 0 && (
                            <div style={{ fontSize: 11, color: 'var(--adm-info)' }}>
                              lebih {formatRupiah(r.kelebihanBayar)}
                            </div>
                          )}
                        </td>
                        <td><StatusBadge teks={sb.teks} nada={sb.nada} /></td>
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
