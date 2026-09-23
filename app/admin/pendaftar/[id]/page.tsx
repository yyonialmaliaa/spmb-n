'use client';
import { useState, useEffect } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  ChevronLeft, User, Wallet, Printer, ExternalLink, Pencil,
  ShieldCheck, CheckCircle2, XCircle, RotateCcw, FileText,
  MessageCircle, KeyRound, ClipboardCheck, X as XIcon,
} from 'lucide-react';
import { JENJANG_LABEL, Jenjang } from '@/lib/biaya';
import { formatRupiah, hitungRingkasan } from '@/lib/pembayaran-utils';
import { PermissionGate } from '@/components/admin/ui';
import { isAdminRole, normalizeRole } from '@/lib/permissions';
import { useAdmin } from '@/components/admin/AdminProvider';
import { FIELD_BERKAS } from '@/lib/labels';

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
  tanggalDaftarUlang?: string;
  catatanDaftarUlang?: string;
  revisiCount?: number;
  alasanPenolakan?: string;
  pesanPengumuman?: string;
  noPendaftaran?: string | null;
  validasiBerkas?: Record<string, { status: 'valid' | 'revisi'; catatan?: string }> | null;

  createdAt: string;
  tahunAjaranId?: string;
  user?: { email: string };
  userId?: string;
  pembayaranList: Cicilan[];
};

type Persyaratan = {
  id: string; nama: string; fieldKey: string | null; jenjang: string;
  wajib: boolean; aktif: boolean;
};

/** Satu baris di checklist: gabungan persyaratan + berkas yang diupload + status validasi admin. */
type BarisBerkas = {
  fieldKey: string; label: string; wajib: boolean; url: string | null;
  status: 'valid' | 'revisi' | null; catatan?: string;
};

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  draft:           { label: 'Draft — Belum Dikirim', color: 'var(--adm-text-muted)', bg: 'var(--adm-surface-alt)' },
  verified:        { label: 'Sedang Diverifikasi', color: 'var(--adm-info)', bg: 'var(--adm-info-weak)' },
  diterima_berkas: { label: 'Terima Berkas',        color: 'var(--adm-success)', bg: 'var(--adm-success-weak)' },
  ditolak:         { label: 'Tolak Berkas',         color: 'var(--adm-danger)', bg: 'var(--adm-danger-weak)' },
};

const STATUS_BAYAR_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  belum_bayar:         { label: 'Belum Bayar',       color: 'var(--adm-text-faint)', bg: 'var(--adm-surface-alt)' },
  menunggu_verifikasi: { label: 'Menunggu Verifikasi', color: 'var(--adm-info)', bg: 'var(--adm-info-weak)' },
  cicilan_berjalan:    { label: 'Cicilan Berjalan',   color: 'var(--adm-ungu)', bg: 'var(--adm-ungu-weak)' },
  lunas:               { label: 'Lunas',              color: 'var(--adm-success)', bg: 'var(--adm-success-weak)' },
  ditolak:             { label: 'Ditolak',            color: 'var(--adm-danger)', bg: 'var(--adm-danger-weak)' },
  dikembalikan:        { label: 'Dikembalikan',       color: 'var(--adm-warning)', bg: 'var(--adm-warning-weak)' },
};

const STATUS_CICILAN: Record<string, { label: string; color: string; bg: string }> = {
  menunggu_verifikasi: { label: 'Menunggu Verifikasi', color: 'var(--adm-info)', bg: 'var(--adm-info-weak)' },
  lunas:                { label: 'Terverifikasi',      color: 'var(--adm-success)', bg: 'var(--adm-success-weak)' },
  ditolak:              { label: 'Ditolak',             color: 'var(--adm-danger)', bg: 'var(--adm-danger-weak)' },
};

type Diskon = { id: string; jenis: string; tipeNominal: string; nominal: number; aktif: boolean };

