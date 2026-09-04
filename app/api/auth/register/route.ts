import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/db'
import { createToken, COOKIE_NAME } from '@/lib/auth'
import { normalizeRole } from '@/lib/permissions'
import { cookies } from 'next/headers'

const JENJANG_VALID = ['smp', 'sma', 'smk']

// Registrasi akun SPMB — jenjang pendidikan dipilih SEKALI di sini dan
// langsung dijadikan draft Pendaftaran yang terhubung ke akun (section 6:
// jenjang jadi acuan utama sistem, tidak ditanya ulang di dashboard/awal
// formulir). Memakai model & alur Pendaftaran yang SUDAH ADA (sama persis
// dengan draft yang biasanya dibuat lewat /api/pendaftaran), bukan sistem
// baru — bedanya cuma waktu pembuatannya dimajukan ke saat registrasi.
export async function POST(req: Request) {
  try {
    const { email, password, namaLengkap, jenjang } = await req.json()

    if (!email || !password || !namaLengkap) {
      return NextResponse.json(
        { error: 'Semua field wajib diisi' },
        { status: 400 }
      )
    }

    if (!JENJANG_VALID.includes(jenjang)) {
      return NextResponse.json(
        { error: 'Jenjang pendidikan wajib dipilih' },
        { status: 400 }
      )
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password minimal 8 karakter' },
        { status: 400 }
      )
    }

    // Cek email sudah terdaftar
    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      return NextResponse.json(
        { error: 'Email sudah terdaftar' },
        { status: 409 }
      )
    }

    // Draft Pendaftaran butuh tahun ajaran aktif (field wajib) — dicek
    // sebelum akun dibuat, supaya kalau memang belum diatur admin, tidak
    // ada akun "yatim" tanpa Pendaftaran yang tertinggal.
    const tahunAjaran = await prisma.tahunAjaran.findFirst({ where: { aktif: true } })
    if (!tahunAjaran) {
      return NextResponse.json(
        { error: 'Tahun ajaran aktif belum diatur, hubungi admin sekolah' },
        { status: 400 }
      )
    }

    const hashed = await bcrypt.hash(password, 10)

    // Satu transaksi: akun & draft pendaftarannya harus sama-sama berhasil
    // atau sama-sama batal, tidak boleh akun terbuat tanpa pendaftaran.
    const user = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email,
          password: hashed,
          role: 'user',
          namaLengkap,
        },
      })

      await tx.pendaftaran.create({
        data: {
          userId: user.id,
          tahunAjaranId: tahunAjaran.id,
          jenjang,
          status: 'draft',
          sumberDaftar: 'online',
          statusPembayaran: 'belum_bayar',
        },
      })

      return user
    })

    const token = await createToken({
      userId: user.id,
      email: user.email,
      role: normalizeRole(user.role),
      namaLengkap: user.namaLengkap ?? undefined,
    })

    const cookieStore = await cookies()
    cookieStore.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 2,
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
    console.error('Register error:', err)
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}
