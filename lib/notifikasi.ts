import { prisma } from './db'

// Satu-satunya cara membuat notifikasi untuk pendaftar — dipanggil dari
// route admin setiap kali ada tindakan yang berdampak ke pendaftar ybs.
// Sengaja "fire and forget" secara aman: gagal kirim notifikasi TIDAK BOLEH
// menggagalkan aksi admin yang sedang berjalan (mis. verifikasi pembayaran),
// jadi errornya cuma dicatat di log server.
export async function kirimNotifikasi(pendaftaranId: string, pesan: string) {
  try {
    await prisma.notifikasi.create({ data: { pendaftaranId, pesan } })
  } catch (err) {
    console.error('Gagal membuat notifikasi:', err)
  }
}
