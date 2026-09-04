import Link from 'next/link'
import { Compass } from 'lucide-react'

export default function AdminNotFound() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '80px 24px' }}>
      <div className="adm-card adm-card-pad" style={{ maxWidth: 420, textAlign: 'center' }}>
        <div
          style={{
            width: 46, height: 46, borderRadius: 12, margin: '0 auto 16px',
            background: 'var(--adm-neutral-weak)', display: 'flex',
            alignItems: 'center', justifyContent: 'center',
          }}
        >
          <Compass size={21} color="var(--adm-text-faint)" />
        </div>
        <h2 style={{ fontSize: 17, fontWeight: 700 }}>Halaman tidak ditemukan</h2>
        <p style={{ fontSize: 13.5, color: 'var(--adm-text-muted)', marginTop: 8, lineHeight: 1.55 }}>
          Alamat yang Anda buka tidak tersedia di panel SPMB Admin.
        </p>
        <Link href="/admin/dashboard" className="adm-btn adm-btn--primary" style={{ marginTop: 18 }}>
          Kembali ke Pilih Jenjang
        </Link>
      </div>
    </div>
  )
}
