// Perhitungan "Export Kesimpulan Keuangan" — SATU jenjang per laporan (SMP,
// SMA, SMK TIDAK PERNAH digabung). Kategorinya BUKAN kelas (7/8/9/10/11/12),
// tapi mengikuti kategori harga yang MEMANG ada di sistem: setiap baris
// Harga.kelas berformat "Kelas {N} - PLUS" atau "Kelas {N} - REGULER" (lihat
// data sungguhan di tabel Harga) — jadi kategorinya adalah PLUS/REGULER,
// untuk SMK dipecah lagi per jurusan (PPLG/TJKT/DKV/MPLB/BDR/PH, dari
// JURUSAN_SMK yang sama dipakai di seluruh sistem). SENGAJA murni (tanpa
// prisma/server-only) — dipakai dari client component (tombol "Export
// Kesimpulan Keuangan" di app/admin/laporan/keuangan/page.tsx), sama seperti
// lib/rincianKeuangan.ts.

import { hitungRingkasan } from './pembayaran-utils'
import { cariJurusan, JURUSAN_SMK } from './labels'

export type JenjangLaporan = 'smp' | 'sma' | 'smk'

export interface BarisPendaftaranUntukKesimpulan {
  /** Tidak dipakai hitungKesimpulanKeuangan sendiri (jenjang sudah jadi parameter terpisah) — cuma supaya pemanggil bisa memfilter per jenjang sebelum memanggil. */
  jenjang?: string | null
  jurusan: string | null
  kelas?: string | null
  hargaPokok?: number | null
  gelombangDiskonNominal?: number | null
  diskonNominal?: number | null
  totalTagihan?: number | null
  statusPembayaran?: string | null
  pembayaranList: {
    jenis?: string
    nominal: number
    status: string
    angsuranKe: number
    tanggalBayar: string | Date
  }[]
}

/** Ambil PLUS/REGULER dari akhir string kelas, mis. "Kelas 10 - REGULER" -> "REGULER". */
function ambilVarian(kelas: string | null | undefined): 'PLUS' | 'REGULER' | null {
  const m = (kelas || '').match(/-\s*(PLUS|REGULER)\s*$/i)
  return m ? (m[1].toUpperCase() as 'PLUS' | 'REGULER') : null
}

export interface KategoriKesimpulan {
  /** Kunci internal stabil, mis. "reguler", "PPLG-plus". */
  kunci: string
  /** Label siap-tampil, mis. "REGULER", "PPLG - PLUS". */
  label: string
  jumlahPendaftar: number
  /** Gross, sebelum diskon (jumlah hargaPokok). */
  totalTagihan: number
  /** Jumlah gelombangDiskonNominal + diskonNominal. */
  totalDiskon: number
  /** Net setelah diskon = totalTagihan (field) pendaftar, dan seharusnya == totalTagihan - totalDiskon. */
  totalKewajiban: number
  /** Uang yang BENAR-BENAR diterima sekolah (bersih, setelah refund/alokasi). */
  totalPembayaran: number
  /** Jumlah nominal seluruh transaksi "bayar" berstatus lunas (gross, sebelum dikurangi refund/alokasi). */
  totalAngsuran: number
  /** Total kewajiban milik pendaftar yang statusnya LUNAS. */
  totalPelunasan: number
  /** Sisa yang belum dibayar (jumlah sisaBayar). */
  totalSisa: number
  /** 0-100, dari totalPembayaran/totalKewajiban. */
  persenPembayaran: number
  jumlahLunas: number
  jumlahMasihAngsuran: number
  jumlahBelumBayar: number
  /** Total kewajiban milik pendaftar yang statusnya BELUM BAYAR sama sekali (bukan sedang mengangsur). */
  kewajibanBelumBayar: number
}

function kategoriKosong(kunci: string, label: string): KategoriKesimpulan {
  return {
    kunci, label, jumlahPendaftar: 0, totalTagihan: 0, totalDiskon: 0, totalKewajiban: 0,
    totalPembayaran: 0, totalAngsuran: 0, totalPelunasan: 0, totalSisa: 0, persenPembayaran: 0,
    jumlahLunas: 0, jumlahMasihAngsuran: 0, jumlahBelumBayar: 0, kewajibanBelumBayar: 0,
  }
}

// Partisi 3 arah yang HARUS selalu berjumlah = jumlahPendaftar (tidak ada
// status yang jatuh di luar ketiganya): "menunggu_verifikasi" masuk Masih
// Angsuran (uangnya sudah disetor, tinggal diverifikasi — closer ke "sedang
// mengangsur" daripada "belum bayar sama sekali"); "ditolak"/"dikembalikan"
// masuk Belum Bayar (secara kewajiban keuangan, uang itu tidak lagi
// dianggap sudah diterima).
function bucketStatus(status: string | null | undefined): 'lunas' | 'masih_angsuran' | 'belum_bayar' {
  const s = status || 'belum_bayar'
  if (s === 'lunas') return 'lunas'
  if (s === 'cicilan_berjalan' || s === 'menunggu_verifikasi') return 'masih_angsuran'
  return 'belum_bayar'
}

