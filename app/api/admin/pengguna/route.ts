import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { requirePermission } from '@/lib/adminSession'
import { catatAudit } from '@/lib/audit'
import { prisma } from '@/lib/db'
import { LABEL_ROLE, ROLE_ADMIN_LIST, type Role } from '@/lib/permissions'
import { isJenjangValid } from '@/lib/pendaftarQuery'

// GET — daftar akun ADMIN saja (akun pendaftar tidak ditampilkan di sini;
// itu ada di menu Pendaftar).
export async function GET() {
  const gate = await requirePermission('pengguna', 'read')
  if (!gate.ok) return gate.res

  try {
    const data = await prisma.user.findMany({
      where: { role: { in: ROLE_ADMIN_LIST } },
      select: {
        id: true, email: true, namaLengkap: true, role: true,
        aktif: true, scopeJenjang: true, lastLoginAt: true, createdAt: true,
      },
      orderBy: [{ role: 'asc' }, { createdAt: 'asc' }],
    })
    return NextResponse.json({ data, saya: gate.session.userId })
  } catch (err) {
    console.error('Pengguna GET error:', err)
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 })
  }
}

// POST — buat akun admin baru.
export async function POST(req: Request) {
  const gate = await requirePermission('pengguna', 'create')
  if (!gate.ok) return gate.res

  try {
    const body = await req.json().catch(() => null)
    if (!body) return NextResponse.json({ error: 'Permintaan tidak valid' }, { status: 400 })

    const { email, namaLengkap, password, role, scopeJenjang } = body

    if (!email || !/^\S+@\S+\.\S+$/.test(String(email))) {
      return NextResponse.json({ error: 'Email tidak valid' }, { status: 400 })
    }
    if (!password || String(password).length < 8) {
      return NextResponse.json({ error: 'Password minimal 8 karakter' }, { status: 400 })
    }
    if (!ROLE_ADMIN_LIST.includes(role)) {
      return NextResponse.json({ error: 'Peran tidak valid' }, { status: 400 })
    }
    if (scopeJenjang && !isJenjangValid(scopeJenjang)) {
      return NextResponse.json({ error: 'Scope jenjang tidak valid' }, { status: 400 })
    }

    const sudahAda = await prisma.user.findUnique({ where: { email: String(email).toLowerCase() } })
    if (sudahAda) {
      return NextResponse.json({ error: 'Email itu sudah terdaftar' }, { status: 400 })
    }

    const dibuat = await prisma.user.create({
      data: {
        email: String(email).toLowerCase(),
        namaLengkap: namaLengkap?.trim() || null,
        password: await bcrypt.hash(String(password), 10),
        role,
        scopeJenjang: scopeJenjang || null,
      },
      select: { id: true, email: true, namaLengkap: true, role: true, aktif: true, scopeJenjang: true, lastLoginAt: true, createdAt: true },
    })

    await catatAudit({
      session: gate.session,
      aksi: 'create',
      entitas: 'user',
      entitasId: dibuat.id,
      ringkasan: `Membuat akun ${LABEL_ROLE[role as Role]} untuk ${dibuat.email}`,
      sesudah: { role, scopeJenjang: dibuat.scopeJenjang },
      req,
    })

    return NextResponse.json({ success: true, data: dibuat })
  } catch (err) {
    console.error('Pengguna POST error:', err)
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 })
  }
}
