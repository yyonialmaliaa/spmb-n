// Fungsi murni seputar keuangan SPMB — TIDAK boleh import prisma, dipakai
// juga di client component (mis. app/dashboard/page.tsx). Fungsi yang perlu
// akses database (lookup Harga/Gelombang/Diskon, kunci totalTagihan, dst)
// ada di lib/keuangan.ts, yang me-reuse/re-export isi file ini.

export const MIN_CICILAN = 100_000 // minimal nominal per cicilan (rupiah), fallback kalau PengaturanKeuangan belum diatur
export const DEFAULT_MIN_PEMBAYARAN_AWAL = 200_000 // fallback syarat minimal kirim formulir

export const LABEL_JENIS_TRANSAKSI: Record<string, string> = {
  bayar: 'Pembayaran',
  refund: 'Dikembalikan',
  alokasi: 'Dialokasikan',
}

export function formatRupiah(n: number): string {
  return 'Rp' + n.toLocaleString('id-ID')
}

// Hitung total dibayar (bersih, setelah dikurangi refund & alokasi), sisa
// bayar, dan kelebihan bayar dari daftar riwayat Pembayaran (jenis "bayar",
// "refund", "alokasi"). Alokasi (kelebihan bayar dialihkan ke pembayaran
// sekolah lain, mis. SPP) mengurangi totalDibayar & kelebihanBayar sama
// persis seperti refund — bedanya cuma uangnya tidak keluar dari sekolah,
// cuma dipindah peruntukannya. "Kelebihan tersedia" untuk refund/alokasi
// BERIKUTNYA otomatis konsisten karena sama-sama diturunkan dari sini.
export function hitungRingkasan(pembayaranList: { jenis?: string; nominal: number; status: string }[], totalTagihan: number) {
  const totalBayar = pembayaranList.filter(p => (p.jenis || 'bayar') === 'bayar' && p.status === 'lunas').reduce((s, p) => s + p.nominal, 0)
  const totalRefund = pembayaranList.filter(p => p.jenis === 'refund' && p.status === 'lunas').reduce((s, p) => s + p.nominal, 0)
  const totalAlokasi = pembayaranList.filter(p => p.jenis === 'alokasi' && p.status === 'lunas').reduce((s, p) => s + p.nominal, 0)
  const totalDibayar = Math.max(totalBayar - totalRefund - totalAlokasi, 0)
  const sisaBayar = Math.max(totalTagihan - totalDibayar, 0)
  const kelebihanBayar = Math.max(totalDibayar - totalTagihan, 0)
  return { totalBayar, totalRefund, totalAlokasi, totalDibayar, sisaBayar, kelebihanBayar }
}

// Total yang sudah DISETOR user (menunggu_verifikasi ATAU lunas, bukan
// ditolak) — dipakai khusus untuk syarat "boleh kirim formulir" (section
// A2: gerbang dibuka begitu bukti pembayaran DISETOR, tidak perlu menunggu
// admin memverifikasi). Beda dengan hitungRingkasan().totalDibayar yang
// hanya menghitung yang sudah "lunas" (dipakai untuk kwitansi/sisa bayar).
export function hitungTotalDisetorkan(pembayaranList: { jenis?: string; nominal: number; status: string }[]): number {
  return pembayaranList
    .filter(p => (p.jenis || 'bayar') === 'bayar' && p.status !== 'ditolak')
    .reduce((s, p) => s + p.nominal, 0)
}
