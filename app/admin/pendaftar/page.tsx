'use client';
import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Search, X, Save, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { TopHeader } from '@/components/admin/TopHeader';
import { PermissionGate, ReadOnlyBanner } from '@/components/admin/ui';
import { hitungRingkasan } from '@/lib/pembayaran-utils';

type Pendaftaran = {
  id: string; namaLengkap: string | null; namaPanggilan?: string;
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
  sudahDaftarUlang?: boolean; tanggalDaftarUlang?: string; catatanDaftarUlang?: string;
  fileIjazah?: string | null; fileAkte?: string | null;
  fileKK?: string | null; fileKtpOrtu?: string | null;
  fileKip?: string | null; fileFoto?: string | null;
  createdAt: string; userEmail?: string; userId?: string;
  pembayaranList?: { id: string; jenis?: string; nominal: number; status: string }[];
};

type Stats = {
  total: number; verified: number;
  diterima: number; ditolak: number;
  daftar_ulang: number; menungguPembayaran?: number;
};

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  draft:           { label: 'Draft — Belum Dikirim', color: 'var(--adm-text-muted)', bg: '#F3F4F6' },
  verified:        { label: 'Sedang Diverifikasi', color: '#1E40AF', bg: '#DBEAFE' },
  diterima_berkas: { label: 'Terima Berkas',        color: '#065F46', bg: '#D1FAE5' },
  ditolak:         { label: 'Tolak Berkas',         color: '#991B1B', bg: '#FEE2E2' },
};

const STATUS_BAYAR_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  belum_bayar:         { label: 'Belum Bayar',              color: '#92400E', bg: '#FEF3C7' },
  cicilan_berjalan:    { label: 'Cicilan Berjalan',         color: '#5B21B6', bg: '#F5F3FF' },
  menunggu_verifikasi: { label: 'Menunggu Verifikasi',       color: '#1E40AF', bg: '#DBEAFE' },
  lunas:               { label: 'Lunas',                     color: '#065F46', bg: '#D1FAE5' },
  ditolak:             { label: 'Ditolak',                   color: '#991B1B', bg: '#FEE2E2' },
};

const JURUSAN_LIST = [
  { kode: 'PPLG', color: '#1D4ED8' }, { kode: 'TJKT', color: '#4fcbeb' },
  { kode: 'DKV',  color: '#D97706' }, { kode: 'MPLB', color: '#EAB308' },
  { kode: 'BDR',  color: '#e2c9ad' }, { kode: 'PH',   color: '#16A34A' },
];

function getInitials(name?: string | null) { const n = name || '?'; return n.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase(); }
function getRegNo(id: string, date: string) { const d = new Date(date); return `REG-${d.getFullYear()}-${id.slice(0, 5).toUpperCase()}`; }
function getJurusanKode(j?: string | null) { const v = j || ''; for (const jj of JURUSAN_LIST) { if (v.toUpperCase().includes(jj.kode)) return jj.kode; } return v ? v.slice(0, 4).toUpperCase() : '-'; }
function getJurusanColor(j?: string | null) { const v = j || ''; for (const jj of JURUSAN_LIST) { if (v.toUpperCase().includes(jj.kode)) return jj.color; } return '#6B7280'; }

const ITEMS_PER_PAGE = 10;

export default function AdminPendaftar() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--adm-text-faint)' }}>Memuat...</div>}>
      <AdminPendaftarInner />
    </Suspense>
  );
}

function AdminPendaftarInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const jenjangParam = (searchParams.get('jenjang') || '').toLowerCase();
  const jenjang: 'smp' | 'sma' | 'smk' | '' = (['smp', 'sma', 'smk'].includes(jenjangParam) ? jenjangParam : '') as any;
  const sumberParam = (searchParams.get('sumber') || '').toLowerCase();
  const sumber: 'online' | 'offline' | '' = (['online', 'offline'].includes(sumberParam) ? sumberParam : '') as any;
  const tahunAjaranId = searchParams.get('tahunAjaranId') || '';
  const qs = tahunAjaranId ? `&tahunAjaranId=${tahunAjaranId}` : '';
  const qsOnly = tahunAjaranId ? `?tahunAjaranId=${tahunAjaranId}` : '';
  const [data, setData] = useState<Pendaftaran[]>([]);
  const dataInJenjang = data.filter(p => (!jenjang || (p.jenjang || 'smk') === jenjang) && (!sumber || (p.sumberDaftar || 'online') === sumber));
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
  const [selected, setSelected] = useState<Pendaftaran | null>(null);
  const [editModal, setEditModal] = useState(false);
  const [editForm, setEditForm] = useState({
    status: '', catatan: '',
    alasanPenolakan: '', waVerified: false,
    statusPembayaran: '', catatanPembayaran: '',
    pesanPengumuman: '', catatanDaftarUlang: '',
  });
  const [saving, setSaving] = useState(false);
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

  const openEdit = (p: Pendaftaran, defaultStatus?: string) => {
    setSelected(p);
    setEditForm({
      status: defaultStatus || p.status,
      catatan: p.catatan || '',
      alasanPenolakan: p.alasanPenolakan || '',
      waVerified: p.waVerified || false,
      statusPembayaran: p.statusPembayaran || 'belum_bayar',
      catatanPembayaran: p.catatanPembayaran || '',
      pesanPengumuman: p.pesanPengumuman || '',
      catatanDaftarUlang: p.catatanDaftarUlang || '',
    });
    setEditModal(true);
  };

  const handleSave = async () => {
    if (!selected) return;
    setSaving(true);
    const res = await fetch(`/api/admin/pendaftar/${selected.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status: editForm.status,
        catatan: editForm.catatan,
        alasanPenolakan: editForm.alasanPenolakan,
        waVerified: editForm.waVerified,
        statusPembayaran: editForm.statusPembayaran || undefined,
        catatanPembayaran: editForm.catatanPembayaran,
        pesanPengumuman: editForm.pesanPengumuman,
        catatanDaftarUlang: editForm.catatanDaftarUlang,
      }),
    });
    if (res.ok) { setEditModal(false); setSelected(null); loadData(); showToast('✅ Data berhasil diperbarui'); }
    setSaving(false);
  };

  // Konfirmasi daftar ulang langsung
  const handleKonfirmasiDaftarUlang = async (id: string) => {
    if (!confirm('Konfirmasi bahwa siswa ini sudah melakukan daftar ulang offline?')) return;
    const res = await fetch(`/api/admin/pendaftar/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sudahDaftarUlang: true }),
    });
    if (res.ok) { loadData(); setSelected(null); showToast('✅ Daftar ulang dikonfirmasi'); }
  };

  // Toggle verifikasi WhatsApp (cek manual admin)
  const handleToggleWa = async (p: Pendaftaran) => {
    const res = await fetch(`/api/admin/pendaftar/${p.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ waVerified: !p.waVerified }),
    });
    if (res.ok) {
      const d = await res.json();
      setSelected(d.data);
      loadData();
      showToast(d.data.waVerified ? '✅ No. WhatsApp ditandai terverifikasi' : 'No. WhatsApp dibatalkan verifikasinya');
    }
  };

  // Reset password akun siswa (untuk yang lupa email/password)
  const handleResetPassword = async (p: Pendaftaran) => {
    if (!p.userId) { showToast('❌ Data akun tidak ditemukan'); return; }
    const pwBaru = prompt(`Masukkan password baru untuk ${p.namaLengkap} (${p.userEmail || '-'}), minimal 8 karakter:`);
    if (!pwBaru) return;
    if (pwBaru.length < 8) { showToast('❌ Password minimal 8 karakter'); return; }
    if (!confirm(`Reset password akun ${p.userEmail} menjadi password baru ini?`)) return;

    const res = await fetch('/api/admin/reset-password', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: p.userId, passwordBaru: pwBaru }),
    });
    const d = await res.json();
    if (res.ok) {
      alert(`✅ Password berhasil direset!\n\nEmail: ${d.email}\nPassword baru: ${pwBaru}\n\nSampaikan info ini ke siswa melalui WhatsApp.`);
    } else {
      showToast(`❌ ${d.error || 'Gagal reset password'}`);
    }
  };
  const handleExportExcel = () => {
    const headers = [
      'No', 'Sumber Daftar', 'Status Verifikasi', 'Status Pembayaran', 'Email Akun',
      'Nama Lengkap', 'Nama Panggilan', 'Tempat Lahir', 'Tanggal Lahir', 'Jenis Kelamin', 'Agama', 'Anak Ke',
      'Berat Badan', 'Tinggi Badan', 'Golongan Darah', 'Ukuran Seragam',
      'NIK', 'NISN', 'No. WhatsApp', 'WA Terverifikasi',
      'Alamat', 'RT', 'RW', 'Kelurahan', 'Kecamatan', 'Kab/Kota',
      'Nama Pemberi Referensi', 'No. HP Referensi',
      'Jenjang', 'Jurusan', 'Kelas', 'Tipe Pendaftaran', 'Kelas Masuk (Pindahan)',
      'Asal SD', 'Asal SMP',
      'Nama Ayah', 'TTL Ayah', 'Pendidikan Ayah', 'Pekerjaan Ayah', 'Penghasilan Ayah', 'No. HP Ayah', 'Alamat Ayah',
      'Nama Ibu', 'TTL Ibu', 'Pendidikan Ibu', 'Pekerjaan Ibu', 'Penghasilan Ibu', 'No. HP Ibu', 'Alamat Ibu',
      'Nama Wali', 'TTL Wali', 'Pendidikan Wali', 'Pekerjaan Wali', 'Penghasilan Wali', 'No. HP Wali', 'Alamat Wali',
      'Gelombang', 'Total Tagihan',
      'Sudah Daftar Ulang', 'Tanggal Daftar Ulang', 'Catatan Daftar Ulang',
      'Catatan Admin', 'Alasan Penolakan', 'Pesan Pengumuman',
      'File Ijazah', 'File Akte', 'File KK', 'File KTP Ortu', 'File KIP', 'File Foto',
      'Tanggal Daftar',
    ];
    const rows = filtered.map((p, i) => [
      i + 1, (p.sumberDaftar || 'online') === 'online' ? 'Online' : 'Offline',
      STATUS_CONFIG[p.status]?.label || p.status, STATUS_BAYAR_CONFIG[p.statusPembayaran || 'belum_bayar']?.label || p.statusPembayaran || '-',
      p.userEmail || '-',
      p.namaLengkap || '-', p.namaPanggilan || '-', p.tempatLahir || '-', p.tanggalLahir || '-', p.jenisKelamin || '-', p.agama || '-', p.anakKe || '-',
      p.beratBadan || '-', p.tinggiBadan || '-', p.golonganDarah || '-', p.ukuranSeragam || '-',
      p.nik || '-', p.nisn || '-', p.noPribadi || '-', p.waVerified ? 'Ya' : 'Belum',
      p.alamat || '-', p.rt || '-', p.rw || '-', p.kelurahan || '-', p.kecamatan || '-', p.kabupaten || '-',
      p.namaPemberiReferensi || '-', p.noHpReferensi || '-',
      (p.jenjang || 'smk').toUpperCase(), p.jurusan || '-', p.kelas || '-', p.tipePendaftaran === 'pindahan' ? 'Pindahan' : 'Baru', p.kelasMasuk || '-',
      p.asalSD || '-', p.asalSMP || p.asalSekolah || '-',
      p.namaAyah || '-', p.ttlAyah || '-', p.pendidikanAyah || '-', p.pekerjaanAyah || '-', p.penghasilanAyah || '-', p.noHpAyah || '-', p.alamatAyah || '-',
      p.namaIbu || '-', p.ttlIbu || '-', p.pendidikanIbu || '-', p.pekerjaanIbu || '-', p.penghasilanIbu || '-', p.noHpIbu || '-', p.alamatIbu || '-',
      p.namaWali || '-', p.ttlWali || '-', p.pendidikanWali || '-', p.pekerjaanWali || '-', p.penghasilanWali || '-', p.noHpWali || '-', p.alamatWali || '-',
      p.gelombang || '-', p.totalTagihan ?? 0,
      p.sudahDaftarUlang ? 'Ya' : 'Belum', p.tanggalDaftarUlang ? new Date(p.tanggalDaftarUlang).toLocaleDateString('id-ID') : '-', p.catatanDaftarUlang || '-',
      p.catatan || '-', p.alasanPenolakan || '-', p.pesanPengumuman || '-',
      p.fileIjazah || '-', p.fileAkte || '-', p.fileKK || '-', p.fileKtpOrtu || '-', p.fileKip || '-', p.fileFoto || '-',
      new Date(p.createdAt).toLocaleDateString('id-ID'),
    ]);
    const csv = '\uFEFF' + [headers, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\r\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
    a.download = `data-pendaftar-${jenjang || 'semua'}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  };

  const handleExportKeuangan = () => {
    const headers = [
      'No', 'Nama Lengkap', 'Email Akun', 'Jenjang', 'Jurusan', 'Kelas', 'Sumber Daftar',
      'Gelombang', 'Total Tagihan', 'Total Dibayar (Bersih)', 'Tunggakan (Kurang Bayar)',
      'Kelebihan Bayar', 'Sudah Dikembalikan (Refund)', 'Status Pembayaran',
      'Jumlah Cicilan Terverifikasi', 'Jumlah Cicilan Menunggu Verifikasi', 'Jumlah Refund',
    ];
    const rows = filtered.map((p, i) => {
      const list = p.pembayaranList || [];
      const totalTagihan = p.totalTagihan || 0;
      const { totalDibayar, sisaBayar, kelebihanBayar, totalRefund } = hitungRingkasan(list, totalTagihan);
      const jmlCicilanLunas = list.filter(x => (x.jenis || 'bayar') === 'bayar' && x.status === 'lunas').length;
      const jmlMenunggu = list.filter(x => x.status === 'menunggu_verifikasi').length;
      const jmlRefund = list.filter(x => x.jenis === 'refund' && x.status === 'lunas').length;
      return [
        i + 1, p.namaLengkap || '-', p.userEmail || '-', (p.jenjang || 'smk').toUpperCase(), p.jurusan || '-', p.kelas || '-',
        (p.sumberDaftar || 'online') === 'online' ? 'Online' : 'Offline',
        p.gelombang || '-', totalTagihan, totalDibayar, sisaBayar, kelebihanBayar, totalRefund,
        STATUS_BAYAR_CONFIG[p.statusPembayaran || 'belum_bayar']?.label || p.statusPembayaran || '-',
        jmlCicilanLunas, jmlMenunggu, jmlRefund,
      ];
    });
    const csv = '\uFEFF' + [headers, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\r\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
    a.download = `keuangan-pendaftar-${jenjang || 'semua'}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Yakin ingin menghapus data ini?')) return;
    const res = await fetch(`/api/admin/pendaftar/${id}`, { method: 'DELETE' });
    if (res.ok) { loadData(); setSelected(null); showToast('🗑 Data dihapus'); }
  };

 

  const filtered = data.filter(p =>
    (!jenjang || (p.jenjang || 'smk') === jenjang)
    && (!sumber || (p.sumberDaftar || 'online') === sumber)
    && (!search || (p.namaLengkap || '').toLowerCase().includes(search.toLowerCase()) || (p.userEmail || '').toLowerCase().includes(search.toLowerCase()) || (p.nik || '').includes(search))
    && (!filterJurusan || (p.jurusan || '').toUpperCase().includes(filterJurusan))
    && (!filterStatus || (filterStatus === '_daftar_ulang' ? p.sudahDaftarUlang : p.status === filterStatus))
  );
  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const paginated = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);
  const jurusanStats = JURUSAN_LIST.map(j => ({
    ...j,
    count: data.filter(p => (p.jurusan || '').toUpperCase().includes(j.kode)).length,
    pct: data.length > 0 ? Math.round((data.filter(p => (p.jurusan || '').toUpperCase().includes(j.kode)).length / data.length) * 100) : 0,
  })).sort((a, b) => b.count - a.count);

  const inp: React.CSSProperties = { width: '100%', padding: '9px 12px', border: '1.5px solid var(--adm-border-strong)', borderRadius: 8, fontSize: 13, fontFamily: 'inherit', background: 'var(--adm-surface)', outline: 'none' };
  const showAlasan      = editForm.status === 'ditolak';
  const showPengumuman  = editForm.status === 'diterima_berkas';

  return (
    <>
      {toast && <div style={{ position: 'fixed', top: 24, right: 24, background: 'var(--adm-primary)', color: 'var(--adm-text-invert)', padding: '12px 20px', borderRadius: 10, fontSize: 13, fontWeight: 600, zIndex: 9999, boxShadow: '0 8px 30px rgba(0,0,0,0.3)' }}>{toast}</div>}

      <div>
        <TopHeader
          judul={`Pendaftar ${jenjang ? jenjang.toUpperCase() : 'Semua Jenjang'}${sumber ? (sumber === 'online' ? ' · Online' : ' · Offline') : ''}`}
          subjudul="Kelola data pendaftaran peserta didik baru."
          remah={[{ label: 'Pendaftaran' }, { label: 'Pendaftar' }]}
          aksi={
            <>
              <PermissionGate resource="pendaftar" action="export">
                <button onClick={handleExportExcel} className="adm-btn adm-btn--ghost adm-btn--sm">
                  Export Biodata
                </button>
              </PermissionGate>
              <PermissionGate resource="laporan_keuangan" action="export">
                <button onClick={handleExportKeuangan} className="adm-btn adm-btn--secondary adm-btn--sm">
                  Export Keuangan
                </button>
              </PermissionGate>
              {jenjang && (
                <PermissionGate resource="pendaftar" action="create">
                  <Link href={`/admin/pendaftar/tambah?jenjang=${jenjang}${qs}`} className="adm-btn adm-btn--primary adm-btn--sm">
                    + Tambah Offline
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
          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 14, marginBottom: 24 }}>
            {[
              { label: 'Total',            val: stats.total,        color: 'var(--adm-text)' },
              { label: 'Sedang Diverifikasi', val: stats.verified,  color: '#1E40AF' },
              { label: 'Terima Berkas',    val: stats.diterima,     color: '#059669' },
              { label: 'Tolak Berkas',     val: stats.ditolak,      color: '#DC2626' },
              { label: 'Daftar Ulang ✓',   val: stats.daftar_ulang, color: '#065F46' },
              { label: 'Menunggu Bayar',   val: stats.menungguPembayaran || 0, color: '#D97706' },
            ].map(c => (
              <div key={c.label} style={{ background: 'var(--adm-surface)', borderRadius: 12, padding: '16px 18px', border: '1px solid var(--adm-border)' }}>
                <div className="font-display" style={{ fontSize: 28, fontWeight: 700, color: c.color, lineHeight: 1 }}>{c.val}</div>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--adm-text-muted)', marginTop: 5 }}>{c.label}</div>
              </div>
            ))}
          </div>

          <div className="detail-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 260px', gap: 20 }}>
            <div>
              {/* Filter */}
              <div style={{ background: 'var(--adm-surface)', borderRadius: 12, padding: '12px 16px', marginBottom: 14, display: 'flex', gap: 10, alignItems: 'center', border: '1px solid var(--adm-border)', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 160 }}>
                  <Search size={14} color="#9CA3AF" />
                  <input placeholder="Cari nama, email, atau NIK..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} style={{ flex: 1, border: 'none', outline: 'none', fontSize: 13, fontFamily: 'inherit', background: 'transparent' }} />
                  {search && <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--adm-text-faint)' }}><X size={14} /></button>}
                </div>
                {(!jenjang || jenjang === 'smk') && (
                  <select value={filterJurusan} onChange={e => { setFilterJurusan(e.target.value); setPage(1); }} style={{ border: '1px solid var(--adm-border)', borderRadius: 7, padding: '6px 10px', fontSize: 12, fontFamily: 'inherit', outline: 'none' }}>
                    <option value="">Semua Jurusan</option>
                    {JURUSAN_LIST.map(j => <option key={j.kode} value={j.kode}>{j.kode}</option>)}
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
                  <div style={{ padding: 60, textAlign: 'center' }}><AlertCircle size={32} color="#E5E7EB" style={{ margin: '0 auto 10px' }} /><p style={{ color: 'var(--adm-text-faint)' }}>Tidak ada data</p></div>
                ) : (
                  <>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ background: 'var(--adm-bg)', borderBottom: '1px solid var(--adm-border)' }}>
                          {['NAMA', 'JURUSAN', 'TGL DAFTAR', 'ASAL SEKOLAH', 'STATUS', 'AKSI'].map(h => (
                            <th key={h} style={{ padding: '11px 14px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: 'var(--adm-text-muted)' }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {paginated.map(p => {
                          const sc = STATUS_CONFIG[p.status] || STATUS_CONFIG['verified'];
                          const jc = getJurusanColor(p.jurusan);
                          return (
                            <tr key={p.id} style={{ borderBottom: '1px solid var(--adm-border)' }}
                              onMouseEnter={e => (e.currentTarget.style.background = '#FAFBFC')}
                              onMouseLeave={e => (e.currentTarget.style.background = 'white')}>
                              <td style={{ padding: '11px 14px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                                  <div style={{ width: 32, height: 32, borderRadius: '50%', background: `${jc}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: jc, flexShrink: 0 }}>{getInitials(p.namaLengkap)}</div>
                                  <div>
                                    <div style={{ fontWeight: 600, color: 'var(--adm-text)', fontSize: 13 }}>{p.namaLengkap}</div>
                                    <div style={{ fontSize: 10, color: 'var(--adm-text-faint)' }}>{getRegNo(p.id, p.createdAt)}</div>
                                    {(p.revisiCount || 0) > 0 && <div style={{ fontSize: 9, color: '#EA580C', fontWeight: 600 }}>Revisi {p.revisiCount}x</div>}
                                  </div>
                                </div>
                              </td>
                              <td style={{ padding: '11px 14px' }}>
                                <span style={{ background: `${jc}15`, color: jc, padding: '3px 8px', borderRadius: 6, fontSize: 11, fontWeight: 700 }}>
                                  {(p.jenjang || 'smk') === 'smk' ? getJurusanKode(p.jurusan) : (p.jenjang || 'smk').toUpperCase()}
                                </span>
                              </td>
                              <td style={{ padding: '11px 14px', fontSize: 12, color: 'var(--adm-text-muted)' }}>{new Date(p.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                              <td style={{ padding: '11px 14px', fontSize: 12, color: 'var(--adm-text-muted)', maxWidth: 120 }}>
                                <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.asalSMP || p.asalSekolah || '-'}</div>
                              </td>
                              <td style={{ padding: '11px 14px' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                                  <span style={{ background: sc.bg, color: sc.color, padding: '3px 9px', borderRadius: 12, fontSize: 11, fontWeight: 700, width: 'fit-content' }}>{sc.label}</span>
                                  {p.statusPembayaran && p.statusPembayaran !== 'lunas' && <span style={{ fontSize: 10, color: '#B45309' }}>Bayar: {STATUS_BAYAR_CONFIG[p.statusPembayaran]?.label || p.statusPembayaran}</span>}
                                </div>
                              </td>
                              <td style={{ padding: '11px 14px' }}>
                                <button onClick={() => { setSelected(p); setEditModal(false); }} style={{ background: 'var(--adm-primary)', color: 'var(--adm-text-invert)', border: 'none', borderRadius: 7, padding: '6px 12px', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>Detail</button>
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
                          <button key={n} onClick={() => setPage(n)} style={{ width: 28, height: 28, border: '1px solid', borderColor: page === n ? '#C8973A' : '#E5E7EB', background: page === n ? '#C8973A' : 'white', color: page === n ? '#0A1628' : '#374151', borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: 600, fontFamily: 'inherit' }}>{n}</button>
                        ))}
                        <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} style={{ width: 28, height: 28, border: '1px solid var(--adm-border)', background: 'var(--adm-surface)', borderRadius: 6, cursor: page === totalPages ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: page === totalPages ? 0.4 : 1 }}><ChevronRight size={14} /></button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Right Panel */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ background: 'var(--adm-surface)', borderRadius: 14, padding: 18, border: '1px solid var(--adm-border)' }}>
                <h3 style={{ fontSize: 13, fontWeight: 700, color: 'var(--adm-text)', marginBottom: 14 }}>Statistik Jurusan</h3>
                {jurusanStats.map(j => (
                  <div key={j.kode} style={{ marginBottom: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: j.color }}>{j.kode}</span>
                      <span style={{ fontSize: 11, color: 'var(--adm-text-muted)' }}>{j.count} ({j.pct}%)</span>
                    </div>
                    <div style={{ height: 5, background: 'var(--adm-neutral-weak)', borderRadius: 3 }}>
                      <div style={{ height: '100%', width: `${j.pct}%`, background: j.color, borderRadius: 3 }} />
                    </div>
                  </div>
                ))}
              </div>

              

            </div>
          </div>
        </main>
      </div>

      {/* DETAIL MODAL */}
      {selected && !editModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }} onClick={() => setSelected(null)}>
          <div style={{ background: 'var(--adm-bg)', borderRadius: 20, width: '100%', maxWidth: 820, maxHeight: '90vh', overflow: 'auto' }} onClick={e => e.stopPropagation()}>
            <div style={{ background: 'var(--adm-surface)', padding: '16px 22px', borderBottom: '1px solid var(--adm-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 1, borderRadius: '20px 20px 0 0' }}>
              <div>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--adm-text)' }}>Detail Pendaftar — {getRegNo(selected.id, selected.createdAt)}</h3>
                <p style={{ fontSize: 11, color: 'var(--adm-text-faint)' }}>Dashboard › Verifikasi › Detail</p>
              </div>
              <button onClick={() => setSelected(null)} style={{ background: 'var(--adm-neutral-weak)', border: 'none', borderRadius: 8, width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><X size={15} /></button>
            </div>

            <div className="detail-grid" style={{ padding: 18, display: 'grid', gridTemplateColumns: '1fr 240px', gap: 16 }}>
              {/* LEFT */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {/* Profil */}
                <div style={{ background: 'var(--adm-surface)', borderRadius: 14, padding: 18, border: '1px solid var(--adm-border)' }}>
                  <div style={{ display: 'flex', gap: 14, alignItems: 'center', marginBottom: 14 }}>
                    <div style={{ width: 56, height: 56, borderRadius: 12, background: `${getJurusanColor(selected.jurusan)}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 800, color: getJurusanColor(selected.jurusan) }}>{getInitials(selected.namaLengkap)}</div>
                    <div>
                      <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--adm-text)' }}>{selected.namaLengkap}</div>
                      <div style={{ fontSize: 12, color: 'var(--adm-text-muted)', marginBottom: 2 }}>{selected.jurusan}</div>
                      {selected.userEmail && (
                        <div style={{ fontSize: 11, color: 'var(--adm-text-muted)', marginBottom: 7 }}>
                           {selected.userEmail}
                        </div>
                      )}
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        {(() => { const sc = STATUS_CONFIG[selected.status] || STATUS_CONFIG['verified']; return <span style={{ background: sc.bg, color: sc.color, padding: '2px 10px', borderRadius: 10, fontSize: 11, fontWeight: 700 }}>{sc.label}</span>; })()}
                        {(selected.revisiCount || 0) > 0 && <span style={{ fontSize: 11, color: '#EA580C', background: '#FFF7ED', padding: '2px 8px', borderRadius: 10, fontWeight: 600 }}>Revisi {selected.revisiCount}x</span>}
                        {selected.sudahDaftarUlang && <span style={{ fontSize: 11, color: '#065F46', background: '#D1FAE5', padding: '2px 8px', borderRadius: 10, fontWeight: 600 }}>Daftar Ulang ✓</span>}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                    {[
                      ['TTL', selected.ttl || `${selected.tempatLahir || '-'}, ${selected.tanggalLahir || '-'}`],
                      ['Jenis Kelamin', selected.jenisKelamin], ['Agama', selected.agama],
                      ['NIK', selected.nik || '-'], ['NISN', selected.nisn || '-'],
                      ['No. WhatsApp', `${selected.noPribadi || '-'}${selected.noPribadi ? (selected.waVerified ? '  ✓ Terverifikasi' : '  ⏳ Belum diverifikasi') : ''}`],
                      ['Alamat', `${selected.alamat}${selected.rt ? `, RT ${selected.rt}/RW ${selected.rw}` : ''}`],
                      ['Kec/Kab', `${selected.kecamatan || '-'}, ${selected.kabupaten || '-'}`],
                    ].map(([l, v]) => (
                      <div key={l} style={{ background: '#FAFAFA', borderRadius: 8, padding: '7px 10px' }}>
                        <div style={{ fontSize: 10, color: 'var(--adm-text-faint)', fontWeight: 600, marginBottom: 2 }}>{l}</div>
                        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--adm-text)' }}>{v || '-'}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Akademik */}
                <div style={{ background: 'var(--adm-surface)', borderRadius: 14, padding: 16, border: '1px solid var(--adm-border)' }}>
                  <h4 style={{ fontSize: 13, fontWeight: 700, color: 'var(--adm-text)', marginBottom: 10 }}>📚 Data Akademik</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                    {[['Jenjang', (selected.jenjang || 'smk').toUpperCase()], ['Sumber Daftar', (selected.sumberDaftar || 'online') === 'online' ? 'Online' : 'Offline'], ['Jurusan', selected.jurusan], ['Asal SMP', selected.asalSMP || selected.asalSekolah || '-'], ['Asal SD', selected.asalSD || '-'], ['NISN', selected.nisn || '-']].map(([l, v]) => (
                      <div key={l} style={{ background: '#FAFAFA', borderRadius: 8, padding: '7px 10px' }}>
                        <div style={{ fontSize: 10, color: 'var(--adm-text-faint)', fontWeight: 600, marginBottom: 2 }}>{l}</div>
                        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--adm-text)' }}>{v}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Orang Tua */}
                <div style={{ background: 'var(--adm-surface)', borderRadius: 14, padding: 16, border: '1px solid var(--adm-border)' }}>
                  <h4 style={{ fontSize: 13, fontWeight: 700, color: 'var(--adm-text)', marginBottom: 10 }}>👨‍👩‍👦 Data Orang Tua</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                    {[['Nama Ayah', selected.namaAyah || selected.namaOrtu || '-'], ['Pekerjaan Ayah', selected.pekerjaanAyah || '-'], ['Nama Ibu', selected.namaIbu || '-'], ['Pekerjaan Ibu', selected.pekerjaanIbu || '-'], ['HP Ortu', selected.noHpAyah || selected.noHpIbu || selected.noOrtu || '-'], ['Nama Wali', selected.namaWali || '-']].map(([l, v]) => (
                      <div key={l} style={{ background: '#FAFAFA', borderRadius: 8, padding: '7px 10px' }}>
                        <div style={{ fontSize: 10, color: 'var(--adm-text-faint)', fontWeight: 600, marginBottom: 2 }}>{l}</div>
                        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--adm-text)' }}>{v}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Dokumen */}
                <div style={{ background: 'var(--adm-surface)', borderRadius: 14, padding: 16, border: '1px solid var(--adm-border)' }}>
                  <h4 style={{ fontSize: 13, fontWeight: 700, color: 'var(--adm-text)', marginBottom: 10 }}>📎 Dokumen Pendukung</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                    {[
                      { label: 'Ijazah', path: selected.fileIjazah },
                      { label: 'Akte', path: selected.fileAkte },
                      { label: 'Kartu KK', path: selected.fileKK },
                      { label: 'KTP Ortu', path: selected.fileKtpOrtu },
                      { label: 'Kartu KIP', path: selected.fileKip },
                      { label: 'Pas Foto', path: selected.fileFoto },
                    ].map(dok => {
                      const isImg = dok.path && /\.(jpg|jpeg|png)$/i.test(dok.path);
                      return (
                        <div key={dok.label} style={{ background: dok.path ? '#F0FDF4' : '#F8F9FA', borderRadius: 10, padding: 10, textAlign: 'center', border: `1px solid ${dok.path ? '#86EFAC' : '#E5E7EB'}`, cursor: dok.path ? 'pointer' : 'default' }}
                          onClick={() => dok.path && window.open(dok.path, '_blank')}>
                          {isImg ? <img src={dok.path!} alt={dok.label} style={{ width: '100%', height: 52, objectFit: 'cover', borderRadius: 6, marginBottom: 5 }} /> : <div style={{ fontSize: 24, marginBottom: 5 }}>{dok.path ? '📄' : '📂'}</div>}
                          <div style={{ fontSize: 10, fontWeight: 700, color: dok.path ? '#16A34A' : '#6B7280' }}>{dok.label}</div>
                          <div style={{ fontSize: 9, color: dok.path ? '#16A34A' : '#9CA3AF', marginTop: 2 }}>{dok.path ? '✓ Klik lihat' : 'Belum upload'}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Ringkasan Pembayaran */}
                <div style={{ background: 'var(--adm-primary)', borderRadius: 14, padding: 16, color: 'var(--adm-text-invert)' }}>
                  <h4 style={{ fontSize: 13, fontWeight: 700, color: 'var(--adm-secondary)', marginBottom: 10 }}>💳 Status Pembayaran</h4>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                    <span style={{ fontSize: 13, fontWeight: 600 }}>{STATUS_BAYAR_CONFIG[selected.statusPembayaran || 'belum_bayar']?.label}</span>
                    {selected.totalTagihan != null && <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>Tagihan: Rp{selected.totalTagihan.toLocaleString('id-ID')}</span>}
                  </div>
                  <Link href={`/admin/pendaftar/${selected.id}`} style={{ display: 'block', textAlign: 'center', fontSize: 12, fontWeight: 700, color: 'var(--adm-text)', background: 'var(--adm-secondary)', borderRadius: 8, padding: '8px', textDecoration: 'none' }}>
                    Lihat Riwayat Cicilan & Kwitansi →
                  </Link>
                </div>

                {/* Daftar Ulang Info */}
                {selected.sudahDaftarUlang && (
                  <div style={{ background: '#D1FAE5', borderRadius: 14, padding: 16, border: '1px solid #A7F3D0' }}>
                    <h4 style={{ fontSize: 13, fontWeight: 700, color: '#065F46', marginBottom: 8 }}>✅ Daftar Ulang Dikonfirmasi</h4>
                    {selected.tanggalDaftarUlang && <p style={{ fontSize: 12, color: '#065F46', margin: 0 }}>Tanggal: {new Date(selected.tanggalDaftarUlang).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>}
                    {selected.catatanDaftarUlang && <p style={{ fontSize: 12, color: '#047857', marginTop: 6, margin: 0 }}>{selected.catatanDaftarUlang}</p>}
                  </div>
                )}
              </div>

              {/* RIGHT - Panel */}
              <div style={{ position: 'sticky', top: 60, alignSelf: 'flex-start' }}>
                <div style={{ background: 'var(--adm-surface)', borderRadius: 14, padding: 16, border: '1px solid var(--adm-border)' }}>
                  <h4 style={{ fontSize: 13, fontWeight: 700, color: 'var(--adm-text)', marginBottom: 12 }}>Panel Verifikasi</h4>

                  {(() => { const sc = STATUS_CONFIG[selected.status] || STATUS_CONFIG['verified']; return (
                    <div style={{ background: sc.bg, borderRadius: 8, padding: '9px 12px', marginBottom: 14 }}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: sc.color, marginBottom: 2 }}>STATUS SAAT INI</div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: sc.color }}>{sc.label}</div>
                    </div>
                  ); })()}

                  {/* Verifikasi WhatsApp (manual, bukan email) */}
                  <div style={{ background: selected.waVerified ? '#F0FDF4' : '#FFFBEB', border: `1px solid ${selected.waVerified ? '#A7F3D0' : '#FDE68A'}`, borderRadius: 8, padding: 10, marginBottom: 12 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: selected.waVerified ? '#065F46' : '#92400E', marginBottom: 4 }}>📱 No. WhatsApp: {selected.noPribadi || '-'}</div>
                    <p style={{ fontSize: 11, color: 'var(--adm-text-muted)', marginBottom: 8 }}>Hubungi nomor ini via WhatsApp untuk memastikan aktif & benar milik pendaftar.</p>
                    <button onClick={() => handleToggleWa(selected)} style={{ width: '100%', padding: '7px 10px', background: selected.waVerified ? '#D1FAE5' : '#0A1628', border: 'none', borderRadius: 8, color: selected.waVerified ? '#065F46' : 'white', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                      {selected.waVerified ? '✓ WhatsApp Terverifikasi (klik batalkan)' : 'Tandai WhatsApp Terverifikasi'}
                    </button>
                  </div>

                  {/* Reset Password Akun (untuk siswa yang lupa email/password) */}
                  <div style={{ background: '#F5F3FF', border: '1px solid #DDD6FE', borderRadius: 8, padding: 10, marginBottom: 12 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#5B21B6', marginBottom: 4 }}>🔑 Akun Login: {selected.userEmail || '-'}</div>
                    <p style={{ fontSize: 11, color: 'var(--adm-text-muted)', marginBottom: 8 }}>Kalau siswa lupa email/password, reset di sini lalu sampaikan info barunya via WhatsApp.</p>
                    <button onClick={() => handleResetPassword(selected)} style={{ width: '100%', padding: '7px 10px', background: '#5B21B6', border: 'none', borderRadius: 8, color: 'var(--adm-text-invert)', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                      Reset Password Akun
                    </button>
                  </div>

                  {/* Link ke Detail Lengkap (Biodata & Keuangan/Cicilan) — tombol
                      edit formulir/biodata sekarang ada di dalam sana (tab
                      Biodata), berlaku untuk semua pendaftar (online & offline),
                      bukan cuma draft offline. */}
                  <Link href={`/admin/pendaftar/${selected.id}`} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, width: '100%', padding: '9px 10px', background: 'var(--adm-primary)', borderRadius: 8, color: 'var(--adm-text-invert)', fontSize: 12, fontWeight: 700, textDecoration: 'none', marginBottom: 12 }}>
                    📄 Lihat Detail Lengkap & Keuangan
                  </Link>
                  {selected.statusPembayaran === 'menunggu_verifikasi' && (
                    <p style={{ fontSize: 11, color: '#D97706', marginBottom: 12, textAlign: 'center' }}>⏳ Ada cicilan menunggu verifikasi</p>
                  )}

                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--adm-text)', marginBottom: 8 }}>UBAH STATUS</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 14 }}>
                    {[
                      { s: 'verified',        label: ' Sedang Diverifikasi', color: '#1E40AF', bg: '#EFF6FF', border: '#BFDBFE' },
                      { s: 'diterima_berkas', label: ' Terima Berkas',       color: '#065F46', bg: '#F0FDF4', border: '#A7F3D0' },
                      { s: 'ditolak',         label: ' Tolak Berkas',        color: '#DC2626', bg: '#FFF1F2', border: '#FECDD3' },
                    ].map(btn => (
                      <button key={btn.s} onClick={() => openEdit(selected, btn.s)} style={{ width: '100%', padding: '8px 10px', background: btn.bg, border: `1px solid ${btn.border}`, borderRadius: 8, color: btn.color, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left' }}>
                        {btn.label}
                      </button>
                    ))}

                    {/* Tombol Konfirmasi Daftar Ulang - hanya jika berkas diterima */}
                    {selected.status === 'diterima_berkas' && (
                      <button
                        onClick={() => selected.sudahDaftarUlang ? null : handleKonfirmasiDaftarUlang(selected.id)}
                        disabled={selected.sudahDaftarUlang}
                        style={{ width: '100%', padding: '8px 10px', background: selected.sudahDaftarUlang ? '#D1FAE5' : '#ECFDF5', border: `1px solid ${selected.sudahDaftarUlang ? '#A7F3D0' : '#6EE7B7'}`, borderRadius: 8, color: '#065F46', fontSize: 12, fontWeight: 700, cursor: selected.sudahDaftarUlang ? 'not-allowed' : 'pointer', fontFamily: 'inherit', textAlign: 'left', opacity: selected.sudahDaftarUlang ? 0.7 : 1 }}>
                        {selected.sudahDaftarUlang ? '✓ Daftar Ulang Sudah Dikonfirmasi' : '📋 Konfirmasi Daftar Ulang Offline'}
                      </button>
                    )}
                  </div>

                  <button onClick={() => handleDelete(selected.id)} style={{ width: '100%', background: '#FFF1F2', color: '#DC2626', border: '1px solid #FECDD3', borderRadius: 8, padding: '8px', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
                    🗑 Hapus Data
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* EDIT STATUS MODAL */}
      {editModal && selected && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }} onClick={() => setEditModal(false)}>
          <div style={{ background: 'var(--adm-surface)', borderRadius: 20, width: '100%', maxWidth: 500, maxHeight: '88vh', overflow: 'auto' }} onClick={e => e.stopPropagation()}>
            <div style={{ padding: '18px 22px', borderBottom: '1px solid var(--adm-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, background: 'var(--adm-surface)', zIndex: 1 }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--adm-text)' }}>Update Status — {selected.namaLengkap}</h3>
              <button onClick={() => setEditModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--adm-text-faint)' }}><X size={18} /></button>
            </div>
            <div style={{ padding: '18px 22px' }}>

              {/* Status dropdown */}
              <div style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--adm-text)', display: 'block', marginBottom: 5 }}>Status *</label>
                <select style={inp} value={editForm.status} onChange={e => setEditForm(f => ({ ...f, status: e.target.value }))}>
                  <option value="verified">Sedang Diverifikasi</option>
                  <option value="diterima_berkas">Terima Berkas</option>
                  <option value="ditolak">Tolak Berkas</option>
                </select>
              </div>

              {/* DITOLAK */}
              {showAlasan && (
                <div style={{ marginBottom: 14, background: '#FFF7ED', borderRadius: 10, padding: 14, border: '1px solid #FED7AA' }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#C2410C', marginBottom: 8 }}>❌ Alasan Penolakan <span style={{ fontWeight: 400 }}>(dikirim ke siswa)</span></div>
                  <textarea style={{ ...inp, minHeight: 80, resize: 'vertical', background: 'var(--adm-surface)', marginBottom: 8 }} value={editForm.alasanPenolakan} onChange={e => setEditForm(f => ({ ...f, alasanPenolakan: e.target.value }))} placeholder="Contoh: Scan ijazah kurang jelas, mohon upload ulang..." />
                  <textarea style={{ ...inp, minHeight: 60, resize: 'vertical', background: 'var(--adm-surface)' }} value={editForm.catatan} onChange={e => setEditForm(f => ({ ...f, catatan: e.target.value }))} placeholder="Catatan tambahan (opsional)..." />
                </div>
              )}

              {/* TERIMA BERKAS — pesan untuk siswa */}
              {showPengumuman && (
                <div style={{ marginBottom: 14, background: '#F0FDF4', borderRadius: 10, padding: 14, border: '1px solid #A7F3D0' }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#065F46', marginBottom: 10 }}>🏆 Berkas Diterima</div>

                  {/* Pesan */}
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--adm-text)', display: 'block', marginBottom: 4 }}>Pesan untuk Siswa <span style={{ fontWeight: 400 }}>(tampil di dashboard)</span></label>
                    <textarea style={{ ...inp, minHeight: 80, resize: 'vertical' }} value={editForm.pesanPengumuman} onChange={e => setEditForm(f => ({ ...f, pesanPengumuman: e.target.value }))} placeholder="Selamat! Berkas Anda diterima. Silakan tunggu informasi daftar ulang..." />
                  </div>
                </div>
              )}

              {/* Catatan Umum */}
              {!showAlasan && !showPengumuman && (
                <div style={{ marginBottom: 14 }}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--adm-text)', display: 'block', marginBottom: 5 }}>Catatan (opsional)</label>
                  <textarea style={{ ...inp, minHeight: 70, resize: 'vertical' }} value={editForm.catatan} onChange={e => setEditForm(f => ({ ...f, catatan: e.target.value }))} placeholder="Catatan untuk siswa..." />
                </div>
              )}

              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={() => setEditModal(false)} style={{ flex: 1, padding: '11px', border: '1.5px solid #E5E7EB', borderRadius: 8, background: 'transparent', color: 'var(--adm-text-muted)', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600, fontSize: 13 }}>Batal</button>
                <button onClick={handleSave} disabled={saving} className="btn-primary" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontSize: 13, opacity: saving ? 0.7 : 1 }}>
                  <Save size={14} /> {saving ? 'Menyimpan...' : 'Simpan & Kirim'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
