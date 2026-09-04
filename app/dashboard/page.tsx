'use client';
import { useState } from 'react';
import Link from 'next/link';
import {
  ClipboardList, CheckCircle, XCircle, AlertCircle,
  ChevronRight, Edit3, Wallet, FolderOpen, PartyPopper,
} from 'lucide-react';
import PortalShell, { PortalContext } from '@/components/portal/PortalShell';
import { STATUS_CONFIG, TAHAPAN, daftarBerkas, teksSelanjutnya } from '@/components/portal/statusConfig';
import { formatRupiah } from '@/lib/pembayaran-utils';

// ---------------------------------------------------------------------
// Dashboard = RINGKASAN saja (section 3 di brief UI/UX). Detail lengkap
// pendaftaran/pembayaran/dokumen ada di halaman masing-masing — di sini
// cukup status, hal yang perlu dilakukan, dan angka ringkas + tombol
// "Lihat Detail"/"Lihat Pembayaran"/"Lihat Dokumen".
// ---------------------------------------------------------------------

export default function DashboardPage() {
  return (
    <PortalShell active="dashboard">
      {(ctx) => <DashboardContent {...ctx} />}
    </PortalShell>
  );
}

function DashboardContent({ session, pendaftaran, riwayat, dokumenSekolah, reload }: PortalContext) {
  const [kirimLoading, setKirimLoading] = useState(false);
  const [kirimError, setKirimError] = useState('');

  const handleKirimFormulir = async () => {
    setKirimLoading(true);
    setKirimError('');
    try {
      const res = await fetch('/api/pendaftaran/kirim', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) { setKirimError(data.error || 'Gagal mengirim formulir'); setKirimLoading(false); return; }
      reload();
    } catch {
      setKirimError('Terjadi kesalahan jaringan');
    } finally {
      setKirimLoading(false);
    }
  };

  const namaDepan = session?.namaLengkap?.split(' ')[0] || 'Siswa';

  // ── Akun tanpa data pendaftaran sama sekali ────────────────────────
  // Kasus langka: akun lama dari sebelum jenjang ditentukan saat
  // registrasi. Jenjang TIDAK ditanya ulang di dashboard (section 6 brief
  // alur registrasi) — arahkan ke admin untuk penanganan manual.
  if (!pendaftaran) {
    return (
      <div style={{ maxWidth: 600, margin: '0 auto' }}>
        <Greeting nama={namaDepan} />
        <EmptyPromptCard
          title="Belum Ada Pendaftaran"
          desc="Akun Anda belum terhubung dengan data pendaftaran. Silakan hubungi admin sekolah untuk bantuan."
        />
      </div>
    );
  }

  // ── Sudah punya akun (jenjang sudah ditentukan saat registrasi) tapi
  // belum mulai mengisi formulir sama sekali ────────────────────────
  if (pendaftaran.status === 'draft' && !pendaftaran.namaLengkap) {
    return (
      <div style={{ maxWidth: 600, margin: '0 auto' }}>
        <Greeting nama={namaDepan} />
        <EmptyPromptCard
          title="Belum Ada Pendaftaran"
          desc="Lengkapi formulir pendaftaran Anda untuk melanjutkan proses penerimaan murid baru."
          ctaLabel="Mulai Pendaftaran"
          ctaHref={`/spmb/daftar?jenjang=${pendaftaran.jenjang || 'smk'}`}
        />
      </div>
    );
  }

  const isDraft = pendaftaran.status === 'draft';
  const isDitolak = pendaftaran.status === 'ditolak';
  const isDiterima = pendaftaran.status === 'diterima_berkas';
  const isDaftarUlang = !!pendaftaran.sudahDaftarUlang;
  const statusCfg = !isDraft ? (STATUS_CONFIG[pendaftaran.status] || STATUS_CONFIG['verified']) : null;
  const currentStep = statusCfg?.step || 0;
  const selanjutnya = !isDraft ? teksSelanjutnya(pendaftaran.status, pendaftaran.sudahDaftarUlang) : '';

  const totalTagihan = riwayat?.totalTagihan ?? 0;
  const totalDibayar = riwayat?.totalDibayar ?? 0;
  const kelebihanBayar = riwayat?.lebihBayar ?? 0;
  const sisaBayar = riwayat?.sisaBayar ?? 0;
  const totalDisetorkan = riwayat?.totalDisetorkan ?? 0;
  const minimalPembayaranAwal = riwayat?.minimalPembayaranAwal || 200000;
  const bolehKirim = totalDisetorkan >= minimalPembayaranAwal;
  const statusLunas = totalTagihan > 0 && sisaBayar <= 0;

  const berkas = daftarBerkas(pendaftaran);
  const jumlahLengkap = berkas.filter(b => !!b.path).length;
  const kurangWajib = berkas.filter(b => b.wajib && !b.path).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18, maxWidth: 760, margin: '0 auto' }}>
      {/* 1. Greeting */}
      <Greeting nama={namaDepan} />

      {/* 2. Status Pendaftaran */}
      <Card>
        <CardHeader
          title="Status Pendaftaran"
          badge={
            isDraft
              ? <Badge label="Draft — Belum Dikirim" color="var(--adm-warning)" bg="var(--adm-warning-weak)" border="var(--adm-warning-border)" />
              : statusCfg && <Badge label={statusCfg.label} color={statusCfg.color} bg={statusCfg.bg} border={statusCfg.border} Icon={statusCfg.icon} />
          }
        />
        {isDraft ? (
          <p style={{ fontSize: 13.5, color: 'var(--adm-text-muted)', lineHeight: 1.7 }}>
            Formulir Anda tersimpan sebagai draft dan <strong>belum masuk ke admin</strong>. Lengkapi data, berkas, dan pembayaran untuk dapat mengirim formulir.
          </p>
        ) : (
          <>
            <ProgressTahapan currentStep={currentStep} isDitolak={isDitolak} />
            {selanjutnya && (
              <div style={{ marginTop: 16 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--adm-text-faint)', marginBottom: 4, letterSpacing: 0.3 }}>SELANJUTNYA</div>
                <p style={{ fontSize: 13, color: 'var(--adm-text)', lineHeight: 1.6, margin: 0 }}>{selanjutnya}</p>
              </div>
            )}
          </>
        )}
        <div style={{ marginTop: 16 }}>
          <Link href="/dashboard/pendaftaran" style={linkButtonStyle}>
            Lihat Detail Pendaftaran <ChevronRight size={14} />
          </Link>
        </div>
      </Card>

      {/* 3. Ringkasan Tindakan */}
      <Card accent={isDitolak ? 'var(--adm-danger)' : isDraft && !bolehKirim ? 'var(--cn-emas)' : undefined}>
        <h3 style={sectionTitleStyle}>Yang Perlu Dilakukan</h3>
        {isDitolak ? (
          <TindakanBlock
            tone="error"
            text={pendaftaran.alasanPenolakan || pendaftaran.catatan || 'Admin meminta Anda memperbaiki berkas pendaftaran.'}
            actionLabel="Perbaiki & Kirim Ulang Berkas"
            actionHref="/spmb/revisi"
            icon={XCircle}
          />
        ) : isDraft ? (
          <TindakanBlock
            tone={bolehKirim ? 'success' : 'warning'}
            text={
              bolehKirim
                ? 'Anda sudah membayar uang pendaftaran. Periksa kembali data & berkas Anda, lalu kirim formulir ke admin.'
                : `Bayar uang pendaftaran minimal ${formatRupiah(minimalPembayaranAwal)} agar formulir dapat dikirim ke admin. Sudah disetor: ${formatRupiah(totalDisetorkan)}.`
            }
            icon={bolehKirim ? CheckCircle : AlertCircle}
            customAction={
              bolehKirim ? (
                <div>
                  {kirimError && <ErrorBox text={kirimError} />}
                  <button onClick={handleKirimFormulir} disabled={kirimLoading} className="btn-primary" style={{ fontSize: 13.5, opacity: kirimLoading ? 0.6 : 1, marginTop: kirimError ? 8 : 0 }}>
                    {kirimLoading ? 'Mengirim...' : 'Kirim Formulir ke Admin'}
                  </button>
                </div>
              ) : (
                <Link href="/dashboard/pembayaran" style={linkButtonStyle}>Lengkapi Pembayaran <ChevronRight size={14} /></Link>
              )
            }
          />
        ) : !isDraft && sisaBayar > 0 && !isDitolak ? (
          <TindakanBlock
            tone="warning"
            text={`Anda masih memiliki sisa tagihan ${formatRupiah(sisaBayar)} yang perlu dilunasi.`}
            actionLabel="Lanjutkan Pembayaran"
            actionHref="/dashboard/pembayaran"
            icon={Wallet}
          />
        ) : kurangWajib > 0 ? (
          <TindakanBlock
            tone="warning"
            text={`${kurangWajib} dokumen wajib belum dilengkapi.`}
            actionLabel="Lengkapi Dokumen"
            actionHref="/dashboard/dokumen"
            icon={FolderOpen}
          />
        ) : isDiterima && !pendaftaran.sudahDaftarUlang ? (
          <TindakanBlock tone="success" text="Anda dinyatakan diterima. Lakukan daftar ulang sesuai informasi di bagian bawah halaman ini." icon={CheckCircle} />
        ) : (
          <TindakanBlock tone="success" text="Tidak ada tindakan yang perlu dilakukan saat ini. Mohon tunggu proses dari admin." icon={CheckCircle} />
        )}
      </Card>

      {/* 4. Ringkasan Pembayaran */}
      <Card>
        <CardHeader title="Pembayaran" badge={statusLunas ? <Badge label="Lunas" color="var(--adm-success)" bg="var(--adm-success-weak)" border="var(--adm-success-border)" /> : undefined} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 10, marginBottom: 16 }}>
          <MiniStat label="Total Tagihan" value={formatRupiah(totalTagihan)} />
          <MiniStat label="Total Dibayar" value={formatRupiah(totalDibayar)} tone="success" />
          {kelebihanBayar > 0 ? (
            <MiniStat label="Kelebihan" value={formatRupiah(kelebihanBayar)} tone="info" />
          ) : (
            <MiniStat label={sisaBayar > 0 ? 'Sisa Tagihan' : 'Status'} value={sisaBayar > 0 ? formatRupiah(sisaBayar) : 'Lunas'} tone={sisaBayar > 0 ? 'warning' : 'success'} />
          )}
        </div>
        <Link href="/dashboard/pembayaran" style={linkButtonStyle}>Lihat Pembayaran <ChevronRight size={14} /></Link>
      </Card>

      {/* 5. Ringkasan Dokumen */}
      <Card>
        <CardHeader title="Dokumen" />
        <p style={{ fontSize: 13.5, color: 'var(--adm-text)', marginBottom: 10 }}>{jumlahLengkap} dari {berkas.length} berkas terupload</p>
        <div style={{ height: 8, background: 'var(--adm-neutral-weak)', borderRadius: 6, overflow: 'hidden', marginBottom: 12 }}>
          <div style={{ height: '100%', width: `${(jumlahLengkap / berkas.length) * 100}%`, background: kurangWajib > 0 ? 'var(--cn-emas)' : 'var(--cn-hijau)', borderRadius: 6, transition: 'width 0.3s' }} />
        </div>
        {kurangWajib > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--adm-warning-weak)', border: '1px solid var(--adm-warning-border)', borderRadius: 8, padding: '9px 12px', marginBottom: 12 }}>
            <AlertCircle size={14} color="var(--adm-warning)" style={{ flexShrink: 0 }} />
            <span style={{ fontSize: 12.5, color: 'var(--adm-warning)' }}>{kurangWajib} dokumen perlu dilengkapi</span>
          </div>
        )}
        <Link href="/dashboard/dokumen" style={linkButtonStyle}>Lihat Dokumen <ChevronRight size={14} /></Link>
      </Card>

      {/* 6. Informasi/Pengumuman penting */}
      {isDiterima && (
        <div style={{ background: 'linear-gradient(135deg,#123524,#0B2A1C)', borderRadius: 16, padding: 26, color: 'white', border: '1px solid #C8973A' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
            <PartyPopper size={26} color="#E8B84B" />
            <h2 className="font-display" style={{ fontSize: 19, color: 'white', margin: 0 }}>
              {isDaftarUlang ? 'Daftar Ulang Selesai!' : 'Selamat! Anda Diterima!'}
            </h2>
          </div>
          <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: 13, lineHeight: 1.7, marginBottom: pendaftaran.pesanPengumuman || (!isDaftarUlang && dokumenSekolah.some(d => d.url)) ? 14 : 0 }}>
            {isDaftarUlang
              ? 'Daftar ulang Anda telah dikonfirmasi. Selamat bergabung sebagai peserta didik baru!'
              : 'Anda dinyatakan diterima sebagai peserta didik baru. Segera lakukan daftar ulang sesuai informasi di bawah.'}
          </p>

          {pendaftaran.pesanPengumuman && (
            <div style={{ background: 'rgba(255,255,255,0.1)', borderRadius: 10, padding: 14, marginBottom: 14 }}>
              <p style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.9)', lineHeight: 1.7, margin: 0, whiteSpace: 'pre-line' }}>{pendaftaran.pesanPengumuman}</p>
            </div>
          )}

          {!isDaftarUlang && dokumenSekolah.some(d => d.url) && (
            <div style={{ background: 'rgba(255,255,255,0.1)', borderRadius: 10, padding: 14, marginBottom: 14 }}>
              <p style={{ fontSize: 12.5, fontWeight: 700, color: '#FEF3C7', marginBottom: 8 }}>Download & Lengkapi Dokumen Daftar Ulang</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {dokumenSekolah.filter(d => d.url).map(d => (
                  <a key={d.jenis} href={d.url} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(255,255,255,0.08)', borderRadius: 8, padding: '9px 12px', color: 'white', textDecoration: 'none', fontSize: 12.5 }}>
                    {d.nama} <span style={{ fontSize: 11, color: '#FEF3C7' }}>Download ↓</span>
                  </a>
                ))}
              </div>
            </div>
          )}

          {!isDaftarUlang ? (
            <p style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.75)', lineHeight: 1.6, margin: 0 }}>
              Segera datang ke sekolah dengan membawa dokumen di atas yang sudah diisi/ditandatangani. Informasi lebih lanjut akan disampaikan melalui WhatsApp.
            </p>
          ) : pendaftaran.tanggalDaftarUlang && (
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', margin: 0 }}>
              Dikonfirmasi pada {new Date(pendaftaran.tanggalDaftarUlang).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// =====================================================================
// Sub-komponen tampilan kecil — dipakai berulang di halaman ini.
// =====================================================================

function Greeting({ nama }: { nama: string }) {
  return (
    <div>
      <h1 className="font-display" style={{ fontSize: 24, color: 'var(--adm-text)', marginBottom: 2 }}>Halo, {nama} 👋</h1>
      <p style={{ color: 'var(--adm-text-muted)', fontSize: 13.5 }}>Berikut ringkasan pendaftaran SPMB Anda.</p>
    </div>
  );
}

function EmptyPromptCard({ title, desc, ctaLabel, ctaHref }: { title: string; desc: string; ctaLabel?: string; ctaHref?: string }) {
  return (
    <div style={{ background: 'var(--adm-surface)', borderRadius: 14, padding: 24, border: '1px solid var(--adm-border)', boxShadow: 'var(--adm-shadow-sm)' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: ctaLabel ? 20 : 0 }}>
        <div style={{ width: 38, height: 38, background: 'var(--adm-warning-weak)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <ClipboardList size={18} color="var(--adm-warning)" />
        </div>
        <div>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--adm-text)', margin: 0, marginBottom: 4 }}>{title}</h2>
          <p style={{ color: 'var(--adm-text-muted)', fontSize: 13, lineHeight: 1.55, margin: 0 }}>{desc}</p>
        </div>
      </div>
      {ctaLabel && ctaHref && (
        <Link href={ctaHref} className="btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: 13.5 }}>
          {ctaLabel} <ChevronRight size={15} />
        </Link>
      )}
    </div>
  );
}

function Card({ children, accent }: { children: React.ReactNode; accent?: string }) {
  return (
    <div style={{ background: 'var(--adm-surface)', borderRadius: 14, padding: 22, border: accent ? `1.5px solid ${accent}` : '1px solid var(--adm-border)' }}>
      {children}
    </div>
  );
}

function CardHeader({ title, badge }: { title: string; badge?: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, flexWrap: 'wrap', gap: 8 }}>
      <h3 style={sectionTitleStyle}>{title}</h3>
      {badge}
    </div>
  );
}

function Badge({ label, color, bg, border, Icon }: { label: string; color: string; bg: string; border: string; Icon?: any }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: bg, color, border: `1px solid ${border}`, padding: '4px 12px', borderRadius: 20, fontSize: 11.5, fontWeight: 700 }}>
      {Icon && <Icon size={12} />} {label}
    </span>
  );
}

