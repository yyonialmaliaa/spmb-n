import { NextResponse } from 'next/server'
import { requirePermission, requireJenjang } from '@/lib/adminSession'
import { getLaporanKeuangan, type JenjangLaporan } from '@/lib/laporanKeuangan'
import { buatWorkbookLaporanKeuangan } from '@/lib/laporanKeuanganExcel'
import { isJenjangValid } from '@/lib/pendaftarQuery'

const JENJANG_UPPER: Record<string, string> = { smp: 'SMP', sma: 'SMA', smk: 'SMK' }

// GET ?jenjang=&tahunAjaranId= — unduh Laporan_Keuangan_{JENJANG}_TA_{tahun}.xlsx
//
// Memakai getLaporanKeuangan() yang SAMA dengan tampilan layar, sehingga
// angka di Excel tidak pernah berbeda dari yang dilihat admin.
export async function GET(req: Request) {
  const gate = await requirePermission('laporan_keuangan', 'export')
  if (!gate.ok) return gate.res

  const url = new URL(req.url)
  const jenjang = (url.searchParams.get('jenjang') || '').toLowerCase()
  if (!isJenjangValid(jenjang)) {
    return NextResponse.json({ error: 'Jenjang wajib diisi (smp/sma/smk)' }, { status: 400 })
  }
  const tolak = requireJenjang(gate.session, jenjang)
  if (tolak) return tolak

  const data = await getLaporanKeuangan(jenjang as JenjangLaporan, url.searchParams.get('tahunAjaranId'))
  if (!data) {
    return NextResponse.json({ error: 'Belum ada tahun ajaran aktif — export tidak dapat dilakukan' }, { status: 400 })
  }

  const buffer = await buatWorkbookLaporanKeuangan(data)
  const namaTahun = data.tahunAjaran.nama.replace(/\//g, '-')
  const namaFile = `Laporan_Keuangan_${JENJANG_UPPER[jenjang]}_TA_${namaTahun}.xlsx`

  return new NextResponse(buffer, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${namaFile}"`,
    },
  })
}
