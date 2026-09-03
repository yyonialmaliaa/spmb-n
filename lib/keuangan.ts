// =====================================================================
// Mesin keuangan SPMB — SATU-SATUNYA tempat totalTagihan dihitung/dikunci.
// Server-authoritative: halaman user & admin sama-sama memanggil fungsi di
// sini (langsung atau lewat API) supaya angka yang ditampilkan ke user dan
// ke admin selalu identik. Jangan hitung ulang totalTagihan secara manual
// di halaman/route lain — import dari sini.
//
// Catatan migrasi bertahap: lib/biaya.ts (harga hardcode) masih dipakai
// oleh halaman yang belum masuk revisi (marketing pages, form offline,
// daftar admin) sampai fase panel Harga selesai — lihat rencana di
// C:\Users\alfii\.claude\plans\tidy-churning-nest.md. lib/pembayaran.ts &
// lib/pembayaran-utils.ts tetap dipakai apa adanya oleh halaman yang belum
// dimigrasi; fungsi hitungRingkasan/MIN_CICILAN di-reuse (bukan diduplikasi)
// dari sana.
// =====================================================================

import { prisma } from './db'
import { hitungRingkasan, MIN_CICILAN, DEFAULT_MIN_PEMBAYARAN_AWAL, LABEL_JENIS_TRANSAKSI, formatRupiah, hitungTotalDisetorkan } from './pembayaran-utils'

// Re-export murni dari pembayaran-utils supaya route API cukup import satu
// modul (lib/keuangan.ts). Komponen client HARUS import langsung dari
// lib/pembayaran-utils (bukan dari sini) — file ini import prisma, jadi
// tidak boleh dibundel ke kode browser.
export { hitungRingkasan, MIN_CICILAN, DEFAULT_MIN_PEMBAYARAN_AWAL, LABEL_JENIS_TRANSAKSI, formatRupiah, hitungTotalDisetorkan }

// Dilempar kalau tidak ada baris Harga aktif yang cocok untuk jenjang/
// jurusan/kelas pendaftar. Sistem TIDAK BOLEH diam-diam memakai Rp0 atau
// nominal sembarangan — pemanggil harus menangkap ini dan menampilkan
// pesan yang jelas ke admin/user (lihat pemakaian di route API).
export class HargaTidakDitemukanError extends Error {
  constructor(label: string) {
    super(`Harga untuk ${label} belum diatur di Panel Harga. Hubungi admin untuk mengatur harga terlebih dahulu.`)
    this.name = 'HargaTidakDitemukanError'
  }
}

function labelPilihan(jenjang: string, jurusan: string, kelas: string): string {
  const j = jenjang.toUpperCase()
  return jenjang === 'smk' ? `${j} - ${jurusan} (${kelas})` : `${j} (${kelas})`
}

export async function getMinimalPembayaranAwal(tahunAjaranId: string): Promise<number> {
  const pengaturan = await prisma.pengaturanKeuangan.findUnique({ where: { tahunAjaranId } })
  return pengaturan?.minimalPembayaranAwal ?? DEFAULT_MIN_PEMBAYARAN_AWAL
}

export async function getMinimalCicilan(tahunAjaranId: string): Promise<number> {
  const pengaturan = await prisma.pengaturanKeuangan.findUnique({ where: { tahunAjaranId } })
  return pengaturan?.minimalCicilan ?? MIN_CICILAN
}

async function getHargaAktif(params: { tahunAjaranId: string; jenjang: string; jurusan: string; kelas: string }) {
  return prisma.harga.findFirst({
    where: {
      tahunAjaranId: params.tahunAjaranId,
      jenjang: params.jenjang,
      jurusan: params.jurusan,
      kelas: params.kelas,
      aktif: true,
    },
  })
}

async function getGelombangAktif(params: { tahunAjaranId: string; jenjang: string; untukAlumni: boolean }) {
  return prisma.gelombang.findFirst({
    where: {
      tahunAjaranId: params.tahunAjaranId,
      jenjang: params.jenjang,
      untukAlumni: params.untukAlumni,
      aktif: true,
    },
  })
}

type TagihanBreakdown = {
  hargaPokok: number
  hargaTersedia: boolean // false = belum ada Harga aktif yang cocok, hargaPokok sengaja 0 — JANGAN dianggap tagihan sungguhan
  gelombangDiskonNominal: number
  gelombangNama: string | null
  diskonNominal: number
  diskonNama: string | null
  totalTagihan: number
  locked: boolean
}

