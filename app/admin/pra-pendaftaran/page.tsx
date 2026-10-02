'use client';

import { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ChevronLeft, ChevronRight, Search, X } from 'lucide-react';
import { TopHeader } from '@/components/admin/TopHeader';
import { useAdmin } from '@/components/admin/AdminProvider';
import { EmptyState, ErrorState, SkeletonTabel, StatCard, StatusBadge } from '@/components/admin/ui';
import { useMuatData, ambilJson } from '@/components/admin/useMuatData';
import { JENJANG_SINGKAT, type Jenjang, type NadaStatus } from '@/lib/labels';
import { STATUS_PRA, formatNoHp, jamWib, sisaHari, statusEfektif, tanggalSingkatWib, teksSisaHari, type StatusPra } from '@/lib/praPendaftaran';

type Baris = {
  id: string;
  noPraPendaftaran: string;
  namaLengkap: string;
  email: string;
  noHp: string;
  asalSekolah: string;
  jenjang: string;
  jurusan: string | null;
  status: string;
  batasKedatangan: string;
  createdAt: string;
  pendaftaranId: string | null;
};

type Respons = { data: Baris[]; hitung: Record<StatusPra, number>; lintasJenjang: boolean };

type Tab = 'aktif' | 'selesai' | 'kedaluwarsa' | 'semua';

const TABS: { key: Tab; label: string }[] = [
  { key: 'aktif', label: 'Antrean Aktif' },
  { key: 'selesai', label: 'Selesai' },
  { key: 'kedaluwarsa', label: 'Kedaluwarsa' },
  { key: 'semua', label: 'Semua' },
];

const PER_HALAMAN = 15;
const JEDA_SEGARKAN = 60_000;

function nadaSisa(batas: string): NadaStatus {
  const sisa = sisaHari(batas);
  if (sisa <= 0) return 'bahaya';
  if (sisa <= 2) return 'peringatan';
  return 'netral';
}

export default function PraPendaftaranPage() {
  return <Suspense fallback={null}><PraPendaftaranInner /></Suspense>;
}

