'use client';

import { useCallback, useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Download, Lightbulb } from 'lucide-react';
import { TopHeader } from '@/components/admin/TopHeader';
import { useAdmin } from '@/components/admin/AdminProvider';
import { useMuatData, ambilJson } from '@/components/admin/useMuatData';
import {
  EmptyState, ErrorState, PermissionGate, SkeletonStat, StatCard, StatusBadge,
} from '@/components/admin/ui';
import { JENJANG_SINGKAT, type Jenjang } from '@/lib/labels';
import { formatRupiah } from '@/lib/pembayaran-utils';

// ============================================================================
// LAPORAN KEUANGAN — kembaran Laporan Pendaftaran untuk sisi uang.
//
// Angkanya berasal dari lib/laporanKeuangan.ts yang memakai scope query yang
// SAMA dengan halaman Tagihan, jadi totalnya cocok secara konstruksi.
// ============================================================================

interface Data {
  jenjang: Jenjang;
  tahunAjaran: { nama: string; aktif: boolean };
  ringkasan: {
    jumlahPendaftar: number; totalTagihan: number; totalDibayar: number;
    totalSisa: number; totalRefund: number; totalAlokasi: number; persenTertagih: number;
  };
  statusBayar: { status: string; label: string; jumlah: number; persen: number; nominalSisa: number }[];
  perGelombang: { nama: string; jumlah: number; tagihan: number; dibayar: number; sisa: number }[];
  perPilihan: { label: string; jumlah: number; tagihan: number; dibayar: number }[];
  kasMasuk: { periode: string; nominal: number; jumlahTransaksi: number }[];
  metode: { label: string; jumlah: number; nominal: number }[];
  tunggakan: { rentang: string; jumlah: number; nominal: number }[];
  evaluasi: string[];
}

const BULAN = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
const labelPeriode = (p: string) => {
  const [th, bl] = p.split('-');
  return `${BULAN[Number(bl) - 1] ?? bl} ${th}`;
};

function Kartu({ judul, anak }: { judul: string; anak: React.ReactNode }) {
  return (
    <section className="adm-card" style={{ marginBottom: 18 }}>
      <div className="adm-card-head"><div className="adm-card-title">{judul}</div></div>
      {anak}
    </section>
  );
}

/** Batang proporsi sederhana — cukup untuk membandingkan besaran relatif. */
function Batang({ nilai, maks, warna }: { nilai: number; maks: number; warna: string }) {
  const p = maks > 0 ? Math.round((nilai / maks) * 100) : 0;
  return (
    <div style={{ height: 6, background: 'var(--adm-neutral-weak)', borderRadius: 999, overflow: 'hidden', minWidth: 60 }}>
      <div style={{ width: `${p}%`, height: '100%', background: warna, borderRadius: 999 }} />
    </div>
  );
}

export default function LaporanKeuanganPage() {
  return <Suspense fallback={null}><LaporanKeuanganInner /></Suspense>;
}

