// Perkakas gaya Excel BERSAMA — dipakai semua export .xlsx yang dibangun di
// BROWSER (tombol-tombol di halaman Pendaftar: Export Biodata, Export
// Keuangan) maupun di server (lib/laporanKeuanganExcel.ts). SENGAJA murni
// (cuma import 'exceljs', tanpa prisma/server-only) supaya aman dipakai
// langsung dari client component.
//
// Hanya fitur XLSX dasar yang dipakai di sini (border tipis, fill warna,
// bold, alignment, wrapText, mergeCells, lebar kolom) — semuanya didukung
// luas oleh Excel (semua versi), LibreOffice Calc, Google Sheets, dan Apple
// Numbers, jadi filenya tetap terbuka rapi di aplikasi apa pun.

import ExcelJS from 'exceljs'

export const HIJAU_TUA = 'FF123524'
export const TEKS_GELAP = 'FF1F2937'
export const HIJAU_MUDA_FILL = 'FFC6E0B4'
export const HIJAU_MUDA_TEKS = 'FF375623'

export function thinBorder(): Partial<ExcelJS.Borders> {
  const s = { style: 'thin' as const, color: { argb: 'FFD6D3CA' } }
  return { top: s, left: s, bottom: s, right: s }
}

/** Judul di baris 1, di-merge selebar tabel & rata tengah. Mengembalikan nomor baris berikutnya (selalu 2). */
export function tulisJudulTengah(sheet: ExcelJS.Worksheet, teks: string, jumlahKolom: number): number {
  const cell = sheet.getCell(1, 1)
  cell.value = teks
  cell.font = { bold: true, size: 12, color: { argb: HIJAU_TUA } }
  cell.alignment = { vertical: 'middle', horizontal: 'center' }
  if (jumlahKolom > 1) sheet.mergeCells(1, 1, 1, jumlahKolom)
  return 2
}

/** Baris header hijau muda, bold, rata tengah, border tipis. Mengembalikan nomor baris berikutnya. */
export function tulisHeaderHijau(sheet: ExcelJS.Worksheet, rowIdx: number, headers: string[]): number {
  const row = sheet.getRow(rowIdx)
  headers.forEach((h, i) => {
    const cell = row.getCell(i + 1)
    cell.value = h
    cell.font = { bold: true, color: { argb: HIJAU_MUDA_TEKS }, size: 10.5 }
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: HIJAU_MUDA_FILL } }
    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true }
    cell.border = thinBorder()
  })
  return rowIdx + 1
}

/** Satu baris data — rata tengah, border tipis, wrapText (row auto-tinggi mengikuti isi terpanjang saat dibuka). */
export function isiBarisTengah(sheet: ExcelJS.Worksheet, values: (string | number)[]) {
  const row = sheet.addRow(values)
  row.eachCell(cell => {
    cell.font = { size: 10.5, color: { argb: TEKS_GELAP } }
    cell.border = thinBorder()
    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true }
    if (typeof cell.value === 'number' && cell.value > 1000) cell.numFmt = '#,##0'
  })
  return row
}

/** Baris TOTAL — bold, border atas tebal, sedikit latar beda supaya tegas dibanding baris biasa. */
export function isiBarisTotal(sheet: ExcelJS.Worksheet, values: (string | number)[]) {
  const row = sheet.addRow(values)
  row.eachCell(cell => {
    cell.font = { size: 10.5, bold: true, color: { argb: TEKS_GELAP } }
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEFECE3' } }
    cell.border = { ...thinBorder(), top: { style: 'medium', color: { argb: 'FF123524' } } }
    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true }
    if (typeof cell.value === 'number' && cell.value > 1000) cell.numFmt = '#,##0'
  })
  return row
}

// Banner judul SECTION (mis. "RINGKASAN KEUANGAN", "REKAP ANGSURAN") — hijau
// tua berlatar penuh + teks putih, di-merge selebar tabel, supaya tiap blok
// dalam satu sheet yang sama jelas batasnya dan tidak "bertabrakan" dengan
// blok lain di atas/bawahnya. Mengembalikan nomor baris berikutnya.
export function tulisSectionTitle(sheet: ExcelJS.Worksheet, rowIdx: number, teks: string, jumlahKolom: number): number {
  const row = sheet.getRow(rowIdx)
  const cell = row.getCell(1)
  cell.value = teks
  cell.font = { bold: true, size: 11, color: { argb: 'FFFFFFFF' } }
  cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: HIJAU_TUA } }
  cell.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 }
  row.height = 20
  if (jumlahKolom > 1) {
    sheet.mergeCells(rowIdx, 1, rowIdx, jumlahKolom)
    // Sel-sel lain dalam rentang merge tetap perlu fill sendiri-sendiri di
    // beberapa versi Excel/LibreOffice supaya tidak ada "celah" putih kalau
    // baris di atasnya sempat di-resize — aman ditulis eksplisit.
    for (let i = 2; i <= jumlahKolom; i++) {
      row.getCell(i).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: HIJAU_TUA } }
    }
  }
  return rowIdx + 1
}

