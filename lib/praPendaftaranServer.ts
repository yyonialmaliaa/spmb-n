import 'server-only'
import { createHash, randomBytes, randomInt } from 'crypto'
import type { Prisma } from '@prisma/client'
import { prisma } from './db'
import type { Jenjang } from './labels'
import { JENJANG_PRA, MASA_BERLAKU_HARI, statusEfektif, type BarisBawa, type StatusPra } from './praPendaftaran'

const KARAKTER_KODE = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'
const OFFSET_WIB_MS = 7 * 60 * 60 * 1000

/** Format sama dengan nomor pendaftaran resmi, berawalan PRA: PRA/0001/SMK/2027-2028/A7K9. */
export async function buatNomorPra(
  params: { tahunAjaranId: string; tahunAjaranNama: string; jenjang: string },
  db: Pick<typeof prisma, 'praPendaftaranCounter'> = prisma,
): Promise<string> {
  const { tahunAjaranId, tahunAjaranNama, jenjang } = params
  const counter = await db.praPendaftaranCounter.upsert({
    where: { tahunAjaranId_jenjang: { tahunAjaranId, jenjang } },
    create: { tahunAjaranId, jenjang, nilaiTerakhir: 1 },
    update: { nilaiTerakhir: { increment: 1 } },
  })
  let kode = ''
  for (let i = 0; i < 4; i++) kode += KARAKTER_KODE[randomInt(KARAKTER_KODE.length)]
  const noUrut = String(counter.nilaiTerakhir).padStart(4, '0')
  return `PRA/${noUrut}/${jenjang.toUpperCase()}/${tahunAjaranNama.replace(/\//g, '-')}/${kode}`
}

export function buatTokenAkses(): string {
  return randomBytes(32).toString('base64url')
}

export function tokenSah(token: unknown): token is string {
  return typeof token === 'string' && /^[A-Za-z0-9_-]{43}$/.test(token)
}

/** Akhir hari (23.59.59 WIB) pada tanggal dibuat + 7 hari: dibuat 1 Okt -> berlaku sampai 8 Okt. */
export function hitungBatasKedatangan(dibuat: Date): Date {
  const geser = new Date(dibuat.getTime() + OFFSET_WIB_MS)
  return new Date(
    Date.UTC(geser.getUTCFullYear(), geser.getUTCMonth(), geser.getUTCDate() + MASA_BERLAKU_HARI, 23, 59, 59, 999)
      - OFFSET_WIB_MS,
  )
}

/** Simpan status kedaluwarsa untuk antrean yang melewati batas menurut jam server. */
export async function tandaiKedaluwarsa(where: Prisma.PraPendaftaranWhereInput = {}) {
  try {
    await prisma.praPendaftaran.updateMany({
      where: { ...where, status: 'menunggu', batasKedatangan: { lt: new Date() } },
      data: { status: 'kedaluwarsa' },
    })
  } catch (err) {
    console.error('Gagal menandai pra-pendaftaran kedaluwarsa:', err)
  }
}

// --- Berkas yang wajib dibawa ------------------------------------------------

// Dipakai bila admin belum mengatur persyaratan tahun ajaran ini — sama dengan
// daftar cadangan checklist verifikasi di detail pendaftar.
const PERSYARATAN_BAWAAN: BarisBawa[] = [
  { nama: 'Ijazah atau Surat Keterangan Lulus (SKL) yang telah dilegalisir', deskripsi: null, wajib: true, fieldKey: 'fileIjazah' },
  { nama: 'Akte Kelahiran / Surat Keterangan Lahir', deskripsi: null, wajib: true, fieldKey: 'fileAkte' },
  { nama: 'Kartu Keluarga', deskripsi: null, wajib: true, fieldKey: 'fileKK' },
  { nama: 'KTP Ayah dan Ibu', deskripsi: null, wajib: true, fieldKey: 'fileKtpOrtu' },
  { nama: 'Pas Photo Siswa Ukuran 3x4 (Kode Warna #FF0000 atau #0000FF)', deskripsi: null, wajib: true, fieldKey: 'fileFoto' },
]

