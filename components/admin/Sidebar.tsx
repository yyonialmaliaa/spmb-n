'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard, Users, FileCheck2, ListChecks,
  CalendarRange, CalendarClock, ClipboardList, Tag, Percent,
  Receipt, Wallet, ArrowLeftRight,
  BarChart3, PiggyBank,
  UserCog, Settings, HelpCircle, LogOut,
  Landmark, CalendarDays, ChevronsUpDown, Check, X,
} from 'lucide-react'
import type { Resource } from '@/lib/permissions'
import { LABEL_ROLE, IDENTITAS_PERAN } from '@/lib/permissions'
import { routeAktif } from '@/lib/adminHref'
import { NAMA_INSTITUSI, NAMA_SISTEM, JENJANG_LABEL_FULL, JENJANG_SINGKAT, type Jenjang } from '@/lib/labels'
import { useAdmin } from './AdminProvider'

// Struktur menu sesuai spesifikasi bagian 8. Setiap item membawa `resource`
// supaya visibilitasnya ditentukan matrix permission, bukan daftar manual per
// role — menu yang pasti berakhir 403 tidak pernah dirender.
//
// CATATAN NAMA MENU: "Biaya Pendidikan" SENGAJA tidak dipakai. Harga adalah
// konfigurasi biaya dan Diskon konfigurasi potongan — dua hal berbeda yang
// kalau digabung membuat admin tidak tahu di mana mengubah apa. Begitu pula
// Laporan dipisah Pendaftaran vs Keuangan, karena pembacanya berbeda.
interface ItemMenu {
  href: string
  label: string
  ikon: React.ComponentType<{ size?: number }>
  resource: Resource
}

const GRUP: { label: string; items: ItemMenu[] }[] = [
  {
    label: 'Utama',
    items: [
      { href: '/admin/dashboard', label: 'Dashboard', ikon: LayoutDashboard, resource: 'dashboard' },
    ],
  },
  {
    label: 'Pendaftaran',
    items: [
      { href: '/admin/pendaftar', label: 'Pendaftar', ikon: Users, resource: 'pendaftar' },
      { href: '/admin/verifikasi', label: 'Verifikasi', ikon: FileCheck2, resource: 'verifikasi' },
      { href: '/admin/status', label: 'Status', ikon: ListChecks, resource: 'status' },
    ],
  },
  {
    label: 'Manajemen',
    items: [
      { href: '/admin/tahun-ajaran', label: 'Tahun Ajaran', ikon: CalendarRange, resource: 'tahun_ajaran' },
      { href: '/admin/gelombang', label: 'Jadwal SPMB', ikon: CalendarClock, resource: 'jadwal' },
      { href: '/admin/persyaratan', label: 'Persyaratan', ikon: ClipboardList, resource: 'persyaratan' },
      { href: '/admin/harga', label: 'Harga', ikon: Tag, resource: 'harga' },
      { href: '/admin/diskon', label: 'Diskon', ikon: Percent, resource: 'diskon' },
    ],
  },
  {
    label: 'Keuangan',
    items: [
      { href: '/admin/tagihan', label: 'Tagihan', ikon: Receipt, resource: 'tagihan' },
      { href: '/admin/pembayaran', label: 'Pembayaran', ikon: Wallet, resource: 'pembayaran' },
      { href: '/admin/transaksi', label: 'Transaksi', ikon: ArrowLeftRight, resource: 'transaksi' },
    ],
  },
  {
    label: 'Laporan',
    items: [
      { href: '/admin/laporan', label: 'Laporan Pendaftaran', ikon: BarChart3, resource: 'laporan_pendaftaran' },
      { href: '/admin/laporan/keuangan', label: 'Laporan Keuangan', ikon: PiggyBank, resource: 'laporan_keuangan' },
    ],
  },
  {
    label: 'Sistem',
    items: [
      { href: '/admin/pengguna', label: 'Pengguna Admin', ikon: UserCog, resource: 'pengguna' },
      { href: '/admin/pengaturan', label: 'Pengaturan', ikon: Settings, resource: 'pengaturan' },
    ],
  },
]

