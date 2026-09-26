// Membangun file Excel "Export Kesimpulan Keuangan" — SATU sheet per
// jenjang (SMP/SMA/SMK tidak pernah digabung dalam satu file), berisi
// beberapa tabel terpisah tapi rapi dalam satu lembar: Judul, Ringkasan
// Keuangan, Rekap Plus/Reguler (atau per-jurusan untuk SMK), Rekap Angsuran,
// Rekap Pelunasan, dan Kesimpulan (evaluasi otomatis).
//
// Beda dari lib/excelStyle.ts's isiBarisTengah (yang merata-tengahkan semua
// sel): laporan ini mengikuti konvensi akuntansi baku — ANGKA rata KANAN,
// TEKS rata KIRI — sesuai instruksi khusus untuk laporan ini.

import ExcelJS from 'exceljs'
import {
  HIJAU_TUA, TEKS_GELAP, thinBorder, tulisHeaderHijau, tulisSectionTitle, autoFitSheet,
} from './excelStyle'
import { formatRupiah } from './pembayaran-utils'
import type { KesimpulanKeuanganData, KategoriKesimpulan } from './kesimpulanKeuangan'

const JENJANG_LABEL: Record<string, string> = { smp: 'SMP', sma: 'SMA', smk: 'SMK' }
const NAMA_BULAN = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']

function labelPeriode(p: string) {
  const [th, bl] = p.split('-')
  return `${NAMA_BULAN[Number(bl) - 1] ?? bl} ${th}`
}

function tgl(iso: string | null) {
  return iso ? new Date(iso).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '-'
}

const LEBAR_TABEL = 13 // kolom terlebar (tabel kategori) — dipakai acuan merge judul & section banner

/** Satu sel teks, rata KIRI. */
function selTeks(row: ExcelJS.Row, kolom: number, nilai: string, opts: { bold?: boolean } = {}) {
  const cell = row.getCell(kolom)
  cell.value = nilai
  cell.font = { size: 10.5, bold: !!opts.bold, color: { argb: TEKS_GELAP } }
  cell.alignment = { vertical: 'middle', horizontal: 'left', wrapText: true }
  cell.border = thinBorder()
}

/** Satu sel angka biasa (jumlah/hitungan), rata KANAN, tanpa "Rp". */
function selAngka(row: ExcelJS.Row, kolom: number, nilai: number, opts: { bold?: boolean } = {}) {
  const cell = row.getCell(kolom)
  cell.value = nilai
  cell.font = { size: 10.5, bold: !!opts.bold, color: { argb: TEKS_GELAP } }
  cell.alignment = { vertical: 'middle', horizontal: 'right' }
  cell.numFmt = '#,##0'
  cell.border = thinBorder()
}

/** Satu sel nominal Rupiah, rata KANAN, format "Rp#.##0". */
function selRupiah(row: ExcelJS.Row, kolom: number, nilai: number, opts: { bold?: boolean } = {}) {
  const cell = row.getCell(kolom)
  cell.value = nilai
  cell.font = { size: 10.5, bold: !!opts.bold, color: { argb: TEKS_GELAP } }
  cell.alignment = { vertical: 'middle', horizontal: 'right' }
  cell.numFmt = '"Rp"#,##0'
  cell.border = thinBorder()
}

/** Satu sel persentase, rata KANAN. */
function selPersen(row: ExcelJS.Row, kolom: number, persen: number, opts: { bold?: boolean } = {}) {
  const cell = row.getCell(kolom)
  cell.value = persen / 100
  cell.font = { size: 10.5, bold: !!opts.bold, color: { argb: TEKS_GELAP } }
  cell.alignment = { vertical: 'middle', horizontal: 'right' }
  cell.numFmt = '0.0%'
  cell.border = thinBorder()
}

/** Baris "Label : Nilai" dua kolom — dipakai blok Ringkasan Keuangan & KPI Rekap Angsuran. */
function baruLabelNilai(sh: ExcelJS.Worksheet, label: string, nilai: string, tebal = false) {
  const row = sh.addRow([])
  selTeks(row, 1, label, { bold: tebal })
  const cell = row.getCell(2)
  cell.value = nilai
  cell.font = { size: 10.5, bold: tebal, color: { argb: TEKS_GELAP } }
  cell.alignment = { vertical: 'middle', horizontal: 'right' }
  cell.border = thinBorder()
  if (LEBAR_TABEL > 2) sh.mergeCells(row.number, 2, row.number, LEBAR_TABEL)
}

