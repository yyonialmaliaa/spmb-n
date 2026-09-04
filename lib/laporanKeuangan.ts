import { prisma } from './db'
import { resolveTahunAjaran } from './tahunAjaran'
import { scopePendaftar } from './pendaftarQuery'
import { hitungRingkasan } from './pembayaran-utils'

// Laporan Keuangan — kembaran lib/laporanSpmb.ts untuk sisi uang.
//
// Sengaja mengikuti konvensi yang sama persis: SATU jenjang, SATU tahun
// ajaran, memakai scopePendaftar() yang sama, hanya mengambil kolom agregat
// (tidak pernah nama/NIK/kontak), dan satu fungsi ini melayani tampilan layar
// maupun ekspor Excel. Karena scope-nya sama dengan halaman Tagihan, totalnya
// cocok secara konstruksi — bukan kebetulan.

export type JenjangLaporan = 'smp' | 'sma' | 'smk'

const LABEL_BAYAR: Record<string, string> = {
  belum_bayar: 'Belum Bayar',
  menunggu_verifikasi: 'Menunggu Verifikasi',
  cicilan_berjalan: 'Cicilan Berjalan',
  lunas: 'Lunas',
  ditolak: 'Ditolak',
}

const rupiah = (n: number) => 'Rp' + n.toLocaleString('id-ID')

export interface LaporanKeuanganData {
  jenjang: JenjangLaporan
  tahunAjaran: { id: string; nama: string; aktif: boolean }
  generatedAt: string
  ringkasan: {
    jumlahPendaftar: number
    totalTagihan: number
    totalDibayar: number
    totalSisa: number
    totalRefund: number
    totalAlokasi: number
    persenTertagih: number
  }
  statusBayar: { status: string; label: string; jumlah: number; persen: number; nominalSisa: number }[]
  perGelombang: { nama: string; jumlah: number; tagihan: number; dibayar: number; sisa: number }[]
  perPilihan: { label: string; jumlah: number; tagihan: number; dibayar: number }[]
  kasMasuk: { periode: string; nominal: number; jumlahTransaksi: number }[]
  metode: { label: string; jumlah: number; nominal: number }[]
  tunggakan: { rentang: string; jumlah: number; nominal: number }[]
  evaluasi: string[]
}

