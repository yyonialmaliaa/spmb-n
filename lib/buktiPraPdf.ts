import 'server-only'
import { readFile } from 'fs/promises'
import path from 'path'
import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFImage, type PDFPage, type RGB } from 'pdf-lib'
import { YAYASAN_INFO } from './biaya'
import { JENJANG_LABEL_FULL } from './labels'
import { STATUS_PRA, butirPetunjuk, catatanBawa, formatNoHp, tanggalWib } from './praPendaftaran'
import type { DataBukti } from './praPendaftaranServer'

const [LEBAR, TINGGI] = [595.28, 841.89]
const TEPI = 42
const LEBAR_ISI = LEBAR - 2 * TEPI
// Isi digambar di kanvas setinggi ini, lalu diperkecil bila perlu agar selalu muat satu halaman A4.
const TINGGI_KANVAS = 2400
const RUANG_KAKI = TEPI + 24

function hex(h: string): RGB {
  return rgb(parseInt(h.slice(1, 3), 16) / 255, parseInt(h.slice(3, 5), 16) / 255, parseInt(h.slice(5, 7), 16) / 255)
}

// Palet yang sama dengan landing page (app/spmb/landing.css).
const W = {
  hijau: hex('#0b6b3a'),
  hijauDalam: hex('#063b2b'),
  aksen: hex('#79b82a'),
  tinta: hex('#111111'),
  lembut: hex('#46534c'),
  samar: hex('#7a8880'),
  garis: hex('#dfe6e1'),
  hangat: hex('#f6f8f5'),
  hijauMuda: hex('#eef6e9'),
}

const NADA: Record<string, { teks: RGB; latar: RGB }> = {
  peringatan: { teks: hex('#8a5300'), latar: hex('#fff1cc') },
  info: { teks: hex('#075985'), latar: hex('#e0f2fe') },
  sukses: { teks: hex('#0b6b3a'), latar: hex('#e3f4e8') },
  bahaya: { teks: hex('#b4161c'), latar: hex('#fde7e8') },
  netral: { teks: hex('#46534c'), latar: hex('#eef1ef') },
}

type Huruf = { sans: PDFFont; tebal: PDFFont; serif: PDFFont }

type Ctx = {
  pdf: PDFDocument
  page: PDFPage
  /** Tepi atas blok berikutnya. */
  y: number
  h: Huruf
  aman: (s: string) => string
  data: DataBukti
}

// Font standar PDF hanya mengenal WinAnsi: huruf di luar itu diturunkan ke huruf dasarnya, atau "?".
function pembuatAman(font: PDFFont) {
  const set = new Set(font.getCharacterSet())
  return (s: string) => {
    let hasil = ''
    for (const ch of s.replace(/[‘‚′]/g, "'").replace(/[“„″]/g, '"').replace(/…/g, '...')) {
      if (set.has(ch.codePointAt(0)!)) { hasil += ch; continue }
      const dasar = ch.normalize('NFD').replace(/[̀-ͯ]/g, '')
      hasil += dasar && [...dasar].every(c => set.has(c.codePointAt(0)!)) ? dasar : '?'
    }
    return hasil
  }
}

function tulis(c: Ctx, page: PDFPage, s: string, x: number, y: number, size: number, font: PDFFont, color: RGB) {
  page.drawText(c.aman(s), { x, y, size, font, color })
}

function lebarTeks(c: Ctx, s: string, font: PDFFont, size: number) {
  return font.widthOfTextAtSize(c.aman(s), size)
}

function bungkus(c: Ctx, teks: string, font: PDFFont, size: number, lebar: number): string[] {
  const baris: string[] = []
  let kini = ''
  for (const kata of c.aman(teks).split(/\s+/).filter(Boolean)) {
    const coba = kini ? `${kini} ${kata}` : kata
    if (font.widthOfTextAtSize(coba, size) <= lebar) { kini = coba; continue }
    if (kini) baris.push(kini)
    if (font.widthOfTextAtSize(kata, size) <= lebar) { kini = kata; continue }
    kini = ''
    for (const huruf of kata) {
      if (font.widthOfTextAtSize(kini + huruf, size) > lebar && kini) { baris.push(kini); kini = huruf } else kini += huruf
    }
  }
  if (kini) baris.push(kini)
  return baris.length > 0 ? baris : ['-']
}

