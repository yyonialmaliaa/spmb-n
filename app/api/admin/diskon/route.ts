import { NextResponse } from 'next/server'
import { requirePermission } from '@/lib/adminSession'
import { prisma } from '@/lib/db'
import { resolveTahunAjaran } from '@/lib/tahunAjaran'

// GET ?tahunAjaranId= - semua jenis diskon milik satu tahun ajaran (default:
// tahun ajaran aktif). Diskon TIDAK lintas tahun ajaran — 2026/2027 dan
// 2027/2028 masing-masing punya daftar diskonnya sendiri.
export async function GET(req: Request) {
  const gate = await requirePermission('diskon', 'read')
  if (!gate.ok) return gate.res

  try {
    const url = new URL(req.url)
    const tahunAjaran = await resolveTahunAjaran(url.searchParams.get('tahunAjaranId'))
    if (!tahunAjaran) return NextResponse.json({ data: [], tahunAjaran: null })

    const list = await prisma.diskon.findMany({ where: { tahunAjaranId: tahunAjaran.id }, orderBy: { createdAt: 'asc' } })
    return NextResponse.json({ data: list, tahunAjaran: { id: tahunAjaran.id, nama: tahunAjaran.nama, aktif: tahunAjaran.aktif } })
  } catch (err) {
    console.error('Admin diskon GET error:', err)
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 })
  }
}

// POST - tambah jenis diskon baru (mis. "Anak Guru/Yayasan", "Prestasi")
export async function POST(req: Request) {
  const gate = await requirePermission('diskon', 'create')
  if (!gate.ok) return gate.res

  try {
    const body = await req.json()
    const jenis = String(body.jenis || '').trim()
    if (!jenis) return NextResponse.json({ error: 'Jenis diskon wajib diisi' }, { status: 400 })

    const tipeNominal = body.tipeNominal === 'persen' ? 'persen' : 'rupiah'
    const nominal = Math.round(Number(body.nominal) || 0)
    if (!nominal || nominal <= 0) return NextResponse.json({ error: 'Nominal diskon wajib diisi' }, { status: 400 })
    if (tipeNominal === 'persen' && nominal > 100) {
      return NextResponse.json({ error: 'Diskon persen maksimal 100' }, { status: 400 })
    }

    const tahunAjaran = await resolveTahunAjaran(body.tahunAjaranId)
    if (!tahunAjaran) return NextResponse.json({ error: 'Tahun ajaran aktif belum diatur' }, { status: 400 })

    const created = await prisma.diskon.create({ data: { tahunAjaranId: tahunAjaran.id, jenis, tipeNominal, nominal } })
    return NextResponse.json({ success: true, data: created })
  } catch (err) {
    console.error('Admin diskon POST error:', err)
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 })
  }
}
