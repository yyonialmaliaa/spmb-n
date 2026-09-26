// Perhitungan "Rincian Angsuran per Pendaftar" — SENGAJA murni (tanpa impor
// prisma/server-only), supaya modul ini AMAN dipakai baik dari server
// (lib/laporanKeuangan.ts, untuk sheet di export Laporan Keuangan) MAUPUN
// langsung dari client component (components/admin/PendaftarView.tsx, untuk
// tombol "Export Keuangan" di halaman Pendaftar yang membangun file Excel-nya
// di browser dari data yang SUDAH tersaring di layar — supaya hasil ekspor
// selalu persis sama dengan yang admin lihat & filter saat itu).
//
// Satu-satunya sumber kebenaran untuk bentuk baris rincian ini — JANGAN
// duplikasi logikanya di tempat lain.

import { hitungRingkasan } from './pembayaran-utils'
import { cariJurusan } from './labels'

export type JenjangLaporan = 'smp' | 'sma' | 'smk'

const JENJANG_UPPER: Record<string, string> = { smp: 'SMP', sma: 'SMA', smk: 'SMK' }

const LABEL_BAYAR: Record<string, string> = {
  belum_bayar: 'Belum Bayar',
  menunggu_verifikasi: 'Menunggu Verifikasi',
  cicilan_berjalan: 'Angsuran Berjalan',
  lunas: 'Lunas',
  ditolak: 'Ditolak',
  dikembalikan: 'Dikembalikan',
}

export interface BarisAngsuran {
  ke: number
  nominal: number
  /** ISO — diformat di lapisan Excel/tampilan, bukan di sini. */
  tanggal: string
}

export interface RincianPendaftar {
  no: number
  /** Kode jurusan (SMK) atau nama kelas (SMP/SMA) — header kolomnya menyesuaikan di Excel. */
  kelompok: string
  jenjang: string
  nama: string
  jenisKelamin: string
  asalSekolah: string
  hargaPokok: number
  potonganBiaya: number
  totalTagihan: number
  angsuran: BarisAngsuran[]
  totalDibayar: number
  sisaBayar: number
  /** 0–100, dibulatkan 1 desimal. */
  persenBayar: number
  keterangan: string
}

