'use client';
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Search, X, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { TopHeader } from '@/components/admin/TopHeader';
import { PermissionGate, ReadOnlyBanner } from '@/components/admin/ui';
import { useAdmin } from '@/components/admin/AdminProvider';
import { JENJANG_LABEL_FULL, JURUSAN_SMK, cariJurusan, punyaJurusan } from '@/lib/labels';
import TeksKode from '@/components/TeksKode';

type Pendaftaran = {
  id: string; namaLengkap: string | null; namaPanggilan?: string; noPendaftaran?: string | null;
  tempatLahir?: string; tanggalLahir?: string; ttl?: string;
  jenisKelamin: string | null; agama: string | null; anakKe?: string;
  alamat: string | null; rt?: string; rw?: string;
  kelurahan?: string; kecamatan?: string; kabupaten?: string;
  beratBadan?: string; tinggiBadan?: string; golonganDarah?: string; ukuranSeragam?: string;
  namaPemberiReferensi?: string; noHpReferensi?: string;
  nisn?: string; nik?: string; noPribadi?: string;
  asalSD?: string; asalSMP?: string; asalSekolah?: string;
  jurusan: string | null; jenjang?: string; sumberDaftar?: string; kelas?: string;
  tipePendaftaran?: string; kelasMasuk?: string;
  namaAyah?: string; ttlAyah?: string; pendidikanAyah?: string; pekerjaanAyah?: string; penghasilanAyah?: string; noHpAyah?: string; alamatAyah?: string;
  namaIbu?: string; ttlIbu?: string; pendidikanIbu?: string; pekerjaanIbu?: string; penghasilanIbu?: string; noHpIbu?: string; alamatIbu?: string;
  namaWali?: string; ttlWali?: string; pendidikanWali?: string; pekerjaanWali?: string; penghasilanWali?: string; noHpWali?: string; alamatWali?: string;
  namaOrtu?: string; noOrtu?: string;
  status: string; catatan?: string;
  alasanPenolakan?: string; pesanPengumuman?: string; revisiCount?: number;
  waVerified?: boolean;
  metodePembayaran?: string; buktiPembayaran?: string;
  statusPembayaran?: string; catatanPembayaran?: string; totalTagihan?: number; gelombang?: string;
  hargaPokok?: number | null; gelombangDiskonNominal?: number; diskonNominal?: number;
  sudahDaftarUlang?: boolean; tanggalDaftarUlang?: string; catatanDaftarUlang?: string;
  fileIjazah?: string | null; fileAkte?: string | null;
  fileKK?: string | null; fileKtpOrtu?: string | null;
  fileFoto?: string | null;
  createdAt: string; userEmail?: string; userId?: string;
  pembayaranList?: { id: string; jenis?: string; nominal: number; status: string; angsuranKe: number; tanggalBayar: string }[];
};

type Stats = {
  total: number; verified: number;
  diterima: number; ditolak: number;
  daftar_ulang: number; menungguPembayaran?: number;
};

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  draft:           { label: 'Draft — Belum Dikirim', color: 'var(--adm-text-muted)', bg: 'var(--adm-surface-alt)' },
  verified:        { label: 'Sedang Diverifikasi', color: 'var(--adm-info)', bg: 'var(--adm-info-weak)' },
  diterima_berkas: { label: 'Terima Berkas',        color: 'var(--adm-success)', bg: 'var(--adm-success-weak)' },
  ditolak:         { label: 'Tolak Berkas',         color: 'var(--adm-danger)', bg: 'var(--adm-danger-weak)' },
};

const STATUS_BAYAR_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  belum_bayar:         { label: 'Belum Bayar',              color: 'var(--adm-warning)', bg: 'var(--adm-warning-weak)' },
  cicilan_berjalan:    { label: 'Angsuran Berjalan',        color: 'var(--adm-ungu)', bg: 'var(--adm-ungu-weak)' },
  menunggu_verifikasi: { label: 'Menunggu Verifikasi',       color: 'var(--adm-info)', bg: 'var(--adm-info-weak)' },
  lunas:               { label: 'Lunas',                     color: 'var(--adm-success)', bg: 'var(--adm-success-weak)' },
  ditolak:             { label: 'Ditolak',                   color: 'var(--adm-danger)', bg: 'var(--adm-danger-weak)' },
  dikembalikan:        { label: 'Dikembalikan',               color: 'var(--adm-warning)', bg: 'var(--adm-warning-weak)' },
};