function LaporanKeuanganInner() {
  const searchParams = useSearchParams();
  const { jenjang, jenjangSingkat } = useAdmin();
  const tahunAjaranId = searchParams.get('tahunAjaranId') || '';
  const [mengekspor, setMengekspor] = useState(false);
  const [errExport, setErrExport] = useState('');

  const ambil = useCallback(
    async (sinyal: AbortSignal) => {
      if (!jenjang) return null;
      const qp = new URLSearchParams({ jenjang });
      if (tahunAjaranId) qp.set('tahunAjaranId', tahunAjaranId);
      const d = await ambilJson<{ data: Data | null }>(`/api/admin/laporan/keuangan?${qp}`, sinyal);
      return d.data;
    },
    [jenjang, tahunAjaranId],
  );

  const { data, loading, gagal, muatUlang } = useMuatData(ambil, [jenjang, tahunAjaranId]);

  const ekspor = async () => {
    if (!jenjang) return;
    setMengekspor(true); setErrExport('');
    try {
      const qp = new URLSearchParams({ jenjang });
      if (tahunAjaranId) qp.set('tahunAjaranId', tahunAjaranId);
      const res = await fetch(`/api/admin/laporan/keuangan/export?${qp}`);
      if (!res.ok) {
        const e = await res.json().catch(() => null);
        setErrExport(e?.error || 'Gagal membuat file Excel');
        return;
      }
      const blob = await res.blob();
      const nama = res.headers.get('Content-Disposition')?.match(/filename="(.+)"/)?.[1]
        ?? `Laporan_Keuangan_${JENJANG_SINGKAT[jenjang]}.xlsx`;
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = nama;
      a.click();
      URL.revokeObjectURL(a.href);
    } catch {
      setErrExport('Terjadi kesalahan jaringan');
    } finally { setMengekspor(false); }
  };

  const maksGelombang = Math.max(1, ...(data?.perGelombang ?? []).map(g => g.tagihan));
  const maksKas = Math.max(1, ...(data?.kasMasuk ?? []).map(k => k.nominal));

  return (
    <>
      <TopHeader
        judul={`Laporan Keuangan${jenjangSingkat ? ` ${jenjangSingkat}` : ''}`}
        subjudul="Rekapitulasi tagihan, penerimaan, dan tunggakan."
        remah={[{ label: 'Laporan' }, { label: 'Keuangan' }]}
        aksi={
          data ? (
            <PermissionGate resource="laporan_keuangan" action="export">
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                <button onClick={ekspor} disabled={mengekspor} className="adm-btn adm-btn--primary adm-btn--sm">
                  <Download size={14} /> {mengekspor ? 'Menyiapkan…' : 'Export Excel'}
                </button>
                {errExport && <span style={{ fontSize: 11, color: 'var(--adm-danger)' }}>{errExport}</span>}
              </div>
            </PermissionGate>
          ) : null
        }
      />

      <div className="adm-content">
        {!jenjang ? (
          <div className="adm-card">
            <EmptyState
              judul="Pilih jenjang terlebih dahulu"
              pesan="Laporan keuangan selalu ditampilkan per jenjang agar tunggakan tiap unit tidak saling tertutup."
              aksi={<Link href="/admin/dashboard" className="adm-btn adm-btn--primary">Pilih Jenjang</Link>}
            />
          </div>
        ) : loading ? (
          <SkeletonStat jumlah={4} />
        ) : gagal ? (
          <div className="adm-card"><ErrorState onCoba={muatUlang} /></div>
        ) : !data ? (
          <div className="adm-card">
            <EmptyState judul="Belum ada tahun ajaran aktif" pesan="Aktifkan tahun ajaran terlebih dahulu di menu Tahun Ajaran." />
          </div>
        ) : (
          <>
            <div className="adm-grid-stat" style={{ marginBottom: 20 }}>
              <StatCard label="Total Tagihan" nilai={formatRupiah(data.ringkasan.totalTagihan)} keterangan={`${data.ringkasan.jumlahPendaftar} pendaftar`} />
              <StatCard label="Sudah Tertagih" nilai={formatRupiah(data.ringkasan.totalDibayar)} nada="sukses" keterangan={`${data.ringkasan.persenTertagih}% dari total`} />
              <StatCard label="Belum Tertagih" nilai={formatRupiah(data.ringkasan.totalSisa)} nada={data.ringkasan.totalSisa > 0 ? 'peringatan' : 'sukses'} />
              <StatCard label="Pengembalian Dana" nilai={formatRupiah(data.ringkasan.totalRefund)} nada={data.ringkasan.totalRefund > 0 ? 'info' : 'netral'} />
            </div>

            <Kartu
              judul="Status Pembayaran Pendaftar"
              anak={
                data.statusBayar.length === 0 ? <EmptyState judul="Belum ada data pembayaran" /> : (
                  <div className="adm-table-wrap">
                    <table className="adm-table">
                      <thead><tr><th>Status</th><th style={{ textAlign: 'right' }}>Pendaftar</th><th style={{ textAlign: 'right' }}>Persen</th><th style={{ textAlign: 'right' }}>Sisa Tagihan</th></tr></thead>
                      <tbody>
                        {data.statusBayar.map(s => (
                          <tr key={s.status}>
                            <td>{s.label}</td>
                            <td style={{ textAlign: 'right' }}>{s.jumlah}</td>
                            <td style={{ textAlign: 'right' }}>{s.persen}%</td>
                            <td style={{ textAlign: 'right', color: s.nominalSisa > 0 ? 'var(--adm-warning)' : undefined }}>{formatRupiah(s.nominalSisa)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )
              }
            />

            <Kartu
              judul="Keuangan per Gelombang"
              anak={
                <div className="adm-table-wrap">
                  <table className="adm-table">
                    <thead><tr><th>Gelombang</th><th style={{ textAlign: 'right' }}>Pendaftar</th><th>Proporsi Tagihan</th><th style={{ textAlign: 'right' }}>Dibayar</th><th style={{ textAlign: 'right' }}>Sisa</th></tr></thead>
                    <tbody>
                      {data.perGelombang.map(g => (
                        <tr key={g.nama}>
                          <td style={{ fontWeight: 550 }}>{g.nama}</td>
                          <td style={{ textAlign: 'right' }}>{g.jumlah}</td>
                          <td style={{ minWidth: 140 }}>
                            <Batang nilai={g.tagihan} maks={maksGelombang} warna="var(--adm-primary)" />
                            <div style={{ fontSize: 11, color: 'var(--adm-text-muted)', marginTop: 3 }}>{formatRupiah(g.tagihan)}</div>
                          </td>
                          <td style={{ textAlign: 'right', color: 'var(--adm-success)' }}>{formatRupiah(g.dibayar)}</td>
                          <td style={{ textAlign: 'right', color: g.sisa > 0 ? 'var(--adm-warning)' : undefined }}>{formatRupiah(g.sisa)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              }
            />

            <Kartu
              judul={data.jenjang === 'smk' ? 'Keuangan per Program Keahlian' : 'Keuangan per Kelas'}
              anak={
                <div className="adm-table-wrap">
                  <table className="adm-table">
                    <thead><tr><th>{data.jenjang === 'smk' ? 'Program Keahlian' : 'Kelas'}</th><th style={{ textAlign: 'right' }}>Pendaftar</th><th style={{ textAlign: 'right' }}>Tagihan</th><th style={{ textAlign: 'right' }}>Dibayar</th></tr></thead>
                    <tbody>
                      {data.perPilihan.map(p => (
                        <tr key={p.label}>
                          <td>{p.label}</td>
                          <td style={{ textAlign: 'right' }}>{p.jumlah}</td>
                          <td style={{ textAlign: 'right' }}>{formatRupiah(p.tagihan)}</td>
                          <td style={{ textAlign: 'right', color: 'var(--adm-success)' }}>{formatRupiah(p.dibayar)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              }
            />

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 18 }}>
              <Kartu
                judul="Kas Masuk per Bulan"
                anak={
                  data.kasMasuk.length === 0 ? <EmptyState judul="Belum ada pembayaran terverifikasi" /> : (
                    <div style={{ padding: '14px 20px', display: 'grid', gap: 10 }}>
                      {data.kasMasuk.map(k => (
                        <div key={k.periode}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, marginBottom: 4 }}>
                            <span>{labelPeriode(k.periode)}</span>
                            <strong>{formatRupiah(k.nominal)}</strong>
                          </div>
                          <Batang nilai={k.nominal} maks={maksKas} warna="var(--adm-success)" />
                        </div>
                      ))}
                    </div>
                  )
                }
              />

              <Kartu
                judul="Umur Tunggakan"
                anak={
                  data.tunggakan.length === 0 ? (
                    <EmptyState judul="Tidak ada tunggakan" pesan="Seluruh tagihan pada jenjang ini sudah lunas." />
                  ) : (
                    <div className="adm-table-wrap">
                      <table className="adm-table">
                        <thead><tr><th>Rentang</th><th style={{ textAlign: 'right' }}>Pendaftar</th><th style={{ textAlign: 'right' }}>Nominal</th></tr></thead>
                        <tbody>
                          {data.tunggakan.map(t => (
                            <tr key={t.rentang}>
                              <td>
                                {t.rentang}
                                {t.rentang === '> 90 hari' && <StatusBadge teks="Perlu tindak lanjut" nada="bahaya" />}
                              </td>
                              <td style={{ textAlign: 'right' }}>{t.jumlah}</td>
                              <td style={{ textAlign: 'right', color: 'var(--adm-warning)' }}>{formatRupiah(t.nominal)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )
                }
              />
            </div>

            <Kartu
              judul="Bauran Metode Pembayaran"
              anak={
                data.metode.length === 0 ? <EmptyState judul="Belum ada transaksi" /> : (
                  <div className="adm-table-wrap">
                    <table className="adm-table">
                      <thead><tr><th>Metode</th><th style={{ textAlign: 'right' }}>Transaksi</th><th style={{ textAlign: 'right' }}>Nominal</th></tr></thead>
                      <tbody>
                        {data.metode.map(m => (
                          <tr key={m.label}>
                            <td>{m.label}</td>
                            <td style={{ textAlign: 'right' }}>{m.jumlah}</td>
                            <td style={{ textAlign: 'right' }}>{formatRupiah(m.nominal)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )
              }
            />

            <Kartu
              judul="Catatan Evaluasi"
              anak={
                <div style={{ padding: '14px 20px', display: 'grid', gap: 10 }}>
                  {data.evaluasi.map((e, i) => (
                    <div key={i} style={{ display: 'flex', gap: 9, alignItems: 'flex-start', fontSize: 13.5 }}>
                      <Lightbulb size={15} color="var(--adm-warning)" style={{ flexShrink: 0, marginTop: 2 }} />
                      <span>{e}</span>
                    </div>
                  ))}
                </div>
              }
            />
          </>
        )}
      </div>
    </>
  );
}
