'use client';

import { Suspense, useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { CircleAlert, Download, ExternalLink, MessageCircle, Square, UserCheck } from 'lucide-react';
import { TopHeader } from '@/components/admin/TopHeader';
import { useAdmin } from '@/components/admin/AdminProvider';
import { ConfirmModal, ErrorState, Skeleton, StatusBadge, Toast } from '@/components/admin/ui';
import { useMuatData, ambilJson } from '@/components/admin/useMuatData';
import { JENJANG_LABEL_FULL, type Jenjang } from '@/lib/labels';
import {
  STATUS_PRA, catatanBawa, formatNoHp, isStatusPra, noWhatsApp, tanggalWib, teksSisaHari, type BarisBawa, type StatusPra,
} from '@/lib/praPendaftaran';

type Detail = {
  id: string;
  noPraPendaftaran: string;
  namaLengkap: string;
  email: string;
  noHp: string;
  asalSekolah: string;
  alamat: string;
  jenjang: string;
  jurusan: string | null;
  status: string;
  batasKedatangan: string;
  createdAt: string;
  datangAt: string | null;
  dikonfirmasiOleh: string | null;
  diprosesAt: string | null;
  selesaiAt: string | null;
  tahunAjaran: { nama: string; aktif: boolean };
  pendaftaran: { id: string; noPendaftaran: string | null; status: string } | null;
  persyaratan: BarisBawa[];
};

function Baris({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ minWidth: 0 }}>
      <div className="adm-label" style={{ marginBottom: 3 }}>{label}</div>
      <div style={{ fontSize: 13.5, fontWeight: 600 }}>{children}</div>
    </div>
  );
}

export default function DetailPraPendaftaranPage() {
  return <Suspense fallback={null}><DetailInner /></Suspense>;
}

