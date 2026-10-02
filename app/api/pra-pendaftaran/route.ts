import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { resolveTahunAjaran } from '@/lib/tahunAjaran'
import { notifPraPendaftaranBaru } from '@/lib/notifikasiAdmin'
import { STATUS_PRA_AKTIF, tanggalWib, validasiPraPendaftaran } from '@/lib/praPendaftaran'
import {
  buatNomorPra,
  buatTokenAkses,
  hashIp,
  hitungBatasKedatangan,
  ipKlien,
  lolosBatasLaju,
  tandaiKedaluwarsa,
} from '@/lib/praPendaftaranServer'

const UKURAN_MAKS = 8 * 1024
const KIRIMAN_PER_JAM_PER_JARINGAN = 20

function tolak(error: string, status: number, galat?: Record<string, string>) {
  return NextResponse.json(galat ? { error, galat } : { error }, { status })
}

// POST — pra-pendaftaran tanpa akun. Hanya enam isian yang dibaca; nomor, status, dan tanggal ditentukan server.
export async function POST(req: Request) {
  if (!(req.headers.get('content-type') || '').toLowerCase().includes('application/json')) {
    return tolak('Permintaan tidak valid.', 415)
  }

  const ip = ipKlien(req)
  if (!lolosBatasLaju(`pra:${ip}`, 6, 60_000)) {
    return tolak('Terlalu banyak percobaan. Tunggu sekitar satu menit, lalu coba lagi.', 429)
  }

  let body: Record<string, unknown>
  try {
    const mentah = await req.text()
    if (mentah.length > UKURAN_MAKS) return tolak('Isian terlalu panjang.', 413)
    const json: unknown = JSON.parse(mentah)
    if (!json || typeof json !== 'object' || Array.isArray(json)) throw new Error('bukan objek')
    body = json as Record<string, unknown>
  } catch {
    return tolak('Permintaan tidak valid.', 400)
  }

  // Kolom jebakan yang tersembunyi dari manusia; hanya bot pengisi formulir yang mengisinya.
  if (typeof body.situs === 'string' && body.situs.trim() !== '') return tolak('Permintaan tidak valid.', 400)

  const hasil = validasiPraPendaftaran(body)
  if (!hasil.ok) return tolak('Periksa kembali isian yang ditandai.', 400, hasil.galat)
  const data = hasil.data

  try {
    const tahunAjaran = await resolveTahunAjaran()
    if (!tahunAjaran) return tolak('Pra-pendaftaran belum dibuka. Silakan hubungi petugas SPMB.', 503)

    const ipHash = hashIp(ip)
    const jumlahSejam = await prisma.praPendaftaran.count({
      where: { ipHash, createdAt: { gte: new Date(Date.now() - 60 * 60 * 1000) } },
    })
    if (jumlahSejam >= KIRIMAN_PER_JAM_PER_JARINGAN) {
      return tolak('Terlalu banyak pra-pendaftaran dari jaringan ini dalam satu jam terakhir. Coba lagi nanti atau hubungi petugas SPMB.', 429)
    }

    await tandaiKedaluwarsa({ tahunAjaranId: tahunAjaran.id, noHp: data.noHp })
    const kembar = await prisma.praPendaftaran.findFirst({
      where: {
        tahunAjaranId: tahunAjaran.id,
        jenjang: data.jenjang,
        noHp: data.noHp,
        namaLengkap: { equals: data.namaLengkap, mode: 'insensitive' },
        status: { in: STATUS_PRA_AKTIF },
      },
      select: { batasKedatangan: true },
    })
    if (kembar) {
      return tolak(
        `Pra-pendaftaran atas nama ini dengan nomor HP yang sama masih berlaku sampai ${tanggalWib(kembar.batasKedatangan)}. Gunakan bukti yang sudah diunduh, atau hubungi petugas SPMB bila bukti hilang.`,
        409,
      )
    }

    const sekarang = new Date()
    const pra = await prisma.$transaction(async tx => {
      const noPraPendaftaran = await buatNomorPra(
        { tahunAjaranId: tahunAjaran.id, tahunAjaranNama: tahunAjaran.nama, jenjang: data.jenjang },
        tx,
      )
      return tx.praPendaftaran.create({
        data: {
          ...data,
          noPraPendaftaran,
          tokenAkses: buatTokenAkses(),
          tahunAjaranId: tahunAjaran.id,
          status: 'menunggu',
          batasKedatangan: hitungBatasKedatangan(sekarang),
          ipHash,
          createdAt: sekarang,
        },
        select: { id: true, noPraPendaftaran: true, tokenAkses: true, namaLengkap: true, jenjang: true, tahunAjaranId: true, createdAt: true },
      })
    })

    await notifPraPendaftaranBaru(pra)

    return NextResponse.json({ success: true, token: pra.tokenAkses, nomor: pra.noPraPendaftaran }, { status: 201 })
  } catch (err) {
    console.error('Pra-pendaftaran POST error:', err)
    return tolak('Terjadi kendala di server. Silakan coba lagi beberapa saat lagi.', 500)
  }
}
