import { NextResponse } from 'next/server'
import { requirePermission, requireJenjang, scopedJenjang } from '@/lib/adminSession'
import { prisma } from '@/lib/db'
import { resolveTahunAjaran } from '@/lib/tahunAjaran'
import { scopePendaftar, hitungStats, STATS_KOSONG, isJenjangValid } from '@/lib/pendaftarQuery'

// GET ?tahunAjaranId=&jenjang=&status= - daftar pendaftar milik SATU tahun
// ajaran (default: tahun ajaran aktif), opsional disaring per jenjang dan
// status. Inilah yang membuat Dashboard/Data Pendaftar/Laporan otomatis
// menampilkan tahun ajaran yang sedang berjalan tanpa tercampur tahun lain —
// lihat lib/tahunAjaran.ts.
//
// `jenjang` SENGAJA opsional: halaman Pilih Jenjang butuh ketiga jenjang
// sekaligus. Tapi kalau dikirim, penyaringan terjadi di DATABASE — dulu
// seluruh pendaftar 3 jenjang (~90 kolom per baris) dikirim ke browser lalu
// disaring di sana, sehingga scopeJenjang mustahil ditegakkan.
export async function GET(req: Request) {
  const gate = await requirePermission('pendaftar', 'read')
  if (!gate.ok) return gate.res
  const { session } = gate

  const url = new URL(req.url)
  const jenjangParam = (url.searchParams.get('jenjang') || '').toLowerCase()
  const diminta = isJenjangValid(jenjangParam) ? jenjangParam : null

  const tolak = requireJenjang(session, diminta)
  if (tolak) return tolak
  // Admin dengan scope jenjang selalu dipaksa ke jenjangnya sendiri, apa pun
  // yang dikirim di query string.
  const jenjang = scopedJenjang(session, diminta)

  const statusParam = url.searchParams.get('status')

  const tahunAjaran = await resolveTahunAjaran(url.searchParams.get('tahunAjaranId'))
  if (!tahunAjaran) {
    return NextResponse.json({ data: [], stats: STATS_KOSONG, tahunAjaran: null })
  }

  const data = await prisma.pendaftaran.findMany({
    where: scopePendaftar({ tahunAjaranId: tahunAjaran.id, jenjang, status: statusParam }),
    include: { user: { select: { email: true } }, pembayaranList: true },
    orderBy: { createdAt: 'desc' },
  })

  const enriched = data.map(p => ({ ...p, userEmail: p.user?.email ?? null }))
  return NextResponse.json({
    data: enriched,
    stats: hitungStats(data),
    tahunAjaran: { id: tahunAjaran.id, nama: tahunAjaran.nama, aktif: tahunAjaran.aktif },
  })
}
