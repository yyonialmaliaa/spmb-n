import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getLaporanData, type JenjangLaporan } from '@/lib/laporanSpmb'
import { buatWorkbookLaporan } from '@/lib/laporanExcel'

const JENJANG_VALID = ['smp', 'sma', 'smk']
const JENJANG_UPPER: Record<string, string> = { smp: 'SMP', sma: 'SMA', smk: 'SMK' }

// GET ?jenjang=smp|sma|smk&tahunAjaranId= - unduh SATU file Excel khusus
// jenjang tsb (Laporan_SPMB_{JENJANG}_TA_{tahun}.xlsx). Data yang dipakai
// PERSIS sama dengan yang dihitung untuk tampilan di layar (lib/laporanSpmb)
// supaya angka di Excel tidak pernah berbeda dari yang dilihat admin.
export async function GET(req: Request) {
  const session = await getSession()
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const url = new URL(req.url)
  const jenjang = (url.searchParams.get('jenjang') || '').toLowerCase()
  if (!JENJANG_VALID.includes(jenjang)) {
    return NextResponse.json({ error: 'Jenjang wajib diisi (smp/sma/smk)' }, { status: 400 })
  }

  const data = await getLaporanData(jenjang as JenjangLaporan, url.searchParams.get('tahunAjaranId'))
  if (!data) {
    return NextResponse.json({ error: 'Belum ada tahun ajaran aktif — export tidak dapat dilakukan' }, { status: 400 })
  }

  const buffer = await buatWorkbookLaporan(data)
  const namaTahun = data.tahunAjaran.nama.replace(/\//g, '-')
  const namaFile = `Laporan_SPMB_${JENJANG_UPPER[jenjang]}_TA_${namaTahun}.xlsx`

  return new NextResponse(buffer, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${namaFile}"`,
    },
  })
}
