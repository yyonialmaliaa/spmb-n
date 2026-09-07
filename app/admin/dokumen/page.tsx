'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ChevronLeft, Upload, FileText, ExternalLink } from 'lucide-react';

type Dokumen = { id: string; jenjang: string; jenis: string; nama: string; url?: string; namaFile?: string };

const JENJANG_TABS: { value: 'smp' | 'sma' | 'smk'; label: string }[] = [
  { value: 'smp', label: 'SMP' },
  { value: 'sma', label: 'SMA' },
  { value: 'smk', label: 'SMK' },
];

export default function AdminDokumenPage() {
  const [jenjang, setJenjang] = useState<'smp' | 'sma' | 'smk'>('smp');
  const [list, setList] = useState<Dokumen[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadingKey, setUploadingKey] = useState('');
  const [toast, setToast] = useState('');

  const load = (j: string) => {
    setLoading(true);
    fetch(`/api/dokumen?jenjang=${j}`).then(r => r.json()).then(d => {
      setList(d.data || []);
      setLoading(false);
    });
  };
  useEffect(() => { load(jenjang); }, [jenjang]);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 2500); };

  const handleUpload = async (doc: Dokumen, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { showToast('❌ Ukuran file maksimal 5MB'); return; }
    setUploadingKey(doc.jenis);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('fieldName', `${jenjang}-${doc.jenis}`);
      const res = await fetch('/api/upload', { method: 'POST', body: fd });
      const d = await res.json();
      if (!res.ok) { showToast(`❌ ${d.error || 'Gagal upload'}`); setUploadingKey(''); return; }

      const res2 = await fetch('/api/admin/dokumen', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jenjang, jenis: doc.jenis, nama: doc.nama, url: d.path, namaFile: file.name }),
      });
      if (res2.ok) { showToast('✅ Dokumen berhasil diupload'); load(jenjang); }
      else showToast('❌ Gagal menyimpan dokumen');
    } catch {
      showToast('❌ Gagal upload, coba lagi');
    }
    setUploadingKey('');
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--adm-bg)' }}>
      {toast && <div style={{ position: 'fixed', top: 24, right: 24, background: 'var(--adm-primary)', color: 'var(--adm-text-invert)', padding: '12px 20px', borderRadius: 10, fontSize: 13, fontWeight: 600, zIndex: 9999 }}>{toast}</div>}

      <div style={{ background: 'var(--adm-primary)', padding: '16px 24px' }}>
        <div style={{ maxWidth: 800, margin: '0 auto', display: 'flex', alignItems: 'center', gap: 12 }}>
          <Link href="/admin/dashboard" style={{ color: 'rgba(255,255,255,0.7)', display: 'flex', alignItems: 'center' }}>
            <ChevronLeft size={20} />
          </Link>
          <h1 style={{ color: 'var(--adm-text-invert)', fontSize: 16, fontWeight: 700, margin: 0 }}>Dokumen Persyaratan Daftar Ulang</h1>
        </div>
      </div>

      <div style={{ maxWidth: 800, margin: '32px auto', padding: '0 24px' }}>
        <p style={{ color: 'var(--adm-text-muted)', fontSize: 13, marginBottom: 20, lineHeight: 1.6 }}>
          Isi dokumen berbeda-beda untuk tiap jenjang, jadi upload terpisah per jenjang di bawah ini. Setelah diupload, dokumen otomatis muncul di dashboard siswa <strong>jenjang yang sama</strong> yang sudah diterima (Terima Berkas), untuk didownload, diisi/ditandatangani, lalu dibawa ke sekolah.
        </p>

        {/* Tab jenjang */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
          {JENJANG_TABS.map(t => (
            <button
              key={t.value}
              onClick={() => setJenjang(t.value)}
              style={{
                padding: '9px 22px', borderRadius: 10, border: jenjang === t.value ? '2px solid var(--adm-secondary)' : '1.5px solid var(--adm-text-faint)',
                background: jenjang === t.value ? 'var(--adm-warning-weak)' : 'var(--adm-surface)', color: jenjang === t.value ? 'var(--adm-warning)' : 'var(--adm-text-muted)',
                fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit',
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 40, color: 'var(--adm-text-faint)' }}>Memuat...</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {list.map(doc => (
              <div key={doc.jenis} style={{ background: 'var(--adm-surface)', borderRadius: 12, padding: 20, border: '1px solid var(--adm-border)', display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                <div style={{ width: 40, height: 40, background: doc.url ? 'var(--adm-success-weak)' : 'var(--adm-surface-alt)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <FileText size={18} color={doc.url ? 'var(--adm-success)' : 'var(--adm-text-faint)'} />
                </div>
                <div style={{ flex: 1, minWidth: 200 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--adm-text)' }}>{doc.nama}</div>
                  {doc.url ? (
                    <a href={doc.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: 'var(--adm-secondary)', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 4, marginTop: 4 }}>
                      {doc.namaFile || 'Lihat file'} <ExternalLink size={11} />
                    </a>
                  ) : (
                    <div style={{ fontSize: 12, color: 'var(--adm-danger)', marginTop: 4 }}>Belum ada file diupload untuk jenjang {jenjang.toUpperCase()}</div>
                  )}
                </div>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 16px', background: 'var(--adm-primary)', color: 'var(--adm-text-invert)', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: uploadingKey === doc.jenis ? 'wait' : 'pointer', fontFamily: 'inherit' }}>
                  <Upload size={14} />
                  {uploadingKey === doc.jenis ? 'Mengupload...' : (doc.url ? 'Ganti File' : 'Upload File')}
                  <input type="file" accept=".doc,.docx,.pdf" onChange={e => handleUpload(doc, e)} disabled={uploadingKey === doc.jenis} style={{ display: 'none' }} />
                </label>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
