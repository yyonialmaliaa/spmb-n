'use client';
import { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Eye, EyeOff, AlertCircle } from 'lucide-react';
import Image from 'next/image';
import { isAdminRole, normalizeRole } from '@/lib/permissions';
import { NAMA_INSTITUSI } from '@/lib/labels';
import '../admin/admin.css';

/**
 * Ke mana diarahkan setelah berhasil masuk.
 *
 * proxy.ts sudah menyimpan halaman yang TADINYA dituju ke `?next=` ketika
 * seseorang membuka tautan dalam tanpa sesi — tapi dulu nilai itu diabaikan
 * di sini, jadi setelah masuk orang selalu dibuang ke dashboard umum, bukan
 * ke halaman yang ia klik. Dua penjagaan:
 *
 *  1. Hanya path internal yang diterima ("/..." dan bukan "//"), supaya
 *     `?next=` tidak bisa dipakai melempar orang ke situs luar.
 *  2. Area harus cocok dengan perannya. Mengirim admin ke /dashboard (atau
 *     pendaftar ke /admin) hanya akan dipantulkan lagi oleh proxy — jadi
 *     untuk kasus itu pakai beranda perannya sendiri.
 */
function tujuanSetelahMasuk(next: string | null, keAdmin: boolean): string {
  const bawaan = keAdmin ? '/admin/dashboard' : '/dashboard';
  if (!next || !next.startsWith('/') || next.startsWith('//')) return bawaan;
  if (next.startsWith('/admin') !== keAdmin) return bawaan;
  return next;
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginInner />
    </Suspense>
  );
}

function LoginInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
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

      // Ketiga role admin (Super Admin, Admin SPMB, Admin Keuangan) pulang ke
      // halaman Pilih Jenjang; pendaftar ke portal siswa — KECUALI kalau tadi
      // memang sedang menuju halaman tertentu (?next=), lanjutkan ke sana.
      const keAdmin = isAdminRole(normalizeRole(data.user.role));
      router.push(tujuanSetelahMasuk(searchParams.get('next'), keAdmin));
    } catch {
      setError('Terjadi kesalahan jaringan');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="adm-root auth-shell"
      style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center',
        justifyContent: 'center', padding: 24,
      }}
    >
      <div style={{ width: '100%', maxWidth: 420 }}>
        <div style={{ textAlign: 'center', marginBottom: 26 }}>
          <Link href="/" style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
            <Image src="/images/logo-yatkj.png" alt="Logo Yayasan At-Taqwa Kemiri Jaya" width={900} height={362} priority style={{ width: 190, height: 'auto', maxWidth: '100%' }} />
            <span style={{ textAlign: 'center' }}>
              <span style={{ display: 'block', color: 'var(--adm-text)', fontWeight: 800, fontSize: 17, letterSpacing: '-0.02em' }}>
                {NAMA_INSTITUSI.toUpperCase()}
              </span>
              <span style={{ display: 'block', color: 'var(--adm-secondary)', fontSize: 10.5, fontWeight: 700, letterSpacing: '0.09em' }}>
                PORTAL SPMB
              </span>
            </span>
          </Link>
        </div>

        <div className="adm-card" style={{ padding: 32, boxShadow: 'var(--adm-shadow-lg)' }}>
          <h1 style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.025em', color: 'var(--adm-text)' }}>
            Selamat Datang
          </h1>
          <p style={{ color: 'var(--adm-text-muted)', fontSize: 13.5, marginTop: 5, marginBottom: 24 }}>
            Masuk untuk melanjutkan ke portal SPMB.
          </p>

          {error && (
            <div className="adm-banner adm-banner--danger" style={{ marginBottom: 18 }}>
              <AlertCircle size={15} style={{ flexShrink: 0, marginTop: 1 }} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 16 }}>
              <label className="adm-label" htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                className="adm-input"
                placeholder="nama@email.com"
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                required
              />
            </div>

            <div style={{ marginBottom: 22 }}>
              <label className="adm-label" htmlFor="password">Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  id="password"
                  type={showPass ? 'text' : 'password'}
                  className="adm-input"
                  placeholder="Masukkan password"
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  required
                  style={{ paddingRight: 42 }}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  aria-label={showPass ? 'Sembunyikan password' : 'Tampilkan password'}
                  style={{
                    position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: 'var(--adm-text-faint)', display: 'flex', padding: 4,
                  }}
                >
                  {showPass ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="adm-btn adm-btn--hijau"
              style={{ width: '100%', padding: '11px', fontSize: 14 }}
            >
              {loading ? 'Memproses…' : 'Masuk'}
            </button>
          </form>

          <p style={{ textAlign: 'center', marginTop: 20, color: 'var(--adm-text-muted)', fontSize: 13 }}>
            Belum punya akun?{' '}
            <Link href="/register" style={{ color: 'var(--adm-secondary)', fontWeight: 650, textDecoration: 'none' }}>
              Daftar Sekarang
            </Link>
          </p>
        </div>

        <p style={{ textAlign: 'center', color: 'var(--adm-text-faint)', fontSize: 11.5, marginTop: 20 }}>
          © {new Date().getFullYear()} {NAMA_INSTITUSI}. All rights reserved.
          <br />
          Website developed by Yoni Al&apos;fiani Amalia
        </p>
      </div>
    </div>
  );
}
