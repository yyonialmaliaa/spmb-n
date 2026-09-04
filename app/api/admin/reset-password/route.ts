import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/db'
import { getAdminSession, forbidden, unauthorized } from '@/lib/adminSession'
import { catatAudit } from '@/lib/audit'
import { can, isAdminRole, normalizeRole } from '@/lib/permissions'
import { kirimNotifikasi } from '@/lib/notifikasi'

// PUT - reset password sebuah akun (identifikasi lewat userId).
//
// Izin ditentukan oleh ROLE AKUN TARGET, bukan hanya role pemanggil:
//   target pendaftar  -> butuh pendaftar:update  (front office boleh)
//   target akun admin -> butuh pengguna:update   (super admin saja)
// Tanpa pembedaan ini Admin SPMB bisa mereset password Super Admin lalu
// masuk sebagai Super Admin — jalur eskalasi privilege.
export async function PUT(req: Request) {
  const session = await getAdminSession()
  if (!session) return unauthorized()

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

    const targetRole = normalizeRole(user.role)
    const izin = isAdminRole(targetRole) ? 'pengguna' : 'pendaftar'
    if (!can(session.role, izin, 'update')) {
      return forbidden(
        isAdminRole(targetRole)
          ? 'Hanya Super Admin yang dapat mereset password akun admin.'
          : 'Anda tidak memiliki akses untuk mereset password pendaftar.',
      )
    }

    const hashed = await bcrypt.hash(passwordBaru, 10)
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashed },
    })

    await catatAudit({
      session,
      aksi: 'reset_password',
      entitas: 'user',
      entitasId: userId,
      ringkasan: `Mereset password akun ${user.email}${isAdminRole(targetRole) ? ` (${targetRole})` : ''}`,
      req,
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
