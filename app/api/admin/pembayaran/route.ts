import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { recalculatePembayaran, hitungRingkasan, lockTagihanJikaBelum, formatRupiah, HargaTidakDitemukanError } from '@/lib/keuangan'
import { kirimNotifikasi } from '@/lib/notifikasi'

// GET - admin lihat riwayat cicilan milik satu pendaftar (?pendaftaranId=xxx)
export async function GET(req: Request) {
  const session = await getSession()
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const pendaftaranId = searchParams.get('pendaftaranId')
  if (!pendaftaranId) {
    return NextResponse.json({ error: 'pendaftaranId wajib diisi' }, { status: 400 })
  }

  try {
    const riwayat = await prisma.pembayaran.findMany({
      where: { pendaftaranId },
      orderBy: { angsuranKe: 'asc' },
    })
    return NextResponse.json({ data: riwayat })
  } catch (err) {
    console.error('Admin pembayaran GET error:', err)
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 })
  }
}

// POST - admin input pembayaran, pengembalian dana (refund), ATAU alokasi
// kelebihan bayar ke pembayaran sekolah lain (mis. SPP) atas nama pendaftar.
// jenis: "bayar" (default, bantu bayar offline di sekolah) | "refund"
// (kembalikan kelebihan bayar) | "alokasi" (kelebihan bayar dialihkan, uang
// TETAP di sekolah — bukan transaksi bayar sungguhan, tidak perlu metode/bukti).
// Langsung berstatus "lunas" karena diinput/diverifikasi langsung oleh admin.
export async function POST(req: Request) {
  const session = await getSession()
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const { pendaftaranId, nominal, metodePembayaran, buktiPembayaran, catatanAdmin, jenis, alasanRefund, kategoriAlokasi } = body
    const jenisFinal = jenis === 'refund' ? 'refund' : jenis === 'alokasi' ? 'alokasi' : 'bayar'

    if (!pendaftaranId) return NextResponse.json({ error: 'pendaftaranId wajib diisi' }, { status: 400 })
    const nominalNum = Math.round(Number(nominal) || 0)
    if (!nominalNum || nominalNum <= 0) {
      return NextResponse.json({ error: 'Nominal wajib diisi' }, { status: 400 })
    }

    // Alokasi bukan transaksi bayar sungguhan (uangnya sudah ada di sekolah
    // dari kelebihan bayar sebelumnya, cuma dipindah peruntukannya) — jadi
    // tidak perlu Metode/Bukti seperti "bayar"/"refund".
    if (jenisFinal !== 'alokasi') {
      if (!metodePembayaran || !['offline', 'online'].includes(metodePembayaran)) {
        return NextResponse.json({ error: 'Metode pembayaran tidak valid' }, { status: 400 })
      }
      // Bukti wajib untuk refund (kapan pun) dan untuk pembayaran via transfer
      // online — tapi untuk pembayaran tunai offline di sekolah, admin sendiri
      // yang menerima uangnya langsung, jadi bukti fisik boleh menyusul/opsional.
      const buktiWajib = jenisFinal === 'refund' || metodePembayaran !== 'offline'
      if (buktiWajib && !buktiPembayaran) {
        return NextResponse.json({ error: `Bukti ${jenisFinal === 'refund' ? 'pengembalian dana' : 'pembayaran'} wajib diupload` }, { status: 400 })
      }
    }
    if (jenisFinal === 'refund' && !alasanRefund) {
      return NextResponse.json({ error: 'Alasan pengembalian dana wajib diisi' }, { status: 400 })
    }
    if (jenisFinal === 'alokasi' && !kategoriAlokasi) {
      return NextResponse.json({ error: 'Jenis pembayaran (kategori alokasi) wajib dipilih' }, { status: 400 })
    }

    const pendaftarAwal = await prisma.pendaftaran.findUnique({ where: { id: pendaftaranId } })
    if (!pendaftarAwal) return NextResponse.json({ error: 'Pendaftar tidak ditemukan' }, { status: 404 })

    // Kunci totalTagihan kalau ini pembayaran PERTAMA lewat admin (mis. siswa
    // offline yang tidak pernah membuka dashboard sendiri) — tanpa ini,
    // totalTagihan bisa tetap 0/null selamanya untuk siswa yang seluruh
    // pembayarannya dibantu-input admin.
    if (jenisFinal === 'bayar') {
      await lockTagihanJikaBelum(pendaftaranId)
    }

    const existing = await prisma.pendaftaran.findUnique({
      where: { id: pendaftaranId },
      include: { pembayaranList: true },
    })
    if (!existing) return NextResponse.json({ error: 'Pendaftar tidak ditemukan' }, { status: 404 })

    // Refund & alokasi sama-sama "memakai" kelebihan bayar yang tersedia —
    // kelebihan tersedia otomatis sudah dikurangi refund/alokasi sebelumnya
    // (lihat hitungRingkasan), jadi keduanya boleh berulang kali dilakukan
    // selama masih ada sisa kelebihan bayar.
    if (jenisFinal === 'refund' || jenisFinal === 'alokasi') {
      const { kelebihanBayar } = hitungRingkasan(existing.pembayaranList, existing.totalTagihan || 0)
      if (nominalNum > kelebihanBayar) {
        const labelAksi = jenisFinal === 'refund' ? 'refund' : 'alokasi'
        return NextResponse.json({ error: `Nominal ${labelAksi} tidak boleh melebihi kelebihan bayar (${kelebihanBayar.toLocaleString('id-ID')})` }, { status: 400 })
      }
    }

    const angsuranKe = existing.pembayaranList.filter(p => p.jenis === jenisFinal).length + 1
    await prisma.pembayaran.create({
      data: {
        pendaftaranId,
        jenis: jenisFinal,
        angsuranKe,
        nominal: nominalNum,
        metodePembayaran: jenisFinal === 'alokasi' ? 'internal' : metodePembayaran,
        buktiPembayaran: buktiPembayaran || null,
        alasanRefund: jenisFinal === 'refund' ? alasanRefund : null,
        kategoriAlokasi: jenisFinal === 'alokasi' ? kategoriAlokasi : null,
        catatanAdmin: catatanAdmin || (jenisFinal === 'refund' ? 'Pengembalian dana oleh admin' : jenisFinal === 'alokasi' ? 'Dialokasikan oleh admin' : 'Diinput langsung oleh admin'),
        status: 'lunas',
        tanggalVerifikasi: new Date(),
      },
    })

    const updated = await recalculatePembayaran(pendaftaranId)

    // Notifikasi ke pendaftar untuk setiap transaksi yang admin catatkan.
    if (jenisFinal === 'bayar') {
      await kirimNotifikasi(pendaftaranId, `Admin mencatat pembayaran sebesar ${formatRupiah(nominalNum)} untuk Anda.`)
    } else if (jenisFinal === 'refund') {
      await kirimNotifikasi(pendaftaranId, `Dana sebesar ${formatRupiah(nominalNum)} telah dikembalikan kepada Anda (${alasanRefund}).`)
    } else {
      await kirimNotifikasi(pendaftaranId, `Kelebihan bayar sebesar ${formatRupiah(nominalNum)} telah dialokasikan untuk ${kategoriAlokasi}.`)
    }

    return NextResponse.json({ success: true, data: updated })
  } catch (err) {
    if (err instanceof HargaTidakDitemukanError) {
      return NextResponse.json({ error: err.message }, { status: 400 })
    }
    console.error('Admin pembayaran POST error:', err)
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 })
  }
}
