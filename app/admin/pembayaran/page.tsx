'use client';

import { useCallback, useMemo, useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { CheckCircle2, ExternalLink, XCircle } from 'lucide-react';
import { TopHeader } from '@/components/admin/TopHeader';
import { useAdmin } from '@/components/admin/AdminProvider';
import { useMuatData, ambilJson } from '@/components/admin/useMuatData';
import {
  ConfirmModal, EmptyState, ErrorState, PermissionGate, ReadOnlyBanner,
  SkeletonTabel, StatCard, StatusBadge, Toast,
} from '@/components/admin/ui';
import { JENIS_TRANSAKSI, STATUS_TRANSAKSI } from '@/lib/labels';
import { formatRupiah } from '@/lib/pembayaran-utils';

// ============================================================================
// PEMBAYARAN — antrean verifikasi uang masuk.
//
// Ini uang yang BENAR-BENAR disetorkan pendaftar, berbeda dari Tagihan
// (jumlah yang seharusnya dibayar). Memverifikasi di sini otomatis
// memperbarui status pembayaran pendaftar lewat recalculatePembayaran().
//
// Front Office boleh melihat halaman ini, tapi tombol Verifikasi/Tolak hanya
// muncul untuk Admin Keuangan dan Super Admin.
// ============================================================================

interface Baris {
  id: string;
  pendaftaranId: string;
  nama: string | null;
  jenjang: string;
  totalTagihan: number | null;
  jenis: string;
  angsuranKe: number;
  nominal: number;
  metodePembayaran: string;
  bankPengirim: string | null;
  namaPengirim: string | null;
  buktiPembayaran: string | null;
  status: string;
  catatanAdmin: string | null;
  tanggalBayar: string;
}

const TABS = [
  { key: 'menunggu_verifikasi', label: 'Menunggu Verifikasi' },
  { key: 'lunas', label: 'Terverifikasi' },
  { key: 'ditolak', label: 'Ditolak' },
  { key: 'semua', label: 'Semua' },
];

const tglJam = (v: string) =>
  new Date(v).toLocaleString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

export default function PembayaranPage() {
  return <Suspense fallback={null}><PembayaranInner /></Suspense>;
}

function PembayaranInner() {
  const searchParams = useSearchParams();
  const { jenjang, jenjangSingkat } = useAdmin();
  const tahunAjaranId = searchParams.get('tahunAjaranId') || '';

  const [tab, setTab] = useState('menunggu_verifikasi');
  const [aksi, setAksi] = useState<{ baris: Baris; jenis: 'verifikasi' | 'tolak' } | null>(null);
  const [catatan, setCatatan] = useState('');
  const [memproses, setMemproses] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const beriToast = (m: string) => { setToast(m); setTimeout(() => setToast(null), 3000); };

  const ambil = useCallback(
    (sinyal: AbortSignal) => {
      const qp = new URLSearchParams({ status: tab });
      if (jenjang) qp.set('jenjang', jenjang);
      if (tahunAjaranId) qp.set('tahunAjaranId', tahunAjaranId);
      return ambilJson<{ data: Baris[]; ringkasan: { jumlah: number; nominal: number } | null }>(
        `/api/admin/pembayaran?${qp}`, sinyal,
      );
    },
    [tab, jenjang, tahunAjaranId],
  );

  const { data, loading, gagal, muatUlang } = useMuatData(ambil, [tab, jenjang, tahunAjaranId]);
  const rows = useMemo(() => data?.data ?? [], [data]);
  const ringkasan = data?.ringkasan ?? null;

  const simpan = async () => {
    if (!aksi) return;
    setMemproses(true);
    try {
      const res = await fetch(`/api/admin/pembayaran/${aksi.baris.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: aksi.jenis === 'verifikasi' ? 'lunas' : 'ditolak',
          catatanAdmin: catatan || null,
        }),
      });
      if (!res.ok) {
        const e = await res.json().catch(() => null);
        beriToast(e?.error || 'Gagal menyimpan');
        return;
      }
      beriToast(aksi.jenis === 'verifikasi' ? 'Pembayaran diverifikasi' : 'Pembayaran ditolak');
      setAksi(null);
      setCatatan('');
      muatUlang();
    } finally { setMemproses(false); }
  };

  return (
    <>
      <Toast pesan={toast} />
      <TopHeader
        judul={`Pembayaran${jenjangSingkat ? ` ${jenjangSingkat}` : ''}`}
        subjudul="Verifikasi uang yang benar-benar disetorkan pendaftar."
        remah={[{ label: 'Keuangan' }, { label: 'Pembayaran' }]}
      />

      <div className="adm-content">
        <ReadOnlyBanner
          resource="pembayaran"
          pesan="Anda dapat melihat seluruh pembayaran. Verifikasi dan penolakan pembayaran hanya dapat dilakukan oleh Admin Keuangan."
        />

        {ringkasan && !loading && (
          <div className="adm-grid-stat" style={{ marginBottom: 20 }}>
            <StatCard label="Jumlah Transaksi" nilai={ringkasan.jumlah} />
            <StatCard
              label="Nilai Transaksi"
              nilai={formatRupiah(ringkasan.nominal)}
              nada={tab === 'menunggu_verifikasi' ? 'peringatan' : 'sukses'}
              keterangan={TABS.find(t => t.key === tab)?.label}
            />
          </div>
        )}

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
          {loading ? (
            <SkeletonTabel baris={6} kolom={6} />
          ) : gagal ? (
            <ErrorState onCoba={muatUlang} />
          ) : rows.length === 0 ? (
            <EmptyState
              judul={tab === 'menunggu_verifikasi' ? 'Tidak ada pembayaran yang menunggu verifikasi' : 'Belum ada transaksi pembayaran'}
              pesan={jenjang ? `Jenjang ${jenjangSingkat}, tahun ajaran yang sedang dibuka.` : 'Pilih jenjang terlebih dahulu.'}
            />
          ) : (
            <div className="adm-table-wrap">
              <table className="adm-table">
                <thead>
                  <tr>
                    <th>Pendaftar</th>
                    <th>Jenis</th>
                    <th style={{ textAlign: 'right' }}>Nominal</th>
                    <th>Metode</th>
                    <th>Tanggal</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'right' }}>Tindakan</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map(t => {
                    const jt = JENIS_TRANSAKSI[t.jenis] ?? { teks: t.jenis, nada: 'netral' as const };
                    const st = STATUS_TRANSAKSI[t.status] ?? { teks: t.status, nada: 'netral' as const };
                    return (
                      <tr key={t.id}>
                        <td>
                          <Link href={`/admin/pendaftar/${t.pendaftaranId}`} style={{ fontWeight: 600, color: 'var(--adm-text)', textDecoration: 'none' }}>
                            {t.nama || '—'}
                          </Link>
                          <div style={{ fontSize: 11.5, color: 'var(--adm-text-muted)' }}>
                            {t.jenjang.toUpperCase()} · Tagihan {t.totalTagihan ? formatRupiah(t.totalTagihan) : '—'}
                          </div>
                        </td>
                        <td>
                          <StatusBadge teks={jt.teks} nada={jt.nada} />
                          <div style={{ fontSize: 11, color: 'var(--adm-text-muted)', marginTop: 3 }}>
                            Angsuran ke-{t.angsuranKe}
                          </div>
                        </td>
                        <td style={{ textAlign: 'right', fontWeight: 650 }}>{formatRupiah(t.nominal)}</td>
                        <td style={{ fontSize: 12.5 }}>
                          {t.metodePembayaran === 'offline' ? 'Tunai / Loket' : t.metodePembayaran === 'online' ? 'Transfer' : t.metodePembayaran}
                          {t.bankPengirim && <div style={{ fontSize: 11, color: 'var(--adm-text-muted)' }}>{t.bankPengirim}</div>}
                          {t.namaPengirim && <div style={{ fontSize: 11, color: 'var(--adm-text-muted)' }}>a.n. {t.namaPengirim}</div>}
                        </td>
                        <td style={{ fontSize: 12.5, whiteSpace: 'nowrap' }}>{tglJam(t.tanggalBayar)}</td>
                        <td>
                          <StatusBadge teks={st.teks} nada={st.nada} />
                          {t.catatanAdmin && (
                            <div style={{ fontSize: 11, color: 'var(--adm-text-muted)', marginTop: 3, maxWidth: 180 }}>{t.catatanAdmin}</div>
                          )}
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}>
                            {t.buktiPembayaran && (
                              <a href={t.buktiPembayaran} target="_blank" rel="noopener noreferrer" className="adm-btn adm-btn--ghost adm-btn--sm">
                                Bukti <ExternalLink size={12} />
                              </a>
                            )}
                            {t.status === 'menunggu_verifikasi' && (
                              <PermissionGate resource="pembayaran" action="update">
                                <button className="adm-btn adm-btn--danger adm-btn--sm" onClick={() => { setAksi({ baris: t, jenis: 'tolak' }); setCatatan(''); }}>
                                  <XCircle size={13} />
                                </button>
                                <button className="adm-btn adm-btn--success adm-btn--sm" onClick={() => { setAksi({ baris: t, jenis: 'verifikasi' }); setCatatan(''); }}>
                                  <CheckCircle2 size={13} /> Verifikasi
                                </button>
                              </PermissionGate>
                            )}
                          </div>
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

      {aksi && (
        <ConfirmModal
          judul={aksi.jenis === 'verifikasi' ? 'Verifikasi pembayaran?' : 'Tolak pembayaran?'}
          pesan={
            aksi.jenis === 'verifikasi'
              ? `Pembayaran ${formatRupiah(aksi.baris.nominal)} atas nama ${aksi.baris.nama || 'pendaftar ini'} akan dinyatakan sah, dan status pembayarannya dihitung ulang otomatis.`
              : `Pembayaran ${formatRupiah(aksi.baris.nominal)} akan ditolak. Pendaftar menerima notifikasi berisi catatan Anda.`
          }
          labelKonfirmasi={aksi.jenis === 'verifikasi' ? 'Ya, Verifikasi' : 'Tolak Pembayaran'}
          nada={aksi.jenis === 'verifikasi' ? 'primary' : 'danger'}
          memproses={memproses}
          detail={
            <div>
              <label className="adm-label" htmlFor="catatan">
                Catatan {aksi.jenis === 'tolak' ? '(sebaiknya diisi)' : '(opsional)'}
              </label>
              <textarea
                id="catatan"
                className="adm-input"
                rows={3}
                value={catatan}
                onChange={e => setCatatan(e.target.value)}
                placeholder={aksi.jenis === 'tolak' ? 'Contoh: Bukti transfer tidak terbaca, mohon unggah ulang.' : ''}
              />
            </div>
          }
          onBatal={() => setAksi(null)}
          onKonfirmasi={simpan}
        />
      )}
    </>
  );
}
