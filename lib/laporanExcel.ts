// =====================================================================
// Membangun file Excel "Laporan SPMB {JENJANG}" dari LaporanData (lihat
// lib/laporanSpmb.ts) — satu workbook per jenjang, tidak pernah
// menggabungkan SMP/SMA/SMK. Dipakai oleh app/api/admin/laporan/export.
// =====================================================================

import ExcelJS from 'exceljs'
import { YAYASAN_INFO } from './biaya'
import type { LaporanData } from './laporanSpmb'

const HIJAU_TUA = 'FF123524'
const HIJAU_GELAP = 'FF0B2A1C'
const GOLD = 'FFC8973A'
const CREAM = 'FFFAF7F0'
const PUTIH = 'FFFFFFFF'
const TEKS_GELAP = 'FF1F2937'

const JENJANG_LABEL: Record<string, string> = { smp: 'SMP', sma: 'SMA', smk: 'SMK' }

function formatRupiah(n: number) {
  return 'Rp' + n.toLocaleString('id-ID')
}

// Header identitas sekolah + judul laporan — dipakai di setiap sheet biar
// tetap jelas ini laporan resmi jenjang & tahun ajaran yang mana.
function tulisKopSurat(sheet: ExcelJS.Worksheet, data: LaporanData, judulSheet: string, lebarKolom: number) {
  sheet.mergeCells(1, 1, 1, lebarKolom)
  const baris1 = sheet.getCell(1, 1)
  baris1.value = 'SMK CITRA NEGARA — SISTEM PENERIMAAN MURID BARU (SPMB)'
  baris1.font = { bold: true, size: 13, color: { argb: PUTIH } }
  baris1.alignment = { horizontal: 'center', vertical: 'middle' }
  sheet.getRow(1).height = 22

  sheet.mergeCells(2, 1, 2, lebarKolom)
  const baris2 = sheet.getCell(2, 1)
  baris2.value = `${judulSheet} — Jenjang ${JENJANG_LABEL[data.jenjang]} — TA ${data.tahunAjaran.nama}`
  baris2.font = { bold: true, size: 11, color: { argb: PUTIH } }
  baris2.alignment = { horizontal: 'center', vertical: 'middle' }
  sheet.getRow(2).height = 20

  for (let c = 1; c <= lebarKolom; c++) {
    sheet.getCell(1, c).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: HIJAU_TUA } }
    sheet.getCell(2, c).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: HIJAU_GELAP } }
  }

  sheet.mergeCells(3, 1, 3, lebarKolom)
  const baris3 = sheet.getCell(3, 1)
  baris3.value = `Dicetak: ${new Date(data.generatedAt).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`
  baris3.font = { italic: true, size: 9, color: { argb: 'FF6B7280' } }
  baris3.alignment = { horizontal: 'center' }
  sheet.getRow(3).height = 16

  sheet.addRow([])
  return 5 // baris berikutnya yang kosong, siap dipakai konten
}

function tabelHeader(sheet: ExcelJS.Worksheet, rowIdx: number, headers: string[]) {
  const row = sheet.getRow(rowIdx)
  headers.forEach((h, i) => {
    const cell = row.getCell(i + 1)
    cell.value = h
    cell.font = { bold: true, color: { argb: PUTIH }, size: 10.5 }
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: HIJAU_TUA } }
    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true }
    cell.border = thinBorder()
  })
  row.height = 20
  sheet.views = [{ state: 'frozen', ySplit: rowIdx }]
}

function thinBorder(): Partial<ExcelJS.Borders> {
  const style: ExcelJS.BorderStyle = 'thin'
  return {
    top: { style, color: { argb: 'FFE5E7EB' } },
    left: { style, color: { argb: 'FFE5E7EB' } },
    bottom: { style, color: { argb: 'FFE5E7EB' } },
    right: { style, color: { argb: 'FFE5E7EB' } },
  }
}

