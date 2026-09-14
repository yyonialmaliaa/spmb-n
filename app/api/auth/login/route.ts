import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/db'
import { createToken, COOKIE_NAME } from '@/lib/auth'
import { normalizeRole } from '@/lib/permissions'
import { cookies } from 'next/headers'

export async function POST(req: Request) {
  try {
    // Body yang bukan JSON valid adalah kesalahan pengirim (400), bukan
    // kegagalan server (500) — jangan biarkan jatuh ke catch umum di bawah.
    const body = await req.json().catch(() => null)
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Permintaan tidak valid' }, { status: 400 })
    }
    const { email, password } = body as { email?: string; password?: string }

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

    // Akun yang dinonaktifkan Super Admin tidak boleh masuk. Pesannya
    // sengaja dibedakan dari "email/password salah" supaya petugas tahu
    // harus menghubungi Super Admin, bukan mencoba-coba password.
    if (!user.aktif) {
      return NextResponse.json(
        { error: 'Akun Anda dinonaktifkan. Hubungi Super Admin.' },
        { status: 403 }
      )
    }

    const role = normalizeRole(user.role)

    const token = await createToken({
      userId: user.id,
      email: user.email,
      role,
      namaLengkap: user.namaLengkap ?? undefined,
      scopeJenjang: user.scopeJenjang,
    })

    const cookieStore = await cookies()
    cookieStore.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 2, // 2 hari — samakan dengan masa berlaku token
      path: '/',
    })

    // Dipakai kolom "Terakhir Login" di halaman Pengguna Admin.
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    })

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        role,
        namaLengkap: user.namaLengkap,
        scopeJenjang: user.scopeJenjang,
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
