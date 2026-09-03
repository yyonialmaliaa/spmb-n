// Tahun Ajaran adalah SUMBER UTAMA/FILTER UTAMA seluruh sistem SPMB — setiap
// query yang menyentuh data ber-tahun-ajaran (Harga, Diskon, Gelombang,
// DokumenPersyaratan, Pendaftaran) harus lewat sini, bukan menulis ulang
// `prisma.tahunAjaran.findFirst({ where: { aktif: true } })` di setiap route.
//
// Perilaku: kalau `tahunAjaranId` diberikan (mis. admin sedang membuka
// "Lihat Data" tahun ajaran lama), pakai itu. Kalau tidak diberikan/tidak
// ditemukan, otomatis jatuh ke tahun ajaran yang sedang AKTIF — ini yang
// membuat halaman sehari-hari (Dashboard, Data Pendaftar, Harga, dst) selalu
// menampilkan data tahun ajaran aktif tanpa admin perlu memilih manual.
import { prisma } from './db'

export async function resolveTahunAjaran(tahunAjaranId?: string | null) {
  if (tahunAjaranId) {
    const found = await prisma.tahunAjaran.findUnique({ where: { id: tahunAjaranId } })
    if (found) return found
  }
  return prisma.tahunAjaran.findFirst({ where: { aktif: true } })
}
