// =====================================================================
// Membangun file Excel "Laporan Keuangan {JENJANG}" dari
// LaporanKeuanganData (lihat lib/laporanKeuangan.ts) — satu workbook per
// jenjang, tidak pernah menggabungkan SMP/SMA/SMK.
//
// Gaya penulisannya sengaja dibuat sama persis dengan lib/laporanExcel.ts
// (judul singkat di A1, header tabel berlatar krem, border tipis) supaya
// kedua laporan terasa keluar dari sistem yang sama.
// =====================================================================

import ExcelJS from 'exceljs'
import type { LaporanKeuanganData } from './laporanKeuangan'

const HIJAU_TUA = 'FF123524'
const TEKS_GELAP = 'FF1F2937'
const HEADER_ROW_FILL = 'FFEFECE3'

const JENJANG_LABEL: Record<string, string> = { smp: 'SMP', sma: 'SMA', smk: 'SMK' }

const NAMA_BULAN = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']

function labelPeriode(p: string) {
  const [th, bl] = p.split('-')
  return `${NAMA_BULAN[Number(bl) - 1] ?? bl} ${th}`
}

function thinBorder(): Partial<ExcelJS.Borders> {
  const s = { style: 'thin' as const, color: { argb: 'FFD6D3CA' } }
  return { top: s, left: s, bottom: s, right: s }
}

function tulisJudul(sheet: ExcelJS.Worksheet, data: LaporanKeuanganData, judul: string) {
  const cell = sheet.getCell(1, 1)
  cell.value = `${judul} — ${JENJANG_LABEL[data.jenjang]} — TA ${data.tahunAjaran.nama}`
  cell.font = { bold: true, size: 12, color: { argb: HIJAU_TUA } }
  return 2
}

function tabelHeader(sheet: ExcelJS.Worksheet, rowIdx: number, headers: string[]) {
  const row = sheet.getRow(rowIdx)
  headers.forEach((h, i) => {
    const cell = row.getCell(i + 1)
    cell.value = h
    cell.font = { bold: true, color: { argb: HIJAU_TUA }, size: 10.5 }
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: HEADER_ROW_FILL } }
    cell.alignment = { vertical: 'middle', horizontal: 'center' }
    cell.border = thinBorder()
  })
  row.height = 18
  return rowIdx + 1
}

function isiBaris(sheet: ExcelJS.Worksheet, values: (string | number)[]) {
  const row = sheet.addRow(values)
  row.eachCell(cell => {
    cell.font = { size: 10.5, color: { argb: TEKS_GELAP } }
    cell.border = thinBorder()
    cell.alignment = { vertical: 'middle' }
    // Nominal rupiah diformat sebagai ANGKA, bukan teks — supaya bendahara
    // bisa langsung menjumlah/memfilter di Excel.
    if (typeof cell.value === 'number' && cell.value > 1000) {
      cell.numFmt = '#,##0'
      cell.alignment = { vertical: 'middle', horizontal: 'right' }
    }
  })
  return row
}

function lebarKolom(sheet: ExcelJS.Worksheet, lebar: number[]) {
  lebar.forEach((w, i) => { sheet.getColumn(i + 1).width = w })
}

