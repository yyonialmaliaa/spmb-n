// Mutasi / pindah pendaftar: SMA <-> SMK, atau antar-jurusan SMK.
//
// Aturan:
//  - hanya pendaftar berstatus Diterima (diterima_berkas)
//  - hanya SMA & SMK — SMP tidak termasuk, baik sebagai asal maupun tujuan
//  - tingkat tujuan (Kelas 10/11/12) bebas dipilih, tidak terkunci tingkat
//    saat mendaftar — asalkan harganya ada di Panel Harga
//  - record Pendaftaran TIDAK dibuat ulang: dipindah di tempat, jadi biodata,
//    berkas, status, riwayat verifikasi, pembayaran & transaksi tetap
//    menempel lewat id yang sama
//  - tagihan dihitung ulang dari Harga + Diskon TUJUAN (tidak disalin dari
//    asal); pembayaran yang sudah masuk tetap riwayat nyata dan otomatis
//    mengurangi tagihan baru, jadi tujuan yang lebih mahal memunculkan sisa
//    tagihan dan yang lebih murah memunculkan kelebihan bayar
//  - nomor pendaftaran baru dibuat untuk tujuan; nomor lama disimpan di
//    MutasiPendaftar
//
// Pratinjau (GET) dan eksekusi (POST) memakai fungsi yang sama di sini,
// supaya angka yang admin lihat sebelum menekan "Pindahkan" persis sama
// dengan yang tersimpan.

import { prisma } from './db'
import { hitungRingkasan, hitungTagihanTujuan, previewTagihan, recalculatePembayaran, formatRupiah } from './keuangan'
import { buatNomorPendaftaran } from './nomorPendaftaran'
import { kirimNotifikasi } from './notifikasi'
import { catatAudit } from './audit'
import { pecahKelasHarga, filterKelasByTingkat, getKelasMasukOptions, type JenjangKelas } from './kelas'
import { labelPosisi } from './labels'
import type { AdminSession } from './adminSession'

const JENJANG_MUTASI = ['sma', 'smk']

/** Ditolak oleh aturan mutasi — pesannya aman ditampilkan ke admin (HTTP 400). */
export class MutasiDitolakError extends Error {
  constructor(pesan: string) {
    super(pesan)
    this.name = 'MutasiDitolakError'
  }
}

/** Posisi pendaftar sudah berubah sejak dibaca, mis. klik ganda (HTTP 409). */
export class MutasiBentrokError extends Error {
  constructor() {
    super('Data pendaftar sudah berubah sejak pratinjau dibuka. Muat ulang halaman lalu coba lagi.')
    this.name = 'MutasiBentrokError'
  }
}

export interface InputMutasi {
  jenjang?: string | null
  jurusan?: string | null
  /** Tingkat tujuan, mis. "Kelas 11" — bebas dipilih, tidak terkunci tingkat saat mendaftar. */
  tingkat?: string | null
  kelas?: string | null
  diskonId?: string | null
}

function ambilPendaftar(id: string) {
  return prisma.pendaftaran.findUnique({
    where: { id },
    include: { pembayaranList: true, tahunAjaran: { select: { nama: true } } },
  })
}
type Pendaftar = NonNullable<Awaited<ReturnType<typeof ambilPendaftar>>>

function periksaSyarat(p: Pendaftar) {
  if (p.status !== 'diterima_berkas') {
    throw new MutasiDitolakError('Hanya pendaftar berstatus Diterima yang bisa dipindahkan.')
  }
  if (!JENJANG_MUTASI.includes(p.jenjang)) {
    throw new MutasiDitolakError('Pendaftar SMP tidak termasuk fitur mutasi.')
  }
}

// Tingkat pendaftar SEKARANG — hanya jadi pilihan awal di modal mutasi;
// admin bebas memilih tingkat tujuan lain (lihat getKelasMasukOptions).
function tingkatPendaftar(p: { kelas: string | null; kelasMasuk: string | null }): string {
  const dariKelas = p.kelas ? pecahKelasHarga(p.kelas).tingkat : ''
  return (dariKelas || p.kelasMasuk || 'Kelas 10').replace(/^kelas/i, 'Kelas')
}