function DetailInner() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { href, can } = useAdmin();

  const ambil = useCallback((sinyal: AbortSignal) => ambilJson<{ data: Detail }>(`/api/admin/pra-pendaftaran/${id}`, sinyal), [id]);
  const { data, loading, gagal, muatUlang } = useMuatData(ambil, [id]);
  const d = data?.data;

  const [tanya, setTanya] = useState(false);
  const [memproses, setMemproses] = useState(false);
  const [galat, setGalat] = useState('');
  const [toast, setToast] = useState<string | null>(null);

  // Tautan dari notifikasi bisa datang tanpa ?jenjang=; selaraskan konteks sidebar dengan jenjang data ini.
  useEffect(() => {
    if (!d || searchParams.get('jenjang') === d.jenjang) return;
    const sp = new URLSearchParams(searchParams.toString());
    sp.set('jenjang', d.jenjang);
    router.replace(`/admin/pra-pendaftaran/${id}?${sp.toString()}`);
  }, [d, id, router, searchParams]);

  const aksi = async (nama: 'konfirmasi_kedatangan' | 'mulai_proses') => {
    setMemproses(true);
    setGalat('');
    try {
      const res = await fetch(`/api/admin/pra-pendaftaran/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ aksi: nama }),
      });
      const hasil = await res.json().catch(() => ({}));
      if (!res.ok) {
        setGalat(hasil.error || 'Gagal memperbarui status.');
        muatUlang();
        return false;
      }
      return true;
    } catch {
      setGalat('Koneksi terputus. Coba lagi.');
      return false;
    } finally {
      setMemproses(false);
    }
  };

  const konfirmasi = async () => {
    const ok = await aksi('konfirmasi_kedatangan');
    setTanya(false);
    if (ok) {
      setToast('Kedatangan dikonfirmasi');
      setTimeout(() => setToast(null), 2500);
      muatUlang();
    }
  };

  const keFormulir = () => router.push(href('/admin/pendaftar/tambah', { pra: id, jenjang: d?.jenjang }));

  const proses = async () => {
    if (await aksi('mulai_proses')) keFormulir();
  };

  if (loading) {
    return (
      <>
        <TopHeader judul="Pra-Pendaftaran" remah={[{ label: 'Pendaftaran' }, { label: 'Pra-Pendaftaran' }]} />
        <div className="adm-content" style={{ display: 'grid', gap: 12 }}>
          <Skeleton tinggi={140} radius={16} />
          <Skeleton tinggi={220} radius={16} />
        </div>
      </>
    );
  }

  if (gagal || !d) {
    return (
      <>
        <TopHeader judul="Pra-Pendaftaran" remah={[{ label: 'Pendaftaran' }, { label: 'Pra-Pendaftaran' }]} />
        <div className="adm-content"><div className="adm-card"><ErrorState onCoba={muatUlang} /></div></div>
      </>
    );
  }

  const status: StatusPra = isStatusPra(d.status) ? d.status : 'menunggu';
  const bolehUbah = can('pra_pendaftaran', 'update');
  const bolehProses = bolehUbah && can('pendaftar', 'create');
  const riwayat = [
    { label: 'Pra-pendaftaran dibuat', waktu: d.createdAt, ket: 'Diisi sendiri oleh pendaftar' },
    ...(d.datangAt ? [{ label: 'Kedatangan dikonfirmasi', waktu: d.datangAt, ket: d.dikonfirmasiOleh ? `Oleh ${d.dikonfirmasiOleh}` : '' }] : []),
    ...(d.diprosesAt ? [{ label: 'Mulai diproses', waktu: d.diprosesAt, ket: 'Formulir pendaftaran resmi dibuka' }] : []),
    ...(d.selesaiAt ? [{ label: 'Selesai', waktu: d.selesaiAt, ket: d.pendaftaran?.noPendaftaran ? `Nomor resmi ${d.pendaftaran.noPendaftaran}` : '' }] : []),
    ...(status === 'kedaluwarsa' ? [{ label: 'Kedaluwarsa', waktu: d.batasKedatangan, ket: 'Tidak datang sampai batas waktu' }] : []),
  ];

  return (
    <>
      <Toast pesan={toast} />
      <TopHeader
        judul={d.noPraPendaftaran}
        subjudul={`${d.namaLengkap} · ${JENJANG_LABEL_FULL[d.jenjang as Jenjang] ?? d.jenjang.toUpperCase()} · TA ${d.tahunAjaran.nama}`}
        remah={[{ label: 'Pendaftaran' }, { label: 'Pra-Pendaftaran', href: href('/admin/pra-pendaftaran', { jenjang: d.jenjang }) }, { label: 'Detail' }]}
        aksi={
          <a className="adm-btn adm-btn--ghost adm-btn--sm" href={`/api/admin/pra-pendaftaran/${id}/pdf`}>
            <Download size={14} /> Unduh Bukti PDF
          </a>
        }
      />

      <div className="adm-content">
        {galat && (
          <div className="adm-banner adm-banner--danger" role="alert" style={{ marginBottom: 16 }}>
            <CircleAlert size={15} style={{ flexShrink: 0, marginTop: 1 }} />
            <div>{galat}</div>
          </div>
        )}

        <div className="adm-detail-grid" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 320px', gap: 18, alignItems: 'start' }}>
          <div style={{ display: 'grid', gap: 18, minWidth: 0 }}>
            <section className="adm-card">
              <div className="adm-card-head"><div className="adm-card-title">Data Pra-Pendaftaran</div></div>
              <div style={{ padding: '18px 20px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '16px 22px' }}>
                <Baris label="Nama Lengkap">{d.namaLengkap}</Baris>
                <Baris label="Jenjang">{JENJANG_LABEL_FULL[d.jenjang as Jenjang] ?? d.jenjang.toUpperCase()}</Baris>
                {d.jenjang === 'smk' && <Baris label="Jurusan">{d.jurusan || 'Belum dipilih (dipilih saat proses)'}</Baris>}
                <Baris label="Asal Sekolah">{d.asalSekolah}</Baris>
                <Baris label="Nomor HP / WhatsApp">
                  <a href={`https://wa.me/${noWhatsApp(d.noHp)}`} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--adm-secondary)', textDecoration: 'none' }}>
                    {formatNoHp(d.noHp)}
                  </a>
                </Baris>
                <Baris label="Email"><a href={`mailto:${d.email}`} style={{ color: 'inherit' }}>{d.email}</a></Baris>
                <Baris label="Tanggal Daftar">{tanggalWib(d.createdAt, true)}</Baris>
                <Baris label="Batas Kedatangan">{tanggalWib(d.batasKedatangan)}</Baris>
                <div style={{ gridColumn: '1 / -1' }}><Baris label="Alamat">{d.alamat}</Baris></div>
              </div>
            </section>

            <section className="adm-card">
              <div className="adm-card-head">
                <div className="adm-card-title">Dokumen yang Wajib Dibawa</div>
                <span style={{ fontSize: 12, color: 'var(--adm-text-muted)' }}>Daftar periksa saat calon peserta didik datang</span>
              </div>
              <ul style={{ listStyle: 'none', margin: 0, padding: '6px 20px 14px' }}>
                {d.persyaratan.map((s, i) => (
                  <li key={`${s.nama}-${i}`} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', padding: '10px 0', borderBottom: i < d.persyaratan.length - 1 ? '1px solid var(--adm-border)' : 'none' }}>
                    <Square size={16} color="var(--adm-text-faint)" style={{ flexShrink: 0, marginTop: 2 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13.5, fontWeight: 600 }}>{s.nama}</div>
                      {catatanBawa(s) && <div style={{ fontSize: 12, color: 'var(--adm-text-muted)' }}>{catatanBawa(s)}</div>}
                    </div>
                    {!s.wajib && <StatusBadge teks="Bila ada" nada="netral" />}
                  </li>
                ))}
              </ul>
            </section>
          </div>

          <div style={{ display: 'grid', gap: 18, minWidth: 0 }}>
            <section className="adm-card adm-card-pad">
              <div className="adm-label">Status</div>
              <div style={{ marginTop: 6 }}><StatusBadge teks={STATUS_PRA[status].teks} nada={STATUS_PRA[status].nada} /></div>

              {status === 'menunggu' && (
                <p style={{ fontSize: 12.5, color: 'var(--adm-text-muted)', marginTop: 10 }}>
                  {teksSisaHari(d.batasKedatangan)} · berlaku sampai {tanggalWib(d.batasKedatangan)}.
                </p>
              )}
              {status === 'kedaluwarsa' && (
                <p style={{ fontSize: 12.5, color: 'var(--adm-danger)', marginTop: 10 }}>
                  Tidak datang sampai {tanggalWib(d.batasKedatangan)}. Data ini tidak dapat diproses sebagai antrean aktif.
                </p>
              )}
              {status === 'selesai' && d.pendaftaran?.noPendaftaran && (
                <p style={{ fontSize: 12.5, color: 'var(--adm-text-muted)', marginTop: 10 }}>
                  Nomor pendaftaran resmi: <strong style={{ color: 'var(--adm-text)', fontFamily: 'ui-monospace, monospace' }}>{d.pendaftaran.noPendaftaran}</strong>
                </p>
              )}

              <div style={{ display: 'grid', gap: 8, marginTop: 16 }}>
                {status === 'menunggu' && bolehUbah && (
                  <button className="adm-btn adm-btn--hijau" onClick={() => setTanya(true)} disabled={memproses}>
                    <UserCheck size={15} /> Konfirmasi Kedatangan
                  </button>
                )}
                {status === 'datang' && bolehProses && (
                  <button className="adm-btn adm-btn--hijau" onClick={proses} disabled={memproses}>
                    {memproses ? 'Memproses…' : 'Proses Pendaftaran'}
                  </button>
                )}
                {status === 'diproses' && bolehProses && (
                  <button className="adm-btn adm-btn--hijau" onClick={keFormulir}>Lanjutkan Proses Pendaftaran</button>
                )}
                {status === 'selesai' && d.pendaftaran && (
                  <Link className="adm-btn adm-btn--primary" href={href(`/admin/pendaftar/${d.pendaftaran.id}`, { jenjang: d.jenjang })}>
                    <ExternalLink size={14} /> Lihat Pendaftar Resmi
                  </Link>
                )}
                {status === 'kedaluwarsa' && can('pendaftar', 'create') && (
                  <Link className="adm-btn adm-btn--ghost" href={href('/admin/pendaftar/tambah', { jenjang: d.jenjang })}>
                    Daftarkan sebagai Pendaftar Offline
                  </Link>
                )}
                <a className="adm-btn adm-btn--ghost" href={`https://wa.me/${noWhatsApp(d.noHp)}`} target="_blank" rel="noopener noreferrer">
                  <MessageCircle size={14} /> Hubungi via WhatsApp
                </a>
              </div>
            </section>

            <section className="adm-card adm-card-pad">
              <div className="adm-label" style={{ marginBottom: 10 }}>Riwayat</div>
              <ol style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: 12 }}>
                {riwayat.map(r => (
                  <li key={r.label} style={{ display: 'grid', gridTemplateColumns: '10px minmax(0, 1fr)', gap: 10 }}>
                    <span style={{ width: 8, height: 8, borderRadius: 999, background: 'var(--adm-secondary)', marginTop: 6 }} />
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 650 }}>{r.label}</div>
                      <div style={{ fontSize: 11.5, color: 'var(--adm-text-muted)' }}>{tanggalWib(r.waktu, true)}</div>
                      {r.ket && <div style={{ fontSize: 11.5, color: 'var(--adm-text-faint)' }}>{r.ket}</div>}
                    </div>
                  </li>
                ))}
              </ol>
            </section>
          </div>
        </div>
      </div>

      {tanya && (
        <ConfirmModal
          judul="Konfirmasi kedatangan?"
          pesan={`Pastikan ${d.namaLengkap} hadir membawa Bukti Pra-Pendaftaran ${d.noPraPendaftaran} dan dokumen persyaratan.`}
          labelKonfirmasi="Ya, sudah datang"
          memproses={memproses}
          onBatal={() => setTanya(false)}
          onKonfirmasi={konfirmasi}
        />
      )}
    </>
  );
}
