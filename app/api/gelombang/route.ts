import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/db'

// GET - ambil daftar gelombang (auto-buat 3 default utk SMK kalau tabel
// benar-benar kosong — normalnya sudah diisi prisma/seed.ts).
// NOTE: rework penuh (CRUD per jenjang & jalur alumni) ada di fase Gelombang
// fleksibel (lihat rencana) — endpoint ini untuk sementara masih ikut
// bentuk lama (list semua) sampai halaman admin/gelombang & marketing
// dipindah ke bentuk per-jenjang.
export async function GET() {
  try {
    let list = await prisma.gelombang.findMany({ orderBy: [{ jenjang: 'asc' }, { untukAlumni: 'asc' }, { urutan: 'asc' }] })

    if (list.length === 0) {
      const tahunAjaran = await prisma.tahunAjaran.findFirst({ where: { aktif: true } })
      if (tahunAjaran) {
        await prisma.gelombang.createMany({
          data: [
            { tahunAjaranId: tahunAjaran.id, jenjang: 'smk', nama: 'Gelombang 1', urutan: 1, diskonPersen: 0, aktif: true },
            { tahunAjaranId: tahunAjaran.id, jenjang: 'smk', nama: 'Gelombang 2', urutan: 2, diskonPersen: 0, aktif: false },
            { tahunAjaranId: tahunAjaran.id, jenjang: 'smk', nama: 'Gelombang 3', urutan: 3, diskonPersen: 0, aktif: false },
          ],
        })
        list = await prisma.gelombang.findMany({ orderBy: [{ jenjang: 'asc' }, { untukAlumni: 'asc' }, { urutan: 'asc' }] })
      }
    }

    return NextResponse.json({ data: list })
  } catch (err) {
    console.error('Gelombang GET error:', err)
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 })
  }
}

// PUT - admin update diskon / aktifkan salah satu gelombang
export async function PUT(req: Request) {
  const session = await getSession()
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const { id, diskonPersen, aktif } = body
    if (!id) return NextResponse.json({ error: 'ID gelombang wajib diisi' }, { status: 400 })

    // Kalau gelombang ini diaktifkan, nonaktifkan gelombang lain di jalur
    // yang SAMA saja (tahunAjaran+jenjang+untukAlumni) — bukan semua
    // gelombang global, supaya mengaktifkan gelombang SMK tidak menonaktifkan
    // gelombang SMP/SMA yang sedang berjalan.
    if (aktif === true) {
      const current = await prisma.gelombang.findUnique({ where: { id } })
      if (current) {
        await prisma.gelombang.updateMany({
          where: { tahunAjaranId: current.tahunAjaranId, jenjang: current.jenjang, untukAlumni: current.untukAlumni },
          data: { aktif: false },
        })
      }
    }

    const updateData: Record<string, any> = {}
    if (diskonPersen !== undefined) updateData.diskonPersen = parseFloat(diskonPersen) || 0
    if (aktif !== undefined) updateData.aktif = aktif

    const updated = await prisma.gelombang.update({ where: { id }, data: updateData })
    return NextResponse.json({ data: updated })
  } catch (err) {
    console.error('Gelombang PUT error:', err)
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 })
  }
}
