import { NextResponse } from 'next/server'
import { requirePermission, requireJenjang } from '@/lib/adminSession'
import { getLaporanKeuangan, type JenjangLaporan } from '@/lib/laporanKeuangan'
import { isJenjangValid } from '@/lib/pendaftarQuery'

// GET ?jenjang=&tahunAjaranId= — laporan keuangan SATU jenjang, SATU tahun
// ajaran. Tidak ada mode "semua jenjang": menggabungkannya justru menyembunyikan
// jenjang mana yang tunggakannya menumpuk.
export async function GET(req: Request) {
  const gate = await requirePermission('laporan_keuangan', 'read')
  if (!gate.ok) return gate.res

  const url = new URL(req.url)
  const jenjang = (url.searchParams.get('jenjang') || '').toLowerCase()
  if (!isJenjangValid(jenjang)) {
    return NextResponse.json({ error: 'jenjang wajib diisi (smp/sma/smk)' }, { status: 400 })
  }
  const tolak = requireJenjang(gate.session, jenjang)
  if (tolak) return tolak

  try {
    const data = await getLaporanKeuangan(jenjang as JenjangLaporan, url.searchParams.get('tahunAjaranId'))
    return NextResponse.json({ data })
  } catch (err) {
    console.error('Laporan keuangan GET error:', err)
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 })
  }
}
