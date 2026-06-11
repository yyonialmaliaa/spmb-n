'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Menu, X, ChevronDown } from 'lucide-react';


// ─── Data ────────────────────────────────────────────────────────────────────

const JURUSAN_LIST = [
  { kode: 'PPLG', nama: 'Pengembangan Perangkat Lunak & Gim',        singkat: 'Web, mobile, database & UI/UX',        color: '#1E3A5F', logo: '/images/logopplg.png', href: '/jurusan#pplg' },
  { kode: 'TJKT', nama: 'Teknik Jaringan Komputer & Telekomunikasi', singkat: 'Jaringan, keamanan & infrastruktur',     color: '#3a96d0', logo: '/images/logotjkt.png', href: '/jurusan#tjkt' },
  { kode: 'DKV',  nama: 'Desain Komunikasi Visual',                  singkat: 'Grafis, animasi & multimedia kreatif',  color: '#DC2626', logo: '/images/logodkv.png', href: '/jurusan#dkv'  },
  { kode: 'PM',   nama: 'Pemasaran',                                 singkat: 'Strategi, digital marketing & sales',   color: '#92681A', logo: '/images/logopm.png', href: '/jurusan#pm'   },
  { kode: 'MPLB', nama: 'Manajemen Perkantoran & Layanan Bisnis',    singkat: 'Administrasi, sekretaris & bisnis',     color: '#b59a00', logo: '/images/logomplb.png', href: '/jurusan#mplb' },
  { kode: 'PH',   nama: 'Perhotelan',                                singkat: 'Hospitality, restoran & pariwisata',    color: '#024d20', logo: '/images/logoph.png', href: '/jurusan#ph'   },
];

const ESKUL_LIST = [
  { nama: 'Paskibra',   href: '/eskul/paskibra'  },
  { nama: 'Futsal',     href: '/eskul/futsal'    },
  { nama: 'Taekwondo',  href: '/eskul/taekwondo' },
  { nama: 'Basket',     href: '/eskul/basket'    },
  { nama: 'Voli',       href: '/eskul/voli'      },
  { nama: 'Theater',    href: '/eskul/theater'   },
  { nama: 'Tari',       href: '/eskul/tari'      },
  { nama: 'Pramuka',    href: '/eskul/pramuka'   },
  { nama: 'IT Club',    href: '/eskul/itclub'    },
  { nama: 'Band',       href: '/eskul/band'      },
  { nama: 'IRMA',       href: '/eskul/irma'      },
  { nama: 'E-Sport',    href: '/eskul/esport'    },
  { nama: 'CN Gakuen',  href: '/eskul/cngakuen'  },
  { nama: 'Silat',      href: '/eskul/silat'     },
];

// ─── Types ───────────────────────────────────────────────────────────────────

