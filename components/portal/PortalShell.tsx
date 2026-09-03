'use client';

// =====================================================================
// Shell portal user SPMB — navbar desktop + header/bottom-nav mobile yang
// SAMA di 4 halaman (Dashboard, Pendaftaran, Pembayaran, Dokumen). Semua
// data (sesi, pendaftaran, riwayat pembayaran, dokumen daftar ulang) di-
// fetch SEKALI di sini lewat API yang SUDAH ADA (bukan API baru), lalu
// dibagikan ke halaman lewat children-as-function — supaya tidak ada 4
// salinan fetch yang sama di 4 file berbeda, dan supaya notifikasi bisa
// dihitung dari data yang sama dengan yang dilihat pengguna.
// =====================================================================

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  Home, FileText, Wallet, FolderOpen, Lock,
  Bell, User, LogOut, ChevronDown,
} from 'lucide-react';
import HelpFloatingButton from './HelpFloatingButton';
import LockedFeatureDialog from './LockedFeatureDialog';

export type Session = { userId: string; email: string; role: string; namaLengkap?: string };

export type Pendaftaran = {
  id: string; namaLengkap: string; jurusan: string; jenjang?: string; kelas?: string;
  asalSD?: string; asalSMP?: string; asalSekolah?: string; gelombang?: string;
  status: string; nilaiSeleksi?: number;
  catatan?: string; alasanPenolakan?: string;
  waVerified?: boolean;
  statusPembayaran?: string; totalTagihan?: number;
  pesanPengumuman?: string; revisiCount?: number;
  sudahDaftarUlang?: boolean; tanggalDaftarUlang?: string; catatanDaftarUlang?: string;
  createdAt: string;
  fileIjazah?: string; fileAkte?: string; fileKK?: string;
  fileKtpOrtu?: string; fileKip?: string; fileFoto?: string;
};

export type TagihanBreakdown = { hargaPokok: number; hargaTersedia: boolean; gelombangDiskonNominal: number; gelombangNama: string | null; diskonNominal: number; totalTagihan: number; locked: boolean };

export type RiwayatBayar = {
  riwayat: any[]; totalTagihan: number; totalDibayar: number; totalRefund: number; totalAlokasi: number;
  sisaBayar: number; lebihBayar: number; totalDisetorkan: number; minCicilan: number; minimalPembayaranAwal: number;
  breakdown: TagihanBreakdown | null;
};

export type DokumenSekolah = { jenis: string; nama: string; url?: string; namaFile?: string };

type NotifikasiAdmin = { id: string; pesan: string; dibaca: boolean; createdAt: string };

export type PortalContext = {
  session: Session | null;
  pendaftaran: Pendaftaran | null;
  riwayat: RiwayatBayar | null;
  dokumenSekolah: DokumenSekolah[];
  reload: () => void;
};

// "lockable" = menu ini terkunci selama formulir pendaftaran belum MULAI
// diisi (lihat punyaPendaftaran di bawah) — hanya Dashboard yang tidak
// pernah dikunci (satu-satunya tempat memulai pengisian formulir).
const NAV_ITEMS = [
  { key: 'dashboard', label: 'Dashboard', href: '/dashboard', icon: Home, lockable: false },
  { key: 'pendaftaran', label: 'Pendaftaran', href: '/dashboard/pendaftaran', icon: FileText, lockable: true },
  { key: 'pembayaran', label: 'Pembayaran', href: '/dashboard/pembayaran', icon: Wallet, lockable: true },
  { key: 'dokumen', label: 'Dokumen', href: '/dashboard/dokumen', icon: FolderOpen, lockable: true },
] as const;

const CSS = `
  .portal-desktop-nav { display: flex; }
  .portal-mobile-header { display: none; }
  .portal-bottom-nav { display: none; }
  .portal-main { padding: 28px 24px 48px; }
  @media (max-width: 860px) {
    .portal-desktop-nav { display: none !important; }
    .portal-mobile-header { display: flex !important; }
    .portal-bottom-nav { display: flex !important; }
    .portal-main { padding: 18px 16px 88px; }
  }
  .portal-nav-link:not(.portal-nav-link-active):hover { background: rgba(255,255,255,0.1) !important; color: white !important; }
  .portal-nav-link:focus-visible, .portal-icon-btn:focus-visible, .portal-bottom-link:focus-visible {
    outline: 2px solid #E8B84B; outline-offset: 2px;
  }
  .portal-icon-btn:hover { background: rgba(255,255,255,0.16) !important; }
  .portal-avatar-btn:hover, .portal-avatar-btn:focus-visible { filter: brightness(1.1); outline: 2px solid white; outline-offset: 2px; }
  .portal-bottom-link:active { opacity: 0.7; }
`;

