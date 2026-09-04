import { NextResponse } from 'next/server'
import { requirePermission, requireJenjang, scopedJenjang } from '@/lib/adminSession'
import { prisma } from '@/lib/db'
import { resolveTahunAjaran } from '@/lib/tahunAjaran'
import { scopePendaftar, isJenjangValid } from '@/lib/pendaftarQuery'
import { hitungRingkasan } from '@/lib/pembayaran-utils'

// GET ?jenjang=&tahunAjaranId=&filter=
//
// TAGIHAN = berapa yang HARUS dibayar satu pendaftar, hasil Harga dikurangi
// Diskon. Berbeda dari Pembayaran (uang yang benar-benar masuk) dan dari
// Harga/Diskon (yang hanya aturan).
//
// Endpoint sendiri, bukan menumpang /api/admin/pendaftar, karena route itu
// mengirim ~90 kolom per baris sementara halaman ini hanya butuh belasan.
export async function GET(req: Request) {
  const gate = await requirePermission('tagihan', 'read')
  if (!gate.ok) return gate.res
  const { session } = gate

  try {
    const url = new URL(req.url)
    const jenjangParam = (url.searchParams.get('jenjang') || '').toLowerCase()
    const diminta = isJenjangValid(jenjangParam) ? jenjangParam : null

    const tolak = requireJenjang(session, diminta)
    if (tolak) return tolak
    const jenjang = scopedJenjang(session, diminta)

    const tahunAjaran = await resolveTahunAjaran(url.searchParams.get('tahunAjaranId'))
    if (!tahunAjaran) return NextResponse.json({ data: [], ringkasan: null, tahunAjaran: null })

    const rows = await prisma.pendaftaran.findMany({
      where: scopePendaftar({ tahunAjaranId: tahunAjaran.id, jenjang }),
      select: {
        id: true, namaLengkap: true, jenjang: true, jurusan: true, kelas: true,
        hargaPokok: true, gelombang: true, gelombangDiskonNominal: true,
        diskonNama: true, diskonNominal: true,
        totalTagihan: true, totalTagihanLocked: true,
        statusPembayaran: true,
        pembayaranList: { select: { jenis: true, nominal: true, status: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    const data = rows.map(p => {
      const tagihan = p.totalTagihan ?? 0
      const r = hitungRingkasan(p.pembayaranList, tagihan)
      return {
        id: p.id,
        namaLengkap: p.namaLengkap,
        jenjang: p.jenjang,
        pilihan: p.jurusan || p.kelas || null,
        hargaPokok: p.hargaPokok,
        gelombang: p.gelombang,
        gelombangDiskonNominal: p.gelombangDiskonNominal,
        diskonNama: p.diskonNama,
        diskonNominal: p.diskonNominal,
        totalTagihan: p.totalTagihan,
        terkunci: p.totalTagihanLocked,
        totalDibayar: r.totalDibayar,
        sisaBayar: r.sisaBayar,
        kelebihanBayar: r.kelebihanBayar,
        statusPembayaran: p.statusPembayaran,
      }
    })

    const ringkasan = {
      jumlahPendaftar: data.length,
      totalTagihan: data.reduce((n, d) => n + (d.totalTagihan ?? 0), 0),
      totalDibayar: data.reduce((n, d) => n + d.totalDibayar, 0),
      totalSisa: data.reduce((n, d) => n + d.sisaBayar, 0),
      belumTerkunci: data.filter(d => !d.terkunci).length,
      tanpaTagihan: data.filter(d => !d.totalTagihan).length,
    }

    return NextResponse.json({
      data,
      ringkasan,
      tahunAjaran: { id: tahunAjaran.id, nama: tahunAjaran.nama, aktif: tahunAjaran.aktif },
    })
  } catch (err) {
    console.error('Tagihan GET error:', err)
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 })
  }
}
