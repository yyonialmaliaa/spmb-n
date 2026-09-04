'use client';

// =====================================================================
// Dialog kecil untuk menu yang terkunci (Pendaftaran/Pembayaran/Dokumen)
// saat formulir pendaftaran belum MULAI diisi — jenjang sudah ditentukan
// sejak registrasi akun, jadi yang kurang di sini bukan "pilih jenjang"
// lagi, melainkan "isi formulirnya" (section 6: jenjang tidak ditanya
// ulang di mana pun). CTA-nya karena itu langsung ke formulir sesuai
// jenjang akun (ctaHref dikirim oleh PortalShell), bukan ke Dashboard.
// =====================================================================

import { useEffect } from 'react';
import Link from 'next/link';
import { Lock, X } from 'lucide-react';

const KONTEN: Record<'pendaftaran' | 'pembayaran' | 'dokumen', { title: string; message: string }> = {
  pendaftaran: {
    title: 'Formulir Belum Diisi',
    message: 'Anda belum mengisi formulir pendaftaran. Lengkapi formulir terlebih dahulu untuk melanjutkan proses penerimaan murid baru.',
  },
  pembayaran: {
    title: 'Pembayaran Belum Tersedia',
    message: 'Lengkapi formulir pendaftaran Anda terlebih dahulu untuk mengakses pembayaran.',
  },
  dokumen: {
    title: 'Dokumen Belum Tersedia',
    message: 'Lengkapi formulir pendaftaran Anda terlebih dahulu untuk mengakses dokumen pendaftaran.',
  },
};

export default function LockedFeatureDialog({ jenis, ctaHref, onClose }: { jenis: 'pendaftaran' | 'pembayaran' | 'dokumen'; ctaHref: string; onClose: () => void }) {
  const isi = KONTEN[jenis];

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose]);

  return (
    <div
      onClick={onClose}
      style={{ position: 'fixed', inset: 0, background: 'rgba(10,22,40,0.45)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
    >
      <style>{`
        @keyframes lockedDialogIn { from { opacity: 0; transform: translateY(12px) scale(0.97); } to { opacity: 1; transform: translateY(0) scale(1); } }
      `}</style>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={isi.title}
        onClick={e => e.stopPropagation()}
        style={{ position: 'relative', background: 'var(--adm-surface)', borderRadius: 16, padding: '30px 24px 24px', maxWidth: 380, width: '100%', textAlign: 'center', animation: 'lockedDialogIn 0.18s ease-out', boxShadow: '0 20px 60px rgba(10,22,40,0.25)' }}
      >
        <button
          onClick={onClose}
          aria-label="Tutup dialog"
          style={{ position: 'absolute', top: 12, right: 12, background: 'var(--adm-neutral-weak)', border: 'none', borderRadius: 8, width: 26, height: 26, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
        >
          <X size={13} color="var(--adm-text-muted)" />
        </button>

        <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'var(--adm-warning-weak)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
          <Lock size={24} color="var(--adm-warning)" />
        </div>
        <h3 style={{ fontSize: 17, fontWeight: 700, color: 'var(--adm-text)', marginBottom: 8 }}>{isi.title}</h3>
        <p style={{ fontSize: 13.5, color: 'var(--adm-text-muted)', lineHeight: 1.6, marginBottom: 22 }}>{isi.message}</p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <Link href={ctaHref} onClick={onClose} className="btn-primary" style={{ textAlign: 'center', fontSize: 14 }}>
            Mulai Pendaftaran
          </Link>
          <button
            onClick={onClose}
            style={{ background: 'none', border: '1px solid var(--adm-border)', borderRadius: 8, padding: '10px', fontSize: 13.5, fontWeight: 600, color: 'var(--adm-text)', cursor: 'pointer', fontFamily: 'inherit' }}
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
