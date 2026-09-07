import { NextResponse } from 'next/server'
import { getAdminSession } from '@/lib/adminSession'
import { prisma } from '@/lib/db'
import { whereNotifUntuk } from '@/lib/notifikasiAdmin'
import type { Prisma } from '@prisma/client'

const BATAS = 30

/**
 * Penyaring notifikasi milik admin yang sedang login.
 *
 * Dua lapis: PERAN (Front Office tidak dibanjiri antrean loket, dan
 * sebaliknya; Super Admin melihat keduanya) dan SCOPE JENJANG (admin yang
 * dibatasi ke satu jenjang tidak diberi tahu soal jenjang lain). Notifikasi
 * tanpa jenjang selalu lolos karena sifatnya lintas jenjang.
 */
function saringan(role: Parameters<typeof whereNotifUntuk>[0], scopeJenjang: string | null): Prisma.NotifikasiAdminWhereInput {
  return {
    ...whereNotifUntuk(role),
    ...(scopeJenjang ? { OR: [{ jenjang: scopeJenjang }, { jenjang: null }] } : {}),
  }
}

// GET - kotak masuk notifikasi admin yang sedang login, beserta jumlah yang
// belum dibaca. Status "dibaca" dihitung per pengguna, bukan per baris
// notifikasi: satu pendaftar baru dilihat oleh semua petugas Front Office,
// dan yang satu membacanya tidak membuat yang lain ikut terbaca.
export async function GET() {
  const session = await getAdminSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const where = saringan(session.role, session.scopeJenjang)

    const [baris, belumDibaca] = await Promise.all([
      prisma.notifikasiAdmin.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: BATAS,
        include: { dibaca: { where: { userId: session.userId }, select: { id: true } } },
      }),
      prisma.notifikasiAdmin.count({
        where: { ...where, dibaca: { none: { userId: session.userId } } },
      }),
    ])

    const data = baris.map(n => ({
      id: n.id,
      jenis: n.jenis,
      judul: n.judul,
      pesan: n.pesan,
      tautan: n.tautan,
      jenjang: n.jenjang,
      createdAt: n.createdAt,
      dibaca: n.dibaca.length > 0,
    }))

    return NextResponse.json({ data, belumDibaca })
  } catch (err) {
    console.error('Notifikasi admin GET error:', err)
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 })
  }
}
