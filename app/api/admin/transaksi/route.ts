import { NextResponse } from 'next/server'
import type { Prisma } from '@prisma/client'
import { requirePermission, requireJenjang, scopedJenjang } from '@/lib/adminSession'
import { prisma } from '@/lib/db'
import { resolveTahunAjaran } from '@/lib/tahunAjaran'
import { scopePendaftar, isJenjangValid } from '@/lib/pendaftarQuery'

// GET ?jenjang=&tahunAjaranId=&jenis=&status=
//
// TRANSAKSI = buku besar seluruh pergerakan uang: pembayaran masuk (bayar),
// pengembalian kelebihan (refund), dan pemindahan ke pos lain (alokasi).
// Berbeda dari halaman Pembayaran yang hanya antrean verifikasi.
export async function GET(req: Request) {
  const gate = await requirePermission('transaksi', 'read')
  if (!gate.ok) return gate.res
  const { session } = gate

  try {
    const url = new URL(req.url)
    const p = url.searchParams
    const jenjangParam = (p.get('jenjang') || '').toLowerCase()
    const diminta = isJenjangValid(jenjangParam) ? jenjangParam : null

    const tolak = requireJenjang(session, diminta)
    if (tolak) return tolak
    const jenjang = scopedJenjang(session, diminta)

    const tahunAjaran = await resolveTahunAjaran(p.get('tahunAjaranId'))
    if (!tahunAjaran) return NextResponse.json({ data: [], ringkasan: null, tahunAjaran: null })

    const jenis = p.get('jenis')
    const status = p.get('status')

    const where: Prisma.PembayaranWhereInput = {
      // Transaksi selalu mengikuti pendaftar yang sah pada tahun ajaran &
      // jenjang yang sedang dibuka — memakai aturan scope yang sama dengan
      // seluruh sistem, bukan filter sendiri.
      pendaftaran: scopePendaftar({ tahunAjaranId: tahunAjaran.id, jenjang }),
      ...(jenis ? { jenis } : {}),
      ...(status ? { status } : {}),
    }

    const rows = await prisma.pembayaran.findMany({
      where,
      include: {
        pendaftaran: { select: { id: true, namaLengkap: true, jenjang: true } },
      },
      orderBy: { tanggalBayar: 'desc' },
      take: 500,
    })

    const data = rows.map(t => ({
      id: t.id,
      pendaftaranId: t.pendaftaranId,
      nama: t.pendaftaran.namaLengkap,
      jenjang: t.pendaftaran.jenjang,
      jenis: t.jenis,
      angsuranKe: t.angsuranKe,
      nominal: t.nominal,
      metodePembayaran: t.metodePembayaran,
      bankPengirim: t.bankPengirim,
      namaPengirim: t.namaPengirim,
      kategoriAlokasi: t.kategoriAlokasi,
      alasanRefund: t.alasanRefund,
      status: t.status,
      buktiPembayaran: t.buktiPembayaran,
      catatanAdmin: t.catatanAdmin,
      tanggalBayar: t.tanggalBayar,
      tanggalVerifikasi: t.tanggalVerifikasi,
    }))

    // Hanya transaksi berstatus lunas yang dihitung sebagai uang nyata;
    // yang masih menunggu verifikasi belum boleh masuk total.
    const sah = data.filter(d => d.status === 'lunas')
    const jumlahkan = (j: string) => sah.filter(d => d.jenis === j).reduce((n, d) => n + d.nominal, 0)

    return NextResponse.json({
      data,
      ringkasan: {
        jumlahTransaksi: data.length,
        totalBayar: jumlahkan('bayar'),
        totalRefund: jumlahkan('refund'),
        totalAlokasi: jumlahkan('alokasi'),
        menungguVerifikasi: data.filter(d => d.status === 'menunggu_verifikasi').length,
      },
      tahunAjaran: { id: tahunAjaran.id, nama: tahunAjaran.nama, aktif: tahunAjaran.aktif },
    })
  } catch (err) {
    console.error('Transaksi GET error:', err)
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 })
  }
}
