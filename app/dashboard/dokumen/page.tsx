'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle, Clock, AlertCircle, FileWarning, ExternalLink } from 'lucide-react';
import PortalShell, { PortalContext } from '@/components/portal/PortalShell';
import { daftarBerkas } from '@/components/portal/statusConfig';

// Status per-dokumen diturunkan dari data yang SUDAH ADA (file terupload +
// status pendaftaran) — bukan field/status baru di database.
function statusBerkas(path: string | undefined, pendaftaranStatus: string): { label: string; color: string; bg: string; icon: any } {
  if (!path) return { label: 'Belum Tersedia', color: 'var(--adm-text-faint)', bg: 'var(--adm-neutral-weak)', icon: AlertCircle };
  if (pendaftaranStatus === 'ditolak') return { label: 'Perlu Direvisi', color: 'var(--adm-danger)', bg: 'var(--adm-danger-weak)', icon: FileWarning };
  if (pendaftaranStatus === 'diterima_berkas') return { label: 'Lengkap', color: 'var(--adm-success)', bg: 'var(--adm-success-weak)', icon: CheckCircle };
  return { label: 'Menunggu Verifikasi', color: 'var(--adm-info)', bg: 'var(--adm-info-weak)', icon: Clock };
}

export default function DokumenPage() {
  return (
    <PortalShell active="dokumen">
      {(ctx) => <DokumenContent {...ctx} />}
    </PortalShell>
  );
}

function DokumenContent({ pendaftaran }: PortalContext) {
  const router = useRouter();

  useEffect(() => {
    if (pendaftaran === null) router.replace('/dashboard');
  }, [pendaftaran, router]);

  if (!pendaftaran) return null;

  const berkas = daftarBerkas(pendaftaran);
  const jumlahLengkap = berkas.filter(b => !!b.path).length;
  const kurangWajib = berkas.filter(b => b.wajib && !b.path).length;

  // Ke mana tombol "Lengkapi" mengarah — pakai alur yang SUDAH ADA, bukan
  // upload baru di halaman ini: draft -> lanjutkan formulir, ditolak -> revisi.
  const lengkapiHref = pendaftaran.status === 'ditolak' ? '/spmb/revisi' : pendaftaran.status === 'draft' ? '/spmb/daftar' : null;

  return (
    <div style={{ maxWidth: 760, margin: '0 auto' }}>
      <div style={{ marginBottom: 18 }}>
        <h1 className="font-display" style={{ fontSize: 22, color: 'var(--adm-text)', marginBottom: 2 }}>Dokumen</h1>
        <p style={{ color: 'var(--adm-text-muted)', fontSize: 13.5 }}>Status berkas persyaratan pendaftaran Anda.</p>
      </div>

      <div style={{ background: 'var(--adm-surface)', borderRadius: 14, padding: 22, border: '1px solid var(--adm-border)', marginBottom: 18 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, flexWrap: 'wrap', gap: 8 }}>
          <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--adm-text)' }}>{jumlahLengkap} dari {berkas.length} berkas terupload</span>
          {kurangWajib > 0 ? (
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--adm-warning)' }}>{kurangWajib} dokumen perlu dilengkapi</span>
          ) : (
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--adm-success)' }}>Berkas wajib lengkap</span>
          )}
        </div>
        <div style={{ height: 8, background: 'var(--adm-neutral-weak)', borderRadius: 6, overflow: 'hidden', marginBottom: kurangWajib > 0 && lengkapiHref ? 14 : 0 }}>
          <div style={{ height: '100%', width: `${(jumlahLengkap / berkas.length) * 100}%`, background: kurangWajib > 0 ? 'var(--cn-emas)' : 'var(--cn-hijau)', borderRadius: 6, transition: 'width 0.3s' }} />
        </div>
        {kurangWajib > 0 && lengkapiHref && (
          <Link href={lengkapiHref} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 700, color: 'var(--adm-secondary)', textDecoration: 'none', background: 'var(--adm-secondary-weak)', padding: '9px 16px', borderRadius: 8 }}>
            Lengkapi Dokumen
          </Link>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {berkas.map(b => {
          const st = statusBerkas(b.path, pendaftaran.status);
          return (
            <div key={b.key} style={{ background: 'var(--adm-surface)', borderRadius: 12, padding: '14px 18px', border: '1px solid var(--adm-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
                <div style={{ width: 38, height: 38, borderRadius: '50%', background: st.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <st.icon size={17} color={st.color} />
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--adm-text)' }}>{b.label}{!b.wajib && <span style={{ fontSize: 11, color: 'var(--adm-text-faint)', fontWeight: 500 }}> (Jika Ada)</span>}</div>
                  <span style={{ fontSize: 11.5, fontWeight: 700, color: st.color }}>{st.label}</span>
                </div>
              </div>
              {b.path ? (
                <a href={b.path} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, fontWeight: 700, color: 'var(--adm-secondary)', textDecoration: 'none', background: 'var(--adm-secondary-weak)', padding: '8px 14px', borderRadius: 8, flexShrink: 0 }}>
                  Lihat <ExternalLink size={12} />
                </a>
              ) : lengkapiHref ? (
                <Link href={lengkapiHref} style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--cn-hijau)', textDecoration: 'none', flexShrink: 0 }}>Lengkapi →</Link>
              ) : (
                <span style={{ fontSize: 12, color: 'var(--adm-text-faint)', flexShrink: 0 }}>—</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