// Pilihan tujuan diambil dari Panel Harga (baris aktif), BUKAN dari
// JURUSAN_SMK: Pendaftaran.jurusan harus persis sama dengan Harga.jurusan
// supaya harga tujuannya bisa ditemukan.
async function ambilKatalog(tahunAjaranId: string) {
  const baris = await prisma.harga.findMany({
    where: { tahunAjaranId, jenjang: { in: JENJANG_MUTASI }, aktif: true },
    orderBy: { urutan: 'asc' },
    select: { jenjang: true, jurusan: true, kelas: true, nominal: true },
  })
  return {
    baris,
    jurusanSmk: [...new Set(baris.filter(b => b.jenjang === 'smk').map(b => b.jurusan))],
    adaSma: baris.some(b => b.jenjang === 'sma'),
  }
}
type Katalog = Awaited<ReturnType<typeof ambilKatalog>>

function ambilDiskon(tahunAjaranId: string) {
  return prisma.diskon.findMany({
    where: { tahunAjaranId, aktif: true },
    orderBy: { jenis: 'asc' },
    select: { id: true, jenis: true, tipeNominal: true, nominal: true },
  })
}

function tentukanTujuan(p: Pendaftar, input: InputMutasi, katalog: Katalog) {
  const jenjang = (input.jenjang || '').toLowerCase()
  if (!JENJANG_MUTASI.includes(jenjang)) {
    throw new MutasiDitolakError('Tujuan mutasi hanya SMA atau SMK.')
  }
  // SMA tidak punya jurusan; disimpan "-" sama seperti pendaftar SMA lain
  // dan baris Harga SMA.
  const jurusan = jenjang === 'smk' ? (input.jurusan || '') : '-'
  if (jenjang === 'smk' && !katalog.jurusanSmk.includes(jurusan)) {
    throw new MutasiDitolakError('Pilih jurusan SMK tujuan.')
  }
  if (jenjang === p.jenjang) {
    if (jenjang === 'sma') throw new MutasiDitolakError('Pendaftar sudah di SMA — tujuan hanya bisa SMK.')
    if (jurusan === p.jurusan) throw new MutasiDitolakError('Jurusan tujuan sama dengan jurusan sekarang.')
  }
  return { jenjang, jurusan }
}

// Baris Harga tujuan untuk SATU tingkat — penyaring yang sama persis dengan
// formulir pendaftaran, jadi tingkat tanpa harga hasilnya kosong.
function pilihanKelas(katalog: Katalog, tujuan: { jenjang: string; jurusan: string }, tingkat: string) {
  const baris = katalog.baris.filter(b => b.jenjang === tujuan.jenjang && b.jurusan === tujuan.jurusan)
  return filterKelasByTingkat(baris, tingkat).map(b => ({ kelas: b.kelas, nominal: b.nominal }))
}

function validasiDiskon(pilihan: { id: string }[], diskonId: string | null | undefined): string | null {
  if (!diskonId) return null
  if (!pilihan.some(d => d.id === diskonId)) {
    throw new MutasiDitolakError('Diskon yang dipilih sudah tidak berlaku. Pilih ulang diskonnya.')
  }
  return diskonId
}

function totalMenungguVerifikasi(p: Pendaftar): number {
  return p.pembayaranList
    .filter(b => (b.jenis || 'bayar') === 'bayar' && b.status === 'menunggu_verifikasi')
    .reduce((s, b) => s + b.nominal, 0)
}

