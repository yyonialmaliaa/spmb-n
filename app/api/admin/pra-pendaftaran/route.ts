import { NextResponse } from 'next/server'
import type { Prisma } from '@prisma/client'
import { requireJenjang, requirePermission, scopedJenjang } from '@/lib/adminSession'
import { prisma } from '@/lib/db'
import { resolveTahunAjaran } from '@/lib/tahunAjaran'
import { STATUS_PRA, STATUS_PRA_AKTIF, isJenjangPra, type StatusPra } from '@/lib/praPendaftaran'
import { tandaiKedaluwarsa } from '@/lib/praPendaftaranServer'

const TAB: Record<string, Prisma.PraPendaftaranWhereInput> = {
  aktif: { status: { in: STATUS_PRA_AKTIF } },
  selesai: { status: 'selesai' },
  kedaluwarsa: { status: 'kedaluwarsa' },
  semua: {},
}

function saringanCari(q: string): Prisma.PraPendaftaranWhereInput {
  if (!q) return {}
  let digit = q.replace(/\D/g, '')
  if (digit.startsWith('62')) digit = '0' + digit.slice(2)
  return {
    OR: [
      { noPraPendaftaran: { contains: q, mode: 'insensitive' } },
      { namaLengkap: { contains: q, mode: 'insensitive' } },
      { email: { contains: q, mode: 'insensitive' } },
      ...(digit.length >= 4 ? [{ noHp: { contains: digit } }] : []),
    ],
  }
}

// GET ?jenjang=&tab=aktif|selesai|kedaluwarsa|semua&q=&tahunAjaranId=
export async function GET(req: Request) {
  const gate = await requirePermission('pra_pendaftaran', 'read')
  if (!gate.ok) return gate.res

  try {
    const url = new URL(req.url)
    const diminta = url.searchParams.get('jenjang')
    if (diminta && !isJenjangPra(diminta)) return NextResponse.json({ error: 'jenjang tidak valid' }, { status: 400 })
    const tolak = requireJenjang(gate.session, diminta)
    if (tolak) return tolak

    const tahunAjaran = await resolveTahunAjaran(url.searchParams.get('tahunAjaranId'))
    const hitungKosong = Object.fromEntries(Object.keys(STATUS_PRA).map(s => [s, 0])) as Record<StatusPra, number>
    if (!tahunAjaran) return NextResponse.json({ data: [], hitung: hitungKosong, tahunAjaran: null })

    await tandaiKedaluwarsa({ tahunAjaranId: tahunAjaran.id })

    const q = (url.searchParams.get('q') || '').trim().slice(0, 80)
    // Petugas di loket mencari dari bukti yang dibawa, jadi pencarian tidak dibatasi jenjang yang sedang dibuka.
    const jenjang = q ? gate.session.scopeJenjang : scopedJenjang(gate.session, diminta)
    const dasar: Prisma.PraPendaftaranWhereInput = {
      tahunAjaranId: tahunAjaran.id,
      ...(jenjang ? { jenjang } : {}),
      ...saringanCari(q),
    }

    const [baris, kelompok] = await Promise.all([
      prisma.praPendaftaran.findMany({
        where: { ...dasar, ...(TAB[url.searchParams.get('tab') || 'aktif'] ?? TAB.aktif) },
        orderBy: { createdAt: 'desc' },
        take: 500,
        select: {
          id: true, noPraPendaftaran: true, namaLengkap: true, email: true, noHp: true, asalSekolah: true,
          jenjang: true, jurusan: true, status: true, batasKedatangan: true, createdAt: true, pendaftaranId: true,
        },
      }),
      prisma.praPendaftaran.groupBy({ by: ['status'], where: dasar, _count: { _all: true } }),
    ])

    const hitung = { ...hitungKosong }
    for (const k of kelompok) if (k.status in hitung) hitung[k.status as StatusPra] = k._count._all

    return NextResponse.json({
      data: baris,
      hitung,
      lintasJenjang: !!q && !gate.session.scopeJenjang,
      tahunAjaran: { id: tahunAjaran.id, nama: tahunAjaran.nama, aktif: tahunAjaran.aktif },
    })
  } catch (err) {
    console.error('Pra-pendaftaran admin GET error:', err)
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 })
  }
}
