'use client';

import { useCallback, useMemo, useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Printer, Search } from 'lucide-react';
import { TopHeader } from '@/components/admin/TopHeader';
import { useAdmin } from '@/components/admin/AdminProvider';
import { useMuatData, ambilJson } from '@/components/admin/useMuatData';
import {
  EmptyState, ErrorState, PermissionGate, ReadOnlyBanner,
  SkeletonStat, SkeletonTabel, StatCard, StatusBadge,
} from '@/components/admin/ui';
import { JENIS_TRANSAKSI, STATUS_TRANSAKSI } from '@/lib/labels';
import { formatRupiah } from '@/lib/pembayaran-utils';

// ============================================================================
// TRANSAKSI — buku besar seluruh pergerakan uang.
//
//   bayar   : uang masuk dari pendaftar
//   refund  : kelebihan bayar dikembalikan ke pendaftar
//   alokasi : kelebihan bayar dialihkan ke pos lain (uang tetap di sekolah)
//
// Hanya transaksi berstatus terverifikasi yang dihitung ke total — yang masih
// menunggu belum boleh dianggap uang nyata.
// ============================================================================

interface Baris {
  id: string;
  pendaftaranId: string;
  nama: string | null;
  jenjang: string;
  jenis: string;
  angsuranKe: number;
  nominal: number;
  metodePembayaran: string;
  bankPengirim: string | null;
  namaPengirim: string | null;
  kategoriAlokasi: string | null;
  alasanRefund: string | null;
  status: string;
  tanggalBayar: string;
  tanggalVerifikasi: string | null;
}

interface Ringkasan {
  jumlahTransaksi: number;
  totalBayar: number;
  totalRefund: number;
  totalAlokasi: number;
  menungguVerifikasi: number;
}

const FILTER_JENIS = [
  { key: '', label: 'Semua Jenis' },
  { key: 'bayar', label: 'Pembayaran' },
  { key: 'refund', label: 'Pengembalian' },
  { key: 'alokasi', label: 'Alokasi' },
];

const tglJam = (v: string) =>
  new Date(v).toLocaleString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

export default function TransaksiPage() {
  return <Suspense fallback={null}><TransaksiInner /></Suspense>;
}

