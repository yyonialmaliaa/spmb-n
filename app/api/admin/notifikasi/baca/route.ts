import { NextResponse } from 'next/server'
import { getAdminSession } from '@/lib/adminSession'
import { prisma } from '@/lib/db'
import { whereNotifUntuk } from '@/lib/notifikasiAdmin'

// POST - tandai notifikasi sebagai sudah dibaca untuk admin yang sedang
// login. Tanpa body: menandai semua yang terlihat olehnya. Dengan { id }:
// menandai satu baris saja (dipakai saat sebuah notifikasi diklik).
//
// Penandaan ditulis sebagai baris terpisah per pengguna, sehingga membaca
// notifikasi TIDAK menghapusnya dari kotak masuk rekan sesama peran.
export async function POST(req: Request) {
  const session = await getAdminSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await req.json().catch(() => ({}))
    const satuId: string | undefined = body?.id

    const where = {
      ...whereNotifUntuk(session.role),
      ...(session.scopeJenjang ? { OR: [{ jenjang: session.scopeJenjang }, { jenjang: null }] } : {}),
      ...(satuId ? { id: satuId } : {}),
      dibaca: { none: { userId: session.userId } },
    }

    // Sengaja mengambil id dulu lalu createMany: ini memastikan admin hanya
    // bisa menandai notifikasi yang memang boleh dia lihat — mengirim id
    // milik peran lain tidak akan cocok dengan saringan di atas.
    const belum = await prisma.notifikasiAdmin.findMany({ where, select: { id: true } })
    if (belum.length > 0) {
      await prisma.notifikasiAdminDibaca.createMany({
        data: belum.map(n => ({ notifikasiId: n.id, userId: session.userId })),
        skipDuplicates: true,
      })
    }

    return NextResponse.json({ success: true, ditandai: belum.length })
  } catch (err) {
    console.error('Notifikasi admin baca error:', err)
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 })
  }
}