function baruKategori(sh: ExcelJS.Worksheet, k: KategoriKesimpulan, tebal = false) {
  const row = sh.addRow([])
  selTeks(row, 1, k.label, { bold: tebal })
  selAngka(row, 2, k.jumlahPendaftar, { bold: tebal })
  selRupiah(row, 3, k.totalTagihan, { bold: tebal })
  selRupiah(row, 4, k.totalDiskon, { bold: tebal })
  selRupiah(row, 5, k.totalKewajiban, { bold: tebal })
  selRupiah(row, 6, k.totalPembayaran, { bold: tebal })
  selRupiah(row, 7, k.totalAngsuran, { bold: tebal })
  selRupiah(row, 8, k.totalPelunasan, { bold: tebal })
  selRupiah(row, 9, k.totalSisa, { bold: tebal })
  selPersen(row, 10, k.persenPembayaran, { bold: tebal })
  selAngka(row, 11, k.jumlahLunas, { bold: tebal })
  selAngka(row, 12, k.jumlahMasihAngsuran, { bold: tebal })
  selAngka(row, 13, k.jumlahBelumBayar, { bold: tebal })
  if (tebal) row.eachCell(c => { c.border = { ...thinBorder(), top: { style: 'medium', color: { argb: HIJAU_TUA } } }; c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEFECE3' } } })
  return row
}

export async function buatWorkbookKesimpulanKeuangan(data: KesimpulanKeuanganData, namaSekolah: string, namaTahunAjaran: string): Promise<ExcelJS.Buffer> {
  const wb = new ExcelJS.Workbook()
  wb.creator = 'SPMB Admin Citra Negara'
  wb.created = new Date()

  const sh = wb.addWorksheet('Kesimpulan Keuangan')
  const jenjangLabel = JENJANG_LABEL[data.jenjang]

  // ---------- 1. Judul ----------
  const baruJudul = (teks: string, ukuran: number, tebal: boolean) => {
    const row = sh.addRow([])
    const cell = row.getCell(1)
    cell.value = teks
    cell.font = { bold: tebal, size: ukuran, color: { argb: HIJAU_TUA } }
    cell.alignment = { vertical: 'middle', horizontal: 'center' }
    sh.mergeCells(row.number, 1, row.number, LEBAR_TABEL)
  }
  baruJudul('LAPORAN KESIMPULAN KEUANGAN', 14, true)
  baruJudul(namaSekolah, 12, true)
  baruJudul(jenjangLabel, 12, true)
  baruJudul(`Tahun Ajaran ${namaTahunAjaran}`, 11, false)
  sh.addRow([])

  // ---------- 2. Ringkasan Keuangan ----------
  let rBaris = sh.rowCount + 1
  tulisSectionTitle(sh, rBaris, 'RINGKASAN KEUANGAN', LEBAR_TABEL)
  const t = data.total
  baruLabelNilai(sh, 'Total Pendaftar', String(t.jumlahPendaftar), true)
  baruLabelNilai(sh, 'Total Tagihan', formatRupiah(t.totalTagihan))
  baruLabelNilai(sh, 'Total Diskon', formatRupiah(t.totalDiskon))
  baruLabelNilai(sh, 'Total Kewajiban', formatRupiah(t.totalKewajiban), true)
  baruLabelNilai(sh, 'Total Pembayaran Diterima', formatRupiah(t.totalPembayaran))
  baruLabelNilai(sh, 'Total Angsuran', formatRupiah(t.totalAngsuran))
  baruLabelNilai(sh, 'Total Pelunasan', formatRupiah(t.totalPelunasan))
  baruLabelNilai(sh, 'Total Sisa Pembayaran', formatRupiah(t.totalSisa))
  baruLabelNilai(sh, 'Persentase Pembayaran', `${t.persenPembayaran}%`, true)
  sh.addRow([])

  // ---------- 3. Rekap Plus & Reguler / Jurusan ----------
  rBaris = sh.rowCount + 1
  tulisSectionTitle(sh, rBaris, data.jenjang === 'smk' ? 'REKAP PER JURUSAN — PLUS & REGULER' : 'REKAP PLUS & REGULER', LEBAR_TABEL)
  rBaris = sh.rowCount + 1
  tulisHeaderHijau(sh, rBaris, [
    'Kategori', 'Jumlah Pendaftar', 'Total Tagihan', 'Total Diskon', 'Total Kewajiban',
    'Total Pembayaran', 'Total Angsuran', 'Total Pelunasan', 'Total Sisa', '%',
    'Lunas', 'Masih Angsuran', 'Belum Bayar',
  ])
  for (const k of data.kategori) baruKategori(sh, k)
  baruKategori(sh, data.total, true)
  sh.addRow([])

  // ---------- 4. Rekap Angsuran ----------
  rBaris = sh.rowCount + 1
  tulisSectionTitle(sh, rBaris, 'REKAP ANGSURAN', LEBAR_TABEL)
  baruLabelNilai(sh, 'Total Transaksi Angsuran', String(data.rekapAngsuran.totalTransaksi), true)
  baruLabelNilai(sh, 'Total Nominal Angsuran', formatRupiah(data.rekapAngsuran.totalNominal), true)
  baruLabelNilai(sh, 'Transaksi Paling Awal', tgl(data.rekapAngsuran.tanggalPalingAwal))
  baruLabelNilai(sh, 'Transaksi Paling Akhir', tgl(data.rekapAngsuran.tanggalPalingAkhir))
  sh.addRow([])

  if (data.rekapAngsuran.berdasarkanUrutan.length > 0) {
    rBaris = sh.rowCount + 1
    tulisHeaderHijau(sh, rBaris, ['Angsuran Ke-', 'Jumlah Transaksi', 'Total Nominal'])
    for (const u of data.rekapAngsuran.berdasarkanUrutan) {
      const row = sh.addRow([])
      selTeks(row, 1, `Angsuran ke-${u.ke}`)
      selAngka(row, 2, u.jumlahTransaksi)
      selRupiah(row, 3, u.nominal)
    }
    sh.addRow([])
  }

  if (data.rekapAngsuran.berdasarkanPeriode.length > 0) {
    rBaris = sh.rowCount + 1
    tulisHeaderHijau(sh, rBaris, ['Periode', 'Jumlah Transaksi', 'Total Nominal'])
    for (const per of data.rekapAngsuran.berdasarkanPeriode) {
      const row = sh.addRow([])
      selTeks(row, 1, labelPeriode(per.periode))
      selAngka(row, 2, per.jumlahTransaksi)
      selRupiah(row, 3, per.nominal)
    }
    sh.addRow([])
  }

  // ---------- 5. Rekap Pelunasan ----------
  rBaris = sh.rowCount + 1
  tulisSectionTitle(sh, rBaris, 'REKAP PELUNASAN', LEBAR_TABEL)
  rBaris = sh.rowCount + 1
  tulisHeaderHijau(sh, rBaris, ['Kategori', 'Jumlah Peserta Lunas', 'Total Nominal Pelunasan'])
  for (const k of data.kategori) {
    const row = sh.addRow([])
    selTeks(row, 1, k.label)
    selAngka(row, 2, k.jumlahLunas)
    selRupiah(row, 3, k.totalPelunasan)
  }
  {
    const row = sh.addRow([])
    selTeks(row, 1, data.total.label, { bold: true })
    selAngka(row, 2, data.total.jumlahLunas, { bold: true })
    selRupiah(row, 3, data.total.totalPelunasan, { bold: true })
    row.eachCell(c => { c.border = { ...thinBorder(), top: { style: 'medium', color: { argb: HIJAU_TUA } } }; c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEFECE3' } } })
  }
  sh.addRow([])

  // ---------- 6. Kesimpulan Keuangan ----------
  rBaris = sh.rowCount + 1
  tulisSectionTitle(sh, rBaris, 'KESIMPULAN KEUANGAN', LEBAR_TABEL)
  data.evaluasi.forEach((kalimat, i) => {
    const row = sh.addRow([])
    selTeks(row, 1, `${i + 1}. ${kalimat}`)
    sh.mergeCells(row.number, 1, row.number, LEBAR_TABEL)
  })

  autoFitSheet(sh, LEBAR_TABEL, { barisMulai: 6 }) // lewati 5 baris judul + 1 baris kosong di atas
  return wb.xlsx.writeBuffer()
}
