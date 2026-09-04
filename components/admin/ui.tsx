'use client'

import { useEffect, useRef } from 'react'
import { AlertTriangle, Inbox, Lock, RefreshCw, X } from 'lucide-react'
import type { NadaStatus } from '@/lib/labels'
import { useAdmin } from './AdminProvider'
import type { Resource } from '@/lib/permissions'

// Primitif UI bersama untuk seluruh halaman admin. Dikumpulkan dalam satu
// berkas karena masing-masing kecil dan selalu dipakai bersamaan; memecahnya
// jadi 10 berkas satu-komponen hanya menambah impor tanpa menambah kejelasan.

/* ------------------------------------------------------------- BADGE --- */

export function StatusBadge({ teks, nada }: { teks: string; nada: NadaStatus }) {
  // Teks SELALU ikut ditampilkan, tidak pernah warna saja — status harus
  // terbaca oleh admin yang kesulitan membedakan warna.
  return <span className={`adm-badge adm-badge--${nada}`}>{teks}</span>
}

/* ---------------------------------------------------------- STAT CARD --- */

export function StatCard({
  label,
  nilai,
  keterangan,
  nada = 'netral',
  ikon,
}: {
  label: string
  nilai: React.ReactNode
  keterangan?: string
  nada?: NadaStatus
  ikon?: React.ReactNode
}) {
  const warnaNada: Record<NadaStatus, string> = {
    netral: 'var(--adm-text)',
    info: 'var(--adm-info)',
    sukses: 'var(--adm-success)',
    peringatan: 'var(--adm-warning)',
    bahaya: 'var(--adm-danger)',
  }
  return (
    <div className="adm-card adm-card-pad">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <div style={{ fontSize: 11.5, fontWeight: 650, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--adm-text-muted)' }}>
          {label}
        </div>
        {ikon}
      </div>
      <div style={{ fontSize: 27, fontWeight: 700, letterSpacing: '-0.03em', lineHeight: 1.15, marginTop: 8, color: warnaNada[nada] }}>
        {nilai}
      </div>
      {keterangan && (
        <div style={{ fontSize: 12, color: 'var(--adm-text-muted)', marginTop: 4 }}>{keterangan}</div>
      )}
    </div>
  )
}

/* -------------------------------------------------------- EMPTY STATE --- */

export function EmptyState({
  judul,
  pesan,
  aksi,
}: {
  judul: string
  pesan?: string
  aksi?: React.ReactNode
}) {
  return (
    <div style={{ textAlign: 'center', padding: '48px 24px' }}>
      <div
        style={{
          width: 44, height: 44, borderRadius: 12, margin: '0 auto 14px',
          background: 'var(--adm-neutral-weak)', display: 'flex',
          alignItems: 'center', justifyContent: 'center',
        }}
      >
        <Inbox size={20} color="var(--adm-text-faint)" />
      </div>
      <div style={{ fontSize: 14.5, fontWeight: 650, color: 'var(--adm-text)' }}>{judul}</div>
      {pesan && (
        <div style={{ fontSize: 13, color: 'var(--adm-text-muted)', marginTop: 5, maxWidth: 420, marginInline: 'auto' }}>
          {pesan}
        </div>
      )}
      {aksi && <div style={{ marginTop: 16 }}>{aksi}</div>}
    </div>
  )
}

/* -------------------------------------------------------- ERROR STATE --- */

export function ErrorState({ onCoba }: { onCoba?: () => void }) {
  // Pesan teknis mentah tidak pernah ditampilkan ke staf administrasi —
  // detailnya tetap masuk console untuk yang memelihara sistem.
  return (
    <div style={{ textAlign: 'center', padding: '48px 24px' }}>
      <div
        style={{
          width: 44, height: 44, borderRadius: 12, margin: '0 auto 14px',
          background: 'var(--adm-danger-weak)', display: 'flex',
          alignItems: 'center', justifyContent: 'center',
        }}
      >
        <AlertTriangle size={20} color="var(--adm-danger)" />
      </div>
      <div style={{ fontSize: 14.5, fontWeight: 650 }}>Gagal memuat data</div>
      <div style={{ fontSize: 13, color: 'var(--adm-text-muted)', marginTop: 5 }}>
        Terjadi kendala saat mengambil data. Silakan coba lagi.
      </div>
      {onCoba && (
        <button className="adm-btn adm-btn--ghost" style={{ marginTop: 16 }} onClick={onCoba}>
          <RefreshCw size={14} /> Coba Lagi
        </button>
      )}
    </div>
  )
}

/* ---------------------------------------------------------- SKELETON --- */

export function Skeleton({ tinggi = 16, lebar = '100%', radius }: { tinggi?: number; lebar?: number | string; radius?: number }) {
  return <div className="adm-skeleton" style={{ height: tinggi, width: lebar, borderRadius: radius }} />
}

export function SkeletonTabel({ baris = 5, kolom = 5 }: { baris?: number; kolom?: number }) {
  return (
    <div style={{ padding: 16, display: 'grid', gap: 10 }}>
      {Array.from({ length: baris }).map((_, i) => (
        <div key={i} style={{ display: 'grid', gridTemplateColumns: `repeat(${kolom}, 1fr)`, gap: 12 }}>
          {Array.from({ length: kolom }).map((_, k) => (
            <Skeleton key={k} tinggi={14} lebar={k === 0 ? '80%' : '60%'} />
          ))}
        </div>
      ))}
    </div>
  )
}

export function SkeletonStat({ jumlah = 4 }: { jumlah?: number }) {
  return (
    <div className="adm-grid-stat">
      {Array.from({ length: jumlah }).map((_, i) => (
        <div key={i} className="adm-card adm-card-pad">
          <Skeleton tinggi={11} lebar="55%" />
          <div style={{ height: 10 }} />
          <Skeleton tinggi={26} lebar="40%" />
        </div>
      ))}
    </div>
  )
}

/* ------------------------------------------------------ CONFIRM MODAL --- */

export function ConfirmModal({
  judul,
  pesan,
  detail,
  labelKonfirmasi = 'Lanjutkan',
  nada = 'primary',
  memproses,
  onBatal,
  onKonfirmasi,
}: {
  judul: string
  pesan: string
  detail?: React.ReactNode
  labelKonfirmasi?: string
  nada?: 'primary' | 'danger' | 'warning'
  memproses?: boolean
  onBatal: () => void
  onKonfirmasi: () => void
}) {
  const ref = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    ref.current?.focus()
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onBatal() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onBatal])

  return (
    <div
      className="adm-overlay"
      role="dialog"
      aria-modal="true"
      aria-label={judul}
      onClick={e => { if (e.target === e.currentTarget) onBatal() }}
    >
      <div className="adm-modal" style={{ maxWidth: 440 }}>
        <div style={{ padding: '20px 22px' }}>
          <div style={{ fontSize: 16, fontWeight: 700, letterSpacing: '-0.01em' }}>{judul}</div>
          <p style={{ fontSize: 13.5, color: 'var(--adm-text-muted)', marginTop: 8, lineHeight: 1.55 }}>{pesan}</p>
          {detail && <div style={{ marginTop: 14 }}>{detail}</div>}
        </div>
        <div
          style={{
            display: 'flex', justifyContent: 'flex-end', gap: 8,
            padding: '12px 22px', borderTop: '1px solid var(--adm-border)',
            background: 'var(--adm-surface-alt)',
            borderBottomLeftRadius: 'var(--adm-r-lg)', borderBottomRightRadius: 'var(--adm-r-lg)',
          }}
        >
          <button className="adm-btn adm-btn--ghost" onClick={onBatal} disabled={memproses}>Batal</button>
          <button
            ref={ref}
            className={`adm-btn adm-btn--${nada}`}
            onClick={onKonfirmasi}
            disabled={memproses}
          >
            {memproses ? 'Memproses…' : labelKonfirmasi}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------- MODAL --- */

export function Modal({
  judul,
  lebar = 560,
  onTutup,
  children,
  footer,
}: {
  judul: string
  lebar?: number
  onTutup: () => void
  children: React.ReactNode
  footer?: React.ReactNode
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onTutup() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onTutup])

  return (
    <div
      className="adm-overlay"
      role="dialog"
      aria-modal="true"
      aria-label={judul}
      onClick={e => { if (e.target === e.currentTarget) onTutup() }}
    >
      <div className="adm-modal" style={{ maxWidth: lebar }}>
        <div className="adm-card-head" style={{ position: 'sticky', top: 0, background: 'var(--adm-surface)', borderTopLeftRadius: 'var(--adm-r-lg)', borderTopRightRadius: 'var(--adm-r-lg)' }}>
          <div className="adm-card-title">{judul}</div>
          <button
            onClick={onTutup}
            aria-label="Tutup"
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--adm-text-muted)', display: 'flex', padding: 4 }}
          >
            <X size={17} />
          </button>
        </div>
        <div style={{ padding: '18px 20px' }}>{children}</div>
        {footer && (
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, padding: '12px 20px', borderTop: '1px solid var(--adm-border)', background: 'var(--adm-surface-alt)' }}>
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}

