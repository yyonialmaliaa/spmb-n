'use client';
import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ChevronLeft, User, Wallet, Printer, ExternalLink, Pencil,
} from 'lucide-react';
import { JENJANG_LABEL, Jenjang } from '@/lib/biaya';
import { formatRupiah, hitungRingkasan } from '@/lib/pembayaran-utils';

type Cicilan = {
  id: string; angsuranKe: number; nominal: number; jenis?: string;
  metodePembayaran: string; buktiPembayaran?: string;
  bankPengirim?: string; namaPengirim?: string; alasanRefund?: string;
  kategoriAlokasi?: string;
  status: string; catatanAdmin?: string;
  tanggalBayar: string; tanggalVerifikasi?: string;
};

// Kategori alokasi kelebihan bayar ke pembayaran sekolah lain — kalau pilih
// "Lainnya", admin mengetik sendiri nama kategorinya (lihat formAlokasi.kategoriLainnya).
const KATEGORI_ALOKASI = ['SPP', 'Uang Pangkal', 'Seragam', 'Buku', 'Kegiatan', 'Lainnya'];

// Alasan refund — hanya kondisi yang memang menghasilkan dana yang bisa
// dikembalikan (bukan bebas ketik dari nol). Pilih "Lainnya" untuk kondisi
// di luar daftar ini, keterangannya diketik di alasanLainnya.
const ALASAN_REFUND = ['Tidak Jadi Mendaftar', 'Pindah Jurusan', 'Kelebihan Pembayaran', 'Pembatalan Pendaftaran', 'Perubahan Biaya/Tagihan', 'Lainnya'];

type Pendaftar = {
  id: string; namaLengkap: string | null; namaPanggilan?: string;
  tempatLahir?: string; tanggalLahir?: string; ttl?: string;
  jenisKelamin: string | null; agama: string | null; anakKe?: string;
  alamat: string | null; rt?: string; rw?: string; kelurahan?: string; kecamatan?: string; kabupaten?: string;
  beratBadan?: string; tinggiBadan?: string; golonganDarah?: string;
  nisn?: string; nik?: string; noPribadi?: string; ukuranSeragam?: string;
  namaPemberiReferensi?: string; noHpReferensi?: string;

  asalSD?: string; asalSMP?: string; asalSekolah?: string;
  jurusan: string | null; jenjang?: string; kelas?: string;
  tipePendaftaran?: string; kelasMasuk?: string;

  namaAyah?: string; ttlAyah?: string; pendidikanAyah?: string; pekerjaanAyah?: string; penghasilanAyah?: string; noHpAyah?: string; alamatAyah?: string;
  namaIbu?: string; ttlIbu?: string; pendidikanIbu?: string; pekerjaanIbu?: string; penghasilanIbu?: string; noHpIbu?: string; alamatIbu?: string;
  namaWali?: string; ttlWali?: string; pendidikanWali?: string; pekerjaanWali?: string; penghasilanWali?: string; noHpWali?: string; alamatWali?: string;

  fileIjazah?: string; fileAkte?: string; fileKK?: string; fileKtpOrtu?: string; fileKip?: string; fileFoto?: string;

  status: string;
  waVerified?: boolean;
  gelombang?: string; totalTagihan?: number; statusPembayaran?: string;
  hargaPokok?: number; gelombangDiskonNominal?: number;
  diskonId?: string | null; diskonNama?: string | null; diskonNominal?: number;
  totalTagihanLocked?: boolean;
  breakdown?: { hargaPokok: number; hargaTersedia: boolean; gelombangDiskonNominal: number; gelombangNama: string | null; diskonNominal: number; diskonNama: string | null; totalTagihan: number; locked: boolean } | null;
  sudahDaftarUlang?: boolean;

  createdAt: string;
  user?: { email: string };
  pembayaranList: Cicilan[];
};

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  draft:           { label: 'Draft — Belum Dikirim', color: '#6B7280', bg: '#F3F4F6' },
  verified:        { label: 'Sedang Diverifikasi', color: '#1E40AF', bg: '#DBEAFE' },
  diterima_berkas: { label: 'Terima Berkas',        color: '#065F46', bg: '#D1FAE5' },
  ditolak:         { label: 'Tolak Berkas',         color: '#991B1B', bg: '#FEE2E2' },
};

const STATUS_BAYAR_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  belum_bayar:         { label: 'Belum Bayar',       color: '#9CA3AF', bg: '#F3F4F6' },
  menunggu_verifikasi: { label: 'Menunggu Verifikasi', color: '#1E40AF', bg: '#DBEAFE' },
  cicilan_berjalan:    { label: 'Cicilan Berjalan',   color: '#5B21B6', bg: '#F5F3FF' },
  lunas:               { label: 'Lunas',              color: '#059669', bg: '#D1FAE5' },
  ditolak:             { label: 'Ditolak',            color: '#DC2626', bg: '#FEE2E2' },
};

const STATUS_CICILAN: Record<string, { label: string; color: string; bg: string }> = {
  menunggu_verifikasi: { label: 'Menunggu Verifikasi', color: '#1E40AF', bg: '#DBEAFE' },
  lunas:                { label: 'Terverifikasi',      color: '#065F46', bg: '#D1FAE5' },
  ditolak:              { label: 'Ditolak',             color: '#991B1B', bg: '#FEE2E2' },
};

type Diskon = { id: string; jenis: string; tipeNominal: string; nominal: number; aktif: boolean };

