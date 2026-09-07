'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Bell, UserPlus, RefreshCw, Wallet, type LucideIcon } from 'lucide-react'
import { useMuatData, ambilJson } from './useMuatData'

// ---------------------------------------------------------------------------
// Lonceng notifikasi admin.
//
// Isinya sudah disaring server menurut PERAN: Front Office melihat pendaftar
// & revisi masuk, Loket Keuangan melihat setoran yang menunggu di-ACC, dan
// Super Admin melihat keduanya. Komponen ini tidak menyaring apa pun sendiri —
// kalau penyaringannya ada di sini, membuka DevTools sudah cukup untuk
// membaca antrean peran lain.
// ---------------------------------------------------------------------------

type Notif = {
  id: string
  jenis: string
  judul: string
  pesan: string
  tautan: string | null
  jenjang: string | null
  createdAt: string
  dibaca: boolean
}

const RUPA: Record<string, { ikon: LucideIcon; warna: string; latar: string }> = {
  pendaftar_baru: { ikon: UserPlus, warna: 'var(--adm-info)', latar: 'var(--adm-info-weak)' },
  revisi_masuk: { ikon: RefreshCw, warna: 'var(--adm-warning)', latar: 'var(--adm-warning-weak)' },
  pembayaran_perlu_verifikasi: { ikon: Wallet, warna: 'var(--adm-success)', latar: 'var(--adm-success-weak)' },
}
const RUPA_UMUM = { ikon: Bell, warna: 'var(--adm-text-muted)', latar: 'var(--adm-surface-alt)' }

/** "baru saja" / "12 menit lalu" / "3 jam lalu" / "2 hari lalu". */
function waktuRelatif(iso: string) {
  const detik = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
  if (detik < 60) return 'baru saja'
  const menit = Math.floor(detik / 60)
  if (menit < 60) return `${menit} menit lalu`
  const jam = Math.floor(menit / 60)
  if (jam < 24) return `${jam} jam lalu`
  const hari = Math.floor(jam / 24)
  if (hari < 7) return `${hari} hari lalu`
  return new Date(iso).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
}

const JEDA_MUAT_ULANG = 60_000

type KotakMasuk = { data: Notif[]; belumDibaca: number }