function kotakBulat(page: PDFPage, x: number, atas: number, w: number, h: number, r: number, opsi: { isi?: RGB; garis?: RGB; tebal?: number }) {
  const jalur = `M ${r} 0 H ${w - r} Q ${w} 0 ${w} ${r} V ${h - r} Q ${w} ${h} ${w - r} ${h} H ${r} Q 0 ${h} 0 ${h - r} V ${r} Q 0 0 ${r} 0 Z`
  page.drawSvgPath(jalur, {
    x,
    y: atas,
    ...(opsi.isi ? { color: opsi.isi } : {}),
    ...(opsi.garis ? { borderColor: opsi.garis, borderWidth: opsi.tebal ?? 0.8 } : {}),
  })
}

function kop(c: Ctx, logo: PDFImage | null) {
  const atas = TINGGI_KANVAS - TEPI
  let x = TEPI
  if (logo) {
    const lebar = 58
    c.page.drawImage(logo, { x: TEPI, y: atas - lebar * (logo.height / logo.width), width: lebar, height: lebar * (logo.height / logo.width) })
    x = TEPI + lebar + 14
  }
  tulis(c, c.page, YAYASAN_INFO.nama, x, atas - 8, 8, c.h.tebal, W.lembut)
  tulis(c, c.page, 'SPMB CITRA NEGARA', x, atas - 28, 19, c.h.serif, W.hijauDalam)
  tulis(c, c.page, `SMP · SMA · SMK Citra Negara  ·  Tahun Ajaran ${c.data.tahunAjaranNama}`, x, atas - 41, 9, c.h.sans, W.tinta)
  tulis(c, c.page, YAYASAN_INFO.alamat, x, atas - 52.5, 7.8, c.h.sans, W.samar)
  tulis(c, c.page, `Telp/WhatsApp ${YAYASAN_INFO.telp}  ·  ${YAYASAN_INFO.email}`, x, atas - 62.5, 7.8, c.h.sans, W.samar)

  const yGaris = atas - 73
  c.page.drawLine({ start: { x: TEPI, y: yGaris }, end: { x: LEBAR - TEPI, y: yGaris }, thickness: 2, color: W.hijau })
  c.page.drawLine({ start: { x: TEPI, y: yGaris - 3.4 }, end: { x: LEBAR - TEPI, y: yGaris - 3.4 }, thickness: 0.8, color: W.aksen })
  c.y = yGaris - 20
}

function judul(c: Ctx) {
  const tengah = (s: string, y: number, size: number, font: PDFFont, color: RGB) =>
    tulis(c, c.page, s, (LEBAR - lebarTeks(c, s, font, size)) / 2, y, size, font, color)
  tengah('BUKTI PRA-PENDAFTARAN SPMB', c.y - 13, 16.5, c.h.serif, W.tinta)
  c.y -= 32
}

function panelNomor(c: Ctx) {
  const { data } = c
  const tinggi = 62
  const atas = c.y
  kotakBulat(c.page, TEPI, atas, LEBAR_ISI, tinggi, 9, { isi: W.hangat, garis: W.garis })
  c.page.drawRectangle({ x: TEPI + 12, y: atas - tinggi + 14, width: 3, height: tinggi - 28, color: W.hijau })

  const status = STATUS_PRA[data.status]
  const nada = NADA[status.nada]
  const labelStatus = status.teks.toUpperCase()
  const lebarChip = lebarTeks(c, labelStatus, c.h.tebal, 7.4) + 18
  const kanan = TEPI + LEBAR_ISI - 16
  kotakBulat(c.page, kanan - lebarChip, atas - 13, lebarChip, 17, 8.5, { isi: nada.latar })
  tulis(c, c.page, labelStatus, kanan - lebarChip + 9, atas - 24.6, 7.4, c.h.tebal, nada.teks)
  const berlaku = `Berlaku sampai ${tanggalWib(data.batasKedatangan)}`
  const lebarBerlaku = lebarTeks(c, berlaku, c.h.tebal, 9.5)
  tulis(c, c.page, berlaku, kanan - lebarBerlaku, atas - 45, 9.5, c.h.tebal, W.tinta)

  const ruangNomor = kanan - Math.max(lebarBerlaku, lebarChip) - 18 - (TEPI + 26)
  let ukuran = 17
  while (ukuran > 10 && lebarTeks(c, data.noPraPendaftaran, c.h.tebal, ukuran) > ruangNomor) ukuran -= 0.5
  tulis(c, c.page, 'NOMOR PRA-PENDAFTARAN', TEPI + 26, atas - 21, 7.4, c.h.tebal, W.samar)
  tulis(c, c.page, data.noPraPendaftaran, TEPI + 26, atas - 43, ukuran, c.h.tebal, W.hijau)
  c.y = atas - tinggi - 18
}