function getInitials(name?: string | null) { const n = name || '?'; return n.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase(); }
// Format resmi "SPMB/0001/SMP/2026-2027/A7K9" (lihat lib/nomorPendaftaran.ts)
// dibuat sekali saat formulir dikirim dan disimpan di noPendaftaran — cukup
// ditampilkan apa adanya. Baris lawas dari sebelum kolom itu ada belum
// punya nomor resmi; REG-YYYY-XXXXX murni jaring pengaman, bukan format baru.
function getRegNo(p: Pendaftaran) { return p.noPendaftaran || `REG-${new Date(p.createdAt).getFullYear()}-${p.id.slice(0, 5).toUpperCase()}`; }

const ITEMS_PER_PAGE = 10;


// ===========================================================================
// Isi halaman Pendaftar, dipakai bersama oleh TIGA rute:
//
//   /admin/pendaftar          -> semua sumber   (sumberTetap tidak diisi)
//   /admin/pendaftar/online   -> hanya online   (sumberTetap="online")
//   /admin/pendaftar/offline  -> hanya offline  (sumberTetap="offline")
//
// Satu implementasi, bukan tiga salinan: dengan begini kolom, filter, aksi,
// dan HASIL EKSPOR ketiganya mustahil berbeda. Ketika sumberTetap diisi,
// nilainya mengunci daftar DAN ekspor — ekspor selalu memakai "filtered",
// yang sudah tersaring oleh sumber, sehingga data online tidak akan pernah
// ikut terbawa ke berkas ekspor halaman offline (dan sebaliknya).
// ===========================================================================

type PropPendaftarView = {
  /** Kunci halaman ke satu sumber pendaftaran. Kosong = tampilkan semua. */
  sumberTetap?: 'online' | 'offline'
}

