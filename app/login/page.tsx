'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { GraduationCap, Eye, EyeOff, AlertCircle } from 'lucide-react';
import Image from 'next/image';

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Terjadi kesalahan');
        return;
      }

      if (data.user.role === 'admin') {
        router.push('/admin/dashboard');
      } else {
        router.push('/dashboard');
      }
    } catch {
      setError('Terjadi kesalahan jaringan');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#032511', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ width: '100%', maxWidth: 440 }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 12, textDecoration: 'none' }}>
            <div style={{
                          width: 52, height: 52,
                          borderRadius: 10,
                          overflow: 'hidden',
                          position: 'relative',
                        }}>
                          <Image
                            src="/images/logo.png"
                            alt="Logo SMK Citra Negara"
                            width={52}
                            height={52}
                            style={{ objectFit: 'cover' }}
                          />
                        </div>
            
            <div style={{ textAlign: 'left' }}>
              <div style={{ color: 'white', fontWeight: 800, fontSize: 18 }}>SMK Citra Negara</div>
              <div style={{ color: '#C8973A', fontSize: 12 }}>Portal SPMB</div>
            </div>
          </Link>
        </div>

        {/* Card */}
        <div style={{ background: 'white', borderRadius: 20, padding: 40, boxShadow: '0 25px 60px rgba(0,0,0,0.4)' }}>
          <h1 className="font-display" style={{ fontSize: 28, color: '#0A1628', marginBottom: 6 }}>Selamat Datang</h1>
          <p style={{ color: '#6B7280', fontSize: 14, marginBottom: 32 }}>Masuk ke akun SPMB Anda</p>

          {error && (
            <div style={{ background: '#FEE2E2', border: '1px solid #FECACA', borderRadius: 8, padding: '12px 16px', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 10 }}>
              <AlertCircle size={16} color="#DC2626" />
              <span style={{ fontSize: 13, color: '#DC2626' }}>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 20 }}>
              <label className="form-label" style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>Email</label>
              <input
                type="email"
                className="form-input"
                placeholder="nama@email.com"
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                required
              />
            </div>

            <div style={{ marginBottom: 28 }}>
              <label className="form-label" style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPass ? 'text' : 'password'}
                  className="form-input"
                  placeholder="Masukkan password"
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  required
                  style={{ paddingRight: 44 }}
                />
                <button type="button" onClick={() => setShowPass(!showPass)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF' }}>
                  {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn-primary" style={{ width: '100%', textAlign: 'center', padding: '13px', fontSize: 15, opacity: loading ? 0.7 : 1 }}>
              {loading ? 'Memproses...' : 'Masuk'}
            </button>
          </form>

          <div style={{ textAlign: 'center', marginTop: 24 }}>
            <p style={{ color: '#6B7280', fontSize: 13 }}>
              Belum punya akun?{' '}
              <Link href="/register" style={{ color: '#C8973A', fontWeight: 600, textDecoration: 'none' }}>Daftar Sekarang</Link>
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
