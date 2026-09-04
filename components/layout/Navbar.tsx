'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { Menu, X } from 'lucide-react';
import { isAdminRole, normalizeRole } from '@/lib/permissions';

// ─── Types ───────────────────────────────────────────────────────────────────

interface Session {
  role: string;
  namaLengkap?: string;
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const CSS = `
  /* ── Responsive nav (ganti reliance ke class Tailwind yang nggak jalan) ── */
  .desktop-nav-group { display: flex; }
  .mobile-toggle-btn { display: none; }
  @media (max-width: 900px) {
    .desktop-nav-group { display: none !important; }
    .mobile-toggle-btn { display: flex !important; }
  }
`;

// ─── Main Component ───────────────────────────────────────────────────────────

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled,   setScrolled]   = useState(false);
  const [session,    setSession]    = useState<Session | null>(null);

  // Scroll listener + session fetch
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);

    fetch('/api/auth/me')
      .then(r => r.json())
      .then(d => { if (d.user) setSession(d.user); })
      .catch(() => {});

    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.href = '/';
  };

  const closeMobile = () => setMobileOpen(false);

  return (
    <>
      <style>{CSS}</style>

      <nav style={{
        background: scrolled ? 'var(--adm-kaca-pekat)' : 'var(--adm-surface)',
        backdropFilter: 'var(--adm-blur)',
        WebkitBackdropFilter: 'var(--adm-blur)',
        borderBottom: '1px solid var(--adm-border)',
        position: 'sticky', top: 0, zIndex: 100,
        transition: 'background 0.3s',
      }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 70 }}>

            {/* ── Logo ── */}
            <Link href="/spmb" style={{ display: 'flex', alignItems: 'center', gap: 12, textDecoration: 'none', flexShrink: 0 }}>
              <div style={{ width: 44, height: 44, borderRadius: 10, overflow: 'hidden' }}>
                <Image src="/images/logo.png" alt="Logo SMK Citra Negara" width={44} height={44} style={{ objectFit: 'cover' }} />
              </div>
              <div>
                <div style={{ color: 'var(--adm-text)', fontWeight: 800, fontSize: 16, lineHeight: 1.2 }}>SMK Citra Negara</div>
                <div style={{ color: 'var(--cn-emas)', fontSize: 11, fontWeight: 500 }}>Pilihan Tepat di Sekolah yang MANTAP</div>
              </div>
            </Link>

            {/* ── Auth Buttons (Desktop) ── */}
            <div className="desktop-nav-group" style={{ alignItems: 'center', gap: 10, flexShrink: 0 }}>
              {session ? (
                <>
                  <Link
                    href={isAdminRole(normalizeRole(session.role)) ? '/admin/dashboard' : '/dashboard'}
                    style={{ color: 'var(--cn-hijau)', fontSize: 14, fontWeight: 600, textDecoration: 'none' }}
                  >
                    {session.namaLengkap || 'Dashboard'}
                  </Link>
                  <button onClick={handleLogout} style={{
                    background: 'transparent', border: '1px solid var(--adm-border-strong)',
                    color: 'var(--adm-text-muted)', padding: '7px 16px',
                    borderRadius: 6, cursor: 'pointer', fontSize: 13,
                  }}>
                    Keluar
                  </button>
                </>
              ) : (
                <>
                  <Link href="/login" style={{
                    color: 'var(--adm-text-muted)', textDecoration: 'none',
                    fontSize: 14, fontWeight: 500, padding: '8px 16px',
                  }}>
                    Masuk
                  </Link>
                  <Link href="/register" className="btn-primary" style={{ padding: '9px 20px', fontSize: 13 }}>
                    Daftar Sekarang
                  </Link>
                </>
              )}
            </div>

            {/* ── Mobile Toggle ── */}
            <button
              onClick={() => setMobileOpen(v => !v)}
              className="mobile-toggle-btn"
              style={{ background: 'none', border: 'none', color: 'var(--adm-text)', cursor: 'pointer', alignItems: 'center' }}
            >
              {mobileOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* ── Mobile Menu ── */}
        {mobileOpen && (
          <div style={{ background: 'var(--adm-surface)', padding: '8px 24px 24px', borderTop: '1px solid var(--adm-border)' }}>
            {/* Auth (Mobile) */}
            <div style={{ marginTop: 16, display: 'flex', gap: 10 }}>
              {session ? (
                <Link
                  href={isAdminRole(normalizeRole(session.role)) ? '/admin/dashboard' : '/dashboard'}
                  onClick={closeMobile}
                  style={{ color: 'var(--cn-hijau)', fontSize: 14, fontWeight: 600, textDecoration: 'none' }}
                >
                  Dashboard
                </Link>
              ) : (
                <>
                  <Link href="/login" onClick={closeMobile} style={{
                    flex: 1, textAlign: 'center', padding: '10px',
                    border: '1px solid var(--adm-border-strong)',
                    borderRadius: 8, color: 'var(--adm-text)', textDecoration: 'none', fontSize: 14,
                  }}>
                    Masuk
                  </Link>
                  <Link href="/register" onClick={closeMobile} className="btn-primary"
                    style={{ flex: 1, textAlign: 'center', padding: '10px', fontSize: 14 }}>
                    Daftar
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </nav>
    </>
  );
}
