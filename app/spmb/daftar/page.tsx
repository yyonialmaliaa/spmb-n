'use client';
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { GraduationCap, ChevronRight, ChevronLeft, CheckCircle, Upload, X, Loader } from 'lucide-react';
import Image from 'next/image';
import { JENJANG_LABEL, Jenjang } from '@/lib/biaya';
import { getKelasMasukOptions, getKelasMasukBaru, pecahKelasHarga, labelTier, filterKelasByTingkat } from '@/lib/kelas';
import { Suspense, useRef } from 'react';
import FormAlertModal, { AlertModalState } from '@/components/spmb/FormAlertModal';

type HargaRow = { id: string; jenjang: string; jurusan: string; kelas: string; nominal: number; urutan: number };

const AGAMA_OPTIONS = ['Islam', 'Kristen Protestan', 'Kristen Katolik', 'Hindu', 'Budha', 'Konghucu', 'Lainnya'];
const GOLDAR_OPTIONS = ['A', 'B', 'AB', 'O', 'Tidak Tahu'];
const SERAGAM_OPTIONS = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
const PENDIDIKAN_OPTIONS = ['Belum/Tidak Sekolah', 'SD/MI', 'SMP/MTs', 'SMA/SMK', 'D1', 'D2', 'D3', 'S1', 'S2', 'S3'];
const STEPS = ['Ketentuan', 'Data Pribadi', 'Data Orang Tua', 'Data Akademik', 'Upload Berkas', 'Konfirmasi'];


type FormData = {
  namaLengkap: string; namaPanggilan: string;
  tempatLahir: string; tanggalLahir: string;
  jenisKelamin: string; agama: string; agamaLainnya: string; anakKe: string;
  alamat: string; rt: string; rw: string;
  kelurahan: string; kecamatan: string; kabupaten: string;
  beratBadan: string; tinggiBadan: string; golonganDarah: string;
  nisn: string; nik: string; noPribadi: string; ukuranSeragam: string;
  namaPemberiReferensi: string; noHpReferensi: string;
  asalSD: string; asalSMP: string; jurusan: string; kelas: string;
  tipePendaftaran: string; kelasMasuk: string; alumniSmpCitraNegara: string;
  namaAyah: string; ttlAyah: string; pendidikanAyah: string; pekerjaanAyah: string; penghasilanAyah: string; noHpAyah: string; alamatAyah: string;
  namaIbu: string; ttlIbu: string; pendidikanIbu: string; pekerjaanIbu: string; penghasilanIbu: string; noHpIbu: string; alamatIbu: string;
  namaWali: string; ttlWali: string; pendidikanWali: string; pekerjaanWali: string; penghasilanWali: string; noHpWali: string; alamatWali: string;
};

const INITIAL: FormData = {
  namaLengkap: '', namaPanggilan: '', tempatLahir: '', tanggalLahir: '',
  jenisKelamin: '', agama: '', agamaLainnya: '', anakKe: '', alamat: '', rt: '', rw: '',
  kelurahan: '', kecamatan: '', kabupaten: '', beratBadan: '', tinggiBadan: '',
  golonganDarah: '', nisn: '', nik: '', noPribadi: '', ukuranSeragam: '',
  namaPemberiReferensi: '', noHpReferensi: '', asalSD: '', asalSMP: '', jurusan: '', kelas: '',
  tipePendaftaran: 'baru', kelasMasuk: '', alumniSmpCitraNegara: '',
  namaAyah: '', ttlAyah: '', pendidikanAyah: '', pekerjaanAyah: '', penghasilanAyah: '', noHpAyah: '', alamatAyah: '',
  namaIbu: '', ttlIbu: '', pendidikanIbu: '', pekerjaanIbu: '', penghasilanIbu: '', noHpIbu: '', alamatIbu: '',
  namaWali: '', ttlWali: '', pendidikanWali: '', pekerjaanWali: '', penghasilanWali: '', noHpWali: '', alamatWali: '',
};

type FileItem = { file: File | null; path: string; uploading: boolean; error: string };
type FilesState = { ijazah: FileItem; akte: FileItem; kk: FileItem; ktpOrtu: FileItem; kip: FileItem; foto: FileItem };
const emptyFile = (): FileItem => ({ file: null, path: '', uploading: false, error: '' });

// Isi form dari data draft yang sudah tersimpan di server (lanjutkan formulir
// yang belum dikirim) — hanya menimpa field yang memang ada di FormData.
function mapRecordToForm(d: Record<string, unknown>): FormData {
  const next = { ...INITIAL } as Record<string, string>;
  for (const key of Object.keys(INITIAL)) {
    if (key === 'agamaLainnya' || key === 'alumniSmpCitraNegara') continue;
    const val = d[key];
    if (typeof val === 'string' && val !== '') next[key] = val;
  }
  if (typeof d.agama === 'string' && d.agama && !AGAMA_OPTIONS.includes(d.agama)) {
    next.agama = 'Lainnya';
    next.agamaLainnya = d.agama;
  }
  if (next.jurusan === '-') next.jurusan = '';
  if (typeof d.alumniSmpCitraNegara === 'boolean') {
    next.alumniSmpCitraNegara = d.alumniSmpCitraNegara ? 'ya' : 'tidak';
  }
  return next as unknown as FormData;
}

const FILE_FIELDS = [
  { key: 'ijazah' as keyof FilesState, label: 'Ijazah atau Surat Keterangan Lulus (SKL) yang telah dilegalisir', required: true },
  { key: 'akte' as keyof FilesState, label: 'Akte Kelahiran / Surat Keterangan Lahir', required: true },
  { key: 'kk' as keyof FilesState, label: 'Kartu Keluarga', required: true },
  { key: 'ktpOrtu' as keyof FilesState, label: 'KTP Ayah dan Ibu', required: true },
  { key: 'kip' as keyof FilesState, label: 'KIP/PKH/KKS/DTKS/SKTM (Jika Ada)', required: false },
  { key: 'foto' as keyof FilesState, label: 'Pas Photo Siswa Ukuran 3x4 (Kode Warna #0000FF)', required: true },
];

export default function DaftarPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9CA3AF' }}>Memuat...</div>}>
      <DaftarPageInner />
    </Suspense>
  );
}

function DaftarPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [jenjang, setJenjang] = useState<Jenjang>(() => {
    const p = (searchParams.get('jenjang') || 'smk').toLowerCase();
    return (['smp', 'sma', 'smk'].includes(p) ? p : 'smk') as Jenjang;
  });
  const isSMK = jenjang === 'smk';
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormData>(INITIAL);
  const [punyaWali, setPunyaWali] = useState(false);
  const [seragamCustom, setSeragamCustom] = useState(false);
  const [files, setFiles] = useState<FilesState>({
    ijazah: emptyFile(), akte: emptyFile(), kk: emptyFile(),
    ktpOrtu: emptyFile(), kip: emptyFile(), foto: emptyFile(),
  });
  const [jenisIjazah, setJenisIjazah] = useState<'ijazah' | 'skl'>('ijazah');
  const [setuju, setSetuju] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [alertModal, setAlertModal] = useState<AlertModalState>(null);
  const afterAlertCloseRef = useRef<(() => void) | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [pendaftaranId, setPendaftaranId] = useState<string | null>(null);
  const [hargaOptions, setHargaOptions] = useState<HargaRow[]>([]);

  // Jurusan/kelas SELALU diambil dari Panel Harga admin (/api/harga) — tidak
  // ada daftar jurusan/kelas hardcoded di sini, supaya perubahan admin di
  // Panel Harga langsung tercermin di formulir pendaftaran.
  useEffect(() => {
    fetch(`/api/harga?jenjang=${jenjang}`).then(r => r.json()).then(d => setHargaOptions(d.data || [])).catch(() => setHargaOptions([]));
  }, [jenjang]);

  const jurusanOptions = [...new Set(hargaOptions.filter(h => h.jenjang === jenjang).map(h => h.jurusan))];
  const kelasOptionsUntuk = (jurusan: string) => hargaOptions.filter(h => h.jenjang === jenjang && h.jurusan === jurusan).map(h => h.kelas);

  useEffect(() => {
    fetch('/api/auth/me').then(r => r.json()).then(d => {
      if (!d.user) { router.push('/login'); return; }
      setAuthChecked(true);
    });
    fetch('/api/pendaftaran').then(r => r.json()).then(d => {
      if (!d.data) return;
      // Formulir yang sudah dikirim/diproses tidak lagi ditangani di halaman
      // ini — draft yang belum dikirim dilanjutkan di sini apa adanya.
      if (d.data.status !== 'draft') { router.push('/dashboard'); return; }

      setPendaftaranId(d.data.id);
      setJenjang((['smp', 'sma', 'smk'].includes(d.data.jenjang) ? d.data.jenjang : 'smk') as Jenjang);
      setForm(mapRecordToForm(d.data));
      // Lanjutkan dari halaman formulir terakhir yang diedit, bukan balik ke
      // Ketentuan Pendaftaran (step 0) — draft lama tanpa lastStep tersimpan
      // (dibuat sebelum fitur ini ada) tetap aman, default-nya 0.
      if (typeof d.data.lastStep === 'number') {
        setStep(Math.min(Math.max(d.data.lastStep, 0), STEPS.length - 1));
      }
      setJenisIjazah(d.data.jenisIjazah === 'skl' ? 'skl' : 'ijazah');
      setFiles({
        ijazah: d.data.fileIjazah ? { file: null, path: d.data.fileIjazah, uploading: false, error: '' } : emptyFile(),
        akte: d.data.fileAkte ? { file: null, path: d.data.fileAkte, uploading: false, error: '' } : emptyFile(),
        kk: d.data.fileKK ? { file: null, path: d.data.fileKK, uploading: false, error: '' } : emptyFile(),
        ktpOrtu: d.data.fileKtpOrtu ? { file: null, path: d.data.fileKtpOrtu, uploading: false, error: '' } : emptyFile(),
        kip: d.data.fileKip ? { file: null, path: d.data.fileKip, uploading: false, error: '' } : emptyFile(),
        foto: d.data.fileFoto ? { file: null, path: d.data.fileFoto, uploading: false, error: '' } : emptyFile(),
      });
      if (d.data.namaWali || d.data.ttlWali || d.data.pekerjaanWali) setPunyaWali(true);
    });
  }, [router]);

  // Tingkat (Kelas Masuk) HANYA ditanya sekali ke pengguna — untuk pindahan
  // dari field "Kelas Masuk", untuk baru selalu tingkat awal jenjang. Dropdown
  // "Kelas" di bawah cuma menanyakan tier (Reguler/Plus) untuk tingkat itu,
  // supaya tidak ada dua pertanyaan "kelas berapa" yang bisa saling bertentangan.
  useEffect(() => {
    const filterJurusan = isSMK ? form.jurusan : '-';
    const tingkat = form.tipePendaftaran === 'pindahan' ? form.kelasMasuk : getKelasMasukBaru(jenjang);
    const semua = kelasOptionsUntuk(filterJurusan);
    const opts = tingkat ? filterKelasByTingkat(semua.map(k => ({ kelas: k })), tingkat).map(o => o.kelas) : [];
    // Hanya bertindak kalau katalog untuk jenjang/jurusan/tingkat SAAT INI
    // benar-benar sudah termuat (opts.length > 0). Kalau masih 0, JANGAN
    // kosongkan form.kelas — kemungkinan besar hargaOptions belum selesai
    // di-refetch untuk jenjang yang baru (mis. setelah draft dimuat & jenjang
    // dikoreksi dari default), bukan berarti pilihan yang tersimpan salah.
    // Efek ini akan jalan lagi begitu hargaOptions yang benar datang.
    if (opts.length > 0 && !opts.includes(form.kelas)) {
      const preferReguler = opts.find(k => pecahKelasHarga(k).tier === 'REGULER');
      setForm(f => ({ ...f, kelas: preferReguler || opts[0] }));
    }
  }, [form.jurusan, form.tipePendaftaran, form.kelasMasuk, hargaOptions, jenjang]);

  const set = (k: keyof FormData) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  // Render blok field Ayah/Ibu/Wali — dipakai 3x (responsive: 1 kolom di HP, multi kolom di desktop)
  const ORTU_FIELD_DEFS: { base: string; label: string; ph?: string; isSelect?: boolean; textarea?: boolean; filter?: (v: string) => string }[] = [
    { base: 'nama', label: 'Nama Lengkap', ph: 'Nama lengkap', filter: (v: string) => v.replace(/[^a-zA-Z\s]/g, '') },
    { base: 'ttl', label: 'Tempat, Tgl Lahir', ph: 'Bandung, 17 Juni 1980' },
    { base: 'pendidikan', label: 'Pendidikan', isSelect: true },
    { base: 'pekerjaan', label: 'Pekerjaan', ph: 'Pekerjaan', filter: (v: string) => v.replace(/[^a-zA-Z\s]/g, '') },
    { base: 'penghasilan', label: 'Penghasilan/bulan', ph: 'Rp', filter: (v: string) => v.replace(/[^a-zA-Z0-9,\.]/g, '') },
    { base: 'noHp', label: 'No. Handphone', ph: '08xx', filter: (v: string) => v.replace(/[^\d\s+]/g, '') },
    { base: 'alamat', label: 'Alamat', ph: 'Alamat lengkap', textarea: true },
  ];

  const renderOrtuBlock = (role: 'Ayah' | 'Ibu' | 'Wali') => (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
      {ORTU_FIELD_DEFS.map(f => {
        const key = (f.base + role) as keyof FormData;
        return (
          <div key={key} style={f.textarea ? { gridColumn: '1 / -1' } : undefined}>
            <label style={lbl}>{f.label}</label>
            {f.isSelect ? (
              <select style={inp} value={form[key]} onChange={set(key)} onFocus={onFocus} onBlur={onBlur}>
                <option value="">Pilih...</option>
                {PENDIDIKAN_OPTIONS.map(p => <option key={p}>{p}</option>)}
              </select>
            ) : f.textarea ? (
              <textarea style={{ ...inp, minHeight: 70, resize: 'vertical' }} value={form[key]} onChange={e => setForm(prev => ({ ...prev, [key]: e.target.value }))} placeholder={f.ph} onFocus={onFocus} onBlur={onBlur} />
            ) : (
              <input
                style={inp}
                value={form[key]}
                onChange={e => {
                  const val = f.filter ? f.filter(e.target.value) : e.target.value;
                  setForm(prev => ({ ...prev, [key]: val }));
                }}
                placeholder={f.ph}
                onFocus={onFocus}
                onBlur={onBlur}
              />
            )}
          </div>
        );
      })}
    </div>
  );

  const handleFileChange = async (key: keyof FilesState, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      setFiles(f => ({ ...f, [key]: { ...f[key], error: 'Ukuran file maksimal 2MB' } }));
      return;
    }
    setFiles(f => ({ ...f, [key]: { file, path: '', uploading: true, error: '' } }));
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('fieldName', key);
      const res = await fetch('/api/upload', { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok) {
        setFiles(f => ({ ...f, [key]: { file, path: '', uploading: false, error: data.error } }));
        return;
      }
      setFiles(f => ({ ...f, [key]: { file, path: data.path, uploading: false, error: '' } }));
    } catch {
      setFiles(f => ({ ...f, [key]: { file, path: '', uploading: false, error: 'Gagal upload, coba lagi' } }));
    }
  };

  const removeFile = (key: keyof FilesState) => setFiles(f => ({ ...f, [key]: emptyFile() }));

  // Menutup pop-up notifikasi. Kalau pop-up itu berkaitan dengan field
  // tertentu (focusId), arahkan pengguna kembali ke field tersebut setelah
  // ditutup. Kalau ada aksi lanjutan yang menunggu (mis. pindah halaman
  // setelah pop-up berhasil ditutup), jalankan aksi itu.
  const closeAlert = () => {
    const focusId = alertModal?.focusId;
    const after = afterAlertCloseRef.current;
    afterAlertCloseRef.current = null;
    setAlertModal(null);
    if (after) { after(); return; }
    if (focusId) {
      requestAnimationFrame(() => {
        const el = document.getElementById(focusId);
        el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        el?.focus();
      });
    }
  };

  const handleNext = () => {
    if (step === 0 && !setuju) { setAlertModal({ kind: 'warning', title: 'Periksa Data Anda', message: 'Anda perlu menyetujui ketentuan pendaftaran terlebih dahulu sebelum melanjutkan.', focusId: 'field-setuju' }); return; }
    if (step === 1 && !form.namaLengkap) { setAlertModal({ kind: 'error', message: 'Nama lengkap wajib diisi sebelum melanjutkan.', focusId: 'field-namaLengkap' }); return; }
    if (step === 1 && !form.jenisKelamin) { setAlertModal({ kind: 'error', message: 'Jenis kelamin wajib dipilih sebelum melanjutkan.', focusId: 'field-jenisKelamin' }); return; }
    if (step === 1 && !form.noPribadi) { setAlertModal({ kind: 'error', message: 'Nomor WhatsApp wajib diisi sebelum formulir dapat disimpan.', focusId: 'field-noPribadi' }); return; }
    if (step === 1 && !form.nik) { setAlertModal({ kind: 'error', message: 'NIK wajib diisi sebelum melanjutkan.', focusId: 'field-nik' }); return; }
    if (step === 1 && form.nik.length !== 16) { setAlertModal({ kind: 'error', message: 'NIK harus terdiri dari 16 digit.', focusId: 'field-nik' }); return; }
    if (step === 3 && !form.tipePendaftaran) { setAlertModal({ kind: 'error', message: 'Tipe pendaftaran wajib dipilih sebelum melanjutkan.', focusId: 'field-tipePendaftaran' }); return; }
    if (step === 3 && form.tipePendaftaran === 'pindahan' && !form.kelasMasuk) { setAlertModal({ kind: 'error', message: 'Kelas masuk wajib dipilih untuk pendaftaran pindahan.', focusId: 'field-kelasMasuk' }); return; }
    if (step === 3 && isSMK && !form.jurusan) { setAlertModal({ kind: 'error', message: 'Jurusan wajib dipilih sebelum melanjutkan.', focusId: 'field-jurusan' }); return; }
    if (step === 3 && !form.kelas) { setAlertModal({ kind: 'error', message: 'Kelas wajib dipilih sebelum melanjutkan.', focusId: 'field-kelas' }); return; }
    if (step === 3 && jenjang === 'smp' && !form.asalSD) { setAlertModal({ kind: 'error', message: 'Asal SD/MI wajib diisi sebelum melanjutkan.', focusId: 'field-asalSD' }); return; }
    if (step === 3 && jenjang !== 'smp' && !form.asalSMP) { setAlertModal({ kind: 'error', message: 'Asal SMP/MTs wajib diisi sebelum melanjutkan.', focusId: 'field-asalSMP' }); return; }
    if (step === 3 && jenjang !== 'smp' && !form.alumniSmpCitraNegara) { setAlertModal({ kind: 'error', message: 'Mohon jawab pertanyaan alumni SMP Citra Negara terlebih dahulu.', focusId: 'field-alumniSmp' }); return; }
    if (step === 4) {
      const missing = FILE_FIELDS.filter(f => f.required && !files[f.key].path);
      if (missing.length > 0) { setAlertModal({ kind: 'error', title: 'Berkas Belum Lengkap', message: `Masih ada berkas wajib yang belum diupload: ${missing.map(m => m.label.split(' ').slice(0,2).join(' ')).join(', ')}.`, focusId: `file-${missing[0].key}` }); return; }
      if (FILE_FIELDS.some(f => files[f.key].uploading)) { setAlertModal({ kind: 'info', title: 'Mohon Tunggu', message: 'Proses upload berkas masih berlangsung, silakan tunggu sebentar.' }); return; }
    }
    setStep(s => s + 1);
  };

  const buildPayload = () => ({
    ...form,
    jenjang,
    jurusan: isSMK ? form.jurusan : '-',
    agama: form.agama === 'Lainnya' ? (form.agamaLainnya || 'Lainnya') : form.agama,
    jenisIjazah,
    // Halaman wizard terakhir yang sedang diedit — supaya begitu draft ini
    // dibuka lagi, pengguna lanjut dari sini, bukan balik ke Ketentuan
    // Pendaftaran (step 0).
    lastStep: step,
    alumniSmpCitraNegara: jenjang === 'smp' ? null : form.alumniSmpCitraNegara === 'ya',
    ttl: `${form.tempatLahir}, ${form.tanggalLahir}`,
    namaOrtu: form.namaAyah || form.namaIbu || form.namaWali,
    noOrtu: form.noHpAyah || form.noHpIbu || form.noHpWali,
    fileIjazah: files.ijazah.path || null,
    fileAkte: files.akte.path || null,
    fileKK: files.kk.path || null,
    fileKtpOrtu: files.ktpOrtu.path || null,
    fileKip: files.kip.path || null,
    fileFoto: files.foto.path || null,
  });

  // Simpan Sementara — boleh dipanggil kapan saja, dengan data sekadarnya
  // sekalipun, tanpa validasi. Formulir tetap berstatus draft/belum dikirim.
  const handleSaveDraft = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/pendaftaran', {
        method: pendaftaranId ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildPayload()),
      });
      const data = await res.json();
      if (!res.ok) { setAlertModal({ kind: 'error', title: 'Gagal Menyimpan', message: data.error || 'Data gagal disimpan, silakan coba lagi.' }); setSaving(false); return; }
      setPendaftaranId(data.data.id);
      setAlertModal({ kind: 'success', title: 'Data Berhasil Disimpan', message: 'Perubahan formulir Anda telah tersimpan.' });
    } catch {
      setAlertModal({ kind: 'error', title: 'Gagal Menyimpan', message: 'Terjadi kesalahan jaringan, silakan coba lagi.' });
    } finally {
      setSaving(false);
    }
  };

  // Selesai isi formulir -> simpan draft terakhir kali, lalu lanjut ke
  // dashboard untuk pembayaran. Formulir BELUM masuk ke admin di sini —
  // baru masuk setelah "Kirim Formulir" di dashboard (syarat: sudah bayar
  // minimal uang pendaftaran).
  const handleFinishAndGoToPayment = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/pendaftaran', {
        method: pendaftaranId ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildPayload()),
      });
      const data = await res.json();
      if (!res.ok) { setAlertModal({ kind: 'error', title: 'Gagal Menyimpan', message: data.error || 'Data gagal disimpan, silakan coba lagi.' }); setLoading(false); return; }
      afterAlertCloseRef.current = () => router.push('/dashboard');
      setAlertModal({ kind: 'success', title: 'Data Berhasil Disimpan', message: 'Formulir Anda telah tersimpan. Selanjutnya Anda akan diarahkan ke halaman pembayaran.' });
    } catch {
      setAlertModal({ kind: 'error', title: 'Gagal Menyimpan', message: 'Terjadi kesalahan jaringan, silakan coba lagi.' });
      setLoading(false);
    }
  };

  if (!authChecked) return null;

  const inp: React.CSSProperties = { width: '100%', padding: '9px 12px', border: '1.5px solid #D1D5DB', borderRadius: 8, fontSize: 13, fontFamily: 'inherit', background: 'white', color: '#0A1628', outline: 'none' };
  const lbl: React.CSSProperties = { fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 5 };
  const grid2: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 };
  const grid3: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 16 };
  const onFocus = (e: React.FocusEvent<any>) => (e.target.style.borderColor = '#C8973A');
  const onBlur = (e: React.FocusEvent<any>) => (e.target.style.borderColor = '#D1D5DB');

  return (
    <div style={{ minHeight: '100vh', background: '#FAF7F0' }}>
      <header style={{ background: 'linear-gradient(180deg, #123524 0%, #0B2A1C 100%)', borderBottom: '2px solid #C8973A', padding: '0 24px' }}>
        <div className="form-header-inner" style={{ maxWidth: 900, margin: '0 auto', display: 'flex', alignItems: 'center', height: 64 }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
            <div style={{ width: 36, height: 36, borderRadius: 8, overflow: 'hidden', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Image src="/images/logo.png" alt="Logo SMK Citra Negara" width={35} height={35} style={{ objectFit: 'cover' }} />
            </div>
            <span className="form-header-title" style={{ color: 'white', fontWeight: 700, fontSize: 14 }}>Formulir SPMB 2026 — {JENJANG_LABEL[jenjang]} Citra Negara</span>
          </Link>
        </div>
      </header>

      <main className="form-shell-main" style={{ maxWidth: 900, margin: '0 auto', padding: '32px 24px' }}>
        {/* Steps */}
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 32, overflowX: 'auto', paddingBottom: 4 }}>
          {STEPS.map((s, i) => (
            <div key={s} style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{ width: 32, height: 32, borderRadius: '50%', background: i <= step ? 'linear-gradient(135deg,#C8973A,#E8B84B)' : '#E5E7EB', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 12, color: i <= step ? '#0A1628' : '#9CA3AF', marginBottom: 5 }}>
                  {i < step ? '✓' : i + 1}
                </div>
                <span style={{ fontSize: 10, fontWeight: i === step ? 700 : 400, color: i === step ? '#C8973A' : i < step ? '#0A1628' : '#9CA3AF', whiteSpace: 'nowrap' }}>{s}</span>
              </div>
              {i < STEPS.length - 1 && <div style={{ width: 32, height: 2, background: i < step ? '#C8973A' : '#E5E7EB', margin: '0 4px', marginBottom: 18, flexShrink: 0 }} />}
            </div>
          ))}
        </div>

        <div className="form-card" style={{ background: 'white', borderRadius: 20, padding: '32px 36px', boxShadow: '0 4px 30px rgba(10,22,40,0.08)', border: '1px solid #F0EBE0' }}>

          {/* STEP 0: KETENTUAN */}
          {step === 0 && (
           <div>
  <h2 className="font-display" style={{ fontSize: 22, color: '#0A1628', marginBottom: 6 }}>Ketentuan Pendaftaran</h2>
  <p style={{ color: '#6B7280', fontSize: 13, marginBottom: 20 }}>Baca dan setujui ketentuan berikut sebelum melanjutkan</p>
  <div className="form-terms-box" style={{ background: '#F8F9FA', borderRadius: 12, padding: 24, marginBottom: 24, maxHeight: 380, overflowY: 'auto', border: '1px solid #E5E7EB' }}>
    <p style={{ fontSize: 13, color: '#374151', lineHeight: 1.8, marginBottom: 16 }}>Menyatakan bahwa saya sangat menyadari dalam penyelenggaraan pendidikan di sekolah swasta sangat membutuhkan dukungan besar dan partisipasinya dari orang tua/wali peserta didik, maka dari itu saya:</p>
    {[
      'Sepenuh hati mempercayakan kepada SMK Citra Negara untuk memberikan pendidikan, pengajaran, dan pembinaan kepada putra/putri kami.',
      'Selama putra/putri saya menjadi peserta didik di SMK Citra Negara, saya mengizinkan untuk mengikuti seluruh agenda kegiatan yang diselenggarakan oleh sekolah.',
      'Bersedia memenuhi kewajiban-kewajiban sebagai orang tua/wali demi kelancaran proses pendidikan, pengajaran, dan pembinaan yang dilaksanakan oleh SMK Citra Negara.',
      'Bersedia dan sanggup memenuhi seluruh kewajiban pembayaran biaya pendidikan, seperti biaya PPDB, SPP, biaya Penilaian Tengah Semester (PTS), Penilaian Akhir Semester (PAS), Praktik Kerja Lapangan (PKL), kegiatan akhir tahun, dan biaya lainnya yang telah ditetapkan oleh Yayasan At-Taqwa Kemiri Jaya.',
      'Bersedia memenuhi seluruh biaya pendidikan secara tepat waktu demi kelancaran dan keberhasilan seluruh kegiatan di SMK Citra Negara, yaitu setiap tanggal 5 sampai dengan 10 setiap bulannya.',
      'Menyetujui bahwa apabila kewajiban yang berkaitan dengan keuangan sekolah belum dilunasi seluruhnya, maka saya belum berhak memperoleh administrasi penilaian putra/putri saya.',
      `Menyetujui bahwa apabila putra/putri saya membatalkan sekolah di SMK Citra Negara Tahun Pelajaran 2026/2027, maka seluruh biaya pendidikan yang telah dibayarkan tidak dapat ditarik kembali dengan alasan apa pun. Khusus bagi peserta didik yang diterima di sekolah negeri, biaya dapat dikembalikan sebesar 50% dengan ketentuan:<ul style="margin-top:8px;padding-left:20px;list-style-type:disc;display:flex;flex-direction:column;gap:4px;"><li>Minimal telah melakukan pembayaran sebesar Rp1.000.000;</li><li>Menyerahkan surat keterangan diterima di sekolah negeri;</li><li>Dibuktikan melalui Website Resmi PPDB Online dari dinas terkait;</li><li>Pengajuan dilakukan maksimal 3 (tiga) hari setelah pengumuman penerimaan sekolah negeri.</li></ul>`,
      'Pembayaran administrasi keuangan PPDB harus dilunasi sesuai gelombang pendaftaran. Apabila belum dilunasi, maka akan dikenakan biaya PPDB sesuai gelombang berikutnya.',
      'Menyetujui dan menerima ketentuan bahwa selama biaya PPDB masih dalam proses angsuran, status pendaftaran bersifat cadangan dan dapat tergeser oleh calon peserta didik yang telah melunasi pembayaran. Apabila sampai bulan Juli Tahun Pelajaran 2026/2027 belum melunasi seluruh pembiayaan, maka biaya akan berlaku normal tanpa potongan (diskon).',
      'Bersedia menerima hasil Tes dan seleksi administrasi keuangan, serta menerima segala keputusan yang ditetapkan oleh pihak SMK Citra Negara sebagai hasil akhir proses seleksi.',
    ].map((item, i) => (
      <div key={i} style={{ display: 'flex', gap: 12, marginBottom: 10, alignItems: 'flex-start' }}>
        <div style={{ width: 20, height: 20, borderRadius: '50%', background: '#0A1628', color: 'white', fontSize: 10, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 }}>{i + 1}</div>
        <p style={{ fontSize: 13, color: '#374151', lineHeight: 1.7, margin: 0 }} dangerouslySetInnerHTML={{ __html: item }} />
      </div>
    ))}
  </div>
  <label style={{ display: 'flex', alignItems: 'flex-start', gap: 12, cursor: 'pointer', padding: '14px 16px', background: setuju ? '#F0FDF4' : '#FFFBEB', borderRadius: 10, border: `1.5px solid ${setuju ? '#86EFAC' : '#FDE68A'}` }}>
    <input id="field-setuju" type="checkbox" checked={setuju} onChange={e => setSetuju(e.target.checked)} style={{ width: 18, height: 18, marginTop: 1, accentColor: '#C8973A' }} />
    <span style={{ fontSize: 13, color: '#374151', lineHeight: 1.6 }}>Saya telah membaca, memahami, dan <strong>menyetujui</strong> seluruh ketentuan pendaftaran di atas.</span>
  </label>
</div>
          )}

          {/* STEP 1: DATA PRIBADI */}
          {step === 1 && (
            <div>
              <h2 className="font-display" style={{ fontSize: 22, color: '#0A1628', marginBottom: 6 }}>Data Pribadi</h2>
              <p style={{ color: '#6B7280', fontSize: 13, marginBottom: 24 }}>Isi data pribadi calon peserta didik {JENJANG_LABEL[jenjang]} dengan lengkap</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={grid2}>
                  <div><label style={lbl}>Nama Lengkap *</label><input id="field-namaLengkap" style={inp} value={form.namaLengkap} onChange={set('namaLengkap')} placeholder="Sesuai akte/ijazah" onFocus={onFocus} onBlur={onBlur} /></div>
                  <div><label style={lbl}>Nama Panggilan</label><input style={inp} value={form.namaPanggilan} onChange={set('namaPanggilan')} placeholder="Nama sehari-hari" onFocus={onFocus} onBlur={onBlur} /></div>
                </div>
                <div style={grid2}>
                  <div><label style={lbl}>NISN</label><input style={inp} value={form.nisn} onChange={e => { const val = e.target.value.replace(/\D/g, ''); set('nisn')({ ...e, target: { ...e.target, value: val } }); }} placeholder="10 digit NISN" maxLength={10} onFocus={onFocus} onBlur={onBlur} /></div>
                  <div><label style={lbl}>No. WhatsApp Aktif *</label><input id="field-noPribadi" style={inp} type="tel" value={form.noPribadi} onChange={e => { const val = e.target.value.replace(/[^\d\s+]/g, ''); set('noPribadi')({ ...e, target: { ...e.target, value: val } }); }} placeholder="08xxxxxxxxxx" onFocus={onFocus} onBlur={onBlur} /><p style={{ fontSize: 11, color: '#9CA3AF', marginTop: 4 }}>Pastikan nomor WhatsApp ini aktif</p></div>
                </div>
                <div style={grid2}>
                  <div><label style={lbl}>Jenis Kelamin *</label>
                    <select id="field-jenisKelamin" style={inp} value={form.jenisKelamin} onChange={set('jenisKelamin')} onFocus={onFocus} onBlur={onBlur}>
                      <option value="">Pilih...</option><option>Laki-laki</option><option>Perempuan</option>
                    </select>
                  </div>
                  <div><label style={lbl}>Agama *</label>
                    <select style={inp} value={form.agama} onChange={set('agama')} onFocus={onFocus} onBlur={onBlur}>
                      <option value="">Pilih...</option>
                      {AGAMA_OPTIONS.map(a => <option key={a}>{a}</option>)}
                    </select>
                  </div>
                  {form.agama === 'Lainnya' && (
                    <div><label style={lbl}>Sebutkan Agama *</label><input style={inp} value={form.agamaLainnya} onChange={set('agamaLainnya')} placeholder="Sebutkan agama" onFocus={onFocus} onBlur={onBlur} /></div>
                  )}
                </div>
                <div style={grid2}>
                  <div><label style={lbl}>Tempat Lahir *</label><input style={inp} value={form.tempatLahir} onChange={e => { const val = e.target.value.replace(/[^a-zA-Z\s]/g, ''); set('tempatLahir')({ ...e, target: { ...e.target, value: val } }); }} placeholder="Kota tempat lahir" onFocus={onFocus} onBlur={onBlur} /></div>
                  <div><label style={lbl}>Tanggal Lahir *</label><input style={inp} type="date" value={form.tanggalLahir} onChange={set('tanggalLahir')} onFocus={onFocus} onBlur={onBlur} /></div>
                </div>
                <div style={grid3}>
                  <div><label style={lbl}>Anak Ke-</label><input style={inp} type="number" value={form.anakKe} onChange={set('anakKe')} placeholder="1" onFocus={onFocus} onBlur={onBlur} /></div>
                  <div><label style={lbl}>NIK *</label><input id="field-nik" style={inp} value={form.nik} onChange={e => { const val = e.target.value.replace(/\D/g, ''); set('nik')({ ...e, target: { ...e.target, value: val } }); }} placeholder="16 digit NIK" maxLength={16} onFocus={onFocus} onBlur={onBlur} /></div>
                 <div><label style={lbl}>Ukuran Seragam</label>
                    <select style={inp} value={seragamCustom ? 'custom' : form.ukuranSeragam} onChange={e => { if (e.target.value === 'custom') { setSeragamCustom(true); set('ukuranSeragam')({ ...e, target: { ...e.target, value: '' } }); } else { setSeragamCustom(false); set('ukuranSeragam')(e); } }} onFocus={onFocus} onBlur={onBlur}>
                      <option value="">Pilih...</option>
                      {SERAGAM_OPTIONS.map(s => <option key={s}>{s}</option>)}
                      <option value="custom">Lainnya</option>
                    </select>
                    {seragamCustom && (
                      <input style={{ ...inp, marginTop: 8 }} value={form.ukuranSeragam} onChange={set('ukuranSeragam')} placeholder="Masukkan Ukuran" onFocus={onFocus} onBlur={onBlur} />
                    )}
                  </div>
                </div>
                <div><label style={lbl}>Alamat *</label><input style={inp} value={form.alamat} onChange={set('alamat')} placeholder="Nama jalan dan nomor" onFocus={onFocus} onBlur={onBlur} /></div>
                <div style={grid3}>
  <div><label style={lbl}>RT</label><input style={inp} value={form.rt} onChange={e => { const val = e.target.value.replace(/\D/g, ''); set('rt')({ ...e, target: { ...e.target, value: val } }); }} placeholder="001" onFocus={onFocus} onBlur={onBlur} /></div>
  <div><label style={lbl}>RW</label><input style={inp} value={form.rw} onChange={e => { const val = e.target.value.replace(/\D/g, ''); set('rw')({ ...e, target: { ...e.target, value: val } }); }} placeholder="001" onFocus={onFocus} onBlur={onBlur} /></div>
  <div><label style={lbl}>Kelurahan</label><input style={inp} value={form.kelurahan} onChange={e => { const val = e.target.value.replace(/[^a-zA-Z\s]/g, ''); set('kelurahan')({ ...e, target: { ...e.target, value: val } }); }} placeholder="Kelurahan" onFocus={onFocus} onBlur={onBlur} /></div>
</div>
<div style={grid2}>
  <div><label style={lbl}>Kecamatan</label><input style={inp} value={form.kecamatan} onChange={e => { const val = e.target.value.replace(/[^a-zA-Z\s]/g, ''); set('kecamatan')({ ...e, target: { ...e.target, value: val } }); }} placeholder="Kecamatan" onFocus={onFocus} onBlur={onBlur} /></div>
  <div><label style={lbl}>Kabupaten / Kota</label><input style={inp} value={form.kabupaten} onChange={e => { const val = e.target.value.replace(/[^a-zA-Z\s]/g, ''); set('kabupaten')({ ...e, target: { ...e.target, value: val } }); }} placeholder="Kabupaten/Kota" onFocus={onFocus} onBlur={onBlur} /></div>
</div>
                <div style={grid3}>
                  <div><label style={lbl}>Berat Badan (kg)</label><input style={inp} type="number" value={form.beratBadan} onChange={set('beratBadan')} placeholder="Kg" onFocus={onFocus} onBlur={onBlur} /></div>
                  <div><label style={lbl}>Tinggi Badan (cm)</label><input style={inp} type="number" value={form.tinggiBadan} onChange={set('tinggiBadan')} placeholder="Cm" onFocus={onFocus} onBlur={onBlur} /></div>
                  <div><label style={lbl}>Golongan Darah</label>
                    <select style={inp} value={form.golonganDarah} onChange={set('golonganDarah')} onFocus={onFocus} onBlur={onBlur}>
                      <option value="">Pilih...</option>{GOLDAR_OPTIONS.map(g => <option key={g}>{g}</option>)}
                    </select>
                  </div>
                </div>
                <div style={{ borderTop: '1px solid #F3F4F6', paddingTop: 14 }}>
                  <p style={{ fontSize: 13, fontWeight: 700, color: '#0A1628', marginBottom: 12 }}>Referensi Pendaftaran <span style={{ fontWeight: 400, color: '#9CA3AF' }}>(opsional)</span></p>
                  <div style={grid2}>
                    <div><label style={lbl}>Nama Pemberi Referensi</label><input style={inp} value={form.namaPemberiReferensi} onChange={set('namaPemberiReferensi')} placeholder="Nama" onFocus={onFocus} onBlur={onBlur} /></div>
                    <div><label style={lbl}>No. HP Referensi</label><input style={inp} type="tel" value={form.noHpReferensi} onChange={set('noHpReferensi')} placeholder="08xxxxxxxxxx" onFocus={onFocus} onBlur={onBlur} /></div>
                  </div>
                </div>
              </div>
            </div>
          )}

         {/* STEP 2: DATA ORANG TUA */}
{step === 2 && (
  <div>
    <h2 className="font-display" style={{ fontSize: 22, color: '#0A1628', marginBottom: 6 }}>Data Orang Tua Kandung / Wali</h2>
    <p style={{ color: '#6B7280', fontSize: 13, marginBottom: 24 }}>Isi data orang tua calon peserta didik</p>

    <div style={{ marginBottom: 28 }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: '#1E40AF', marginBottom: 14, paddingBottom: 8, borderBottom: '2px solid #DBEAFE' }}>Data Ayah</div>
      {renderOrtuBlock('Ayah')}
    </div>

    <div style={{ marginBottom: 28 }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: '#BE185D', marginBottom: 14, paddingBottom: 8, borderBottom: '2px solid #FCE7F3' }}>Data Ibu</div>
      {renderOrtuBlock('Ibu')}
    </div>

    <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', marginBottom: punyaWali ? 16 : 0, userSelect: 'none' }}>
      <input type="checkbox" checked={punyaWali} onChange={e => setPunyaWali(e.target.checked)} style={{ width: 18, height: 18, accentColor: '#C8973A', flexShrink: 0 }} />
      <span style={{ fontSize: 14, fontWeight: 600, color: '#374151' }}>Mempunyai wali?</span>
    </label>

    {punyaWali && (
      <div>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#065F46', marginBottom: 14, paddingBottom: 8, borderBottom: '2px solid #D1FAE5' }}>Data Wali</div>
        {renderOrtuBlock('Wali')}
      </div>
    )}
  </div>
)}

          {/* STEP 3: DATA AKADEMIK */}
          {step === 3 && (
            <div>
              <h2 className="font-display" style={{ fontSize: 22, color: '#0A1628', marginBottom: 6 }}>Data Akademik</h2>
              <p style={{ color: '#6B7280', fontSize: 13, marginBottom: 24 }}>Informasi riwayat pendidikan sebelumnya</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <label style={lbl}>Tipe Pendaftaran *</label>
                  <select id="field-tipePendaftaran" style={inp} value={form.tipePendaftaran} onChange={e => { set('tipePendaftaran')(e); setForm(f => ({ ...f, kelasMasuk: '', kelas: '' })); }} onFocus={onFocus} onBlur={onBlur}>
                    <option value="">Pilih tipe pendaftaran</option>
                    <option value="baru">Baru</option>
                    <option value="pindahan">Pindahan</option>
                  </select>
                </div>
                {form.tipePendaftaran === 'pindahan' && (
                  <div>
                    <label style={lbl}>Kelas Masuk *</label>
                    <select id="field-kelasMasuk" style={inp} value={form.kelasMasuk} onChange={e => { set('kelasMasuk')(e); setForm(f => ({ ...f, kelas: '' })); }} onFocus={onFocus} onBlur={onBlur}>
                      <option value="">Pilih kelas...</option>
                      {getKelasMasukOptions(jenjang).map(k => <option key={k}>{k}</option>)}
                    </select>
                    <p style={{ fontSize: 11, color: '#9CA3AF', marginTop: 4 }}>Pendaftaran pindahan hanya dibuka untuk tingkat 1–2, tidak untuk kelas terakhir ({jenjang === 'smp' ? '9' : '12'}).</p>
                  </div>
                )}
                {isSMK && (
                  <div>
                    <label style={lbl}>Jurusan yang Dipilih *</label>
                    <select id="field-jurusan" style={inp} value={form.jurusan} onChange={e => { set('jurusan')(e); setForm(f => ({ ...f, kelas: '' })); }} onFocus={onFocus} onBlur={onBlur}>
                      <option value="">Pilih jurusan...</option>
                      {jurusanOptions.map(j => <option key={j}>{j}</option>)}
                    </select>
                    {hargaOptions.length === 0 && <p style={{ fontSize: 11, color: '#DC2626', marginTop: 4 }}>Belum ada jurusan yang tersedia — hubungi admin.</p>}
                  </div>
                )}
                {(!isSMK || form.jurusan) && (() => {
                  const tingkat = form.tipePendaftaran === 'pindahan' ? form.kelasMasuk : getKelasMasukBaru(jenjang);
                  if (!tingkat) {
                    return <p style={{ fontSize: 12, color: '#9CA3AF' }}>Pilih Kelas Masuk terlebih dahulu untuk melihat pilihan Kelas.</p>;
                  }
                  const opts = filterKelasByTingkat(kelasOptionsUntuk(isSMK ? form.jurusan : '-').map(k => ({ kelas: k })), tingkat);
                  return (
                    <div id="field-kelas">
                      <label style={lbl}>Kelas *</label>
                      {opts.length > 0 ? (
                        <select style={inp} value={form.kelas} onChange={set('kelas')} onFocus={onFocus} onBlur={onBlur}>
                          <option value="">Pilih kelas...</option>
                          {opts.map(o => <option key={o.kelas} value={o.kelas}>{labelTier(pecahKelasHarga(o.kelas).tier)}</option>)}
                        </select>
                      ) : (
                        <p style={{ fontSize: 12, color: '#DC2626' }}>Belum ada harga untuk pilihan ini — hubungi admin.</p>
                      )}
                      <p style={{ fontSize: 11, color: '#9CA3AF', marginTop: 4 }}>Kelas Plus memiliki biaya pendidikan lebih tinggi dengan fasilitas tambahan.</p>
                    </div>
                  );
                })()}
                {jenjang === 'smp' ? (
                  <div><label style={lbl}>Asal SD/MI *</label><input id="field-asalSD" style={inp} value={form.asalSD} onChange={set('asalSD')} placeholder="Nama SD/MI asal" onFocus={onFocus} onBlur={onBlur} /></div>
                ) : (
                  <div><label style={lbl}>Asal SMP/MTs *</label><input id="field-asalSMP" style={inp} value={form.asalSMP} onChange={set('asalSMP')} placeholder="Nama SMP/MTs asal" onFocus={onFocus} onBlur={onBlur} /></div>
                )}
                {jenjang !== 'smp' && (
                  <div>
                    <label style={lbl}>Apakah Anda alumni SMP Citra Negara? *</label>
                    <select id="field-alumniSmp" style={inp} value={form.alumniSmpCitraNegara} onChange={set('alumniSmpCitraNegara')} onFocus={onFocus} onBlur={onBlur}>
                      <option value="">Pilih...</option>
                      <option value="ya">Ya, saya alumni SMP Citra Negara</option>
                      <option value="tidak">Tidak</option>
                    </select>
                    <p style={{ fontSize: 11, color: '#9CA3AF', marginTop: 4 }}>Menentukan gelombang pendaftaran yang berlaku untuk Anda.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* STEP 4: UPLOAD BERKAS */}
          {step === 4 && (
            <div>
              <h2 className="font-display" style={{ fontSize: 22, color: '#0A1628', marginBottom: 6 }}>Upload Berkas Persyaratan</h2>
              <p style={{ color: '#6B7280', fontSize: 13, marginBottom: 24 }}>Upload scan/foto dokumen (JPG/PNG/PDF, maks. 2MB per file)</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {FILE_FIELDS.map(item => {
                  const f = files[item.key];
                  const isUploaded = !!f.path;
                  const isUploading = f.uploading;
                  return (
                    <div key={item.key} id={`file-${item.key}`} className="file-upload-row" style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', background: isUploaded ? '#F0FDF4' : f.error ? '#FFF1F2' : '#FAFAFA', borderRadius: 12, border: `1.5px solid ${isUploaded ? '#86EFAC' : f.error ? '#FECDD3' : '#E5E7EB'}` }}>
                      <div style={{ width: 36, height: 36, borderRadius: '50%', background: isUploaded ? '#DCFCE7' : isUploading ? '#DBEAFE' : '#F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        {isUploading ? <Loader size={16} color="#3B82F6" /> : isUploaded ? <CheckCircle size={16} color="#16A34A" /> : <Upload size={16} color="#9CA3AF" />}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>{item.label}{item.required && <span style={{ color: '#EF4444', marginLeft: 4 }}>*</span>}</div>
                        {item.key === 'ijazah' && (
                          <div style={{ display: 'flex', gap: 14, marginTop: 6 }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: '#374151', cursor: 'pointer' }}>
                              <input type="radio" checked={jenisIjazah === 'ijazah'} onChange={() => setJenisIjazah('ijazah')} style={{ accentColor: '#C8973A' }} /> Ijazah
                            </label>
                            <label style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: '#374151', cursor: 'pointer' }}>
                              <input type="radio" checked={jenisIjazah === 'skl'} onChange={() => setJenisIjazah('skl')} style={{ accentColor: '#C8973A' }} /> Surat Keterangan Lulus (SKL)
                            </label>
                          </div>
                        )}
                        {isUploaded && <div style={{ fontSize: 11, color: '#16A34A', marginTop: 2 }}>✓ {f.file?.name} — Berhasil diupload</div>}
                        {isUploading && <div style={{ fontSize: 11, color: '#3B82F6', marginTop: 2 }}>Mengupload ke server...</div>}
                        {f.error && <div style={{ fontSize: 11, color: '#DC2626', marginTop: 2 }}>✗ {f.error}</div>}
                        {!isUploaded && !isUploading && !f.error && <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 2 }}>JPG, PNG, atau PDF — maks. 2MB</div>}
                      </div>
                      {!isUploaded ? (
                        <label style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#0A1628', color: 'white', padding: '8px 16px', borderRadius: 8, cursor: isUploading ? 'not-allowed' : 'pointer', fontSize: 12, fontWeight: 600, flexShrink: 0, opacity: isUploading ? 0.6 : 1 }}>
                          <Upload size={13} /> Browse
                          <input type="file" accept=".jpg,.jpeg,.png,.pdf" onChange={e => handleFileChange(item.key, e)} disabled={isUploading} style={{ display: 'none' }} />
                        </label>
                      ) : (
                        <button onClick={() => removeFile(item.key)} style={{ background: '#FEE2E2', border: 'none', borderRadius: 8, padding: '8px 12px', display: 'flex', alignItems: 'center', gap: 5, cursor: 'pointer', fontSize: 12, color: '#DC2626', fontWeight: 600, fontFamily: 'inherit' }}>
                          <X size={13} /> Hapus
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
              <p style={{ fontSize: 11, color: '#9CA3AF', marginTop: 14 }}>* Wajib diisi — File tersimpan aman di server sekolah</p>
            </div>
          )}

          {/* STEP 5: KONFIRMASI */}
          {step === 5 && (
            <div>
              <h2 className="font-display" style={{ fontSize: 22, color: '#0A1628', marginBottom: 6 }}>Konfirmasi Data</h2>
              <p style={{ color: '#6B7280', fontSize: 13, marginBottom: 24 }}>Periksa kembali semua data sebelum mengirim</p>
              {[
                { title: 'Data Pribadi', items: [['Nama Lengkap',form.namaLengkap],['Nama Panggilan',form.namaPanggilan],['Tempat Lahir',form.tempatLahir],['Tanggal Lahir',form.tanggalLahir],['Jenis Kelamin',form.jenisKelamin],['Agama',form.agama === 'Lainnya' ? form.agamaLainnya : form.agama],['NIK',form.nik],['NISN',form.nisn],['Alamat',`${form.alamat}, RT ${form.rt}/RW ${form.rw}`],['Kecamatan',form.kecamatan],['Kab/Kota',form.kabupaten]] },
                { title: 'Data Akademik', items: [['Jenjang', JENJANG_LABEL[jenjang]], ['Tipe Pendaftaran', form.tipePendaftaran === 'pindahan' ? 'Pindahan' : 'Baru'], ...(form.tipePendaftaran === 'pindahan' ? [['Kelas Masuk', form.kelasMasuk]] : []), ...(isSMK ? [['Jurusan',form.jurusan]] : []), ['Kelas',form.kelas], jenjang === 'smp' ? ['Asal SD/MI', form.asalSD] : ['Asal SMP/MTs', form.asalSMP], ...(jenjang !== 'smp' ? [['Alumni SMP Citra Negara', form.alumniSmpCitraNegara === 'ya' ? 'Ya' : form.alumniSmpCitraNegara === 'tidak' ? 'Tidak' : '']] : [])] },
                { title: 'Data Orang Tua', items: [['Nama Ayah',form.namaAyah],['Pekerjaan Ayah',form.pekerjaanAyah],['Nama Ibu',form.namaIbu],['Pekerjaan Ibu',form.pekerjaanIbu],['No. HP Ortu',form.noHpAyah||form.noHpIbu]] },
                { title: 'Berkas Upload', items: FILE_FIELDS.map((f, i) => [`${i+1}. ${f.label.split(' ').slice(1,3).join(' ')}`, files[f.key].path ? '✓ Sudah diupload' : f.required ? '✗ Belum diupload' : '— (opsional)']) },
              ].map(section => (
                <div key={section.title} style={{ marginBottom: 20 }}>
                  <h4 style={{ fontSize: 11, fontWeight: 700, color: '#C8973A', letterSpacing: 1, marginBottom: 10 }}>{section.title.toUpperCase()}</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 8 }}>
                    {section.items.map(([label, val], idx) => (
                        <div key={`${section.title}-${idx}`} style={{ background: '#FAFAFA', borderRadius: 8, padding: '8px 12px' }}>
                        <div style={{ fontSize: 10, color: '#9CA3AF', fontWeight: 600, marginBottom: 2 }}>{label}</div>
                        <div style={{ fontSize: 12, fontWeight: 600, color: String(val).startsWith('✗') ? '#EF4444' : String(val).startsWith('✓') ? '#16A34A' : val ? '#0A1628' : '#EF4444' }}>{val || '⚠ Belum diisi'}</div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              <div style={{ background: '#FEF3C7', border: '1px solid #FDE68A', borderRadius: 10, padding: 14 }}>
                <p style={{ fontSize: 12, color: '#92400E', lineHeight: 1.6 }}>✓ Dengan menekan tombol <strong>"Kirim Pendaftaran"</strong>, saya menyatakan bahwa semua data yang diisikan adalah benar dan dapat dipertanggungjawabkan.</p>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div style={{ marginTop: 28, paddingTop: 20, borderTop: '1px solid #F3F4F6' }}>
            <div className="form-nav-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
              <button onClick={() => setStep(s => s - 1)} disabled={step === 0} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: 'transparent', border: '1.5px solid #E5E7EB', color: step === 0 ? '#9CA3AF' : '#374151', padding: '10px 22px', borderRadius: 8, cursor: step === 0 ? 'not-allowed' : 'pointer', fontSize: 14, fontWeight: 600, fontFamily: 'inherit' }}>
                <ChevronLeft size={16} /> Sebelumnya
              </button>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <button onClick={handleSaveDraft} disabled={saving} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: 'transparent', border: '1.5px solid #C8973A', color: '#C8973A', padding: '10px 18px', borderRadius: 8, cursor: saving ? 'not-allowed' : 'pointer', fontSize: 13, fontWeight: 600, fontFamily: 'inherit', opacity: saving ? 0.7 : 1 }}>
                  {saving ? 'Menyimpan...' : 'Simpan'}
                </button>
                {step < 5 ? (
                  <button onClick={handleNext} className="btn-primary" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontSize: 14 }}>
                    Selanjutnya <ChevronRight size={16} />
                  </button>
                ) : (
                  <button onClick={handleFinishAndGoToPayment} disabled={loading} className="btn-primary" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontSize: 14, opacity: loading ? 0.7 : 1 }}>
                    <CheckCircle size={16} /> {loading ? 'Menyimpan...' : 'Simpan'}
                  </button>
                )}
              </div>
            </div>
            {step === 5 && (
              <p style={{ fontSize: 11, color: '#9CA3AF', marginTop: 10 }}>
                Formulir belum terkirim ke admin. Setelah ini Anda akan diarahkan ke halaman pembayaran — formulir baru masuk ke admin setelah Anda membayar uang pendaftaran minimal dan menekan tombol &quot;Kirim Formulir&quot;.
              </p>
            )}
          </div>
        </div>
      </main>
      <FormAlertModal state={alertModal} onClose={closeAlert} />
    </div>
  );
}