/** Bentuk data pendaftar minimal yang dibutuhkan — cocok dengan hasil prisma (Date) MAUPUN hasil fetch().json() di browser (string ISO). */
export interface BarisPendaftaranUntukRincian {
  namaLengkap: string | null
  jenisKelamin: string | null
  asalSMP?: string | null
  asalSekolah?: string | null
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

/** Riwayat angsuran yang SUDAH lunas (bukan menunggu/ditolak), urut angsuran ke-1, 2, 3... */
function angsuranLunasDariRiwayat(pembayaranList: BarisPendaftaranUntukRincian['pembayaranList']): BarisAngsuran[] {
  return pembayaranList
    .filter(x => (x.jenis || 'bayar') === 'bayar' && x.status === 'lunas')
    .sort((a, b) => a.angsuranKe - b.angsuranKe)
    .map(x => ({ ke: x.angsuranKe, nominal: x.nominal, tanggal: new Date(x.tanggalBayar).toISOString() }))
}

/** Angsuran terbanyak di antara seluruh baris — dipakai menentukan jumlah kolom "Angsuran N" dinamis di Excel. */
export function maksAngsuranDari(baris: { angsuran: BarisAngsuran[] }[]): number {
  return baris.reduce((mx, b) => Math.max(mx, b.angsuran.length), 0)
}

export function hitungRincianPendaftar(
  rows: BarisPendaftaranUntukRincian[],
  jenjang: JenjangLaporan,
): { rincianPendaftar: RincianPendaftar[]; maksAngsuran: number } {
  const rincianPendaftar: RincianPendaftar[] = rows.map((p, i) => {
    const tagihan = p.totalTagihan ?? 0
    const { totalDibayar, sisaBayar } = hitungRingkasan(p.pembayaranList, tagihan)
    const status = p.statusPembayaran || 'belum_bayar'
    return {
      no: i + 1,
      kelompok: jenjang === 'smk' ? cariJurusan(p.jurusan).kode : (p.kelas || '-'),
      jenjang: JENJANG_UPPER[jenjang],
      nama: p.namaLengkap || '-',
      jenisKelamin: p.jenisKelamin === 'Laki-laki' ? 'L' : p.jenisKelamin === 'Perempuan' ? 'P' : '-',
      asalSekolah: p.asalSMP || p.asalSekolah || '-',
      hargaPokok: p.hargaPokok ?? 0,
      potonganBiaya: (p.gelombangDiskonNominal ?? 0) + (p.diskonNominal ?? 0),
      totalTagihan: tagihan,
      angsuran: angsuranLunasDariRiwayat(p.pembayaranList),
      totalDibayar,
      sisaBayar,
      persenBayar: tagihan > 0 ? Math.round((totalDibayar / tagihan) * 1000) / 10 : 0,
      keterangan: LABEL_BAYAR[status] || status,
    }
  })
  return { rincianPendaftar, maksAngsuran: maksAngsuranDari(rincianPendaftar) }
}

// ---------------------------------------------------------------------------
// Baris untuk tombol "Export Keuangan" di halaman Pendaftar
// (components/admin/PendaftarView.tsx) — BEDA bentuk dari RincianPendaftar
// di atas: ini mempertahankan PERSIS kolom-kolom export lama (Email, Sumber
// Daftar, Gelombang, Tunggakan, Kelebihan Bayar, Refund) karena itu memang
// yang diminta dipertahankan, cuma DITAMBAH Asal Sekolah, rincian angsuran
// (nominal+tanggal per angsuran, bukan cuma hitungannya), dan persentase
// pembayaran. Referensi foto "TERBILANG" yang dulu dikirim user HANYA untuk
// gaya warna/tata letak (lihat lib/laporanKeuanganExcel.ts) — bukan daftar
// kolomnya, itulah kenapa bentuknya beda dari RincianPendaftar.
// ---------------------------------------------------------------------------

export interface BarisExportKeuanganPendaftar {
  no: number
  namaLengkap: string
  email: string
  jenjang: string
  jurusan: string
  kelas: string
  asalSekolah: string
  sumberDaftar: string
  gelombang: string
  totalTagihan: number
  totalDibayar: number
  angsuran: BarisAngsuran[]
  persenBayar: number
  tunggakan: number
  kelebihanBayar: number
  totalRefund: number
  statusPembayaran: string
  jumlahMenunggu: number
  jumlahRefund: number
}

export interface BarisPendaftaranUntukExportKeuangan {
  namaLengkap: string | null
  userEmail?: string | null
  jenjang?: string | null
  jurusan: string | null
  kelas?: string | null
  asalSMP?: string | null
  asalSekolah?: string | null
  sumberDaftar?: string | null
  gelombang?: string | null
  totalTagihan?: number | null
  statusPembayaran?: string | null
  pembayaranList: BarisPendaftaranUntukRincian['pembayaranList']
}

export function hitungBarisExportKeuangan(rows: BarisPendaftaranUntukExportKeuangan[]): BarisExportKeuanganPendaftar[] {
  return rows.map((p, i) => {
    const totalTagihan = p.totalTagihan ?? 0
    const { totalDibayar, sisaBayar, kelebihanBayar, totalRefund } = hitungRingkasan(p.pembayaranList, totalTagihan)
    const jumlahMenunggu = p.pembayaranList.filter(x => x.status === 'menunggu_verifikasi').length
    const jumlahRefund = p.pembayaranList.filter(x => x.jenis === 'refund' && x.status === 'lunas').length
    const status = p.statusPembayaran || 'belum_bayar'
    return {
      no: i + 1,
      namaLengkap: p.namaLengkap || '-',
      email: p.userEmail || '-',
      jenjang: JENJANG_UPPER[p.jenjang || 'smk'] || (p.jenjang || '-').toUpperCase(),
      jurusan: p.jurusan || '-',
      kelas: p.kelas || '-',
      asalSekolah: p.asalSMP || p.asalSekolah || '-',
      sumberDaftar: (p.sumberDaftar || 'online') === 'online' ? 'Online' : 'Offline',
      gelombang: p.gelombang || '-',
      totalTagihan,
      totalDibayar,
      angsuran: angsuranLunasDariRiwayat(p.pembayaranList),
      persenBayar: totalTagihan > 0 ? Math.round((totalDibayar / totalTagihan) * 1000) / 10 : 0,
      tunggakan: sisaBayar,
      kelebihanBayar,
      totalRefund,
      statusPembayaran: LABEL_BAYAR[status] || status,
      jumlahMenunggu,
      jumlahRefund,
    }
  })
}