function MiniStat({ label, value, tone }: { label: string; value: string; tone?: 'success' | 'warning' | 'info' }) {
  const map = {
    success: { bg: 'var(--adm-success-weak)', color: 'var(--adm-success)' },
    warning: { bg: 'var(--adm-warning-weak)', color: 'var(--adm-warning)' },
    info: { bg: 'var(--adm-info-weak)', color: 'var(--adm-info)' },
  };
  const c = tone ? map[tone] : { bg: 'var(--adm-surface-alt)', color: 'var(--adm-text)' };
  return (
    <div style={{ background: c.bg, borderRadius: 10, padding: '11px 13px' }}>
      <div style={{ fontSize: 10, color: c.color, fontWeight: 700, opacity: 0.8, marginBottom: 2 }}>{label.toUpperCase()}</div>
      <div style={{ fontSize: 14.5, fontWeight: 700, color: c.color }}>{value}</div>
    </div>
  );
}

function ProgressTahapan({ currentStep, isDitolak }: { currentStep: number; isDitolak: boolean }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start' }}>
      {TAHAPAN.map((t, i) => {
        const done = currentStep > t.step;
        const activeStep = currentStep === t.step;
        const isRejected = isDitolak && t.step === 1;
        return (
          <div key={t.step} style={{ display: 'flex', alignItems: 'flex-start', flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, minWidth: 0 }}>
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: isRejected ? 'var(--adm-danger-weak)' : done || activeStep ? 'linear-gradient(135deg,var(--cn-emas),var(--cn-emas-terang))' : 'var(--adm-neutral-weak)', border: isRejected ? '2px solid var(--adm-danger-border)' : 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 13, color: isRejected ? 'var(--adm-danger)' : done || activeStep ? '#0A1628' : 'var(--adm-text-faint)', marginBottom: 6, flexShrink: 0 }}>
                {isRejected ? '✗' : done ? '✓' : t.step}
              </div>
              <span style={{ fontSize: 10.5, fontWeight: activeStep ? 700 : 500, color: isRejected ? 'var(--adm-danger)' : activeStep ? 'var(--cn-emas)' : done ? 'var(--adm-text)' : 'var(--adm-text-faint)', textAlign: 'center' }}>{t.label}</span>
            </div>
            {i < TAHAPAN.length - 1 && <div style={{ height: 2, flex: 0.5, background: done ? 'var(--cn-emas)' : 'var(--adm-border)', margin: '15px 2px 0', flexShrink: 0 }} />}
          </div>
        );
      })}
    </div>
  );
}