export interface RekapAngsuranUrutan { ke: number; jumlahTransaksi: number; nominal: number }
export interface RekapAngsuranPeriode { periode: string; jumlahTransaksi: number; nominal: number }

export interface KesimpulanKeuanganData {
  jenjang: JenjangLaporan
  kategori: KategoriKesimpulan[]
  total: KategoriKesimpulan
  rekapAngsuran: {
    totalTransaksi: number
    totalNominal: number
    berdasarkanUrutan: RekapAngsuranUrutan[]
    berdasarkanPeriode: RekapAngsuranPeriode[]
    tanggalPalingAwal: string | null
    tanggalPalingAkhir: string | null
  }
  evaluasi: string[]
}

const rupiah = (n: number) => 'Rp' + Math.round(n).toLocaleString('id-ID')

export function kategoriDariPendaftar(jenjang: JenjangLaporan, p: { jurusan: string | null; kelas?: string | null }): { kunci: string; label: string } {
  const varian = ambilVarian(p.kelas) // 'PLUS' | 'REGULER' | null
  const labelVarian = varian || 'Belum Dikategorikan'
  const kunciVarian = (varian || 'lainnya').toLowerCase()

  if (jenjang !== 'smk') {
    return { kunci: kunciVarian, label: labelVarian }
  }
  const kode = cariJurusan(p.jurusan).kode
  return { kunci: `${kode}-${kunciVarian}`, label: `${kode} - ${labelVarian}` }
}

/** Urutan kategori BAKU (selalu tampil walau datanya 0) — SMP/SMA: Plus, Reguler. SMK: 6 jurusan x Plus, Reguler. */
function daftarKategoriBaku(jenjang: JenjangLaporan): { kunci: string; label: string }[] {
  if (jenjang !== 'smk') {
    return [
      { kunci: 'plus', label: 'PLUS' },
      { kunci: 'reguler', label: 'REGULER' },
    ]
  }
  return JURUSAN_SMK.flatMap(j => [
    { kunci: `${j.kode}-plus`, label: `${j.kode} - PLUS` },
    { kunci: `${j.kode}-reguler`, label: `${j.kode} - REGULER` },
  ])
}