function TransaksiInner() {
  const searchParams = useSearchParams();
  const { jenjang, jenjangSingkat } = useAdmin();
  const tahunAjaranId = searchParams.get('tahunAjaranId') || '';

  const [jenis, setJenis] = useState('');
  const [cari, setCari] = useState('');

  const ambil = useCallback(
    (sinyal: AbortSignal) => {
      const qp = new URLSearchParams();
      if (jenjang) qp.set('jenjang', jenjang);
      if (tahunAjaranId) qp.set('tahunAjaranId', tahunAjaranId);
      if (jenis) qp.set('jenis', jenis);
      return ambilJson<{ data: Baris[]; ringkasan: Ringkasan | null }>(`/api/admin/transaksi?${qp}`, sinyal);
    },
    [jenjang, tahunAjaranId, jenis],
  );

  const { data, loading, gagal, muatUlang } = useMuatData(ambil, [jenjang, tahunAjaranId, jenis]);
  const rows = useMemo(() => data?.data ?? [], [data]);
  const ringkasan = data?.ringkasan ?? null;

  const tersaring = useMemo(() => {
    const q = cari.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(r => (r.nama || '').toLowerCase().includes(q));
  }, [rows, cari]);

  return (
    <>
      <TopHeader
        judul={`Transaksi${jenjangSingkat ? ` ${jenjangSingkat}` : ''}`}
        subjudul="Riwayat lengkap pembayaran, pengembalian, dan alokasi dana."
        remah={[{ label: 'Keuangan' }, { label: 'Transaksi' }]}
        aksi={
          <PermissionGate resource="laporan_keuangan" action="export">
            <Link
              href={`/admin/laporan/keuangan${jenjang ? `?jenjang=${jenjang}` : ''}`}
              className="adm-btn adm-btn--ghost adm-btn--sm"
            >
              Buka Laporan Keuangan
            </Link>
          </PermissionGate>
        }
      />

      <div className="adm-content">
        <ReadOnlyBanner
          resource="transaksi"
          pesan="Anda dapat melihat dan mengekspor riwayat transaksi. Perubahan transaksi hanya dapat dilakukan oleh Admin Keuangan."
        />

        {loading ? <SkeletonStat jumlah={4} /> : ringkasan && (
          <div className="adm-grid-stat" style={{ marginBottom: 20 }}>
            <StatCard label="Uang Masuk" nilai={formatRupiah(ringkasan.totalBayar)} nada="sukses" keterangan="Terverifikasi" />
            <StatCard label="Pengembalian" nilai={formatRupiah(ringkasan.totalRefund)} nada={ringkasan.totalRefund > 0 ? 'peringatan' : 'netral'} />
            <StatCard label="Alokasi ke Pos Lain" nilai={formatRupiah(ringkasan.totalAlokasi)} nada="info" />
            <StatCard
              label="Menunggu Verifikasi"
              nilai={ringkasan.menungguVerifikasi}
              nada={ringkasan.menungguVerifikasi > 0 ? 'peringatan' : 'netral'}
              keterangan="Belum dihitung sebagai uang masuk"
            />
          </div>
        )}

        <div className="adm-card">
          <div className="adm-card-head" style={{ flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {FILTER_JENIS.map(f => (
                <button
                  key={f.key}
                  onClick={() => setJenis(f.key)}
                  className={`adm-btn adm-btn--${jenis === f.key ? 'primary' : 'ghost'} adm-btn--sm`}
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
                placeholder="Cari nama pendaftar…"
                value={cari}
                onChange={e => setCari(e.target.value)}
              />
            </div>
          </div>

          {loading ? (
            <SkeletonTabel baris={7} kolom={6} />
          ) : gagal ? (
            <ErrorState onCoba={muatUlang} />
          ) : tersaring.length === 0 ? (
            <EmptyState
              judul="Belum ada transaksi pembayaran"
              pesan={jenjang ? `Jenjang ${jenjangSingkat}, tahun ajaran yang sedang dibuka.` : 'Pilih jenjang terlebih dahulu.'}
            />
          ) : (
            <>
              <div className="adm-table-wrap">
                <table className="adm-table">
                  <thead>
                    <tr>
                      <th style={{ width: 44 }}>No</th>
                      <th>Pendaftar</th>
                      <th>Jenis</th>
                      <th style={{ textAlign: 'right' }}>Nominal</th>
                      <th>Metode</th>
                      <th>Tanggal</th>
                      <th>Status</th>
                      <th style={{ textAlign: 'right' }}>Bukti</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tersaring.map((t, i) => {
                      const jt = JENIS_TRANSAKSI[t.jenis] ?? { teks: t.jenis, nada: 'netral' as const };
                      const st = STATUS_TRANSAKSI[t.status] ?? { teks: t.status, nada: 'netral' as const };
                      return (
                        <tr key={t.id}>
                          <td style={{ color: 'var(--adm-text-faint)', fontSize: 12 }}>{String(i + 1).padStart(2, '0')}</td>
                          <td>
                            <Link href={`/admin/pendaftar/${t.pendaftaranId}`} style={{ fontWeight: 600, color: 'var(--adm-text)', textDecoration: 'none' }}>
                              {t.nama || '—'}
                            </Link>
                            <div style={{ fontSize: 11.5, color: 'var(--adm-text-muted)' }}>{t.jenjang.toUpperCase()}</div>
                          </td>
                          <td>
                            <StatusBadge teks={jt.teks} nada={jt.nada} />
                            {t.kategoriAlokasi && <div style={{ fontSize: 11, color: 'var(--adm-text-muted)', marginTop: 3 }}>{t.kategoriAlokasi}</div>}
                            {t.alasanRefund && <div style={{ fontSize: 11, color: 'var(--adm-text-muted)', marginTop: 3, maxWidth: 160 }}>{t.alasanRefund}</div>}
                          </td>
                          <td style={{ textAlign: 'right', fontWeight: 650, color: t.jenis === 'refund' ? 'var(--adm-warning)' : undefined }}>
                            {t.jenis === 'refund' ? '− ' : ''}{formatRupiah(t.nominal)}
                          </td>
                          <td style={{ fontSize: 12.5 }}>
                            {t.metodePembayaran === 'offline' ? 'Tunai / Loket'
                              : t.metodePembayaran === 'online' ? 'Transfer'
                              : t.metodePembayaran === 'internal' ? 'Internal' : t.metodePembayaran}
                            {t.bankPengirim && <div style={{ fontSize: 11, color: 'var(--adm-text-muted)' }}>{t.bankPengirim}</div>}
                          </td>
                          <td style={{ fontSize: 12.5, whiteSpace: 'nowrap' }}>{tglJam(t.tanggalBayar)}</td>
                          <td><StatusBadge teks={st.teks} nada={st.nada} /></td>
                          <td style={{ textAlign: 'right' }}>
                            <Link href={`/admin/kwitansi/${t.pendaftaranId}`} className="adm-btn adm-btn--ghost adm-btn--sm">
                              <Printer size={13} /> Kwitansi
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <div style={{ padding: '12px 20px', borderTop: '1px solid var(--adm-border)', fontSize: 12, color: 'var(--adm-text-muted)' }}>
                Menampilkan {tersaring.length} transaksi
                {rows.length >= 500 && ' (maksimum 500 terbaru — gunakan Laporan Keuangan untuk rekap penuh)'}
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
