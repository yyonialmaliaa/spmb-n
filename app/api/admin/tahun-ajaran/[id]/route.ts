import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/db'

async function requireAdmin() {
  const session = await getSession()
  return session && session.role === 'admin' ? session : null
}

// PUT - edit nama, dan/atau aktifkan tahun ajaran ini. Mengaktifkan selalu
// dibungkus transaksi (nonaktifkan semua dulu, baru aktifkan satu ini) —
// supaya tidak pernah ada dua tahun ajaran aktif sekaligus meski ada request
// bertabrakan.
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { id } = await params
    const body = await req.json()

    if (body.aktif === true) {
      const [, activated] = await prisma.$transaction([
        prisma.tahunAjaran.updateMany({ data: { aktif: false } }),
        prisma.tahunAjaran.update({ where: { id }, data: { aktif: true, ...(body.nama !== undefined ? { nama: String(body.nama).trim() } : {}) } }),
      ])
      return NextResponse.json({ success: true, data: activated })
    }

    const data: Record<string, any> = {}
    if (body.nama !== undefined) {
      const nama = String(body.nama).trim()
      if (!nama) return NextResponse.json({ error: 'Nama tahun ajaran tidak boleh kosong' }, { status: 400 })
      data.nama = nama
    }

    const updated = await prisma.tahunAjaran.update({ where: { id }, data })
    return NextResponse.json({ success: true, data: updated })
  } catch (err: any) {
    if (err?.code === 'P2002') {
      return NextResponse.json({ error: 'Nama tahun ajaran ini sudah dipakai' }, { status: 400 })
    }
    console.error('Tahun ajaran PUT error:', err)
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 })
  }
}

// DELETE ?confirm=true - hapus tahun ajaran. Tidak boleh menghapus yang
// sedang aktif. Kalau masih punya data terhubung (pendaftar/harga/diskon/
// gelombang/dokumen) dan belum ada ?confirm=true, kembalikan rincian
// jumlahnya dulu (409) supaya frontend bisa menampilkan konfirmasi yang
// jelas sebelum benar-benar menghapus — sesuai permintaan: jangan menghapus
// tanpa konfirmasi.
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { id } = await params
    const url = new URL(req.url)
    const confirmed = url.searchParams.get('confirm') === 'true'

    const tahunAjaran = await prisma.tahunAjaran.findUnique({ where: { id } })
    if (!tahunAjaran) return NextResponse.json({ error: 'Tahun ajaran tidak ditemukan' }, { status: 404 })
    if (tahunAjaran.aktif) {
      return NextResponse.json({ error: 'Tahun ajaran yang sedang aktif tidak boleh dihapus. Aktifkan tahun ajaran lain terlebih dahulu.' }, { status: 400 })
    }

    const [pendaftar, harga, diskon, gelombang, dokumen] = await Promise.all([
      prisma.pendaftaran.count({ where: { tahunAjaranId: id } }),
      prisma.harga.count({ where: { tahunAjaranId: id } }),
      prisma.diskon.count({ where: { tahunAjaranId: id } }),
      prisma.gelombang.count({ where: { tahunAjaranId: id } }),
      prisma.dokumenPersyaratan.count({ where: { tahunAjaranId: id } }),
    ])
    const counts = { pendaftar, harga, diskon, gelombang, dokumen }
    const totalRelated = pendaftar + harga + diskon + gelombang + dokumen

    if (totalRelated > 0 && !confirmed) {
      return NextResponse.json(
        {
          error: 'confirm_required',
          message: `Tahun ajaran "${tahunAjaran.nama}" masih memiliki ${pendaftar} pendaftar, ${harga} harga, ${diskon} diskon, ${gelombang} gelombang, dan ${dokumen} dokumen. Menghapusnya akan menghapus SEMUA data itu secara permanen dan tidak bisa dibatalkan.`,
          counts,
        },
        { status: 409 }
      )
    }

    await prisma.tahunAjaran.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Tahun ajaran DELETE error:', err)
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 })
  }
}