export async function getLaporanKeuangan(
  jenjang: JenjangLaporan,
  tahunAjaranId?: string | null,
): Promise<LaporanKeuanganData | null> {
  const tahunAjaran = await resolveTahunAjaran(tahunAjaranId)
  if (!tahunAjaran) return null

  const rows = await prisma.pendaftaran.findMany({
    where: scopePendaftar({ tahunAjaranId: tahunAjaran.id, jenjang }),
    select: {
      jurusan: true,
      kelas: true,
      gelombang: true,
      totalTagihan: true,
      statusPembayaran: true,
      createdAt: true,
      pembayaranList: {
        select: { jenis: true, nominal: true, status: true, metodePembayaran: true, tanggalBayar: true },
      },
    },
  })

  const perPendaftar = rows.map(p => {
    const tagihan = p.totalTagihan ?? 0
    const r = hitungRingkasan(p.pembayaranList, tagihan)
    return { ...p, tagihan, ...r }
  })

  const totalTagihan = perPendaftar.reduce((n, p) => n + p.tagihan, 0)
  const totalDibayar = perPendaftar.reduce((n, p) => n + p.totalDibayar, 0)
  const totalSisa = perPendaftar.reduce((n, p) => n + p.sisaBayar, 0)
  const totalRefund = perPendaftar.reduce((n, p) => n + p.totalRefund, 0)
  const totalAlokasi = perPendaftar.reduce((n, p) => n + p.totalAlokasi, 0)
  const persenTertagih = totalTagihan > 0 ? Math.round((totalDibayar / totalTagihan) * 1000) / 10 : 0

  // --- Status pembayaran ---
  const statusBayar = Object.keys(LABEL_BAYAR).map(status => {
    const g = perPendaftar.filter(p => (p.statusPembayaran || 'belum_bayar') === status)
    return {
      status,
      label: LABEL_BAYAR[status],
      jumlah: g.length,
      persen: rows.length > 0 ? Math.round((g.length / rows.length) * 1000) / 10 : 0,
      nominalSisa: g.reduce((n, p) => n + p.sisaBayar, 0),
    }
  }).filter(s => s.jumlah > 0)

  // --- Per gelombang ---
  const namaGelombang = [...new Set(perPendaftar.map(p => p.gelombang || 'Tanpa Gelombang'))]
  const perGelombang = namaGelombang.map(nama => {
    const g = perPendaftar.filter(p => (p.gelombang || 'Tanpa Gelombang') === nama)
    return {
      nama,
      jumlah: g.length,
      tagihan: g.reduce((n, p) => n + p.tagihan, 0),
      dibayar: g.reduce((n, p) => n + p.totalDibayar, 0),
      sisa: g.reduce((n, p) => n + p.sisaBayar, 0),
    }
  }).sort((a, b) => b.jumlah - a.jumlah)

  // --- Per jurusan (SMK) atau kelas (SMP/SMA) ---
  const kunciPilihan = (p: { jurusan: string | null; kelas: string | null }) =>
    (jenjang === 'smk' ? p.jurusan : p.kelas) || 'Belum Ditentukan'
  const labelPilihan = [...new Set(perPendaftar.map(kunciPilihan))]
  const perPilihan = labelPilihan.map(label => {
    const g = perPendaftar.filter(p => kunciPilihan(p) === label)
    return {
      label,
      jumlah: g.length,
      tagihan: g.reduce((n, p) => n + p.tagihan, 0),
      dibayar: g.reduce((n, p) => n + p.totalDibayar, 0),
    }
  }).sort((a, b) => b.dibayar - a.dibayar)

  // --- Kas masuk per bulan (hanya transaksi 'bayar' yang sudah lunas) ---
  const transaksiSah = perPendaftar.flatMap(p =>
    p.pembayaranList.filter(t => t.status === 'lunas' && (t.jenis || 'bayar') === 'bayar'),
  )
  const bulanan = new Map<string, { nominal: number; jumlah: number }>()
  for (const t of transaksiSah) {
    const d = new Date(t.tanggalBayar)
    const kunci = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    const cur = bulanan.get(kunci) ?? { nominal: 0, jumlah: 0 }
    bulanan.set(kunci, { nominal: cur.nominal + t.nominal, jumlah: cur.jumlah + 1 })
  }
  const kasMasuk = [...bulanan.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([periode, v]) => ({ periode, nominal: v.nominal, jumlahTransaksi: v.jumlah }))

  // --- Bauran metode pembayaran ---
  const metodeMap = new Map<string, { jumlah: number; nominal: number }>()
  for (const t of transaksiSah) {
    const k = t.metodePembayaran || 'lainnya'
    const cur = metodeMap.get(k) ?? { jumlah: 0, nominal: 0 }
    metodeMap.set(k, { jumlah: cur.jumlah + 1, nominal: cur.nominal + t.nominal })
  }
  const LABEL_METODE: Record<string, string> = { offline: 'Tunai / Loket', online: 'Transfer', internal: 'Alokasi Internal' }
  const metode = [...metodeMap.entries()]
    .map(([k, v]) => ({ label: LABEL_METODE[k] ?? k, ...v }))
    .sort((a, b) => b.nominal - a.nominal)

  // --- Umur tunggakan, dihitung dari tanggal pendaftaran ---
  const hariIni = Date.now()
  const belumLunas = perPendaftar.filter(p => p.sisaBayar > 0)
  const RENTANG: { rentang: string; min: number; max: number }[] = [
    { rentang: '0–30 hari', min: 0, max: 30 },
    { rentang: '31–60 hari', min: 31, max: 60 },
    { rentang: '61–90 hari', min: 61, max: 90 },
    { rentang: '> 90 hari', min: 91, max: Infinity },
  ]
  const tunggakan = RENTANG.map(r => {
    const g = belumLunas.filter(p => {
      const umur = Math.floor((hariIni - new Date(p.createdAt).getTime()) / 86_400_000)
      return umur >= r.min && umur <= r.max
    })
    return { rentang: r.rentang, jumlah: g.length, nominal: g.reduce((n, p) => n + p.sisaBayar, 0) }
  }).filter(r => r.jumlah > 0)

  // --- Kalimat evaluasi otomatis ---
  const evaluasi: string[] = []
  if (rows.length === 0) {
    evaluasi.push(`Belum ada pendaftar ${jenjang.toUpperCase()} pada TA ${tahunAjaran.nama}, sehingga belum ada data keuangan.`)
  } else {
    evaluasi.push(`Dari total tagihan ${rupiah(totalTagihan)}, sudah tertagih ${rupiah(totalDibayar)} (${persenTertagih}%).`)
    if (totalSisa > 0) {
      evaluasi.push(`Sisa yang belum tertagih ${rupiah(totalSisa)} dari ${belumLunas.length} pendaftar.`)
    } else {
      evaluasi.push('Seluruh tagihan pada jenjang ini sudah lunas.')
    }
    const lama = tunggakan.find(t => t.rentang === '> 90 hari')
    if (lama) {
      evaluasi.push(`Perhatian: ${lama.jumlah} pendaftar menunggak lebih dari 90 hari senilai ${rupiah(lama.nominal)}.`)
    }
    const gTerbaik = perGelombang[0]
    if (gTerbaik) {
      evaluasi.push(`Gelombang dengan pendaftar terbanyak: ${gTerbaik.nama} (${gTerbaik.jumlah} pendaftar, tertagih ${rupiah(gTerbaik.dibayar)}).`)
    }
    if (totalRefund > 0) evaluasi.push(`Pengembalian dana tercatat ${rupiah(totalRefund)}.`)
    if (totalAlokasi > 0) evaluasi.push(`Kelebihan bayar yang dialihkan ke pos lain ${rupiah(totalAlokasi)}.`)
    const menunggu = statusBayar.find(s => s.status === 'menunggu_verifikasi')
    if (menunggu) evaluasi.push(`${menunggu.jumlah} pembayaran masih menunggu verifikasi Admin Keuangan.`)
  }

  return {
    jenjang,
    tahunAjaran: { id: tahunAjaran.id, nama: tahunAjaran.nama, aktif: tahunAjaran.aktif },
    generatedAt: new Date().toISOString(),
    ringkasan: {
      jumlahPendaftar: rows.length,
      totalTagihan, totalDibayar, totalSisa, totalRefund, totalAlokasi, persenTertagih,
    },
    statusBayar,
    perGelombang,
    perPilihan,
    kasMasuk,
    metode,
    tunggakan,
    evaluasi,
  }
}