interface Session {
  role: string;
  namaLengkap?: string;
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const NAV_LINK: React.CSSProperties = {
  color: 'rgba(255,255,255,0.85)',
  textDecoration: 'none',
  padding: '8px 14px',
  borderRadius: 6,
  fontSize: 14,
  fontWeight: 500,
  transition: 'all 0.2s',
};

const MOBILE_LINK: React.CSSProperties = {
  display: 'block',
  color: 'rgba(255,255,255,0.85)',
  textDecoration: 'none',
  padding: '10px 0',
  borderBottom: '1px solid rgba(255,255,255,0.05)',
  fontSize: 14,
};

const CSS = `
  @keyframes dropFadeIn {
    from { opacity: 0; transform: translateY(-8px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .drop-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 4px;
  }
  .eskul-grid {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    gap: 8px 12px;
  }
  @media (max-width: 640px) {
    .drop-grid  { grid-template-columns: 1fr; }
    .eskul-grid { grid-template-columns: 1fr 1fr; }
  }
  .drop-item {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 12px;
    border-radius: 10px;
    text-decoration: none;
    border: 1px solid transparent;
    transition: background 0.15s, border-color 0.15s;
  }
  .drop-item:hover {
    background: #FAF7F0;
    border-color: #E8DCC8;
  }
  .eskul-text-item {
    display: flex;
    align-items: center;
    padding: 6px 8px;
    border-radius: 8px;
    text-decoration: none;
    color: #1F2937;
    font-size: 13px;
    font-weight: 500;
    transition: background 0.15s;
  }
  .eskul-text-item:hover { background: #FAF7F0; }
`;

// ─── Sub-components ───────────────────────────────────────────────────────────

function DropdownArrow({ left = '45%' }: { left?: string }) {
  return (
    <div style={{
      position: 'absolute',
      top: -7, left,
      transform: 'translateX(-50%) rotate(45deg)',
      width: 13, height: 13,
      background: 'white',
      border: '1px solid #F0EBE0',
      borderBottom: 'none', borderRight: 'none',
    }} />
  );
}

function DropdownPanel({ children, triggerRef, panelWidth = 560, id }: {
  children: React.ReactNode;
  triggerRef: React.RefObject<HTMLDivElement | null>;
  panelWidth?: number;
  id: string;
}) {
  const [style, setStyle] = useState<React.CSSProperties>({ visibility: 'hidden', position: 'fixed' });
  const [arrowLeft, setArrowLeft] = useState(0);

  useEffect(() => {
    if (!triggerRef.current) return;

    const update = () => {
      const triggerRect = triggerRef.current!.getBoundingClientRect();
      const vw = window.innerWidth;
      const MARGIN = 12;
      const width = Math.min(panelWidth, vw - MARGIN * 2);

      // Center panel under trigger button
      let left = triggerRect.left + triggerRect.width / 2 - width / 2;
      // Clamp so it never goes off-screen
      left = Math.max(MARGIN, Math.min(left, vw - width - MARGIN));

      // Arrow always points at the trigger center
      setArrowLeft((triggerRect.left + triggerRect.width / 2) - left);

      setStyle({
        position: 'fixed',
        top: triggerRect.bottom + 10,
        left,
        width,
        visibility: 'visible',
      });
    };

    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, [triggerRef, panelWidth]);

  if (typeof window === 'undefined') return null;

  return createPortal(
    <div style={{
      ...style,
      background: 'white',
      borderRadius: 14,
      boxShadow: '0 16px 48px rgba(0,0,0,0.16)',
      border: '1px solid #F0EBE0',
      padding: '14px',
      zIndex: 99999,
      animation: 'dropFadeIn 0.15s ease',
    }}
    data-dropdown={id}>
      {/* Arrow always points at trigger center */}
      <div style={{
        position: 'absolute',
        top: -7,
        left: arrowLeft,
        transform: 'translateX(-50%) rotate(45deg)',
        width: 13, height: 13,
        background: 'white',
        border: '1px solid #F0EBE0',
        borderBottom: 'none', borderRight: 'none',
      }} />
      {children}
    </div>,
    document.body
  );
}

function NavButton({
  label, isOpen, onClick,
}: {
  label: string;
  isOpen: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        ...NAV_LINK,
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: 5,
        color: isOpen ? '#C8973A' : 'rgba(255,255,255,0.85)',
      }}
    >
      {label}
      <ChevronDown
        size={14}
        style={{ transition: 'transform 0.2s', transform: isOpen ? 'rotate(180deg)' : 'rotate(0)' }}
      />
    </button>
  );
}