function kepalaBagian(c: Ctx, teks: string) {
  tulis(c, c.page, teks, TEPI, c.y - 8, 9.5, c.h.tebal, W.hijauDalam)
  c.page.drawLine({ start: { x: TEPI, y: c.y - 15 }, end: { x: LEBAR - TEPI, y: c.y - 15 }, thickness: 0.6, color: W.garis })
  c.page.drawLine({ start: { x: TEPI, y: c.y - 15 }, end: { x: TEPI + 38, y: c.y - 15 }, thickness: 2, color: W.hijau })
  c.y -= 27
}

type Isian = { label: string; nilai: string; penuh?: boolean }

function gridData(c: Ctx, isian: Isian[]) {
  const jarak = 24
  const kolom = (LEBAR_ISI - jarak) / 2
  const baris: Isian[][] = []
  for (let i = 0; i < isian.length; i++) {
    if (!isian[i].penuh && isian[i + 1] && !isian[i + 1].penuh) { baris.push([isian[i], isian[i + 1]]); i++ }
    else baris.push([isian[i]])
  }
  for (const b of baris) {
    const lebarSel = b[0].penuh ? LEBAR_ISI : kolom
    const isi = b.map(s => bungkus(c, s.nilai, c.h.tebal, 10.3, lebarSel))
    const tinggi = 18 + (Math.max(...isi.map(x => x.length)) - 1) * 13.2 + 13
    b.forEach((s, k) => {
      const x = TEPI + k * (kolom + jarak)
      tulis(c, c.page, s.label.toUpperCase(), x, c.y - 6, 7, c.h.tebal, W.samar)
      isi[k].forEach((ln, n) => tulis(c, c.page, ln, x, c.y - 18 - n * 13.2, 10.3, c.h.tebal, W.tinta))
    })
    c.y -= tinggi
  }
}

function daftarDokumen(c: Ctx) {
  const lebarTag = 58
  const xNama = TEPI + 24
  const lebarNama = LEBAR_ISI - 24 - lebarTag - 12
  c.data.persyaratan.forEach((s, i) => {
    const nama = bungkus(c, s.nama, c.h.tebal, 9.8, lebarNama)
    const catatan = catatanBawa(s)
    const desk = catatan ? bungkus(c, catatan, c.h.sans, 8.3, lebarNama) : []
    const tinggiIsi = (nama.length - 1) * 12.4 + (desk.length ? 11.5 + (desk.length - 1) * 10.8 : 0)

    const dasar = c.y - 9
    tulis(c, c.page, String(i + 1).padStart(2, '0'), TEPI, dasar, 9.8, c.h.tebal, W.samar)
    nama.forEach((ln, n) => tulis(c, c.page, ln, xNama, dasar - n * 12.4, 9.8, c.h.tebal, W.tinta))
    const dasarDesk = dasar - (nama.length - 1) * 12.4 - 11.5
    desk.forEach((ln, n) => tulis(c, c.page, ln, xNama, dasarDesk - n * 10.8, 8.3, c.h.sans, W.lembut))

    if (!s.wajib) {
      const tag = 'BILA ADA'
      const lebarChip = lebarTeks(c, tag, c.h.tebal, 6.8) + 14
      kotakBulat(c.page, TEPI + LEBAR_ISI - lebarChip, dasar + 9, lebarChip, 13.5, 6.75, { garis: W.samar, tebal: 0.8 })
      tulis(c, c.page, tag, TEPI + LEBAR_ISI - lebarChip + 7, dasar - 0.6, 6.8, c.h.tebal, W.samar)
    }

    const ySekat = dasar - tinggiIsi - 7.5
    c.page.drawLine({ start: { x: TEPI, y: ySekat }, end: { x: LEBAR - TEPI, y: ySekat }, thickness: 0.5, color: W.garis })
    c.y = ySekat - 4.5
  })
}

function petunjuk(c: Ctx) {
  const pad = 12
  const lebarTeksButir = LEBAR_ISI - 2 * pad - 12
  const isi = butirPetunjuk(c.data.batasKedatangan).map(b => bungkus(c, b, c.h.sans, 8.5, lebarTeksButir))
  const tinggi = pad + 13 + isi.reduce((t, b) => t + b.length * 10.8 + 2.5, 0) + pad - 2

  const atas = c.y - 2
  kotakBulat(c.page, TEPI, atas, LEBAR_ISI, tinggi, 9, { isi: W.hijauMuda, garis: W.aksen, tebal: 0.7 })
  tulis(c, c.page, 'PETUNJUK KEDATANGAN', TEPI + pad, atas - pad - 6, 8, c.h.tebal, W.hijauDalam)
  let y = atas - pad - 22
  for (const baris of isi) {
    c.page.drawCircle({ x: TEPI + pad + 3, y: y + 2.8, size: 1.7, color: W.hijau })
    for (const ln of baris) {
      tulis(c, c.page, ln, TEPI + pad + 12, y, 8.5, c.h.sans, W.tinta)
      y -= 10.8
    }
    y -= 2.5
  }
  c.y = atas - tinggi - 10
}