export function PendaftarView({ sumberTetap }: PropPendaftarView) {
  const router = useRouter();
  const searchParams = useSearchParams();
  // Jenjang SELALU dari konteks sidebar — tidak lagi membaca URL sendiri
  // dengan "Semua Jenjang" sebagai bawaan, yang dulu bisa berselisih dengan
  // jenjang yang tertulis di sidebar.
  const { jenjang, href } = useAdmin();
  // Halaman khusus (/pendaftar/online, /pendaftar/offline) mengunci sumbernya
  // lewat prop; halaman gabungan masih menerima ?sumber= agar tautan lama
  // yang sudah tersebar tetap berfungsi.
  const sumberParam = (searchParams.get('sumber') || '').toLowerCase();
  const sumber: 'online' | 'offline' | '' = sumberTetap
    ?? ((['online', 'offline'].includes(sumberParam) ? sumberParam : '') as 'online' | 'offline' | '');
  // Program keahlian hanya dimiliki SMK.
  const tampilkanJurusan = jenjang === 'smk';
  const tahunAjaranId = searchParams.get('tahunAjaranId') || '';
  const qsOnly = tahunAjaranId ? `?tahunAjaranId=${tahunAjaranId}` : '';
  const [data, setData] = useState<Pendaftaran[]>([]);
  const dataInJenjang = data.filter(p => (p.jenjang || 'smk') === jenjang && (!sumber || (p.sumberDaftar || 'online') === sumber));
  const stats: Stats = {
    total: dataInJenjang.length,
    verified: dataInJenjang.filter(p => p.status === 'verified').length,
    diterima: dataInJenjang.filter(p => p.status === 'diterima_berkas').length,
    ditolak: dataInJenjang.filter(p => p.status === 'ditolak').length,
    daftar_ulang: dataInJenjang.filter(p => p.sudahDaftarUlang).length,
    menungguPembayaran: dataInJenjang.filter(p => p.statusPembayaran === 'menunggu_verifikasi').length,
  };
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterJurusan, setFilterJurusan] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [page, setPage] = useState(1);
  const [toast, setToast] = useState('');

  useEffect(() => {
    loadData();
  }, [router, tahunAjaranId]);

  const loadData = () => {
    setLoading(true);
    fetch(`/api/admin/pendaftar${qsOnly}`).then(r => r.json()).then(d => {
      setData(d.data || []);
      setLoading(false);
    });
  };

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  const filtered = data.filter(p =>
    (p.jenjang || 'smk') === jenjang
    && (!sumber || (p.sumberDaftar || 'online') === sumber)
    && (!search || (p.namaLengkap || '').toLowerCase().includes(search.toLowerCase()) || (p.userEmail || '').toLowerCase().includes(search.toLowerCase()) || (p.nik || '').includes(search))
    && (!filterJurusan || (p.jurusan || '').toUpperCase().includes(filterJurusan))
    && (!filterStatus || (filterStatus === '_daftar_ulang' ? p.sudahDaftarUlang : p.status === filterStatus))
  );
  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const paginated = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);
  // Statistik jurusan TIDAK dihitung di sini. Analisisnya tinggal satu tempat
  // saja — menu Laporan → "Analisis Minat Program Keahlian" — dan hanya untuk
  // SMK. Halaman ini fokus pada data, pencarian, filter, status, dan aksi.

  const namaJenjang = JENJANG_LABEL_FULL[jenjang];
  // Judul, subjudul, breadcrumb, dan tab di bawah SEMUA harus mengikuti
  // `sumber` (filter yang BENAR-BENAR aktif — sudah menggabungkan rute
  // /online /offline maupun ?sumber= lama), bukan `sumberTetap` (cuma
  // rute) sendirian. Sebelumnya keempatnya cuma cek `sumberTetap`, jadi
  // saat mendarat di "/admin/pendaftar?sumber=offline" (mis. tombol
  // "Kembali" dari form Tambah Pendaftar Offline) daftarnya sudah benar
  // tersaring offline saja, tapi judul/tab masih bilang "Semua Pendaftar"
  // — kelihatan seperti dua alur yang tidak nyambung padahal datanya sudah
  // benar.
  const judulHalaman = sumber
    ? `Pendaftar ${sumber === 'online' ? 'Online' : 'Offline'} ${namaJenjang}`
    : `Pendaftar ${namaJenjang}`;
  const subjudulHalaman = sumber === 'online'
    ? 'Pendaftar yang mengisi formulir sendiri melalui portal SPMB.'
    : sumber === 'offline'
      ? 'Pendaftar yang didaftarkan langsung oleh admin di loket.'
      : 'Kelola data pendaftaran peserta didik baru.';

  return (
    <>
      {toast && <div style={{ position: 'fixed', top: 24, right: 24, background: 'var(--adm-primary)', color: 'var(--adm-text-invert)', padding: '12px 20px', borderRadius: 10, fontSize: 13, fontWeight: 600, zIndex: 9999, boxShadow: '0 8px 30px rgba(0,0,0,0.3)' }}>{toast}</div>}

      <div>
        <TopHeader
          judul={judulHalaman}
          subjudul={subjudulHalaman}
          remah={[{ label: 'Pendaftaran' }, { label: 'Pendaftar' }, ...(sumber ? [{ label: sumber === 'online' ? 'Online' : 'Offline' }] : [])]}
          aksi={
            <>
              {/* "Export Biodata" & "Export Keuangan" pindah ke sidebar Laporan
                  (menggantikan tombol "Export Excel" di masing-masing) — lihat
                  app/admin/laporan/page.tsx & app/admin/laporan/keuangan/page.tsx. */}
              {/* Tombol tambah HANYA muncul di halaman Pendaftar Offline —
                  di situlah satu-satunya tempat admin membuat pendaftar
                  offline. Halaman gabungan dan halaman Online tidak
                  menampilkannya, dan tidak ada menu sidebar untuk ini. */}
              {sumberTetap === 'offline' && (
                <PermissionGate resource="pendaftar" action="create">
                  <Link href={href('/admin/pendaftar/tambah')} className="adm-btn adm-btn--primary adm-btn--sm">
                    + Tambah Pendaftar Offline
                  </Link>
                </PermissionGate>
              )}
            </>
          }
        />

        <main style={{ padding: '24px 28px' }}>
          <ReadOnlyBanner
            resource="pendaftar"
            pesan="Anda dapat melihat dan mengekspor data pendaftar. Perubahan data hanya dapat dilakukan oleh Admin SPMB."
          />

          {/* Penghubung antar-tampilan. Sengaja tab di dalam halaman, BUKAN
              menu sidebar tambahan: di sidebar "Pendaftar" tetap satu menu. */}
          <div style={{ display: 'flex', gap: 6, marginBottom: 20, flexWrap: 'wrap' }}>
            {([
              { ke: '', label: 'Semua Pendaftar' },
              { ke: '/online', label: 'Online' },
              { ke: '/offline', label: 'Offline' },
            ] as const).map(t => {
              const iniAktif = sumber === t.ke.replace('/', '');
              return (
                <Link
                  key={t.label}
                  href={href(`/admin/pendaftar${t.ke}`)}
                  style={{
                    padding: '7px 16px', borderRadius: 999, fontSize: 12.5, fontWeight: 600,
                    textDecoration: 'none', border: '1px solid',
                    borderColor: iniAktif ? 'var(--adm-secondary)' : 'var(--adm-border)',
                    background: iniAktif ? 'var(--adm-secondary-weak)' : 'var(--adm-surface)',
                    color: iniAktif ? 'var(--adm-secondary)' : 'var(--adm-text-muted)',
                  }}
                >
                  {t.label}
                </Link>
              );
            })}
          </div>

          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 14, marginBottom: 24 }}>
            {[
              { label: 'Total',            val: stats.total,        color: 'var(--adm-text)' },
              { label: 'Sedang Diverifikasi', val: stats.verified,  color: 'var(--adm-info)' },
              { label: 'Terima Berkas',    val: stats.diterima,     color: 'var(--adm-success)' },
              { label: 'Tolak Berkas',     val: stats.ditolak,      color: 'var(--adm-danger)' },
              { label: 'Daftar Ulang ✓',   val: stats.daftar_ulang, color: 'var(--adm-success)' },
              { label: 'Menunggu Bayar',   val: stats.menungguPembayaran || 0, color: 'var(--adm-warning)' },
            ].map(c => (
              <div key={c.label} style={{ background: 'var(--adm-surface)', borderRadius: 12, padding: '16px 18px', border: '1px solid var(--adm-border)' }}>
                <div className="font-display" style={{ fontSize: 28, fontWeight: 700, color: c.color, lineHeight: 1 }}>{c.val}</div>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--adm-text-muted)', marginTop: 5 }}>{c.label}</div>
              </div>
            ))}
          </div>

          {/* Satu kolom penuh: panel Statistik Jurusan yang dulu menempati
              260px di kanan sudah pindah ke menu Laporan. */}
          <div>
            <div>
              {/* Filter */}
              <div style={{ background: 'var(--adm-surface)', borderRadius: 12, padding: '12px 16px', marginBottom: 14, display: 'flex', gap: 10, alignItems: 'center', border: '1px solid var(--adm-border)', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 160 }}>
                  <Search size={14} color="var(--adm-text-faint)" />
                  <input placeholder="Cari nama, email, atau NIK..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} style={{ flex: 1, border: 'none', outline: 'none', fontSize: 13, fontFamily: 'inherit', background: 'transparent' }} />
                  {search && <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--adm-text-faint)' }}><X size={14} /></button>}
                </div>
                {tampilkanJurusan && (
                  <select value={filterJurusan} onChange={e => { setFilterJurusan(e.target.value); setPage(1); }} style={{ border: '1px solid var(--adm-border)', borderRadius: 7, padding: '6px 10px', fontSize: 12, fontFamily: 'inherit', outline: 'none' }}>
                    <option value="">Semua Jurusan</option>
                    {JURUSAN_SMK.map(j => <option key={j.kode} value={j.kode}>{j.kode} — {j.nama}</option>)}
                  </select>
                )}
                <select value={filterStatus} onChange={e => { setFilterStatus(e.target.value); setPage(1); }} style={{ border: '1px solid var(--adm-border)', borderRadius: 7, padding: '6px 10px', fontSize: 12, fontFamily: 'inherit', outline: 'none' }}>
                  <option value="">Semua Status</option>
                  <option value="draft">Draft — Belum Dikirim</option>
                  <option value="verified">Sedang Diverifikasi</option>
                  <option value="diterima_berkas">Terima Berkas</option>
                  <option value="ditolak">Tolak Berkas</option>
                  <option value="_daftar_ulang">Sudah Daftar Ulang</option>
                </select>
                {(filterJurusan || filterStatus) && <button onClick={() => { setFilterJurusan(''); setFilterStatus(''); }} style={{ fontSize: 11, color: 'var(--adm-secondary)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>Reset</button>}
              </div>

              {/* Table */}
              <div style={{ background: 'var(--adm-surface)', borderRadius: 14, border: '1px solid var(--adm-border)', overflow: 'hidden' }}>
                {loading ? (
                  <div style={{ padding: 60, textAlign: 'center', color: 'var(--adm-text-faint)' }}>Memuat...</div>
                ) : paginated.length === 0 ? (
                  <div style={{ padding: 60, textAlign: 'center' }}><AlertCircle size={32} color="var(--adm-text-faint)" style={{ margin: '0 auto 10px' }} /><p style={{ color: 'var(--adm-text-faint)' }}>Tidak ada data</p></div>
                ) : (
                  <>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ background: 'var(--adm-bg)', borderBottom: '1px solid var(--adm-border)' }}>
                          {['NAMA', ...(tampilkanJurusan ? ['JURUSAN'] : []), 'TGL DAFTAR', 'ASAL SEKOLAH', 'STATUS', 'AKSI'].map(h => (
                            <th key={h} style={{ padding: '11px 14px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: 'var(--adm-text-muted)' }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {paginated.map(p => {
                          const sc = STATUS_CONFIG[p.status] || STATUS_CONFIG['verified'];
                          const jur = cariJurusan(p.jurusan);
                          return (
                            <tr key={p.id} style={{ borderBottom: '1px solid var(--adm-border)' }}
                              onMouseEnter={e => (e.currentTarget.style.background = 'var(--adm-surface-alt)')}
                              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                              <td style={{ padding: '11px 14px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                                  <div style={{ width: 32, height: 32, borderRadius: '50%', background: jur.latar, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: jur.warna, flexShrink: 0 }}>{getInitials(p.namaLengkap)}</div>
                                  <div>
                                    <div style={{ fontWeight: 600, color: 'var(--adm-text)', fontSize: 13 }}>{p.namaLengkap}</div>
                                    <div style={{ fontSize: 10, color: 'var(--adm-text-faint)' }}><TeksKode teks={getRegNo(p)} /></div>
                                    {(p.revisiCount || 0) > 0 && <div style={{ fontSize: 9, color: 'var(--adm-warning)', fontWeight: 600 }}>Revisi {p.revisiCount}x</div>}
                                  </div>
                                </div>
                              </td>
                              {/* Program keahlian hanya ada di SMK. Sebelumnya
                                  kolom ini diisi nama jenjang untuk SMP/SMA —
                                  badge "SMA" di kolom JURUSAN yang tidak
                                  berarti apa-apa. */}
                              {tampilkanJurusan && (
                                <td style={{ padding: '11px 14px' }}>
                                  <span style={{ background: jur.latar, color: jur.warna, padding: '3px 8px', borderRadius: 6, fontSize: 11, fontWeight: 700 }}>
                                    {jur.kode}
                                  </span>
                                </td>
                              )}
                              <td style={{ padding: '11px 14px', fontSize: 12, color: 'var(--adm-text-muted)' }}>{new Date(p.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                              <td style={{ padding: '11px 14px', fontSize: 12, color: 'var(--adm-text-muted)', maxWidth: 120 }}>
                                <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.asalSMP || p.asalSekolah || '-'}</div>
                              </td>
                              <td style={{ padding: '11px 14px' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                                  <span style={{ background: sc.bg, color: sc.color, padding: '3px 9px', borderRadius: 12, fontSize: 11, fontWeight: 700, width: 'fit-content' }}>{sc.label}</span>
                                  {p.statusPembayaran && p.statusPembayaran !== 'lunas' && <span style={{ fontSize: 10, color: 'var(--adm-warning)' }}>Bayar: {STATUS_BAYAR_CONFIG[p.statusPembayaran]?.label || p.statusPembayaran}</span>}
                                </div>
                              </td>
                              <td style={{ padding: '11px 14px' }}>
                                {/* Langsung ke halaman Detail (tab Verifikasi
                                    di depan) — bukan lagi modal di halaman
                                    ini. Modal lama sudah dilipat jadi tab
                                    Verifikasi di sana, jadi "Detail" di sini
                                    tidak lagi menduplikasi tampilan yang sama. */}
                                <Link href={href(`/admin/pendaftar/${p.id}`, { jenjang: p.jenjang || jenjang })} className="adm-btn adm-btn--primary adm-btn--sm">Detail</Link>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                    <div style={{ padding: '12px 16px', borderTop: '1px solid var(--adm-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: 12, color: 'var(--adm-text-faint)' }}>{filtered.length} pendaftar</span>
                      <div style={{ display: 'flex', gap: 5 }}>
                        <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} style={{ width: 28, height: 28, border: '1px solid var(--adm-border)', background: 'var(--adm-surface)', borderRadius: 6, cursor: page === 1 ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: page === 1 ? 0.4 : 1 }}><ChevronLeft size={14} /></button>
                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => i + 1).map(n => (
                          <button key={n} onClick={() => setPage(n)} style={{ width: 28, height: 28, border: '1px solid', borderColor: page === n ? 'var(--adm-secondary)' : 'var(--adm-border)', background: page === n ? 'var(--adm-secondary)' : 'var(--adm-surface)', color: page === n ? 'var(--adm-text-invert)' : 'var(--adm-text-muted)', borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: 600, fontFamily: 'inherit' }}>{n}</button>
                        ))}
                        <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} style={{ width: 28, height: 28, border: '1px solid var(--adm-border)', background: 'var(--adm-surface)', borderRadius: 6, cursor: page === totalPages ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: page === totalPages ? 0.4 : 1 }}><ChevronRight size={14} /></button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

          </div>
        </main>
      </div>

    </>
  );
}