function TindakanBlock({
  tone, text, icon: Icon, actionLabel, actionHref, customAction,
}: {
  tone: 'success' | 'warning' | 'error';
  text: string;
  icon: any;
  actionLabel?: string;
  actionHref?: string;
  customAction?: React.ReactNode;
}) {
  const map = {
    success: { bg: 'var(--adm-success-weak)', border: 'var(--adm-success-border)', color: 'var(--adm-success)' },
    warning: { bg: 'var(--adm-warning-weak)', border: 'var(--adm-warning-border)', color: 'var(--adm-warning)' },
    error: { bg: 'var(--adm-danger-weak)', border: 'var(--adm-danger-border)', color: 'var(--adm-danger)' },
  };
  const c = map[tone];
  return (
    <div style={{ background: c.bg, border: `1px solid ${c.border}`, borderRadius: 10, padding: 14 }}>
      <div style={{ display: 'flex', gap: 9, alignItems: 'flex-start', marginBottom: actionLabel || customAction ? 12 : 0 }}>
        <Icon size={17} color={c.color} style={{ flexShrink: 0, marginTop: 1 }} />
        <p style={{ fontSize: 13, color: c.color, lineHeight: 1.6, margin: 0 }}>{text}</p>
      </div>
      {customAction}
      {actionLabel && actionHref && (
        <Link href={actionHref} className="btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: 13 }}>
          <Edit3 size={14} /> {actionLabel}
        </Link>
      )}
    </div>
  );
}

function ErrorBox({ text }: { text: string }) {
  return <div style={{ background: 'var(--adm-danger-weak)', border: '1px solid var(--adm-danger-border)', borderRadius: 8, padding: 9, fontSize: 12, color: 'var(--adm-danger)' }}>{text}</div>;
}

const sectionTitleStyle: React.CSSProperties = { fontSize: 15, fontWeight: 700, color: 'var(--adm-text)', margin: 0 };

const linkButtonStyle: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 700,
  color: 'var(--adm-secondary)', textDecoration: 'none', background: 'var(--adm-secondary-weak)', padding: '9px 16px', borderRadius: 8,
};
