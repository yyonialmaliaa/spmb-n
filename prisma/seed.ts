import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

// Harga awal — dipindahkan ke panel Harga di database, admin mengatur lewat
// /admin/harga dari sini seterusnya (lib/biaya.ts tidak lagi jadi acuan).
//
// SMK: harga per JURUSAN x KELAS MASUK (10/11, sama seperti SMA) x program
// (Reguler/Plus, kalau jurusan itu punya opsi Plus).
const SMK_JURUSAN: { nama: string; hargaReguler: number; hargaPlus?: number }[] = [
  { nama: 'Pengembangan Perangkat Lunak dan Gim (PPLG)', hargaReguler: 3_800_000, hargaPlus: 4_000_000 },
  { nama: 'Manajemen Perkantoran dan Layanan Bisnis (MPLB)', hargaReguler: 4_000_000, hargaPlus: 4_950_000 },
  { nama: 'Teknik Jaringan Komputer dan Telekomunikasi (TJKT)', hargaReguler: 4_500_000, hargaPlus: 5_750_000 },
  { nama: 'Desain Komunikasi Visual (DKV)', hargaReguler: 5_000_000, hargaPlus: 6_000_000 },
  { nama: 'Perhotelan (PH)', hargaReguler: 4_000_000 },
  { nama: 'Bisnis Digital dan Ritel (BDR)', hargaReguler: 3_500_000 },
]

const HARGA_SMK: { jurusan: string; kelas: string; nominal: number }[] = []
for (const j of SMK_JURUSAN) {
  for (const tingkat of ['10', '11']) {
    HARGA_SMK.push({ jurusan: j.nama, kelas: `Kelas ${tingkat} - REGULER`, nominal: j.hargaReguler })
    if (j.hargaPlus) HARGA_SMK.push({ jurusan: j.nama, kelas: `Kelas ${tingkat} - PLUS`, nominal: j.hargaPlus })
  }
}

// SMP/SMA: tidak ada jurusan (jurusan="-") — harga dibedakan per KELAS MASUK
// (entry grade, relevan untuk pendaftar pindahan) x tingkat program
// (Reguler/Plus). SMP entry grade: 7 & 8. SMA entry grade: 10 & 11.
const HARGA_SMP: { kelas: string; nominal: number }[] = [
  { kelas: 'Kelas 7 - REGULER', nominal: 3_000_000 },
  { kelas: 'Kelas 7 - PLUS', nominal: 3_500_000 },
  { kelas: 'Kelas 8 - REGULER', nominal: 3_000_000 },
  { kelas: 'Kelas 8 - PLUS', nominal: 3_500_000 },
]
const HARGA_SMA: { kelas: string; nominal: number }[] = [
  { kelas: 'Kelas 10 - REGULER', nominal: 3_300_000 },
  { kelas: 'Kelas 10 - PLUS', nominal: 3_800_000 },
  { kelas: 'Kelas 11 - REGULER', nominal: 3_300_000 },
  { kelas: 'Kelas 11 - PLUS', nominal: 3_800_000 },
]

// "Formulir Daftar Ulang" sengaja tidak ada di sini — pendaftar sudah
// mengisi formulir pendaftaran sebelumnya, jadi dokumen daftar ulang cukup
// yang sifatnya persyaratan tambahan (tata tertib, surat pernyataan, dst).
const DOKUMEN_DEFAULT: { jenis: string; nama: string }[] = [
  { jenis: 'tata_tertib', nama: 'Tata Tertib Sekolah' },
  { jenis: 'surat_pernyataan', nama: 'Surat Pernyataan Orang Tua' },
  { jenis: 'surat_perjanjian', nama: 'Surat Perjanjian Daftar Ulang' },
]

