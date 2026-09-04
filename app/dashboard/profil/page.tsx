'use client';
import { User, Mail, ShieldCheck } from 'lucide-react';
import PortalShell, { PortalContext } from '@/components/portal/PortalShell';

export default function ProfilPage() {
  return (
    <PortalShell active="profil">
      {(ctx) => <ProfilContent {...ctx} />}
    </PortalShell>
  );
}

function ProfilContent({ session, pendaftaran }: PortalContext) {
  const initial = (session?.namaLengkap || session?.email || '?').trim().charAt(0).toUpperCase();

  return (
    <div style={{ maxWidth: 520, margin: '0 auto' }}>
      <div style={{ marginBottom: 18 }}>
        <h1 className="font-display" style={{ fontSize: 22, color: 'var(--adm-text)', marginBottom: 2 }}>Profil</h1>
        <p style={{ color: 'var(--adm-text-muted)', fontSize: 13.5 }}>Informasi akun Anda.</p>
      </div>

      <div style={{ background: 'var(--adm-surface)', borderRadius: 14, padding: 24, border: '1px solid var(--adm-border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 22 }}>
          <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'var(--cn-emas)', color: '#0A1628', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 800, flexShrink: 0 }}>{initial}</div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--adm-text)' }}>{session?.namaLengkap || pendaftaran?.namaLengkap || 'Pengguna'}</div>
            <div style={{ fontSize: 12.5, color: 'var(--adm-text-muted)' }}>Akun Siswa/Calon Peserta Didik</div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <ProfilField icon={User} label="Nama Lengkap" value={session?.namaLengkap || pendaftaran?.namaLengkap || '-'} />
          <ProfilField icon={Mail} label="Email" value={session?.email || '-'} />
          <ProfilField icon={ShieldCheck} label="Peran" value="Pendaftar SPMB" />
        </div>
      </div>
    </div>
  );
}

function ProfilField({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', background: 'var(--adm-surface-alt)', borderRadius: 10 }}>
      <Icon size={16} color="var(--cn-hijau)" style={{ flexShrink: 0 }} />
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 11, color: 'var(--adm-text-faint)', fontWeight: 600 }}>{label}</div>
        <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--adm-text)', overflow: 'hidden', textOverflow: 'ellipsis' }}>{value}</div>
      </div>
    </div>
  );
}
