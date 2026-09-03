import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/db'

// POST - buat akun login & kaitkan ke pendaftaran offline yang sudah ada
// (section C: satu data pendaftar yang sama dipakai untuk offline & online).
// Begitu akun dibuat, pendaftar bisa login dari rumah dan melanjutkan
// formulirnya sendiri — data yang sama, bukan pendaftar baru.
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { id } = await params
    const body = await req.json()
    const email = String(body.email || '').trim().toLowerCase()
    const password = String(body.password || '')

    if (!email) return NextResponse.json({ error: 'Email wajib diisi' }, { status: 400 })
    if (password.length < 8) return NextResponse.json({ error: 'Password minimal 8 karakter' }, { status: 400 })

    const pendaftaran = await prisma.pendaftaran.findUnique({ where: { id } })
    if (!pendaftaran) return NextResponse.json({ error: 'Data pendaftar tidak ditemukan' }, { status: 404 })
    if (pendaftaran.userId) {
      return NextResponse.json({ error: 'Pendaftar ini sudah punya akun login' }, { status: 400 })
    }

    const existingUser = await prisma.user.findUnique({ where: { email } })
    if (existingUser) {
      return NextResponse.json({ error: 'Email sudah terdaftar, gunakan email lain' }, { status: 400 })
    }

    const hashed = await bcrypt.hash(password, 10)
    const user = await prisma.user.create({
      data: { email, password: hashed, role: 'user', namaLengkap: pendaftaran.namaLengkap || undefined },
    })
    const updated = await prisma.pendaftaran.update({ where: { id }, data: { userId: user.id } })

    return NextResponse.json({ success: true, data: updated, email })
  } catch (err) {
    console.error('Buat akun offline error:', err)
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 })
  }
}
