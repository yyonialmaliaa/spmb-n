'use client';
import { Suspense } from 'react';
import { PendaftarView } from '@/components/admin/PendaftarView';

// Daftar pendaftar tanpa penyaringan sumber — online dan offline menyatu.
// Halaman khusus per sumber ada di ./online dan ./offline.
export default function AdminPendaftar() {
  return (
    <Suspense fallback={<div style={{ padding: 60, textAlign: 'center', color: 'var(--adm-text-faint)' }}>Memuat...</div>}>
      <PendaftarView />
    </Suspense>
  );
}
