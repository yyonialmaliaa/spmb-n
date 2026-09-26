import { NextResponse } from 'next/server'
import { requirePermission, requireJenjang, type AdminSession } from '@/lib/adminSession'
import { prisma } from '@/lib/db'
import { HargaTidakDitemukanError } from '@/lib/keuangan'
import { pratinjauMutasi, jalankanMutasi, MutasiDitolakError, MutasiBentrokError } from '@/lib/mutasi'

// GET  ?jenjang=&jurusan=&tingkat=&kelas=&diskonId=  pilihan tujuan + pratinjau tagihan, tidak menyimpan apa pun
// POST { jenjang, jurusan, kelas, diskonId, alasan }  jalankan mutasi

function tanggapiGalat(err: unknown) {
  if (err instanceof MutasiDitolakError || err instanceof HargaTidakDitemukanError) {
    return NextResponse.json({ error: err.message }, { status: 400 })
  }
  if (err instanceof MutasiBentrokError) {
    return NextResponse.json({ error: err.message }, { status: 409 })
  }
  console.error('Mutasi pendaftar error:', err)
  return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 })
}

// Admin ber-scope jenjang harus berwenang atas jenjang ASAL dan TUJUAN —
// memindahkan siswa ke jenjang lain mengubah data jenjang itu juga.
async function cekJangkauan(session: AdminSession, id: string, jenjangTujuan: string | null | undefined) {
  const pos = await prisma.pendaftaran.findUnique({ where: { id }, select: { jenjang: true } })
  if (!pos) return NextResponse.json({ error: 'Data tidak ditemukan' }, { status: 404 })
  return requireJenjang(session, pos.jenjang) ?? requireJenjang(session, jenjangTujuan)
}

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const gate = await requirePermission('mutasi', 'read')
  if (!gate.ok) return gate.res

  const { id } = await params
  const sp = new URL(req.url).searchParams
  const input = {
    jenjang: sp.get('jenjang'),
    jurusan: sp.get('jurusan'),
    tingkat: sp.get('tingkat'),
    kelas: sp.get('kelas'),
    diskonId: sp.get('diskonId'),
  }
  const tolak = await cekJangkauan(gate.session, id, input.jenjang)
  if (tolak) return tolak

  try {
    const data = await pratinjauMutasi(id, input)
    if (!data) return NextResponse.json({ error: 'Data tidak ditemukan' }, { status: 404 })
    return NextResponse.json({ data })
  } catch (err) {
    return tanggapiGalat(err)
  }
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const gate = await requirePermission('mutasi', 'update')
  if (!gate.ok) return gate.res

  const { id } = await params
  const body = await req.json().catch(() => ({}))
  const tolak = await cekJangkauan(gate.session, id, body.jenjang)
  if (tolak) return tolak

  try {
    const hasil = await jalankanMutasi(
      id,
      { jenjang: body.jenjang, jurusan: body.jurusan, kelas: body.kelas, diskonId: body.diskonId, alasan: body.alasan },
      gate.session,
      req,
    )
    if (!hasil) return NextResponse.json({ error: 'Data tidak ditemukan' }, { status: 404 })
    return NextResponse.json({ success: true, data: hasil })
  } catch (err) {
    return tanggapiGalat(err)
  }
}