async function ringkasAsal(p: Pendaftar) {
  const tagihan = await previewTagihan(p.id)
  const totalTagihan = tagihan?.totalTagihan ?? 0
  const r = hitungRingkasan(p.pembayaranList, totalTagihan)
  return {
    jenjang: p.jenjang,
    jurusan: p.jurusan,
    kelas: p.kelas,
    tingkat: tingkatPendaftar(p),
    label: labelPosisi(p.jenjang, p.jurusan),
    noPendaftaran: p.noPendaftaran,
    hargaPokok: tagihan?.hargaPokok ?? 0,
    gelombangNama: tagihan?.gelombangNama ?? null,
    gelombangDiskonNominal: tagihan?.gelombangDiskonNominal ?? 0,
    diskonNama: tagihan?.diskonNama ?? null,
    diskonNominal: tagihan?.diskonNominal ?? 0,
    totalTagihan,
    totalDibayar: r.totalDibayar,
    sisaBayar: r.sisaBayar,
    kelebihanBayar: r.kelebihanBayar,
  }
}

async function hitungTujuan(p: Pendaftar, tujuan: { jenjang: string; jurusan: string }, kelas: string, diskonId: string | null) {
  const t = await hitungTagihanTujuan(p, { jenjang: tujuan.jenjang, jurusan: tujuan.jurusan, kelas, diskonId })
  const r = hitungRingkasan(p.pembayaranList, t.totalTagihan)
  return {
    t,
    ringkas: {
      hargaPokok: t.harga.nominal,
      gelombangNama: t.gelombang?.nama ?? null,
      gelombangDiskonPersen: t.gelombang?.diskonPersen ?? 0,
      gelombangDiskonNominal: t.gelombangDiskonNominal,
      gelombangDipertahankan: t.gelombangDipertahankan,
      diskonNama: t.diskonNama,
      diskonNominal: t.diskonNominal,
      totalTagihan: t.totalTagihan,
      totalDibayar: r.totalDibayar,
      sisaBayar: r.sisaBayar,
      kelebihanBayar: r.kelebihanBayar,
      menungguVerifikasi: totalMenungguVerifikasi(p),
    },
  }
}

/**
 * Pilihan tujuan + pratinjau tagihan, TANPA menyimpan apa pun. Tanpa
 * `input.jenjang` hanya mengembalikan posisi sekarang dan pilihan tujuannya.
 * Kelas yang tidak disebut/tidak tersedia diganti otomatis (tier yang sama
 * dengan sekarang bila ada) — beda dengan jalankanMutasi yang menolaknya.
 */
export async function pratinjauMutasi(id: string, input: InputMutasi) {
  const p = await ambilPendaftar(id)
  if (!p) return null
  periksaSyarat(p)

  const [katalog, diskon, asal] = await Promise.all([
    ambilKatalog(p.tahunAjaranId),
    ambilDiskon(p.tahunAjaranId),
    ringkasAsal(p),
  ])

  const jurusanSmk = katalog.jurusanSmk.filter(j => p.jenjang !== 'smk' || j !== p.jurusan)
  const pilihan = {
    jenjang: [
      ...(p.jenjang !== 'sma' && katalog.adaSma ? ['sma'] : []),
      ...(jurusanSmk.length > 0 ? ['smk'] : []),
    ],
    jurusanSmk,
    // SMA & SMK sama-sama Kelas 10–12 (SMP tidak termasuk mutasi).
    tingkat: getKelasMasukOptions('smk'),
    diskon,
  }
  // Diskon lama hanya jadi pilihan awal kalau masih berlaku di tujuan.
  const diskonAwal = diskon.some(d => d.id === p.diskonId) ? p.diskonId : null
  const dasar = { asal: { ...asal, diskonId: diskonAwal }, pilihan }

  if (!input.jenjang) return { ...dasar, tujuan: null }

  const tujuan = tentukanTujuan(p, input, katalog)
  const opsiTingkat = getKelasMasukOptions(tujuan.jenjang as JenjangKelas)
  const tingkat = input.tingkat && opsiTingkat.includes(input.tingkat) ? input.tingkat : asal.tingkat
  const opsiKelas = pilihanKelas(katalog, tujuan, tingkat)
  if (opsiKelas.length === 0) {
    throw new MutasiDitolakError(`Harga ${tingkat} untuk ${labelPosisi(tujuan.jenjang, tujuan.jurusan)} belum diatur di Panel Harga.`)
  }
  const tierSekarang = p.kelas ? pecahKelasHarga(p.kelas).tier : ''
  const kelas =
    opsiKelas.find(k => k.kelas === input.kelas)?.kelas ??
    opsiKelas.find(k => pecahKelasHarga(k.kelas).tier === tierSekarang)?.kelas ??
    opsiKelas[0].kelas
  const diskonId = validasiDiskon(diskon, input.diskonId)
  const { ringkas } = await hitungTujuan(p, tujuan, kelas, diskonId)

  return {
    ...dasar,
    tujuan: { ...tujuan, label: labelPosisi(tujuan.jenjang, tujuan.jurusan), tingkat, pilihanKelas: opsiKelas, kelas, diskonId, ...ringkas },
  }
}