/** Baris kosong pemisah antar-blok, supaya tabel yang berurutan tidak terasa "bertabrakan". */
export function baruKosong(sheet: ExcelJS.Worksheet): number {
  sheet.addRow([])
  return sheet.rowCount + 1
}

// Lebar kolom auto-fit menyesuaikan isi sendiri. Memindai baris-per-baris
// (bukan sheet.columns.forEach/Column.eachCell) dan menulis lewat
// sheet.getColumn(i).width per indeks eksplisit — exceljs's `sheet.columns`
// adalah array LAZY yang populasinya tidak selalu konsisten, dan pada
// percobaan nyata sebagian kolom berakhir dengan width tidak tertulis ke
// file kalau dipindai lewat situ. barisMulai default 2 (lewati baris judul
// di baris 1 — kalau ikut dipindai, kolom pertama jadi ikut selebar
// kalimat judul, bukan selebar isinya sendiri).
export function autoFitSheet(
  sheet: ExcelJS.Worksheet,
  jumlahKolom: number,
  opts: { minLebar?: number; maksLebar?: number; barisMulai?: number } = {},
) {
  // 10, bukan 9: exceljs punya DEFAULT_COLUMN_WIDTH = 9 persis, dan diam-diam
  // tidak menuliskan atribut width ke file kalau nilainya kebetulan pas sama
  // ("dianggap sudah default"). Hasil akhirnya di Excel toh identik, tapi
  // 10 membuat penulisannya konsisten & gampang diverifikasi.
  const minLebar = opts.minLebar ?? 10
  const maksLebar = opts.maksLebar ?? 40
  const barisMulai = opts.barisMulai ?? 2
  for (let i = 1; i <= jumlahKolom; i++) {
    let panjangMaks = 0
    for (let r = barisMulai; r <= sheet.rowCount; r++) {
      const v = sheet.getRow(r).getCell(i).value
      const teks = v == null ? '' : v instanceof Date ? v.toLocaleDateString('id-ID') : String(v)
      const terpanjang = teks.length === 0 ? 0 : Math.max(...teks.split('\n').map(s => s.length))
      panjangMaks = Math.max(panjangMaks, terpanjang)
    }
    sheet.getColumn(i).width = Math.min(Math.max(panjangMaks + 2, minLebar), maksLebar)
  }
  // Tinggi baris SENGAJA tidak dipatok angka tetap: dengan wrapText aktif,
  // Excel/Sheets menghitung ulang tinggi baris sendiri saat file dibuka
  // mengikuti isi yang terpanjang di baris itu.
}

export interface WorkbookTabelHijau {
  /** Kalimat lengkap, sudah termasuk cakupan (jenjang/sumber/TA) — ditulis apa adanya di baris judul. */
  judul: string
  headers: string[]
  rows: (string | number)[][]
  /** Ditampilkan kalau `rows` kosong. */
  pesanKosong?: string
}

// Satu sheet lengkap (judul rata tengah di-merge, header hijau muda, isi
// rata tengah, auto-fit kolom) dari judul+header+baris polos — dipakai
// tombol-tombol export di halaman Pendaftar (Export Biodata, Export
// Keuangan) supaya gayanya konsisten tanpa menulis ulang boilerplate yang
// sama tiap kali.
export async function buatWorkbookTabelHijau(data: WorkbookTabelHijau, namaSheet = 'Data'): Promise<ExcelJS.Buffer> {
  const wb = new ExcelJS.Workbook()
  wb.creator = 'SPMB Admin Citra Negara'
  wb.created = new Date()

  const sh = wb.addWorksheet(namaSheet)
  tulisJudulTengah(sh, data.judul, data.headers.length)
  tulisHeaderHijau(sh, 2, data.headers)

  if (data.rows.length === 0) {
    const kosong = sh.addRow([data.pesanKosong || 'Tidak ada data yang cocok dengan filter ini'])
    sh.mergeCells(kosong.number, 1, kosong.number, data.headers.length)
    kosong.getCell(1).alignment = { horizontal: 'center' }
    kosong.getCell(1).font = { italic: true, size: 10.5, color: { argb: TEKS_GELAP } }
  }
  for (const r of data.rows) isiBarisTengah(sh, r)

  autoFitSheet(sh, data.headers.length)
  return wb.xlsx.writeBuffer()
}
