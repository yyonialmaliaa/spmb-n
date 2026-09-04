'use client'

import { useEffect } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'

// Batas error untuk seluruh area /admin. Wajib client component dan menerima
// { error, reset } (lihat node_modules/next/dist/docs/01-app/01-getting-started/
// 10-error-handling.md).
//
// Staf administrasi tidak pernah melihat pesan teknis mentah — stack trace
// hanya dikirim ke console untuk yang memelihara sistem.
export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Admin error:', error)
  }, [error])

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '80px 24px' }}>
      <div className="adm-card adm-card-pad" style={{ maxWidth: 440, textAlign: 'center' }}>
        <div
          style={{
            width: 46, height: 46, borderRadius: 12, margin: '0 auto 16px',
            background: 'var(--adm-danger-weak)', display: 'flex',
            alignItems: 'center', justifyContent: 'center',
          }}
        >
          <AlertTriangle size={21} color="var(--adm-danger)" />
        </div>
        <h2 style={{ fontSize: 17, fontWeight: 700 }}>Gagal memuat data</h2>
        <p style={{ fontSize: 13.5, color: 'var(--adm-text-muted)', marginTop: 8, lineHeight: 1.55 }}>
          Terjadi kendala saat mengambil data. Silakan coba lagi. Jika masalah berlanjut,
          hubungi pengelola sistem.
        </p>
        {error.digest && (
          <p style={{ fontSize: 11, color: 'var(--adm-text-faint)', marginTop: 10 }}>
            Kode kejadian: {error.digest}
          </p>
        )}
        <button className="adm-btn adm-btn--primary" style={{ marginTop: 18 }} onClick={reset}>
          <RefreshCw size={14} /> Coba Lagi
        </button>
      </div>
    </div>
  )
}
