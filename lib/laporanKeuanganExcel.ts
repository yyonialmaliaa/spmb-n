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
import type { RincianPendaftar, BarisExportKeuanganPendaftar } from './rincianKeuangan'
import { formatRupiah } from './pembayaran-utils'

// Bentuk data MINIMAL yang dibutuhkan sheet "Rincian Angsuran" dari export
// "Laporan Keuangan" (lib/laporanKeuangan.ts) — sengaja bukan
// LaporanKeuanganData penuh, hanya yang benar-benar dipakai sheet ini.
export interface RincianAngsuranSheetData {
  jenjang: 'smp' | 'sma' | 'smk'
  tahunAjaran: { nama: string }
  rincianPendaftar: RincianPendaftar[]
  maksAngsuran: number
}

const HIJAU_TUA = 'FF123524'
const TEKS_GELAP = 'FF1F2937'
const HEADER_ROW_FILL = 'FFEFECE3'

// Header hijau muda KHUSUS sheet Rincian Angsuran — meniru gaya spreadsheet
// keuangan manual yang sudah biasa dipakai bendahara sekolah (referensi
// format dari user), beda dari krem di sheet-sheet ringkasan lain di atas.
const HIJAU_MUDA_FILL = 'FFC6E0B4'
const HIJAU_MUDA_TEKS = 'FF375623'

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

// `jumlahKolom` opsional: kalau diisi, judul di-merge selebar tabel di
// bawahnya dan dirata-tengahkan (dipakai sheet Rincian Angsuran & Export
// Keuangan, yang lebarnya dinamis). Kalau tidak diisi, perilaku lama
// dipertahankan (cuma A1, rata kiri) — sheet ringkasan lain di bawah tidak
// disentuh oleh perubahan ini.
function tulisJudul(sheet: ExcelJS.Worksheet, data: { jenjang: string; tahunAjaran: { nama: string } }, judul: string, jumlahKolom?: number) {
  const cell = sheet.getCell(1, 1)
  cell.value = `${judul} — ${JENJANG_LABEL[data.jenjang]} — TA ${data.tahunAjaran.nama}`
  cell.font = { bold: true, size: 12, color: { argb: HIJAU_TUA } }
  if (jumlahKolom && jumlahKolom > 1) {
    sheet.mergeCells(1, 1, 1, jumlahKolom)
    cell.alignment = { vertical: 'middle', horizontal: 'center' }
  }
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
    cell.alignment = { vertical: 'middle', horizontal: 'center' }
    // Nominal rupiah diformat sebagai ANGKA, bukan teks — supaya bendahara
    // bisa langsung menjumlah/memfilter di Excel. Tetap rata tengah (bukan
    // rata kanan) supaya seluruh tabel konsisten.
    if (typeof cell.value === 'number' && cell.value > 1000) {
      cell.numFmt = '#,##0'
    }
  })
  return row
}

function lebarKolom(sheet: ExcelJS.Worksheet, lebar: number[]) {
  lebar.forEach((w, i) => { sheet.getColumn(i + 1).width = w })
}

