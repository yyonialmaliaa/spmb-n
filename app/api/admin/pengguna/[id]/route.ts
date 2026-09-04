import { NextResponse } from 'next/server'
import { requirePermission, forbidden } from '@/lib/adminSession'
import { catatAudit, bedanya } from '@/lib/audit'
import { prisma } from '@/lib/db'
import { LABEL_ROLE, ROLE_ADMIN_LIST, normalizeRole, type Role } from '@/lib/permissions'
import { isJenjangValid } from '@/lib/pendaftarQuery'

/**
 * Pengaman: sistem harus SELALU menyisakan minimal satu Super Admin yang
 * aktif. Tanpa ini, menonaktifkan atau menurunkan Super Admin terakhir akan
 * mengunci semua orang keluar dari pengelolaan sistem secara permanen.
 */
async function akanMenghabiskanSuperAdmin(idTarget: string): Promise<boolean> {
  const tersisa = await prisma.user.count({
    where: { role: 'super_admin', aktif: true, NOT: { id: idTarget } },
  })
  return tersisa === 0
}

// PUT — ubah peran, scope jenjang, status aktif, nama, atau password.
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const gate = await requirePermission('pengguna', 'update')
  if (!gate.ok) return gate.res
  const { session } = gate

  try {
    const { id } = await params
    const body = await req.json().catch(() => null)
    if (!body) return NextResponse.json({ error: 'Permintaan tidak valid' }, { status: 400 })

    const lama = await prisma.user.findUnique({ where: { id } })
    if (!lama) return NextResponse.json({ error: 'Akun tidak ditemukan' }, { status: 404 })

    const roleLama = normalizeRole(lama.role)
    if (!ROLE_ADMIN_LIST.includes(roleLama)) {
      return NextResponse.json({ error: 'Akun ini bukan akun admin' }, { status: 400 })
    }

    const data: Record<string, unknown> = {}

    if (body.namaLengkap !== undefined) data.namaLengkap = String(body.namaLengkap).trim() || null

    if (body.role !== undefined) {
      if (!ROLE_ADMIN_LIST.includes(body.role)) {
        return NextResponse.json({ error: 'Peran tidak valid' }, { status: 400 })
      }
      // Tidak boleh menurunkan peran diri sendiri — admin bisa tidak sengaja
      // mencabut aksesnya sendiri dan langsung terkunci di luar.
      if (id === session.userId && body.role !== roleLama) {
        return forbidden('Anda tidak dapat mengubah peran akun Anda sendiri.')
      }
      if (roleLama === 'super_admin' && body.role !== 'super_admin' && await akanMenghabiskanSuperAdmin(id)) {
        return forbidden('Ini satu-satunya Super Admin aktif. Angkat Super Admin lain terlebih dahulu.')
      }
      data.role = body.role
    }

    if (body.aktif !== undefined) {
      if (id === session.userId && body.aktif === false) {
        return forbidden('Anda tidak dapat menonaktifkan akun Anda sendiri.')
      }
      if (body.aktif === false && roleLama === 'super_admin' && await akanMenghabiskanSuperAdmin(id)) {
        return forbidden('Ini satu-satunya Super Admin aktif. Angkat Super Admin lain terlebih dahulu.')
      }
      data.aktif = !!body.aktif
    }

    if (body.scopeJenjang !== undefined) {
      if (body.scopeJenjang && !isJenjangValid(body.scopeJenjang)) {
        return NextResponse.json({ error: 'Scope jenjang tidak valid' }, { status: 400 })
      }
      data.scopeJenjang = body.scopeJenjang || null
    }

    const updated = await prisma.user.update({
      where: { id },
      data,
      select: { id: true, email: true, namaLengkap: true, role: true, aktif: true, scopeJenjang: true, lastLoginAt: true, createdAt: true },
    })

    const diff = bedanya(lama as unknown as Record<string, unknown>, data)
    if (diff.fields.length > 0) {
      const bagian: string[] = []
      if (diff.fields.includes('role')) bagian.push(`peran ${LABEL_ROLE[roleLama]} → ${LABEL_ROLE[updated.role as Role]}`)
      if (diff.fields.includes('aktif')) bagian.push(updated.aktif ? 'diaktifkan' : 'dinonaktifkan')
      if (diff.fields.includes('scopeJenjang')) bagian.push(`scope jenjang ${updated.scopeJenjang?.toUpperCase() ?? 'semua'}`)
      if (diff.fields.includes('namaLengkap')) bagian.push('nama diperbarui')
      await catatAudit({
        session,
        aksi: 'update',
        entitas: 'user',
        entitasId: id,
        ringkasan: `Mengubah akun ${lama.email}: ${bagian.join(', ')}`,
        sebelum: diff.sebelum,
        sesudah: diff.sesudah,
        req,
      })
    }

    return NextResponse.json({ success: true, data: updated })
  } catch (err) {
    console.error('Pengguna PUT error:', err)
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 })
  }
}

// DELETE — hapus akun admin.
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const gate = await requirePermission('pengguna', 'delete')
  if (!gate.ok) return gate.res
  const { session } = gate

  try {
    const { id } = await params
    if (id === session.userId) {
      return forbidden('Anda tidak dapat menghapus akun Anda sendiri.')
    }

    const lama = await prisma.user.findUnique({ where: { id } })
    if (!lama) return NextResponse.json({ error: 'Akun tidak ditemukan' }, { status: 404 })

    const roleLama = normalizeRole(lama.role)
    if (!ROLE_ADMIN_LIST.includes(roleLama)) {
      return NextResponse.json({ error: 'Akun ini bukan akun admin' }, { status: 400 })
    }
    if (roleLama === 'super_admin' && await akanMenghabiskanSuperAdmin(id)) {
      return forbidden('Ini satu-satunya Super Admin aktif dan tidak boleh dihapus.')
    }

    await prisma.user.delete({ where: { id } })

    await catatAudit({
      session,
      aksi: 'delete',
      entitas: 'user',
      entitasId: id,
      ringkasan: `Menghapus akun ${LABEL_ROLE[roleLama]} ${lama.email}`,
      sebelum: { email: lama.email, role: lama.role },
      req,
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Pengguna DELETE error:', err)
    return NextResponse.json({ error: 'Gagal menghapus akun' }, { status: 500 })
  }
}