// Hitung diskon gelombang + diskon tambahan + total dari harga pokok yang
// SUDAH ditentukan, terhadap satu gelombang & satu diskon yang SUDAH
// ditentukan pula (tidak melakukan lookup "yang aktif sekarang" — dipakai
// baik untuk kunci pertama kali maupun hitung ulang, beda hanya di mana
// gelombang/diskon-nya berasal, lihat pemanggilnya).
async function hitungDariGelombangDanDiskon(params: {
  hargaPokok: number
  gelombang: { nama: string; diskonPersen: number } | null
  diskonId: string | null
}): Promise<Pick<TagihanBreakdown, 'gelombangDiskonNominal' | 'gelombangNama' | 'diskonNominal' | 'diskonNama' | 'totalTagihan'>> {
  const { hargaPokok, gelombang, diskonId } = params
  const gelombangDiskonNominal = Math.round(hargaPokok * ((gelombang?.diskonPersen ?? 0) / 100))

  let diskonNominal = 0
  let diskonNama: string | null = null
  if (diskonId) {
    const diskon = await prisma.diskon.findUnique({ where: { id: diskonId } })
    if (diskon && diskon.aktif) {
      diskonNominal = diskon.tipeNominal === 'persen' ? Math.round(hargaPokok * (diskon.nominal / 100)) : diskon.nominal
      diskonNama = diskon.jenis
    }
  }

  const totalTagihan = Math.max(hargaPokok - gelombangDiskonNominal - diskonNominal, 0)
  return { gelombangDiskonNominal, gelombangNama: gelombang?.nama ?? null, diskonNominal, diskonNama, totalTagihan }
}

// Dipakai SEBELUM pernah terkunci: gelombang diambil dari yang SEDANG AKTIF
// sekarang, karena pendaftar memang belum resmi "masuk" gelombang manapun.
async function hitungBreakdownLive(pendaftaranId: string): Promise<TagihanBreakdown | null> {
  const p = await prisma.pendaftaran.findUnique({ where: { id: pendaftaranId } })
  if (!p) return null

  const harga = await getHargaAktif({
    tahunAjaranId: p.tahunAjaranId,
    jenjang: p.jenjang,
    jurusan: p.jurusan || '-',
    kelas: p.kelas || 'REGULER',
  })
  const hargaPokok = harga?.nominal ?? 0

  const untukAlumni = p.jenjang !== 'smp' && !!p.alumniSmpCitraNegara
  const gelombang = await getGelombangAktif({ tahunAjaranId: p.tahunAjaranId, jenjang: p.jenjang, untukAlumni })

  const calc = await hitungDariGelombangDanDiskon({ hargaPokok, gelombang, diskonId: p.diskonId })
  return { hargaPokok, hargaTersedia: !!harga, ...calc, locked: false }
}

// Tampilan tagihan TANPA menulis apa pun — dipakai sebelum totalTagihan
// dikunci (mis. dashboard sebelum pembayaran pertama masuk), supaya user
// selalu melihat angka yang benar walau belum ada transaksi.
export async function previewTagihan(pendaftaranId: string): Promise<TagihanBreakdown | null> {
  const p = await prisma.pendaftaran.findUnique({ where: { id: pendaftaranId } })
  if (!p) return null

  if (p.totalTagihanLocked) {
    return {
      hargaPokok: p.hargaPokok ?? 0,
      hargaTersedia: true, // sudah terkunci = sudah pernah berhasil dihitung dari Harga yang valid saat itu
      gelombangDiskonNominal: p.gelombangDiskonNominal,
      gelombangNama: p.gelombang,
      diskonNominal: p.diskonNominal,
      diskonNama: p.diskonNama,
      totalTagihan: p.totalTagihan ?? 0,
      locked: true,
    }
  }

  return hitungBreakdownLive(pendaftaranId)
}