const SEMUA_JENJANG: Jenjang[] = ['smp', 'sma', 'smk']

/**
 * Kartu konteks akun: peran + jenjang yang sedang dikelola, status tahun
 * ajaran, dan pemindah jenjang. Inilah yang menjawab pertanyaan "saya sedang
 * melihat data siapa, jenjang apa, tahun berapa" tanpa admin perlu mencari.
 */
function KartuKonteks() {
  const { user, jenjang, jenjangLabel, setJenjang, bisaGantiJenjang, tahunAjaran, isHistoris } = useAdmin()
  const [buka, setBuka] = useState(false)

  const identitas = IDENTITAS_PERAN[user.role]
  const judul = jenjang ? `${identitas.lencana} · ${JENJANG_SINGKAT[jenjang]}` : identitas.lencana

  return (
    <div
      className="adm-akun"
      style={{
        position: 'relative',
        // Garis kiri berwarna peran: penanda paling cepat terbaca ketika satu
        // komputer dipakai bergantian oleh petugas yang berbeda.
        borderLeft: `3px solid ${identitas.warna}`,
        background: identitas.warnaLembut,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.04em', color: identitas.warna }}>{judul}</span>
        {tahunAjaran && (
          <span
            className={`adm-badge adm-badge--${isHistoris ? 'peringatan' : 'sukses'}`}
            style={{ fontSize: 9, padding: '1px 7px' }}
          >
            {isHistoris ? 'HISTORIS' : 'AKTIF'}
          </span>
        )}
      </div>

      <div style={{ fontSize: 10.5, color: 'var(--adm-text-muted)', marginTop: 3 }}>{identitas.area}</div>

      {tahunAjaran && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--adm-text-muted)', marginTop: 6 }}>
          <CalendarDays size={12} /> TA {tahunAjaran.nama}
        </div>
      )}

      {/* Ganti jenjang. Admin ber-scope tidak boleh berpindah, jadi
          ditampilkan sebagai keterangan statis, bukan tombol yang menipu. */}
      {jenjang && (
        bisaGantiJenjang ? (
          <>
            <button
              onClick={() => setBuka(v => !v)}
              aria-haspopup="listbox"
              aria-expanded={buka}
              style={{
                width: '100%', marginTop: 8, display: 'flex', alignItems: 'center',
                justifyContent: 'space-between', gap: 6, padding: '6px 9px',
                background: 'var(--adm-surface)', border: '1px solid var(--adm-border)',
                borderRadius: 'var(--adm-r-sm)', cursor: 'pointer', fontFamily: 'inherit',
                fontSize: 11.5, fontWeight: 600, color: 'var(--adm-text-muted)', textAlign: 'left',
              }}
            >
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                Ganti Jenjang
              </span>
              <ChevronsUpDown size={13} />
            </button>

            {buka && (
              <>
                <div style={{ position: 'fixed', inset: 0, zIndex: 40 }} onClick={() => setBuka(false)} />
                <div
                  role="listbox"
                  style={{
                    position: 'absolute', top: 'calc(100% - 4px)', left: 12, right: 12, zIndex: 50,
                    background: 'var(--adm-surface)', border: '1px solid var(--adm-border)',
                    borderRadius: 'var(--adm-r-md)', boxShadow: 'var(--adm-shadow-md)', padding: 4,
                  }}
                >
                  {SEMUA_JENJANG.map(j => (
                    <button
                      key={j}
                      role="option"
                      aria-selected={j === jenjang}
                      onClick={() => { setBuka(false); setJenjang(j) }}
                      style={{
                        width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        gap: 8, padding: '7px 8px', background: j === jenjang ? 'var(--adm-primary-weak)' : 'transparent',
                        border: 'none', borderRadius: 'var(--adm-r-sm)', cursor: 'pointer',
                        fontFamily: 'inherit', fontSize: 12, textAlign: 'left',
                        color: j === jenjang ? 'var(--adm-primary)' : 'var(--adm-text)',
                        fontWeight: j === jenjang ? 650 : 500,
                      }}
                    >
                      {JENJANG_LABEL_FULL[j]}
                      {j === jenjang && <Check size={13} />}
                    </button>
                  ))}
                </div>
              </>
            )}
          </>
        ) : (
          <div style={{ fontSize: 10.5, color: 'var(--adm-text-faint)', marginTop: 6 }}>
            Akun ini dibatasi pada jenjang {jenjangLabel}
          </div>
        )
      )}
    </div>
  )
}

