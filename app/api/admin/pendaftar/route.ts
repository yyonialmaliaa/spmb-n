import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET() {
  const session = await getSession()
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const data = await prisma.pendaftaran.findMany({
    include: { user: { select: { email: true } } },
    orderBy: { createdAt: 'desc' },
  })

  const stats = {
    total:    data.length,
    pending:  data.filter(p => p.status === 'pending').length,
    verified: data.filter(p => p.status === 'verified').length,
    diterima: data.filter(p => ['diterima_berkas', 'tes', 'lulus'].includes(p.status)).length,
    ditolak:  data.filter(p => p.status === 'ditolak').length,
    lulus:    data.filter(p => p.status === 'lulus').length,
    tidak_lulus: data.filter(p => p.status === 'tidak_lulus').length,
    daftar_ulang: data.filter(p => p.sudahDaftarUlang).length,
  }

  const enriched = data.map(p => ({ ...p, userEmail: p.user.email }))
  return NextResponse.json({ data: enriched, stats })
}
