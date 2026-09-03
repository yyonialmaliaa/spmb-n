import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/db'

// GET - riwayat notifikasi milik pendaftar yang login. Satu baris tercatat
// tiap kali admin melakukan tindakan yang berdampak ke pendaftaran ybs
// (lihat lib/notifikasi.ts & titik pemanggilannya di route admin).
export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const pendaftaran = await prisma.pendaftaran.findUnique({ where: { userId: session.userId } })
    if (!pendaftaran) return NextResponse.json({ data: [], belumDibaca: 0 })

    const [data, belumDibaca] = await Promise.all([
      prisma.notifikasi.findMany({
        where: { pendaftaranId: pendaftaran.id },
        orderBy: { createdAt: 'desc' },
        take: 30,
      }),
      prisma.notifikasi.count({ where: { pendaftaranId: pendaftaran.id, dibaca: false } }),
    ])

    return NextResponse.json({ data, belumDibaca })
  } catch (err) {
    console.error('Notifikasi GET error:', err)
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 })
  }
}