export default function DetailPendaftarPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const id = (Array.isArray(params.id) ? params.id[0] : params.id) as string;
  const { role, href, can, tahunAjaranId } = useAdmin();
  // Verifikasi keuangan — menerima/menolak cicilan yang menunggu verifikasi,
  // mengembalikan dana, dan mengalokasikan kelebihan bayar — TETAP khusus
  // Admin Keuangan (Loket) & Super Admin. PermissionGate resource=
  // "pembayaran" action="update" saja tidak lagi cukup untuk ketiganya:
  // Admin SPMB kini juga punya izin itu, tapi hanya untuk "Bantu Input
  // Pembayaran" (mencatat pembayaran baru) di bawah — bukan untuk
  // memverifikasi/menolak/mengembalikan/mengalokasikan. Digerbangi eksplisit
  // lewat role, sama seperti gerbang eksplisit di app/api/admin/pembayaran/
  // route.ts dan app/api/admin/pembayaran/[id]/route.ts.
  const bolehVerifikasiKeuangan = role === 'admin_keuangan' || role === 'super_admin';
  // Pemeriksaan berkas & kelulusan (tab Verifikasi) — Admin Keuangan memang
  // tidak diberi izin 'verifikasi' di lib/permissions.ts ("tidak dapat
  // memverifikasi dokumen atau mengubah kelulusan"), jadi cukup pakai can()
  // yang sama seperti /admin/verifikasi, bukan gerbang role manual baru.
  const bolehVerifikasi = can('verifikasi', 'update');
  const bolehHapus = can('pendaftar', 'delete');

  const [data, setData] = useState<Pendaftar | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'verifikasi' | 'biodata' | 'keuangan'>('verifikasi');
  const [toast, setToast] = useState('');
  const [persyaratan, setPersyaratan] = useState<Persyaratan[]>([]);
  // Modal konfirmasi 2-langkah untuk ubah status kelulusan — sama seperti
  // pola yang sudah ada (pilih status dulu, isi pesan/alasan, baru kirim),
  // supaya siswa tidak pernah menerima notifikasi status tanpa admin sempat
  // menuliskan pesannya.
  const [statusModal, setStatusModal] = useState<{ status: 'diterima_berkas' | 'ditolak'; alasan: string; pesan: string } | null>(null);
  const [savingStatus, setSavingStatus] = useState(false);
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

      // Rute ini ('/admin/pendaftar/[id]') tidak punya segmen jenjang, jadi
      // AdminProvider (yang mengatur konteks Sidebar) HANYA tahu jenjangnya
      // lewat query "?jenjang=". Kalau tautan yang membawa admin ke sini lupa
      // menyertakannya, konteks sidebar diam-diam jatuh ke bawaan (SMP) —
      // itulah bug "buka SMA, klik apa saja, tiba-tiba pindah ke SMP" yang
      // dilaporkan. Begitu data pendaftar (dan jenjang aslinya) diketahui,
      // tempelkan ke URL lewat replace (bukan push, supaya tidak menambah
      // riwayat baru) — bukan cuma memperbaiki tautan DI HALAMAN ini, tapi
      // seluruh sidebar yang membaca konteks yang sama.
      const jenjangRekam = d.data?.jenjang
      if (jenjangRekam && searchParams.get('jenjang') !== jenjangRekam) {
        const sp = new URLSearchParams(searchParams.toString())
        sp.set('jenjang', jenjangRekam)
        router.replace(`/admin/pendaftar/${id}?${sp.toString()}`)
      }
    });
  };

  useEffect(() => {
    fetch('/api/auth/me').then(r => r.json()).then(d => {
      if (!d.user || !isAdminRole(normalizeRole(d.user.role))) { router.push('/login'); return; }
    });
    if (id) load();
    fetch('/api/admin/diskon').then(r => r.json()).then(d => setDiskonList(d.data || []));
  }, [id]);

  // Daftar persyaratan berkas untuk checklist tab Verifikasi — dari tahun
  // ajaran & jenjang PENDAFTAR INI SENDIRI (bukan konteks admin yang sedang
  // dibuka), supaya tetap benar walau admin sedang melihat tahun ajaran lain.
  useEffect(() => {
    if (!data?.jenjang || !data?.tahunAjaranId) return;
    const qs = new URLSearchParams({ kategori: 'pendaftaran', jenjang: data.jenjang, tahunAjaranId: data.tahunAjaranId });
    fetch(`/api/admin/persyaratan?${qs}`).then(r => r.json()).then(d => setPersyaratan((d.data || []).filter((s: Persyaratan) => s.aktif && s.fieldKey))).catch(() => setPersyaratan([]));
  }, [data?.jenjang, data?.tahunAjaranId]);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  // Gabungan persyaratan (nama, wajib) + berkas yang sudah diupload (url) +
  // status pemeriksaan admin (validasiBerkas) — satu daftar siap-tampil
  // untuk checklist di tab Verifikasi.
  const checklistBerkas = (): BarisBerkas[] => {
    if (!data) return [];
    const daftar = persyaratan.length > 0
      ? persyaratan
      // Cadangan: persyaratan belum diatur admin untuk jenjang ini — pakai
      // FIELD_BERKAS bawaan supaya checklist tidak kosong total.
      : Object.keys(FIELD_BERKAS).map(fk => ({ id: fk, nama: FIELD_BERKAS[fk], fieldKey: fk, jenjang: data.jenjang || '', wajib: true, aktif: true }));
    return daftar
      .filter(s => s.fieldKey)
      .map(s => {
        const fieldKey = s.fieldKey as string;
        const v = data.validasiBerkas?.[fieldKey];
        return {
          fieldKey,
          label: FIELD_BERKAS[fieldKey] || s.nama,
          wajib: s.wajib,
          url: (data as unknown as Record<string, string | null>)[fieldKey] ?? null,
          status: v?.status ?? null,
          catatan: v?.catatan,
        };
      });
  };

  // Tandai satu berkas Valid / Perlu Revisi / bersihkan tandanya (✕).
  const handleUbahValidasi = async (fieldKey: string, status: 'valid' | 'revisi' | null) => {
    let catatan: string | undefined;
    if (status === 'revisi') {
      const c = prompt('Apa yang perlu diperbaiki pada berkas ini?');
      if (c === null) return;
      if (!c.trim()) { showToast('❌ Catatan revisi wajib diisi'); return; }
      catatan = c.trim();
    }
    const res = await fetch(`/api/admin/pendaftar/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ validasiBerkas: { [fieldKey]: status === null ? null : { status, catatan } } }),
    });
    if (res.ok) { load(); } else { showToast('❌ Gagal menyimpan'); }
  };

  // Tombol besar "Setujui Semua (Valid)" — bulk tandai seluruh checklist
  // Valid, lalu lanjut ke modal status "Terima Berkas" supaya admin tetap
  // sempat menuliskan pesan selamat untuk siswa sebelum benar-benar dikirim
  // (pola yang sama dengan tombol status lain — tidak ada status yang
  // berubah/notifikasi terkirim tanpa admin sempat melihat pesannya dulu).
  const handleSetujuiSemua = async () => {
    if (!data) return;
    const checklist = checklistBerkas();
    if (!confirm('Tandai SEMUA berkas sebagai Valid, lalu lanjut ke penerimaan berkas?')) return;
    const validasiBaru: Record<string, { status: 'valid' }> = {};
    for (const b of checklist) validasiBaru[b.fieldKey] = { status: 'valid' };
    const res = await fetch(`/api/admin/pendaftar/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ validasiBerkas: validasiBaru }),
    });
    if (!res.ok) { showToast('❌ Gagal menyimpan checklist'); return; }
    load();
    setStatusModal({ status: 'diterima_berkas', alasan: '', pesan: data.pesanPengumuman || 'Selamat! Berkas Anda dinyatakan lengkap dan diterima. Silakan tunggu informasi daftar ulang selanjutnya.' });
  };

  const handleTolakBerkas = () => {
    setStatusModal({ status: 'ditolak', alasan: data?.alasanPenolakan || '', pesan: '' });
  };

  // "Minta Revisi" — rangkum catatan dari berkas yang sudah ditandai "Perlu
  // Revisi" jadi satu draf alasan penolakan (tetap bisa diedit admin sebelum
  // dikirim), supaya admin tidak perlu mengetik ulang apa yang sudah dicatat
  // per-dokumen di checklist.
  const handleMintaRevisi = () => {
    const perluRevisi = checklistBerkas().filter(b => b.status === 'revisi');
    const draf = perluRevisi.length > 0
      ? perluRevisi.map(b => `• ${b.label}: ${b.catatan || 'perlu diperbaiki'}`).join('\n')
      : '';
    if (perluRevisi.length === 0) {
      showToast('ℹ️ Tandai dulu berkas mana yang "Perlu Revisi" di checklist di bawah');
    }
    setStatusModal({ status: 'ditolak', alasan: draf, pesan: '' });
  };

  const handleKirimStatus = async () => {
    if (!statusModal) return;
    if (statusModal.status === 'ditolak' && !statusModal.alasan.trim()) {
      showToast('❌ Alasan penolakan wajib diisi'); return;
    }
    setSavingStatus(true);
    try {
      const res = await fetch(`/api/admin/pendaftar/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(
          statusModal.status === 'ditolak'
            ? { status: 'ditolak', alasanPenolakan: statusModal.alasan.trim() }
            : { status: 'diterima_berkas', pesanPengumuman: statusModal.pesan.trim() },
        ),
      });
      if (res.ok) {
        showToast(statusModal.status === 'ditolak' ? '↩ Berkas ditolak, siswa diberi tahu' : '✅ Berkas diterima, siswa diberi tahu');
        setStatusModal(null);
        load();
      } else {
        const d = await res.json().catch(() => ({}));
        showToast(`❌ ${d.error || 'Gagal menyimpan'}`);
      }
    } finally {
      setSavingStatus(false);
    }
  };

  const handleKonfirmasiDaftarUlang = async () => {
    if (!confirm('Konfirmasi bahwa siswa ini sudah melakukan daftar ulang?')) return;
    const res = await fetch(`/api/admin/pendaftar/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sudahDaftarUlang: true }),
    });
    if (res.ok) { showToast('✅ Daftar ulang dikonfirmasi'); load(); } else { showToast('❌ Gagal menyimpan'); }
  };

  // Verifikasi WhatsApp (dicek manual admin, bukan otomatis)
  const handleToggleWa = async () => {
    if (!data) return;
    const res = await fetch(`/api/admin/pendaftar/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ waVerified: !data.waVerified }),
    });
    if (res.ok) {
      const d = await res.json();
      showToast(d.data.waVerified ? '✅ No. WhatsApp ditandai terverifikasi' : 'No. WhatsApp dibatalkan verifikasinya');
      load();
    }
  };

  // Reset password akun siswa (untuk yang lupa email/password)
  const handleResetPassword = async () => {
    if (!data?.userId) { showToast('❌ Data akun tidak ditemukan'); return; }
    const pwBaru = prompt(`Masukkan password baru untuk ${data.namaLengkap} (${data.user?.email || '-'}), minimal 8 karakter:`);
    if (!pwBaru) return;
    if (pwBaru.length < 8) { showToast('❌ Password minimal 8 karakter'); return; }
    if (!confirm(`Reset password akun ${data.user?.email} menjadi password baru ini?`)) return;

    const res = await fetch('/api/admin/reset-password', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: data.userId, passwordBaru: pwBaru }),
    });
    const d = await res.json();
    if (res.ok) {
      alert(`✅ Password berhasil direset!\n\nEmail: ${d.email}\nPassword baru: ${pwBaru}\n\nSampaikan info ini ke siswa melalui WhatsApp.`);
    } else {
      showToast(`❌ ${d.error || 'Gagal reset password'}`);
    }
  };

  // Hapus permanen data pendaftar ini — dulu ada di modal "Detail" pada
  // daftar Pendaftar, dipindah ke sini karena "Detail" sekarang langsung ke
  // halaman ini (bukan modal lagi). Khusus yang punya izin pendaftar:delete
  // (super_admin), sama seperti sebelumnya lewat DELETE /api/admin/pendaftar/[id].
  const handleHapusData = async () => {
    if (!data) return;
    if (!confirm(`Yakin ingin menghapus data pendaftar "${data.namaLengkap}"? Tindakan ini tidak bisa dibatalkan.`)) return;
    const res = await fetch(`/api/admin/pendaftar/${id}`, { method: 'DELETE' });
    if (res.ok) {
      showToast('🗑 Data dihapus');
      router.push(href('/admin/pendaftar', { jenjang: data.jenjang }));
    } else {
      showToast('❌ Gagal menghapus data');
    }
  };

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

  if (loading) return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--adm-text-faint)' }}>Memuat...</div>;
  if (!data) return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--adm-text-faint)' }}>Data tidak ditemukan</div>;

  const sc = STATUS_CONFIG[data.status] || STATUS_CONFIG['verified'];
  const bc = STATUS_BAYAR_CONFIG[data.statusPembayaran || 'belum_bayar'] || STATUS_BAYAR_CONFIG['belum_bayar'];
  const breakdown = data.breakdown || null;
  const totalTagihan = breakdown?.totalTagihan ?? (data.totalTagihan || 0);
  const { totalBayar, totalRefund, totalAlokasi, sisaBayar, kelebihanBayar } = hitungRingkasan(data.pembayaranList, totalTagihan);
  const jenjang = (data.jenjang || 'smk') as Jenjang;

  const lbl: React.CSSProperties = { fontSize: 11, color: 'var(--adm-text-faint)', fontWeight: 600, marginBottom: 3, textTransform: 'uppercase', letterSpacing: 0.3 };
  const val: React.CSSProperties = { fontSize: 14, color: 'var(--adm-text)', fontWeight: 600 };
  const field = (label: string, value: any) => (
    <div style={{ background: 'var(--adm-surface-alt)', borderRadius: 8, padding: '10px 12px' }}>
      <div style={lbl}>{label}</div>
      <div style={val}>{value || '-'}</div>
    </div>
  );

  const fileField = (label: string, url?: string) => (
    <div style={{ background: 'var(--adm-surface-alt)', borderRadius: 8, padding: '10px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <div style={lbl}>{label}</div>
      {url ? (
        <a href={url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: 'var(--adm-secondary)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
          Lihat <ExternalLink size={12} />
        </a>
      ) : <span style={{ fontSize: 12, color: 'var(--adm-text-faint)' }}>Tidak ada</span>}
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: 'var(--adm-bg)' }}>
      {toast && <div style={{ position: 'fixed', top: 24, right: 24, background: 'var(--adm-primary)', color: 'var(--adm-text-invert)', padding: '12px 20px', borderRadius: 10, fontSize: 13, fontWeight: 600, zIndex: 9999 }}>{toast}</div>}

      <header style={{ background: 'var(--adm-primary)', padding: '18px 24px' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          <button onClick={() => router.back()} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', color: 'rgba(255,255,255,0.6)', fontSize: 12, cursor: 'pointer', marginBottom: 10, fontFamily: 'inherit' }}>
            <ChevronLeft size={14} /> Kembali
          </button>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
            <div>
              <h1 style={{ color: 'var(--adm-text-invert)', fontSize: 20, fontWeight: 700 }}>{data.namaLengkap}</h1>
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
        <div style={{ display: 'flex', gap: 8, marginBottom: 20, borderBottom: '1px solid var(--adm-border)' }}>
          {[
            { k: 'verifikasi', label: 'Verifikasi', icon: ShieldCheck },
            { k: 'biodata', label: 'Biodata', icon: User },
            { k: 'keuangan', label: 'Keuangan', icon: Wallet },
          ].map(t => (
            <button
              key={t.k}
              onClick={() => setTab(t.k as 'verifikasi' | 'biodata' | 'keuangan')}
              style={{
                display: 'flex', alignItems: 'center', gap: 6, padding: '10px 18px', background: 'none',
                border: 'none', borderBottom: tab === t.k ? '2px solid var(--adm-secondary)' : '2px solid transparent',
                color: tab === t.k ? 'var(--adm-text)' : 'var(--adm-text-faint)', fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit',
              }}
            >
              <t.icon size={15} /> {t.label}
            </button>
          ))}
        </div>

        {/* ============ TAB VERIFIKASI ============ */}
        {tab === 'verifikasi' && (() => {
          const checklist = checklistBerkas();
          const wajibList = checklist.filter(b => b.wajib);
          const validCount = wajibList.filter(b => b.status === 'valid').length;
          // Sekali berkas diterima, tombol Terima/Tolak (dan tiga aksi cepat
          // di atas) dikunci abu-abu — satu-satunya langkah yang tersisa
          // adalah Konfirmasi Daftar Ulang, supaya admin tidak bisa keliru
          // bolak-balik status setelah keputusan dijatuhkan.
          const statusFinal = data.status === 'diterima_berkas';
          const badgeValidasi = (status: 'valid' | 'revisi' | null, adaBerkas: boolean) => {
            if (!adaBerkas) return { teks: 'Belum diupload', color: 'var(--adm-text-faint)', bg: 'var(--adm-surface-alt)' };
            if (status === 'valid') return { teks: 'Valid ✓', color: 'var(--adm-success)', bg: 'var(--adm-success-weak)' };
            if (status === 'revisi') return { teks: 'Perlu Revisi ⚠', color: 'var(--adm-warning)', bg: 'var(--adm-warning-weak)' };
            return { teks: 'Belum ditinjau', color: 'var(--adm-text-muted)', bg: 'var(--adm-surface-alt)' };
          };

          return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Profil ringkas + tiga aksi cepat */}
            <div style={{ background: 'var(--adm-surface)', borderRadius: 14, padding: 18, border: '1px solid var(--adm-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 14 }}>
              <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
                <div style={{ width: 52, height: 52, borderRadius: 12, background: 'var(--adm-primary-weak)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 800, color: 'var(--adm-primary)', flexShrink: 0 }}>
                  {(data.namaLengkap || '?').split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()}
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 15, fontWeight: 800, color: 'var(--adm-text)' }}>{data.namaLengkap}</span>
                    <span style={{ background: sc.bg, color: sc.color, padding: '2px 10px', borderRadius: 10, fontSize: 11, fontWeight: 700 }}>{sc.label}</span>
                    {(data.revisiCount || 0) > 0 && (
                      <span style={{ fontSize: 11, color: 'var(--adm-info)', background: 'var(--adm-info-weak)', padding: '2px 8px', borderRadius: 10, fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                        <RotateCcw size={11} /> Revisi ke-{data.revisiCount}
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--adm-text-muted)', marginTop: 3 }}>
                    {data.noPendaftaran && <>#{data.noPendaftaran} · </>}
                    {JENJANG_LABEL[jenjang]}{jenjang === 'smk' && data.jurusan ? ` — ${data.jurusan}` : ''}
                    {data.gelombang && <> · Jalur: {data.gelombang}</>}
                    {data.noPribadi && <> · 📱 {data.noPribadi}</>}
                  </div>
                </div>
              </div>

              {bolehVerifikasi && (
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <button onClick={handleTolakBerkas} disabled={statusFinal} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 14px', background: 'var(--adm-danger-weak)', color: 'var(--adm-danger)', border: '1px solid var(--adm-danger-border)', borderRadius: 8, fontSize: 12.5, fontWeight: 700, cursor: statusFinal ? 'not-allowed' : 'pointer', fontFamily: 'inherit', opacity: statusFinal ? 0.5 : 1 }}>
                    <XCircle size={14} /> Tolak
                  </button>
                  <button onClick={handleMintaRevisi} disabled={statusFinal} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 14px', background: 'var(--adm-warning-weak)', color: 'var(--adm-warning)', border: '1px solid var(--adm-warning-border)', borderRadius: 8, fontSize: 12.5, fontWeight: 700, cursor: statusFinal ? 'not-allowed' : 'pointer', fontFamily: 'inherit', opacity: statusFinal ? 0.5 : 1 }}>
                    <RotateCcw size={14} /> Minta Revisi
                  </button>
                  <button onClick={handleSetujuiSemua} disabled={statusFinal} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 14px', background: 'var(--adm-success)', color: 'var(--adm-text-invert)', border: 'none', borderRadius: 8, fontSize: 12.5, fontWeight: 700, cursor: statusFinal ? 'not-allowed' : 'pointer', fontFamily: 'inherit', opacity: statusFinal ? 0.6 : 1 }}>
                    <CheckCircle2 size={14} /> Setujui Semua (Valid)
                  </button>
                </div>
              )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 300px', gap: 20, alignItems: 'start' }}>
              {/* LEFT — Checklist berkas */}
              <div style={{ background: 'var(--adm-surface)', borderRadius: 14, padding: 20, border: '1px solid var(--adm-border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, flexWrap: 'wrap', gap: 8 }}>
                  <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--adm-text)', display: 'flex', alignItems: 'center', gap: 7 }}>
                    <ClipboardCheck size={16} /> Checklist Berkas &amp; Validasi Dokumen
                  </h3>
                  {wajibList.length > 0 && (
                    <span style={{ fontSize: 11.5, fontWeight: 700, color: validCount === wajibList.length ? 'var(--adm-success)' : 'var(--adm-warning)', background: validCount === wajibList.length ? 'var(--adm-success-weak)' : 'var(--adm-warning-weak)', padding: '4px 10px', borderRadius: 10 }}>
                      Progress: {validCount} / {wajibList.length} Valid
                    </span>
                  )}
                </div>

                {checklist.length === 0 ? (
                  <p style={{ fontSize: 13, color: 'var(--adm-text-muted)' }}>
                    Persyaratan berkas untuk jenjang ini belum diatur.{' '}
                    <Link href={href('/admin/persyaratan')} style={{ color: 'var(--adm-primary)' }}>Atur sekarang →</Link>
                  </p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {checklist.map(b => {
                      const badge = badgeValidasi(b.status, !!b.url);
                      return (
                        <div key={b.fieldKey} style={{ border: '1px solid var(--adm-border)', borderRadius: 10, background: 'var(--adm-surface-alt)', padding: '10px 12px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 9, minWidth: 0 }}>
                              <FileText size={16} color="var(--adm-text-faint)" style={{ flexShrink: 0 }} />
                              <div style={{ minWidth: 0 }}>
                                <div style={{ fontSize: 13, fontWeight: 650, color: 'var(--adm-text)' }}>
                                  {b.label}{!b.wajib && <span style={{ fontWeight: 400, color: 'var(--adm-text-faint)' }}> (opsional)</span>}
                                </div>
                                {b.url && (
                                  <a href={b.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 11.5, color: 'var(--adm-secondary)', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                                    Lihat Berkas <ExternalLink size={10} />
                                  </a>
                                )}
                              </div>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                              <span style={{ background: badge.bg, color: badge.color, padding: '3px 10px', borderRadius: 10, fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap' }}>{badge.teks}</span>
                              {bolehVerifikasi && b.url && !statusFinal && (
                                <div style={{ display: 'flex', gap: 4 }}>
                                  <button onClick={() => handleUbahValidasi(b.fieldKey, 'valid')} style={{ padding: '5px 9px', background: b.status === 'valid' ? 'var(--adm-success)' : 'var(--adm-success-weak)', color: b.status === 'valid' ? 'var(--adm-text-invert)' : 'var(--adm-success)', border: 'none', borderRadius: 7, fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>Valid ✓</button>
                                  <button onClick={() => handleUbahValidasi(b.fieldKey, 'revisi')} style={{ padding: '5px 9px', background: b.status === 'revisi' ? 'var(--adm-warning)' : 'var(--adm-warning-weak)', color: b.status === 'revisi' ? 'var(--adm-text-invert)' : 'var(--adm-warning)', border: 'none', borderRadius: 7, fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>Revisi ⚠</button>
                                  {b.status && (
                                    <button onClick={() => handleUbahValidasi(b.fieldKey, null)} aria-label="Bersihkan tanda" style={{ padding: '5px 7px', background: 'var(--adm-neutral-weak)', color: 'var(--adm-text-muted)', border: '1px solid var(--adm-border)', borderRadius: 7, cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                                      <XIcon size={11} />
                                    </button>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                          {b.status === 'revisi' && b.catatan && (
                            <div style={{ fontSize: 11.5, color: 'var(--adm-warning)', marginTop: 6, paddingLeft: 25 }}>
                              {b.catatan}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {data.alasanPenolakan && (
                  <div style={{ marginTop: 14, background: 'var(--adm-danger-weak)', border: '1px solid var(--adm-danger-border)', borderRadius: 10, padding: 12 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--adm-danger)', marginBottom: 2 }}>Alasan penolakan terakhir dikirim ke siswa:</div>
                    <div style={{ fontSize: 12, color: 'var(--adm-danger)', whiteSpace: 'pre-wrap' }}>{data.alasanPenolakan}</div>
                  </div>
                )}
              </div>

              {/* RIGHT — Panel Verifikasi */}
              <div style={{ position: 'sticky', top: 20, background: 'var(--adm-surface)', borderRadius: 14, padding: 16, border: '1px solid var(--adm-border)' }}>
                <h4 style={{ fontSize: 13, fontWeight: 700, color: 'var(--adm-text)', marginBottom: 12 }}>Panel Verifikasi</h4>

                <div style={{ background: sc.bg, borderRadius: 8, padding: '9px 12px', marginBottom: 14 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: sc.color, marginBottom: 2 }}>STATUS SAAT INI</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: sc.color }}>{sc.label}</div>
                </div>

                {/* Verifikasi WhatsApp (manual, bukan email) */}
                <div style={{ background: data.waVerified ? 'var(--adm-success-weak)' : 'var(--adm-warning-weak)', border: `1px solid ${data.waVerified ? 'var(--adm-success-border)' : 'var(--adm-warning-border)'}`, borderRadius: 8, padding: 10, marginBottom: 12 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: data.waVerified ? 'var(--adm-success)' : 'var(--adm-warning)', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 5 }}>
                    <MessageCircle size={13} /> No. WhatsApp: {data.noPribadi || '-'}
                  </div>
                  <p style={{ fontSize: 11, color: 'var(--adm-text-muted)', marginBottom: 8 }}>Hubungi nomor ini via WhatsApp untuk memastikan aktif &amp; benar milik pendaftar.</p>
                  <button onClick={handleToggleWa} style={{ width: '100%', padding: '7px 10px', background: data.waVerified ? 'var(--adm-success-weak)' : 'var(--adm-text)', border: 'none', borderRadius: 8, color: data.waVerified ? 'var(--adm-success)' : 'var(--adm-text-invert)', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                    {data.waVerified ? '✓ WhatsApp Terverifikasi (klik batalkan)' : 'Tandai WhatsApp Terverifikasi'}
                  </button>
                </div>

                {/* Reset Password Akun */}
                <div style={{ background: 'var(--adm-ungu-weak)', border: '1px solid var(--adm-ungu-weak)', borderRadius: 8, padding: 10, marginBottom: 12 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--adm-ungu)', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 5 }}>
                    <KeyRound size={13} /> Akun Login: {data.user?.email || '-'}
                  </div>
                  <p style={{ fontSize: 11, color: 'var(--adm-text-muted)', marginBottom: 8 }}>Kalau siswa lupa email/password, reset di sini lalu sampaikan info barunya via WhatsApp.</p>
                  <button onClick={handleResetPassword} style={{ width: '100%', padding: '7px 10px', background: 'var(--adm-ungu)', border: 'none', borderRadius: 8, color: 'var(--adm-text-invert)', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                    Reset Password Akun
                  </button>
                </div>

                <button onClick={() => setTab('keuangan')} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, width: '100%', padding: '9px 10px', background: 'var(--adm-primary)', borderRadius: 8, color: 'var(--adm-text-invert)', fontSize: 12, fontWeight: 700, border: 'none', cursor: 'pointer', fontFamily: 'inherit', marginBottom: 12 }}>
                  <Wallet size={13} /> Lihat Detail Lengkap &amp; Keuangan
                </button>

                {bolehVerifikasi && (
                  <>
                    <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--adm-text)', marginBottom: 8 }}>UBAH STATUS</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <button
                        onClick={() => setStatusModal({ status: 'diterima_berkas', alasan: '', pesan: data.pesanPengumuman || '' })}
                        disabled={statusFinal}
                        style={{ width: '100%', padding: '8px 10px', background: 'var(--adm-success-weak)', border: '1px solid var(--adm-success-border)', borderRadius: 8, color: 'var(--adm-success)', fontSize: 12, fontWeight: 600, cursor: statusFinal ? 'not-allowed' : 'pointer', fontFamily: 'inherit', textAlign: 'left', opacity: statusFinal ? 0.5 : 1 }}>
                        {statusFinal ? '✓ Terima Berkas (sudah)' : 'Terima Berkas'}
                      </button>
                      <button
                        onClick={handleTolakBerkas}
                        disabled={statusFinal}
                        style={{ width: '100%', padding: '8px 10px', background: 'var(--adm-danger-weak)', border: '1px solid var(--adm-danger-border)', borderRadius: 8, color: 'var(--adm-danger)', fontSize: 12, fontWeight: 600, cursor: statusFinal ? 'not-allowed' : 'pointer', fontFamily: 'inherit', textAlign: 'left', opacity: statusFinal ? 0.5 : 1 }}>
                        Tolak Berkas
                      </button>

                      {/* Konfirmasi Daftar Ulang — SENGAJA baru muncul & bisa
                          dipencet setelah Terima Berkas, dan jadi langkah
                          TERAKHIR (tidak ada lagi setelah ini). */}
                      {statusFinal && (
                        <button
                          onClick={() => data.sudahDaftarUlang ? undefined : handleKonfirmasiDaftarUlang()}
                          disabled={data.sudahDaftarUlang}
                          style={{ width: '100%', padding: '8px 10px', background: 'var(--adm-success-weak)', border: '1px solid var(--adm-success-border)', borderRadius: 8, color: 'var(--adm-success)', fontSize: 12, fontWeight: 700, cursor: data.sudahDaftarUlang ? 'not-allowed' : 'pointer', fontFamily: 'inherit', textAlign: 'left', opacity: data.sudahDaftarUlang ? 0.7 : 1 }}>
                          {data.sudahDaftarUlang ? '✓ Daftar Ulang Sudah Dikonfirmasi' : '📋 Konfirmasi Daftar Ulang'}
                        </button>
                      )}
                    </div>
                  </>
                )}

                {bolehHapus && (
                  <button onClick={handleHapusData} style={{ width: '100%', marginTop: 14, background: 'var(--adm-danger-weak)', color: 'var(--adm-danger)', border: '1px solid var(--adm-danger-border)', borderRadius: 8, padding: '8px', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
                    🗑 Hapus Data
                  </button>
                )}
              </div>
            </div>
          </div>
          );
        })()}

        {/* ============ TAB BIODATA ============ */}
        {tab === 'biodata' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Semua formulir (online maupun offline) bisa dikoreksi/dilengkapi
                lagi dari sini — bukan cuma draft offline. */}
            <Link href={href('/admin/pendaftar/tambah', { id: data.id, jenjang })} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '10px 16px', background: 'var(--adm-secondary)', borderRadius: 10, color: 'var(--adm-text-invert)', fontSize: 13, fontWeight: 700, textDecoration: 'none' }}>
              <Pencil size={15} /> Edit Formulir
            </Link>
            <div style={{ background: 'var(--adm-surface)', borderRadius: 14, padding: 20, border: '1px solid var(--adm-border)' }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--adm-text)', marginBottom: 14 }}>Data Pribadi</h3>
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

            <div style={{ background: 'var(--adm-surface)', borderRadius: 14, padding: 20, border: '1px solid var(--adm-border)' }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--adm-text)', marginBottom: 14 }}>Data Akademik</h3>
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

            <div style={{ background: 'var(--adm-surface)', borderRadius: 14, padding: 20, border: '1px solid var(--adm-border)' }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--adm-info)', marginBottom: 14 }}>Data Ayah</h3>
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

            <div style={{ background: 'var(--adm-surface)', borderRadius: 14, padding: 20, border: '1px solid var(--adm-border)' }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--adm-ungu)', marginBottom: 14 }}>Data Ibu</h3>
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
              <div style={{ background: 'var(--adm-surface)', borderRadius: 14, padding: 20, border: '1px solid var(--adm-border)' }}>
                <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--adm-success)', marginBottom: 14 }}>Data Wali</h3>
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

            <div style={{ background: 'var(--adm-surface)', borderRadius: 14, padding: 20, border: '1px solid var(--adm-border)' }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--adm-text)', marginBottom: 14 }}>Berkas Diupload</h3>
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
            {/* Front Office memang boleh MELIHAT seluruh data keuangan, dan
                sekarang juga boleh MENCATAT pembayaran baru + menerapkan
                diskon — yang TIDAK boleh hanya pengembalian & alokasi dana.
                Bukan <ReadOnlyBanner resource="pembayaran"> lagi: itu
                berbasis isReadOnly(resource), yang sekarang bernilai false
                untuk Admin SPMB (mereka punya create+update di resource ini),
                padahal refund/alokasi tetap harus disembunyikan dari mereka. */}
            {!bolehVerifikasiKeuangan && (
              <div className="adm-banner adm-banner--info" style={{ marginBottom: 16 }}>
                Anda dapat melihat rincian tagihan, mencatat pembayaran baru, dan menerapkan diskon. Pengembalian dan alokasi kelebihan bayar hanya dapat dilakukan oleh Admin Keuangan.
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Link href={`/admin/kwitansi/${data.id}`} target="_blank" style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 16px', background: 'var(--adm-primary)', color: 'var(--adm-text-invert)', borderRadius: 8, fontSize: 12, fontWeight: 700, textDecoration: 'none' }}>
                <Printer size={14} /> Cetak Kwitansi (Semua Pembayaran)
              </Link>
            </div>

            {/* Breakdown Harga -> Diskon -> Total Tagihan */}
            <div style={{ background: 'var(--adm-surface)', borderRadius: 14, padding: 20, border: '1px solid var(--adm-border)' }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--adm-text)', marginBottom: 14 }}>Rincian Tagihan</h3>
              {breakdown && !breakdown.hargaTersedia && (
                <div style={{ background: 'var(--adm-danger-weak)', border: '1px solid var(--adm-danger-border)', borderRadius: 10, padding: 14, marginBottom: 16, display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                  <span style={{ fontSize: 16 }}>⚠️</span>
                  <p style={{ fontSize: 12, color: 'var(--adm-danger)', lineHeight: 1.6, margin: 0 }}>
                    Harga untuk {JENJANG_LABEL[jenjang]}{jenjang === 'smk' ? ` — ${data.jurusan}` : ''} ({data.kelas || 'REGULER'}) belum diatur di Panel Harga. Total tagihan TIDAK dapat dihitung sampai admin mengatur harganya di <Link href={href('/admin/harga', { jenjang })} style={{ color: 'var(--adm-danger)', fontWeight: 700 }}>Panel Harga</Link>.
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
                <p style={{ fontSize: 11, color: 'var(--adm-text-faint)', marginBottom: 12 }}>Tagihan belum terkunci — masih dihitung langsung dari Harga/Gelombang/Diskon aktif, akan terkunci begitu ada pembayaran pertama.</p>
              )}
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10, flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: 220 }}>
                  <label style={lbl}>Terapkan Diskon</label>
                  <select value={selectedDiskonId} onChange={e => setSelectedDiskonId(e.target.value)} style={{ width: '100%', padding: '9px 12px', border: '1.5px solid var(--adm-border-strong)', borderRadius: 8, fontSize: 13, fontFamily: 'inherit' }}>
                    <option value="">Tidak ada diskon</option>
                    {diskonList.filter(d => d.aktif || d.id === data.diskonId).map(d => (
                      <option key={d.id} value={d.id}>{d.jenis} ({d.tipeNominal === 'persen' ? `${d.nominal}%` : formatRupiah(d.nominal)})</option>
                    ))}
                  </select>
                </div>
                <button onClick={handleTerapkanDiskon} disabled={savingDiskon || selectedDiskonId === (data.diskonId || '')} style={{ padding: '9px 18px', background: 'var(--adm-primary)', color: 'var(--adm-text-invert)', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', opacity: savingDiskon || selectedDiskonId === (data.diskonId || '') ? 0.5 : 1 }}>
                  {savingDiskon ? 'Menyimpan...' : 'Terapkan'}
                </button>
              </div>
            </div>

            {/* Admin bantu input pembayaran (misal siswa bayar tunai langsung di sekolah) */}
            <PermissionGate resource="pembayaran" action="update">
            <div style={{ background: 'var(--adm-ungu-weak)', border: '1px solid var(--adm-ungu-weak)', borderRadius: 14, padding: 20 }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--adm-ungu)', marginBottom: 4 }}>💰 Bantu Input Pembayaran</h3>
              <p style={{ fontSize: 12, color: 'var(--adm-text-muted)', marginBottom: 14 }}>Kalau siswa bayar tunai/transfer langsung ke sekolah, admin bisa catat di sini. Bukti pembayaran wajib diupload untuk transfer online; opsional untuk tunai di sekolah.</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginBottom: 12 }}>
                <div>
                  <label style={lbl}>Nominal</label>
                  <input
                    type="text" inputMode="numeric"
                    value={formBayar.nominal ? Number(formBayar.nominal.replace(/[^\d]/g, '')).toLocaleString('id-ID') : ''}
                    onChange={e => setFormBayar(f => ({ ...f, nominal: e.target.value.replace(/[^\d]/g, '') }))}
                    placeholder="Contoh: 500000"
                    style={{ width: '100%', padding: '9px 12px', border: '1.5px solid var(--adm-border-strong)', borderRadius: 8, fontSize: 13, fontFamily: 'inherit' }}
                  />
                </div>
                <div>
                  <label style={lbl}>Metode</label>
                  <select value={formBayar.metode} onChange={e => setFormBayar(f => ({ ...f, metode: e.target.value }))} style={{ width: '100%', padding: '9px 12px', border: '1.5px solid var(--adm-border-strong)', borderRadius: 8, fontSize: 13, fontFamily: 'inherit' }}>
                    <option value="">Pilih...</option>
                    <option value="offline">Offline (Tunai di sekolah)</option>
                    <option value="online">Online (Transfer)</option>
                  </select>
                </div>
                <div>
                  <label style={lbl}>Bukti{formBayar.metode !== 'offline' ? ' *' : ' (opsional untuk tunai)'}</label>
                  {formBayar.bukti ? (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--adm-success-weak)', border: '1px solid var(--adm-success-border)', borderRadius: 8, padding: '8px 12px', fontSize: 12, color: 'var(--adm-success)' }}>
                      ✓ Terupload
                      <button onClick={() => setFormBayar(f => ({ ...f, bukti: '' }))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--adm-danger)' }}>✕</button>
                    </div>
                  ) : (
                    <input type="file" accept=".jpg,.jpeg,.png,.pdf" onChange={handleUploadBuktiAdmin} disabled={formBayar.uploading} style={{ fontSize: 12 }} />
                  )}
                  {formBayar.uploading && <p style={{ fontSize: 11, color: 'var(--adm-text-faint)', marginTop: 4 }}>Mengupload...</p>}
                </div>
              </div>
              <button onClick={handleInputPembayaranAdmin} disabled={savingBayar} style={{ padding: '9px 18px', background: 'var(--adm-ungu)', color: 'var(--adm-text-invert)', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', opacity: savingBayar ? 0.6 : 1 }}>
                {savingBayar ? 'Menyimpan...' : 'Catat Pembayaran (Langsung Lunas)'}
              </button>
            </div>
            </PermissionGate>

            {/* Kembalikan kelebihan bayar (pindah jurusan / tidak jadi daftar) —
                selalu tampil (section B11), tinggal nonaktif kalau memang
                tidak ada kelebihan bayar untuk dikembalikan. BUKAN
                PermissionGate resource="pembayaran" — Admin SPMB punya izin
                itu juga sekarang tapi TETAP tidak boleh refund. */}
            {/* Nonaktif TIDAK berarti "solid abu-abu pekat" — var(--adm-text-faint)
                dirancang untuk warna TEKS, dipakai sebagai latar penuh
                malah terlihat seperti kotak yang "kepencet"/rusak. Latar
                nonaktifnya sekarang var(--adm-neutral-weak) (netral terang,
                sama seperti panel nonaktif lain di admin) + border tipis
                var(--adm-border) — abu-abunya tetap terlihat jelas nonaktif,
                cuma tidak lagi terlihat seperti elemen yang gagal render. */}
            {bolehVerifikasiKeuangan && (
            <div style={{ background: kelebihanBayar > 0 ? 'var(--adm-warning-weak)' : 'var(--adm-neutral-weak)', border: `1px solid ${kelebihanBayar > 0 ? 'var(--adm-warning-border)' : 'var(--adm-border)'}`, borderRadius: 14, padding: 20 }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: kelebihanBayar > 0 ? 'var(--adm-warning)' : 'var(--adm-text-faint)', marginBottom: 4 }}>↩ Kembalikan Kelebihan Bayar (Dikembalikan)</h3>
              <p style={{ fontSize: 12, color: 'var(--adm-text-muted)', marginBottom: 14 }}>
                {kelebihanBayar > 0
                  ? <>Kelebihan bayar saat ini: <strong style={{ color: 'var(--adm-warning)' }}>{formatRupiah(kelebihanBayar)}</strong> (misal karena pindah jurusan atau tidak jadi daftar).</>
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
                      style={{ width: '100%', padding: '9px 12px', border: '1.5px solid var(--adm-border-strong)', borderRadius: 8, fontSize: 13, fontFamily: 'inherit' }}
                    />
                  </div>
                  <div>
                    <label style={lbl}>Alasan</label>
                    <select value={formRefund.alasan} onChange={e => setFormRefund(f => ({ ...f, alasan: e.target.value }))} style={{ width: '100%', padding: '9px 12px', border: '1.5px solid var(--adm-border-strong)', borderRadius: 8, fontSize: 13, fontFamily: 'inherit' }}>
                      <option value="">Pilih...</option>
                      {ALASAN_REFUND.map(a => <option key={a} value={a}>{a}</option>)}
                    </select>
                  </div>
                  {formRefund.alasan === 'Lainnya' && (
                    <div>
                      <label style={lbl}>Keterangan Alasan Lainnya</label>
                      <input type="text" value={formRefund.alasanLainnya} onChange={e => setFormRefund(f => ({ ...f, alasanLainnya: e.target.value }))} placeholder="Jelaskan alasannya" style={{ width: '100%', padding: '9px 12px', border: '1.5px solid var(--adm-border-strong)', borderRadius: 8, fontSize: 13, fontFamily: 'inherit' }} />
                    </div>
                  )}
                  <div>
                    <label style={lbl}>Metode Pengembalian</label>
                    <select value={formRefund.metode} onChange={e => setFormRefund(f => ({ ...f, metode: e.target.value }))} style={{ width: '100%', padding: '9px 12px', border: '1.5px solid var(--adm-border-strong)', borderRadius: 8, fontSize: 13, fontFamily: 'inherit' }}>
                      <option value="">Pilih...</option>
                      <option value="offline">Tunai</option>
                      <option value="online">Transfer</option>
                    </select>
                  </div>
                  <div>
                    <label style={lbl}>Bukti Pengembalian *</label>
                    {formRefund.bukti ? (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--adm-success-weak)', border: '1px solid var(--adm-success-border)', borderRadius: 8, padding: '8px 12px', fontSize: 12, color: 'var(--adm-success)' }}>
                        ✓ Terupload
                        <button onClick={() => setFormRefund(f => ({ ...f, bukti: '' }))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--adm-danger)' }}>✕</button>
                      </div>
                    ) : (
                      <input type="file" accept=".jpg,.jpeg,.png,.pdf" onChange={handleUploadBuktiRefund} disabled={formRefund.uploading} style={{ fontSize: 12 }} />
                    )}
                    {formRefund.uploading && <p style={{ fontSize: 11, color: 'var(--adm-text-faint)', marginTop: 4 }}>Mengupload...</p>}
                  </div>
                </div>
                <button onClick={handleRefund} disabled={savingRefund || kelebihanBayar <= 0} style={{ padding: '9px 18px', background: 'var(--adm-warning)', color: 'var(--adm-text-invert)', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', opacity: savingRefund ? 0.6 : 1 }}>
                  {savingRefund ? 'Menyimpan...' : 'Kembalikan Dana'}
                </button>
              </fieldset>
            </div>
            )}

            {/* Alokasikan kelebihan bayar ke pembayaran sekolah lain — sama
                seperti refund, selalu tampil (nonaktif kalau tidak ada
                kelebihan bayar), uangnya TETAP di sekolah cuma dipindah
                peruntukannya (tidak pernah dianggap cicilan ataupun refund).
                BUKAN PermissionGate resource="pembayaran" — sama seperti
                refund di atas, ini tetap khusus Admin Keuangan/Super Admin. */}
            {bolehVerifikasiKeuangan && (
            <div style={{ background: kelebihanBayar > 0 ? 'var(--adm-ungu-weak)' : 'var(--adm-neutral-weak)', border: `1px solid ${kelebihanBayar > 0 ? 'var(--adm-ungu-weak)' : 'var(--adm-border)'}`, borderRadius: 14, padding: 20 }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: kelebihanBayar > 0 ? 'var(--adm-ungu)' : 'var(--adm-text-faint)', marginBottom: 4 }}>⇄ Alokasikan Kelebihan Bayar</h3>
              <p style={{ fontSize: 12, color: 'var(--adm-text-muted)', marginBottom: 14 }}>
                {kelebihanBayar > 0
                  ? <>Kelebihan bayar saat ini: <strong style={{ color: 'var(--adm-ungu)' }}>{formatRupiah(kelebihanBayar)}</strong> — bisa dialihkan untuk pembayaran sekolah lain (SPP, uang pangkal, dst) tanpa dikembalikan tunai.</>
                  : 'Tidak ada kelebihan bayar saat ini — form ini aktif lagi begitu ada kelebihan bayar.'}
              </p>
              <fieldset disabled={kelebihanBayar <= 0} style={{ border: 'none', padding: 0, margin: 0, opacity: kelebihanBayar <= 0 ? 0.5 : 1 }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginBottom: 12 }}>
                  <div>
                    <label style={lbl}>Jenis Pembayaran</label>
                    <select value={formAlokasi.kategori} onChange={e => setFormAlokasi(f => ({ ...f, kategori: e.target.value }))} style={{ width: '100%', padding: '9px 12px', border: '1.5px solid var(--adm-border-strong)', borderRadius: 8, fontSize: 13, fontFamily: 'inherit' }}>
                      <option value="">Pilih...</option>
                      {KATEGORI_ALOKASI.map(k => <option key={k} value={k}>{k}</option>)}
                    </select>
                  </div>
                  {formAlokasi.kategori === 'Lainnya' && (
                    <div>
                      <label style={lbl}>Jenis Pembayaran Lainnya</label>
                      <input type="text" value={formAlokasi.kategoriLainnya} onChange={e => setFormAlokasi(f => ({ ...f, kategoriLainnya: e.target.value }))} placeholder="Contoh: Uang Study Tour" style={{ width: '100%', padding: '9px 12px', border: '1.5px solid var(--adm-border-strong)', borderRadius: 8, fontSize: 13, fontFamily: 'inherit' }} />
                    </div>
                  )}
                  <div>
                    <label style={lbl}>Nominal Dialokasikan</label>
                    <input
                      type="text" inputMode="numeric"
                      value={formAlokasi.nominal ? Number(formAlokasi.nominal.replace(/[^\d]/g, '')).toLocaleString('id-ID') : ''}
                      onChange={e => setFormAlokasi(f => ({ ...f, nominal: e.target.value.replace(/[^\d]/g, '') }))}
                      placeholder={kelebihanBayar > 0 ? `Maks. ${kelebihanBayar.toLocaleString('id-ID')}` : '-'}
                      style={{ width: '100%', padding: '9px 12px', border: '1.5px solid var(--adm-border-strong)', borderRadius: 8, fontSize: 13, fontFamily: 'inherit' }}
                    />
                  </div>
                  <div>
                    <label style={lbl}>Keterangan (opsional)</label>
                    <input type="text" value={formAlokasi.keterangan} onChange={e => setFormAlokasi(f => ({ ...f, keterangan: e.target.value }))} placeholder="Catatan tambahan" style={{ width: '100%', padding: '9px 12px', border: '1.5px solid var(--adm-border-strong)', borderRadius: 8, fontSize: 13, fontFamily: 'inherit' }} />
                  </div>
                </div>
                <button onClick={handleAlokasi} disabled={savingAlokasi || kelebihanBayar <= 0} style={{ padding: '9px 18px', background: 'var(--adm-ungu)', color: 'var(--adm-text-invert)', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', opacity: savingAlokasi ? 0.6 : 1 }}>
                  {savingAlokasi ? 'Menyimpan...' : 'Alokasikan Pembayaran'}
                </button>
              </fieldset>
            </div>
            )}

            {/* Ringkasan keuangan — SATU sumber data (hitungRingkasan atas
                data.pembayaranList dari server), semua angka SELALU tampil
                (bukan disembunyikan saat 0) supaya admin bisa lihat postur
                lengkapnya: Total Pembayaran - Total Alokasi - Total Refund
                = Saldo/Kelebihan Tersedia. */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 }}>
              <div style={{ background: 'var(--adm-surface)', borderRadius: 12, padding: 16, border: '1px solid var(--adm-border)' }}>
                <div style={lbl}>TOTAL TAGIHAN</div>
                <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--adm-text)' }}>{formatRupiah(totalTagihan)}</div>
              </div>
              <div style={{ background: 'var(--adm-success-weak)', borderRadius: 12, padding: 16, border: '1px solid var(--adm-success-weak)' }}>
                <div style={{ ...lbl, color: 'var(--adm-success)' }}>TOTAL PEMBAYARAN (CICILAN)</div>
                <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--adm-success)' }}>{formatRupiah(totalBayar)}</div>
              </div>
              <div style={{ background: 'var(--adm-warning-weak)', borderRadius: 12, padding: 16, border: '1px solid var(--adm-warning-border)' }}>
                <div style={{ ...lbl, color: 'var(--adm-warning)' }}>TOTAL REFUND</div>
                <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--adm-warning)' }}>{formatRupiah(totalRefund)}</div>
              </div>
              <div style={{ background: 'var(--adm-ungu-weak)', borderRadius: 12, padding: 16, border: '1px solid var(--adm-ungu-weak)' }}>
                <div style={{ ...lbl, color: 'var(--adm-ungu)' }}>TOTAL ALOKASI</div>
                <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--adm-ungu)' }}>{formatRupiah(totalAlokasi)}</div>
              </div>
              <div style={{ background: kelebihanBayar > 0 ? 'var(--adm-info-weak)' : 'var(--adm-neutral-weak)', borderRadius: 12, padding: 16, border: `1px solid ${kelebihanBayar > 0 ? 'var(--adm-info-border)' : 'var(--adm-border)'}` }}>
                <div style={{ ...lbl, color: kelebihanBayar > 0 ? 'var(--adm-info)' : 'var(--adm-text-faint)' }}>SALDO/KELEBIHAN TERSEDIA</div>
                <div style={{ fontSize: 20, fontWeight: 700, color: kelebihanBayar > 0 ? 'var(--adm-info)' : 'var(--adm-text-muted)' }}>{formatRupiah(kelebihanBayar)}</div>
              </div>
              <div style={{ background: (totalTagihan > 0 && sisaBayar <= 0) ? 'var(--adm-success-weak)' : 'var(--adm-warning-weak)', borderRadius: 12, padding: 16, border: `1px solid ${(totalTagihan > 0 && sisaBayar <= 0) ? 'var(--adm-success-weak)' : 'var(--adm-warning-border)'}` }}>
                <div style={{ ...lbl, color: (totalTagihan > 0 && sisaBayar <= 0) ? 'var(--adm-success)' : 'var(--adm-warning)' }}>{(totalTagihan > 0 && sisaBayar <= 0) ? 'STATUS' : 'KURANG BAYAR'}</div>
                <div style={{ fontSize: 20, fontWeight: 700, color: (totalTagihan > 0 && sisaBayar <= 0) ? 'var(--adm-success)' : 'var(--adm-warning)' }}>{totalTagihan === 0 ? 'Belum Ada Tagihan' : (sisaBayar <= 0 ? 'Lunas' : formatRupiah(sisaBayar))}</div>
              </div>
            </div>

            {data.gelombang && (
              <p style={{ fontSize: 12, color: 'var(--adm-text-muted)' }}>Gelombang saat mendaftar: <strong style={{ color: 'var(--adm-secondary)' }}>{data.gelombang}</strong></p>
            )}

            <div style={{ background: 'var(--adm-surface)', borderRadius: 14, border: '1px solid var(--adm-border)', overflow: 'hidden' }}>
              <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--adm-border)' }}>
                <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--adm-text)' }}>Riwayat Cicilan Pembayaran</h3>
              </div>
              {data.pembayaranList.length === 0 ? (
                <div style={{ padding: 40, textAlign: 'center', color: 'var(--adm-text-faint)', fontSize: 13 }}>Belum ada pembayaran masuk</div>
              ) : (
                data.pembayaranList.map((c, i) => {
                  const isRefund = c.jenis === 'refund';
                  const isAlokasi = c.jenis === 'alokasi';
                  const csc = isAlokasi && c.status === 'lunas'
                    ? { label: 'Dialokasikan', color: 'var(--adm-ungu)', bg: 'var(--adm-ungu-weak)' }
                    : isRefund && c.status === 'lunas'
                    ? { label: 'Dikembalikan', color: 'var(--adm-warning)', bg: 'var(--adm-warning-weak)' }
                    : (STATUS_CICILAN[c.status] || STATUS_CICILAN['menunggu_verifikasi']);
                  const warna = isRefund ? 'var(--adm-warning)' : isAlokasi ? 'var(--adm-ungu)' : 'var(--adm-text)';
                  return (
                    <div key={c.id} style={{ padding: '16px 20px', borderTop: i === 0 ? 'none' : '1px solid var(--adm-text-faint)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, background: isRefund ? 'var(--adm-warning-weak)' : isAlokasi ? 'var(--adm-info-weak)' : undefined }}>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: warna }}>
                          {isRefund
                            ? `↩ Refund ke-${c.angsuranKe} — ${formatRupiah(c.nominal)}`
                            : isAlokasi
                            ? `⇄ Alokasi ke-${c.angsuranKe} (${c.kategoriAlokasi || 'Lainnya'}) — ${formatRupiah(c.nominal)}`
                            : `Cicilan ke-${c.angsuranKe} — ${formatRupiah(c.nominal)}`}
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--adm-text-muted)', marginTop: 2 }}>
                          {new Date(c.tanggalBayar).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                          {!isAlokasi && ` · ${c.metodePembayaran}`}
                          {c.bankPengirim && ` · ${c.bankPengirim} a.n. ${c.namaPengirim}`}
                          {isRefund && c.alasanRefund && ` · Alasan: ${c.alasanRefund}`}
                          {isAlokasi && c.catatanAdmin && ` · ${c.catatanAdmin}`}
                        </div>
                        {c.status === 'ditolak' && c.catatanAdmin && <div style={{ fontSize: 12, color: 'var(--adm-danger)', marginTop: 4 }}>Catatan: {c.catatanAdmin}</div>}
                        {c.buktiPembayaran && (
                          <a href={c.buktiPembayaran} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: 'var(--adm-secondary)', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 4, marginTop: 4 }}>
                            Lihat bukti <ExternalLink size={11} />
                          </a>
                        )}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        <span style={{ background: csc.bg, color: csc.color, padding: '4px 12px', borderRadius: 14, fontSize: 11, fontWeight: 700 }}>{csc.label}</span>
                        {/* Sama seperti antrean di /admin/pembayaran: menerima/
                            menolak cicilan adalah verifikasi keuangan, khusus
                            Admin Keuangan & Super Admin — bukan Admin SPMB,
                            walau mereka boleh MENCATAT cicilan baru di atas. */}
                        {c.status === 'menunggu_verifikasi' && bolehVerifikasiKeuangan && (
                          <>
                            <button onClick={() => handleVerifikasiCicilan(c, 'lunas')} style={{ padding: '6px 12px', background: 'var(--adm-success)', color: 'var(--adm-text-invert)', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>Verifikasi</button>
                            <button onClick={() => handleVerifikasiCicilan(c, 'ditolak')} style={{ padding: '6px 12px', background: 'var(--adm-danger-weak)', color: 'var(--adm-danger)', border: '1px solid var(--adm-danger-border)', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>Tolak</button>
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

      {/* Modal konfirmasi status — 2 langkah (pilih status dulu, lalu di
          sinilah pesan/alasannya ditulis) supaya siswa tidak pernah menerima
          notifikasi tanpa admin sempat melihat/menyunting pesannya. */}
      {statusModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }} onClick={() => !savingStatus && setStatusModal(null)}>
          <div style={{ background: 'var(--adm-surface)', borderRadius: 16, width: '100%', maxWidth: 480, maxHeight: '88vh', overflow: 'auto' }} onClick={e => e.stopPropagation()}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--adm-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: 14.5, fontWeight: 700, color: 'var(--adm-text)' }}>
                {statusModal.status === 'ditolak' ? 'Tolak Berkas' : 'Terima Berkas'} — {data.namaLengkap}
              </h3>
              <button onClick={() => setStatusModal(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--adm-text-faint)' }}><XIcon size={18} /></button>
            </div>
            <div style={{ padding: '18px 20px' }}>
              {statusModal.status === 'ditolak' ? (
                <div style={{ background: 'var(--adm-warning-weak)', borderRadius: 10, padding: 14, border: '1px solid var(--adm-warning-border)' }}>
                  <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--adm-warning)', display: 'block', marginBottom: 8 }}>Alasan penolakan (dikirim ke siswa) *</label>
                  <textarea
                    autoFocus
                    style={{ width: '100%', minHeight: 120, padding: '9px 12px', border: '1.5px solid var(--adm-border-strong)', borderRadius: 8, fontSize: 13, fontFamily: 'inherit', resize: 'vertical' }}
                    value={statusModal.alasan}
                    onChange={e => setStatusModal(m => m && { ...m, alasan: e.target.value })}
                    placeholder="Contoh: Scan Kartu Keluarga tidak terbaca, mohon unggah ulang."
                  />
                </div>
              ) : (
                <div style={{ background: 'var(--adm-success-weak)', borderRadius: 10, padding: 14, border: '1px solid var(--adm-success-border)' }}>
                  <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--adm-success)', display: 'block', marginBottom: 8 }}>Pesan untuk siswa (tampil di dashboard)</label>
                  <textarea
                    autoFocus
                    style={{ width: '100%', minHeight: 120, padding: '9px 12px', border: '1.5px solid var(--adm-border-strong)', borderRadius: 8, fontSize: 13, fontFamily: 'inherit', resize: 'vertical' }}
                    value={statusModal.pesan}
                    onChange={e => setStatusModal(m => m && { ...m, pesan: e.target.value })}
                    placeholder="Selamat! Berkas Anda diterima. Silakan tunggu informasi daftar ulang..."
                  />
                </div>
              )}
            </div>
            <div style={{ display: 'flex', gap: 8, padding: '14px 20px', borderTop: '1px solid var(--adm-border)' }}>
              <button onClick={() => setStatusModal(null)} disabled={savingStatus} style={{ flex: 1, padding: '10px', background: 'var(--adm-neutral-weak)', border: '1px solid var(--adm-border)', borderRadius: 8, color: 'var(--adm-text)', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                Batal
              </button>
              <button
                onClick={handleKirimStatus}
                disabled={savingStatus}
                style={{ flex: 1, padding: '10px', background: statusModal.status === 'ditolak' ? 'var(--adm-danger)' : 'var(--adm-success)', border: 'none', borderRadius: 8, color: 'var(--adm-text-invert)', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', opacity: savingStatus ? 0.7 : 1 }}>
                {savingStatus ? 'Mengirim...' : 'Simpan & Kirim'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