export async function ambilPersyaratanSemuaJenjang(tahunAjaranId: string): Promise<Record<Jenjang, BarisBawa[]>> {
  const baris = await prisma.dokumenPersyaratan.findMany({
    where: { tahunAjaranId, kategori: 'pendaftaran', aktif: true },
    orderBy: [{ jenjang: 'asc' }, { urutan: 'asc' }],
    select: { jenjang: true, nama: true, deskripsi: true, wajib: true, fieldKey: true },
  })
  const hasil = {} as Record<Jenjang, BarisBawa[]>
  for (const j of JENJANG_PRA) {
    const milik = baris.filter(b => b.jenjang === j).map(({ nama, deskripsi, wajib, fieldKey }) => ({ nama, deskripsi, wajib, fieldKey }))
    hasil[j] = milik.length > 0 ? milik : PERSYARATAN_BAWAAN
  }
  return hasil
}

export async function ambilPersyaratanBawa(tahunAjaranId: string, jenjang: Jenjang): Promise<BarisBawa[]> {
  return (await ambilPersyaratanSemuaJenjang(tahunAjaranId))[jenjang]
}

// --- Data bukti (halaman & PDF) ----------------------------------------------

export type DataBukti = {
  noPraPendaftaran: string
  namaLengkap: string
  email: string
  noHp: string
  asalSekolah: string
  alamat: string
  jenjang: Jenjang
  jurusan: string | null
  tahunAjaranNama: string
  createdAt: Date
  batasKedatangan: Date
  status: StatusPra
  noPendaftaranResmi: string | null
  persyaratan: BarisBawa[]
}

export async function ambilDataBukti(where: Prisma.PraPendaftaranWhereUniqueInput): Promise<DataBukti | null> {
  const pra = await prisma.praPendaftaran.findUnique({
    where,
    include: {
      tahunAjaran: { select: { nama: true } },
      pendaftaran: { select: { noPendaftaran: true } },
    },
  })
  if (!pra) return null

  const status = statusEfektif(pra.status, pra.batasKedatangan)
  if (status !== pra.status) await tandaiKedaluwarsa({ id: pra.id })

  const jenjang = (JENJANG_PRA as string[]).includes(pra.jenjang) ? (pra.jenjang as Jenjang) : 'smk'
  return {
    noPraPendaftaran: pra.noPraPendaftaran,
    namaLengkap: pra.namaLengkap,
    email: pra.email,
    noHp: pra.noHp,
    asalSekolah: pra.asalSekolah,
    alamat: pra.alamat,
    jenjang,
    jurusan: pra.jurusan,
    tahunAjaranNama: pra.tahunAjaran.nama,
    createdAt: pra.createdAt,
    batasKedatangan: pra.batasKedatangan,
    status,
    noPendaftaranResmi: pra.pendaftaran?.noPendaftaran ?? null,
    persyaratan: await ambilPersyaratanBawa(pra.tahunAjaranId, jenjang),
  }
}

// --- Anti-spam ---------------------------------------------------------------

/** IP yang dilihat reverse proxy; entri pertama X-Forwarded-For bisa dipalsukan klien. */
export function ipKlien(req: Request): string {
  const real = req.headers.get('x-real-ip')?.trim()
  if (real) return real
  const fwd = req.headers.get('x-forwarded-for')
  if (fwd) {
    const daftar = fwd.split(',').map(s => s.trim()).filter(Boolean)
    if (daftar.length > 0) return daftar[daftar.length - 1]
  }
  return 'tanpa-ip'
}

export function hashIp(ip: string): string {
  const rahasia = process.env.NEXTAUTH_SECRET || 'spmb-citra-negara'
  return createHash('sha256').update(`${rahasia}:${ip}`).digest('hex').slice(0, 40)
}

// Per proses saja: lapis cepat untuk ledakan permintaan; batas per jam ditegakkan lewat database.
const jejakLaju = new Map<string, number[]>()

export function lolosBatasLaju(kunci: string, maks: number, jendelaMs: number): boolean {
  const kini = Date.now()
  if (jejakLaju.size > 5000) {
    for (const [k, waktu] of jejakLaju) {
      if (waktu.every(t => kini - t > jendelaMs)) jejakLaju.delete(k)
    }
  }
  const waktu = (jejakLaju.get(kunci) || []).filter(t => kini - t < jendelaMs)
  if (waktu.length >= maks) {
    jejakLaju.set(kunci, waktu)
    return false
  }
  waktu.push(kini)
  jejakLaju.set(kunci, waktu)
  return true
}