function isiBaris(sheet: ExcelJS.Worksheet, values: (string | number)[], zebra: boolean) {
  const row = sheet.addRow(values)
  row.eachCell(cell => {
    cell.border = thinBorder()
    cell.font = { size: 10.5, color: { argb: TEKS_GELAP } }
    if (zebra) cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: CREAM } }
  })
  return row
}

export async function buatWorkbookLaporan(data: LaporanData): Promise<ExcelJS.Buffer> {
  const wb = new ExcelJS.Workbook()
  wb.creator = 'SPMB Citra Negara'
  wb.created = new Date()

  // ── Sheet 1: RINGKASAN ────────────────────────────────────────────
  const sRingkasan = wb.addWorksheet('Ringkasan')
  sRingkasan.columns = [{ width: 34 }, { width: 22 }]
  let r = tulisKopSurat(sRingkasan, data, 'Laporan Analitik SPMB', 2)

  const tambahBaris = (label: string, nilai: string | number, tebal = false) => {
    const row = sRingkasan.addRow([label, nilai])
    row.getCell(1).font = { bold: tebal, size: 10.5, color: { argb: TEKS_GELAP } }
    row.getCell(2).font = { bold: tebal, size: 10.5, color: { argb: HIJAU_TUA } }
    row.getCell(2).alignment = { horizontal: 'right' }
  }

  sRingkasan.getCell(r, 1).value = 'INFORMASI LAPORAN'
  sRingkasan.getCell(r, 1).font = { bold: true, size: 11, color: { argb: GOLD } }
  r += 1
  tambahBaris('Nama Sekolah', 'SMK Citra Negara')
  tambahBaris('Naungan', YAYASAN_INFO.nama)
  tambahBaris('Jenjang', JENJANG_LABEL[data.jenjang])
  tambahBaris('Tahun Ajaran', `${data.tahunAjaran.nama}${data.tahunAjaran.aktif ? ' (Aktif)' : ' (Tidak Aktif)'}`)
  sRingkasan.addRow([])

  sRingkasan.addRow(['RINGKASAN SPMB']).getCell(1).font = { bold: true, size: 11, color: { argb: GOLD } }
  tambahBaris('Total Pendaftar', data.ringkasan.total, true)
  tambahBaris('Sedang Diverifikasi', data.ringkasan.sedangDiverifikasi)
  tambahBaris('Diterima', data.ringkasan.diterima)
  tambahBaris('Ditolak', data.ringkasan.ditolak)
  tambahBaris('Sudah Daftar Ulang', data.ringkasan.daftarUlang)
  tambahBaris('Masih Diproses (Draft)', data.ringkasan.masihDiproses)
  sRingkasan.addRow([])

  sRingkasan.addRow(['RINGKASAN PEMBAYARAN']).getCell(1).font = { bold: true, size: 11, color: { argb: GOLD } }
  tambahBaris('Total Tagihan', formatRupiah(data.pembayaran.totalTagihan), true)
  tambahBaris('Total Pembayaran Masuk', formatRupiah(data.pembayaran.totalDibayar), true)
  tambahBaris('Lunas', data.pembayaran.lunas)
  tambahBaris('Cicilan Berjalan', data.pembayaran.cicilan)
  tambahBaris('Menunggu Verifikasi', data.pembayaran.menunggu)
  tambahBaris('Belum Bayar', data.pembayaran.belumBayar)
  tambahBaris('Total Dana Dikembalikan', formatRupiah(data.pembayaran.totalRefund))
  sRingkasan.addRow([])

  sRingkasan.addRow(['RINGKASAN EVALUASI']).getCell(1).font = { bold: true, size: 11, color: { argb: GOLD } }
  data.evaluasi.forEach(kalimat => {
    const row = sRingkasan.addRow([`• ${kalimat}`])
    sRingkasan.mergeCells(row.number, 1, row.number, 2)
    row.getCell(1).font = { size: 10, italic: true, color: { argb: TEKS_GELAP } }
    row.getCell(1).alignment = { wrapText: true }
  })

  // ── Sheet 2: Analisis Minat (Jurusan untuk SMK, Kelas untuk SMP/SMA) ─
  if (data.jenjang === 'smk' && data.minatJurusan) {
    const s = wb.addWorksheet('Minat Program Keahlian')
    s.columns = [{ width: 40 }, { width: 14 }, { width: 14 }, { width: 10 }]
    const rr = tulisKopSurat(s, data, 'Analisis Minat Program Keahlian', 4)
    tabelHeader(s, rr, ['Program Keahlian', 'Pendaftar', 'Persentase', 'Ranking'])
    data.minatJurusan.forEach((row, i) => {
      const line = isiBaris(s, [row.label, row.jumlah, row.persen, row.ranking], i % 2 === 1)
      line.getCell(3).numFmt = '0.0"%"'
    })

    const sKelas = wb.addWorksheet('Analisis Kelas')
    sKelas.columns = [{ width: 30 }, { width: 14 }, { width: 14 }, { width: 10 }]
    const rk = tulisKopSurat(sKelas, data, 'Minat Berdasarkan Kelas', 4)
    tabelHeader(sKelas, rk, ['Kelas', 'Pendaftar', 'Persentase', 'Ranking'])
    data.minatKelas.forEach((row, i) => {
      const line = isiBaris(sKelas, [row.label, row.jumlah, row.persen, row.ranking], i % 2 === 1)
      line.getCell(3).numFmt = '0.0"%"'
    })
  } else if (data.minatKelas.length > 0) {
    const s = wb.addWorksheet('Minat Kelas')
    s.columns = [{ width: 30 }, { width: 14 }, { width: 14 }, { width: 10 }]
    const rr = tulisKopSurat(s, data, 'Minat Berdasarkan Kelas', 4)
    tabelHeader(s, rr, ['Kelas', 'Pendaftar', 'Persentase', 'Ranking'])
    data.minatKelas.forEach((row, i) => {
      const line = isiBaris(s, [row.label, row.jumlah, row.persen, row.ranking], i % 2 === 1)
      line.getCell(3).numFmt = '0.0"%"'
    })
  }

  // ── Sheet: Status Pendaftaran ────────────────────────────────────────
  {
    const s = wb.addWorksheet('Status Pendaftaran')
    s.columns = [{ width: 30 }, { width: 14 }, { width: 14 }]
    const rr = tulisKopSurat(s, data, 'Distribusi Status Pendaftaran', 3)
    tabelHeader(s, rr, ['Status', 'Jumlah', 'Persentase'])
    data.statusDistribusi.forEach((row, i) => {
      const line = isiBaris(s, [row.label, row.jumlah, row.persen], i % 2 === 1)
      line.getCell(3).numFmt = '0.0"%"'
    })
  }

  // ── Sheet: Tren Pendaftaran ──────────────────────────────────────────
  if (data.tren.length > 0) {
    const s = wb.addWorksheet('Tren Pendaftaran')
    s.columns = [{ width: 20 }, { width: 16 }]
    const rr = tulisKopSurat(s, data, 'Tren Pendaftaran', 2)
    tabelHeader(s, rr, ['Periode', 'Jumlah Pendaftar'])
    data.tren.forEach((row, i) => isiBaris(s, [row.periode, row.jumlah], i % 2 === 1))
    s.addRow([])
    if (data.trenInsight.ramai) s.addRow([`Periode paling ramai: ${data.trenInsight.ramai.periode} (${data.trenInsight.ramai.jumlah} pendaftar)`]).getCell(1).font = { italic: true, size: 10 }
    if (data.trenInsight.sepi) s.addRow([`Periode paling sepi: ${data.trenInsight.sepi.periode} (${data.trenInsight.sepi.jumlah} pendaftar)`]).getCell(1).font = { italic: true, size: 10 }
  }

  // ── Sheet: Asal Sekolah ──────────────────────────────────────────────
  if (data.asalSekolah.length > 0) {
    const s = wb.addWorksheet('Asal Sekolah')
    s.columns = [{ width: 40 }, { width: 16 }, { width: 10 }]
    const rr = tulisKopSurat(s, data, 'Asal Sekolah Pendaftar (Top 10)', 3)
    tabelHeader(s, rr, ['Asal Sekolah', 'Jumlah Pendaftar', 'Ranking'])
    data.asalSekolah.forEach((row, i) => isiBaris(s, [row.label, row.jumlah, row.ranking], i % 2 === 1))
  }

  // ── Sheet: Jenis Kelamin ─────────────────────────────────────────────
  if (data.genderKomposisi.length > 0) {
    const s = wb.addWorksheet('Jenis Kelamin')
    s.columns = [{ width: 20 }, { width: 14 }, { width: 14 }]
    const rr = tulisKopSurat(s, data, 'Komposisi Jenis Kelamin', 3)
    tabelHeader(s, rr, ['Jenis Kelamin', 'Jumlah', 'Persentase'])
    data.genderKomposisi.forEach((row, i) => {
      const line = isiBaris(s, [row.label, row.jumlah, row.persen], i % 2 === 1)
      line.getCell(3).numFmt = '0.0"%"'
    })
  }

  // ── Sheet: Pembayaran ────────────────────────────────────────────────
  {
    const s = wb.addWorksheet('Pembayaran')
    s.columns = [{ width: 28 }, { width: 16 }, { width: 20 }]
    const rr = tulisKopSurat(s, data, 'Ringkasan Pembayaran', 3)
    tabelHeader(s, rr, ['Status Pembayaran', 'Jumlah Pendaftar', 'Nominal'])
    const p = data.pembayaran
    const baris: [string, number, number][] = [
      ['Lunas', p.lunas, p.totalDibayar],
      ['Cicilan Berjalan', p.cicilan, 0],
      ['Menunggu Verifikasi', p.menunggu, 0],
      ['Belum Bayar', p.belumBayar, 0],
      ['Ditolak', p.ditolakBayar, 0],
    ]
    baris.forEach(([label, jumlah, nominal], i) => {
      const line = isiBaris(s, [label, jumlah, nominal], i % 2 === 1)
      line.getCell(3).numFmt = '"Rp"#,##0'
    })
    s.addRow([])
    const totalRow = isiBaris(s, ['Total Tagihan Keseluruhan', '', p.totalTagihan], false)
    totalRow.getCell(3).numFmt = '"Rp"#,##0'
    totalRow.eachCell(c => { c.font = { bold: true, size: 10.5 } })
    if (p.totalRefund > 0) {
      const refundRow = isiBaris(s, ['Total Dana Dikembalikan', '', p.totalRefund], false)
      refundRow.getCell(3).numFmt = '"Rp"#,##0'
    }
  }

  // ── Sheet: Gelombang ─────────────────────────────────────────────────
  if (data.gelombang.length > 0) {
    const s = wb.addWorksheet('Gelombang')
    s.columns = [{ width: 26 }, { width: 14 }, { width: 14 }, { width: 16 }, { width: 12 }]
    const rr = tulisKopSurat(s, data, 'Performa Gelombang Pendaftaran', 5)
    tabelHeader(s, rr, ['Gelombang', 'Jumlah Pendaftar', 'Persentase', 'Terverifikasi', 'Diterima'])
    data.gelombang.forEach((row, i) => {
      const line = isiBaris(s, [row.nama, row.jumlah, row.persen, row.verified, row.diterima], i % 2 === 1)
      line.getCell(3).numFmt = '0.0"%"'
    })
  }

  return wb.xlsx.writeBuffer()
}
