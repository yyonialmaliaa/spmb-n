import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { normalizeRole, type Role } from './permissions';

function getSecret() {
  const value = process.env.NEXTAUTH_SECRET?.trim();
  if (!value || value.length < 32) {
    throw new Error('NEXTAUTH_SECRET must be set to a random value of at least 32 characters');
  }
  return new TextEncoder().encode(value);
}

export const COOKIE_NAME = 'token';

// 2 hari, bukan 7. Proxy tidak bisa mengakses database, jadi selama token
// masih hidup ia tetap mempercayai role di dalamnya. Masa berlaku pendek
// membatasi seberapa lama role basi bisa lolos di lapisan proxy —
// pemeriksaan yang otoritatif tetap lib/adminSession.ts yang membaca DB.
const TOKEN_TTL = '2d';

export interface SessionPayload {
  userId: string;
  email: string;
  role: Role;
  namaLengkap?: string;
  scopeJenjang?: string | null;
}

export async function createToken(payload: SessionPayload): Promise<string> {
  return await new SignJWT(payload as unknown as Record<string, unknown>)
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime(TOKEN_TTL)
    .sign(getSecret());
}

export async function verifyToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    const raw = payload as unknown as SessionPayload;
    // normalizeRole memetakan role lama "admin" -> "super_admin", supaya
    // token yang terbit sebelum migrasi role tetap valid.
    return { ...raw, role: normalizeRole(raw.role) };
  } catch {
    return null;
  }
}

export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyToken(token);
}

// requireAuth() dan requireAdmin() yang lama sengaja dihapus. Keduanya
// melempar Error (bukan mengembalikan Response), tidak pernah dipakai satu
// route pun, dan keberadaannya berdampingan dengan cek inline adalah asal
// mula ~20 duplikasi `session.role !== 'admin'`. Penggantinya:
// requirePermission() di lib/adminSession.ts.
