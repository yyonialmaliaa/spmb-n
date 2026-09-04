// =====================================================================
// Satu-satunya tempat perhitungan "Laporan Analitik SPMB". Dipakai BERSAMA
// oleh app/api/admin/laporan (tampilan di layar) dan
// app/api/admin/laporan/export (file Excel) — supaya angka yang tampil di
// layar dan yang ada di file Excel selalu identik, tidak pernah dihitung
// dua kali dengan cara berbeda.
//
// ATURAN PENTING (jangan dilanggar saat mengubah file ini):
// 1. Query SELALU di-scope ke SATU jenjang + SATU tahun ajaran lewat
//    parameter `jenjang`/`tahunAjaranId` — tidak pernah menggabungkan
//    jenjang atau tahun ajaran lain dalam satu hasil.
// 2. Query yang mengambil data pendaftar HANYA men-select kolom yang
//    dibutuhkan untuk agregat (status, jurusan, kelas, dst) — TIDAK PERNAH
//    men-select nama/NIK/NISN/no HP/email/alamat/dokumen. Laporan ini
//    murni statistik, bukan daftar individu (itu tugas menu "Pendaftar").
// 3. Semua angka dihitung dari data asli — tidak ada angka contoh/hardcode.
// =====================================================================

import { prisma } from './db'
import { resolveTahunAjaran } from './tahunAjaran'
import { scopePendaftar } from './pendaftarQuery'
import { hitungRingkasan } from './pembayaran-utils'
import { pecahKelasHarga, labelTier } from './kelas'

export type JenjangLaporan = 'smp' | 'sma' | 'smk'

const STATUS_LABEL: Record<string, string> = {
  draft: 'Masih Diproses (Draft)',
  verified: 'Sedang Diverifikasi',
  diterima_berkas: 'Diterima',
  ditolak: 'Ditolak',
}

type Ranked<T> = T & { jumlah: number; persen: number; ranking: number }

function rankedFromCounts(counts: Map<string, number>, total: number): Ranked<{ label: string }>[] {
  return [...counts.entries()]
    .map(([label, jumlah]) => ({ label, jumlah, persen: total > 0 ? Math.round((jumlah / total) * 1000) / 10 : 0 }))
    .sort((a, b) => b.jumlah - a.jumlah)
    .map((row, i) => ({ ...row, ranking: i + 1 }))
}