// Berkas yang wajib diunggah pendaftar. Disalin PERSIS dari FILE_FIELDS di
// app/spmb/daftar/page.tsx supaya data admin dan formulir siswa yang sedang
// berjalan sepakat sejak hari pertama. fieldKey = nama kolom di Pendaftaran.
const PERSYARATAN_PENDAFTARAN: { jenis: string; nama: string; fieldKey: string; wajib: boolean }[] = [
  { jenis: 'ijazah', nama: 'Ijazah atau Surat Keterangan Lulus (SKL) yang telah dilegalisir', fieldKey: 'fileIjazah', wajib: true },
  { jenis: 'akte', nama: 'Akte Kelahiran / Surat Keterangan Lahir', fieldKey: 'fileAkte', wajib: true },
  { jenis: 'kk', nama: 'Kartu Keluarga', fieldKey: 'fileKK', wajib: true },
  { jenis: 'ktp_ortu', nama: 'KTP Ayah dan Ibu', fieldKey: 'fileKtpOrtu', wajib: true },
  { jenis: 'kip', nama: 'KIP/PKH/KKS/DTKS/SKTM (Jika Ada)', fieldKey: 'fileKip', wajib: false },
  { jenis: 'foto', nama: 'Pas Photo Siswa Ukuran 3x4 (Kode Warna #0000FF)', fieldKey: 'fileFoto', wajib: true },
]

