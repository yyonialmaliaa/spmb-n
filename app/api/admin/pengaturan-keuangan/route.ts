import { NextResponse } from 'next/server'
import { requirePermission } from '@/lib/adminSession'
import { prisma } from '@/lib/db'
import { resolveTahunAjaran } from '@/lib/tahunAjaran'

// GET ?tahunAjaranId= - ambil pengaturan minimal pembayaran awal & minimal
// cicilan untuk satu tahun ajaran (default aktif), dibuat dengan nilai
// default kalau belum pernah diatur untuk tahun ajaran itu.
export async function GET(req: Request) {
  const gate = await requirePermission('pengaturan', 'read')
  if (!gate.ok) return gate.res

  try {
    const url = new URL(req.url)
    const tahunAjaran = await resolveTahunAjaran(url.searchParams.get('tahunAjaranId'))
    if (!tahunAjaran) return NextResponse.json({ data: null })

    const pengaturan = await prisma.pengaturanKeuangan.upsert({
      where: { tahunAjaranId: tahunAjaran.id },
      update: {},
      create: { tahunAjaranId: tahunAjaran.id },
    })
    return NextResponse.json({ data: pengaturan })
  } catch (err) {
    console.error('Pengaturan keuangan GET error:', err)
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 })
  }
}

// PUT - ubah minimal pembayaran awal (gerbang kirim formulir) dan/atau
// minimal cicilan berikutnya, untuk satu tahun ajaran (body.tahunAjaranId,
// default aktif)
export async function PUT(req: Request) {
  const gate = await requirePermission('pengaturan_keuangan', 'update')
  if (!gate.ok) return gate.res

  try {
    const body = await req.json()
    const tahunAjaran = await resolveTahunAjaran(body.tahunAjaranId)
    if (!tahunAjaran) return NextResponse.json({ error: 'Tahun ajaran aktif belum diatur' }, { status: 400 })

    const data: Record<string, any> = {}
    if (body.minimalPembayaranAwal !== undefined) {
      const v = Math.round(Number(body.minimalPembayaranAwal) || 0)
      if (!v || v <= 0) return NextResponse.json({ error: 'Minimal pembayaran awal tidak valid' }, { status: 400 })
      data.minimalPembayaranAwal = v
    }
    if (body.minimalCicilan !== undefined) {
      const v = Math.round(Number(body.minimalCicilan) || 0)
      if (!v || v <= 0) return NextResponse.json({ error: 'Minimal cicilan tidak valid' }, { status: 400 })
      data.minimalCicilan = v
    }

    const updated = await prisma.pengaturanKeuangan.upsert({
      where: { tahunAjaranId: tahunAjaran.id },
      update: data,
      create: { tahunAjaranId: tahunAjaran.id, ...data },
    })
    return NextResponse.json({ success: true, data: updated })
  } catch (err) {
    console.error('Pengaturan keuangan PUT error:', err)
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 })
  }
}