// Lebar kolom & tinggi baris menyesuaikan isi sendiri ("auto fit") — dipakai
// khusus sheet Rincian Angsuran karena jumlah kolomnya dinamis (mengikuti
// gelombang cicilan terpanjang), jadi tidak bisa dipatok manual seperti
// sheet-sheet lain di atas. Dipanggil SETELAH semua baris ditulis.
//
// SENGAJA memindai baris-per-baris dgn sheet.getRow(r).getCell(i) (bukan
// sheet.columns.forEach + Column.eachCell) dan menulis lewat
// sheet.getColumn(i).width secara eksplisit per indeks 1..jumlahKolom —
// exceljs's `sheet.columns` adalah array LAZY (_columns) yang populasinya
// tergantung riwayat pemanggilan getColumn/getCell sebelumnya, dan pada
// percobaan nyata sebagian kolom (yang selnya kebetulan tidak pernah
// disentuh eachCell) berakhir dengan width tidak tertulis ke file. Memindai
// eksplisit per indeks kolom menghindari ketergantungan pada state itu.
function autoFitSheet(sheet: ExcelJS.Worksheet, jumlahKolom: number, opts: { minLebar?: number; maksLebar?: number; barisMulai?: number } = {}) {
  // 10, bukan 9: exceljs punya DEFAULT_COLUMN_WIDTH = 9 persis, dan diam-diam
  // TIDAK menuliskan atribut width ke file kalau nilainya kebetulan pas sama
  // (dianggap "sudah default, tidak perlu ditulis"). Lebar akhirnya di Excel
  // toh identik (9 memang defaultnya), tapi memakai 10 di sini membuat
  // penulisannya konsisten & mudah diverifikasi (tidak ada kolom yang
  // "diam-diam" tidak tertulis).
  const minLebar = opts.minLebar ?? 10
  const maksLebar = opts.maksLebar ?? 42
  // barisMulai default 2: baris 1 (judul, satu kalimat panjang di sel A1)
  // SENGAJA dilewati — kalau ikut dipindai, kolom "No" jadi selebar judulnya
  // sendiri (jauh lebih lebar dari isinya yang cuma angka 1-2 digit).
  const barisMulai = opts.barisMulai ?? 2
  for (let i = 1; i <= jumlahKolom; i++) {
    let panjangMaks = 0
    for (let r = barisMulai; r <= sheet.rowCount; r++) {
      const v = sheet.getRow(r).getCell(i).value
      const teks = v == null ? '' : v instanceof Date ? v.toLocaleDateString('id-ID') : String(v)
      // Baris berisi banyak baris teks (\n) -- ambil baris terpanjangnya saja.
      const terpanjang = teks.length === 0 ? 0 : Math.max(...teks.split('\n').map(s => s.length))
      panjangMaks = Math.max(panjangMaks, terpanjang)
    }
    sheet.getColumn(i).width = Math.min(Math.max(panjangMaks + 2, minLebar), maksLebar)
  }
  // Tinggi baris SENGAJA tidak dipatok angka tetap: dengan wrapText aktif
  // (diset per-sel saat menulis baris), Excel/Sheets menghitung ulang
  // tinggi baris sendiri saat file dibuka mengikuti isi yang terpanjang.
}

// Satu baris = satu pendaftar, dengan SELURUH riwayat angsurannya (bukan
// cuma total) — kolom "Angsuran N" dibuat dinamis mengikuti pendaftar
// dengan jumlah angsuran TERBANYAK (data.maksAngsuran), supaya siapa pun
// yang baru bayar sekali tidak memaksa kolom lain terpotong/kosong salah
// tempat, dan siapa pun yang sudah mengangsur belasan kali tetap tertampung.
//
// Diekspor (bukan private) supaya bisa dipanggil dari DUA tempat: sebagai
// salah satu sheet di buatWorkbookLaporanKeuangan di bawah, dan sendirian
// lewat buatWorkbookRincianAngsuran untuk tombol "Export Keuangan" di
// halaman Pendaftar (dibangun di browser, lihat PendaftarView.tsx).
export function tulisSheetRincianAngsuran(wb: ExcelJS.Workbook, data: RincianAngsuranSheetData, namaSheet = 'Rincian Angsuran') {
  const sh = wb.addWorksheet(namaSheet)
  const pakaiJurusan = data.jenjang === 'smk'
  const N = data.maksAngsuran

  const headers = [
    'No', pakaiJurusan ? 'Jurusan' : 'Kelas', 'Jenjang', 'Nama Siswa', 'L/P', 'Sekolah Asal',
    'Biaya Pendidikan', 'Potongan Biaya', 'Total Biaya',
    ...Array.from({ length: N }, (_, i) => `Angsuran ${i + 1}`),
    'Total Angsuran', 'Sisa Pembayaran', '%', 'Keterangan',
  ]

  const rBaris = tulisJudul(sh, data, 'Rincian Angsuran per Pendaftar', headers.length)
  const headerRow = sh.getRow(rBaris)
  headers.forEach((h, i) => {
    const cell = headerRow.getCell(i + 1)
    cell.value = h
    cell.font = { bold: true, color: { argb: HIJAU_MUDA_TEKS }, size: 10.5 }
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: HIJAU_MUDA_FILL } }
    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true }
    cell.border = thinBorder()
  })

  const iBiayaPendidikan = 7, iPotongan = 8, iTotalBiaya = 9
  const iTotalAngsuran = 10 + N, iSisa = iTotalAngsuran + 1, iPersen = iSisa + 1

  if (data.rincianPendaftar.length === 0) {
    const kosong = sh.addRow(['Belum ada pendaftar pada jenjang/tahun ajaran ini'])
    sh.mergeCells(kosong.number, 1, kosong.number, headers.length)
    kosong.getCell(1).alignment = { horizontal: 'center' }
    kosong.getCell(1).font = { italic: true, size: 10.5, color: { argb: TEKS_GELAP } }
  }

  for (const p of data.rincianPendaftar) {
    const nilaiAngsuran = Array.from({ length: N }, (_, i) => {
      const a = p.angsuran[i]
      if (!a) return ''
      const tgl = new Date(a.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
      return `${formatRupiah(a.nominal)} — ${tgl}`
    })
    const row = isiBaris(sh, [
      p.no, p.kelompok, p.jenjang, p.nama, p.jenisKelamin, p.asalSekolah,
      p.hargaPokok, p.potonganBiaya, p.totalTagihan,
      ...nilaiAngsuran,
      p.totalDibayar, p.sisaBayar, p.persenBayar / 100, p.keterangan,
    ])
    // Nominal Rupiah tetap ANGKA + numFmt Excel (bukan teks) supaya bisa
    // dijumlah/dipakai rumus langsung di Excel — pemisah ribuannya jadi
    // mengikuti pengaturan region komputer yang membuka file (biasanya
    // koma di region non-Indonesia, titik di region Indonesia); itu
    // trade-off yang sengaja diterima demi tetap bisa dipakai rumus.
    for (const idx of [iBiayaPendidikan, iPotongan, iTotalBiaya, iTotalAngsuran, iSisa]) {
      row.getCell(idx).numFmt = '"Rp"#,##0'
    }
    row.getCell(iPersen).numFmt = '0.0%'
    // Sel Angsuran N (teks "Rp… — tanggal") boleh wrap kalau kepanjangan,
    // supaya Excel bisa menghitung ulang tinggi barisnya sendiri.
    for (let i = 0; i < N; i++) row.getCell(10 + i).alignment = { vertical: 'middle', horizontal: 'center', wrapText: true }
    row.getCell(4).alignment = { vertical: 'middle', horizontal: 'center', wrapText: true } // Nama Siswa
    row.getCell(6).alignment = { vertical: 'middle', horizontal: 'center', wrapText: true } // Sekolah Asal
  }

  autoFitSheet(sh, headers.length)
  return sh
}