export function Sidebar({ terbuka, onTutup }: { terbuka: boolean; onTutup: () => void }) {
  const pathname = usePathname()
  const router = useRouter()
  const { canAny, href } = useAdmin()

  // Saring dulu, baru tentukan menu aktif — supaya pencocokan terpanjang
  // hanya melihat menu yang benar-benar dirender.
  const grupTampil = GRUP
    .map(g => ({ ...g, items: g.items.filter(i => canAny(i.resource)) }))
    .filter(g => g.items.length > 0)

  const aktif = routeAktif(pathname, grupTampil.flatMap(g => g.items.map(i => i.href)))

  const keluar = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
  }

  return (
    <aside className={`adm-sidebar${terbuka ? ' is-open' : ''}`}>
      <div className="adm-sidebar-head">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
          <Link href="/" className="adm-brand">
            <span
              style={{
                width: 32, height: 32, borderRadius: 'var(--adm-r-md)',
                background: 'var(--adm-primary-weak)', display: 'flex',
                alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}
            >
              <Landmark size={17} color="var(--adm-primary)" />
            </span>
            <span>
              <span
                className="adm-brand-nama"
                style={{ display: 'block', color: 'var(--adm-primary)', letterSpacing: '0.01em' }}
              >
                {NAMA_INSTITUSI.toUpperCase()}
              </span>
              <span className="adm-brand-sistem" style={{ color: 'var(--adm-text-faint)' }}>
                {NAMA_SISTEM}
              </span>
            </span>
          </Link>
          <button
            onClick={onTutup}
            aria-label="Tutup menu"
            className="adm-sidebar-tutup"
            style={{ display: 'none', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--adm-text-muted)' }}
          >
            <X size={18} />
          </button>
        </div>

        <div style={{ marginTop: 12 }}>
          <KartuKonteks />
        </div>
      </div>

      <nav className="adm-nav">
        {grupTampil.map(grup => (
          <div key={grup.label} className="adm-nav-grup">
            <div className="adm-nav-label">{grup.label}</div>
            {grup.items.map(item => {
              const Ikon = item.ikon
              const isAktif = aktif === item.href
              return (
                <Link
                  key={item.href}
                  href={href(item.href)}
                  onClick={onTutup}
                  className={`adm-nav-link${isAktif ? ' is-active' : ''}`}
                  aria-current={isAktif ? 'page' : undefined}
                >
                  <Ikon size={16} />
                  {item.label}
                </Link>
              )
            })}
          </div>
        ))}
      </nav>

      <div className="adm-sidebar-foot">
        <Link href="/admin/bantuan" className="adm-nav-link" onClick={onTutup}>
          <HelpCircle size={16} /> Bantuan
        </Link>
        {/* Logout diberi warna bahaya: satu-satunya aksi di sidebar yang
            mengakhiri sesi, jadi tidak boleh tertukar dengan menu navigasi. */}
        <button
          onClick={keluar}
          className="adm-nav-link adm-nav-link--keluar"
          style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left' }}
        >
          <LogOut size={16} /> Logout
        </button>
      </div>
    </aside>
  )
}
