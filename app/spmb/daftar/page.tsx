'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { GraduationCap, ChevronRight, ChevronLeft, CheckCircle, AlertCircle, Upload, X, Loader } from 'lucide-react';
import Image from 'next/image';

const JURUSAN_OPTIONS = [
  'Pengembangan Perangkat Lunak dan Gim (PPLG)',
  'Teknik Jaringan Komputer & Telekomunikasi (TJKT)',
  'Desain Komunikasi Visual (DKV)',
  'Manajemen Perkantoran & Layanan Bisnis (MPLB)',
  'Pemasaran (PM)',
  'Perhotelan (PH)',
];

const AGAMA_OPTIONS = ['Islam', 'Kristen Protestan', 'Kristen Katolik', 'Hindu', 'Budha', 'Konghucu'];
const GOLDAR_OPTIONS = ['A', 'B', 'AB', 'O', 'Tidak Tahu'];
const SERAGAM_OPTIONS = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
const PENDIDIKAN_OPTIONS = ['SD/MI', 'SMP/MTs', 'SMA/SMK', 'D1', 'D2', 'D3', 'S1', 'S2', 'S3'];
const STEPS = ['Ketentuan', 'Data Pribadi', 'Data Orang Tua', 'Data Akademik', 'Upload Berkas', 'Konfirmasi'];


type FormData = {
  namaLengkap: string; namaPanggilan: string;
  tempatLahir: string; tanggalLahir: string;
  jenisKelamin: string; agama: string; anakKe: string;
  alamat: string; rt: string; rw: string;
  kelurahan: string; kecamatan: string; kabupaten: string;
  beratBadan: string; tinggiBadan: string; golonganDarah: string;
  nisn: string; nik: string; noPribadi: string; ukuranSeragam: string;
  namaPemberiReferensi: string; noHpReferensi: string;
  asalSD: string; asalSMP: string; jurusan: string;
  namaAyah: string; ttlAyah: string; pendidikanAyah: string; pekerjaanAyah: string; penghasilanAyah: string; noHpAyah: string; alamatAyah: string;
  namaIbu: string; ttlIbu: string; pendidikanIbu: string; pekerjaanIbu: string; penghasilanIbu: string; noHpIbu: string; alamatIbu: string;
  namaWali: string; ttlWali: string; pendidikanWali: string; pekerjaanWali: string; penghasilanWali: string; noHpWali: string; alamatWali: string;
};

const INITIAL: FormData = {
  namaLengkap: '', namaPanggilan: '', tempatLahir: '', tanggalLahir: '',
  jenisKelamin: '', agama: '', anakKe: '', alamat: '', rt: '', rw: '',
  kelurahan: '', kecamatan: '', kabupaten: '', beratBadan: '', tinggiBadan: '',
  golonganDarah: '', nisn: '', nik: '', noPribadi: '', ukuranSeragam: '',
  namaPemberiReferensi: '', noHpReferensi: '', asalSD: '', asalSMP: '', jurusan: '',
  namaAyah: '', ttlAyah: '', pendidikanAyah: '', pekerjaanAyah: '', penghasilanAyah: '', noHpAyah: '', alamatAyah: '',
  namaIbu: '', ttlIbu: '', pendidikanIbu: '', pekerjaanIbu: '', penghasilanIbu: '', noHpIbu: '', alamatIbu: '',
  namaWali: '', ttlWali: '', pendidikanWali: '', pekerjaanWali: '', penghasilanWali: '', noHpWali: '', alamatWali: '',
};

type FileItem = { file: File | null; path: string; uploading: boolean; error: string };
type FilesState = { ijazah: FileItem; akte: FileItem; kk: FileItem; ktpOrtu: FileItem; kip: FileItem; foto: FileItem };
const emptyFile = (): FileItem => ({ file: null, path: '', uploading: false, error: '' });

const FILE_FIELDS = [
  { key: 'ijazah' as keyof FilesState, label: 'Fotocopy Ijazah yang telah dilegalisir', required: true },
  { key: 'akte' as keyof FilesState, label: 'Fotocopy Akte Kelahiran / Surat Keterangan Lahir', required: true },
  { key: 'kk' as keyof FilesState, label: 'Fotocopy Kartu Keluarga', required: true },
  { key: 'ktpOrtu' as keyof FilesState, label: 'Fotocopy KTP Ayah dan Ibu', required: true },
  { key: 'kip' as keyof FilesState, label: 'Fotocopy Kartu KIP (Jika Ada)', required: false },
  { key: 'foto' as keyof FilesState, label: 'Pas Photo Siswa Ukuran 3x4', required: true },
];

