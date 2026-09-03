'use client';
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Suspense } from 'react';
import { ChevronLeft, Upload, X, Loader } from 'lucide-react';
import { Jenjang } from '@/lib/biaya';
import { getKelasMasukOptions, getKelasMasukBaru, pecahKelasHarga, labelTier, filterKelasByTingkat } from '@/lib/kelas';

type HargaRow = { id: string; jenjang: string; jurusan: string; kelas: string; nominal: number; urutan: number };

const AGAMA_OPTIONS = ['Islam', 'Kristen Protestan', 'Kristen Katolik', 'Hindu', 'Budha', 'Konghucu', 'Lainnya'];
const GOLDAR_OPTIONS = ['A', 'B', 'AB', 'O', 'Tidak Tahu'];
const SERAGAM_OPTIONS = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
const PENDIDIKAN_OPTIONS = ['Belum/Tidak Sekolah', 'SD/MI', 'SMP/MTs', 'SMA/SMK', 'D1', 'D2', 'D3', 'S1', 'S2', 'S3'];

type FileItem = { file: File | null; path: string; uploading: boolean; error: string };
const emptyFile = (path = ''): FileItem => ({ file: null, path, uploading: false, error: '' });
type FilesState = { ijazah: FileItem; akte: FileItem; kk: FileItem; ktpOrtu: FileItem; kip: FileItem; foto: FileItem };
const FILE_FIELDS: { key: keyof FilesState; label: string; dbField: string }[] = [
  { key: 'ijazah', label: 'Ijazah atau Surat Keterangan Lulus (SKL)', dbField: 'fileIjazah' },
  { key: 'akte', label: 'Akte Kelahiran / Surat Keterangan Lahir', dbField: 'fileAkte' },
  { key: 'kk', label: 'Kartu Keluarga', dbField: 'fileKK' },
  { key: 'ktpOrtu', label: 'KTP Ayah dan Ibu', dbField: 'fileKtpOrtu' },
  { key: 'kip', label: 'Kartu KIP (Jika Ada)', dbField: 'fileKip' },
  { key: 'foto', label: 'Pas Photo Siswa Ukuran 3x4', dbField: 'fileFoto' },
];

const INITIAL_FORM = {
  namaLengkap: '', namaPanggilan: '', tempatLahir: '', tanggalLahir: '',
  jenisKelamin: '', agama: '', agamaLainnya: '', anakKe: '',
  alamat: '', rt: '', rw: '', kelurahan: '', kecamatan: '', kabupaten: '',
  beratBadan: '', tinggiBadan: '', golonganDarah: '', ukuranSeragam: '',
  nisn: '', nik: '', noPribadi: '',
  namaPemberiReferensi: '', noHpReferensi: '',
  asalSD: '', asalSMP: '', jurusan: '', kelas: '', jenisIjazah: 'ijazah',
  tipePendaftaran: 'baru', kelasMasuk: '', alumniSmpCitraNegara: '',
  namaAyah: '', ttlAyah: '', pendidikanAyah: '', pekerjaanAyah: '', penghasilanAyah: '', noHpAyah: '', alamatAyah: '',
  namaIbu: '', ttlIbu: '', pendidikanIbu: '', pekerjaanIbu: '', penghasilanIbu: '', noHpIbu: '', alamatIbu: '',
  namaWali: '', ttlWali: '', pendidikanWali: '', pekerjaanWali: '', penghasilanWali: '', noHpWali: '', alamatWali: '',
  email: '', password: '',
};

export default function TambahPendaftarOfflinePage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9CA3AF' }}>Memuat...</div>}>
      <TambahPendaftarOfflineInner />
    </Suspense>
  );
}

function TambahPendaftarOfflineInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const idParam = searchParams.get('id');
  const tahunAjaranId = searchParams.get('tahunAjaranId') || '';
  const qsOnly = tahunAjaranId ? `&tahunAjaranId=${tahunAjaranId}` : '';

  const [pendaftaranId, setPendaftaranId] = useState<string | null>(idParam);
  const [jenjang, setJenjang] = useState<Jenjang>(() => {
    const p = (searchParams.get('jenjang') || 'smk').toLowerCase();
    return (['smp', 'sma', 'smk'].includes(p) ? p : 'smk') as Jenjang;
  });
  const isSMK = jenjang === 'smk';

  const [form, setForm] = useState(INITIAL_FORM);
  const [punyaWali, setPunyaWali] = useState(false);
  const [hasAccount, setHasAccount] = useState(false);
  const [accountEmail, setAccountEmail] = useState('');
  const [loadingData, setLoadingData] = useState(!!idParam);
  const [files, setFiles] = useState<FilesState>({
    ijazah: emptyFile(), akte: emptyFile(), kk: emptyFile(), ktpOrtu: emptyFile(), kip: emptyFile(), foto: emptyFile(),
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [hargaOptions, setHargaOptions] = useState<HargaRow[]>([]);

  // Muat data yang sudah tersimpan kalau ini melanjutkan formulir offline
  // yang sudah pernah dibuat (?id=...) — section B7: riwayat pengisian tidak
  // boleh hilang, admin bisa buka lagi dan menambah data/berkas kapan saja.
  useEffect(() => {
    if (!idParam) return;
    fetch(`/api/admin/pendaftar/${idParam}`).then(r => r.json()).then(d => {
      if (!d.data) { setLoadingData(false); return; }
      const rec = d.data;
      setJenjang((['smp', 'sma', 'smk'].includes(rec.jenjang) ? rec.jenjang : 'smk') as Jenjang);
      setForm(f => {
        const next = { ...f };
        for (const key of Object.keys(INITIAL_FORM)) {
          if (key === 'email' || key === 'password' || key === 'agamaLainnya' || key === 'jurusan') continue;
          if (typeof rec[key] === 'string' && rec[key] !== '') (next as any)[key] = rec[key];
        }
        if (rec.jurusan && rec.jurusan !== '-') next.jurusan = rec.jurusan;
        if (rec.agama && !AGAMA_OPTIONS.includes(rec.agama)) { next.agama = 'Lainnya'; next.agamaLainnya = rec.agama; }
        if (typeof rec.alumniSmpCitraNegara === 'boolean') next.alumniSmpCitraNegara = rec.alumniSmpCitraNegara ? 'ya' : 'tidak';
        if (rec.jenisIjazah === 'skl') next.jenisIjazah = 'skl';
        return next;
      });
      setFiles({
        ijazah: emptyFile(rec.fileIjazah || ''), akte: emptyFile(rec.fileAkte || ''), kk: emptyFile(rec.fileKK || ''),
        ktpOrtu: emptyFile(rec.fileKtpOrtu || ''), kip: emptyFile(rec.fileKip || ''), foto: emptyFile(rec.fileFoto || ''),
      });
      if (rec.namaWali) setPunyaWali(true);
      if (rec.userId) { setHasAccount(true); setAccountEmail(rec.userEmail || rec.user?.email || ''); }
      setLoadingData(false);
    });
  }, [idParam]);

  // Jurusan/kelas SELALU dari Panel Harga admin (/api/harga) — tidak ada
  // daftar jurusan/kelas hardcoded di formulir offline ini.
  useEffect(() => {
    fetch(`/api/harga?jenjang=${jenjang}`).then(r => r.json()).then(d => setHargaOptions(d.data || [])).catch(() => setHargaOptions([]));
  }, [jenjang]);

  const jurusanOptions = [...new Set(hargaOptions.filter(h => h.jenjang === jenjang).map(h => h.jurusan))];
  const kelasOptionsUntuk = (jurusan: string) => hargaOptions.filter(h => h.jenjang === jenjang && h.jurusan === jurusan).map(h => h.kelas);

  // Tingkat (Kelas Masuk) HANYA ditanya sekali — untuk pindahan dari field
  // "Kelas Masuk", untuk baru selalu tingkat awal jenjang. Dropdown "Kelas"
  // di bawah cuma menanyakan tier (Reguler/Plus) untuk tingkat itu, sama
  // persis dengan formulir online, supaya tidak ada dua pertanyaan "kelas
  // berapa" yang bisa saling bertentangan.
  useEffect(() => {
    const filterJurusan = isSMK ? form.jurusan : '-';
    const tingkat = form.tipePendaftaran === 'pindahan' ? form.kelasMasuk : getKelasMasukBaru(jenjang);
    const semua = kelasOptionsUntuk(filterJurusan);
    const opts = tingkat ? filterKelasByTingkat(semua.map(k => ({ kelas: k })), tingkat).map(o => o.kelas) : [];
    // Hanya bertindak kalau katalog untuk jenjang/jurusan/tingkat SAAT INI
    // benar-benar sudah termuat (opts.length > 0). Kalau masih 0, JANGAN
    // kosongkan form.kelas — kemungkinan besar hargaOptions belum selesai
    // di-refetch untuk jenjang yang baru (mis. setelah data draft dimuat),
    // bukan berarti pilihan yang tersimpan salah. Efek ini jalan lagi begitu
    // hargaOptions yang benar datang.
    if (opts.length > 0 && !opts.includes(form.kelas)) {
      const preferReguler = opts.find(k => pecahKelasHarga(k).tier === 'REGULER');
      setForm(f => ({ ...f, kelas: preferReguler || opts[0] }));
    }
  }, [form.jurusan, form.tipePendaftaran, form.kelasMasuk, hargaOptions, jenjang]);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  const inp: React.CSSProperties = { width: '100%', padding: '9px 12px', border: '1.5px solid #D1D5DB', borderRadius: 8, fontSize: 13, fontFamily: 'inherit' };
  const lbl: React.CSSProperties = { fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 5 };

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

  // TIDAK ADA field yang wajib di sini (section B9) — admin boleh simpan
  // sekalipun masih banyak yang kosong, dan melengkapi belakangan. Satu-
  // satunya penjagaan adalah teknis: jangan simpan sementara file masih
  // proses upload, dan kalau mengisi akun, email & password harus lengkap
  // berdua (bukan wajib ada, tapi kalau diisi harus valid).
  const handleSubmit = async () => {
    setError('');
    setSuccess('');
    if (Object.values(files).some(f => f.uploading)) { setError('Tunggu proses upload berkas selesai'); return; }
    if ((form.email && !form.password) || (!form.email && form.password)) {
      setError('Untuk membuat akun, isi Email dan Password berdua — atau kosongkan berdua kalau belum mau membuat akun sekarang');
      return;
    }
    if (form.password && form.password.length < 8) { setError('Password minimal 8 karakter'); return; }
    if (form.nik && form.nik.length !== 16) { setError('NIK harus 16 digit kalau diisi'); return; }

    setLoading(true);
    try {
      const payload: Record<string, unknown> = {
        namaLengkap: form.namaLengkap || null, namaPanggilan: form.namaPanggilan || null,
        tempatLahir: form.tempatLahir || null, tanggalLahir: form.tanggalLahir || null,
        ttl: form.tempatLahir || form.tanggalLahir ? `${form.tempatLahir}, ${form.tanggalLahir}` : null,
        jenisKelamin: form.jenisKelamin || null,
        agama: form.agama === 'Lainnya' ? (form.agamaLainnya || 'Lainnya') : (form.agama || null),
        anakKe: form.anakKe || null,
        alamat: form.alamat || null, rt: form.rt || null, rw: form.rw || null,
        kelurahan: form.kelurahan || null, kecamatan: form.kecamatan || null, kabupaten: form.kabupaten || null,
        beratBadan: form.beratBadan || null, tinggiBadan: form.tinggiBadan || null, golonganDarah: form.golonganDarah || null,
        ukuranSeragam: form.ukuranSeragam || null,
        nisn: form.nisn || null, nik: form.nik || null, noPribadi: form.noPribadi || null,
        namaPemberiReferensi: form.namaPemberiReferensi || null, noHpReferensi: form.noHpReferensi || null,
        asalSD: form.asalSD || null, asalSMP: form.asalSMP || null,
        asalSekolah: jenjang === 'smp' ? (form.asalSD || null) : (form.asalSMP || null),
        jurusan: isSMK ? (form.jurusan || null) : '-',
        kelas: form.kelas || null,
        jenisIjazah: form.jenisIjazah,
        tipePendaftaran: form.tipePendaftaran || 'baru',
        kelasMasuk: form.tipePendaftaran === 'pindahan' ? (form.kelasMasuk || null) : null,
        alumniSmpCitraNegara: jenjang === 'smp' ? null : (form.alumniSmpCitraNegara ? form.alumniSmpCitraNegara === 'ya' : null),
        namaAyah: form.namaAyah || null, ttlAyah: form.ttlAyah || null, pendidikanAyah: form.pendidikanAyah || null,
        pekerjaanAyah: form.pekerjaanAyah || null, penghasilanAyah: form.penghasilanAyah || null, noHpAyah: form.noHpAyah || null, alamatAyah: form.alamatAyah || null,
        namaIbu: form.namaIbu || null, ttlIbu: form.ttlIbu || null, pendidikanIbu: form.pendidikanIbu || null,
        pekerjaanIbu: form.pekerjaanIbu || null, penghasilanIbu: form.penghasilanIbu || null, noHpIbu: form.noHpIbu || null, alamatIbu: form.alamatIbu || null,
        namaWali: punyaWali ? (form.namaWali || null) : null, ttlWali: punyaWali ? (form.ttlWali || null) : null,
        pendidikanWali: punyaWali ? (form.pendidikanWali || null) : null, pekerjaanWali: punyaWali ? (form.pekerjaanWali || null) : null,
        penghasilanWali: punyaWali ? (form.penghasilanWali || null) : null, noHpWali: punyaWali ? (form.noHpWali || null) : null,
        alamatWali: punyaWali ? (form.alamatWali || null) : null,
        namaOrtu: form.namaAyah || form.namaIbu || (punyaWali ? form.namaWali : '') || null,
        noOrtu: form.noHpAyah || form.noHpIbu || (punyaWali ? form.noHpWali : '') || null,
        fileIjazah: files.ijazah.path || null, fileAkte: files.akte.path || null, fileKK: files.kk.path || null,
        fileKtpOrtu: files.ktpOrtu.path || null, fileKip: files.kip.path || null, fileFoto: files.foto.path || null,
      };

      let currentId = pendaftaranId;
      if (currentId) {
        const res = await fetch(`/api/admin/pendaftar-offline/${currentId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const d = await res.json();
        if (!res.ok) { setError(d.error || 'Gagal menyimpan data'); setLoading(false); return; }
      } else {
        const res = await fetch('/api/admin/pendaftar-offline', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...payload, jenjang, tahunAjaranId: tahunAjaranId || undefined }),
        });
        const d = await res.json();
        if (!res.ok) { setError(d.error || 'Gagal menyimpan data'); setLoading(false); return; }
        currentId = d.data.id;
        setPendaftaranId(currentId);
        router.replace(`/admin/pendaftar/tambah?id=${currentId}`);
      }

      // Akun login dibuat terpisah (section C) — hanya kalau admin mengisi
      // email & password DAN pendaftar ini belum punya akun.
      if (form.email && form.password && !hasAccount && currentId) {
        const resAkun = await fetch(`/api/admin/pendaftar-offline/${currentId}/buat-akun`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: form.email, password: form.password }),
        });
        const dAkun = await resAkun.json();
        if (!resAkun.ok) {
          setSuccess('✅ Data formulir tersimpan.');
          setError(`⚠ Data tersimpan, tapi akun gagal dibuat: ${dAkun.error || 'terjadi kesalahan'}`);
          setLoading(false);
          return;
        }
        setHasAccount(true);
        setAccountEmail(form.email);
        alert(`✅ Data tersimpan & akun login dibuat!\n\nEmail login: ${form.email}\nPassword: ${form.password}\n\nSampaikan info ini ke siswa/orang tua supaya bisa lanjut isi dari rumah.`);
        setForm(f => ({ ...f, password: '' }));
      } else {
        setSuccess('✅ Data formulir tersimpan.');
      }
      setLoading(false);
    } catch {
      setError('Terjadi kesalahan jaringan');
      setLoading(false);
    }
  };

  const renderOrtuBlock = (role: 'Ayah' | 'Ibu' | 'Wali') => {
    const fields: { base: string; label: string; ph?: string; isSelect?: boolean; textarea?: boolean }[] = [
      { base: 'nama', label: 'Nama Lengkap', ph: 'Nama lengkap' },
      { base: 'ttl', label: 'Tempat, Tgl Lahir', ph: 'Bandung, 17 Juni 1980' },
      { base: 'pendidikan', label: 'Pendidikan', isSelect: true },
      { base: 'pekerjaan', label: 'Pekerjaan', ph: 'Pekerjaan' },
      { base: 'penghasilan', label: 'Penghasilan/bulan', ph: 'Rp' },
      { base: 'noHp', label: 'No. Handphone', ph: '08xx' },
      { base: 'alamat', label: 'Alamat', ph: 'Alamat lengkap', textarea: true },
    ];
    return (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
        {fields.map(f => {
          const key = (f.base + role) as keyof typeof form;
          return (
            <div key={key} style={f.textarea ? { gridColumn: '1 / -1' } : undefined}>
              <label style={lbl}>{f.label}</label>
              {f.isSelect ? (
                <select style={inp} value={form[key]} onChange={set(key)}>
                  <option value="">Pilih...</option>
                  {PENDIDIKAN_OPTIONS.map(p => <option key={p}>{p}</option>)}
                </select>
              ) : f.textarea ? (
                <textarea style={{ ...inp, minHeight: 60, resize: 'vertical' }} value={form[key]} onChange={set(key)} placeholder={f.ph} />
              ) : (
                <input style={inp} value={form[key]} onChange={set(key)} placeholder={f.ph} />
              )}
            </div>
          );
        })}
      </div>
    );
  };

  if (loadingData) return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9CA3AF' }}>Memuat...</div>;

  return (
    <div style={{ minHeight: '100vh', background: '#F8F9FA' }}>
      <header style={{ background: '#0A1628', padding: '18px 24px' }}>
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          <Link href={`/admin/pendaftar?jenjang=${jenjang}&sumber=offline${qsOnly}`} style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'rgba(255,255,255,0.6)', fontSize: 12, textDecoration: 'none', marginBottom: 10, width: 'fit-content' }}>
            <ChevronLeft size={14} /> Kembali
          </Link>
          <h1 style={{ color: 'white', fontSize: 18, fontWeight: 700 }}>{pendaftaranId ? 'Lanjutkan Formulir Offline' : 'Tambah Pendaftar Offline'} — {jenjang.toUpperCase()}</h1>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12 }}>Untuk siswa yang mendaftar langsung di sekolah. Boleh disimpan sekalipun belum lengkap — bisa dilanjutkan kapan saja.</p>
        </div>
      </header>

      <div style={{ maxWidth: 800, margin: '0 auto', padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
        {error && <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8, padding: 12, fontSize: 13, color: '#991B1B' }}>{error}</div>}
        {success && !error && <div style={{ background: '#F0FDF4', border: '1px solid #A7F3D0', borderRadius: 8, padding: 12, fontSize: 13, color: '#065F46' }}>{success}</div>}

        <div style={{ background: 'white', borderRadius: 14, padding: 20, border: '1px solid #F3F4F6' }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: '#0A1628', marginBottom: 4 }}>Akun Login Siswa</h3>
          {hasAccount ? (
            <p style={{ fontSize: 13, color: '#065F46', background: '#F0FDF4', border: '1px solid #A7F3D0', borderRadius: 8, padding: '10px 12px' }}>
              ✓ Sudah punya akun login: <strong>{accountEmail}</strong>. Pendaftar bisa login dari rumah untuk melanjutkan formulir ini.
            </p>
          ) : (
            <>
              <p style={{ fontSize: 12, color: '#9CA3AF', marginBottom: 14 }}>Opsional — isi kalau ingin langsung membuatkan akun supaya pendaftar bisa lanjut isi dari rumah. Boleh dikosongkan dan dibuat belakangan.</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
                <div><label style={lbl}>Email</label><input style={inp} type="email" value={form.email} onChange={set('email')} placeholder="email@contoh.com" /></div>
                <div><label style={lbl}>Password</label><input style={inp} value={form.password} onChange={set('password')} placeholder="Minimal 8 karakter" /></div>
              </div>
            </>
          )}
        </div>

        <div style={{ background: 'white', borderRadius: 14, padding: 20, border: '1px solid #F3F4F6' }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: '#0A1628', marginBottom: 14 }}>Data Pribadi</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
            <div><label style={lbl}>Nama Lengkap</label><input style={inp} value={form.namaLengkap} onChange={set('namaLengkap')} /></div>
            <div><label style={lbl}>Nama Panggilan</label><input style={inp} value={form.namaPanggilan} onChange={set('namaPanggilan')} /></div>
            <div><label style={lbl}>Tempat Lahir</label><input style={inp} value={form.tempatLahir} onChange={set('tempatLahir')} /></div>
            <div><label style={lbl}>Tanggal Lahir</label><input style={inp} type="date" value={form.tanggalLahir} onChange={set('tanggalLahir')} /></div>
            <div><label style={lbl}>Jenis Kelamin</label>
              <select style={inp} value={form.jenisKelamin} onChange={set('jenisKelamin')}>
                <option value="">Pilih...</option><option>Laki-laki</option><option>Perempuan</option>
              </select>
            </div>
            <div><label style={lbl}>Agama</label>
              <select style={inp} value={form.agama} onChange={set('agama')}>
                <option value="">Pilih...</option>
                {AGAMA_OPTIONS.map(a => <option key={a}>{a}</option>)}
              </select>
            </div>
            {form.agama === 'Lainnya' && <div><label style={lbl}>Sebutkan Agama</label><input style={inp} value={form.agamaLainnya} onChange={set('agamaLainnya')} /></div>}
            <div><label style={lbl}>Anak ke-</label><input style={inp} value={form.anakKe} onChange={set('anakKe')} /></div>
            <div><label style={lbl}>Golongan Darah</label>
              <select style={inp} value={form.golonganDarah} onChange={set('golonganDarah')}>
                <option value="">Pilih...</option>
                {GOLDAR_OPTIONS.map(g => <option key={g}>{g}</option>)}
              </select>
            </div>
            <div><label style={lbl}>Berat Badan (kg)</label><input style={inp} value={form.beratBadan} onChange={set('beratBadan')} /></div>
            <div><label style={lbl}>Tinggi Badan (cm)</label><input style={inp} value={form.tinggiBadan} onChange={set('tinggiBadan')} /></div>
            <div><label style={lbl}>Ukuran Seragam</label>
              <select style={inp} value={form.ukuranSeragam} onChange={set('ukuranSeragam')}>
                <option value="">Pilih...</option>
                {SERAGAM_OPTIONS.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div><label style={lbl}>NIK (16 digit)</label><input style={inp} value={form.nik} maxLength={16} onChange={e => setForm(f => ({ ...f, nik: e.target.value.replace(/\D/g, '') }))} /></div>
            <div><label style={lbl}>NISN</label><input style={inp} value={form.nisn} onChange={set('nisn')} /></div>
            <div><label style={lbl}>No. WhatsApp</label><input style={inp} value={form.noPribadi} onChange={set('noPribadi')} /></div>
          </div>
          <div style={{ marginTop: 12 }}>
            <label style={lbl}>Alamat</label>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 12, marginBottom: 12 }}>
              <input style={inp} value={form.alamat} onChange={set('alamat')} placeholder="Jalan / nomor rumah" />
              <input style={inp} value={form.rt} onChange={set('rt')} placeholder="RT" />
              <input style={inp} value={form.rw} onChange={set('rw')} placeholder="RW" />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12 }}>
              <input style={inp} value={form.kelurahan} onChange={set('kelurahan')} placeholder="Kelurahan" />
              <input style={inp} value={form.kecamatan} onChange={set('kecamatan')} placeholder="Kecamatan" />
              <input style={inp} value={form.kabupaten} onChange={set('kabupaten')} placeholder="Kab/Kota" />
            </div>
          </div>
          <div style={{ marginTop: 12, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
            <div><label style={lbl}>Nama Pemberi Referensi</label><input style={inp} value={form.namaPemberiReferensi} onChange={set('namaPemberiReferensi')} /></div>
            <div><label style={lbl}>No. HP Referensi</label><input style={inp} value={form.noHpReferensi} onChange={set('noHpReferensi')} /></div>
          </div>
        </div>

        <div style={{ background: 'white', borderRadius: 14, padding: 20, border: '1px solid #F3F4F6' }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: '#0A1628', marginBottom: 14 }}>Data Akademik</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
            <div>
              <label style={lbl}>Tipe Pendaftaran</label>
              <select style={inp} value={form.tipePendaftaran} onChange={e => { set('tipePendaftaran')(e); setForm(f => ({ ...f, kelasMasuk: '', kelas: '' })); }}>
                <option value="baru">Baru</option><option value="pindahan">Pindahan</option>
              </select>
            </div>
            {form.tipePendaftaran === 'pindahan' && (
              <div>
                <label style={lbl}>Kelas Masuk</label>
                <select style={inp} value={form.kelasMasuk} onChange={e => { set('kelasMasuk')(e); setForm(f => ({ ...f, kelas: '' })); }}>
                  <option value="">Pilih...</option>
                  {getKelasMasukOptions(jenjang).map(k => <option key={k}>{k}</option>)}
                </select>
              </div>
            )}
            {isSMK && (
              <div>
                <label style={lbl}>Jurusan</label>
                <select style={inp} value={form.jurusan} onChange={e => { set('jurusan')(e); setForm(f => ({ ...f, kelas: '' })); }}>
                  <option value="">Pilih...</option>
                  {jurusanOptions.map(j => <option key={j}>{j}</option>)}
                </select>
                {hargaOptions.length === 0 && <p style={{ fontSize: 11, color: '#DC2626', marginTop: 4 }}>Belum ada jurusan tersedia — atur di Panel Harga.</p>}
              </div>
            )}
            <div>
              <label style={lbl}>Kelas</label>
              {(() => {
                if (isSMK && !form.jurusan) return <p style={{ fontSize: 12, color: '#9CA3AF' }}>Pilih jurusan dahulu.</p>;
                const tingkat = form.tipePendaftaran === 'pindahan' ? form.kelasMasuk : getKelasMasukBaru(jenjang);
                if (!tingkat) return <p style={{ fontSize: 12, color: '#9CA3AF' }}>Pilih Kelas Masuk dahulu.</p>;
                const opts = filterKelasByTingkat(kelasOptionsUntuk(isSMK ? form.jurusan : '-').map(k => ({ kelas: k })), tingkat);
                return opts.length > 0 ? (
                  <select style={inp} value={form.kelas} onChange={set('kelas')}>
                    <option value="">Pilih...</option>
                    {opts.map(o => <option key={o.kelas} value={o.kelas}>{labelTier(pecahKelasHarga(o.kelas).tier)}</option>)}
                  </select>
                ) : <p style={{ fontSize: 12, color: '#DC2626' }}>Belum ada harga untuk pilihan ini.</p>;
              })()}
            </div>
            {jenjang === 'smp' ? (
              <div><label style={lbl}>Asal SD/MI</label><input style={inp} value={form.asalSD} onChange={set('asalSD')} /></div>
            ) : (
              <>
                <div><label style={lbl}>Asal SMP/MTs</label><input style={inp} value={form.asalSMP} onChange={set('asalSMP')} /></div>
                <div>
                  <label style={lbl}>Alumni SMP Citra Negara?</label>
                  <select style={inp} value={form.alumniSmpCitraNegara} onChange={set('alumniSmpCitraNegara')}>
                    <option value="">Pilih...</option>
                    <option value="ya">Ya</option>
                    <option value="tidak">Tidak</option>
                  </select>
                </div>
              </>
            )}
          </div>
        </div>

        <div style={{ background: 'white', borderRadius: 14, padding: 20, border: '1px solid #F3F4F6' }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: '#1E40AF', marginBottom: 14 }}>Data Ayah</h3>
          {renderOrtuBlock('Ayah')}
        </div>

        <div style={{ background: 'white', borderRadius: 14, padding: 20, border: '1px solid #F3F4F6' }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: '#BE185D', marginBottom: 14 }}>Data Ibu</h3>
          {renderOrtuBlock('Ibu')}
        </div>

        <div style={{ background: 'white', borderRadius: 14, padding: 20, border: '1px solid #F3F4F6' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', marginBottom: punyaWali ? 16 : 0 }}>
            <input type="checkbox" checked={punyaWali} onChange={e => setPunyaWali(e.target.checked)} style={{ width: 18, height: 18, accentColor: '#C8973A' }} />
            <span style={{ fontSize: 14, fontWeight: 700, color: '#065F46' }}>Mempunyai Wali?</span>
          </label>
          {punyaWali && renderOrtuBlock('Wali')}
        </div>

        <div style={{ background: 'white', borderRadius: 14, padding: 20, border: '1px solid #F3F4F6' }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: '#0A1628', marginBottom: 4 }}>Upload Berkas</h3>
          <p style={{ fontSize: 12, color: '#9CA3AF', marginBottom: 14 }}>Tidak wajib diisi sekarang — boleh disusulkan kapan saja lewat halaman ini lagi.</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
            {FILE_FIELDS.map(item => {
              const f = files[item.key];
              return (
                <div key={item.key} style={{ display: 'flex', flexDirection: 'column' }}>
                  <label style={lbl}>{item.label}</label>
                  {/* Slot ini SELALU dirender (kosong untuk berkas selain ijazah)
                      supaya tinggi area di bawah label sama rata di semua kolom —
                      kalau tidak, kotak "Pilih file" milik Ijazah jadi turun
                      sendiri dan tidak sejajar dengan kolom lain di baris yang sama. */}
                  <div style={{ display: 'flex', gap: 12, marginBottom: 6, minHeight: 18 }}>
                    {item.key === 'ijazah' && (
                      <>
                        <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#374151', cursor: 'pointer' }}>
                          <input type="radio" checked={form.jenisIjazah === 'ijazah'} onChange={() => setForm(f2 => ({ ...f2, jenisIjazah: 'ijazah' }))} /> Ijazah
                        </label>
                        <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#374151', cursor: 'pointer' }}>
                          <input type="radio" checked={form.jenisIjazah === 'skl'} onChange={() => setForm(f2 => ({ ...f2, jenisIjazah: 'skl' }))} /> SKL
                        </label>
                      </>
                    )}
                  </div>
                  {f.path ? (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#F0FDF4', border: '1px solid #A7F3D0', borderRadius: 8, padding: '8px 12px' }}>
                      <span style={{ fontSize: 12, color: '#065F46', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>✓ {f.file?.name || 'Tersimpan'}</span>
                      <button onClick={() => removeFile(item.key)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#DC2626', flexShrink: 0 }}><X size={14} /></button>
                    </div>
                  ) : (
                    <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, border: '1.5px dashed #D1D5DB', borderRadius: 8, padding: '9px 12px', cursor: f.uploading ? 'wait' : 'pointer', fontSize: 12, color: '#6B7280' }}>
                      {f.uploading ? <Loader size={14} className="animate-spin" /> : <Upload size={14} />}
                      {f.uploading ? 'Mengupload...' : 'Pilih file'}
                      <input type="file" accept=".jpg,.jpeg,.png,.pdf" onChange={e => handleFileChange(item.key, e)} disabled={f.uploading} style={{ display: 'none' }} />
                    </label>
                  )}
                  {f.error && <p style={{ fontSize: 11, color: '#DC2626', marginTop: 4 }}>{f.error}</p>}
                </div>
              );
            })}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <button onClick={handleSubmit} disabled={loading} className="btn-primary" style={{ padding: '12px 28px', fontSize: 14, opacity: loading ? 0.6 : 1 }}>
            {loading ? 'Menyimpan...' : 'Simpan'}
          </button>
          <Link href={`/admin/pendaftar?jenjang=${jenjang}&sumber=offline${qsOnly}`} style={{ fontSize: 13, color: '#6B7280', textDecoration: 'none' }}>
            Selesai, kembali ke Data Pendaftar →
          </Link>
        </div>
      </div>
    </div>
  );
}
