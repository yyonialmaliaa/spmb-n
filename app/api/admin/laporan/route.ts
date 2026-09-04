import { NextResponse } from 'next/server'
import { requirePermission } from '@/lib/adminSession'
import { getLaporanData, type JenjangLaporan } from '@/lib/laporanSpmb'

const JENJANG_VALID = ['smp', 'sma', 'smk']

// GET ?jenjang=smp|sma|smk&tahunAjaranId= - laporan analitik SPMB, SELALU
// untuk SATU jenjang (wajib diisi, tidak ada mode "semua jenjang" —
// mencegah data tergabung) dan SATU tahun ajaran (default: yang aktif).
// Query database sendiri sudah di-scope ke jenjang tsb (lihat
// lib/laporanSpmb.ts) — bukan cuma difilter di frontend — dan hanya
// mengambil kolom agregat, tidak pernah nama/NIK/kontak pendaftar.
export async function GET(req: Request) {
  const gate = await requirePermission('laporan_pendaftaran', 'read')
  if (!gate.ok) return gate.res

  const url = new URL(req.url)
  const jenjang = (url.searchParams.get('jenjang') || '').toLowerCase()
  if (!JENJANG_VALID.includes(jenjang)) {
    return NextResponse.json({ error: 'Jenjang wajib diisi (smp/sma/smk)' }, { status: 400 })
  }

  const data = await getLaporanData(jenjang as JenjangLaporan, url.searchParams.get('tahunAjaranId'))
  if (!data) {
    return NextResponse.json({ data: null, error: 'Belum ada tahun ajaran aktif' })
  }
  return NextResponse.json({ data })
}