/* --------------------------------------------------- READ ONLY BANNER --- */

/**
 * Poin 24 spesifikasi: Front Office MEMANG boleh melihat area keuangan.
 * Datanya tidak disembunyikan — hanya tombol aksinya yang hilang, dan
 * alasannya dinyatakan terang-terangan supaya petugas tidak mengira sistem
 * sedang rusak.
 */
export function ReadOnlyBanner({ resource, pesan }: { resource: Resource; pesan?: string }) {
  const { isReadOnly } = useAdmin()
  if (!isReadOnly(resource)) return null
  return (
    <div className="adm-banner adm-banner--info" style={{ marginBottom: 16 }}>
      <Lock size={15} style={{ flexShrink: 0, marginTop: 1 }} />
      <div>
        <strong>Mode Tampilan.</strong>{' '}
        {pesan ?? 'Anda dapat melihat dan mengekspor data ini. Perubahan hanya dapat dilakukan oleh Admin Keuangan.'}
      </div>
    </div>
  )
}

/* ------------------------------------------------------ PERMISSION GATE --- */

/**
 * Menyembunyikan aksi yang tidak boleh diakses role ini.
 *
 * INI KENYAMANAN UI, BUKAN BATAS KEAMANAN. Penegakan sesungguhnya ada di
 * requirePermission() pada setiap route API — komponen ini hanya mencegah
 * admin mengklik tombol yang pasti berakhir 403.
 */
export function PermissionGate({
  resource,
  action,
  fallback = null,
  children,
}: {
  resource: Resource
  action: Parameters<ReturnType<typeof useAdmin>['can']>[1]
  fallback?: React.ReactNode
  children: React.ReactNode
}) {
  const { can } = useAdmin()
  return <>{can(resource, action) ? children : fallback}</>
}

/* -------------------------------------------------------------- TOAST --- */

export function Toast({ pesan }: { pesan: string | null }) {
  if (!pesan) return null
  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        position: 'fixed', top: 20, right: 20, zIndex: 9999,
        background: 'var(--adm-text)', color: 'var(--adm-text-invert)',
        padding: '11px 18px', borderRadius: 'var(--adm-r-md)',
        fontSize: 13, fontWeight: 600, boxShadow: 'var(--adm-shadow-lg)',
      }}
    >
      {pesan}
    </div>
  )
}
