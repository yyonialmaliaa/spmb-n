'use client';

// =====================================================================
// Popup notifikasi satu-kali di Dashboard — dipakai untuk dua momen
// penting yang mudah terlewat kalau hanya berupa card di tengah halaman:
// "pembayaran minimal sudah lunas, saatnya kirim formulir" dan "pendaftaran
// diterima, saatnya unduh dokumen daftar ulang". Kemunculannya ("sekali per
// pendaftaran, sampai ditutup") diatur oleh pemanggil lewat localStorage —
// komponen ini murni tampilan modalnya saja.
// =====================================================================

import { useEffect } from 'react';
import { X } from 'lucide-react';

export default function InfoPopupDialog({
  icon: Icon, iconColor, iconBg, title, message, aksiLabel, onAksi, onClose,
}: {
  icon: any;
  iconColor: string;
  iconBg: string;
  title: string;
  message: string;
  aksiLabel: string;
  onAksi: () => void;
  onClose: () => void;
}) {
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
        @keyframes infoPopupIn { from { opacity: 0; transform: translateY(12px) scale(0.97); } to { opacity: 1; transform: translateY(0) scale(1); } }
      `}</style>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={e => e.stopPropagation()}
        style={{ position: 'relative', background: 'var(--adm-surface)', borderRadius: 16, padding: '30px 24px 24px', maxWidth: 380, width: '100%', textAlign: 'center', animation: 'infoPopupIn 0.18s ease-out', boxShadow: '0 20px 60px rgba(10,22,40,0.25)' }}
      >
        <button
          onClick={onClose}
          aria-label="Tutup"
          style={{ position: 'absolute', top: 12, right: 12, background: 'var(--adm-neutral-weak)', border: 'none', borderRadius: 8, width: 26, height: 26, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
        >
          <X size={13} color="var(--adm-text-muted)" />
        </button>

        <div style={{ width: 56, height: 56, borderRadius: '50%', background: iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
          <Icon size={24} color={iconColor} />
        </div>
        <h3 style={{ fontSize: 17, fontWeight: 700, color: 'var(--adm-text)', marginBottom: 8 }}>{title}</h3>
        <p style={{ fontSize: 13.5, color: 'var(--adm-text-muted)', lineHeight: 1.6, marginBottom: 22 }}>{message}</p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <button
            onClick={() => { onAksi(); onClose(); }}
            className="btn-primary"
            style={{ fontSize: 14 }}
          >
            {aksiLabel}
          </button>
          <button
            onClick={onClose}
            style={{ background: 'none', border: '1px solid var(--adm-border)', borderRadius: 8, padding: '10px', fontSize: 13.5, fontWeight: 600, color: 'var(--adm-text)', cursor: 'pointer', fontFamily: 'inherit' }}
          >
            Nanti Saja
          </button>
        </div>
      </div>
    </div>
  );
}
