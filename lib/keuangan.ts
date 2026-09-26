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
import { hitungRingkasan, MIN_CICILAN, DEFAULT_MIN_PEMBAYARAN_AWAL, LABEL_JENIS_TRANSAKSI, formatRupiah, hitungTotalDisetorkan, syaratKeuanganTerima, type SyaratTerima } from './pembayaran-utils'
import { notifPendaftarOfflineSiapVerifikasi } from './notifikasiAdmin'

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

// Dokumen wajib saat PENDAFTARAN (bukan daftar ulang) — persis daftar yang
// digerbangi "Kirim Formulir" jalur online (app/api/pendaftaran/kirim/route.ts,
// fileKip sengaja tidak wajib di sana juga). Disalin literal, bukan diimpor
// dari route itu, supaya kedua gerbang tetap independen kalau salah satu
// jenjang nanti butuh pengecualian sendiri.
function dokumenPendaftaranLengkap(p: {
  fileIjazah: string | null; fileAkte: string | null; fileKK: string | null
  fileKtpOrtu: string | null; fileFoto: string | null
}): boolean {
  return !!p.fileIjazah && !!p.fileAkte && !!p.fileKK && !!p.fileKtpOrtu && !!p.fileFoto
}

// Pendaftar OFFLINE tidak melalui "Kirim Formulir" — datanya diinput admin
// langsung di sekolah (app/api/admin/pendaftar-offline/route.ts), jadi tidak
// ada tombol yang memicu transisi draft -> verified seperti jalur online.
// Tanpa ini status bisa nyangkut selamanya di "Draft — Belum Dikirim"
// walau dokumennya sudah lengkap dan sudah bayar.
//
// Dipanggil setiap kali dokumen ATAU pembayaran offline berubah, supaya
// begitu SYARAT YANG SAMA PERSIS dengan jalur online terpenuhi (dokumen
// wajib lengkap + minimal uang pendaftaran sudah disetor), statusnya
// otomatis pindah ke "Sedang Diverifikasi" tanpa menunggu admin memencet
// apa pun. Diam-diam no-op untuk pendaftar online atau yang statusnya
// sudah bukan draft (mis. sudah ditolak/diterima).
export async function cekOtomatisVerifikasiOffline(pendaftaranId: string) {
  const p = await prisma.pendaftaran.findUnique({
    where: { id: pendaftaranId },
    include: { pembayaranList: true },
  })
  if (!p || p.status !== 'draft' || p.sumberDaftar !== 'offline') return null
  if (!dokumenPendaftaranLengkap(p)) return null

  const minimal = await getMinimalPembayaranAwal(p.tahunAjaranId)
  if (hitungTotalDisetorkan(p.pembayaranList) < minimal) return null

  const updated = await prisma.pendaftaran.update({
    where: { id: pendaftaranId },
    data: { status: 'verified' },
  })
  await notifPendaftarOfflineSiapVerifikasi({
    id: updated.id,
    namaLengkap: updated.namaLengkap,
    jenjang: updated.jenjang,
    tahunAjaranId: updated.tahunAjaranId,
  })
  return updated
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
//
// Diskon gelombang dipotong dari Gelombang.diskonNominal (Rupiah tetap yang
// diinput admin), BUKAN dari Gelombang.diskonPersen — field persen itu
// sekarang murni label tampilan landing page (lihat komentar di schema).
async function hitungDariGelombangDanDiskon(params: {
  hargaPokok: number
  gelombang: { nama: string; diskonNominal: number } | null
  diskonId: string | null
}): Promise<Pick<TagihanBreakdown, 'gelombangDiskonNominal' | 'gelombangNama' | 'diskonNominal' | 'diskonNama' | 'totalTagihan'>> {
  const { hargaPokok, gelombang, diskonId } = params
  const gelombangDiskonNominal = gelombang?.diskonNominal ?? 0

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

// Syarat keuangan sebelum berkas pendaftar boleh diterima — dipakai gerbang
// PUT /api/admin/pendaftar/[id] (penegakan sebenarnya) dan GET detail
// (supaya tombolnya bisa dinonaktifkan lengkap dengan alasannya).
export async function cekKeuanganUntukTerima(pendaftaranId: string): Promise<SyaratTerima | null> {
  const p = await prisma.pendaftaran.findUnique({
    where: { id: pendaftaranId },
    select: { tahunAjaranId: true, pembayaranList: { select: { jenis: true, nominal: true, status: true } } },
  })
  if (!p) return null
  const [tagihan, minimalAwal] = await Promise.all([previewTagihan(pendaftaranId), getMinimalPembayaranAwal(p.tahunAjaranId)])
  return syaratKeuanganTerima({
    pembayaranList: p.pembayaranList,
    totalTagihan: tagihan?.totalTagihan ?? 0,
    hargaTersedia: tagihan?.hargaTersedia ?? false,
    minimalAwal,
  })
}

// Tagihan pendaftar SEANDAINYA dipindah (mutasi) ke jenjang/jurusan/kelas
// lain. Dipakai pratinjau DAN eksekusi mutasi (lib/mutasi.ts), jadi angka
// yang admin lihat sebelum menekan "Pindahkan" persis sama dengan yang
// tersimpan. Tagihan lama tidak pernah disalin: Harga SELALU dari tujuan,
// Diskon dari pilihan admin untuk tujuan.
//
// Gelombang: kalau jenjangnya sama (pindah jurusan SMK) dan tagihan sudah
// terkunci, gelombang yang sudah ditetapkan dipertahankan — alasan yang sama
// dengan hitungUlangTagihan: pindah jurusan tidak boleh diam-diam memindah
// pendaftar ke gelombang lain yang kebetulan sedang aktif. Kalau jenjangnya
// berubah, gelombang lama milik jenjang asal dan tidak berlaku di tujuan,
// jadi diambil gelombang AKTIF jenjang tujuan.
export async function hitungTagihanTujuan(
  p: { tahunAjaranId: string; jenjang: string; gelombangId: string | null; totalTagihanLocked: boolean; alumniSmpCitraNegara: boolean | null },
  tujuan: { jenjang: string; jurusan: string | null; kelas: string; diskonId: string | null },
) {
  const harga = await getHargaAktif({
    tahunAjaranId: p.tahunAjaranId,
    jenjang: tujuan.jenjang,
    jurusan: tujuan.jurusan || '-',
    kelas: tujuan.kelas,
  })
  if (!harga) {
    throw new HargaTidakDitemukanError(labelPilihan(tujuan.jenjang, tujuan.jurusan || '-', tujuan.kelas))
  }

  const pertahankanGelombang = tujuan.jenjang === p.jenjang && p.totalTagihanLocked
  const gelombang = pertahankanGelombang
    ? (p.gelombangId ? await prisma.gelombang.findUnique({ where: { id: p.gelombangId } }) : null)
    : await getGelombangAktif({
        tahunAjaranId: p.tahunAjaranId,
        jenjang: tujuan.jenjang,
        untukAlumni: tujuan.jenjang !== 'smp' && !!p.alumniSmpCitraNegara,
      })

  const calc = await hitungDariGelombangDanDiskon({ hargaPokok: harga.nominal, gelombang, diskonId: tujuan.diskonId })
  return { harga, gelombang, gelombangDipertahankan: pertahankanGelombang, ...calc }
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

  // Transaksi TERBARU yang sudah beres (lunas) di antara "bayar" & "refund"
  // — dipakai untuk mendeteksi apakah pengembalian dana adalah kejadian
  // PALING AKHIR pada pendaftar ini. Alokasi SENGAJA tidak ikut di sini:
  // uangnya tetap di sekolah, itu bukan "uang keluar" seperti refund.
  const transaksiTerakhir = pendaftaran.pembayaranList
    .filter(p => p.status === 'lunas' && (p.jenis === 'bayar' || p.jenis === 'refund'))
    .sort((a, b) => b.tanggalBayar.getTime() - a.tanggalBayar.getTime())[0]

  let statusPembayaran: string
  if (adaMenunggu) {
    // Verifikasi yang tertunda selalu paling mendesak untuk ditindaklanjuti
    // — tidak boleh tertutupi oleh status "Dikembalikan" dari transaksi lama.
    statusPembayaran = 'menunggu_verifikasi'
  } else if (transaksiTerakhir?.jenis === 'refund') {
    // "Kembalikan Kelebihan Bayar" harus menghasilkan status ini, BUKAN
    // "Cicilan Berjalan" — walau secara nominal bersihnya bisa saja masih
    // pas sama totalTagihan (refund dibatasi hanya sebesar kelebihan bayar,
    // lihat validasi di app/api/admin/pembayaran/route.ts), yang BARU SAJA
    // terjadi tetaplah pengembalian uang, bukan pembayaran/cicilan biasa.
    // Kalau pendaftar membayar lagi setelah ini, transaksiTerakhir berubah
    // jadi "bayar" dan statusnya otomatis kembali ke hitungan normal di
    // bawah — status ini tidak "macet" selamanya.
    statusPembayaran = 'dikembalikan'
  } else if (totalTagihan > 0 && totalDibayar >= totalTagihan) {
    statusPembayaran = 'lunas'
  } else if (totalDibayar > 0) {
    statusPembayaran = 'cicilan_berjalan'
  } else {
    statusPembayaran = 'belum_bayar'
  }

  const data: { statusPembayaran: string; tanggalLunas?: Date } = { statusPembayaran }
  // Dicatat SEKALI, saat pertama kali sungguh "lunas" — dipakai untuk
  // statistik "Pelunasan Hari Ini" (lib/pendaftarQuery.ts). Tidak ditimpa
  // kalau sudah pernah lunas sebelumnya.
  if (statusPembayaran === 'lunas' && !pendaftaran.tanggalLunas) {
    data.tanggalLunas = new Date()
  }

  return prisma.pendaftaran.update({
    where: { id: pendaftaranId },
    data,
  })
}