export default function DaftarPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormData>(INITIAL);
  const [seragamCustom, setSeragamCustom] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [files, setFiles] = useState<FilesState>({
    ijazah: emptyFile(), akte: emptyFile(), kk: emptyFile(),
    ktpOrtu: emptyFile(), kip: emptyFile(), foto: emptyFile(),
  });
  const [setuju, setSetuju] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [authChecked, setAuthChecked] = useState(false);
  

  useEffect(() => {
    fetch('/api/auth/me').then(r => r.json()).then(d => {
      if (!d.user) { router.push('/login'); return; }
      setUserEmail(d.user.email || ''); 
      setAuthChecked(true);
    });
    fetch('/api/pendaftaran').then(r => r.json()).then(d => {
      if (d.data) router.push('/dashboard');
    });
  }, [router]);

  const set = (k: keyof FormData) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

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

  const handleNext = () => {
    if (step === 0 && !setuju) { setError('Harap centang persetujuan ketentuan'); return; }
    if (step === 1 && !form.namaLengkap) { setError('Nama lengkap wajib diisi'); return; }
    if (step === 1 && !form.jurusan) { setError('Jurusan wajib dipilih'); return; }
    if (step === 1 && !form.jenisKelamin) { setError('Jenis kelamin wajib dipilih'); return; }
    if (step === 3 && !form.asalSMP) { setError('Asal SMP/MTs wajib diisi'); return; }
    if (step === 4) {
      const missing = FILE_FIELDS.filter(f => f.required && !files[f.key].path);
      if (missing.length > 0) { setError(`File wajib belum diupload: ${missing.map(m => m.label.split(' ').slice(0,2).join(' ')).join(', ')}`); return; }
      if (FILE_FIELDS.some(f => files[f.key].uploading)) { setError('Tunggu proses upload selesai'); return; }
    }
    setError('');
    setStep(s => s + 1);
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/pendaftaran', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          userEmail,
          ttl: `${form.tempatLahir}, ${form.tanggalLahir}`,
          namaOrtu: form.namaAyah || form.namaIbu || form.namaWali,
          noOrtu: form.noHpAyah || form.noHpIbu || form.noHpWali,
          asalSekolah: form.asalSMP,
          fileIjazah: files.ijazah.path || null,
          fileAkte: files.akte.path || null,
          fileKK: files.kk.path || null,
          fileKtpOrtu: files.ktpOrtu.path || null,
          fileKip: files.kip.path || null,
          fileFoto: files.foto.path || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error); setLoading(false); return; }
      router.push('/dashboard');
    } catch {
      setError('Terjadi kesalahan jaringan');
      setLoading(false);
    }
  };

  if (!authChecked) return null;

  const inp: React.CSSProperties = { width: '100%', padding: '9px 12px', border: '1.5px solid #D1D5DB', borderRadius: 8, fontSize: 13, fontFamily: 'inherit', background: 'white', color: '#0A1628', outline: 'none' };
  const lbl: React.CSSProperties = { fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 5 };
  const grid2: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 };
  const grid3: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 };
  const onFocus = (e: React.FocusEvent<any>) => (e.target.style.borderColor = '#C8973A');
  const onBlur = (e: React.FocusEvent<any>) => (e.target.style.borderColor = '#D1D5DB');

  return (
    <div style={{ minHeight: '100vh', background: '#FAF7F0' }}>
      <header style={{ background: 'linear-gradient(180deg, #123524 0%, #0B2A1C 100%)', borderBottom: '2px solid #C8973A', padding: '0 24px' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', display: 'flex', alignItems: 'center', height: 64 }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
             <div
                                     style={{
                                       width: 36,
                                       height: 36,
                                       borderRadius: 8,
                                       overflow: "hidden",
                                       position: "relative",
                                       display: 'flex',
                                       alignItems: 'center',
                                       justifyContent: 'center'
                                     }}
                                   >
                                     <Image
                                       src="/images/logo.png"
                                       alt="Logo SMK Citra Negara"
                                       width={35}
                                       height={35}
                                       style={{ objectFit: "cover" }}
                                     />
                                   </div>
            <span style={{ color: 'white', fontWeight: 700, fontSize: 14 }}>Formulir SPMB 2026 — SMK Citra Negara</span>
          </Link>
        </div>
      </header>

      <main style={{ maxWidth: 900, margin: '0 auto', padding: '32px 24px' }}>
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

        <div style={{ background: 'white', borderRadius: 20, padding: '32px 36px', boxShadow: '0 4px 30px rgba(10,22,40,0.08)', border: '1px solid #F0EBE0' }}>
          {error && (
            <div style={{ background: '#FEE2E2', border: '1px solid #FECACA', borderRadius: 8, padding: '12px 16px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
              <AlertCircle size={16} color="#DC2626" />
              <span style={{ fontSize: 13, color: '#DC2626' }}>{error}</span>
            </div>
          )}

          {/* STEP 0: KETENTUAN */}
          {step === 0 && (
           <div>
  <h2 className="font-display" style={{ fontSize: 22, color: '#0A1628', marginBottom: 6 }}>Ketentuan Pendaftaran</h2>
  <p style={{ color: '#6B7280', fontSize: 13, marginBottom: 20 }}>Baca dan setujui ketentuan berikut sebelum melanjutkan</p>
  <div style={{ background: '#F8F9FA', borderRadius: 12, padding: 24, marginBottom: 24, maxHeight: 380, overflowY: 'auto', border: '1px solid #E5E7EB' }}>
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
    <input type="checkbox" checked={setuju} onChange={e => setSetuju(e.target.checked)} style={{ width: 18, height: 18, marginTop: 1, accentColor: '#C8973A' }} />
    <span style={{ fontSize: 13, color: '#374151', lineHeight: 1.6 }}>Saya telah membaca, memahami, dan <strong>menyetujui</strong> seluruh ketentuan pendaftaran di atas.</span>
  </label>
</div>
          )}

          {/* STEP 1: DATA PRIBADI */}
          {step === 1 && (
            <div>
              <h2 className="font-display" style={{ fontSize: 22, color: '#0A1628', marginBottom: 6 }}>Data Pribadi</h2>
              <p style={{ color: '#6B7280', fontSize: 13, marginBottom: 24 }}>Isi data pribadi calon peserta didik dengan lengkap</p>
              <div style={{ marginBottom: 16 }}>
                <label style={lbl}>Jurusan yang Dipilih *</label>
                <select style={inp} value={form.jurusan} onChange={set('jurusan')} onFocus={onFocus} onBlur={onBlur}>
                  <option value="">Pilih jurusan...</option>
                  {JURUSAN_OPTIONS.map(j => <option key={j}>{j}</option>)}
                </select>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={grid2}>
                  <div><label style={lbl}>Nama Lengkap *</label><input style={inp} value={form.namaLengkap} onChange={set('namaLengkap')} placeholder="Sesuai akte/ijazah" onFocus={onFocus} onBlur={onBlur} /></div>
                  <div><label style={lbl}>Nama Panggilan</label><input style={inp} value={form.namaPanggilan} onChange={set('namaPanggilan')} placeholder="Nama sehari-hari" onFocus={onFocus} onBlur={onBlur} /></div>
                </div>
                <div style={grid2}>
                  <div><label style={lbl}>NISN</label><input style={inp} value={form.nisn} onChange={e => { const val = e.target.value.replace(/\D/g, ''); set('nisn')({ ...e, target: { ...e.target, value: val } }); }} placeholder="10 digit NISN" maxLength={10} onFocus={onFocus} onBlur={onBlur} /></div>
                  <div><label style={lbl}>No. HP Pribadi</label><input style={inp} type="tel" value={form.noPribadi} onChange={e => { const val = e.target.value.replace(/[^\d\s+]/g, ''); set('noPribadi')({ ...e, target: { ...e.target, value: val } }); }} placeholder="08xxxxxxxxxx" onFocus={onFocus} onBlur={onBlur} /></div>
                </div>
                <div style={grid2}>
                  <div><label style={lbl}>Jenis Kelamin *</label>
                    <select style={inp} value={form.jenisKelamin} onChange={set('jenisKelamin')} onFocus={onFocus} onBlur={onBlur}>
                      <option value="">Pilih...</option><option>Laki-laki</option><option>Perempuan</option>
                    </select>
                  </div>
                  <div><label style={lbl}>Agama *</label>
                    <select style={inp} value={form.agama} onChange={set('agama')} onFocus={onFocus} onBlur={onBlur}>
                      <option value="">Pilih...</option>
                      {AGAMA_OPTIONS.map(a => <option key={a}>{a}</option>)}
                    </select>
                  </div>
                </div>
                <div style={grid2}>
                  <div><label style={lbl}>Tempat Lahir *</label><input style={inp} value={form.tempatLahir} onChange={e => { const val = e.target.value.replace(/[^a-zA-Z\s]/g, ''); set('tempatLahir')({ ...e, target: { ...e.target, value: val } }); }} placeholder="Kota tempat lahir" onFocus={onFocus} onBlur={onBlur} /></div>
                  <div><label style={lbl}>Tanggal Lahir *</label><input style={inp} type="date" value={form.tanggalLahir} onChange={set('tanggalLahir')} onFocus={onFocus} onBlur={onBlur} /></div>
                </div>
                <div style={grid3}>
                  <div><label style={lbl}>Anak Ke-</label><input style={inp} type="number" value={form.anakKe} onChange={set('anakKe')} placeholder="1" onFocus={onFocus} onBlur={onBlur} /></div>
                  <div><label style={lbl}>NIK</label><input style={inp} value={form.nik} onChange={e => { const val = e.target.value.replace(/\D/g, ''); set('nik')({ ...e, target: { ...e.target, value: val } }); }} placeholder="16 digit NIK" maxLength={16} onFocus={onFocus} onBlur={onBlur} /></div>
                 <div><label style={lbl}>Ukuran Seragam</label>
                    <select style={inp} value={seragamCustom ? 'custom' : form.ukuranSeragam} onChange={e => { if (e.target.value === 'custom') { setSeragamCustom(true); set('ukuranSeragam')({ ...e, target: { ...e.target, value: '' } }); } else { setSeragamCustom(false); set('ukuranSeragam')(e); } }} onFocus={onFocus} onBlur={onBlur}>
                      <option value="">Pilih...</option>
                      {SERAGAM_OPTIONS.map(s => <option key={s}>{s}</option>)}
                      <option value="custom">Lainnya (isi manual)...</option>
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
    <p style={{ color: '#6B7280', fontSize: 13, marginBottom: 24 }}>Isi data orang tua atau wali calon peserta didik</p>
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 600 }}>
        <thead>
          <tr>
            <th style={{ padding: '10px 12px', background: '#F8F9FA', border: '1px solid #E5E7EB', fontSize: 12, fontWeight: 700, color: '#374151', textAlign: 'left', width: 150 }}>Data</th>
            {['Ayah','Ibu','Wali'].map(col => (
              <th key={col} style={{ padding: '10px 12px', background: col==='Ayah'?'#EFF6FF':col==='Ibu'?'#FDF2F8':'#F0FDF4', border: '1px solid #E5E7EB', fontSize: 12, fontWeight: 700, color: '#374151', textAlign: 'center' }}>{col}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {[
            { label:'Nama', keys:['namaAyah','namaIbu','namaWali'] as const, ph:'Nama lengkap', filter:(v:string) => v.replace(/[^a-zA-Z\s]/g, '') },
            { label:'Tempat, Tgl Lahir', keys:['ttlAyah','ttlIbu','ttlWali'] as const, ph:'Bandung, 17 Juni 1980' },
            { label:'Pendidikan', keys:['pendidikanAyah','pendidikanIbu','pendidikanWali'] as const, ph:'S1', isSelect:true },
            { label:'Pekerjaan', keys:['pekerjaanAyah','pekerjaanIbu','pekerjaanWali'] as const, ph:'Pekerjaan', filter:(v:string) => v.replace(/[^a-zA-Z\s]/g, '') },
            { label:'Penghasilan/bulan', keys:['penghasilanAyah','penghasilanIbu','penghasilanWali'] as const, ph:'Rp', filter:(v:string) => v.replace(/[^a-zA-Z0-9,\.]/g, '') },
            { label:'No. Handphone', keys:['noHpAyah','noHpIbu','noHpWali'] as const, ph:'08xx', filter:(v:string) => v.replace(/[^\d\s+]/g, '') },
            { label:'Alamat', keys:['alamatAyah','alamatIbu','alamatWali'] as const, ph:'Alamat' },
          ].map(row => (
            <tr key={row.label}>
              <td style={{ padding:'7px 12px', border:'1px solid #E5E7EB', fontSize:12, fontWeight:600, color:'#374151', background:'#FAFAFA' }}>{row.label}</td>
              {row.keys.map(k => (
                <td key={k} style={{ padding:'5px 7px', border:'1px solid #E5E7EB' }}>
                  {row.isSelect ? (
                    <select style={{ ...inp, fontSize:12 }} value={form[k]} onChange={set(k)} onFocus={onFocus} onBlur={onBlur}>
                      <option value="">Pilih...</option>
                      {PENDIDIKAN_OPTIONS.map(p => <option key={p}>{p}</option>)}
                    </select>
                  ) : (
                    <input
                      style={{ ...inp, fontSize:12 }}
                      value={form[k]}
                      onChange={e => {
                        const val = row.filter ? row.filter(e.target.value) : e.target.value;
                        set(k)({ ...e, target: { ...e.target, value: val } });
                      }}
                      placeholder={row.ph}
                      onFocus={onFocus}
                      onBlur={onBlur}
                    />
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
)}

          {/* STEP 3: DATA AKADEMIK */}
          {step === 3 && (
            <div>
              <h2 className="font-display" style={{ fontSize: 22, color: '#0A1628', marginBottom: 6 }}>Data Akademik</h2>
              <p style={{ color: '#6B7280', fontSize: 13, marginBottom: 24 }}>Informasi riwayat pendidikan sebelumnya</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div><label style={lbl}>Asal SD/MI</label><input style={inp} value={form.asalSD} onChange={set('asalSD')} placeholder="Nama SD/MI asal" onFocus={onFocus} onBlur={onBlur} /></div>
                <div><label style={lbl}>Asal SMP/MTs *</label><input style={inp} value={form.asalSMP} onChange={set('asalSMP')} placeholder="Nama SMP/MTs asal" onFocus={onFocus} onBlur={onBlur} /></div>
                <div style={{ background: '#F0F9FF', borderRadius: 8, padding: 14, border: '1px solid #BAE6FD' }}>
                  <p style={{ fontSize: 12, color: '#0369A1', lineHeight: 1.6 }}>💡 Upload berkas fisik akan dilakukan di langkah berikutnya. </p>
                </div>
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
                    <div key={item.key} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', background: isUploaded ? '#F0FDF4' : f.error ? '#FFF1F2' : '#FAFAFA', borderRadius: 12, border: `1.5px solid ${isUploaded ? '#86EFAC' : f.error ? '#FECDD3' : '#E5E7EB'}` }}>
                      <div style={{ width: 36, height: 36, borderRadius: '50%', background: isUploaded ? '#DCFCE7' : isUploading ? '#DBEAFE' : '#F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        {isUploading ? <Loader size={16} color="#3B82F6" /> : isUploaded ? <CheckCircle size={16} color="#16A34A" /> : <Upload size={16} color="#9CA3AF" />}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>{item.label}{item.required && <span style={{ color: '#EF4444', marginLeft: 4 }}>*</span>}</div>
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
                { title: 'Data Pribadi', items: [['Nama Lengkap',form.namaLengkap],['Nama Panggilan',form.namaPanggilan],['Tempat Lahir',form.tempatLahir],['Tanggal Lahir',form.tanggalLahir],['Jenis Kelamin',form.jenisKelamin],['Agama',form.agama],['NIK',form.nik],['NISN',form.nisn],['Alamat',`${form.alamat}, RT ${form.rt}/RW ${form.rw}`],['Kecamatan',form.kecamatan],['Kab/Kota',form.kabupaten]] },
                { title: 'Data Akademik', items: [['Jurusan',form.jurusan],['Asal SD',form.asalSD],['Asal SMP',form.asalSMP]] },
                { title: 'Data Orang Tua', items: [['Nama Ayah',form.namaAyah],['Pekerjaan Ayah',form.pekerjaanAyah],['Nama Ibu',form.namaIbu],['Pekerjaan Ibu',form.pekerjaanIbu],['No. HP Ortu',form.noHpAyah||form.noHpIbu]] },
                { title: 'Berkas Upload', items: FILE_FIELDS.map((f, i) => [`${i+1}. ${f.label.split(' ').slice(1,3).join(' ')}`, files[f.key].path ? '✓ Sudah diupload' : f.required ? '✗ Belum diupload' : '— (opsional)']) },
              ].map(section => (
                <div key={section.title} style={{ marginBottom: 20 }}>
                  <h4 style={{ fontSize: 11, fontWeight: 700, color: '#C8973A', letterSpacing: 1, marginBottom: 10 }}>{section.title.toUpperCase()}</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
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
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 28, paddingTop: 20, borderTop: '1px solid #F3F4F6' }}>
            <button onClick={() => { setError(''); setStep(s => s - 1); }} disabled={step === 0} style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'transparent', border: '1.5px solid #E5E7EB', color: step === 0 ? '#9CA3AF' : '#374151', padding: '10px 22px', borderRadius: 8, cursor: step === 0 ? 'not-allowed' : 'pointer', fontSize: 14, fontWeight: 600, fontFamily: 'inherit' }}>
              <ChevronLeft size={16} /> Sebelumnya
            </button>
            {step < 5 ? (
              <button onClick={handleNext} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14 }}>
                Selanjutnya <ChevronRight size={16} />
              </button>
            ) : (
              <button onClick={handleSubmit} disabled={loading} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, opacity: loading ? 0.7 : 1 }}>
                <CheckCircle size={16} /> {loading ? 'Mengirim...' : 'Kirim Pendaftaran'}
              </button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
