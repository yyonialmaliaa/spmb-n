'use client';
import { Suspense } from 'react';
import { PendaftarView } from '@/components/admin/PendaftarView';

// Pendaftar Online — hanya calon murid yang mengisi formulir sendiri lewat
// portal SPMB. Sumbernya dikunci di sini, bukan lewat ?sumber= yang bisa
// diubah dari address bar, sehingga daftar DAN hasil ekspor halaman ini
// tidak akan pernah tercampur data pendaftar offline.
//
// Halaman ini sengaja tidak punya tombol "+ Tambah Pendaftar Offline";
// pembuatan pendaftar offline hanya ada di /admin/pendaftar/offline.
export default function PendaftarOnline() {
  return (
    <Suspense fallback={<div style={{ padding: 60, textAlign: 'center', color: 'var(--adm-text-faint)' }}>Memuat...</div>}>
      <PendaftarView sumberTetap="online" />
    </Suspense>
  );
}
