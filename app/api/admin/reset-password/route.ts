import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { kirimNotifikasi } from '@/lib/notifikasi'

// PUT - admin reset password akun siswa (identifikasi lewat userId)
export async function PUT(req: Request) {
  const session = await getSession()
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { userId, passwordBaru } = await req.json()

    if (!userId) {
      return NextResponse.json({ error: 'userId wajib diisi' }, { status: 400 })
    }
    if (!passwordBaru || passwordBaru.length < 8) {
      return NextResponse.json({ error: 'Password baru minimal 8 karakter' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user) {
      return NextResponse.json({ error: 'Akun tidak ditemukan' }, { status: 404 })
    }

    const hashed = await bcrypt.hash(passwordBaru, 10)
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashed },
    })

    const pendaftaran = await prisma.pendaftaran.findUnique({ where: { userId } })
    if (pendaftaran) {
      await kirimNotifikasi(pendaftaran.id, 'Password akun Anda telah direset oleh admin. Hubungi admin bila ini bukan permintaan Anda.')
    }

    return NextResponse.json({ success: true, email: user.email })
  } catch (err) {
    console.error('Reset password error:', err)
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 })
  }
}
