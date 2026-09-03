import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/db'

// POST - tandai semua notifikasi milik pendaftar yang login sebagai sudah
// dibaca (dipanggil saat panel notifikasi dibuka).
export async function POST() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const pendaftaran = await prisma.pendaftaran.findUnique({ where: { userId: session.userId } })
    if (!pendaftaran) return NextResponse.json({ success: true })

    await prisma.notifikasi.updateMany({
      where: { pendaftaranId: pendaftaran.id, dibaca: false },
      data: { dibaca: true },
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Notifikasi baca error:', err)
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 })
  }
}
