// Pengaman: kalau komponen client (langsung atau lewat modul lain) mengimpor
// file ini, build/dev langsung gagal dengan pesan jelas — bukan PrismaClient
// yang meledak di browser seperti yang pernah terjadi lewat lib/landing.ts.
import 'server-only'
import { Prisma, PrismaClient } from '@prisma/client'

// Compute Neon "tidur" setelah beberapa menit tidak dipakai, dan bangunnya
// bisa lebih dari 5 detik (bawaan connect_timeout Prisma) — query pertama
// lalu gagal P1001 "Can't reach database server" dan API membalas 500.
// Rekomendasi Neon untuk Prisma: connect_timeout=15. Hanya dipasang kalau
// DATABASE_URL belum mengaturnya sendiri.
function urlDatabase(): string | undefined {
  const url = process.env.DATABASE_URL
  if (!url || /[?&]connect_timeout=/.test(url)) return url
  return `${url}${url.includes('?') ? '&' : '?'}connect_timeout=15`
}

// Koneksi yang sempat tersambung lalu tidak terjangkau / diputus server.
const KODE_KONEKSI = new Set(['P1001', 'P1002', 'P1017'])
const OPERASI_BACA = new Set([
  'findUnique', 'findUniqueOrThrow', 'findFirst', 'findFirstOrThrow',
  'findMany', 'count', 'aggregate', 'groupBy',
])

function galatKoneksi(err: unknown): boolean {
  // Belum pernah tersambung sama sekali (mis. compute Neon masih bangun):
  // Prisma melempar InitializationError TANPA kode P1001.
  if (err instanceof Prisma.PrismaClientInitializationError) return true
  const kode = (err as { code?: string } | null)?.code
  return !!kode && KODE_KONEKSI.has(kode)
}

function buatKlien() {
  return new PrismaClient({ datasourceUrl: urlDatabase(), log: ['error'] }).$extends({
    query: {
      $allModels: {
        // Koneksi yang sudah diputus pooler baru ketahuan saat dipakai. Query
        // BACA diulang sekali karena tidak mengubah apa pun. Query tulis
        // sengaja tidak diulang: kalau ternyata sudah tercatat, mengulangnya
        // bisa mencatat pembayaran dua kali.
        async $allOperations({ operation, args, query }) {
          try {
            return await query(args)
          } catch (err) {
            if (!OPERASI_BACA.has(operation) || !galatKoneksi(err)) throw err
            await new Promise(r => setTimeout(r, 300))
            return query(args)
          }
        },
      },
    },
  })
}

const globalForPrisma = globalThis as unknown as {
  prisma: ReturnType<typeof buatKlien> | undefined
}

export const prisma = globalForPrisma.prisma ?? buatKlien()

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}

export type { User, Pendaftaran } from '@prisma/client'
