'use client'

import Link from 'next/link'
import { CalendarDays, HelpCircle, LogOut } from 'lucide-react'
import { NAMA_INSTITUSI, inisial } from '@/lib/labels'
import { LABEL_ROLE, IDENTITAS_PERAN } from '@/lib/permissions'
import { TemaToggle } from '@/components/TemaToggle'
import { useAdmin } from './AdminProvider'

// Header portal ala referensi: kotak inisial institusi, nama sistem, badge
// peran portal, chip tanggal, Bantuan, dan kartu profil.
//
// Dipakai halaman Pilih Jenjang (yang memang tanpa sidebar). Halaman
// operasional memakai versi ringkasnya di dalam TopHeader, supaya identitas
// pengguna & tanggal tetap terlihat tanpa menggandakan dua header.

export function PortalHeader({ badge }: { badge?: string }) {
  const { user } = useAdmin()
  const identitas = IDENTITAS_PERAN[user.role]

  const keluar = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    window.location.href = '/login'
  }

  const hariIni = new Date().toLocaleDateString('id-ID', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })

  return (
    <header className="adm-portal-head">
      <div className="adm-portal-inner">
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 11, textDecoration: 'none', color: 'inherit' }}>
          <span className="adm-logo-kotak">{inisial(NAMA_INSTITUSI, 'CN')}</span>
          <span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <span style={{ fontWeight: 700, fontSize: 14, letterSpacing: '-0.01em' }}>
                {NAMA_INSTITUSI.toUpperCase()}
              </span>
              {/* Lencana menyebut PERAN, bukan label generik — supaya jelas
                  sejak layar pertama siapa yang sedang masuk. */}
              <span
                className="adm-badge"
                style={{ fontSize: 9.5, letterSpacing: '0.06em', color: identitas.warna, background: identitas.warnaLembut, borderColor: identitas.warna }}
              >
                {badge ?? identitas.lencana}
              </span>
            </span>
            <span style={{ display: 'block', fontSize: 11.5, color: 'var(--adm-text-muted)', marginTop: 1 }}>
              Sistem Penerimaan Murid Baru (SPMB) Terpadu
            </span>
          </span>
        </Link>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <span className="adm-chip">
            <CalendarDays size={13} /> {hariIni}
          </span>

          <TemaToggle />

          <Link href="/admin/bantuan" className="adm-chip" style={{ textDecoration: 'none' }}>
            <HelpCircle size={13} /> Bantuan
          </Link>

          <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
            <span className="adm-avatar" style={{ color: identitas.warna, background: identitas.warnaLembut }}>
              {inisial(user.namaLengkap || user.email)}
            </span>
            <div style={{ lineHeight: 1.3 }}>
              <div style={{ fontSize: 12.5, fontWeight: 650 }}>{user.namaLengkap || user.email}</div>
              <div style={{ fontSize: 11, color: 'var(--adm-text-muted)' }}>
                {LABEL_ROLE[user.role]}
                {user.scopeJenjang ? ` · ${user.scopeJenjang.toUpperCase()}` : ''}
              </div>
            </div>
            <button
              onClick={keluar}
              aria-label="Logout"
              title="Logout"
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--adm-text-muted)', display: 'flex', padding: 4 }}
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}
