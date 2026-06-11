'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { GraduationCap, AlertCircle, CheckCircle, Upload, X, Loader, ArrowLeft } from 'lucide-react';
import Image from 'next/image';

type Pendaftaran = {
  namaLengkap: string; jurusan: string; alasanPenolakan?: string; catatan?: string;
  fileIjazah?: string; fileAkte?: string; fileKK?: string;
  fileKtpOrtu?: string; fileKip?: string; fileFoto?: string;
  revisiCount?: number;
};

type FileItem = { file: File | null; path: string; uploading: boolean; error: string };
type FilesState = { ijazah: FileItem; akte: FileItem; kk: FileItem; ktpOrtu: FileItem; kip: FileItem; foto: FileItem };
const emptyFile = (path = ''): FileItem => ({ file: null, path, uploading: false, error: '' });

const FILE_FIELDS = [
  { key: 'ijazah' as keyof FilesState, label: 'Fotocopy Ijazah yang telah dilegalisir', required: true },
  { key: 'akte' as keyof FilesState, label: 'Fotocopy Akte Kelahiran', required: true },
  { key: 'kk' as keyof FilesState, label: 'Fotocopy Kartu Keluarga', required: true },
  { key: 'ktpOrtu' as keyof FilesState, label: 'Fotocopy KTP Ayah dan Ibu', required: true },
  { key: 'kip' as keyof FilesState, label: 'Fotocopy Kartu KIP (Jika Ada)', required: false },
  { key: 'foto' as keyof FilesState, label: 'Pas Photo Siswa Ukuran 3x4', required: true },
];

const KEY_TO_FIELD: Record<keyof FilesState, keyof Pendaftaran> = {
  ijazah: 'fileIjazah', akte: 'fileAkte', kk: 'fileKK',
  ktpOrtu: 'fileKtpOrtu', kip: 'fileKip', foto: 'fileFoto',
};

