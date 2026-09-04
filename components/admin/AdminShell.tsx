'use client'

import { useState } from 'react'
import { usePathname } from 'next/navigation'
import Image from 'next/image'
import { Menu } from 'lucide-react'
import { NAMA_INSTITUSI } from '@/lib/labels'
import { Sidebar } from './Sidebar'
import { useAdmin } from './AdminProvider'

// Route yang dirender TANPA sidebar:
//   /admin/dashboard  — halaman Pilih Jenjang, tampil SEBELUM jenjang dipilih,
//                       jadi menu operasional per-jenjang belum bermakna.
//   /admin/kwitansi/* — tampilan cetak.
const ROUTE_POLOS = ['/admin/kwitansi']

function isPolos(pathname: string): boolean {
  if (pathname === '/admin/dashboard') return true
  return ROUTE_POLOS.some(p => pathname === p || pathname.startsWith(p + '/'))
}

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [drawerBuka, setDrawerBuka] = useState(false)
  const [pathTerakhir, setPathTerakhir] = useState(pathname)
  const { jenjangLabel } = useAdmin()

  // Tutup drawer setiap kali pindah halaman — kalau tidak, drawer tetap
  // terbuka menutupi halaman tujuan di layar sempit.
  //
  // Disetel saat render, bukan di useEffect: menyetel state di dalam effect
  // memicu render berantai (render -> effect -> render lagi). Pola ini yang
  // disarankan React untuk "menyesuaikan state ketika prop berubah".
  if (pathname !== pathTerakhir) {
    setPathTerakhir(pathname)
    setDrawerBuka(false)
  }

  if (isPolos(pathname)) {
    return <div className="adm-root" style={{ minHeight: '100vh' }}>{children}</div>
  }

  return (
    <div className="adm-root">
      <div className="adm-mobile-bar">
        <button
          onClick={() => setDrawerBuka(true)}
          aria-label="Buka menu"
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--adm-text)', display: 'flex' }}
        >
          <Menu size={20} />
        </button>
        <span style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700, fontSize: 13 }}>
          <Image src="/images/logo.png" alt="" width={22} height={22} style={{ borderRadius: 5, objectFit: 'cover' }} />
          {jenjangLabel ?? NAMA_INSTITUSI}
        </span>
        <span style={{ width: 20 }} />
      </div>

      <div className="adm-shell">
        {drawerBuka && <div className="adm-sidebar-backdrop" onClick={() => setDrawerBuka(false)} />}
        <Sidebar terbuka={drawerBuka} onTutup={() => setDrawerBuka(false)} />
        <div className="adm-main">{children}</div>
      </div>
    </div>
  )
}
