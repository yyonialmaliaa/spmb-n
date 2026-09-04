import { NextResponse } from 'next/server'
import { requirePermission } from '@/lib/adminSession'
import { resolveTahunAjaran } from '@/lib/tahunAjaran'
import { ringkasanPerJenjang, periodeSpmb } from '@/lib/pendaftarQuery'
import { canAny } from '@/lib/permissions'
import { prisma } from '@/lib/db'

// GET ?tahunAjaranId= — angka untuk kartu di halaman Pilih Jenjang.
//
// Dihitung dengan groupBy di database. Sebelumnya halaman itu mengunduh
// SELURUH baris pendaftar tiga jenjang (~90 kolom masing-masing) lalu
// menghitungnya di browser.
export async function GET(req: Request) {
  const gate = await requirePermission('dashboard', 'read')
  if (!gate.ok) return gate.res

  try {
    const url = new URL(req.url)
    const tahunAjaran = await resolveTahunAjaran(url.searchParams.get('tahunAjaranId'))
    if (!tahunAjaran) {
      return NextResponse.json({ data: [], tahunAjaran: null })
    }

    const [data, periode, aktivitas] = await Promise.all([
      ringkasanPerJenjang(tahunAjaran.id),
      periodeSpmb(tahunAjaran.id),
      // Panel "Aktivitas Terakhir" hanya untuk role yang boleh membaca audit.
      canAny(gate.session.role, 'audit')
        ? prisma.auditLog.findMany({
            orderBy: { createdAt: 'desc' },
            take: 5,
            select: {
              id: true, ringkasan: true, actorEmail: true, actorRole: true,
              jenjang: true, entitas: true, createdAt: true,
            },
          })
        : Promise.resolve([]),
    ])

    return NextResponse.json({
      data,
      periode,
      aktivitas,
      tahunAjaran: { id: tahunAjaran.id, nama: tahunAjaran.nama, aktif: tahunAjaran.aktif },
    })
  } catch (err) {
    console.error('Ringkasan jenjang GET error:', err)
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 })
  }
}
