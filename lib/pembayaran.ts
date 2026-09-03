import { prisma } from './db'
import { hitungRingkasan } from './pembayaran-utils'

export { MIN_CICILAN, hitungRingkasan } from './pembayaran-utils'

// Hitung ulang statusPembayaran pada Pendaftaran berdasarkan seluruh riwayat
// cicilan (Pembayaran). Dipanggil setiap kali ada cicilan/refund baru masuk
// atau admin memverifikasi/menolak salah satunya.
export async function recalculatePembayaran(pendaftaranId: string) {
  const pendaftaran = await prisma.pendaftaran.findUnique({
    where: { id: pendaftaranId },
    include: { pembayaranList: true },
  })
  if (!pendaftaran) return null

  const totalTagihan = pendaftaran.totalTagihan || 0
  const { totalDibayar } = hitungRingkasan(pendaftaran.pembayaranList, totalTagihan)
  const adaMenunggu = pendaftaran.pembayaranList.some(p => p.status === 'menunggu_verifikasi')

  let statusPembayaran: string
  if (totalTagihan > 0 && totalDibayar >= totalTagihan) {
    statusPembayaran = 'lunas'
  } else if (adaMenunggu) {
    statusPembayaran = 'menunggu_verifikasi'
  } else if (totalDibayar > 0) {
    statusPembayaran = 'cicilan_berjalan'
  } else {
    statusPembayaran = 'belum_bayar'
  }

  return prisma.pendaftaran.update({
    where: { id: pendaftaranId },
    data: { statusPembayaran },
  })
}