function PraPendaftaranInner() {
  const searchParams = useSearchParams();
  const { jenjang, jenjangSingkat, href } = useAdmin();
  const tahunAjaranId = searchParams.get('tahunAjaranId') || '';

  const [tab, setTab] = useState<Tab>('aktif');
  const [ketik, setKetik] = useState('');
  const [cari, setCari] = useState('');
  const [halaman, setHalaman] = useState(1);

  useEffect(() => {
    const t = setTimeout(() => { setCari(ketik.trim()); setHalaman(1); }, 350);
    return () => clearTimeout(t);
  }, [ketik]);

  const ambil = useCallback(
    (sinyal: AbortSignal) => {
      const qp = new URLSearchParams({ tab, jenjang });
      if (cari) qp.set('q', cari);
      if (tahunAjaranId) qp.set('tahunAjaranId', tahunAjaranId);
      return ambilJson<Respons>(`/api/admin/pra-pendaftaran?${qp}`, sinyal);
    },
    [tab, jenjang, cari, tahunAjaranId],
  );
  const { data, loading, gagal, muatUlang } = useMuatData(ambil, [tab, jenjang, cari, tahunAjaranId]);

  useEffect(() => {
    const t = setInterval(muatUlang, JEDA_SEGARKAN);
    return () => clearInterval(t);
  }, [muatUlang]);

  const baris = useMemo(() => data?.data ?? [], [data]);
  const hitung = data?.hitung;
  const jumlahHalaman = Math.max(1, Math.ceil(baris.length / PER_HALAMAN));
  const halamanIni = Math.min(halaman, jumlahHalaman);
  const tampil = baris.slice((halamanIni - 1) * PER_HALAMAN, halamanIni * PER_HALAMAN);

  return (
    <>
      <TopHeader
        judul={`Pra-Pendaftaran ${jenjangSingkat}`}
        subjudul="Antrean calon peserta didik yang mengisi pra-pendaftaran tanpa akun. Berlaku 7 hari sejak dibuat."
        remah={[{ label: 'Pendaftaran' }, { label: 'Pra-Pendaftaran' }]}
      />

      <div className="adm-content">
        <div className="adm-grid-stat" style={{ marginBottom: 18 }}>
          {(['menunggu', 'datang', 'diproses', 'selesai', 'kedaluwarsa'] as StatusPra[]).map(s => (
            <StatCard
              key={s}
              label={STATUS_PRA[s].teks}
              nilai={hitung ? hitung[s] : '…'}
              nada={STATUS_PRA[s].nada}
            />
          ))}
        </div>

        <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
          {TABS.map(t => (
            <button
              key={t.key}
              onClick={() => { setTab(t.key); setHalaman(1); }}
              className={`adm-btn adm-btn--${tab === t.key ? 'primary' : 'ghost'} adm-btn--sm`}
              aria-pressed={tab === t.key}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="adm-card">
          <div className="adm-card-head" style={{ flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 220, maxWidth: 420 }}>
              <Search size={15} color="var(--adm-text-faint)" />
              <input
                className="adm-input"
                style={{ border: 'none', padding: '4px 0', boxShadow: 'none' }}
                placeholder="Cari nomor pra-pendaftaran, nama, email, atau nomor HP…"
                value={ketik}
                onChange={e => setKetik(e.target.value)}
                aria-label="Cari pra-pendaftaran"
              />
              {ketik && (
                <button onClick={() => setKetik('')} aria-label="Hapus pencarian" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--adm-text-faint)', display: 'flex' }}>
                  <X size={14} />
                </button>
              )}
            </div>
            <span style={{ fontSize: 12, color: 'var(--adm-text-muted)' }}>
              {loading ? '…' : `${baris.length} data${data?.lintasJenjang ? ' · pencarian mencakup semua jenjang' : ''}`}
            </span>
          </div>

          {loading ? (
            <SkeletonTabel baris={6} kolom={7} />
          ) : gagal ? (
            <ErrorState onCoba={muatUlang} />
          ) : tampil.length === 0 ? (
            <EmptyState
              judul={cari ? 'Tidak ada pra-pendaftaran yang cocok' : tab === 'aktif' ? 'Belum ada antrean aktif' : 'Belum ada data'}
              pesan={cari ? 'Periksa kembali nomor, nama, atau nomor HP yang dicari.' : `Pra-pendaftaran ${jenjangSingkat} pada tahun ajaran yang sedang dibuka akan muncul di sini.`}
            />
          ) : (
            <>
              <div className="adm-table-wrap">
                <table className="adm-table">
                  <thead>
                    <tr>
                      <th>Calon Peserta Didik</th>
                      <th>Asal Sekolah</th>
                      <th>Jenjang</th>
                      <th>Tgl Daftar</th>
                      <th>Batas Kedatangan</th>
                      <th>Status</th>
                      <th style={{ textAlign: 'right' }}>Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tampil.map(p => {
                      const st = statusEfektif(p.status, p.batasKedatangan);
                      return (
                        <tr key={p.id}>
                          <td style={{ minWidth: 230 }}>
                            <div style={{ fontWeight: 600 }}>{p.namaLengkap}</div>
                            <div style={{ fontFamily: 'ui-monospace, monospace', fontSize: 11.5, color: 'var(--adm-text)', marginTop: 1 }}>{p.noPraPendaftaran}</div>
                            <div style={{ fontSize: 11.5, color: 'var(--adm-text-muted)' }}>{formatNoHp(p.noHp)} · {p.email}</div>
                          </td>
                          <td style={{ fontSize: 12.5, color: 'var(--adm-text-muted)', minWidth: 120 }}>{p.asalSekolah}</td>
                          <td style={{ whiteSpace: 'nowrap' }}>
                            <div style={{ fontWeight: 600 }}>{JENJANG_SINGKAT[p.jenjang as Jenjang] ?? p.jenjang.toUpperCase()}</div>
                            {p.jenjang === 'smk' && (
                              <div style={{ fontSize: 11.5, color: 'var(--adm-text-muted)' }}>{p.jurusan || 'Jurusan belum dipilih'}</div>
                            )}
                          </td>
                          <td style={{ whiteSpace: 'nowrap' }}>
                            <div style={{ fontSize: 12.5 }}>{tanggalSingkatWib(p.createdAt)}</div>
                            <div style={{ fontSize: 11.5, color: 'var(--adm-text-muted)' }}>{jamWib(p.createdAt)}</div>
                          </td>
                          <td style={{ whiteSpace: 'nowrap' }}>
                            <div style={{ fontSize: 12.5 }}>{tanggalSingkatWib(p.batasKedatangan)}</div>
                            {st === 'menunggu' && (
                              <div style={{ marginTop: 4 }}><StatusBadge teks={teksSisaHari(p.batasKedatangan)} nada={nadaSisa(p.batasKedatangan)} /></div>
                            )}
                          </td>
                          <td><StatusBadge teks={STATUS_PRA[st].teks} nada={STATUS_PRA[st].nada} /></td>
                          <td style={{ textAlign: 'right' }}>
                            <Link
                              href={href(`/admin/pra-pendaftaran/${p.id}`, { jenjang: p.jenjang })}
                              className={`adm-btn adm-btn--${st === 'menunggu' || st === 'datang' ? 'primary' : 'ghost'} adm-btn--sm`}
                            >
                              {st === 'menunggu' ? 'Layani' : st === 'datang' || st === 'diproses' ? 'Proses' : 'Detail'}
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {jumlahHalaman > 1 && (
                <div style={{ padding: '12px 16px', borderTop: '1px solid var(--adm-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 12, color: 'var(--adm-text-faint)' }}>Halaman {halamanIni} dari {jumlahHalaman}</span>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button className="adm-btn adm-btn--ghost adm-btn--sm" onClick={() => setHalaman(h => Math.max(1, h - 1))} disabled={halamanIni === 1} aria-label="Halaman sebelumnya">
                      <ChevronLeft size={14} />
                    </button>
                    <button className="adm-btn adm-btn--ghost adm-btn--sm" onClick={() => setHalaman(h => Math.min(jumlahHalaman, h + 1))} disabled={halamanIni === jumlahHalaman} aria-label="Halaman berikutnya">
                      <ChevronRight size={14} />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}
