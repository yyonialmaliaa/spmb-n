'use client';

// =====================================================================
// Pop-up notifikasi formulir pendaftaran (error/warning/info/success) —
// menggantikan pesan kecil di atas halaman yang mudah terlewat. Dipakai
// bersama oleh app/spmb/daftar dan app/spmb/revisi. Kalau peringatannya
// berkaitan dengan field tertentu, sertakan `focusId` (id elemen field
// itu) supaya begitu pop-up ditutup, pengguna otomatis diarahkan
// kembali ke field tersebut.
// =====================================================================

import { useEffect } from 'react';
import { AlertCircle, AlertTriangle, Info, CheckCircle } from 'lucide-react';

export type AlertKind = 'error' | 'warning' | 'info' | 'success';

export type AlertModalState = { kind: AlertKind; title?: string; message: string; focusId?: string } | null;

const STYLES: Record<AlertKind, { bg: string; color: string; Icon: typeof AlertCircle; defaultTitle: string }> = {
  error: { bg: '#FEE2E2', color: '#DC2626', Icon: AlertCircle, defaultTitle: 'Data Belum Lengkap' },
  warning: { bg: '#FFFBEB', color: '#92681A', Icon: AlertTriangle, defaultTitle: 'Periksa Data Anda' },
  info: { bg: '#F0FDF4', color: '#123524', Icon: Info, defaultTitle: 'Informasi' },
  success: { bg: '#DCFCE7', color: '#16A34A', Icon: CheckCircle, defaultTitle: 'Berhasil' },
};

export default function FormAlertModal({ state, onClose }: { state: AlertModalState; onClose: () => void }) {
  useEffect(() => {
    if (!state) return;
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [state, onClose]);

  if (!state) return null;
  const s = STYLES[state.kind];
  const Icon = s.Icon;

  return (
    <div
      onClick={onClose}
      style={{ position: 'fixed', inset: 0, background: 'rgba(10,22,40,0.5)', zIndex: 400, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
    >
      <style>{`
        @keyframes formAlertIn { from { opacity: 0; transform: translateY(12px) scale(0.97); } to { opacity: 1; transform: translateY(0) scale(1); } }
      `}</style>
      <div
        role="alertdialog"
        aria-modal="true"
        aria-label={state.title || s.defaultTitle}
        onClick={e => e.stopPropagation()}
        style={{ background: '#FFFDF9', borderRadius: 16, padding: '30px 26px 24px', maxWidth: 380, width: '100%', textAlign: 'center', animation: 'formAlertIn 0.18s ease-out', boxShadow: '0 20px 60px rgba(10,22,40,0.25)', border: '1px solid #F0EBE0' }}
      >
        <div style={{ width: 52, height: 52, borderRadius: '50%', background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
          <Icon size={24} color={s.color} />
        </div>
        <h3 style={{ fontSize: 16.5, fontWeight: 700, color: '#0A1628', marginBottom: 8 }}>{state.title || s.defaultTitle}</h3>
        <p style={{ fontSize: 13.5, color: '#6B7280', lineHeight: 1.6, marginBottom: 22 }}>{state.message}</p>
        <button onClick={onClose} className="btn-primary" style={{ width: '100%', textAlign: 'center', fontSize: 14, border: 'none', fontFamily: 'inherit' }}>
          Tutup
        </button>
      </div>
    </div>
  );
}
