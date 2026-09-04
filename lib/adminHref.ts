// Pembangun URL admin — pengganti rangkaian string `qs` / `qsOnly` / `qsAmp`
// yang dulu disalin di lima halaman. Rangkaian itulah yang membuat konteks
// jenjang & tahun ajaran hilang saat admin berpindah halaman.
//
// Modul murni: tidak mengimpor next/navigation, jadi bisa dipakai di server
// maupun client.

/**
 * Route yang datanya di-scope per jenjang, sehingga `?jenjang=` relevan.
 * Halaman global (Tahun Ajaran, Pengguna Admin, Pengaturan) TIDAK ada di
 * sini — menambahkan jenjang ke sana hanya menghasilkan URL menyesatkan.
 */
const JENJANG_AWARE = [
  '/admin/pendaftar',
  '/admin/verifikasi',
  '/admin/status',
  '/admin/gelombang',
  '/admin/persyaratan',
  '/admin/dokumen',
  '/admin/harga',
  '/admin/diskon',
  '/admin/tagihan',
  '/admin/pembayaran',
  '/admin/transaksi',
  '/admin/laporan',
]

export interface KonteksAdmin {
  jenjang?: string | null
  tahunAjaranId?: string | null
  /** id tahun ajaran yang sedang AKTIF — dipakai untuk menghilangkan param yang mubazir. */
  aktifTahunAjaranId?: string | null
}

function butuhJenjang(path: string): boolean {
  return JENJANG_AWARE.some(p => path === p || path.startsWith(p + '/'))
}

/**
 * Bangun URL admin yang membawa konteks.
 *
 * Aturan yang menjaga kontrak query lama tetap persis:
 *  1. `jenjang` hanya ditambahkan untuk route yang memang per-jenjang.
 *  2. `/admin/dashboard/<jenjang>` memakai jenjang sebagai SEGMEN PATH,
 *     bukan query — sesuai route yang sudah ada.
 *  3. `tahunAjaranId` DIHILANGKAN kalau sama dengan tahun ajaran aktif.
 *     Halaman lama memakai konvensi "param tidak ada berarti tahun aktif",
 *     jadi mempertahankannya membuat 13 halaman lama tetap berfungsi dan
 *     URL tetap bersih.
 */
export function buildAdminHref(
  path: string,
  ctx: KonteksAdmin = {},
  extra: Record<string, string | number | null | undefined> = {},
): string {
  const { jenjang, tahunAjaranId, aktifTahunAjaranId } = ctx

  // Aturan 2: dashboard jenjang memakai segmen path.
  let finalPath = path
  if (path === '/admin/dashboard' && jenjang) {
    finalPath = `/admin/dashboard/${jenjang}`
  }

  const params = new URLSearchParams()

  if (jenjang && butuhJenjang(finalPath)) {
    params.set('jenjang', jenjang)
  }

  if (tahunAjaranId && tahunAjaranId !== aktifTahunAjaranId) {
    params.set('tahunAjaranId', tahunAjaranId)
  }

  for (const [k, v] of Object.entries(extra)) {
    if (v === null || v === undefined || v === '') continue
    params.set(k, String(v))
  }

  const qs = params.toString()
  return qs ? `${finalPath}?${qs}` : finalPath
}

/**
 * Pilih SATU menu sidebar yang menyala untuk pathname saat ini.
 *
 * Memakai pencocokan TERPANJANG, bukan sekadar startsWith per item. Kalau
 * tidak, `/admin/laporan/keuangan` akan menyalakan "Laporan Pendaftaran"
 * (`/admin/laporan`) DAN "Laporan Keuangan" sekaligus — dua menu aktif, dan
 * admin kehilangan petunjuk sedang berada di mana.
 *
 * Kembalikan href pemenang (tanpa query), atau null bila tidak ada.
 */
export function routeAktif(pathname: string, hrefs: string[]): string | null {
  let menang: string | null = null
  for (const href of hrefs) {
    const target = href.split('?')[0]
    const cocok = pathname === target || pathname.startsWith(target + '/')
    if (!cocok) continue
    if (menang === null || target.length > menang.length) menang = target
  }
  return menang
}
