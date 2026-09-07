'use client'

import { useState } from 'react'
import Link from 'next/link'
import { CalendarDays, CalendarRange, ChevronDown, ChevronRight, Check, HelpCircle, History } from 'lucide-react'
import { NAMA_INSTITUSI, inisial } from '@/lib/labels'
import { LABEL_ROLE, IDENTITAS_PERAN } from '@/lib/permissions'
import { TemaToggle } from '@/components/TemaToggle'
import { NotifikasiBell } from './NotifikasiBell'
import { useAdmin } from './AdminProvider'

/**
 * Pemilih tahun ajaran global.
 *
 * Daftarnya sudah dikirim server lewat AdminProvider, jadi tidak ada fetch
 * sama sekali di sini. Berpindah tahun ajaran TIDAK memindahkan halaman —
 * admin tetap di halaman yang sama, hanya konteks datanya yang berganti.
 */
function YearSelector() {
  const { tahunAjaran, tahunAjaranList, setTahunAjaran, isHistoris, can } = useAdmin()
  const [buka, setBuka] = useState(false)

  if (!tahunAjaran) return null

  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={() => setBuka(v => !v)}
        aria-haspopup="listbox"
        aria-expanded={buka}
        className="adm-btn adm-btn--ghost adm-btn--sm"
        style={isHistoris ? { borderColor: 'var(--adm-warning-border)', background: 'var(--adm-warning-weak)', color: 'var(--adm-warning)' } : undefined}
      >
        <CalendarRange size={14} />
        TA {tahunAjaran.nama}
        <ChevronDown size={13} />
      </button>

      {buka && (
        <>
          <div style={{ position: 'fixed', inset: 0, zIndex: 40 }} onClick={() => setBuka(false)} />
          <div
            role="listbox"
            style={{
              position: 'absolute', top: 'calc(100% + 6px)', right: 0, zIndex: 50, minWidth: 230,
              background: 'var(--adm-surface)', border: '1px solid var(--adm-border)',
              borderRadius: 'var(--adm-r-md)', boxShadow: 'var(--adm-shadow-md)', padding: 4,
            }}
          >
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--adm-text-faint)', padding: '6px 8px 4px' }}>
              Tahun Ajaran
            </div>
            {tahunAjaranList.map(ta => (
              <button
                key={ta.id}
                role="option"
                aria-selected={ta.id === tahunAjaran.id}
                onClick={() => { setBuka(false); setTahunAjaran(ta.id) }}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10,
                  padding: '7px 8px', background: ta.id === tahunAjaran.id ? 'var(--adm-primary-weak)' : 'transparent',
                  border: 'none', borderRadius: 'var(--adm-r-sm)', cursor: 'pointer',
                  fontFamily: 'inherit', fontSize: 12.5, textAlign: 'left',
                  color: ta.id === tahunAjaran.id ? 'var(--adm-primary)' : 'var(--adm-text)',
                  fontWeight: ta.id === tahunAjaran.id ? 650 : 500,
                }}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                  {ta.nama}
                  {ta.aktif && (
                    <span className="adm-badge adm-badge--sukses" style={{ fontSize: 9.5, padding: '1px 6px' }}>Aktif</span>
                  )}
                </span>
                {ta.id === tahunAjaran.id && <Check size={14} />}
              </button>
            ))}
            {can('tahun_ajaran', 'update') && (
              <Link
                href="/admin/tahun-ajaran"
                onClick={() => setBuka(false)}
                style={{
                  display: 'block', marginTop: 4, padding: '7px 8px', fontSize: 12,
                  color: 'var(--adm-primary)', textDecoration: 'none', fontWeight: 600,
                  borderTop: '1px solid var(--adm-border)',
                }}
              >
                Kelola Tahun Ajaran →
              </Link>
            )}
          </div>
        </>
      )}
    </div>
  )
}

export interface Remah {
  label: string
  href?: string
}

