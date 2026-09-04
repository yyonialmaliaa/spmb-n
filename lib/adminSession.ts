import { cache } from 'react'
import { NextResponse } from 'next/server'
import { prisma } from './db'
import { getSession } from './auth'
import {
  can,
  canAny,
  isAdminRole,
  isReadOnly,
  normalizeRole,
  type Action,
  type Resource,
  type Role,
} from './permissions'

// Data Access Layer untuk area admin.
//
// Mengikuti panduan Next 16 (02-guides/authentication.md): lakukan pengecekan
// auth sedekat mungkin dengan data, dan memoize dengan React cache() supaya
// satu request tidak memukul database berkali-kali.
//
// KUNCI: role, status aktif, dan scope jenjang dibaca dari DATABASE, bukan
// dari JWT. Konsekuensinya menonaktifkan akun atau menurunkan role langsung
// berlaku di request berikutnya — bukan menunggu token kedaluwarsa.

export interface AdminSession {
  userId: string
  email: string
  role: Role
  namaLengkap: string | null
  /** null = boleh semua jenjang. */
  scopeJenjang: string | null
}

/**
 * Sesi admin yang sudah diverifikasi ke database, atau null.
 *
 * null bila: tidak ada token, token tidak valid, user sudah dihapus, akun
 * dinonaktifkan (aktif=false), atau rolenya bukan role admin.
 */
export const getAdminSession = cache(async (): Promise<AdminSession | null> => {
  const session = await getSession()
  if (!session?.userId) return null

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: {
      id: true,
      email: true,
      role: true,
      namaLengkap: true,
      aktif: true,
      scopeJenjang: true,
    },
  })
  if (!user || !user.aktif) return null

  const role = normalizeRole(user.role)
  if (!isAdminRole(role)) return null

  return {
    userId: user.id,
    email: user.email,
    role,
    namaLengkap: user.namaLengkap,
    scopeJenjang: user.scopeJenjang,
  }
})

type Gate =
  | { ok: true; session: AdminSession }
  | { ok: false; res: NextResponse }

export function unauthorized(pesan = 'Anda harus masuk terlebih dahulu.') {
  return NextResponse.json({ error: pesan }, { status: 401 })
}

export function forbidden(pesan = 'Anda tidak memiliki akses untuk tindakan ini.') {
  return NextResponse.json({ error: pesan }, { status: 403 })
}

/**
 * Gerbang standar untuk route API admin. Menggantikan cek
 * `session.role !== 'admin'` yang dulu diduplikasi di ~20 route.
 *
 *   const gate = await requirePermission('harga', 'update')
 *   if (!gate.ok) return gate.res
 *   const { session } = gate
 */
export async function requirePermission(
  resource: Resource,
  action: Action,
): Promise<Gate> {
  const session = await getAdminSession()
  if (!session) return { ok: false, res: unauthorized() }
  if (!can(session.role, resource, action)) {
    return { ok: false, res: forbidden() }
  }
  return { ok: true, session }
}

/**
 * Butuh akses apa pun ke resource (dipakai endpoint yang hanya membaca dan
 * sudah menentukan aksinya sendiri per-field).
 */
export async function requireResource(resource: Resource): Promise<Gate> {
  const session = await getAdminSession()
  if (!session) return { ok: false, res: unauthorized() }
  if (!canAny(session.role, resource)) {
    return { ok: false, res: forbidden() }
  }
  return { ok: true, session }
}

/**
 * Batasi akses ke jenjang yang menjadi scope admin ini.
 *
 * Mengembalikan NextResponse bila ditolak, atau null bila boleh lanjut —
 * scopeJenjang null berarti boleh semua jenjang.
 */
export function requireJenjang(
  session: AdminSession,
  jenjang: string | null | undefined,
): NextResponse | null {
  if (!session.scopeJenjang) return null
  if (!jenjang) return null
  if (session.scopeJenjang !== jenjang) {
    return forbidden(`Akun Anda hanya dapat mengakses jenjang ${session.scopeJenjang.toUpperCase()}.`)
  }
  return null
}

/**
 * Jenjang efektif untuk sebuah query: admin ber-scope selalu dipaksa ke
 * jenjangnya sendiri, apa pun yang dikirim di query string.
 */
export function scopedJenjang(
  session: AdminSession,
  diminta: string | null | undefined,
): string | null {
  if (session.scopeJenjang) return session.scopeJenjang
  return diminta || null
}

export { can, canAny, isReadOnly }