function kakiHalaman(c: Ctx, page: PDFPage, dibuat: Date) {
  page.drawLine({ start: { x: TEPI, y: TEPI + 16 }, end: { x: LEBAR - TEPI, y: TEPI + 16 }, thickness: 0.5, color: W.garis })
  tulis(c, page, `Dibuat otomatis oleh sistem SPMB Citra Negara · ${tanggalWib(dibuat, true)}`, TEPI, TEPI + 4, 7.2, c.h.sans, W.samar)
}

async function muatLogo(pdf: PDFDocument): Promise<PDFImage | null> {
  try {
    return await pdf.embedPng(await readFile(path.join(process.cwd(), 'public', 'images', 'logo-bukti.png')))
  } catch (err) {
    console.warn('Logo bukti pra-pendaftaran tidak terbaca, PDF dibuat tanpa logo:', err)
    return null
  }
}

export function responsPdf(bytes: Uint8Array, namaBerkas: string): Response {
  return new Response(new Uint8Array(bytes), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${namaBerkas}"`,
      'Cache-Control': 'private, no-store',
      'X-Robots-Tag': 'noindex, nofollow',
    },
  })
}

export async function buatPdfBuktiPra(data: DataBukti): Promise<Uint8Array> {
  const pdf = await PDFDocument.create()
  const sekarang = new Date()
  pdf.setTitle(`Bukti Pra-Pendaftaran ${data.noPraPendaftaran}`)
  pdf.setSubject('Bukti Pra-Pendaftaran SPMB Citra Negara')
  pdf.setAuthor('SPMB Citra Negara')
  pdf.setCreator('SPMB Citra Negara')
  pdf.setProducer('SPMB Citra Negara')
  pdf.setLanguage('id-ID')
  pdf.setCreationDate(sekarang)

  const h: Huruf = {
    sans: await pdf.embedFont(StandardFonts.Helvetica),
    tebal: await pdf.embedFont(StandardFonts.HelveticaBold),
    serif: await pdf.embedFont(StandardFonts.TimesRomanBold),
  }
  const kanvas = pdf.addPage([LEBAR, TINGGI_KANVAS])
  const c: Ctx = { pdf, page: kanvas, y: 0, h, aman: pembuatAman(h.sans), data }

  kop(c, await muatLogo(pdf))
  judul(c)
  panelNomor(c)

  const isian: Isian[] = [
    { label: 'Nama Lengkap', nilai: data.namaLengkap },
    { label: 'Jenjang Tujuan', nilai: JENJANG_LABEL_FULL[data.jenjang] },
    { label: 'Asal Sekolah', nilai: data.asalSekolah },
    { label: 'Nomor HP / WhatsApp', nilai: formatNoHp(data.noHp) },
    { label: 'Email', nilai: data.email },
    { label: 'Tanggal Pra-Pendaftaran', nilai: tanggalWib(data.createdAt, true) },
    { label: 'Batas Waktu Kedatangan', nilai: tanggalWib(data.batasKedatangan) },
    ...(data.noPendaftaranResmi ? [{ label: 'Nomor Pendaftaran Resmi', nilai: data.noPendaftaranResmi }] : []),
    { label: 'Alamat', nilai: data.alamat, penuh: true },
  ]
  kepalaBagian(c, 'I.  DATA PRA-PENDAFTARAN')
  gridData(c, isian)

  c.y -= 2
  kepalaBagian(c, 'II.  DOKUMEN YANG WAJIB DIBAWA')
  daftarDokumen(c)

  petunjuk(c)

  const bawahIsi = c.y + 4
  const tinggiIsi = TINGGI_KANVAS - bawahIsi
  const isi = await pdf.embedPage(kanvas, { left: 0, bottom: bawahIsi, right: LEBAR, top: TINGGI_KANVAS })
  pdf.removePage(0)
  const halaman = pdf.addPage([LEBAR, TINGGI])
  const skala = Math.min(1, (TINGGI - RUANG_KAKI) / tinggiIsi)
  halaman.drawPage(isi, { x: (LEBAR - LEBAR * skala) / 2, y: TINGGI - tinggiIsi * skala, xScale: skala, yScale: skala })
  kakiHalaman(c, halaman, sekarang)

  return pdf.save()
}