// Kunci totalTagihan sekali — dipanggil saat pembayaran PERTAMA masuk (dari
// user maupun input admin). Kalau sudah terkunci, tidak melakukan apa-apa
// dan mengembalikan record apa adanya, supaya perubahan Harga/Gelombang/
// Diskon di kemudian hari TIDAK mengubah tagihan pendaftar yang sudah
// berjalan pembayarannya.
export async function lockTagihanJikaBelum(pendaftaranId: string) {
  const existing = await prisma.pendaftaran.findUnique({ where: { id: pendaftaranId } })
  if (!existing) throw new Error('Pendaftaran tidak ditemukan')
  if (existing.totalTagihanLocked) return existing

  const harga = await getHargaAktif({
    tahunAjaranId: existing.tahunAjaranId,
    jenjang: existing.jenjang,
    jurusan: existing.jurusan || '-',
    kelas: existing.kelas || 'REGULER',
  })
  if (!harga) {
    throw new HargaTidakDitemukanError(labelPilihan(existing.jenjang, existing.jurusan || '-', existing.kelas || 'REGULER'))
  }
  const hargaPokok = harga.nominal

  const untukAlumni = existing.jenjang !== 'smp' && !!existing.alumniSmpCitraNegara
  const gelombang = await getGelombangAktif({ tahunAjaranId: existing.tahunAjaranId, jenjang: existing.jenjang, untukAlumni })

  const calc = await hitungDariGelombangDanDiskon({ hargaPokok, gelombang, diskonId: existing.diskonId })

  return prisma.pendaftaran.update({
    where: { id: pendaftaranId },
    data: {
      hargaId: harga.id,
      hargaPokok,
      gelombangId: gelombang?.id ?? null,
      gelombang: gelombang?.nama ?? null,
      gelombangDiskonNominal: calc.gelombangDiskonNominal,
      diskonNominal: calc.diskonNominal,
      diskonNama: calc.diskonNama,
      totalTagihan: calc.totalTagihan,
      totalTagihanLocked: true,
    },
  })
}

// Hitung ulang paksa — aksi admin eksplisit (mis. salah pilih jurusan, atau
// menerapkan diskon baru setelah pendaftar sudah bayar). Tidak pernah
// dipanggil otomatis; harus lewat tombol admin "Hitung Ulang Tagihan".
//
// PENTING: gelombang yang SUDAH ditetapkan (gelombangId) dipertahankan apa
// adanya — tidak dicari ulang "gelombang mana yang aktif sekarang". Kalau
// tidak, mengoreksi jurusan atau menerapkan diskon baru bisa diam-diam
// memindahkan pendaftar ke gelombang lain yang kebetulan sedang aktif saat
// itu (dan biasanya diskonnya sudah beda) — hanya Harga & Diskon yang
// disegarkan ulang di sini.
export async function hitungUlangTagihan(pendaftaranId: string) {
  const existing = await prisma.pendaftaran.findUnique({ where: { id: pendaftaranId } })
  if (!existing) throw new Error('Pendaftaran tidak ditemukan')

  const harga = await getHargaAktif({
    tahunAjaranId: existing.tahunAjaranId,
    jenjang: existing.jenjang,
    jurusan: existing.jurusan || '-',
    kelas: existing.kelas || 'REGULER',
  })
  // Beda dengan lockTagihanJikaBelum (kunci PERTAMA KALI, wajib ada Harga
  // aktif yang cocok): di sini pendaftar SUDAH pernah terkunci sebelumnya
  // dengan hargaPokok yang sah. Kalau baris Harga-nya sekarang kebetulan
  // sudah dinonaktifkan/diubah namanya, JANGAN gagalkan hitung ulang hanya
  // gara-gara itu — pakai hargaPokok yang sudah tersimpan supaya admin tetap
  // bisa mengubah-ubah diskon kapan saja dan tetap sinkron, tidak terhambat
  // drift katalog harga.
  const hargaPokok = harga?.nominal ?? existing.hargaPokok ?? 0

  const gelombang = existing.gelombangId
    ? await prisma.gelombang.findUnique({ where: { id: existing.gelombangId } })
    : null

  const calc = await hitungDariGelombangDanDiskon({ hargaPokok, gelombang, diskonId: existing.diskonId })

  return prisma.pendaftaran.update({
    where: { id: pendaftaranId },
    data: {
      hargaId: harga?.id ?? existing.hargaId,
      hargaPokok,
      gelombangDiskonNominal: calc.gelombangDiskonNominal,
      diskonNominal: calc.diskonNominal,
      diskonNama: calc.diskonNama,
      totalTagihan: calc.totalTagihan,
      totalTagihanLocked: true,
    },
  })
}

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