export function NotifikasiBell() {
  const [buka, setBuka] = useState(false)

  // Memakai hook muat-data yang sama dengan halaman admin lain, termasuk
  // penanganan balapan request-nya. Kegagalan memuat sengaja tidak
  // ditampilkan: lonceng yang error tidak boleh mengganggu halaman.
  const { data, muatUlang, setData } = useMuatData<KotakMasuk>(
    sinyal => ambilJson<KotakMasuk>('/api/admin/notifikasi', sinyal),
    [],
  )
  const daftar = data?.data ?? []
  const belumDibaca = data?.belumDibaca ?? 0

  // Segarkan berkala — pendaftar bisa mengirim formulir atau menyetor
  // pembayaran kapan saja, dan admin tidak akan menekan refresh untuk tahu.
  useEffect(() => {
    const t = setInterval(muatUlang, JEDA_MUAT_ULANG)
    return () => clearInterval(t)
  }, [muatUlang])

  // Membuka panel = menandai semua yang terlihat sudah dibaca, sama seperti
  // perilaku lonceng di portal pendaftar.
  const alihkanPanel = async () => {
    const akanBuka = !buka
    setBuka(akanBuka)
    if (akanBuka && belumDibaca > 0) {
      // Perbarui tampilan lebih dulu supaya lencana langsung hilang; kalau
      // permintaannya gagal, hitungannya pulih sendiri di muat ulang berikutnya.
      setData(d => d ? { belumDibaca: 0, data: d.data.map(n => ({ ...n, dibaca: true })) } : d)
      try {
        await fetch('/api/admin/notifikasi/baca', { method: 'POST' })
      } catch {
        // Gagal menandai tidak fatal; hitungannya pulih di muat ulang berikutnya.
      }
    }
  }

  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={alihkanPanel}
        aria-haspopup="dialog"
        aria-expanded={buka}
        aria-label={belumDibaca > 0 ? `Notifikasi, ${belumDibaca} belum dibaca` : 'Notifikasi'}
        style={{
          position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center',
          width: 34, height: 34, borderRadius: 'var(--adm-r-sm)', cursor: 'pointer',
          background: buka ? 'var(--adm-surface-alt)' : 'transparent',
          border: 'none', color: 'var(--adm-text-muted)',
        }}
      >
        <Bell size={15} />
        {belumDibaca > 0 && (
          <span
            style={{
              position: 'absolute', top: -1, right: -3, minWidth: 18, height: 18, padding: '0 5px',
              borderRadius: 999, background: 'var(--adm-danger)', color: '#FFFFFF',
              fontSize: 11, fontWeight: 800, lineHeight: '18px', textAlign: 'center',
              fontVariantNumeric: 'tabular-nums',
              border: '2px solid var(--adm-surface)', boxSizing: 'content-box',
            }}
          >
            {belumDibaca > 99 ? '99+' : belumDibaca}
          </span>
        )}
      </button>

      {buka && (
        <>
          <div style={{ position: 'fixed', inset: 0, zIndex: 40 }} onClick={() => setBuka(false)} />
          <div
            role="dialog"
            aria-label="Daftar notifikasi"
            style={{
              position: 'absolute', top: 'calc(100% + 8px)', right: 0, zIndex: 50,
              width: 340, maxWidth: 'calc(100vw - 32px)', maxHeight: 420, overflowY: 'auto',
              background: 'var(--adm-surface)', border: '1px solid var(--adm-border)',
              borderRadius: 'var(--adm-r-md)', boxShadow: 'var(--adm-shadow-md)',
            }}
          >
            <div
              style={{
                padding: '10px 14px', borderBottom: '1px solid var(--adm-border)',
                fontSize: 12, fontWeight: 700, color: 'var(--adm-text)',
                position: 'sticky', top: 0, background: 'var(--adm-surface)',
              }}
            >
              Notifikasi
            </div>

            {daftar.length === 0 ? (
              <div style={{ padding: '28px 14px', textAlign: 'center', fontSize: 12.5, color: 'var(--adm-text-faint)' }}>
                Belum ada notifikasi
              </div>
            ) : (
              daftar.map(n => {
                const rupa = RUPA[n.jenis] || RUPA_UMUM
                const Ikon = rupa.ikon
                const isi = (
                  <div style={{ display: 'flex', gap: 10, padding: '10px 14px', alignItems: 'flex-start' }}>
                    <span
                      style={{
                        width: 28, height: 28, borderRadius: 8, flexShrink: 0,
                        background: rupa.latar, color: rupa.warna,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}
                    >
                      <Ikon size={14} />
                    </span>
                    <span style={{ minWidth: 0, flex: 1 }}>
                      <span style={{ display: 'block', fontSize: 12.5, fontWeight: 650, color: 'var(--adm-text)' }}>
                        {n.judul}
                      </span>
                      <span style={{ display: 'block', fontSize: 12, color: 'var(--adm-text-muted)', lineHeight: 1.45, marginTop: 1 }}>
                        {n.pesan}
                      </span>
                      <span style={{ display: 'block', fontSize: 10.5, color: 'var(--adm-text-faint)', marginTop: 3 }}>
                        {waktuRelatif(n.createdAt)}
                      </span>
                    </span>
                  </div>
                )

                const gaya: React.CSSProperties = {
                  display: 'block', textDecoration: 'none',
                  borderBottom: '1px solid var(--adm-border)',
                  background: n.dibaca ? 'transparent' : 'var(--adm-secondary-weak)',
                }

                return n.tautan
                  ? <Link key={n.id} href={n.tautan} onClick={() => setBuka(false)} style={gaya}>{isi}</Link>
                  : <div key={n.id} style={gaya}>{isi}</div>
              })
            )}
          </div>
        </>
      )}
    </div>
  )
}
