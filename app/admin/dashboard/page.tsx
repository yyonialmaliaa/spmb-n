'use client';
import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { LogOut, User, ArrowRight, Users } from 'lucide-react';
import Image from 'next/image';

type Pendaftaran = { jenjang?: string; status: string; statusPembayaran?: string; sumberDaftar?: string };
type TahunAjaran = { id: string; nama: string; aktif: boolean };

const JENJANG_LIST = [
  { key: 'smp', label: 'SMP' },
  { key: 'sma', label: 'SMA' },
  { key: 'smk', label: 'SMK' },
] as const;

export default function AdminDashboardSelector() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9CA3AF' }}>Memuat...</div>}>
      <AdminDashboardSelectorInner />
    </Suspense>
  );
}

function AdminDashboardSelectorInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tahunAjaranId = searchParams.get('tahunAjaranId') || '';
  const qs = tahunAjaranId ? `?tahunAjaranId=${tahunAjaranId}` : '';

  const [session, setSession] = useState<{ namaLengkap?: string } | null>(null);
  const [data, setData] = useState<Pendaftaran[]>([]);
  const [tahunAjaran, setTahunAjaran] = useState<TahunAjaran | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/auth/me').then(r => r.json()).then(d => {
      if (!d.user || d.user.role !== 'admin') { router.push('/login'); return; }
      setSession(d.user);
    });
    fetch(`/api/admin/pendaftar${qs}`).then(r => r.json()).then(d => {
      setData(d.data || []);
      setTahunAjaran(d.tahunAjaran || null);
      setLoading(false);
    });
  }, [router, tahunAjaranId]);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/');
  };

  const countFor = (jenjang: string) => data.filter(p => (p.jenjang || 'smk') === jenjang);

  return (
    <div style={{ minHeight: '100vh', background: '#F8F9FA' }}>
      <header style={{ background: 'linear-gradient(180deg, #123524 0%, #0B2A1C 100%)', padding: '0 24px', borderBottom: '2px solid #C8973A' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 72, flexWrap: 'wrap', gap: 10 }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
            <div style={{ width: 38, height: 38, borderRadius: 10, overflow: 'hidden', position: 'relative' }}>
              <Image src="/images/logo.png" alt="Logo SMK Citra Negara" width={38} height={38} style={{ objectFit: 'cover' }} />
            </div>
            <div>
              <div style={{ color: 'white', fontWeight: 700, fontSize: 14 }}>SMK Citra Negara</div>
              <div style={{ color: '#C8973A', fontSize: 11 }}>Admin Panel</div>
            </div>
          </Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'white', fontSize: 13 }}>
              <User size={16} color="#C8973A" /> {session?.namaLengkap}
            </div>
            <button onClick={handleLogout} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.08)', border: 'none', color: 'white', padding: '8px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
              <LogOut size={14} /> Keluar
            </button>
          </div>
        </div>
      </header>

      <main style={{ maxWidth: 1100, margin: '0 auto', padding: '48px 24px' }}>
        <h1 className="font-display" style={{ fontSize: 26, color: '#0B2A1C', marginBottom: 6 }}>Pilih Jenjang</h1>
        <p style={{ fontSize: 14, color: '#6B7280', marginBottom: tahunAjaran && !tahunAjaran.aktif ? 12 : 32 }}>Kelola data pendaftaran SPMB per jenjang sekolah.</p>
        {tahunAjaran && !tahunAjaran.aktif && (
          <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 10, padding: '10px 14px', marginBottom: 20, fontSize: 12, color: '#92400E', fontWeight: 600 }}>
            📅 Sedang melihat data historis tahun ajaran <strong>{tahunAjaran.nama}</strong> (tidak aktif) — bukan tahun ajaran yang sedang berjalan.
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 20 }}>
          {JENJANG_LIST.map(j => {
            const list = countFor(j.key);
            const verified = list.filter(p => p.status === 'verified').length;
            const diterima = list.filter(p => p.status === 'diterima_berkas').length;
            const menungguBayar = list.filter(p => p.statusPembayaran === 'menunggu_verifikasi').length;
            const offline = list.filter(p => p.sumberDaftar === 'offline').length;
            return (
              <Link key={j.key} href={`/admin/dashboard/${j.key}${qs}`} style={{ textDecoration: 'none' }}>
                <div style={{ background: '#0A1628', borderRadius: 18, padding: 28, color: 'white', cursor: 'pointer', border: '1px solid #1E293B', height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
                    <span className="font-display" style={{ fontSize: 32, fontWeight: 800, color: '#E8B84B' }}>{j.label}</span>
                    <div style={{ width: 44, height: 44, background: 'rgba(200,151,58,0.15)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Users size={22} color="#C8973A" />
                    </div>
                  </div>

                  <div className="font-display" style={{ fontSize: 40, fontWeight: 700, marginBottom: 4 }}>{loading ? '—' : list.length}</div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginBottom: 20 }}>Total Pendaftar</div>

                  <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
                    <span style={{ background: 'rgba(30,64,175,0.2)', color: '#93C5FD', fontSize: 11, fontWeight: 600, padding: '4px 10px', borderRadius: 8 }}>{verified} diverifikasi</span>
                    <span style={{ background: 'rgba(6,95,70,0.25)', color: '#6EE7B7', fontSize: 11, fontWeight: 600, padding: '4px 10px', borderRadius: 8 }}>{diterima} diterima</span>
                    {menungguBayar > 0 && <span style={{ background: 'rgba(217,119,6,0.2)', color: '#FCD34D', fontSize: 11, fontWeight: 600, padding: '4px 10px', borderRadius: 8 }}>{menungguBayar} tunggu bayar</span>}
                    {offline > 0 && <span style={{ background: 'rgba(194,65,12,0.2)', color: '#FDBA74', fontSize: 11, fontWeight: 600, padding: '4px 10px', borderRadius: 8 }}>{offline} offline</span>}
                  </div>

                  <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 700, color: '#E8B84B' }}>
                    Kelola {j.label} <ArrowRight size={15} />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        <p style={{ marginTop: 28, fontSize: 12, color: '#9CA3AF' }}>
          Panel Harga dan Diskon per jenjang ada di dalam menu "Kelola SMP/SMA/SMK" masing-masing.
        </p>
        <div style={{ marginTop: 10, display: 'flex', gap: 20, flexWrap: 'wrap' }}>
          <Link href="/admin/tahun-ajaran" style={{ fontSize: 13, color: '#C8973A', fontWeight: 600, textDecoration: 'none' }}>
            📅 Tahun Ajaran
          </Link>
          <Link href="/admin/gelombang" style={{ fontSize: 13, color: '#C8973A', fontWeight: 600, textDecoration: 'none' }}>
            ⚙ Atur Gelombang (semua jenjang)
          </Link>
          <Link href="/admin/dokumen" style={{ fontSize: 13, color: '#C8973A', fontWeight: 600, textDecoration: 'none' }}>
            📄 Dokumen Persyaratan Daftar Ulang
          </Link>
        </div>
      </main>
    </div>
  );
}