export function hitungKesimpulanKeuangan(
  rows: BarisPendaftaranUntukKesimpulan[],
  jenjang: JenjangLaporan,
): KesimpulanKeuanganData {
  const peta = new Map<string, KategoriKesimpulan>()
  for (const k of daftarKategoriBaku(jenjang)) peta.set(k.kunci, kategoriKosong(k.kunci, k.label))

  for (const p of rows) {
    const { kunci, label } = kategoriDariPendaftar(jenjang, p)
    if (!peta.has(kunci)) peta.set(kunci, kategoriKosong(kunci, label)) // jaring pengaman data tak terduga — tidak menghilangkan pendaftar

    const kat = peta.get(kunci)!
    const hargaPokok = p.hargaPokok ?? 0
    const diskon = (p.gelombangDiskonNominal ?? 0) + (p.diskonNominal ?? 0)
    const kewajiban = p.totalTagihan ?? 0
    const { totalBayar, totalDibayar, sisaBayar } = hitungRingkasan(p.pembayaranList, kewajiban)
    const bucket = bucketStatus(p.statusPembayaran)

    kat.jumlahPendaftar += 1
    kat.totalTagihan += hargaPokok
    kat.totalDiskon += diskon
    kat.totalKewajiban += kewajiban
    kat.totalPembayaran += totalDibayar
    kat.totalAngsuran += totalBayar
    kat.totalSisa += sisaBayar
    if (bucket === 'lunas') { kat.jumlahLunas += 1; kat.totalPelunasan += kewajiban }
    else if (bucket === 'masih_angsuran') { kat.jumlahMasihAngsuran += 1 }
    else { kat.jumlahBelumBayar += 1; kat.kewajibanBelumBayar += kewajiban }
  }

  for (const kat of peta.values()) {
    kat.persenPembayaran = kat.totalKewajiban > 0 ? Math.round((kat.totalPembayaran / kat.totalKewajiban) * 1000) / 10 : 0
  }

  // Urutan tampil: kategori baku dulu (walau 0), lalu kategori tak terduga
  // (kalau ada) di paling bawah supaya tetap kelihatan, bukan hilang diam-diam.
  const kunciBaku = daftarKategoriBaku(jenjang).map(k => k.kunci)
  const kategori = [
    ...kunciBaku.map(k => peta.get(k)!),
    ...[...peta.keys()].filter(k => !kunciBaku.includes(k)).map(k => peta.get(k)!),
  ]

  const total = kategoriKosong('total', jenjang === 'smk' ? 'TOTAL SMK' : `TOTAL ${jenjang.toUpperCase()}`)
  for (const kat of kategori) {
    total.jumlahPendaftar += kat.jumlahPendaftar
    total.totalTagihan += kat.totalTagihan
    total.totalDiskon += kat.totalDiskon
    total.totalKewajiban += kat.totalKewajiban
    total.totalPembayaran += kat.totalPembayaran
    total.totalAngsuran += kat.totalAngsuran
    total.totalPelunasan += kat.totalPelunasan
    total.totalSisa += kat.totalSisa
    total.jumlahLunas += kat.jumlahLunas
    total.jumlahMasihAngsuran += kat.jumlahMasihAngsuran
    total.jumlahBelumBayar += kat.jumlahBelumBayar
    total.kewajibanBelumBayar += kat.kewajibanBelumBayar
  }
  total.persenPembayaran = total.totalKewajiban > 0 ? Math.round((total.totalPembayaran / total.totalKewajiban) * 1000) / 10 : 0

  // --- Rekap Angsuran (seluruh jenjang, bukan per kategori) ---
  const semuaAngsuran = rows.flatMap(p => p.pembayaranList.filter(x => (x.jenis || 'bayar') === 'bayar' && x.status === 'lunas'))
  const totalTransaksi = semuaAngsuran.length
  const totalNominal = semuaAngsuran.reduce((s, x) => s + x.nominal, 0)

  const petaUrutan = new Map<number, RekapAngsuranUrutan>()
  const petaPeriode = new Map<string, RekapAngsuranPeriode>()
  let tanggalMin: Date | null = null
  let tanggalMax: Date | null = null
  for (const a of semuaAngsuran) {
    const u = petaUrutan.get(a.angsuranKe) ?? { ke: a.angsuranKe, jumlahTransaksi: 0, nominal: 0 }
    u.jumlahTransaksi += 1; u.nominal += a.nominal
    petaUrutan.set(a.angsuranKe, u)

    const d = new Date(a.tanggalBayar)
    const kunciPeriode = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    const per = petaPeriode.get(kunciPeriode) ?? { periode: kunciPeriode, jumlahTransaksi: 0, nominal: 0 }
    per.jumlahTransaksi += 1; per.nominal += a.nominal
    petaPeriode.set(kunciPeriode, per)

    if (!tanggalMin || d < tanggalMin) tanggalMin = d
    if (!tanggalMax || d > tanggalMax) tanggalMax = d
  }

  const evaluasi: string[] = []
  if (total.jumlahPendaftar === 0) {
    evaluasi.push(`Belum ada pendaftar ${jenjang.toUpperCase()} pada tahun ajaran ini, sehingga belum ada data keuangan.`)
  } else {
    evaluasi.push(`Dari total kewajiban ${rupiah(total.totalKewajiban)} (${total.jumlahPendaftar} pendaftar), sudah diterima ${rupiah(total.totalPembayaran)} (${total.persenPembayaran}%).`)
    if (total.totalSisa > 0) evaluasi.push(`Sisa yang belum tertagih ${rupiah(total.totalSisa)}.`)
    else evaluasi.push('Seluruh kewajiban pada jenjang ini sudah lunas.')
    const terbaik = [...kategori].filter(k => k.jumlahPendaftar > 0).sort((a, b) => b.jumlahPendaftar - a.jumlahPendaftar)[0]
    if (terbaik) evaluasi.push(`Kategori dengan pendaftar terbanyak: ${terbaik.label} (${terbaik.jumlahPendaftar} pendaftar).`)
    if (total.jumlahBelumBayar > 0) evaluasi.push(`${total.jumlahBelumBayar} pendaftar belum menyetor pembayaran sama sekali, dengan total kewajiban ${rupiah(total.kewajibanBelumBayar)}.`)
  }

  return {
    jenjang,
    kategori,
    total,
    rekapAngsuran: {
      totalTransaksi,
      totalNominal,
      berdasarkanUrutan: [...petaUrutan.values()].sort((a, b) => a.ke - b.ke),
      berdasarkanPeriode: [...petaPeriode.values()].sort((a, b) => a.periode.localeCompare(b.periode)),
      tanggalPalingAwal: tanggalMin ? tanggalMin.toISOString() : null,
      tanggalPalingAkhir: tanggalMax ? tanggalMax.toISOString() : null,
    },
    evaluasi,
  }
}
