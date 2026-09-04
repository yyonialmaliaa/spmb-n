import { NextResponse } from 'next/server'
import { requirePermission } from '@/lib/adminSession'
import { prisma } from '@/lib/db'
import type { Prisma } from '@prisma/client'

// GET ?entitas=&entitasId=&tahunAjaranId=&jenjang=&aksi=&limit=
//
// Dipakai dua tempat:
//   - komponen AuditTrail pada halaman Harga/Diskon/Tahun Ajaran, disaring
//     dengan entitas + entitasId untuk menampilkan riwayat satu baris.
//   - tab "Log Aktivitas" di halaman Pengaturan, tanpa entitasId.
export async function GET(req: Request) {
  const gate = await requirePermission('audit', 'read')
  if (!gate.ok) return gate.res

  try {
    const url = new URL(req.url)
    const p = url.searchParams

    const where: Prisma.AuditLogWhereInput = {}
    const entitas = p.get('entitas')
    const entitasId = p.get('entitasId')
    const tahunAjaranId = p.get('tahunAjaranId')
    const jenjang = p.get('jenjang')
    const aksi = p.get('aksi')

    if (entitas) where.entitas = entitas
    if (entitasId) where.entitasId = entitasId
    if (tahunAjaranId) where.tahunAjaranId = tahunAjaranId
    if (jenjang) where.jenjang = jenjang
    if (aksi) where.aksi = aksi

    const limit = Math.min(Math.max(Number(p.get('limit')) || 50, 1), 200)

    const data = await prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
    })

    return NextResponse.json({ data })
  } catch (err) {
    console.error('Audit GET error:', err)
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 })
  }
}