/**
 * Header halaman admin: breadcrumb, judul sadar-konteks, indikator tahun
 * ajaran, dan slot aksi. Selalu menyebut jenjang serta tahun ajaran supaya
 * admin tidak pernah bertanya "ini data tahun berapa, jenjang apa?".
 */
export function TopHeader({
  judul,
  subjudul,
  remah = [],
  aksi,
}: {
  judul: string
  subjudul?: string
  remah?: Remah[]
  aksi?: React.ReactNode
}) {
  const { user, jenjangLabel, tahunAjaran, isHistoris } = useAdmin()
  const identitas = IDENTITAS_PERAN[user.role]

  const hariIni = new Date().toLocaleDateString('id-ID', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })

  return (
    <>
      {/* Baris identitas: tanggal, Bantuan, dan profil — versi ringkas dari
          header portal, supaya "sedang login sebagai siapa, hari apa" tetap
          terlihat di seluruh halaman operasional tanpa dua header bertumpuk. */}
      <div
        style={{
          background: 'var(--adm-surface)', borderBottom: '1px solid var(--adm-border)',
          padding: '7px 28px', display: 'flex', alignItems: 'center',
          justifyContent: 'flex-end', gap: 12, flexWrap: 'wrap',
        }}
      >
        <span className="adm-chip" style={{ border: 'none', padding: '2px 0' }}>
          <CalendarDays size={13} /> {hariIni}
        </span>
        <NotifikasiBell />
        <TemaToggle />
        <Link href="/admin/bantuan" className="adm-chip" style={{ border: 'none', padding: '2px 0', textDecoration: 'none' }}>
          <HelpCircle size={13} /> Bantuan
        </Link>
        <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span className="adm-avatar" style={{ width: 28, height: 28, fontSize: 11, color: identitas.warna, background: identitas.warnaLembut }}>
            {inisial(user.namaLengkap || user.email)}
          </span>
          <span style={{ lineHeight: 1.25 }}>
            <span style={{ display: 'block', fontSize: 12, fontWeight: 650 }}>
              {user.namaLengkap || user.email}
            </span>
            <span style={{ display: 'block', fontSize: 10.5, color: identitas.warna, fontWeight: 650 }}>
              {LABEL_ROLE[user.role]}{jenjangLabel ? ` · ${jenjangLabel}` : ''}
            </span>
          </span>
        </span>
      </div>

      <header className="adm-topbar">
        <div style={{ minWidth: 0 }}>
          <nav className="adm-breadcrumb" aria-label="Breadcrumb">
            <span>{NAMA_INSTITUSI}</span>
            {remah.map((r, i) => (
              <span key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <ChevronRight size={12} />
                {r.href ? <Link href={r.href}>{r.label}</Link> : <span>{r.label}</span>}
              </span>
            ))}
          </nav>
          <h1 className="adm-page-title">{judul}</h1>
          {subjudul && <p className="adm-page-sub">{subjudul}</p>}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          {jenjangLabel && (
            <span className="adm-badge adm-badge--info" style={{ padding: '5px 11px' }}>{jenjangLabel}</span>
          )}
          <YearSelector />
          {aksi}
        </div>
      </header>

      {/* Banner ini dulu disalin di dua halaman; sekarang otomatis tampil di
          SETIAP halaman admin ketika konteksnya tahun ajaran non-aktif. */}
      {isHistoris && tahunAjaran && (
        <div
          className="adm-banner adm-banner--warning"
          style={{ borderRadius: 0, borderLeft: 'none', borderRight: 'none', borderTop: 'none' }}
        >
          <History size={15} style={{ flexShrink: 0, marginTop: 1 }} />
          <div>
            Anda sedang melihat data historis <strong>TA {tahunAjaran.nama}</strong> yang sudah tidak aktif.
            Perubahan pada tahun ajaran ini tidak memengaruhi pendaftaran yang sedang berjalan.
          </div>
        </div>
      )}
    </>
  )
}