export default function DetailPendaftarPage() {
  const router = useRouter();
  const params = useParams();
  const id = (Array.isArray(params.id) ? params.id[0] : params.id) as string;

  const [data, setData] = useState<Pendaftar | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'biodata' | 'keuangan'>('biodata');
  const [toast, setToast] = useState('');
  const [formBayar, setFormBayar] = useState({ nominal: '', metode: '', bukti: '', uploading: false });
  const [savingBayar, setSavingBayar] = useState(false);
  const [formRefund, setFormRefund] = useState({ nominal: '', metode: '', bukti: '', alasan: '', alasanLainnya: '', uploading: false });
  const [savingRefund, setSavingRefund] = useState(false);
  const [formAlokasi, setFormAlokasi] = useState({ nominal: '', kategori: '', kategoriLainnya: '', keterangan: '' });
  const [savingAlokasi, setSavingAlokasi] = useState(false);
  const [diskonList, setDiskonList] = useState<Diskon[]>([]);
  const [selectedDiskonId, setSelectedDiskonId] = useState('');
  const [savingDiskon, setSavingDiskon] = useState(false);

  const load = () => {
    fetch(`/api/admin/pendaftar/${id}`).then(r => r.json()).then(d => {
      setData(d.data || null);
      setSelectedDiskonId(d.data?.diskonId || '');
      setLoading(false);
    });
  };

  useEffect(() => {
    fetch('/api/auth/me').then(r => r.json()).then(d => {
      if (!d.user || d.user.role !== 'admin') { router.push('/login'); return; }
    });
    if (id) load();
    fetch('/api/admin/diskon').then(r => r.json()).then(d => setDiskonList(d.data || []));
  }, [id]);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  const handleTerapkanDiskon = async () => {
    if (!data) return;
    if (data.totalTagihanLocked && !confirm('Tagihan pendaftar ini sudah terkunci (sudah ada pembayaran). Menerapkan diskon ini akan MENGHITUNG ULANG total tagihan. Lanjutkan?')) {
      return;
    }
    setSavingDiskon(true);
    try {
      const res = await fetch(`/api/admin/pendaftar/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ diskonId: selectedDiskonId || null, hitungUlang: true }),
      });
      const d = await res.json().catch(() => ({}));
      if (res.ok) {
        showToast('✅ Diskon diterapkan');
        load();
      } else {
        // Tampilkan pesan asli dari server (mis. "Diskon sudah tidak ada" atau
        // "Harga belum diatur"), bukan pesan generik — supaya admin tahu
        // persis apa yang perlu diperbaiki. Muat ulang daftar diskon juga,
        // kalau-kalau penyebabnya diskon yang dipilih sudah kedaluwarsa/dihapus.
        showToast(`❌ ${d.error || 'Gagal menerapkan diskon'}`);
        fetch('/api/admin/diskon').then(r => r.json()).then(dd => setDiskonList(dd.data || []));
      }
    } catch {
      showToast('❌ Gagal menerapkan diskon — periksa koneksi lalu coba lagi');
    }
    setSavingDiskon(false);
  };

  const handleVerifikasiCicilan = async (cicilan: Cicilan, status: 'lunas' | 'ditolak') => {
    let catatanAdmin = '';
    if (status === 'ditolak') {
      const c = prompt('Alasan bukti pembayaran ini ditolak:');
      if (c === null) return;
      catatanAdmin = c;
    } else {
      if (!confirm(`Konfirmasi cicilan ke-${cicilan.angsuranKe} sebesar ${formatRupiah(cicilan.nominal)} ini LUNAS/terverifikasi?`)) return;
    }
    const res = await fetch(`/api/admin/pembayaran/${cicilan.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, catatanAdmin }),
    });
    if (res.ok) {
      showToast(status === 'lunas' ? '✅ Cicilan diverifikasi' : '↩ Cicilan ditolak');
      load();
    } else {
      showToast('❌ Gagal memproses');
    }
  };

  const handleUploadBuktiAdmin = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { showToast('❌ Ukuran file maksimal 2MB'); return; }
    setFormBayar(f => ({ ...f, uploading: true }));
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('fieldName', 'buktiPembayaranAdmin');
      const res = await fetch('/api/upload', { method: 'POST', body: fd });
      const d = await res.json();
      if (!res.ok) { showToast(`❌ ${d.error || 'Gagal upload'}`); setFormBayar(f => ({ ...f, uploading: false })); return; }
      setFormBayar(f => ({ ...f, bukti: d.path, uploading: false }));
    } catch {
      showToast('❌ Gagal upload, coba lagi');
      setFormBayar(f => ({ ...f, uploading: false }));
    }
  };

  const handleInputPembayaranAdmin = async () => {
    const nominalNum = Math.round(Number(formBayar.nominal.replace(/[^\d]/g, '')) || 0);
    if (!nominalNum) { showToast('❌ Nominal wajib diisi'); return; }
    if (!formBayar.metode) { showToast('❌ Pilih metode pembayaran'); return; }
    if (formBayar.metode !== 'offline' && !formBayar.bukti) { showToast('❌ Bukti pembayaran wajib diupload'); return; }
    setSavingBayar(true);
    const res = await fetch('/api/admin/pembayaran', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        pendaftaranId: data?.id,
        nominal: nominalNum,
        metodePembayaran: formBayar.metode,
        buktiPembayaran: formBayar.bukti || null,
      }),
    });
    if (res.ok) {
      showToast('✅ Pembayaran berhasil dicatat & lunas');
      setFormBayar({ nominal: '', metode: '', bukti: '', uploading: false });
      load();
    } else {
      const d = await res.json();
      showToast(`❌ ${d.error || 'Gagal menyimpan'}`);
    }
    setSavingBayar(false);
  };

  const handleUploadBuktiRefund = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { showToast('❌ Ukuran file maksimal 2MB'); return; }
    setFormRefund(f => ({ ...f, uploading: true }));
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('fieldName', 'buktiRefund');
      const res = await fetch('/api/upload', { method: 'POST', body: fd });
      const d = await res.json();
      if (!res.ok) { showToast(`❌ ${d.error || 'Gagal upload'}`); setFormRefund(f => ({ ...f, uploading: false })); return; }
      setFormRefund(f => ({ ...f, bukti: d.path, uploading: false }));
    } catch {
      showToast('❌ Gagal upload, coba lagi');
      setFormRefund(f => ({ ...f, uploading: false }));
    }
  };

  const handleRefund = async () => {
    const nominalNum = Math.round(Number(formRefund.nominal.replace(/[^\d]/g, '')) || 0);
    if (!nominalNum) { showToast('❌ Nominal wajib diisi'); return; }
    if (nominalNum > kelebihanBayar) { showToast(`❌ Maksimal ${formatRupiah(kelebihanBayar)}`); return; }
    if (!formRefund.metode) { showToast('❌ Pilih metode pengembalian'); return; }
    if (!formRefund.bukti) { showToast('❌ Bukti pengembalian wajib diupload'); return; }
    if (!formRefund.alasan) { showToast('❌ Alasan pengembalian wajib dipilih'); return; }
    if (formRefund.alasan === 'Lainnya' && !formRefund.alasanLainnya.trim()) { showToast('❌ Isi keterangan alasan lainnya'); return; }
    const alasanFinal = formRefund.alasan === 'Lainnya' ? formRefund.alasanLainnya.trim() : formRefund.alasan;
    if (!confirm(`Konfirmasi kembalikan ${formatRupiah(nominalNum)} ke ${data?.namaLengkap}?`)) return;
    setSavingRefund(true);
    const res = await fetch('/api/admin/pembayaran', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        pendaftaranId: data?.id,
        jenis: 'refund',
        nominal: nominalNum,
        metodePembayaran: formRefund.metode,
        buktiPembayaran: formRefund.bukti,
        alasanRefund: alasanFinal,
      }),
    });
    if (res.ok) {
      showToast('✅ Pengembalian dana berhasil dicatat');
      setFormRefund({ nominal: '', metode: '', bukti: '', alasan: '', alasanLainnya: '', uploading: false });
      load();
    } else {
      const d = await res.json();
      showToast(`❌ ${d.error || 'Gagal menyimpan'}`);
    }
    setSavingRefund(false);
  };

  // Alokasikan kelebihan bayar ke pembayaran sekolah lain (SPP, uang pangkal,
  // dst) — uangnya TETAP di sekolah, cuma peruntukannya dipindah. Tidak perlu
  // metode/bukti seperti bayar/refund (bukan transaksi baru, cuma re-alokasi
  // dari kelebihan bayar yang buktinya sudah ada di transaksi bayar semula).
  const handleAlokasi = async () => {
    const nominalNum = Math.round(Number(formAlokasi.nominal.replace(/[^\d]/g, '')) || 0);
    if (!nominalNum) { showToast('❌ Nominal wajib diisi'); return; }
    if (nominalNum > kelebihanBayar) { showToast(`❌ Maksimal ${formatRupiah(kelebihanBayar)}`); return; }
    if (!formAlokasi.kategori) { showToast('❌ Pilih jenis pembayaran'); return; }
    if (formAlokasi.kategori === 'Lainnya' && !formAlokasi.kategoriLainnya.trim()) { showToast('❌ Isi jenis pembayaran lainnya'); return; }
    const kategoriFinal = formAlokasi.kategori === 'Lainnya' ? formAlokasi.kategoriLainnya.trim() : formAlokasi.kategori;
    if (!confirm(`Konfirmasi alokasikan ${formatRupiah(nominalNum)} untuk ${kategoriFinal}?`)) return;
    setSavingAlokasi(true);
    const res = await fetch('/api/admin/pembayaran', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        pendaftaranId: data?.id,
        jenis: 'alokasi',
        nominal: nominalNum,
        kategoriAlokasi: kategoriFinal,
        catatanAdmin: formAlokasi.keterangan || null,
      }),
    });
    if (res.ok) {
      showToast('✅ Kelebihan bayar berhasil dialokasikan');
      setFormAlokasi({ nominal: '', kategori: '', kategoriLainnya: '', keterangan: '' });
      load();
    } else {
      const d = await res.json();
      showToast(`❌ ${d.error || 'Gagal menyimpan'}`);
    }
    setSavingAlokasi(false);
  };

  if (loading) return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9CA3AF' }}>Memuat...</div>;
  if (!data) return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9CA3AF' }}>Data tidak ditemukan</div>;

  const sc = STATUS_CONFIG[data.status] || STATUS_CONFIG['verified'];
  const bc = STATUS_BAYAR_CONFIG[data.statusPembayaran || 'belum_bayar'] || STATUS_BAYAR_CONFIG['belum_bayar'];
  const breakdown = data.breakdown || null;
  const totalTagihan = breakdown?.totalTagihan ?? (data.totalTagihan || 0);
  const { totalBayar, totalRefund, totalAlokasi, sisaBayar, kelebihanBayar } = hitungRingkasan(data.pembayaranList, totalTagihan);
  const jenjang = (data.jenjang || 'smk') as Jenjang;

  const lbl: React.CSSProperties = { fontSize: 11, color: '#9CA3AF', fontWeight: 600, marginBottom: 3, textTransform: 'uppercase', letterSpacing: 0.3 };
  const val: React.CSSProperties = { fontSize: 14, color: '#0A1628', fontWeight: 600 };
  const field = (label: string, value: any) => (
    <div style={{ background: '#FAFAFA', borderRadius: 8, padding: '10px 12px' }}>
      <div style={lbl}>{label}</div>
      <div style={val}>{value || '-'}</div>
    </div>
  );

  const fileField = (label: string, url?: string) => (
    <div style={{ background: '#FAFAFA', borderRadius: 8, padding: '10px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <div style={lbl}>{label}</div>
      {url ? (
        <a href={url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: '#C8973A', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
          Lihat <ExternalLink size={12} />
        </a>
      ) : <span style={{ fontSize: 12, color: '#D1D5DB' }}>Tidak ada</span>}
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: '#F8F9FA' }}>
      {toast && <div style={{ position: 'fixed', top: 24, right: 24, background: '#0A1628', color: 'white', padding: '12px 20px', borderRadius: 10, fontSize: 13, fontWeight: 600, zIndex: 9999 }}>{toast}</div>}

      <header style={{ background: '#0A1628', padding: '18px 24px' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          <button onClick={() => router.back()} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', color: 'rgba(255,255,255,0.6)', fontSize: 12, cursor: 'pointer', marginBottom: 10, fontFamily: 'inherit' }}>
            <ChevronLeft size={14} /> Kembali
          </button>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
            <div>
              <h1 style={{ color: 'white', fontSize: 20, fontWeight: 700 }}>{data.namaLengkap}</h1>
              <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12 }}>{JENJANG_LABEL[jenjang]}{jenjang === 'smk' ? ` — ${data.jurusan}` : ''} · {data.user?.email}</p>
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <span style={{ background: sc.bg, color: sc.color, padding: '5px 14px', borderRadius: 20, fontSize: 12, fontWeight: 700 }}>{sc.label}</span>
              <span style={{ background: bc.bg, color: bc.color, padding: '5px 14px', borderRadius: 20, fontSize: 12, fontWeight: 700 }}>{bc.label}</span>
            </div>
          </div>
        </div>
      </header>

      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '24px' }}>
        {/* Tabs */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 20, borderBottom: '1px solid #E5E7EB' }}>
          {[
            { k: 'biodata', label: 'Biodata', icon: User },
            { k: 'keuangan', label: 'Keuangan', icon: Wallet },
          ].map(t => (
            <button
              key={t.k}
              onClick={() => setTab(t.k as 'biodata' | 'keuangan')}
              style={{
                display: 'flex', alignItems: 'center', gap: 6, padding: '10px 18px', background: 'none',
                border: 'none', borderBottom: tab === t.k ? '2px solid #C8973A' : '2px solid transparent',
                color: tab === t.k ? '#0A1628' : '#9CA3AF', fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit',
              }}
            >
              <t.icon size={15} /> {t.label}
            </button>
          ))}
        </div>

        {/* ============ TAB BIODATA ============ */}
        {tab === 'biodata' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Semua formulir (online maupun offline) bisa dikoreksi/dilengkapi
                lagi dari sini — bukan cuma draft offline. */}
            <Link href={`/admin/pendaftar/tambah?id=${data.id}`} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '10px 16px', background: '#C8973A', borderRadius: 10, color: 'white', fontSize: 13, fontWeight: 700, textDecoration: 'none' }}>
              <Pencil size={15} /> Edit Formulir
            </Link>
            <div style={{ background: 'white', borderRadius: 14, padding: 20, border: '1px solid #F3F4F6' }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: '#0A1628', marginBottom: 14 }}>Data Pribadi</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10 }}>
                {field('Nama Lengkap', data.namaLengkap)}
                {field('Nama Panggilan', data.namaPanggilan)}
                {field('Tempat, Tgl Lahir', data.ttl || `${data.tempatLahir || '-'}, ${data.tanggalLahir || '-'}`)}
                {field('Jenis Kelamin', data.jenisKelamin)}
                {field('Agama', data.agama)}
                {field('Anak ke-', data.anakKe)}
                {field('NIK', data.nik)}
                {field('NISN', data.nisn)}
                {field('No. WhatsApp', `${data.noPribadi || '-'}${data.noPribadi ? (data.waVerified ? ' ✓ Terverifikasi' : ' ⏳ Belum diverifikasi') : ''}`)}
                {field('Golongan Darah', data.golonganDarah)}
                {field('Berat / Tinggi Badan', (data.beratBadan || data.tinggiBadan) ? `${data.beratBadan || '-'} kg / ${data.tinggiBadan || '-'} cm` : '-')}
                {field('Ukuran Seragam', data.ukuranSeragam)}
                {field('Alamat', `${data.alamat}${data.rt ? `, RT ${data.rt}/RW ${data.rw}` : ''}`)}
                {field('Kelurahan', data.kelurahan)}
                {field('Kecamatan', data.kecamatan)}
                {field('Kab/Kota', data.kabupaten)}
                {field('Referensi', data.namaPemberiReferensi ? `${data.namaPemberiReferensi} (${data.noHpReferensi || '-'})` : '-')}
              </div>
            </div>

            <div style={{ background: 'white', borderRadius: 14, padding: 20, border: '1px solid #F3F4F6' }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: '#0A1628', marginBottom: 14 }}>Data Akademik</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10 }}>
                {field('Jenjang', JENJANG_LABEL[jenjang])}
                {jenjang === 'smk' && field('Jurusan', data.jurusan)}
                {field('Kelas', data.kelas)}
                {field('Tipe Pendaftaran', data.tipePendaftaran === 'pindahan' ? 'Pindahan' : 'Baru')}
                {data.tipePendaftaran === 'pindahan' && field('Kelas Masuk', data.kelasMasuk)}
                {field('Asal SD/MI', data.asalSD)}
                {field('Asal SMP/MTs', data.asalSMP || data.asalSekolah)}
              </div>
            </div>

            <div style={{ background: 'white', borderRadius: 14, padding: 20, border: '1px solid #F3F4F6' }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: '#1E40AF', marginBottom: 14 }}>Data Ayah</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10 }}>
                {field('Nama', data.namaAyah)}
                {field('TTL', data.ttlAyah)}
                {field('Pendidikan', data.pendidikanAyah)}
                {field('Pekerjaan', data.pekerjaanAyah)}
                {field('Penghasilan/bulan', data.penghasilanAyah)}
                {field('No. HP', data.noHpAyah)}
                {field('Alamat', data.alamatAyah)}
              </div>
            </div>

            <div style={{ background: 'white', borderRadius: 14, padding: 20, border: '1px solid #F3F4F6' }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: '#BE185D', marginBottom: 14 }}>Data Ibu</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10 }}>
                {field('Nama', data.namaIbu)}
                {field('TTL', data.ttlIbu)}
                {field('Pendidikan', data.pendidikanIbu)}
                {field('Pekerjaan', data.pekerjaanIbu)}
                {field('Penghasilan/bulan', data.penghasilanIbu)}
                {field('No. HP', data.noHpIbu)}
                {field('Alamat', data.alamatIbu)}
              </div>
            </div>

            {data.namaWali && (
              <div style={{ background: 'white', borderRadius: 14, padding: 20, border: '1px solid #F3F4F6' }}>
                <h3 style={{ fontSize: 14, fontWeight: 700, color: '#065F46', marginBottom: 14 }}>Data Wali</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10 }}>
                  {field('Nama', data.namaWali)}
                  {field('TTL', data.ttlWali)}
                  {field('Pendidikan', data.pendidikanWali)}
                  {field('Pekerjaan', data.pekerjaanWali)}
                  {field('Penghasilan/bulan', data.penghasilanWali)}
                  {field('No. HP', data.noHpWali)}
                  {field('Alamat', data.alamatWali)}
                </div>
              </div>
            )}

            <div style={{ background: 'white', borderRadius: 14, padding: 20, border: '1px solid #F3F4F6' }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: '#0A1628', marginBottom: 14 }}>Berkas Diupload</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 10 }}>
                {fileField('Ijazah', data.fileIjazah)}
                {fileField('Akte Kelahiran', data.fileAkte)}
                {fileField('Kartu Keluarga', data.fileKK)}
                {fileField('KTP Orang Tua', data.fileKtpOrtu)}
                {fileField('Kartu KIP', data.fileKip)}
                {fileField('Pas Foto', data.fileFoto)}
              </div>
            </div>
          </div>
        )}

        {/* ============ TAB KEUANGAN ============ */}
        {tab === 'keuangan' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Link href={`/admin/kwitansi/${data.id}`} target="_blank" style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 16px', background: '#0A1628', color: 'white', borderRadius: 8, fontSize: 12, fontWeight: 700, textDecoration: 'none' }}>
                <Printer size={14} /> Cetak Kwitansi (Semua Pembayaran)
              </Link>
            </div>

            {/* Breakdown Harga -> Diskon -> Total Tagihan */}
            <div style={{ background: 'white', borderRadius: 14, padding: 20, border: '1px solid #F3F4F6' }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: '#0A1628', marginBottom: 14 }}>Rincian Tagihan</h3>
              {breakdown && !breakdown.hargaTersedia && (
                <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 10, padding: 14, marginBottom: 16, display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                  <span style={{ fontSize: 16 }}>⚠️</span>
                  <p style={{ fontSize: 12, color: '#991B1B', lineHeight: 1.6, margin: 0 }}>
                    Harga untuk {JENJANG_LABEL[jenjang]}{jenjang === 'smk' ? ` — ${data.jurusan}` : ''} ({data.kelas || 'REGULER'}) belum diatur di Panel Harga. Total tagihan TIDAK dapat dihitung sampai admin mengatur harganya di <Link href="/admin/harga" style={{ color: '#991B1B', fontWeight: 700 }}>Panel Harga</Link>.
                  </p>
                </div>
              )}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 10, marginBottom: 16 }}>
                {field('Harga Pokok', breakdown?.hargaPokok ? formatRupiah(breakdown.hargaPokok) : '-')}
                {field('Diskon Gelombang', breakdown?.gelombangDiskonNominal ? `- ${formatRupiah(breakdown.gelombangDiskonNominal)}` : '-')}
                {field('Diskon Tambahan', breakdown?.diskonNominal ? `- ${formatRupiah(breakdown.diskonNominal)}${breakdown.diskonNama ? ` (${breakdown.diskonNama})` : ''}` : '-')}
                {field('Total Tagihan', breakdown?.hargaTersedia === false ? 'Belum tersedia' : formatRupiah(totalTagihan))}
              </div>
              {!data.totalTagihanLocked && breakdown?.hargaTersedia && (
                <p style={{ fontSize: 11, color: '#9CA3AF', marginBottom: 12 }}>Tagihan belum terkunci — masih dihitung langsung dari Harga/Gelombang/Diskon aktif, akan terkunci begitu ada pembayaran pertama.</p>
              )}
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10, flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: 220 }}>
                  <label style={lbl}>Terapkan Diskon</label>
                  <select value={selectedDiskonId} onChange={e => setSelectedDiskonId(e.target.value)} style={{ width: '100%', padding: '9px 12px', border: '1.5px solid #D1D5DB', borderRadius: 8, fontSize: 13, fontFamily: 'inherit' }}>
                    <option value="">Tidak ada diskon</option>
                    {diskonList.filter(d => d.aktif || d.id === data.diskonId).map(d => (
                      <option key={d.id} value={d.id}>{d.jenis} ({d.tipeNominal === 'persen' ? `${d.nominal}%` : formatRupiah(d.nominal)})</option>
                    ))}
                  </select>
                </div>
                <button onClick={handleTerapkanDiskon} disabled={savingDiskon || selectedDiskonId === (data.diskonId || '')} style={{ padding: '9px 18px', background: '#0A1628', color: 'white', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', opacity: savingDiskon || selectedDiskonId === (data.diskonId || '') ? 0.5 : 1 }}>
                  {savingDiskon ? 'Menyimpan...' : 'Terapkan'}
                </button>
              </div>
            </div>

            {/* Admin bantu input pembayaran (misal siswa bayar tunai langsung di sekolah) */}
            <div style={{ background: '#F5F3FF', border: '1px solid #DDD6FE', borderRadius: 14, padding: 20 }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: '#5B21B6', marginBottom: 4 }}>💰 Bantu Input Pembayaran</h3>
              <p style={{ fontSize: 12, color: '#6B7280', marginBottom: 14 }}>Kalau siswa bayar tunai/transfer langsung ke sekolah, admin bisa catat di sini. Bukti pembayaran wajib diupload untuk transfer online; opsional untuk tunai di sekolah.</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginBottom: 12 }}>
                <div>
                  <label style={lbl}>Nominal</label>
                  <input
                    type="text" inputMode="numeric"
                    value={formBayar.nominal ? Number(formBayar.nominal.replace(/[^\d]/g, '')).toLocaleString('id-ID') : ''}
                    onChange={e => setFormBayar(f => ({ ...f, nominal: e.target.value.replace(/[^\d]/g, '') }))}
                    placeholder="Contoh: 500000"
                    style={{ width: '100%', padding: '9px 12px', border: '1.5px solid #D1D5DB', borderRadius: 8, fontSize: 13, fontFamily: 'inherit' }}
                  />
                </div>
                <div>
                  <label style={lbl}>Metode</label>
                  <select value={formBayar.metode} onChange={e => setFormBayar(f => ({ ...f, metode: e.target.value }))} style={{ width: '100%', padding: '9px 12px', border: '1.5px solid #D1D5DB', borderRadius: 8, fontSize: 13, fontFamily: 'inherit' }}>
                    <option value="">Pilih...</option>
                    <option value="offline">Offline (Tunai di sekolah)</option>
                    <option value="online">Online (Transfer)</option>
                  </select>
                </div>
                <div>
                  <label style={lbl}>Bukti{formBayar.metode !== 'offline' ? ' *' : ' (opsional untuk tunai)'}</label>
                  {formBayar.bukti ? (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#F0FDF4', border: '1px solid #A7F3D0', borderRadius: 8, padding: '8px 12px', fontSize: 12, color: '#065F46' }}>
                      ✓ Terupload
                      <button onClick={() => setFormBayar(f => ({ ...f, bukti: '' }))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#DC2626' }}>✕</button>
                    </div>
                  ) : (
                    <input type="file" accept=".jpg,.jpeg,.png,.pdf" onChange={handleUploadBuktiAdmin} disabled={formBayar.uploading} style={{ fontSize: 12 }} />
                  )}
                  {formBayar.uploading && <p style={{ fontSize: 11, color: '#9CA3AF', marginTop: 4 }}>Mengupload...</p>}
                </div>
              </div>
              <button onClick={handleInputPembayaranAdmin} disabled={savingBayar} style={{ padding: '9px 18px', background: '#5B21B6', color: 'white', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', opacity: savingBayar ? 0.6 : 1 }}>
                {savingBayar ? 'Menyimpan...' : 'Catat Pembayaran (Langsung Lunas)'}
              </button>
            </div>

            {/* Kembalikan kelebihan bayar (pindah jurusan / tidak jadi daftar) —
                selalu tampil (section B11), tinggal nonaktif kalau memang
                tidak ada kelebihan bayar untuk dikembalikan. */}
            <div style={{ background: kelebihanBayar > 0 ? '#FFF7ED' : '#FAFAFA', border: `1px solid ${kelebihanBayar > 0 ? '#FED7AA' : '#E5E7EB'}`, borderRadius: 14, padding: 20 }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: kelebihanBayar > 0 ? '#C2410C' : '#9CA3AF', marginBottom: 4 }}>↩ Kembalikan Kelebihan Bayar (Dikembalikan)</h3>
              <p style={{ fontSize: 12, color: '#6B7280', marginBottom: 14 }}>
                {kelebihanBayar > 0
                  ? <>Kelebihan bayar saat ini: <strong style={{ color: '#C2410C' }}>{formatRupiah(kelebihanBayar)}</strong> (misal karena pindah jurusan atau tidak jadi daftar).</>
                  : 'Tidak ada kelebihan bayar saat ini — form ini aktif lagi begitu ada kelebihan bayar. Transaksi pengembalian dicatat terpisah dari cicilan, tidak pernah dianggap sebagai cicilan.'}
              </p>
              <fieldset disabled={kelebihanBayar <= 0} style={{ border: 'none', padding: 0, margin: 0, opacity: kelebihanBayar <= 0 ? 0.5 : 1 }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginBottom: 12 }}>
                  <div>
                    <label style={lbl}>Nominal Dikembalikan</label>
                    <input
                      type="text" inputMode="numeric"
                      value={formRefund.nominal ? Number(formRefund.nominal.replace(/[^\d]/g, '')).toLocaleString('id-ID') : ''}
                      onChange={e => setFormRefund(f => ({ ...f, nominal: e.target.value.replace(/[^\d]/g, '') }))}
                      placeholder={kelebihanBayar > 0 ? `Maks. ${kelebihanBayar.toLocaleString('id-ID')}` : '-'}
                      style={{ width: '100%', padding: '9px 12px', border: '1.5px solid #D1D5DB', borderRadius: 8, fontSize: 13, fontFamily: 'inherit' }}
                    />
                  </div>
                  <div>
                    <label style={lbl}>Alasan</label>
                    <select value={formRefund.alasan} onChange={e => setFormRefund(f => ({ ...f, alasan: e.target.value }))} style={{ width: '100%', padding: '9px 12px', border: '1.5px solid #D1D5DB', borderRadius: 8, fontSize: 13, fontFamily: 'inherit' }}>
                      <option value="">Pilih...</option>
                      {ALASAN_REFUND.map(a => <option key={a} value={a}>{a}</option>)}
                    </select>
                  </div>
                  {formRefund.alasan === 'Lainnya' && (
                    <div>
                      <label style={lbl}>Keterangan Alasan Lainnya</label>
                      <input type="text" value={formRefund.alasanLainnya} onChange={e => setFormRefund(f => ({ ...f, alasanLainnya: e.target.value }))} placeholder="Jelaskan alasannya" style={{ width: '100%', padding: '9px 12px', border: '1.5px solid #D1D5DB', borderRadius: 8, fontSize: 13, fontFamily: 'inherit' }} />
                    </div>
                  )}
                  <div>
                    <label style={lbl}>Metode Pengembalian</label>
                    <select value={formRefund.metode} onChange={e => setFormRefund(f => ({ ...f, metode: e.target.value }))} style={{ width: '100%', padding: '9px 12px', border: '1.5px solid #D1D5DB', borderRadius: 8, fontSize: 13, fontFamily: 'inherit' }}>
                      <option value="">Pilih...</option>
                      <option value="offline">Tunai</option>
                      <option value="online">Transfer</option>
                    </select>
                  </div>
                  <div>
                    <label style={lbl}>Bukti Pengembalian *</label>
                    {formRefund.bukti ? (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#F0FDF4', border: '1px solid #A7F3D0', borderRadius: 8, padding: '8px 12px', fontSize: 12, color: '#065F46' }}>
                        ✓ Terupload
                        <button onClick={() => setFormRefund(f => ({ ...f, bukti: '' }))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#DC2626' }}>✕</button>
                      </div>
                    ) : (
                      <input type="file" accept=".jpg,.jpeg,.png,.pdf" onChange={handleUploadBuktiRefund} disabled={formRefund.uploading} style={{ fontSize: 12 }} />
                    )}
                    {formRefund.uploading && <p style={{ fontSize: 11, color: '#9CA3AF', marginTop: 4 }}>Mengupload...</p>}
                  </div>
                </div>
                <button onClick={handleRefund} disabled={savingRefund || kelebihanBayar <= 0} style={{ padding: '9px 18px', background: '#C2410C', color: 'white', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', opacity: savingRefund ? 0.6 : 1 }}>
                  {savingRefund ? 'Menyimpan...' : 'Kembalikan Dana'}
                </button>
              </fieldset>
            </div>

            {/* Alokasikan kelebihan bayar ke pembayaran sekolah lain — sama
                seperti refund, selalu tampil (nonaktif kalau tidak ada
                kelebihan bayar), uangnya TETAP di sekolah cuma dipindah
                peruntukannya (tidak pernah dianggap cicilan ataupun refund). */}
            <div style={{ background: kelebihanBayar > 0 ? '#EEF2FF' : '#FAFAFA', border: `1px solid ${kelebihanBayar > 0 ? '#C7D2FE' : '#E5E7EB'}`, borderRadius: 14, padding: 20 }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: kelebihanBayar > 0 ? '#3730A3' : '#9CA3AF', marginBottom: 4 }}>⇄ Alokasikan Kelebihan Bayar</h3>
              <p style={{ fontSize: 12, color: '#6B7280', marginBottom: 14 }}>
                {kelebihanBayar > 0
                  ? <>Kelebihan bayar saat ini: <strong style={{ color: '#3730A3' }}>{formatRupiah(kelebihanBayar)}</strong> — bisa dialihkan untuk pembayaran sekolah lain (SPP, uang pangkal, dst) tanpa dikembalikan tunai.</>
                  : 'Tidak ada kelebihan bayar saat ini — form ini aktif lagi begitu ada kelebihan bayar.'}
              </p>
              <fieldset disabled={kelebihanBayar <= 0} style={{ border: 'none', padding: 0, margin: 0, opacity: kelebihanBayar <= 0 ? 0.5 : 1 }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginBottom: 12 }}>
                  <div>
                    <label style={lbl}>Jenis Pembayaran</label>
                    <select value={formAlokasi.kategori} onChange={e => setFormAlokasi(f => ({ ...f, kategori: e.target.value }))} style={{ width: '100%', padding: '9px 12px', border: '1.5px solid #D1D5DB', borderRadius: 8, fontSize: 13, fontFamily: 'inherit' }}>
                      <option value="">Pilih...</option>
                      {KATEGORI_ALOKASI.map(k => <option key={k} value={k}>{k}</option>)}
                    </select>
                  </div>
                  {formAlokasi.kategori === 'Lainnya' && (
                    <div>
                      <label style={lbl}>Jenis Pembayaran Lainnya</label>
                      <input type="text" value={formAlokasi.kategoriLainnya} onChange={e => setFormAlokasi(f => ({ ...f, kategoriLainnya: e.target.value }))} placeholder="Contoh: Uang Study Tour" style={{ width: '100%', padding: '9px 12px', border: '1.5px solid #D1D5DB', borderRadius: 8, fontSize: 13, fontFamily: 'inherit' }} />
                    </div>
                  )}
                  <div>
                    <label style={lbl}>Nominal Dialokasikan</label>
                    <input
                      type="text" inputMode="numeric"
                      value={formAlokasi.nominal ? Number(formAlokasi.nominal.replace(/[^\d]/g, '')).toLocaleString('id-ID') : ''}
                      onChange={e => setFormAlokasi(f => ({ ...f, nominal: e.target.value.replace(/[^\d]/g, '') }))}
                      placeholder={kelebihanBayar > 0 ? `Maks. ${kelebihanBayar.toLocaleString('id-ID')}` : '-'}
                      style={{ width: '100%', padding: '9px 12px', border: '1.5px solid #D1D5DB', borderRadius: 8, fontSize: 13, fontFamily: 'inherit' }}
                    />
                  </div>
                  <div>
                    <label style={lbl}>Keterangan (opsional)</label>
                    <input type="text" value={formAlokasi.keterangan} onChange={e => setFormAlokasi(f => ({ ...f, keterangan: e.target.value }))} placeholder="Catatan tambahan" style={{ width: '100%', padding: '9px 12px', border: '1.5px solid #D1D5DB', borderRadius: 8, fontSize: 13, fontFamily: 'inherit' }} />
                  </div>
                </div>
                <button onClick={handleAlokasi} disabled={savingAlokasi || kelebihanBayar <= 0} style={{ padding: '9px 18px', background: '#4338CA', color: 'white', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', opacity: savingAlokasi ? 0.6 : 1 }}>
                  {savingAlokasi ? 'Menyimpan...' : 'Alokasikan Pembayaran'}
                </button>
              </fieldset>
            </div>

            {/* Ringkasan keuangan — SATU sumber data (hitungRingkasan atas
                data.pembayaranList dari server), semua angka SELALU tampil
                (bukan disembunyikan saat 0) supaya admin bisa lihat postur
                lengkapnya: Total Pembayaran - Total Alokasi - Total Refund
                = Saldo/Kelebihan Tersedia. */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 }}>
              <div style={{ background: 'white', borderRadius: 12, padding: 16, border: '1px solid #F3F4F6' }}>
                <div style={lbl}>TOTAL TAGIHAN</div>
                <div style={{ fontSize: 20, fontWeight: 700, color: '#0A1628' }}>{formatRupiah(totalTagihan)}</div>
              </div>
              <div style={{ background: '#F0FDF4', borderRadius: 12, padding: 16, border: '1px solid #D1FAE5' }}>
                <div style={{ ...lbl, color: '#059669' }}>TOTAL PEMBAYARAN (CICILAN)</div>
                <div style={{ fontSize: 20, fontWeight: 700, color: '#065F46' }}>{formatRupiah(totalBayar)}</div>
              </div>
              <div style={{ background: '#FFF7ED', borderRadius: 12, padding: 16, border: '1px solid #FED7AA' }}>
                <div style={{ ...lbl, color: '#C2410C' }}>TOTAL REFUND</div>
                <div style={{ fontSize: 20, fontWeight: 700, color: '#C2410C' }}>{formatRupiah(totalRefund)}</div>
              </div>
              <div style={{ background: '#EEF2FF', borderRadius: 12, padding: 16, border: '1px solid #C7D2FE' }}>
                <div style={{ ...lbl, color: '#3730A3' }}>TOTAL ALOKASI</div>
                <div style={{ fontSize: 20, fontWeight: 700, color: '#3730A3' }}>{formatRupiah(totalAlokasi)}</div>
              </div>
              <div style={{ background: kelebihanBayar > 0 ? '#EFF6FF' : '#FAFAFA', borderRadius: 12, padding: 16, border: `1px solid ${kelebihanBayar > 0 ? '#BFDBFE' : '#E5E7EB'}` }}>
                <div style={{ ...lbl, color: kelebihanBayar > 0 ? '#1E40AF' : '#9CA3AF' }}>SALDO/KELEBIHAN TERSEDIA</div>
                <div style={{ fontSize: 20, fontWeight: 700, color: kelebihanBayar > 0 ? '#1E40AF' : '#374151' }}>{formatRupiah(kelebihanBayar)}</div>
              </div>
              <div style={{ background: (totalTagihan > 0 && sisaBayar <= 0) ? '#F0FDF4' : '#FFFBEB', borderRadius: 12, padding: 16, border: `1px solid ${(totalTagihan > 0 && sisaBayar <= 0) ? '#D1FAE5' : '#FDE68A'}` }}>
                <div style={{ ...lbl, color: (totalTagihan > 0 && sisaBayar <= 0) ? '#059669' : '#B45309' }}>{(totalTagihan > 0 && sisaBayar <= 0) ? 'STATUS' : 'KURANG BAYAR'}</div>
                <div style={{ fontSize: 20, fontWeight: 700, color: (totalTagihan > 0 && sisaBayar <= 0) ? '#065F46' : '#92400E' }}>{totalTagihan === 0 ? 'Belum Ada Tagihan' : (sisaBayar <= 0 ? 'Lunas' : formatRupiah(sisaBayar))}</div>
              </div>
            </div>

            {data.gelombang && (
              <p style={{ fontSize: 12, color: '#6B7280' }}>Gelombang saat mendaftar: <strong style={{ color: '#C8973A' }}>{data.gelombang}</strong></p>
            )}

            <div style={{ background: 'white', borderRadius: 14, border: '1px solid #F3F4F6', overflow: 'hidden' }}>
              <div style={{ padding: '14px 20px', borderBottom: '1px solid #F3F4F6' }}>
                <h3 style={{ fontSize: 14, fontWeight: 700, color: '#0A1628' }}>Riwayat Cicilan Pembayaran</h3>
              </div>
              {data.pembayaranList.length === 0 ? (
                <div style={{ padding: 40, textAlign: 'center', color: '#9CA3AF', fontSize: 13 }}>Belum ada pembayaran masuk</div>
              ) : (
                data.pembayaranList.map((c, i) => {
                  const isRefund = c.jenis === 'refund';
                  const isAlokasi = c.jenis === 'alokasi';
                  const csc = isAlokasi && c.status === 'lunas'
                    ? { label: 'Dialokasikan', color: '#3730A3', bg: '#E0E7FF' }
                    : isRefund && c.status === 'lunas'
                    ? { label: 'Dikembalikan', color: '#C2410C', bg: '#FFEDD5' }
                    : (STATUS_CICILAN[c.status] || STATUS_CICILAN['menunggu_verifikasi']);
                  const warna = isRefund ? '#C2410C' : isAlokasi ? '#3730A3' : '#0A1628';
                  return (
                    <div key={c.id} style={{ padding: '16px 20px', borderTop: i === 0 ? 'none' : '1px solid #F3F4F6', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, background: isRefund ? '#FFFBF5' : isAlokasi ? '#F5F6FF' : undefined }}>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: warna }}>
                          {isRefund
                            ? `↩ Refund ke-${c.angsuranKe} — ${formatRupiah(c.nominal)}`
                            : isAlokasi
                            ? `⇄ Alokasi ke-${c.angsuranKe} (${c.kategoriAlokasi || 'Lainnya'}) — ${formatRupiah(c.nominal)}`
                            : `Cicilan ke-${c.angsuranKe} — ${formatRupiah(c.nominal)}`}
                        </div>
                        <div style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>
                          {new Date(c.tanggalBayar).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                          {!isAlokasi && ` · ${c.metodePembayaran}`}
                          {c.bankPengirim && ` · ${c.bankPengirim} a.n. ${c.namaPengirim}`}
                          {isRefund && c.alasanRefund && ` · Alasan: ${c.alasanRefund}`}
                          {isAlokasi && c.catatanAdmin && ` · ${c.catatanAdmin}`}
                        </div>
                        {c.status === 'ditolak' && c.catatanAdmin && <div style={{ fontSize: 12, color: '#DC2626', marginTop: 4 }}>Catatan: {c.catatanAdmin}</div>}
                        {c.buktiPembayaran && (
                          <a href={c.buktiPembayaran} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: '#C8973A', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 4, marginTop: 4 }}>
                            Lihat bukti <ExternalLink size={11} />
                          </a>
                        )}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        <span style={{ background: csc.bg, color: csc.color, padding: '4px 12px', borderRadius: 14, fontSize: 11, fontWeight: 700 }}>{csc.label}</span>
                        {c.status === 'menunggu_verifikasi' && (
                          <>
                            <button onClick={() => handleVerifikasiCicilan(c, 'lunas')} style={{ padding: '6px 12px', background: '#065F46', color: 'white', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>Verifikasi</button>
                            <button onClick={() => handleVerifikasiCicilan(c, 'ditolak')} style={{ padding: '6px 12px', background: '#FFF1F2', color: '#DC2626', border: '1px solid #FECDD3', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>Tolak</button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