export async function getLaporanData(jenjang: JenjangLaporan, tahunAjaranId?: string | null) {
  const tahunAjaran = await resolveTahunAjaran(tahunAjaranId)
  if (!tahunAjaran) return null

  // Draft ONLINE (calon pendaftar masih mengisi sendiri, belum kirim
  // formulir) belum benar-benar "mendaftar" — dikecualikan, sama seperti
  // aturan di /api/admin/pendaftar. Draft OFFLINE (dibuat admin) tetap
  // dihitung sebagai "masih diproses".
  const rows = await prisma.pendaftaran.findMany({
    where: scopePendaftar({ tahunAjaranId: tahunAjaran.id, jenjang }),
    select: {
      status: true,
      jurusan: true,
      kelas: true,
      jenisKelamin: true,
      asalSD: true,
      asalSMP: true,
      asalSekolah: true,
      statusPembayaran: true,
      totalTagihan: true,
      gelombang: true,
      sudahDaftarUlang: true,
      createdAt: true,
      pembayaranList: { select: { jenis: true, nominal: true, status: true } },
    },
  })

  const total = rows.length

  // ── 1. Ringkasan ────────────────────────────────────────────────────
  const ringkasan = {
    total,
    sedangDiverifikasi: rows.filter(r => r.status === 'verified').length,
    diterima: rows.filter(r => r.status === 'diterima_berkas').length,
    ditolak: rows.filter(r => r.status === 'ditolak').length,
    daftarUlang: rows.filter(r => r.sudahDaftarUlang).length,
    masihDiproses: rows.filter(r => r.status === 'draft').length,
  }

  // ── 2. Analisis Minat Program Keahlian (WAJIB untuk SMK; jenjang lain
  //      tidak punya pilihan jurusan di sistem ini, jadi null bukan 0). ──
  let minatJurusan: Ranked<{ label: string }>[] | null = null
  if (jenjang === 'smk') {
    const counts = new Map<string, number>()
    for (const r of rows) {
      const nama = r.jurusan && r.jurusan !== '-' ? r.jurusan : 'Belum Memilih Jurusan'
      counts.set(nama, (counts.get(nama) || 0) + 1)
    }
    minatJurusan = rankedFromCounts(counts, total)
  }

  // ── 3. Minat Berdasarkan Kelas (Reguler/Plus per tingkat) — tersedia di
  //      semua jenjang karena field `kelas` selalu diisi dari Panel Harga. ──
  const kelasCounts = new Map<string, number>()
  for (const r of rows) {
    if (!r.kelas) continue
    const { tingkat, tier } = pecahKelasHarga(r.kelas)
    const label = tingkat ? `${tingkat} · ${labelTier(tier)}` : r.kelas
    kelasCounts.set(label, (kelasCounts.get(label) || 0) + 1)
  }
  const minatKelas = rankedFromCounts(kelasCounts, total)

  // ── 4. Distribusi Status Pendaftaran ─────────────────────────────────
  const statusCounts = new Map<string, number>()
  for (const r of rows) statusCounts.set(r.status, (statusCounts.get(r.status) || 0) + 1)
  const statusDistribusi = [...statusCounts.entries()].map(([status, jumlah]) => ({
    status,
    label: STATUS_LABEL[status] || status,
    jumlah,
    persen: total > 0 ? Math.round((jumlah / total) * 1000) / 10 : 0,
  })).sort((a, b) => b.jumlah - a.jumlah)

  // ── 5. Tren Pendaftaran (bulanan, sepanjang periode data yang ada —
  //      bukan "11 bulan terakhir dari hari ini", supaya laporan tahun
  //      ajaran lama tetap benar saat dilihat belakangan). ────────────
  const bulanMap = new Map<string, { label: string; jumlah: number; urut: number }>()
  for (const r of rows) {
    const d = new Date(r.createdAt)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    const label = d.toLocaleDateString('id-ID', { month: 'short', year: 'numeric' })
    const urut = d.getFullYear() * 12 + d.getMonth()
    const existing = bulanMap.get(key)
    bulanMap.set(key, { label, urut, jumlah: (existing?.jumlah || 0) + 1 })
  }
  const tren = [...bulanMap.values()].sort((a, b) => a.urut - b.urut).map(({ label, jumlah }) => ({ periode: label, jumlah }))
  const trenTerurut = [...tren].sort((a, b) => b.jumlah - a.jumlah)
  const trenInsight = {
    ramai: trenTerurut[0] || null,
    sepi: tren.length > 1 ? trenTerurut[trenTerurut.length - 1] : null,
  }

  // ── 6. Asal Sekolah (agregat, top 10) ────────────────────────────────
  const asalCounts = new Map<string, number>()
  for (const r of rows) {
    const asal = (jenjang === 'smp' ? r.asalSD : (r.asalSMP || r.asalSekolah)) || null
    if (!asal || !asal.trim()) continue
    asalCounts.set(asal.trim(), (asalCounts.get(asal.trim()) || 0) + 1)
  }
  const asalSekolah = rankedFromCounts(asalCounts, total).slice(0, 10)

  // ── 7. Komposisi Jenis Kelamin ───────────────────────────────────────
  const genderCounts = new Map<string, number>()
  for (const r of rows) genderCounts.set(r.jenisKelamin || 'Belum Diisi', (genderCounts.get(r.jenisKelamin || 'Belum Diisi') || 0) + 1)
  const genderKomposisi = rankedFromCounts(genderCounts, total)

  // ── 8. Ringkasan Pembayaran (agregat saja, tidak ada transaksi individu) ─
  let totalTagihan = 0, totalDibayar = 0, totalRefund = 0, totalAlokasi = 0, kelebihanBayar = 0
  for (const r of rows) {
    const h = hitungRingkasan(r.pembayaranList, r.totalTagihan || 0)
    totalTagihan += r.totalTagihan || 0
    totalDibayar += h.totalDibayar
    totalRefund += h.totalRefund
    totalAlokasi += h.totalAlokasi
    kelebihanBayar += h.kelebihanBayar
  }
  const pembayaran = {
    totalTagihan, totalDibayar, totalRefund, totalAlokasi, kelebihanBayar,
    lunas: rows.filter(r => r.statusPembayaran === 'lunas').length,
    cicilan: rows.filter(r => r.statusPembayaran === 'cicilan_berjalan').length,
    menunggu: rows.filter(r => r.statusPembayaran === 'menunggu_verifikasi').length,
    belumBayar: rows.filter(r => !r.statusPembayaran || r.statusPembayaran === 'belum_bayar').length,
    ditolakBayar: rows.filter(r => r.statusPembayaran === 'ditolak').length,
  }

  // ── 9. Performa Gelombang ────────────────────────────────────────────
  const gelombangMap = new Map<string, { jumlah: number; verified: number; diterima: number }>()
  for (const r of rows) {
    const nama = r.gelombang || 'Tanpa Gelombang'
    const g = gelombangMap.get(nama) || { jumlah: 0, verified: 0, diterima: 0 }
    g.jumlah += 1
    if (r.status === 'verified') g.verified += 1
    if (r.status === 'diterima_berkas') g.diterima += 1
    gelombangMap.set(nama, g)
  }
  const gelombang = [...gelombangMap.entries()]
    .map(([nama, g]) => ({ nama, jumlah: g.jumlah, persen: total > 0 ? Math.round((g.jumlah / total) * 1000) / 10 : 0, verified: g.verified, diterima: g.diterima }))
    .sort((a, b) => b.jumlah - a.jumlah)

  // ── 10. Ringkasan Evaluasi — kalimat otomatis dari data aktual ───────
  const evaluasi: string[] = []
  if (total === 0) {
    evaluasi.push('Belum ada data pendaftar pada tahun ajaran ini untuk dievaluasi.')
  } else {
    if (minatJurusan && minatJurusan.length > 0) {
      evaluasi.push(`Program keahlian ${minatJurusan[0].label} menjadi program dengan jumlah pendaftar terbanyak (${minatJurusan[0].jumlah} pendaftar, ${minatJurusan[0].persen}%).`)
      if (minatJurusan.length > 1) {
        const paling_sedikit = minatJurusan[minatJurusan.length - 1]
        evaluasi.push(`Program keahlian ${paling_sedikit.label} memiliki jumlah pendaftar paling sedikit (${paling_sedikit.jumlah} pendaftar).`)
      }
    }
    if (trenInsight.ramai) {
      evaluasi.push(`Pendaftaran paling ramai terjadi pada periode ${trenInsight.ramai.periode} dengan ${trenInsight.ramai.jumlah} pendaftar.`)
    }
    const statusTerbanyak = statusDistribusi[0]
    if (statusTerbanyak) {
      evaluasi.push(`Sebagian besar pendaftar saat ini berada pada status "${statusTerbanyak.label}" (${statusTerbanyak.persen}%).`)
    }
    if (pembayaran.belumBayar > 0) {
      evaluasi.push(`Terdapat ${pembayaran.belumBayar} pendaftar yang belum melakukan pembayaran.`)
    }
    if (gelombang.length > 1) {
      evaluasi.push(`Gelombang pendaftaran yang paling banyak diminati adalah ${gelombang[0].nama} dengan ${gelombang[0].jumlah} pendaftar (${gelombang[0].persen}%).`)
    }
  }

  return {
    jenjang,
    tahunAjaran: { id: tahunAjaran.id, nama: tahunAjaran.nama, aktif: tahunAjaran.aktif },
    generatedAt: new Date().toISOString(),
    ringkasan,
    minatJurusan,
    minatKelas,
    statusDistribusi,
    tren,
    trenInsight,
    asalSekolah,
    genderKomposisi,
    pembayaran,
    gelombang,
    evaluasi,
  }
}

export type LaporanData = NonNullable<Awaited<ReturnType<typeof getLaporanData>>>