/** Jalankan mutasi. Mengembalikan null bila pendaftar tidak ditemukan. */
export async function jalankanMutasi(
  id: string,
  input: InputMutasi & { alasan?: string | null },
  session: AdminSession,
  req?: Request,
) {
  const alasan = (input.alasan || '').trim()
  if (!alasan) throw new MutasiDitolakError('Alasan mutasi wajib diisi.')

  const p = await ambilPendaftar(id)
  if (!p) return null
  periksaSyarat(p)

  const [katalog, diskon, asal] = await Promise.all([
    ambilKatalog(p.tahunAjaranId),
    ambilDiskon(p.tahunAjaranId),
    ringkasAsal(p),
  ])
  const tujuan = tentukanTujuan(p, input, katalog)
  const kelas = input.kelas || ''
  const tingkatBaru = pecahKelasHarga(kelas).tingkat
  if (
    (tingkatBaru && !getKelasMasukOptions(tujuan.jenjang as JenjangKelas).includes(tingkatBaru)) ||
    !pilihanKelas(katalog, tujuan, tingkatBaru).some(k => k.kelas === kelas)
  ) {
    throw new MutasiDitolakError('Kelas tujuan tidak tersedia di Panel Harga. Muat ulang pratinjau lalu coba lagi.')
  }
  const diskonId = validasiDiskon(diskon, input.diskonId)
  const { t, ringkas } = await hitungTujuan(p, tujuan, kelas, diskonId)

  const labelAsal = labelPosisi(p.jenjang, p.jurusan)
  const labelTujuan = labelPosisi(tujuan.jenjang, tujuan.jurusan)

  const { mutasi, noBaru } = await prisma.$transaction(async tx => {
    // Nomor dibuat di dalam transaksi: kalau mutasi batal, nomor urutnya
    // ikut batal dan tidak meninggalkan lubang di urutan.
    const noBaru = await buatNomorPendaftaran(
      { tahunAjaranId: p.tahunAjaranId, tahunAjaranNama: p.tahunAjaran.nama, jenjang: tujuan.jenjang },
      tx,
    )
    // Kunci optimistik: hanya berhasil kalau posisi pendaftar masih persis
    // seperti yang tadi dibaca — mencegah klik ganda atau dua admin
    // memindahkan pendaftar yang sama bersamaan.
    const hasil = await tx.pendaftaran.updateMany({
      where: { id: p.id, status: 'diterima_berkas', jenjang: p.jenjang, jurusan: p.jurusan, noPendaftaran: p.noPendaftaran },
      data: {
        jenjang: tujuan.jenjang,
        jurusan: tujuan.jurusan,
        kelas,
        hargaId: t.harga.id,
        hargaPokok: t.harga.nominal,
        gelombangId: t.gelombang?.id ?? null,
        gelombang: t.gelombang?.nama ?? null,
        gelombangDiskonNominal: t.gelombangDiskonNominal,
        diskonId,
        diskonNominal: t.diskonNominal,
        diskonNama: t.diskonNama,
        totalTagihan: t.totalTagihan,
        totalTagihanLocked: true,
        noPendaftaran: noBaru,
        // Pendaftar pindahan mencatat tingkat masuknya sendiri — ikut
        // tingkat baru supaya tidak bertentangan dengan `kelas`.
        ...(p.kelasMasuk && tingkatBaru ? { kelasMasuk: tingkatBaru } : {}),
      },
    })
    if (hasil.count === 0) throw new MutasiBentrokError()

    const mutasi = await tx.mutasiPendaftar.create({
      data: {
        pendaftaranId: p.id,
        dariJenjang: p.jenjang,
        dariJurusan: p.jenjang === 'smk' ? p.jurusan : null,
        dariKelas: p.kelas,
        keJenjang: tujuan.jenjang,
        keJurusan: tujuan.jenjang === 'smk' ? tujuan.jurusan : null,
        keKelas: kelas,
        noPendaftaranLama: p.noPendaftaran,
        noPendaftaranBaru: noBaru,
        tagihanLama: asal.totalTagihan,
        tagihanBaru: t.totalTagihan,
        dibayarSaatMutasi: ringkas.totalDibayar,
        alasan,
        diprosesOlehId: session.userId,
        diprosesOlehNama: session.namaLengkap || session.email,
      },
    })
    return { mutasi, noBaru }
  })

  // statusPembayaran mengikuti tagihan baru (lunas / cicilan berjalan /
  // kelebihan bayar) — dari riwayat pembayaran yang sama, tidak ada yang dihapus.
  const pendaftaran = await recalculatePembayaran(p.id)

  const keadaan = ringkas.sisaBayar > 0
    ? `sisa tagihan ${formatRupiah(ringkas.sisaBayar)}`
    : ringkas.kelebihanBayar > 0
      ? `ada kelebihan bayar ${formatRupiah(ringkas.kelebihanBayar)} yang akan ditindaklanjuti admin`
      : 'sudah lunas'
  await kirimNotifikasi(
    p.id,
    `Pendaftaran Anda dipindahkan dari ${labelAsal} ke ${labelTujuan} (${kelas}). Nomor pendaftaran baru: ${noBaru}. Tagihan disesuaikan menjadi ${formatRupiah(t.totalTagihan)} (${keadaan}).`,
  )

  await catatAudit({
    session,
    aksi: 'mutasi',
    entitas: 'pendaftaran',
    entitasId: p.id,
    ringkasan: `Mutasi ${p.namaLengkap || 'pendaftar'}: ${labelAsal} (${p.kelas || '-'}) → ${labelTujuan} (${kelas}). Tagihan ${formatRupiah(asal.totalTagihan)} → ${formatRupiah(t.totalTagihan)}. Alasan: ${alasan}`,
    sebelum: {
      jenjang: p.jenjang, jurusan: p.jurusan, kelas: p.kelas, kelasMasuk: p.kelasMasuk, noPendaftaran: p.noPendaftaran,
      hargaPokok: asal.hargaPokok, gelombang: asal.gelombangNama, gelombangDiskonNominal: asal.gelombangDiskonNominal,
      diskonNama: asal.diskonNama, diskonNominal: asal.diskonNominal, totalTagihan: asal.totalTagihan,
    },
    sesudah: {
      jenjang: tujuan.jenjang, jurusan: tujuan.jurusan, kelas, kelasMasuk: p.kelasMasuk && tingkatBaru ? tingkatBaru : p.kelasMasuk, noPendaftaran: noBaru,
      hargaPokok: ringkas.hargaPokok, gelombang: ringkas.gelombangNama, gelombangDiskonNominal: ringkas.gelombangDiskonNominal,
      diskonNama: ringkas.diskonNama, diskonNominal: ringkas.diskonNominal, totalTagihan: ringkas.totalTagihan,
    },
    jenjang: tujuan.jenjang,
    tahunAjaranId: p.tahunAjaranId,
    req,
  })

  return { mutasi, pendaftaran }
}