// Workbook SATU sheet saja (cuma Rincian Angsuran, tanpa Ringkasan/Per
// Gelombang/dst) — dipakai tombol "Export Keuangan" di halaman Pendaftar,
// yang secara alami sudah tersaring per jenjang+sumber+pencarian di layar,
// jadi tidak perlu (dan tidak seharusnya) membawa laporan analitik
// se-tahun-ajaran penuh seperti buatWorkbookLaporanKeuangan di bawah.
export async function buatWorkbookRincianAngsuran(data: RincianAngsuranSheetData): Promise<ExcelJS.Buffer> {
  const wb = new ExcelJS.Workbook()
  wb.creator = 'SPMB Admin Citra Negara'
  wb.created = new Date()
  tulisSheetRincianAngsuran(wb, data)
  return wb.xlsx.writeBuffer()
}

// Data untuk tombol "Export Keuangan" di halaman Pendaftar. `sumber` HANYA
// untuk judul sheet ("SMK · Online") supaya jelas cakupan filenya — daftar
// `baris` itu sendiri sudah tersaring di pemanggil (PendaftarView.tsx).
export interface ExportKeuanganPendaftarSheetData {
  jenjang: 'smp' | 'sma' | 'smk'
  sumber?: 'online' | 'offline' | null
  tahunAjaran: { nama: string }
  baris: BarisExportKeuanganPendaftar[]
  maksAngsuran: number
}

