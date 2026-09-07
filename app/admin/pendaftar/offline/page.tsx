'use client';
import { Suspense } from 'react';
import { PendaftarView } from '@/components/admin/PendaftarView';

// Pendaftar Offline — calon murid yang didaftarkan langsung oleh admin di
// loket. Sumbernya dikunci di sini, bukan lewat ?sumber= yang bisa diubah
// dari address bar, sehingga daftar DAN hasil ekspor halaman ini tidak akan
// pernah tercampur data pendaftar online.
//
// Ini SATU-SATUNYA tempat tombol "+ Tambah Pendaftar Offline" muncul —
// tidak di dashboard, tidak di halaman Pendaftar gabungan, dan tidak sebagai
// menu sidebar tersendiri.
export default function PendaftarOffline() {
  return (
    <Suspense fallback={<div style={{ padding: 60, textAlign: 'center', color: 'var(--adm-text-faint)' }}>Memuat...</div>}>
      <PendaftarView sumberTetap="offline" />
    </Suspense>
  );
}
