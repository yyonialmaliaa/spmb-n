'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, AlertCircle, CheckCircle } from 'lucide-react';
import Image from 'next/image';

const JENJANG_OPTIONS = [
  { value: 'smp', label: 'SMP' },
  { value: 'sma', label: 'SMA' },
  { value: 'smk', label: 'SMK' },
];

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ namaLengkap: '', email: '', jenjang: '', password: '', konfirmasi: '' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!form.jenjang) {
      setError('Jenjang pendidikan wajib dipilih');
      return;
    }
    if (form.password !== form.konfirmasi) {
      setError('Password dan konfirmasi password tidak cocok');
      return;
    }
    if (form.password.length < 8) {
      setError('Password minimal 8 karakter');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: form.email, password: form.password, namaLengkap: form.namaLengkap, jenjang: form.jenjang }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Terjadi kesalahan');
        return;
      }
      // Akun sudah otomatis login (cookie sesi di-set server) — arahkan ke
      // Dashboard, BUKAN langsung ke formulir (section 3 alur registrasi).
      router.push('/dashboard');
    } catch {
      setError('Terjadi kesalahan jaringan');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-shell" style={{ minHeight: '100vh', background: '#032511', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ width: '100%', maxWidth: 480 }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 12, textDecoration: 'none' }}>
            <div style={{ width: 48, height: 48, borderRadius: 10, overflow: 'hidden', position: 'relative' }}>
              <Image src="/images/logo.png" alt="Logo SMK Citra Negara" width={48} height={48} style={{ objectFit: 'cover' }} />
            </div>
            <div style={{ textAlign: 'left' }}>
              <div style={{ color: 'white', fontWeight: 800, fontSize: 17 }}>SMK Citra Negara</div>
              <div style={{ color: '#C8973A', fontSize: 12 }}>Registrasi SPMB</div>
            </div>
          </Link>
        </div>

        <div className="auth-card" style={{ background: 'white', borderRadius: 16, padding: 36, border: '1px solid rgba(200,151,58,0.15)', boxShadow: '0 20px 50px rgba(0,0,0,0.3)' }}>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#0A1628', marginBottom: 6 }}>Buat Akun SPMB</h1>
          <p style={{ color: '#6B7280', fontSize: 13.5, lineHeight: 1.6, marginBottom: 28 }}>Daftarkan akun untuk memulai proses penerimaan murid baru SMK Citra Negara.</p>

          {error && (
            <div style={{ background: '#FEE2E2', border: '1px solid #FECACA', borderRadius: 8, padding: '12px 16px', marginBottom: 22, display: 'flex', alignItems: 'center', gap: 10 }}>
              <AlertCircle size={16} color="#DC2626" />
              <span style={{ fontSize: 13, color: '#DC2626' }}>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>Nama Lengkap</label>
              <input type="text" className="form-input" placeholder="Nama lengkap sesuai KTP/Akte" value={form.namaLengkap} onChange={e => setForm({ ...form, namaLengkap: e.target.value })} required />
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>Email</label>
              <input type="email" className="form-input" placeholder="email@contoh.com" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>Jenjang Pendidikan</label>
              <select className="form-input" value={form.jenjang} onChange={e => setForm({ ...form, jenjang: e.target.value })} required>
                <option value="">Pilih jenjang pendidikan</option>
                {JENJANG_OPTIONS.map(j => (
                  <option key={j.value} value={j.value}>{j.label}</option>
                ))}
              </select>
              <p style={{ fontSize: 11.5, color: '#9CA3AF', marginTop: 5 }}>Jenjang ini akan menjadi acuan formulir pendaftaran Anda.</p>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>Password</label>
              <div style={{ position: 'relative' }}>
                <input type={showPass ? 'text' : 'password'} className="form-input" placeholder="Min. 8 karakter" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required style={{ paddingRight: 44 }} />
                <button type="button" onClick={() => setShowPass(!showPass)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF' }}>
                  {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div style={{ marginBottom: 26 }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>Konfirmasi Password</label>
              <input type="password" className="form-input" placeholder="Ulangi password" value={form.konfirmasi} onChange={e => setForm({ ...form, konfirmasi: e.target.value })} required />
              {form.konfirmasi && form.password === form.konfirmasi && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6 }}>
                  <CheckCircle size={14} color="#16A34A" />
                  <span style={{ fontSize: 12, color: '#16A34A' }}>Password cocok</span>
                </div>
              )}
            </div>

            <button type="submit" disabled={loading} className="btn-primary" style={{ width: '100%', textAlign: 'center', padding: '13px', fontSize: 15, opacity: loading ? 0.7 : 1 }}>
              {loading ? 'Mendaftarkan...' : 'Buat Akun'}
            </button>
          </form>

          <div style={{ textAlign: 'center', marginTop: 22 }}>
            <p style={{ color: '#6B7280', fontSize: 13 }}>
              Sudah memiliki akun?{' '}
              <Link href="/login" style={{ color: '#C8973A', fontWeight: 600, textDecoration: 'none' }}>Masuk</Link>
            </p>
          </div>
        </div>

        <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.4)', fontSize: 12, marginTop: 24 }}>
          © 2026 SMK Citra Negara
        </p>
      </div>
    </div>
  );
}