// Mempertahankan PERSIS kolom-kolom export "Export Keuangan" yang sudah ada
// sebelumnya (Email, Sumber Daftar, Gelombang, Tunggakan, Kelebihan Bayar,
// Sudah Dikembalikan, Jumlah Menunggu, Jumlah Refund) — HANYA menambahkan
// Asal Sekolah, rincian Angsuran 1..N (nominal+tanggal, bukan cuma
// hitungannya), dan persentase pembayaran. Gaya visual (header hijau muda,
// border, auto-fit) memakai bantuan yang sama dengan tulisSheetRincianAngsuran
// di atas, tapi kolomnya SENGAJA berbeda — dua sheet ini melayani dua
// kebutuhan berbeda (lihat komentar di lib/rincianKeuangan.ts).
export async function buatWorkbookExportKeuanganPendaftar(data: ExportKeuanganPendaftarSheetData): Promise<ExcelJS.Buffer> {
  const wb = new ExcelJS.Workbook()
  wb.creator = 'SPMB Admin Citra Negara'
  wb.created = new Date()

  const sh = wb.addWorksheet('Export Keuangan')
  const N = data.maksAngsuran
  const labelSumber = data.sumber === 'online' ? ' · Online' : data.sumber === 'offline' ? ' · Offline' : ''

  const headers = [
    'No', 'Nama Lengkap', 'Email Akun', 'Jenjang', 'Jurusan', 'Kelas', 'Asal Sekolah', 'Sumber Daftar', 'Gelombang',
    'Total Tagihan', 'Total Dibayar (Bersih)',
    ...Array.from({ length: N }, (_, i) => `Angsuran ${i + 1}`),
    '%', 'Tunggakan (Kurang Bayar)', 'Kelebihan Bayar', 'Sudah Dikembalikan (Refund)', 'Status Pembayaran',
    'Jumlah Angsuran Menunggu Verifikasi', 'Jumlah Refund',
  ]

  // tulisJudul menyisipkan "TA {nama}" sendiri; label sumber (Online/Offline)
  // ditempel manual di sini karena itu bukan bagian dari RincianAngsuranSheetData.
  // Di-merge selebar tabel & dirata-tengahkan, sama seperti sheet Rincian
  // Angsuran — dan baris judul ini dilewati autoFitSheet (barisMulai:2)
  // supaya tidak ikut melebarkan kolom "No".
  const cellJudul = sh.getCell(1, 1)
  cellJudul.value = `Export Keuangan Pendaftar${labelSumber} — ${JENJANG_LABEL[data.jenjang]} — TA ${data.tahunAjaran.nama}`
  cellJudul.font = { bold: true, size: 12, color: { argb: HIJAU_TUA } }
  cellJudul.alignment = { vertical: 'middle', horizontal: 'center' }
  sh.mergeCells(1, 1, 1, headers.length)
  const rBaris = 2

  const headerRow = sh.getRow(rBaris)
  headers.forEach((h, i) => {
    const cell = headerRow.getCell(i + 1)
    cell.value = h
    cell.font = { bold: true, color: { argb: HIJAU_MUDA_TEKS }, size: 10.5 }
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: HIJAU_MUDA_FILL } }
    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true }
    cell.border = thinBorder()
  })

  const iTotalTagihan = 10, iTotalDibayar = 11
  const iPersen = 12 + N, iTunggakan = iPersen + 1, iKelebihan = iTunggakan + 1, iRefund = iKelebihan + 1

  if (data.baris.length === 0) {
    const kosong = sh.addRow(['Belum ada pendaftar yang cocok dengan filter ini'])
    sh.mergeCells(kosong.number, 1, kosong.number, headers.length)
    kosong.getCell(1).alignment = { horizontal: 'center' }
    kosong.getCell(1).font = { italic: true, size: 10.5, color: { argb: TEKS_GELAP } }
  }

  for (const p of data.baris) {
    const nilaiAngsuran = Array.from({ length: N }, (_, i) => {
      const a = p.angsuran[i]
      if (!a) return ''
      const tgl = new Date(a.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
      return `${formatRupiah(a.nominal)} — ${tgl}`
    })
    const row = isiBaris(sh, [
      p.no, p.namaLengkap, p.email, p.jenjang, p.jurusan, p.kelas, p.asalSekolah, p.sumberDaftar, p.gelombang,
      p.totalTagihan, p.totalDibayar,
      ...nilaiAngsuran,
      p.persenBayar / 100, p.tunggakan, p.kelebihanBayar, p.totalRefund, p.statusPembayaran,
      p.jumlahMenunggu, p.jumlahRefund,
    ])
    // Nominal Rupiah tetap ANGKA + numFmt (bukan teks) supaya bisa dijumlah
    // langsung pakai rumus Excel — lihat komentar di tulisSheetRincianAngsuran
    // soal trade-off pemisah ribuan yang ikut region komputer pembuka file.
    for (const idx of [iTotalTagihan, iTotalDibayar, iTunggakan, iKelebihan, iRefund]) {
      row.getCell(idx).numFmt = '"Rp"#,##0'
    }
    row.getCell(iPersen).numFmt = '0.0%'
    for (let i = 0; i < N; i++) row.getCell(12 + i).alignment = { vertical: 'middle', horizontal: 'center', wrapText: true }
    row.getCell(2).alignment = { vertical: 'middle', horizontal: 'center', wrapText: true } // Nama Lengkap
    row.getCell(7).alignment = { vertical: 'middle', horizontal: 'center', wrapText: true } // Asal Sekolah
  }

  autoFitSheet(sh, headers.length)
  return wb.xlsx.writeBuffer()
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

  // ---------- Rincian Angsuran per Pendaftar ----------
  tulisSheetRincianAngsuran(wb, data)

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
