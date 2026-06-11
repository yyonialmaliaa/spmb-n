import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma, seedIfEmpty } from '@/lib/db'
import { createToken } from '@/lib/auth'
import { cookies } from 'next/headers'

export async function POST(req: Request) {
  try {
    // Buat admin default kalau belum ada
    await seedIfEmpty()

    const { email, password } = await req.json()

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email dan password wajib diisi' },
        { status: 400 }
      )
    }

    const user = await prisma.user.findUnique({ where: { email } })
    if (!user) {
      return NextResponse.json(
        { error: 'Email atau password salah' },
        { status: 401 }
      )
    }

    const valid = await bcrypt.compare(password, user.password)
    if (!valid) {
      return NextResponse.json(
        { error: 'Email atau password salah' },
        { status: 401 }
      )
    }

    const token = await createToken({
      userId: user.id,
      email: user.email,
      role: user.role as 'user' | 'admin',
      namaLengkap: user.namaLengkap ?? undefined,
    })

    const cookieStore = await cookies()
    cookieStore.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 hari
      path: '/',
    })

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        namaLengkap: user.namaLengkap,
      },
    })
  } catch (err) {
    console.error('Login error:', err)
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}
