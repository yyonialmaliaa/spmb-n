'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  GraduationCap, FileText, Clock, CheckCircle, XCircle,
  LogOut, User, AlertCircle, Calendar, RefreshCw,
  Award, Bell, ChevronRight, Edit3
} from 'lucide-react';
import Image from 'next/image';

type Pendaftaran = {
  id: string; namaLengkap: string; jurusan: string; asalSMP?: string; asalSekolah?: string;
  status: string; nilaiSeleksi?: number; nilaiTes?: number;
  catatan?: string; alasanPenolakan?: string;
  jadwalTes?: string; lokasiTes?: string; infoTes?: string;
  pesanPengumuman?: string; revisiCount?: number;
  sudahDaftarUlang?: boolean; tanggalDaftarUlang?: string; catatanDaftarUlang?: string;
  createdAt: string;
  fileIjazah?: string; fileAkte?: string; fileKK?: string;
  fileKtpOrtu?: string; fileKip?: string; fileFoto?: string;
};

type Session = { userId: string; email: string; role: string; namaLengkap?: string };

const STATUS_CONFIG: Record<string, {
  label: string; color: string; bg: string; border: string; icon: any; step: number; desc: string;
}> = {
  pending:         { label: 'Menunggu Verifikasi', color: '#92400E', bg: '#FEF3C7', border: '#FDE68A',  icon: Clock,       step: 1, desc: 'Formulir sudah dikirim, menunggu admin memverifikasi berkas Anda.' },
  verified:        { label: 'Sedang Diverifikasi', color: '#1E40AF', bg: '#DBEAFE', border: '#BFDBFE',  icon: RefreshCw,   step: 2, desc: 'Admin sedang memeriksa berkas Anda. Harap tunggu.' },
  ditolak:         { label: 'Berkas Ditolak',      color: '#991B1B', bg: '#FEE2E2', border: '#FECACA',  icon: XCircle,     step: 1, desc: 'Admin menolak berkas Anda. Silakan perbaiki dan kirim ulang.' },
  diterima_berkas: { label: 'Berkas Diterima',     color: '#065F46', bg: '#D1FAE5', border: '#A7F3D0',  icon: CheckCircle, step: 3, desc: 'Berkas diterima! Silakan datang ke sekolah untuk mengikuti tes seleksi, Informasi lebih lanjut akan disampaikan melalui email.' },
  tes:             { label: 'Jadwal Tes',           color: '#5B21B6', bg: '#EDE9FE', border: '#DDD6FE',  icon: Calendar,    step: 3, desc: 'Anda telah dijadwalkan untuk mengikuti tes seleksi di sekolah, Silakan lihat email untuk informasi lebih lanjut.' },
  lulus:           { label: 'Diterima / Lulus',    color: '#065F46', bg: '#D1FAE5', border: '#A7F3D0',  icon: Award,       step: 4, desc: 'Selamat! Anda dinyatakan LULUS dan diterima di SMK Citra Negara!' },
  tidak_lulus:     { label: 'Tidak Lulus',          color: '#991B1B', bg: '#FEE2E2', border: '#FECACA',  icon: XCircle,     step: 4, desc: 'Mohon maaf, Anda dinyatakan tidak lulus seleksi pada tahun ini. Terima kasih atas partisipasi Anda.' },
  daftar_ulang:    { label: 'Daftar Ulang Selesai', color: '#065F46', bg: '#D1FAE5', border: '#A7F3D0',  icon: CheckCircle, step: 5, desc: 'Selamat! Daftar ulang Anda telah dikonfirmasi. Sampai jumpa di sekolah!' },
};

const TAHAPAN = [
  { step: 1, label: 'Pendaftaran',  sub: 'Submit formulir' },
  { step: 2, label: 'Verifikasi',   sub: 'Cek berkas admin' },
  { step: 3, label: 'Tes Seleksi',  sub: 'Ke sekolah' },
  { step: 4, label: 'Pengumuman',   sub: 'Hasil seleksi' },
  { step: 5, label: 'Daftar Ulang', sub: 'Ke sekolah offline' },
];