export default function PortalShell({
  active,
  children,
}: {
  active: 'dashboard' | 'pendaftaran' | 'pembayaran' | 'dokumen' | 'profil';
  children: (ctx: PortalContext) => React.ReactNode;
}) {
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);
  const [pendaftaran, setPendaftaran] = useState<Pendaftaran | null>(null);
  const [riwayat, setRiwayat] = useState<RiwayatBayar | null>(null);
  const [dokumenSekolah, setDokumenSekolah] = useState<DokumenSekolah[]>([]);
  const [loading, setLoading] = useState(true);
  const [notifOpen, setNotifOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [lockedDialog, setLockedDialog] = useState<'pendaftaran' | 'pembayaran' | 'dokumen' | null>(null);
  const [notifikasiAdmin, setNotifikasiAdmin] = useState<NotifikasiAdmin[]>([]);
  const [belumDibaca, setBelumDibaca] = useState(0);
  // Ref TERPISAH untuk versi desktop & mobile — keduanya sama-sama ada di
  // DOM sekaligus (cuma disembunyikan lewat CSS media query, bukan di-
  // unmount), jadi tidak boleh berbagi satu ref yang sama. Kalau dipaksa
  // berbagi, ref cuma nempel ke salah satu (yang terakhir di-render), dan
  // dropdown pada elemen yang lain akan tertutup sendiri oleh handler
  // "klik di luar" sebelum event klik di dalamnya sempat diproses.
  const notifRefDesktop = useRef<HTMLDivElement>(null);
  const notifRefMobile = useRef<HTMLDivElement>(null);
  const accountRefDesktop = useRef<HTMLDivElement>(null);
  const accountRefMobile = useRef<HTMLDivElement>(null);

  const loadNotifikasi = useCallback(() => {
    fetch('/api/notifikasi').then(r => r.json()).then(d => {
      setNotifikasiAdmin(d.data || []);
      setBelumDibaca(d.belumDibaca || 0);
    });
  }, []);

  // Buka panel notifikasi -> tandai semua sudah dibaca (di server & lokal).
  const bukaNotifikasi = () => {
    setNotifOpen(v => {
      const akanDibuka = !v;
      if (akanDibuka && belumDibaca > 0) {
        fetch('/api/notifikasi/baca', { method: 'POST' });
        setNotifikasiAdmin(list => list.map(n => ({ ...n, dibaca: true })));
        setBelumDibaca(0);
      }
      return akanDibuka;
    });
    setAccountOpen(false);
  };

  const loadPendaftaranDanRiwayat = useCallback(() => {
    fetch('/api/pendaftaran').then(r => r.json()).then(d => {
      setPendaftaran(d.data || null);
      if (d.data) {
        fetch('/api/pembayaran').then(r => r.json()).then(dd => { if (dd.data) setRiwayat(dd.data); });
      }
    });
  }, []);

  useEffect(() => {
    fetch('/api/auth/me').then(r => r.json()).then(d => {
      if (!d.user) { router.push('/login'); return; }
      if (d.user.role === 'admin') { router.push('/admin/dashboard'); return; }
      setSession(d.user);
    });
    fetch('/api/pendaftaran').then(r => r.json()).then(d => {
      setPendaftaran(d.data || null);
      setLoading(false);
      if (d.data) {
        fetch('/api/pembayaran').then(r => r.json()).then(dd => { if (dd.data) setRiwayat(dd.data); });
      }
    });
    fetch('/api/dokumen').then(r => r.json()).then(d => { if (d.data) setDokumenSekolah(d.data); });
    loadNotifikasi();
  }, [router, loadNotifikasi]);

  // Tutup dropdown notifikasi/akun kalau klik di luar area-nya.
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const t = e.target as Node;
      const dalamNotif = notifRefDesktop.current?.contains(t) || notifRefMobile.current?.contains(t);
      const dalamAkun = accountRefDesktop.current?.contains(t) || accountRefMobile.current?.contains(t);
      if (!dalamNotif) setNotifOpen(false);
      if (!dalamAkun) setAccountOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    // Full reload (bukan router.push) supaya cookie sesi yang sudah dihapus
    // server benar-benar dipatuhi ulang dari nol — sama seperti logout di
    // navbar publik (components/layout/Navbar.tsx).
    window.location.href = '/';
  };

  // Notifikasi dari tindakan admin (Notifikasi table, real & tersimpan) —
  // ditampilkan lebih dulu, terbaru di atas.
  const notifDariAdmin = notifikasiAdmin.map(n => ({ text: n.pesan, href: undefined as string | undefined, waktu: n.createdAt, baru: !n.dibaca }));

  // Ditambah pengingat yang diturunkan langsung dari kondisi saat ini
  // (bukan tersimpan sebagai baris notifikasi) — cuma menyorot hal yang
  // masih perlu diperhatikan sekarang.
  const notifPengingat: { text: string; href: string; waktu?: string; baru?: boolean }[] = [];
  if (pendaftaran) {
    if (pendaftaran.status === 'ditolak') {
      notifPengingat.push({ text: 'Berkas Anda ditolak — perlu direvisi & dikirim ulang', href: '/spmb/revisi' });
    }
    if (pendaftaran.status === 'draft') {
      notifPengingat.push({ text: 'Formulir Anda masih draft, belum dikirim ke admin', href: '/dashboard' });
    }
    const wajib = [pendaftaran.fileIjazah, pendaftaran.fileAkte, pendaftaran.fileKK, pendaftaran.fileKtpOrtu, pendaftaran.fileFoto];
    const kurangWajib = wajib.filter(f => !f).length;
    if (kurangWajib > 0 && pendaftaran.status !== 'ditolak') {
      notifPengingat.push({ text: `${kurangWajib} dokumen wajib belum dilengkapi`, href: '/dashboard/dokumen' });
    }
    if (riwayat && riwayat.sisaBayar > 0 && pendaftaran.status !== 'draft') {
      notifPengingat.push({ text: `Sisa tagihan ${formatRupiahSingkat(riwayat.sisaBayar)} belum dibayar`, href: '/dashboard/pembayaran' });
    }
  }

  const notifGabungan = [...notifDariAdmin, ...notifPengingat];
  const adaNotifBaru = belumDibaca > 0 || notifPengingat.length > 0;

  const initial = (session?.namaLengkap || session?.email || '?').trim().charAt(0).toUpperCase();

  // Sejak jenjang dipilih saat REGISTRASI (bukan lagi di dashboard), akun
  // baru langsung punya baris Pendaftaran (draft kosong) — jadi menu tidak
  // lagi bisa dikunci berdasarkan "pendaftaran === null" (hampir selalu
  // ada). Aturan gembok sekarang: terkunci selama formulir belum MULAI
  // diisi (namaLengkap masih kosong) — sama dengan syarat "Belum Ada
  // Pendaftaran" di Dashboard. Selama masih memuat, anggap dulu "sudah
  // mulai isi" (default aman) supaya menu tidak sempat kelihatan terkunci
  // sesaat untuk pengguna yang datanya belum selesai di-fetch.
  const punyaPendaftaran = loading ? true : !!pendaftaran?.namaLengkap;

  // Tujuan tombol "Mulai Pendaftaran" pada dialog terkunci — langsung ke
  // formulir sesuai jenjang akun (bukan ke Dashboard lagi), karena jenjang
  // sudah pasti diketahui sejak registrasi.
  const ctaHrefMulaiPendaftaran = pendaftaran?.jenjang ? `/spmb/daftar?jenjang=${pendaftaran.jenjang}` : '/dashboard';

  return (
    <div style={{ minHeight: '100vh', background: '#FAF7F0' }}>
      <style>{CSS}</style>

      {/* ── Desktop navbar ── */}
      <nav className="portal-desktop-nav" style={{ background: 'linear-gradient(180deg, #123524 0%, #0B2A1C 100%)', borderBottom: '2px solid #C8973A', position: 'sticky', top: 0, zIndex: 100, alignItems: 'center', height: 60 }}>
        <div style={{ maxWidth: 1240, margin: '0 auto', padding: '0 24px', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 24 }}>
          <Link href="/dashboard" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', flexShrink: 0 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, overflow: 'hidden', flexShrink: 0 }}>
              <Image src="/images/logo.png" alt="Logo SMK Citra Negara" width={32} height={32} style={{ objectFit: 'cover' }} />
            </div>
            <span style={{ color: 'white', fontWeight: 700, fontSize: 14, whiteSpace: 'nowrap' }}>SMK Citra Negara</span>
          </Link>

          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            {NAV_ITEMS.map(item => {
              const isActive = active === item.key;
              const isLocked = item.lockable && !punyaPendaftaran;

              if (isLocked) {
                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => setLockedDialog(item.key as 'pendaftaran' | 'pembayaran' | 'dokumen')}
                    aria-haspopup="dialog"
                    aria-label={`${item.label} — belum tersedia, klik untuk info`}
                    className="portal-nav-link"
                    style={{
                      display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 8,
                      fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.42)',
                      background: 'transparent', border: 'none', cursor: 'pointer', fontFamily: 'inherit',
                    }}
                  >
                    <item.icon size={15} /> {item.label} <Lock size={11} />
                  </button>
                );
              }

              return (
                <Link
                  key={item.key}
                  href={item.href}
                  className={`portal-nav-link${isActive ? ' portal-nav-link-active' : ''}`}
                  aria-current={isActive ? 'page' : undefined}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 7, padding: '8px 16px', borderRadius: 8,
                    textDecoration: 'none', fontSize: 13, fontWeight: 600,
                    color: isActive ? '#0A1628' : 'rgba(255,255,255,0.75)',
                    background: isActive ? '#E8B84B' : 'transparent',
                  }}
                >
                  <item.icon size={15} /> {item.label}
                </Link>
              );
            })}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
            <div ref={notifRefDesktop} style={{ position: 'relative' }}>
              <button
                onClick={bukaNotifikasi}
                aria-label={belumDibaca > 0 ? `Notifikasi, ${belumDibaca} belum dibaca` : 'Notifikasi'}
                aria-haspopup="true"
                aria-expanded={notifOpen}
                title="Notifikasi"
                className="portal-icon-btn"
                style={{ position: 'relative', background: 'rgba(255,255,255,0.08)', border: 'none', borderRadius: 8, width: 34, height: 34, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
              >
                <Bell size={16} color="white" />
                {adaNotifBaru && <span aria-hidden style={{ position: 'absolute', top: 6, right: 6, width: 8, height: 8, borderRadius: '50%', background: '#DC2626', border: '1.5px solid #123524' }} />}
              </button>
              {notifOpen && <NotifDropdown items={notifGabungan} onNavigate={() => setNotifOpen(false)} />}
            </div>

            <div ref={accountRefDesktop} style={{ position: 'relative' }}>
              <button
                onClick={() => { setAccountOpen(v => !v); setNotifOpen(false); }}
                aria-label="Menu akun"
                aria-haspopup="true"
                aria-expanded={accountOpen}
                title="Menu akun"
                className="portal-icon-btn"
                style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.08)', border: 'none', borderRadius: 8, padding: '5px 10px 5px 5px', cursor: 'pointer' }}
              >
                <span style={{ width: 26, height: 26, borderRadius: '50%', background: '#C8973A', color: '#0A1628', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800, flexShrink: 0 }}>{initial}</span>
                <span style={{ color: 'white', fontSize: 12.5, fontWeight: 600, maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{session?.namaLengkap || 'Akun'}</span>
                <ChevronDown size={13} color="rgba(255,255,255,0.6)" />
              </button>
              {accountOpen && (
                <div style={{ position: 'absolute', top: '110%', right: 0, background: 'white', borderRadius: 10, boxShadow: '0 12px 32px rgba(0,0,0,0.18)', border: '1px solid #F0EBE0', minWidth: 170, overflow: 'hidden', zIndex: 200 }}>
                  <Link href="/dashboard/profil" onClick={() => setAccountOpen(false)} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '11px 14px', color: '#374151', textDecoration: 'none', fontSize: 13, borderBottom: '1px solid #F3F4F6' }}>
                    <User size={14} /> Profil
                  </Link>
                  <button onClick={handleLogout} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '11px 14px', color: '#DC2626', background: 'none', border: 'none', width: '100%', textAlign: 'left', cursor: 'pointer', fontSize: 13, fontFamily: 'inherit' }}>
                    <LogOut size={14} /> Keluar
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* ── Mobile header ── */}
      <header className="portal-mobile-header" style={{ background: 'linear-gradient(180deg, #123524 0%, #0B2A1C 100%)', borderBottom: '2px solid #C8973A', position: 'sticky', top: 0, zIndex: 100, alignItems: 'center', justifyContent: 'space-between', height: 56, padding: '0 16px' }}>
        <Link href="/dashboard" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
          <div style={{ width: 28, height: 28, borderRadius: 7, overflow: 'hidden', flexShrink: 0 }}>
            <Image src="/images/logo.png" alt="Logo SMK Citra Negara" width={28} height={28} style={{ objectFit: 'cover' }} />
          </div>
          <span style={{ color: 'white', fontWeight: 700, fontSize: 13.5 }}>SMK Citra Negara</span>
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div ref={notifRefMobile} style={{ position: 'relative' }}>
            <button
              onClick={bukaNotifikasi}
              aria-label={belumDibaca > 0 ? `Notifikasi, ${belumDibaca} belum dibaca` : 'Notifikasi'}
              aria-haspopup="true"
              aria-expanded={notifOpen}
              title="Notifikasi"
              className="portal-icon-btn"
              style={{ position: 'relative', background: 'rgba(255,255,255,0.08)', border: 'none', borderRadius: 8, width: 34, height: 34, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
            >
              <Bell size={16} color="white" />
              {adaNotifBaru && <span aria-hidden style={{ position: 'absolute', top: 6, right: 6, width: 8, height: 8, borderRadius: '50%', background: '#DC2626', border: '1.5px solid #123524' }} />}
            </button>
            {notifOpen && <NotifDropdown items={notifGabungan} onNavigate={() => setNotifOpen(false)} />}
          </div>
          <div ref={accountRefMobile} style={{ position: 'relative' }}>
            <button
              onClick={() => { setAccountOpen(v => !v); setNotifOpen(false); }}
              aria-label={`Menu akun${session?.namaLengkap ? ` — ${session.namaLengkap}` : ''}`}
              aria-haspopup="true"
              aria-expanded={accountOpen}
              title="Menu akun"
              className="portal-avatar-btn"
              style={{ width: 34, height: 34, borderRadius: '50%', background: '#C8973A', color: '#0A1628', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800, border: 'none', cursor: 'pointer' }}
            >
              {initial}
            </button>
            {accountOpen && (
              <div style={{ position: 'absolute', top: '120%', right: 0, background: 'white', borderRadius: 10, boxShadow: '0 12px 32px rgba(0,0,0,0.18)', border: '1px solid #F0EBE0', minWidth: 170, overflow: 'hidden', zIndex: 200 }}>
                <div style={{ padding: '10px 14px', fontSize: 12, color: '#9CA3AF', borderBottom: '1px solid #F3F4F6', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{session?.namaLengkap}</div>
                <Link href="/dashboard/profil" onClick={() => setAccountOpen(false)} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '11px 14px', color: '#374151', textDecoration: 'none', fontSize: 13, borderBottom: '1px solid #F3F4F6' }}>
                  <User size={14} /> Profil
                </Link>
                <button onClick={handleLogout} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '11px 14px', color: '#DC2626', background: 'none', border: 'none', width: '100%', textAlign: 'left', cursor: 'pointer', fontSize: 13, fontFamily: 'inherit' }}>
                  <LogOut size={14} /> Keluar
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ── Konten halaman ── */}
      <main className="portal-main" style={{ maxWidth: 1240, margin: '0 auto' }}>
        {loading ? (
          <div style={{ minHeight: '50vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ width: 36, height: 36, border: '4px solid #E5E7EB', borderTopColor: '#C8973A', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }} />
              <p style={{ color: '#6B7280', fontSize: 13 }}>Memuat data...</p>
              <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
          </div>
        ) : (
          children({ session, pendaftaran, riwayat, dokumenSekolah, reload: loadPendaftaranDanRiwayat })
        )}
      </main>

      {/* ── Bottom navigation (mobile) ── */}
      <nav className="portal-bottom-nav" style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: 'white', borderTop: '1px solid #EDE7DA', zIndex: 100, justifyContent: 'space-around', alignItems: 'center', height: 62, boxShadow: '0 -2px 12px rgba(0,0,0,0.05)' }}>
        {NAV_ITEMS.map(item => {
          const isActive = active === item.key;
          const isLocked = item.lockable && !punyaPendaftaran;

          if (isLocked) {
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => setLockedDialog(item.key as 'pendaftaran' | 'pembayaran' | 'dokumen')}
                aria-haspopup="dialog"
                aria-label={`${item.label} — belum tersedia, ketuk untuk info`}
                className="portal-bottom-link"
                style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
                  flex: 1, height: '100%', justifyContent: 'center',
                  color: '#B9B2A0', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit',
                }}
              >
                <span style={{ position: 'relative', display: 'inline-flex' }}>
                  <item.icon size={20} strokeWidth={2} />
                  <span style={{ position: 'absolute', bottom: -3, right: -5, background: 'white', borderRadius: '50%', width: 13, height: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 0 1px #EDE7DA' }}>
                    <Lock size={8} color="#92681A" />
                  </span>
                </span>
                <span style={{ fontSize: 10.5, fontWeight: 500 }}>{item.label}</span>
              </button>
            );
          }

          return (
            <Link
              key={item.key}
              href={item.href}
              className="portal-bottom-link"
              aria-current={isActive ? 'page' : undefined}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
                textDecoration: 'none', flex: 1, height: '100%', justifyContent: 'center',
                color: isActive ? '#0B3D2E' : '#9CA3AF',
              }}
            >
              <item.icon size={20} strokeWidth={isActive ? 2.4 : 2} />
              <span style={{ fontSize: 10.5, fontWeight: isActive ? 700 : 500 }}>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Bantuan — mengambang, sekunder (bukan card permanen di konten). */}
      <HelpFloatingButton jenjang={pendaftaran?.jenjang} />

      {lockedDialog && <LockedFeatureDialog jenis={lockedDialog} ctaHref={ctaHrefMulaiPendaftaran} onClose={() => setLockedDialog(null)} />}
    </div>
  );
}

