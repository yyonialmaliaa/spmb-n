// Nomor pendaftaran resmi: SPMB/0001/SMP/2026-2027/A7K9
//
//   SPMB          — tetap.
//   0001          — nomor urut, per (tahun ajaran, jenjang). Urutan
//                   pendaftar SAAT FORMULIRNYA BERHASIL DIKIRIM — bukan id
//                   akun/database, dan TIDAK BERUBAH lagi setelah dibuat
//                   (lihat pemanggilnya: hanya dipanggil sekali, tepat saat
//                   status berpindah dari draft, lalu disimpan permanen ke
//                   Pendaftaran.noPendaftaran).
//   SMP/SMA/SMK   — jenjang.
//   2026-2027     — nama tahun ajaran (mis. "2026/2027"), garis miringnya
//                   diganti strip supaya tidak bentrok dengan pemisah "/"
//                   di nomor ini sendiri.
//   A7K9          — kode acak 4 karakter, huruf besar + angka, TANPA
//                   karakter yang gampang tertukar (0/O, 1/I/L) — bukan
//                   pengganti keunikan (itu tugas noUrut + @unique di
//                   database), sekadar penanda tambahan yang tidak mudah
//                   ditebak/dipalsukan orang luar.
//
// Amannya dari duplikasi ditegakkan DUA lapis: nilaiTerakhir di
// NomorUrutCounter di-increment lewat SATU pernyataan UPDATE atomik di
// database (aman walau dua formulir disubmit persis bersamaan — Postgres
// menyerialkan UPDATE ke baris yang sama), DAN Pendaftaran.noPendaftaran
// sendiri punya constraint @unique sebagai jaring pengaman lapis kedua.

import { prisma } from './db'

const KARAKTER_KODE = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789' // tanpa 0/O/1/I/L

function kodeAcak(panjang: number): string {
  let hasil = ''
  for (let i = 0; i < panjang; i++) {
    hasil += KARAKTER_KODE[Math.floor(Math.random() * KARAKTER_KODE.length)]
  }
  return hasil
}

/**
 * Buat & KUNCI nomor pendaftaran satu pendaftar. Panggil TEPAT SEKALI per
 * pendaftaran — saat formulir online berhasil dikirim (draft -> verified)
 * atau saat admin membuat pendaftar offline. Bukan fungsi murni (mengubah
 * NomorUrutCounter di database), sengaja tidak dipanggil ulang untuk
 * pendaftaran yang sudah punya noPendaftaran — pemanggil bertanggung jawab
 * memeriksa itu dulu (lihat pemakainya).
 */
export async function buatNomorPendaftaran(params: {
  tahunAjaranId: string
  tahunAjaranNama: string
  jenjang: string
}): Promise<string> {
  const { tahunAjaranId, tahunAjaranNama, jenjang } = params

  const counter = await prisma.nomorUrutCounter.upsert({
    where: { tahunAjaranId_jenjang: { tahunAjaranId, jenjang } },
    create: { tahunAjaranId, jenjang, nilaiTerakhir: 1 },
    update: { nilaiTerakhir: { increment: 1 } },
  })

  const noUrut = String(counter.nilaiTerakhir).padStart(4, '0')
  const tokenTahun = tahunAjaranNama.replace(/\//g, '-')
  const kode = kodeAcak(4)

  return `SPMB/${noUrut}/${jenjang.toUpperCase()}/${tokenTahun}/${kode}`
}