export default function RevisiPage() {
  const router = useRouter();
  const [pendaftaran, setPendaftaran] = useState<Pendaftaran | null>(null);
  const [files, setFiles] = useState<FilesState>({
    ijazah: emptyFile(), akte: emptyFile(), kk: emptyFile(),
    ktpOrtu: emptyFile(), kip: emptyFile(), foto: emptyFile(),
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    fetch('/api/auth/me').then(r => r.json()).then(d => {
      if (!d.user) { router.push('/login'); return; }
    });
    fetch('/api/pendaftaran').then(r => r.json()).then(d => {
      if (!d.data) { router.push('/dashboard'); return; }
      if (d.data.status !== 'ditolak') { router.push('/dashboard'); return; }
      setPendaftaran(d.data);
      // Pre-fill existing files
      setFiles({
        ijazah: emptyFile(d.data.fileIjazah || ''),
        akte: emptyFile(d.data.fileAkte || ''),
        kk: emptyFile(d.data.fileKK || ''),
        ktpOrtu: emptyFile(d.data.fileKtpOrtu || ''),
        kip: emptyFile(d.data.fileKip || ''),
        foto: emptyFile(d.data.fileFoto || ''),
      });
    });
  }, [router]);

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
      setFiles(f => ({ ...f, [key]: { file, path: '', uploading: false, error: 'Gagal upload' } }));
    }
  };

  const handleSubmit = async () => {
    setError('');
    const missing = FILE_FIELDS.filter(f => f.required && !files[f.key].path);
    if (missing.length > 0) {
      setError(`File wajib belum diupload: ${missing.map(m => m.label.split(' ').slice(0, 2).join(' ')).join(', ')}`);
      return;
    }
    if (FILE_FIELDS.some(f => files[f.key].uploading)) {
      setError('Tunggu proses upload selesai');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/pendaftaran', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
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
      setSuccess(true);
      setTimeout(() => router.push('/dashboard'), 2000);
    } catch {
      setError('Terjadi kesalahan jaringan');
      setLoading(false);
    }
  };

  if (success) return (
    <div style={{ minHeight: '100vh', background: '#FAF7F0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center', background: 'white', borderRadius: 20, padding: 48, maxWidth: 440 }}>
        <div style={{ fontSize: 64, marginBottom: 20 }}>✅</div>
        <h2 className="font-display" style={{ fontSize: 24, color: '#0A1628', marginBottom: 10 }}>Revisi Berhasil Dikirim!</h2>
        <p style={{ color: '#6B7280', fontSize: 14 }}>Berkas Anda sudah dikirim ulang. Menunggu verifikasi admin...</p>
        <p style={{ color: '#9CA3AF', fontSize: 12, marginTop: 8 }}>Mengalihkan ke dashboard...</p>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: '#FAF7F0' }}>
      <header style={{ background: 'linear-gradient(180deg, #123524 0%, #0B2A1C 100%)', borderBottom: '2px solid #C8973A', padding: '0 24px' }}>
        <div style={{ maxWidth: 800, margin: '0 auto', display: 'flex', alignItems: 'center', height: 64, gap: 16 }}>
          <Link href="/dashboard" style={{ color: 'rgba(255,255,255,0.6)', display: 'flex', alignItems: 'center', gap: 6, textDecoration: 'none', fontSize: 13 }}>
            <ArrowLeft size={16} /> Kembali
          </Link>
          <div style={{ width: 1, height: 24, background: 'rgba(255,255,255,0.2)' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
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
            
            <span style={{ color: 'white', fontWeight: 700, fontSize: 14 }}>Revisi Berkas SPMB</span>
          </div>
        </div>
      </header>

      <main style={{ maxWidth: 800, margin: '0 auto', padding: '32px 24px' }}>
        {/* Alasan Penolakan */}
        {pendaftaran?.alasanPenolakan && (
          <div style={{ background: '#FFF7ED', border: '1.5px solid #FED7AA', borderRadius: 14, padding: 20, marginBottom: 24 }}>
            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              <AlertCircle size={20} color="#C2410C" style={{ flexShrink: 0, marginTop: 1 }} />
              <div>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: '#C2410C', marginBottom: 6 }}>Alasan Penolakan dari Admin</h3>
                <p style={{ fontSize: 14, color: '#C2410C', lineHeight: 1.6, margin: 0 }}>{pendaftaran.alasanPenolakan}</p>
                {pendaftaran.catatan && (
                  <p style={{ fontSize: 13, color: '#EA580C', marginTop: 8, fontStyle: 'italic' }}>Catatan tambahan: {pendaftaran.catatan}</p>
                )}
              </div>
            </div>
          </div>
        )}

        <div style={{ background: 'white', borderRadius: 20, padding: '32px 36px', boxShadow: '0 4px 30px rgba(10,22,40,0.08)', border: '1px solid #F0EBE0' }}>
          <h2 className="font-display" style={{ fontSize: 22, color: '#0A1628', marginBottom: 6 }}>Upload Ulang Berkas</h2>
          <p style={{ color: '#6B7280', fontSize: 13, marginBottom: 8 }}>
            Perbaiki berkas yang diminta admin. File lama tetap tersimpan, upload baru untuk mengganti.
          </p>
          {(pendaftaran?.revisiCount || 0) > 0 && (
            <p style={{ fontSize: 12, color: '#9CA3AF', marginBottom: 24 }}>Revisi ke-{(pendaftaran?.revisiCount || 0) + 1}</p>
          )}

          {error && (
            <div style={{ background: '#FEE2E2', border: '1px solid #FECACA', borderRadius: 8, padding: '12px 16px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
              <AlertCircle size={16} color="#DC2626" />
              <span style={{ fontSize: 13, color: '#DC2626' }}>{error}</span>
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 28 }}>
            {FILE_FIELDS.map(item => {
              const f = files[item.key];
              const existingPath = pendaftaran?.[KEY_TO_FIELD[item.key]] as string;
              const hasExisting = !!existingPath && !f.file;
              const isUploaded = !!f.path;
              const isUploading = f.uploading;

              return (
                <div key={item.key} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', background: isUploaded ? '#F0FDF4' : hasExisting ? '#EFF6FF' : '#FAFAFA', borderRadius: 12, border: `1.5px solid ${isUploaded ? '#86EFAC' : hasExisting ? '#BFDBFE' : '#E5E7EB'}` }}>
                  <div style={{ width: 36, height: 36, borderRadius: '50%', background: isUploaded ? '#DCFCE7' : hasExisting ? '#DBEAFE' : '#F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    {isUploading ? <Loader size={16} color="#3B82F6" /> :
                     isUploaded ? <CheckCircle size={16} color="#16A34A" /> :
                     hasExisting ? <CheckCircle size={16} color="#3B82F6" /> :
                     <Upload size={16} color="#9CA3AF" />}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>
                      {item.label}{item.required && <span style={{ color: '#EF4444', marginLeft: 4 }}>*</span>}
                    </div>
                    {isUploaded && <div style={{ fontSize: 11, color: '#16A34A', marginTop: 2 }}>✓ File baru berhasil diupload</div>}
                    {isUploading && <div style={{ fontSize: 11, color: '#3B82F6', marginTop: 2 }}>Mengupload...</div>}
                    {f.error && <div style={{ fontSize: 11, color: '#DC2626', marginTop: 2 }}>✗ {f.error}</div>}
                    {hasExisting && !isUploading && !f.error && (
                      <div style={{ fontSize: 11, color: '#3B82F6', marginTop: 2 }}>
                        File lama tersimpan — upload baru untuk mengganti
                        <a href={existingPath} target="_blank" rel="noreferrer" style={{ marginLeft: 8, color: '#1D4ED8', fontWeight: 600 }}>Lihat</a>
                      </div>
                    )}
                    {!hasExisting && !isUploaded && !isUploading && !f.error && (
                      <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 2 }}>JPG, PNG, atau PDF — maks. 2MB</div>
                    )}
                  </div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#0A1628', color: 'white', padding: '7px 14px', borderRadius: 8, cursor: isUploading ? 'not-allowed' : 'pointer', fontSize: 12, fontWeight: 600, flexShrink: 0, opacity: isUploading ? 0.6 : 1 }}>
                    <Upload size={13} /> {hasExisting || isUploaded ? 'Ganti' : 'Upload'}
                    <input type="file" accept=".jpg,.jpeg,.png,.pdf" onChange={e => handleFileChange(item.key, e)} disabled={isUploading} style={{ display: 'none' }} />
                  </label>
                </div>
              );
            })}
          </div>

          <div style={{ background: '#FEF3C7', border: '1px solid #FDE68A', borderRadius: 10, padding: 14, marginBottom: 24 }}>
            <p style={{ fontSize: 12, color: '#92400E', lineHeight: 1.6, margin: 0 }}>
              ✓ File yang tidak diganti akan tetap menggunakan file lama. Setelah dikirim, status akan kembali ke <strong>Menunggu Verifikasi</strong>.
            </p>
          </div>

          <button onClick={handleSubmit} disabled={loading} className="btn-primary" style={{ width: '100%', textAlign: 'center', padding: '13px', fontSize: 15, opacity: loading ? 0.7 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <CheckCircle size={18} /> {loading ? 'Mengirim Revisi...' : 'Kirim Ulang Berkas'}
          </button>
        </div>
      </main>
    </div>
  );
}