function MobileAccordionButton({
  label, isOpen, onClick,
}: {
  label: string;
  isOpen: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        ...MOBILE_LINK,
        background: 'none', border: 'none', width: '100%',
        textAlign: 'left', cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}
    >
      <span>{label}</span>
      <ChevronDown
        size={16}
        style={{ transition: 'transform 0.2s', transform: isOpen ? 'rotate(180deg)' : 'rotate(0)', color: '#C8973A' }}
      />
    </button>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function Navbar() {
  const [mobileOpen,     setMobileOpen]     = useState(false);
  const [scrolled,       setScrolled]       = useState(false);
  const [jurusanOpen,    setJurusanOpen]    = useState(false);
  const [eskulOpen,      setEskulOpen]      = useState(false);
  const [mobileJurusan,  setMobileJurusan]  = useState(false);
  const [mobileEskul,    setMobileEskul]    = useState(false);
  const [session,        setSession]        = useState<Session | null>(null);

  const jurusanRef = useRef<HTMLDivElement>(null);
  const eskulRef   = useRef<HTMLDivElement>(null);

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

  // Close dropdowns on outside click
  // NOTE: panels are portaled to document.body, so we use data attributes to detect them
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      const inJurusan = jurusanRef.current?.contains(target) || (target as HTMLElement).closest?.('[data-dropdown="jurusan"]');
      const inEskul   = eskulRef.current?.contains(target)   || (target as HTMLElement).closest?.('[data-dropdown="eskul"]');
      if (!inJurusan) setJurusanOpen(false);
      if (!inEskul)   setEskulOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
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
        background: scrolled ? '#145A45' : '#0B3D2E',
        borderBottom: '2px solid #C8973A',
        position: 'sticky', top: 0, zIndex: 100,
        transition: 'background 0.3s',
      }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 70 }}>

            {/* ── Logo ── */}
            <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 12, textDecoration: 'none', flexShrink: 0 }}>
              <div style={{ width: 44, height: 44, borderRadius: 10, overflow: 'hidden' }}>
                <Image src="/images/logo.png" alt="Logo SMK Citra Negara" width={44} height={44} style={{ objectFit: 'cover' }} />
              </div>
              <div>
                <div style={{ color: 'white', fontWeight: 800, fontSize: 16, lineHeight: 1.2 }}>SMK Citra Negara</div>
                <div style={{ color: '#C8973A', fontSize: 11, fontWeight: 500 }}>Pilihan Tepat di Sekolah yang MANTAP</div>
              </div>
            </Link>

            {/* ── Desktop Nav ── */}
            <div className="hidden md:flex" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>

              <NavLink href="/">Beranda</NavLink>
              <NavLink href="/tentang">Tentang Kami</NavLink>

              {/* Program Keahlian */}
              <div ref={jurusanRef} style={{ position: 'relative' }}>
                <NavButton label="Program Keahlian" isOpen={jurusanOpen} onClick={() => setJurusanOpen(v => !v)} />

                {jurusanOpen && (
                  <DropdownPanel triggerRef={jurusanRef} panelWidth={560} id="jurusan">
                    <p style={{ fontSize: 11, color: '#9CA3AF', fontWeight: 700, letterSpacing: 1, marginBottom: 8, paddingLeft: 2 }}>
                      6 PROGRAM KEAHLIAN
                    </p>
                    <div className="drop-grid">
                      {JURUSAN_LIST.map(j => (
                        <Link key={j.kode} href={j.href} className="drop-item" onClick={() => setJurusanOpen(false)}>
                         <div
  style={{
    width: 38,
    height: 38,
    borderRadius: 9,
    background: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    border: '1px solid #eee'
  }}
>
  <Image
    src={j.logo}
    alt={j.kode}
    width={30}
    height={30}
    style={{
      objectFit: 'contain'
    }}
  />
</div>
                          <div style={{ minWidth: 0 }}>
                            <span style={{
                              display: 'inline-block', marginBottom: 2,
                              fontSize: 10, fontWeight: 700,
                              background: '#C8973A', color: '#0A1628',
                              padding: '1px 7px', borderRadius: 4,
                            }}>
                              {j.kode}
                            </span>
                            <div style={{ fontSize: 12, fontWeight: 600, color: '#1F2937', lineHeight: 1.35 }}>{j.nama}</div>
                            <div style={{ fontSize: 11, color: '#6B7280' }}>{j.singkat}</div>
                          </div>
                        </Link>
                      ))}
                    </div>
                    <div style={{
                      marginTop: 10, paddingTop: 10,
                      borderTop: '1px solid #F0EBE0',
                      display: 'flex', alignItems: 'center',
                      justifyContent: 'space-between', flexWrap: 'wrap', gap: 8,
                    }}>
                      <span style={{ fontSize: 12, color: '#9CA3AF' }}>288 siswa · Akreditasi A (Unggul)</span>
                      <Link href="/jurusan" onClick={() => setJurusanOpen(false)} style={{
                        fontSize: 12, fontWeight: 700, color: '#0B3D2E', textDecoration: 'none',
                        background: '#FAF7F0', padding: '5px 14px', borderRadius: 20,
                        border: '1px solid #E8DCC8', whiteSpace: 'nowrap',
                      }}>
                        Lihat Semua →
                      </Link>
                    </div>
                  </DropdownPanel>
                )}
              </div>

              {/* Ekstrakurikuler */}
              <div ref={eskulRef} style={{ position: 'relative' }}>
                <NavButton label="Ekstrakurikuler" isOpen={eskulOpen} onClick={() => setEskulOpen(v => !v)} />

                {eskulOpen && (
                  <DropdownPanel triggerRef={eskulRef} panelWidth={480} id="eskul">
                    <p style={{ fontSize: 11, color: '#9CA3AF', fontWeight: 700, letterSpacing: 1, marginBottom: 12, paddingLeft: 2 }}>
                      14+ EKSTRAKURIKULER
                    </p>
                    <div className="eskul-grid">
                      {ESKUL_LIST.map(e => (
                        <Link key={e.nama} href={e.href} className="eskul-text-item" onClick={() => setEskulOpen(false)}>
                          {e.nama}
                        </Link>
                      ))}
                    </div>
                  </DropdownPanel>
                )}
              </div>

              <NavLink href="/prestasi">Prestasi</NavLink>
              <NavLink href="/spmb">SPMB</NavLink>
            </div>

            {/* ── Auth Buttons (Desktop) ── */}
            <div className="hidden md:flex" style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
              {session ? (
                <>
                  <Link
                    href={session.role === 'admin' ? '/admin/dashboard' : '/dashboard'}
                    style={{ color: '#C8973A', fontSize: 14, fontWeight: 600, textDecoration: 'none' }}
                  >
                    {session.namaLengkap || 'Dashboard'}
                  </Link>
                  <button onClick={handleLogout} style={{
                    background: 'transparent', border: '1px solid rgba(255,255,255,0.3)',
                    color: 'rgba(255,255,255,0.7)', padding: '7px 16px',
                    borderRadius: 6, cursor: 'pointer', fontSize: 13,
                  }}>
                    Keluar
                  </button>
                </>
              ) : (
                <>
                  <Link href="/login" style={{
                    color: 'rgba(255,255,255,0.8)', textDecoration: 'none',
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
              className="md:hidden block"
              style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', display: 'none' }}
            >
              {mobileOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* ── Mobile Menu ── */}
        {mobileOpen && (
          <div style={{ background: '#0d2b1f', padding: '8px 24px 24px', borderTop: '1px solid rgba(200,151,58,0.2)' }}>

            <Link href="/"        onClick={closeMobile} style={MOBILE_LINK}>Beranda</Link>
            <Link href="/tentang" onClick={closeMobile} style={MOBILE_LINK}>Tentang Kami</Link>

            {/* Program Keahlian accordion */}
            <MobileAccordionButton label="Program Keahlian" isOpen={mobileJurusan} onClick={() => setMobileJurusan(v => !v)} />
            {mobileJurusan && (
              <div style={{ paddingLeft: 8, paddingBottom: 4 }}>
                {JURUSAN_LIST.map(j => (
                  <Link
                    key={j.kode}
                    href={j.href}
                    onClick={() => { closeMobile(); setMobileJurusan(false); }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      padding: '9px 4px', textDecoration: 'none',
                      borderBottom: '1px solid rgba(255,255,255,0.04)',
                    }}
                  >
                   <div
  style={{
    width: 30,
    height: 30,
    borderRadius: 7,
    flexShrink: 0,
    background: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    padding: 3,
  }}
>
  <Image
    src={j.logo}
    alt={j.kode}
    width={24}
    height={24}
    style={{
      objectFit: 'contain',
    }}
  />
</div>
                    <div>
                      <span style={{ fontSize: 10, fontWeight: 700, color: '#C8973A', marginRight: 6 }}>{j.kode}</span>
                      <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.85)' }}>{j.nama}</span>
                    </div>
                  </Link>
                ))}
                <Link href="/jurusan" onClick={closeMobile} style={{
                  display: 'block', marginTop: 8, fontSize: 12,
                  color: '#C8973A', textDecoration: 'none', fontWeight: 600,
                }}>
                  → Lihat semua program keahlian
                </Link>
              </div>
            )}

            {/* Ekstrakurikuler accordion */}
            <MobileAccordionButton label="Ekstrakurikuler" isOpen={mobileEskul} onClick={() => setMobileEskul(v => !v)} />
            {mobileEskul && (
              <div style={{ paddingLeft: 8, paddingBottom: 4 }}>
                {ESKUL_LIST.map(e => (
                  <Link
                    key={e.nama}
                    href={e.href}
                    onClick={() => { closeMobile(); setMobileEskul(false); }}
                    style={{
                      display: 'block', padding: '9px 4px', textDecoration: 'none',
                      borderBottom: '1px solid rgba(255,255,255,0.04)',
                      fontSize: 13, color: 'rgba(255,255,255,0.85)',
                    }}
                  >
                    {e.nama}
                  </Link>
                ))}
              </div>
            )}

            <Link href="/prestasi" onClick={closeMobile} style={MOBILE_LINK}>Prestasi</Link>
            <Link href="/spmb"     onClick={closeMobile} style={MOBILE_LINK}>SPMB</Link>

            {/* Auth (Mobile) */}
            <div style={{ marginTop: 16, display: 'flex', gap: 10 }}>
              {session ? (
                <Link
                  href={session.role === 'admin' ? '/admin/dashboard' : '/dashboard'}
                  style={{ color: '#C8973A', fontSize: 14, fontWeight: 600, textDecoration: 'none' }}
                >
                  Dashboard
                </Link>
              ) : (
                <>
                  <Link href="/login" onClick={closeMobile} style={{
                    flex: 1, textAlign: 'center', padding: '10px',
                    border: '1px solid rgba(255,255,255,0.3)',
                    borderRadius: 8, color: 'white', textDecoration: 'none', fontSize: 14,
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

// ─── Helpers ─────────────────────────────────────────────────────────────────

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      style={NAV_LINK}
      onMouseEnter={e => applyHover(e, true)}
      onMouseLeave={e => applyHover(e, false)}
    >
      {children}
    </Link>
  );
}

function applyHover(e: React.MouseEvent, hovered: boolean) {
  const el = e.currentTarget as HTMLElement;
  el.style.color      = hovered ? '#C8973A' : 'rgba(255,255,255,0.85)';
  el.style.background = hovered ? 'rgba(200,151,58,0.1)' : 'transparent';
}