export default function DashboardPage() {
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);
  const [pendaftaran, setPendaftaran] = useState<Pendaftaran | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/auth/me').then(r => r.json()).then(d => {
      if (!d.user) { router.push('/login'); return; }
      if (d.user.role === 'admin') { router.push('/admin/dashboard'); return; }
      setSession(d.user);
    });
    fetch('/api/pendaftaran').then(r => r.json()).then(d => {
      setPendaftaran(d.data || null);
      setLoading(false);
    });
  }, [router]);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/');
  };

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#FAF7F0' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: 40, height: 40, border: '4px solid #E5E7EB', borderTopColor: '#C8973A', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }} />
        <p style={{ color: '#6B7280', fontSize: 14 }}>Memuat data...</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  );

  const statusCfg   = pendaftaran ? STATUS_CONFIG[pendaftaran.status] || STATUS_CONFIG['pending'] : null;
  const currentStep = statusCfg?.step || 0;
  const isDitolak   = pendaftaran?.status === 'ditolak';
  const isLulus     = pendaftaran?.status === 'lulus';
  const isTidakLulus = pendaftaran?.status === 'tidak_lulus';
  const hasTes      = pendaftaran?.status === 'tes';
  const isDone      = isLulus || isTidakLulus || pendaftaran?.status === 'daftar_ulang';
  const isDaftarUlang = pendaftaran?.status === 'daftar_ulang';

  return (
    <div style={{ minHeight: '100vh', background: '#FAF7F0' }}>
      <header style={{ background: 'linear-gradient(180deg, #123524 0%, #0B2A1C 100%)', borderBottom: '2px solid #C8973A', padding: '0 24px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 64 }}>
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
            
            <span style={{ color: 'white', fontWeight: 700, fontSize: 14 }}>SMK Citra Negara</span>
          </Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 32, height: 32, background: 'rgba(200,151,58,0.2)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <User size={16} color="#C8973A" />
              </div>
              <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: 13 }}>{session?.namaLengkap}</span>
            </div>
            <button onClick={handleLogout} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', color: 'rgba(255,255,255,0.6)', padding: '6px 12px', borderRadius: 6, cursor: 'pointer', fontSize: 12, fontFamily: 'inherit' }}>
              <LogOut size={14} /> Keluar
            </button>
          </div>
        </div>
      </header>

      <main style={{ maxWidth: 1100, margin: '0 auto', padding: '36px 24px' }}>
        <div style={{ marginBottom: 32 }}>
          <h1 className="font-display" style={{ fontSize: 30, color: '#0B2A1C)', marginBottom: 4 }}>Halo, {session?.namaLengkap?.split(' ')[0]}! 👋</h1>
          <p style={{ color: '#6B7280', fontSize: 14 }}>Dashboard SPMB SMK Citra Negara</p>
        </div>

        {!pendaftaran && (
          <div style={{ background: 'white', borderRadius: 20, padding: 48, textAlign: 'center', border: '2px dashed #E5E7EB', maxWidth: 560, margin: '0 auto' }}>
            <div style={{ width: 80, height: 80, background: 'rgba(200,151,58,0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
              <FileText size={36} color="#C8973A" />
            </div>
            <h2 className="font-display" style={{ fontSize: 24, color: '#0A1628', marginBottom: 12 }}>Belum Ada Pendaftaran</h2>
            <p style={{ color: '#6B7280', fontSize: 14, lineHeight: 1.7, marginBottom: 32 }}>Anda belum mengisi formulir pendaftaran SPMB.</p>
            <Link href="/spmb/daftar" className="btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 15 }}>
              Isi Formulir Pendaftaran →
            </Link>
          </div>
        )}

        {pendaftaran && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 24, alignItems: 'flex-start' }}>
            {/* LEFT */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

              {/* Status Card */}
              <div style={{ background: 'white', borderRadius: 16, padding: 28, border: '1px solid #F0EBE0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
                  <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0B2A1C' }}>Status Pendaftaran</h3>
                  {statusCfg && (
                    <span style={{ background: statusCfg.bg, color: statusCfg.color, border: `1px solid ${statusCfg.border}`, padding: '5px 14px', borderRadius: 20, fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <statusCfg.icon size={13} /> {statusCfg.label}
                    </span>
                  )}
                </div>

                {/* Progress */}
                <div style={{ display: 'flex', alignItems: 'flex-start', marginBottom: 24, overflowX: 'auto' }}>
                  {TAHAPAN.map((t, i) => {
                    const done = currentStep > t.step;
                    const active = currentStep === t.step;
                    const isRejected = isDitolak && t.step === 1;
                    return (
                      <div key={t.step} style={{ display: 'flex', alignItems: 'flex-start', flex: 1 }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
                          <div style={{ width: 36, height: 36, borderRadius: '50%', background: isRejected ? '#FEE2E2' : done || active ? 'linear-gradient(135deg,#C8973A,#E8B84B)' : '#F3F4F6', border: isRejected ? '2px solid #FECACA' : 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 14, color: isRejected ? '#DC2626' : done || active ? '#0A1628' : '#9CA3AF', marginBottom: 8, flexShrink: 0 }}>
                            {isRejected ? '✗' : done ? '✓' : t.step}
                          </div>
                          <span style={{ fontSize: 11, fontWeight: active ? 700 : 500, color: isRejected ? '#DC2626' : active ? '#C8973A' : done ? '#0A1628' : '#9CA3AF', textAlign: 'center', whiteSpace: 'nowrap' }}>{t.label}</span>
                          <span style={{ fontSize: 10, color: '#9CA3AF', textAlign: 'center', whiteSpace: 'nowrap' }}>{t.sub}</span>
                        </div>
                        {i < TAHAPAN.length - 1 && <div style={{ height: 2, flex: 0.4, background: done ? '#C8973A' : '#E5E7EB', margin: '17px 4px 0', flexShrink: 0 }} />}
                      </div>
                    );
                  })}
                </div>

                {statusCfg && (
                  <div style={{ background: statusCfg.bg, border: `1px solid ${statusCfg.border}`, borderRadius: 10, padding: 14, display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                    <statusCfg.icon size={18} color={statusCfg.color} style={{ flexShrink: 0, marginTop: 1 }} />
                    <p style={{ fontSize: 13, color: statusCfg.color, lineHeight: 1.6, margin: 0 }}>{statusCfg.desc}</p>
                  </div>
                )}

                {/* Alasan Penolakan */}
                {isDitolak && (pendaftaran.alasanPenolakan || pendaftaran.catatan) && (
                  <div style={{ background: '#FFF7ED', border: '1px solid #FED7AA', borderRadius: 10, padding: 16, marginTop: 14 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#C2410C', marginBottom: 6 }}>📋 CATATAN DARI ADMIN:</div>
                    {pendaftaran.alasanPenolakan && <p style={{ fontSize: 13, color: '#C2410C', lineHeight: 1.6, margin: 0 }}>{pendaftaran.alasanPenolakan}</p>}
                    {pendaftaran.catatan && <p style={{ fontSize: 13, color: '#EA580C', marginTop: pendaftaran.alasanPenolakan ? 8 : 0, lineHeight: 1.6, margin: 0 }}>{pendaftaran.catatan}</p>}
                  </div>
                )}

                {isDitolak && (
                  <div style={{ marginTop: 16 }}>
                    <Link href="/spmb/revisi" className="btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 14 }}>
                      <Edit3 size={16} /> Perbaiki & Kirim Ulang Berkas
                    </Link>
                    {(pendaftaran.revisiCount || 0) > 0 && <p style={{ fontSize: 12, color: '#9CA3AF', marginTop: 8 }}>Sudah direvisi {pendaftaran.revisiCount}x — riwayat tersimpan</p>}
                  </div>
                )}
              </div>

              {/* Jadwal Tes */}
              {hasTes && (
                  <div style={{ background: '#1a4e35', borderRadius: 16, padding: 28, color: 'white', border: '2px solid #C8973A' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                    <div style={{ width: 40, height: 40, background: 'rgba(200,151,58,0.2)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Bell size={20} color="#C8973A" />
                    </div>
                    <div>
                      <h3 style={{ fontSize: 16, fontWeight: 700, color: '#E8B84B', margin: 0 }}>📢 Informasi Jadwal Tes</h3>
                      <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', margin: 0 }}>Dari SMK Citra Negara</p>
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: pendaftaran.infoTes ? 16 : 0 }}>
                    <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 10, padding: '12px 16px' }}>
                      <div style={{ fontSize: 10, color: '#C8973A', fontWeight: 700, marginBottom: 4 }}>📅 TANGGAL & WAKTU</div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: 'white' }}>{pendaftaran.jadwalTes || 'Akan diinformasikan'}</div>
                    </div>
                    <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 10, padding: '12px 16px' }}>
                      <div style={{ fontSize: 10, color: '#C8973A', fontWeight: 700, marginBottom: 4 }}>📍 LOKASI</div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: 'white' }}>{pendaftaran.lokasiTes || 'SMK Citra Negara'}</div>
                    </div>
                  </div>
                  {pendaftaran.infoTes && (
                    <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 8, padding: 14 }}>
                      <div style={{ fontSize: 10, color: '#C8973A', fontWeight: 700, marginBottom: 6 }}>📝 INFORMASI TAMBAHAN</div>
                      <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)', lineHeight: 1.6, margin: 0, whiteSpace: 'pre-line' }}>{pendaftaran.infoTes}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Pengumuman Hasil */}
              {(isLulus || isTidakLulus || isDaftarUlang) && (
                <div style={{ background: (isLulus || isDaftarUlang) ? 'linear-gradient(135deg,#1E3A8A,#3B82F6)' : 'linear-gradient(135deg,#991B1B,#B91C1C)', borderRadius: 16, padding: 32, color: 'white', textAlign: 'center' }}>
                  <div style={{ fontSize: 48, marginBottom: 16 }}>{(isLulus || isDaftarUlang) ? '🎉' : '😔'}</div>
                  <h2 className="font-display" style={{ fontSize: 26, color: 'white', marginBottom: 8 }}>
                    {isDaftarUlang ? 'Daftar Ulang Selesai!' : isLulus ? 'Selamat! Anda Diterima!' : 'Mohon Maaf'}
                  </h2>
                  <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: 14, lineHeight: 1.7, marginBottom: 16 }}>
                    {isDaftarUlang
                      ? 'Daftar ulang Anda telah dikonfirmasi. Selamat bergabung sebagai peserta didik baru SMK Citra Negara!'
                      : isLulus
                      ? 'Anda dinyatakan LULUS seleksi dan diterima sebagai peserta didik baru SMK Citra Negara!'
                      : 'Anda dinyatakan tidak lulus seleksi penerimaan peserta didik baru SMK Citra Negara.'}
                  </p>

                  {/* Nilai */}
                  {(pendaftaran.nilaiTes != null || pendaftaran.nilaiSeleksi != null) && (
                    <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginBottom: 16, flexWrap: 'wrap' }}>
                      {pendaftaran.nilaiTes != null && (
                        <div style={{ background: 'rgba(255,255,255,0.12)', borderRadius: 10, padding: '12px 24px' }}>
                          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.6)', marginBottom: 4 }}>NILAI TES</div>
                          <div className="font-display" style={{ fontSize: 32, fontWeight: 800, color: 'white' }}>{pendaftaran.nilaiTes}</div>
                        </div>
                      )}
                      {pendaftaran.nilaiSeleksi != null && (
                        <div style={{ background: 'rgba(255,255,255,0.12)', borderRadius: 10, padding: '12px 24px' }}>
                          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.6)', marginBottom: 4 }}>NILAI SELEKSI</div>
                          <div className="font-display" style={{ fontSize: 32, fontWeight: 800, color: '#FEF3C7' }}>{pendaftaran.nilaiSeleksi}</div>
                        </div>
                      )}
                    </div>
                  )}

                  {pendaftaran.pesanPengumuman && (
                    <div style={{ background: 'rgba(255,255,255,0.12)', borderRadius: 10, padding: 16, marginBottom: 16 }}>
                      <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.9)', lineHeight: 1.7, margin: 0, whiteSpace: 'pre-line' }}>{pendaftaran.pesanPengumuman}</p>
                    </div>
                  )}

                  {/* Info Daftar Ulang */}
                  {isLulus && !isDaftarUlang && (
                    <div style={{ background: 'rgba(255,255,255,0.12)', borderRadius: 10, padding: 16 }}>
                      <p style={{ fontSize: 13, fontWeight: 700, color: '#FEF3C7', marginBottom: 8 }}>📌 LANGKAH SELANJUTNYA — DAFTAR ULANG:</p>
                      <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.85)', lineHeight: 1.6, margin: 0 }}>
                        Harap datang ke sekolah untuk daftar ulang secara <strong>offline</strong> dengan membawa dokumen asli. Hubungi sekolah untuk informasi jadwal daftar ulang.
                      </p>
                      <div style={{ marginTop: 12, fontSize: 13, color: '#FEF3C7', fontWeight: 600 }}>
                         0812-3456-7890 (WhatsApp)
                      </div>
                    </div>
                  )}

                  {/* Konfirmasi Daftar Ulang */}
                  {isDaftarUlang && pendaftaran.tanggalDaftarUlang && (
                    <div style={{ background: 'rgba(255,255,255,0.12)', borderRadius: 10, padding: 14 }}>
                      <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', margin: 0 }}>
                        Dikonfirmasi pada: {new Date(pendaftaran.tanggalDaftarUlang).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                      </p>
                      {pendaftaran.catatanDaftarUlang && <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.85)', marginTop: 6, margin: 0 }}>{pendaftaran.catatanDaftarUlang}</p>}
                    </div>
                  )}
                </div>
              )}

              {/* Data Pendaftaran */}
              <div style={{ background: 'white', borderRadius: 16, padding: 24, border: '1px solid #F0EBE0' }}>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0A1628', marginBottom: 18 }}>Data Pendaftaran</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  {[
                    { label: 'Nama Lengkap', val: pendaftaran.namaLengkap },
                    { label: 'Jurusan Pilihan', val: pendaftaran.jurusan },
                    { label: 'Asal Sekolah', val: pendaftaran.asalSMP || pendaftaran.asalSekolah || '-' },
                    { label: 'Tanggal Daftar', val: new Date(pendaftaran.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) },
                  ].map(({ label, val }) => (
                    <div key={label} style={{ background: '#FAFAFA', borderRadius: 10, padding: '12px 14px' }}>
                      <div style={{ fontSize: 11, color: '#9CA3AF', fontWeight: 600, marginBottom: 4 }}>{label}</div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: '#0A1628' }}>{val}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* RIGHT */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Tahapan */}
              <div style={{ background: ' #083d1e', borderRadius: 16, padding: 22, color: 'white' }}>
                <h4 style={{ fontSize: 14, fontWeight: 700, color: '#E8B84B', marginBottom: 16 }}>Tahapan Selanjutnya</h4>
                {[
                  { step: 'Tunggu verifikasi dari admin', done: currentStep > 2 },
                  { step: 'Ikuti proses seleksi di sekolah', done: currentStep > 3 },
                  { step: 'Cek pengumuman hasil seleksi', done: isDone },
                  { step: 'Daftar ulang ke sekolah (offline)', done: isDaftarUlang },
                ].map((item, i) => (
                  <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 12, alignItems: 'flex-start' }}>
                    <div style={{ width: 22, height: 22, borderRadius: '50%', background: item.done ? '#C8973A' : 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 11, fontWeight: 700, color: item.done ? '#0A1628' : 'rgba(255,255,255,0.3)' }}>
                      {item.done ? '✓' : i + 1}
                    </div>
                    <span style={{ fontSize: 13, color: item.done ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.5)', lineHeight: 1.4 }}>{item.step}</span>
                  </div>
                ))}
              </div>

              {/* Berkas */}
              <div style={{ background: 'white', borderRadius: 16, padding: 20, border: '1px solid #F0EBE0' }}>
                <h4 style={{ fontSize: 14, fontWeight: 700, color: '#0A1628', marginBottom: 14 }}>Berkas yang Diupload</h4>
                {[
                  { label: 'Ijazah', path: pendaftaran.fileIjazah },
                  { label: 'Akte', path: pendaftaran.fileAkte },
                  { label: 'Kartu Keluarga', path: pendaftaran.fileKK },
                  { label: 'KTP Ortu', path: pendaftaran.fileKtpOrtu },
                  { label: 'Kartu KIP', path: pendaftaran.fileKip },
                  { label: 'Pas Foto', path: pendaftaran.fileFoto },
                ].map((f, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: i < 5 ? '1px solid #F3F4F6' : 'none' }}>
                    <span style={{ fontSize: 13, color: '#374151' }}>{f.label}</span>
                    {f.path
                      ? <a href={f.path} target="_blank" rel="noreferrer" style={{ fontSize: 12, color: '#C8973A', fontWeight: 600, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>Lihat <ChevronRight size={12} /></a>
                      : <span style={{ fontSize: 11, color: '#D1D5DB' }}>—</span>}
                  </div>
                ))}
              </div>

              {/* Bantuan */}
              <div style={{ background: 'white', borderRadius: 16, padding: 20, border: '1px solid #F0EBE0' }}>
                <h4 style={{ fontSize: 14, fontWeight: 700, color: '#0A1628', marginBottom: 10 }}>Butuh Bantuan?</h4>
                <p style={{ fontSize: 13, color: '#6B7280', lineHeight: 1.6, marginBottom: 12 }}>Hubungi kami jika ada pertanyaan seputar SPMB.</p>
                <div style={{ fontSize: 13, color: '#C8973A', fontWeight: 600 }}>📞 (021) 7720-1052</div>
                <div style={{ fontSize: 13, color: '#C8973A', fontWeight: 600, marginTop: 6}}>💬 0812-3456-7890 (WhatsApp)</div>
                <div style={{ fontSize: 13, color: '#C8973A', fontWeight: 600, marginTop: 6 }}>📧 info@citranegara.sch.id</div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
