import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/db'
import {
  recalculatePembayaran,
  lockTagihanJikaBelum,
  previewTagihan,
  hitungRingkasan,
  hitungTotalDisetorkan,
  getMinimalPembayaranAwal,
  getMinimalCicilan,
  formatRupiah,
  HargaTidakDitemukanError,
} from '@/lib/keuangan'

// GET - riwayat cicilan milik user yang login + ringkasan (total tagihan, sudah dibayar, sisa)
export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const pendaftaran = await prisma.pendaftaran.findUnique({
      where: { userId: session.userId },
      include: { pembayaranList: { orderBy: { angsuranKe: 'asc' } } },
    })
    if (!pendaftaran) return NextResponse.json({ data: null })

    // Sebelum totalTagihan dikunci (belum ada pembayaran sama sekali), tampilkan
    // tagihan hasil hitung langsung dari Harga/Gelombang/Diskon aktif — bukan
    // dihitung ulang di frontend — supaya angka yang dilihat user selalu sama
    // dengan yang dipakai server saat pembayaran pertama dikunci nanti.
    const breakdown = await previewTagihan(pendaftaran.id)
    const totalTagihan = breakdown?.totalTagihan ?? 0
    const { totalDibayar, totalRefund, totalAlokasi, sisaBayar, kelebihanBayar } = hitungRingkasan(pendaftaran.pembayaranList, totalTagihan)
    const totalDisetorkan = hitungTotalDisetorkan(pendaftaran.pembayaranList)
    const minimalPembayaranAwal = await getMinimalPembayaranAwal(pendaftaran.tahunAjaranId)
    const minimalCicilan = await getMinimalCicilan(pendaftaran.tahunAjaranId)

    return NextResponse.json({
      data: {
        riwayat: pendaftaran.pembayaranList,
        totalTagihan,
        totalDibayar,
        totalRefund,
        totalAlokasi,
        sisaBayar,
        lebihBayar: kelebihanBayar,
        totalDisetorkan,
        statusPembayaran: pendaftaran.statusPembayaran,
        minCicilan: minimalCicilan,
        minimalPembayaranAwal,
        breakdown,
      },
    })
  } catch (err) {
    console.error('Pembayaran GET error:', err)
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 })
  }
}

// POST - user mengirim SATU CICILAN pembayaran (metode + nominal + bukti).
// totalTagihan/gelombang TIDAK PERNAH dipercaya dari body kiriman client —
// dihitung & dikunci server-side lewat lockTagihanJikaBelum (lib/keuangan.ts).
export async function POST(req: Request) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await req.json()
    const { metodePembayaran, buktiPembayaran, nominal, bankPengirim, namaPengirim } = body

    if (!metodePembayaran || !['offline', 'online'].includes(metodePembayaran)) {
      return NextResponse.json({ error: 'Metode pembayaran tidak valid' }, { status: 400 })
    }
    if (!buktiPembayaran) {
      return NextResponse.json({ error: 'Bukti pembayaran wajib diupload' }, { status: 400 })
    }
    const nominalNum = Math.round(Number(nominal) || 0)
    if (!nominalNum || nominalNum <= 0) {
      return NextResponse.json({ error: 'Nominal pembayaran wajib diisi' }, { status: 400 })
    }

    const pendaftaranAwal = await prisma.pendaftaran.findUnique({ where: { userId: session.userId } })
    if (!pendaftaranAwal) {
      return NextResponse.json({ error: 'Silakan lengkapi formulir pendaftaran terlebih dahulu' }, { status: 404 })
    }

    await lockTagihanJikaBelum(pendaftaranAwal.id)
    const existing = await prisma.pendaftaran.findUnique({
      where: { id: pendaftaranAwal.id },
      include: { pembayaranList: true },
    })
    if (!existing) return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 })

    const totalTagihan = existing.totalTagihan || 0
    const { totalDibayar } = hitungRingkasan(existing.pembayaranList, totalTagihan)
    const sisaBayar = Math.max(totalTagihan - totalDibayar, 0)

    if (totalTagihan > 0 && sisaBayar <= 0) {
      return NextResponse.json({ error: 'Pembayaran Anda sudah lunas' }, { status: 400 })
    }

    // Pembayaran pertama = "uang pendaftaran", minimalnya minimalPembayaranAwal
    // (default Rp200.000). Cicilan berikutnya pakai minimalCicilan (default
    // Rp100.000), kecuali sisa tagihan memang lebih kecil (cicilan penutup).
    const angsuranKe = existing.pembayaranList.length + 1
    const minimalAwal = await getMinimalPembayaranAwal(existing.tahunAjaranId)
    const minimalCicilan = await getMinimalCicilan(existing.tahunAjaranId)
    const minRequiredBase = angsuranKe === 1 ? minimalAwal : minimalCicilan
    const minRequired = sisaBayar > 0 && sisaBayar < minRequiredBase ? sisaBayar : minRequiredBase
    if (nominalNum < minRequired) {
      return NextResponse.json({ error: `Minimal pembayaran ${formatRupiah(minRequired)}` }, { status: 400 })
    }

    await prisma.pembayaran.create({
      data: {
        pendaftaranId: existing.id,
        angsuranKe,
        nominal: nominalNum,
        metodePembayaran,
        buktiPembayaran,
        bankPengirim: metodePembayaran === 'online' ? (bankPengirim || null) : null,
        namaPengirim: metodePembayaran === 'online' ? (namaPengirim || null) : null,
        status: 'menunggu_verifikasi',
      },
    })

    const updated = await recalculatePembayaran(existing.id)

    return NextResponse.json({ success: true, data: updated })
  } catch (err) {
    if (err instanceof HargaTidakDitemukanError) {
      return NextResponse.json({ error: err.message }, { status: 400 })
    }
    console.error('Pembayaran error:', err)
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 })
  }
}