export async function buatWorkbookLaporanKeuangan(data: LaporanKeuanganData): Promise<ExcelJS.Buffer> {
  const wb = new ExcelJS.Workbook()
  wb.creator = 'SPMB Admin Citra Negara'
  wb.created = new Date()

  // ---------- Ringkasan ----------
  {
    const sh = wb.addWorksheet('Ringkasan')
    lebarKolom(sh, [38, 22])
    let r = tulisJudul(sh, data, 'Laporan Keuangan SPMB')
    r = tabelHeader(sh, r, ['Keterangan', 'Nilai'])
    sh.getRow(r - 1)
    const g = data.ringkasan
    const baris: [string, string | number][] = [
      ['Jumlah pendaftar', g.jumlahPendaftar],
      ['Total tagihan', g.totalTagihan],
      ['Total sudah dibayar', g.totalDibayar],
      ['Total belum tertagih', g.totalSisa],
      ['Total pengembalian dana (refund)', g.totalRefund],
      ['Total alokasi ke pos lain', g.totalAlokasi],
      ['Persentase tertagih', `${g.persenTertagih}%`],
      ['Dicetak', new Date(data.generatedAt).toLocaleString('id-ID')],
    ]
    for (const b of baris) isiBaris(sh, b)
  }

  // ---------- Status pembayaran ----------
  {
    const sh = wb.addWorksheet('Status Pembayaran')
    lebarKolom(sh, [26, 12, 12, 20])
    let r = tulisJudul(sh, data, 'Status Pembayaran')
    r = tabelHeader(sh, r, ['Status', 'Jumlah', 'Persen', 'Sisa Tagihan'])
    for (const s of data.statusBayar) isiBaris(sh, [s.label, s.jumlah, `${s.persen}%`, s.nominalSisa])
  }

  // ---------- Per gelombang ----------
  {
    const sh = wb.addWorksheet('Per Gelombang')
    lebarKolom(sh, [26, 12, 18, 18, 18])
    let r = tulisJudul(sh, data, 'Keuangan per Gelombang')
    r = tabelHeader(sh, r, ['Gelombang', 'Pendaftar', 'Tagihan', 'Dibayar', 'Sisa'])
    for (const g of data.perGelombang) isiBaris(sh, [g.nama, g.jumlah, g.tagihan, g.dibayar, g.sisa])
  }

  // ---------- Per jurusan / kelas ----------
  {
    const judul = data.jenjang === 'smk' ? 'Keuangan per Program Keahlian' : 'Keuangan per Kelas'
    const sh = wb.addWorksheet(data.jenjang === 'smk' ? 'Per Program Keahlian' : 'Per Kelas')
    lebarKolom(sh, [40, 12, 18, 18])
    let r = tulisJudul(sh, data, judul)
    r = tabelHeader(sh, r, [data.jenjang === 'smk' ? 'Program Keahlian' : 'Kelas', 'Pendaftar', 'Tagihan', 'Dibayar'])
    for (const p of data.perPilihan) isiBaris(sh, [p.label, p.jumlah, p.tagihan, p.dibayar])
  }

  // ---------- Kas masuk bulanan ----------
  {
    const sh = wb.addWorksheet('Kas Masuk')
    lebarKolom(sh, [20, 20, 16])
    let r = tulisJudul(sh, data, 'Kas Masuk per Bulan')
    r = tabelHeader(sh, r, ['Periode', 'Nominal', 'Jumlah Transaksi'])
    if (data.kasMasuk.length === 0) isiBaris(sh, ['Belum ada pembayaran terverifikasi', '', ''])
    for (const k of data.kasMasuk) isiBaris(sh, [labelPeriode(k.periode), k.nominal, k.jumlahTransaksi])
  }

  // ---------- Metode pembayaran ----------
  {
    const sh = wb.addWorksheet('Metode Pembayaran')
    lebarKolom(sh, [24, 16, 20])
    let r = tulisJudul(sh, data, 'Bauran Metode Pembayaran')
    r = tabelHeader(sh, r, ['Metode', 'Jumlah Transaksi', 'Nominal'])
    for (const m of data.metode) isiBaris(sh, [m.label, m.jumlah, m.nominal])
  }

  // ---------- Tunggakan ----------
  {
    const sh = wb.addWorksheet('Tunggakan')
    lebarKolom(sh, [20, 16, 20])
    let r = tulisJudul(sh, data, 'Umur Tunggakan')
    r = tabelHeader(sh, r, ['Rentang Umur', 'Jumlah Pendaftar', 'Nominal Sisa'])
    if (data.tunggakan.length === 0) isiBaris(sh, ['Tidak ada tunggakan', '', ''])
    for (const t of data.tunggakan) isiBaris(sh, [t.rentang, t.jumlah, t.nominal])
  }

  // ---------- Evaluasi ----------
  {
    const sh = wb.addWorksheet('Evaluasi')
    lebarKolom(sh, [6, 96])
    let r = tulisJudul(sh, data, 'Catatan Evaluasi')
    r = tabelHeader(sh, r, ['No', 'Catatan'])
    data.evaluasi.forEach((e, i) => isiBaris(sh, [i + 1, e]))
  }

  return wb.xlsx.writeBuffer()
}