type NotifDropdownItem = { text: string; href?: string; waktu?: string; baru?: boolean };

function NotifDropdown({ items, onNavigate }: { items: NotifDropdownItem[]; onNavigate: () => void }) {
  return (
    <div style={{ position: 'absolute', top: '120%', right: 0, background: 'white', borderRadius: 12, boxShadow: '0 12px 32px rgba(0,0,0,0.18)', border: '1px solid #F0EBE0', width: 300, maxWidth: '85vw', maxHeight: 380, overflowY: 'auto', zIndex: 200 }}>
      <div style={{ padding: '10px 14px', fontSize: 12, fontWeight: 700, color: '#6B7280', borderBottom: '1px solid #F3F4F6', background: '#FAFAFA', position: 'sticky', top: 0 }}>NOTIFIKASI</div>
      {items.length === 0 ? (
        <div style={{ padding: '20px 14px', textAlign: 'center', fontSize: 12.5, color: '#9CA3AF' }}>Tidak ada notifikasi</div>
      ) : (
        items.map((n, i) => {
          const isi = (
            <>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6 }}>
                {n.baru && <span aria-hidden style={{ width: 6, height: 6, borderRadius: '50%', background: '#C8973A', marginTop: 5, flexShrink: 0 }} />}
                <span style={{ flex: 1 }}>{n.text}</span>
              </div>
              {n.waktu && <div style={{ fontSize: 10.5, color: '#9CA3AF', marginTop: 3 }}>{formatWaktuNotif(n.waktu)}</div>}
            </>
          );
          const style: React.CSSProperties = { display: 'block', padding: '11px 14px', fontSize: 12.5, color: '#374151', textDecoration: 'none', borderBottom: i < items.length - 1 ? '1px solid #F3F4F6' : 'none', lineHeight: 1.5, background: n.baru ? '#FFFBEB' : 'transparent' };
          return n.href
            ? <Link key={i} href={n.href} onClick={onNavigate} style={style}>{isi}</Link>
            : <div key={i} style={style}>{isi}</div>;
        })
      )}
    </div>
  );
}

function formatWaktuNotif(iso: string): string {
  const d = new Date(iso);
  const menit = Math.floor((Date.now() - d.getTime()) / 60000);
  if (menit < 1) return 'Baru saja';
  if (menit < 60) return `${menit} menit lalu`;
  const jam = Math.floor(menit / 60);
  if (jam < 24) return `${jam} jam lalu`;
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
}

function formatRupiahSingkat(n: number): string {
  return 'Rp' + n.toLocaleString('id-ID');
}
