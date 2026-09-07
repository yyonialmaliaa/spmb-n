// =====================================================================
// Membangun file Excel "Laporan SPMB {JENJANG}" dari LaporanData (lihat
// lib/laporanSpmb.ts) — satu workbook per jenjang, tidak pernah
// menggabungkan SMP/SMA/SMK. Dipakai oleh app/api/admin/laporan/export.
//
// Sengaja dibuat seperti spreadsheet biasa (bukan gaya kop surat/kertas
// cetak) — cukup judul sheet singkat + tabel dengan header rapi.
// =====================================================================

import ExcelJS from 'exceljs'
import { YAYASAN_INFO } from './biaya'
import { JENJANG_LABEL_FULL } from './labels'
import type { LaporanData } from './laporanSpmb'

const HIJAU_TUA = 'FF123524'
const GOLD_TEXT = 'FF92681A'
const TEKS_GELAP = 'FF1F2937'
const HEADER_ROW_FILL = 'FFEFECE3'

const JENJANG_LABEL: Record<string, string> = { smp: 'SMP', sma: 'SMA', smk: 'SMK' }

function formatRupiah(n: number) {
  return 'Rp' + n.toLocaleString('id-ID')
}

// Judul singkat, cukup di sel A1 saja (bukan merge memanjang ke semua
// kolom) — isi tabel langsung mulai di baris berikutnya, sama seperti
// export Biodata (app/admin/pendaftar) yang polos tanpa jarak/kop surat.
function tulisJudul(sheet: ExcelJS.Worksheet, data: LaporanData, judul: string) {
  const cell = sheet.getCell(1, 1)
  cell.value = `${judul} — ${JENJANG_LABEL[data.jenjang]} — TA ${data.tahunAjaran.nama}`
  cell.font = { bold: true, size: 12, color: { argb: HIJAU_TUA } }
  return 2 // baris berikutnya, siap dipakai header tabel
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

function isiBaris(sheet: ExcelJS.Worksheet, values: (string | number)[]) {
  const row = sheet.addRow(values)
  row.eachCell(cell => {
    cell.border = thinBorder()
    cell.font = { size: 10.5, color: { argb: TEKS_GELAP } }
  })
  return row
}

export async function buatWorkbookLaporan(data: LaporanData): Promise<ExcelJS.Buffer> {
  const wb = new ExcelJS.Workbook()
  wb.creator = 'SPMB Citra Negara'
  wb.created = new Date()

  // ── Sheet 1: RINGKASAN ────────────────────────────────────────────
  const sRingkasan = wb.addWorksheet('Ringkasan')
  sRingkasan.columns = [{ width: 32 }, { width: 22 }]
  tulisJudul(sRingkasan, data, 'Laporan Analitik SPMB')

  const tambahBaris = (label: string, nilai: string | number, tebal = false) => {
    const row = sRingkasan.addRow([label, nilai])
    row.getCell(1).font = { bold: tebal, size: 10.5, color: { argb: TEKS_GELAP } }
    row.getCell(2).font = { bold: tebal, size: 10.5, color: { argb: TEKS_GELAP } }
    row.getCell(2).alignment = { horizontal: 'right' }
  }
  const judulSeksi = (teks: string) => {
    const row = sRingkasan.addRow([teks])
    row.getCell(1).font = { bold: true, size: 10.5, color: { argb: GOLD_TEXT } }
  }

  judulSeksi('INFORMASI LAPORAN')
  // Nama sekolah mengikuti jenjang laporannya. Dulu dipatok "SMK Citra
  // Negara", sehingga laporan SMP dan SMA pun ikut tercetak sebagai SMK.
  tambahBaris('Nama Sekolah', JENJANG_LABEL_FULL[data.jenjang])
  tambahBaris('Naungan', YAYASAN_INFO.nama)
  tambahBaris('Jenjang', JENJANG_LABEL[data.jenjang])
  tambahBaris('Tahun Ajaran', `${data.tahunAjaran.nama}${data.tahunAjaran.aktif ? ' (Aktif)' : ' (Tidak Aktif)'}`)
  tambahBaris('Dicetak', new Date(data.generatedAt).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' }))
  sRingkasan.addRow([])

  judulSeksi('RINGKASAN SPMB')
  tambahBaris('Total Pendaftar', data.ringkasan.total, true)
  tambahBaris('Sedang Diverifikasi', data.ringkasan.sedangDiverifikasi)
  tambahBaris('Diterima', data.ringkasan.diterima)
  tambahBaris('Ditolak', data.ringkasan.ditolak)
  tambahBaris('Sudah Daftar Ulang', data.ringkasan.daftarUlang)
  tambahBaris('Masih Diproses (Draft)', data.ringkasan.masihDiproses)
  sRingkasan.addRow([])

  judulSeksi('RINGKASAN PEMBAYARAN')
  tambahBaris('Total Tagihan', formatRupiah(data.pembayaran.totalTagihan), true)
  tambahBaris('Total Pembayaran Masuk', formatRupiah(data.pembayaran.totalDibayar), true)
  tambahBaris('Lunas', data.pembayaran.lunas)
  tambahBaris('Cicilan Berjalan', data.pembayaran.cicilan)
  tambahBaris('Menunggu Verifikasi', data.pembayaran.menunggu)
  tambahBaris('Belum Bayar', data.pembayaran.belumBayar)
  tambahBaris('Total Dana Dikembalikan', formatRupiah(data.pembayaran.totalRefund))
  sRingkasan.addRow([])

  judulSeksi('RINGKASAN EVALUASI')
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
    const rr = tulisJudul(s, data, 'Analisis Minat Program Keahlian')
    tabelHeader(s, rr, ['Program Keahlian', 'Pendaftar', 'Persentase', 'Ranking'])
    data.minatJurusan.forEach(row => {
      const line = isiBaris(s, [row.label, row.jumlah, row.persen, row.ranking])
      line.getCell(3).numFmt = '0.0"%"'
    })

    const sKelas = wb.addWorksheet('Analisis Kelas')
    sKelas.columns = [{ width: 30 }, { width: 14 }, { width: 14 }, { width: 10 }]
    const rk = tulisJudul(sKelas, data, 'Minat Berdasarkan Kelas')
    tabelHeader(sKelas, rk, ['Kelas', 'Pendaftar', 'Persentase', 'Ranking'])
    data.minatKelas.forEach(row => {
      const line = isiBaris(sKelas, [row.label, row.jumlah, row.persen, row.ranking])
      line.getCell(3).numFmt = '0.0"%"'
    })
  } else if (data.minatKelas.length > 0) {
    const s = wb.addWorksheet('Minat Kelas')
    s.columns = [{ width: 30 }, { width: 14 }, { width: 14 }, { width: 10 }]
    const rr = tulisJudul(s, data, 'Minat Berdasarkan Kelas')
    tabelHeader(s, rr, ['Kelas', 'Pendaftar', 'Persentase', 'Ranking'])
    data.minatKelas.forEach(row => {
      const line = isiBaris(s, [row.label, row.jumlah, row.persen, row.ranking])
      line.getCell(3).numFmt = '0.0"%"'
    })
  }

  // ── Sheet: Status Pendaftaran ────────────────────────────────────────
  {
    const s = wb.addWorksheet('Status Pendaftaran')
    s.columns = [{ width: 30 }, { width: 14 }, { width: 14 }]
    const rr = tulisJudul(s, data, 'Distribusi Status Pendaftaran')
    tabelHeader(s, rr, ['Status', 'Jumlah', 'Persentase'])
    data.statusDistribusi.forEach(row => {
      const line = isiBaris(s, [row.label, row.jumlah, row.persen])
      line.getCell(3).numFmt = '0.0"%"'
    })
  }

  // ── Sheet: Tren Pendaftaran ──────────────────────────────────────────
  if (data.tren.length > 0) {
    const s = wb.addWorksheet('Tren Pendaftaran')
    s.columns = [{ width: 20 }, { width: 16 }]
    const rr = tulisJudul(s, data, 'Tren Pendaftaran')
    tabelHeader(s, rr, ['Periode', 'Jumlah Pendaftar'])
    data.tren.forEach(row => isiBaris(s, [row.periode, row.jumlah]))
    s.addRow([])
    if (data.trenInsight.ramai) s.addRow([`Periode paling ramai: ${data.trenInsight.ramai.periode} (${data.trenInsight.ramai.jumlah} pendaftar)`]).getCell(1).font = { italic: true, size: 10 }
    if (data.trenInsight.sepi) s.addRow([`Periode paling sepi: ${data.trenInsight.sepi.periode} (${data.trenInsight.sepi.jumlah} pendaftar)`]).getCell(1).font = { italic: true, size: 10 }
  }

  // ── Sheet: Asal Sekolah ──────────────────────────────────────────────
  if (data.asalSekolah.length > 0) {
    const s = wb.addWorksheet('Asal Sekolah')
    s.columns = [{ width: 40 }, { width: 16 }, { width: 10 }]
    const rr = tulisJudul(s, data, 'Asal Sekolah Pendaftar (Top 10)')
    tabelHeader(s, rr, ['Asal Sekolah', 'Jumlah Pendaftar', 'Ranking'])
    data.asalSekolah.forEach(row => isiBaris(s, [row.label, row.jumlah, row.ranking]))
  }

  // ── Sheet: Jenis Kelamin ─────────────────────────────────────────────
  if (data.genderKomposisi.length > 0) {
    const s = wb.addWorksheet('Jenis Kelamin')
    s.columns = [{ width: 20 }, { width: 14 }, { width: 14 }]
    const rr = tulisJudul(s, data, 'Komposisi Jenis Kelamin')
    tabelHeader(s, rr, ['Jenis Kelamin', 'Jumlah', 'Persentase'])
    data.genderKomposisi.forEach(row => {
      const line = isiBaris(s, [row.label, row.jumlah, row.persen])
      line.getCell(3).numFmt = '0.0"%"'
    })
  }

  // ── Sheet: Pembayaran ────────────────────────────────────────────────
  {
    const s = wb.addWorksheet('Pembayaran')
    s.columns = [{ width: 28 }, { width: 16 }, { width: 20 }]
    const rr = tulisJudul(s, data, 'Ringkasan Pembayaran')
    tabelHeader(s, rr, ['Status Pembayaran', 'Jumlah Pendaftar', 'Nominal'])
    const p = data.pembayaran
    const baris: [string, number, number][] = [
      ['Lunas', p.lunas, p.totalDibayar],
      ['Cicilan Berjalan', p.cicilan, 0],
      ['Menunggu Verifikasi', p.menunggu, 0],
      ['Belum Bayar', p.belumBayar, 0],
      ['Ditolak', p.ditolakBayar, 0],
    ]
    baris.forEach(([label, jumlah, nominal]) => {
      const line = isiBaris(s, [label, jumlah, nominal])
      line.getCell(3).numFmt = '"Rp"#,##0'
    })
    s.addRow([])
    const totalRow = isiBaris(s, ['Total Tagihan Keseluruhan', '', p.totalTagihan])
    totalRow.getCell(3).numFmt = '"Rp"#,##0'
    totalRow.eachCell(c => { c.font = { bold: true, size: 10.5 } })
    if (p.totalRefund > 0) {
      const refundRow = isiBaris(s, ['Total Dana Dikembalikan', '', p.totalRefund])
      refundRow.getCell(3).numFmt = '"Rp"#,##0'
    }
  }

  // ── Sheet: Gelombang ─────────────────────────────────────────────────
  if (data.gelombang.length > 0) {
    const s = wb.addWorksheet('Gelombang')
    s.columns = [{ width: 26 }, { width: 14 }, { width: 14 }, { width: 16 }, { width: 12 }]
    const rr = tulisJudul(s, data, 'Performa Gelombang Pendaftaran')
    tabelHeader(s, rr, ['Gelombang', 'Jumlah Pendaftar', 'Persentase', 'Terverifikasi', 'Diterima'])
    data.gelombang.forEach(row => {
      const line = isiBaris(s, [row.nama, row.jumlah, row.persen, row.verified, row.diterima])
      line.getCell(3).numFmt = '0.0"%"'
    })
  }

  return wb.xlsx.writeBuffer()
}
