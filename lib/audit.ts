import { prisma } from './db'
import type { AdminSession } from './adminSession'

// Jejak audit. Tujuannya BUKAN hiasan di halaman Pengaturan: baris-baris ini
// yang menjawab "harga SMP siapa yang mengubah dari Rp500.000 jadi
// Rp550.000, kapan, di tahun ajaran mana".
//
// Semua penulisan bersifat best-effort: kegagalan mencatat audit tidak boleh
// menggagalkan aksi yang sudah tersimpan. Pola yang sama dipakai
// lib/notifikasi.ts.

export type EntitasAudit =
  | 'harga'
  | 'diskon'
  | 'tahun_ajaran'
  | 'gelombang'
  | 'persyaratan'
  | 'pembayaran'
  | 'pendaftaran'
  | 'user'
  | 'pengaturan'

export type AksiAudit =
  | 'create'
  | 'update'
  | 'delete'
  | 'activate'
  | 'verify'
  | 'reject'
  | 'reset_password'

export interface InputAudit {
  session: Pick<AdminSession, 'userId' | 'email' | 'role'>
  aksi: AksiAudit
  entitas: EntitasAudit
  entitasId?: string | null
  /** Kalimat bahasa Indonesia yang langsung dirender di UI. */
  ringkasan: string
  sebelum?: unknown
  sesudah?: unknown
  jenjang?: string | null
  tahunAjaranId?: string | null
  req?: Request
}

function ambilIp(req?: Request): string | null {
  if (!req) return null
  const fwd = req.headers.get('x-forwarded-for')
  if (fwd) return fwd.split(',')[0].trim()
  return req.headers.get('x-real-ip')
}

export async function catatAudit(input: InputAudit): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        actorId: input.session.userId,
        actorEmail: input.session.email,
        actorRole: input.session.role,
        aksi: input.aksi,
        entitas: input.entitas,
        entitasId: input.entitasId ?? null,
        ringkasan: input.ringkasan,
        sebelum: (input.sebelum ?? undefined) as never,
        sesudah: (input.sesudah ?? undefined) as never,
        jenjang: input.jenjang ?? null,
        tahunAjaranId: input.tahunAjaranId ?? null,
        ip: ambilIp(input.req),
      },
    })
  } catch (err) {
    console.error('Gagal mencatat audit:', err)
  }
}

/** Format rupiah untuk kalimat ringkasan audit. */
export function rupiah(n: number | null | undefined): string {
  if (n === null || n === undefined) return '—'
  return 'Rp' + n.toLocaleString('id-ID')
}

/**
 * Bandingkan dua objek dan hasilkan daftar field yang benar-benar berubah.
 * Dipakai agar `sebelum`/`sesudah` hanya menyimpan yang relevan, bukan
 * seluruh baris.
 */
export function bedanya<T extends Record<string, unknown>>(
  lama: T,
  baru: Partial<T>,
): { sebelum: Partial<T>; sesudah: Partial<T>; fields: string[] } {
  const sebelum: Partial<T> = {}
  const sesudah: Partial<T> = {}
  const fields: string[] = []
  for (const k of Object.keys(baru) as (keyof T)[]) {
    if (baru[k] === undefined) continue
    if (lama[k] === baru[k]) continue
    sebelum[k] = lama[k]
    sesudah[k] = baru[k]
    fields.push(String(k))
  }
  return { sebelum, sesudah, fields }
}
