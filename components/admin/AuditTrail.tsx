'use client'

import { useCallback, useState } from 'react'
import { History } from 'lucide-react'
import { useMuatData, ambilJson } from './useMuatData'
import { useAdmin } from './AdminProvider'
import { EmptyState, ErrorState, Skeleton } from './ui'
import { LABEL_ROLE } from '@/lib/permissions'

// Menampilkan jejak audit satu entitas — inilah yang membuat AuditLog jadi
// data yang dipakai, bukan tabel hiasan.
//
// Hanya dirender untuk role yang boleh membaca audit; untuk role lain
// komponen ini tidak menampilkan apa pun (bukan pesan "tidak boleh", karena
// keberadaan panelnya sendiri tidak perlu diketahui).

interface Baris {
  id: string
  ringkasan: string
  actorEmail: string
  actorRole: string
  aksi: string
  createdAt: string
}

const tglJam = (v: string) =>
  new Date(v).toLocaleString('id-ID', {
    day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  })

export function AuditTrail({
  entitas,
  entitasId,
  judul = 'Riwayat Perubahan',
  batas = 10,
}: {
  entitas: string
  /** Kosongkan untuk melihat seluruh riwayat entitas ini. */
  entitasId?: string
  judul?: string
  batas?: number
}) {
  const { canAny } = useAdmin()
  const [buka, setBuka] = useState(false)
  const bolehBaca = canAny('audit')

  const ambil = useCallback(
    async (sinyal: AbortSignal) => {
      if (!bolehBaca || !buka) return [] as Baris[]
      const qp = new URLSearchParams({ entitas, limit: String(batas) })
      if (entitasId) qp.set('entitasId', entitasId)
      const d = await ambilJson<{ data: Baris[] }>(`/api/admin/audit?${qp}`, sinyal)
      return d.data ?? []
    },
    [bolehBaca, buka, entitas, entitasId, batas],
  )

  const { data, loading, gagal, muatUlang } = useMuatData(ambil, [bolehBaca, buka, entitas, entitasId, batas])

  if (!bolehBaca) return null

  return (
    <section className="adm-card" style={{ marginTop: 18 }}>
      <button
        onClick={() => setBuka(v => !v)}
        aria-expanded={buka}
        className="adm-card-head"
        style={{
          width: '100%', background: 'none', border: 'none', cursor: 'pointer',
          fontFamily: 'inherit', textAlign: 'left',
          borderBottom: buka ? '1px solid var(--adm-border)' : 'none',
        }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
          <History size={15} color="var(--adm-text-muted)" />
          <span className="adm-card-title">{judul}</span>
        </span>
        <span style={{ fontSize: 12, color: 'var(--adm-primary)', fontWeight: 600 }}>
          {buka ? 'Sembunyikan' : 'Lihat'}
        </span>
      </button>

      {buka && (
        loading ? (
          <div style={{ padding: 16, display: 'grid', gap: 10 }}>
            {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} tinggi={14} lebar={i === 0 ? '70%' : '55%'} />)}
          </div>
        ) : gagal ? (
          <ErrorState onCoba={muatUlang} />
        ) : (data?.length ?? 0) === 0 ? (
          <EmptyState
            judul="Belum ada perubahan tercatat"
            pesan="Setiap perubahan pada data ini akan tercatat di sini beserta pelaku dan waktunya."
          />
        ) : (
          <div>
            {data!.map(a => (
              <div
                key={a.id}
                style={{
                  padding: '11px 20px', borderTop: '1px solid var(--adm-border)',
                  display: 'flex', gap: 12, alignItems: 'flex-start',
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13 }}>{a.ringkasan}</div>
                  <div style={{ fontSize: 11.5, color: 'var(--adm-text-muted)', marginTop: 2 }}>
                    {a.actorEmail} · {LABEL_ROLE[a.actorRole as keyof typeof LABEL_ROLE] ?? a.actorRole}
                  </div>
                </div>
                <span style={{ fontSize: 11, color: 'var(--adm-text-faint)', whiteSpace: 'nowrap' }}>
                  {tglJam(a.createdAt)}
                </span>
              </div>
            ))}
          </div>
        )
      )}
    </section>
  )
}