async function main() {
  // Backfill role lama -> role baru. Idempoten: sekali jalan menyisakan 0
  // baris 'admin', jalan berikutnya tidak mengubah apa pun.
  const backfill = await prisma.user.updateMany({
    where: { role: 'admin' },
    data: { role: 'super_admin' },
  })
  if (backfill.count > 0) {
    console.log(`Role: ${backfill.count} akun 'admin' dipromosikan jadi 'super_admin'`)
  }

  // ---------------------------------------------------------------------
  // TIGA AKUN ADMIN RESMI
  // ---------------------------------------------------------------------
  // Seluruhnya memakai kotak surat sekolah info@citranegara.sch.id. Kolom
  // email bersifat UNIK di basis data, jadi tiga akun tidak bisa memakai
  // string yang sama persis — dipakai sub-addressing (info+peran@...), yang
  // tetap terkirim ke info@citranegara.sch.id pada layanan surel mana pun,
  // tetapi terhitung sebagai identitas login yang berbeda.
  const AKUN_ADMIN: { email: string; password: string; role: string; nama: string }[] = [
    { email: 'info+superadmin@citranegara.sch.id', password: 'superadmin123', role: 'super_admin',    nama: 'Super Admin' },
    { email: 'info+spmb@citranegara.sch.id',       password: 'adminspmb123',  role: 'admin_spmb',     nama: 'Admin SPMB (Front Office)' },
    { email: 'info+loket@citranegara.sch.id',      password: 'adminloket123', role: 'admin_keuangan', nama: 'Admin Keuangan (Loket)' },
  ]

  for (const a of AKUN_ADMIN) {
    await prisma.user.upsert({
      where: { email: a.email },
      // Password ikut disetel ulang supaya seed selalu memulihkan kredensial
      // resmi bila ada yang mengubahnya saat uji coba.
      update: { role: a.role, aktif: true, namaLengkap: a.nama, password: await bcrypt.hash(a.password, 10) },
      create: { email: a.email, password: await bcrypt.hash(a.password, 10), role: a.role, namaLengkap: a.nama },
    })
  }
  console.log('Akun admin disiapkan:')
  for (const a of AKUN_ADMIN) console.log(`  ${a.role.padEnd(15)} ${a.email}`)



  const tahunAjaran = await prisma.tahunAjaran.upsert({
    where: { nama: '2026/2027' },
    update: {},
    create: { nama: '2026/2027', aktif: true },
  })
  console.log(`Tahun ajaran aktif: ${tahunAjaran.nama}`)

  await prisma.pengaturanKeuangan.upsert({
    where: { tahunAjaranId: tahunAjaran.id },
    update: {},
    create: {
      tahunAjaranId: tahunAjaran.id,
      minimalPembayaranAwal: 200_000,
      minimalCicilan: 100_000,
    },
  })

  const hargaRows: { jenjang: string; jurusan: string; kelas: string; nominal: number; urutan: number }[] = []
  HARGA_SMK.forEach((h, i) => hargaRows.push({ jenjang: 'smk', jurusan: h.jurusan, kelas: h.kelas, nominal: h.nominal, urutan: i }))
  HARGA_SMP.forEach((h, i) => hargaRows.push({ jenjang: 'smp', jurusan: '-', kelas: h.kelas, nominal: h.nominal, urutan: i }))
  HARGA_SMA.forEach((h, i) => hargaRows.push({ jenjang: 'sma', jurusan: '-', kelas: h.kelas, nominal: h.nominal, urutan: i }))

  for (const row of hargaRows) {
    await prisma.harga.upsert({
      where: { tahunAjaranId_jenjang_jurusan_kelas: { tahunAjaranId: tahunAjaran.id, jenjang: row.jenjang, jurusan: row.jurusan, kelas: row.kelas } },
      update: { nominal: row.nominal, urutan: row.urutan },
      create: { tahunAjaranId: tahunAjaran.id, ...row },
    })
  }
  console.log(`Harga: ${hargaRows.length} baris disiapkan`)

  const jenjangList = ['smp', 'sma', 'smk']
  for (const jenjang of jenjangList) {
    for (let urutan = 1; urutan <= 3; urutan++) {
      const existing = await prisma.gelombang.findFirst({
        where: { tahunAjaranId: tahunAjaran.id, jenjang, untukAlumni: false, urutan },
      })
      if (!existing) {
        await prisma.gelombang.create({
          data: {
            tahunAjaranId: tahunAjaran.id,
            jenjang,
            untukAlumni: false,
            nama: `Gelombang ${urutan}`,
            urutan,
            aktif: urutan === 1,
          },
        })
      }
    }
  }
  for (const jenjang of ['sma', 'smk']) {
    for (let urutan = 1; urutan <= 2; urutan++) {
      const existing = await prisma.gelombang.findFirst({
        where: { tahunAjaranId: tahunAjaran.id, jenjang, untukAlumni: true, urutan },
      })
      if (!existing) {
        await prisma.gelombang.create({
          data: {
            tahunAjaranId: tahunAjaran.id,
            jenjang,
            untukAlumni: true,
            nama: `Gelombang Alumni ${urutan}`,
            urutan,
            aktif: urutan === 1,
          },
        })
      }
    }
  }
  console.log('Gelombang: 3 jalur umum (smp/sma/smk) + 2 jalur alumni (sma/smk) disiapkan')

  for (const jenjang of jenjangList) {
    for (const [i, d] of DOKUMEN_DEFAULT.entries()) {
      await prisma.dokumenPersyaratan.upsert({
        where: {
          tahunAjaranId_jenjang_kategori_jenis: {
            tahunAjaranId: tahunAjaran.id,
            jenjang,
            kategori: 'daftar_ulang',
            jenis: d.jenis,
          },
        },
        update: {},
        create: {
          tahunAjaranId: tahunAjaran.id,
          jenjang,
          kategori: 'daftar_ulang',
          jenis: d.jenis,
          nama: d.nama,
          urutan: i,
        },
      })
    }
  }
  console.log('Dokumen daftar ulang: disiapkan per jenjang')

  for (const jenjang of jenjangList) {
    for (const [i, p] of PERSYARATAN_PENDAFTARAN.entries()) {
      await prisma.dokumenPersyaratan.upsert({
        where: {
          tahunAjaranId_jenjang_kategori_jenis: {
            tahunAjaranId: tahunAjaran.id,
            jenjang,
            kategori: 'pendaftaran',
            jenis: p.jenis,
          },
        },
        // Nama/wajib/urutan sengaja TIDAK di-update: admin boleh mengubahnya
        // lewat /admin/persyaratan dan seed ulang tidak boleh menimpanya.
        update: {},
        create: {
          tahunAjaranId: tahunAjaran.id,
          jenjang,
          kategori: 'pendaftaran',
          jenis: p.jenis,
          nama: p.nama,
          fieldKey: p.fieldKey,
          wajib: p.wajib,
          urutan: i,
        },
      })
    }
  }
  console.log('Persyaratan berkas pendaftaran: disiapkan per jenjang')
}

main()
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
