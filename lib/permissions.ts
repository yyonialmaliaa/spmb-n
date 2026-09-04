// Matrix permission SPMB Citra Negara.
//
// Modul ini SENGAJA murni: tidak mengimpor prisma, next/headers, atau apa pun
// yang khusus server — supaya komponen client (sidebar, tombol aksi) memakai
// aturan yang PERSIS SAMA dengan yang ditegakkan di route API. Satu sumber
// kebenaran, bukan dua daftar yang lama-lama berbeda.
//
// Penegakan sebenarnya ada di lib/adminSession.ts (server). Yang di sini
// hanya menjawab "boleh atau tidak", bukan "siapa yang sedang login".

export type Role = 'super_admin' | 'admin_spmb' | 'admin_keuangan' | 'user'

export type Action = 'read' | 'create' | 'update' | 'delete' | 'export'

export type Resource =
  | 'dashboard'
  | 'pendaftar'
  | 'verifikasi'
  | 'status'
  | 'tahun_ajaran'
  | 'jadwal'
  | 'persyaratan'
  | 'harga'
  | 'diskon'
  | 'tagihan'
  | 'pembayaran'
  | 'transaksi'
  | 'laporan_pendaftaran'
  | 'laporan_keuangan'
  | 'pengguna'
  | 'pengaturan'
  | 'pengaturan_keuangan'
  | 'audit'

const R: Action[] = ['read']
const RX: Action[] = ['read', 'export']
const RU: Action[] = ['read', 'update']
const RUX: Action[] = ['read', 'update', 'export']
const RCU: Action[] = ['read', 'create', 'update']
const RCUD: Action[] = ['read', 'create', 'update', 'delete']
const ALL: Action[] = ['read', 'create', 'update', 'delete', 'export']

type Matrix = Record<Role, Partial<Record<Resource, Action[]>>>

// Catatan atas beberapa sel yang tidak jelas dari namanya:
//
// - harga & diskon untuk admin_spmb/admin_keuangan: PENGECUALIAN yang
//   disengaja. Keduanya boleh EDIT walau front office read-only di area
//   keuangan lain. `delete` tetap ditahan — "EDIT" berarti mengubah, bukan
//   menghancurkan, dan menghapus Harga/Diskon diam-diam meng-orphan
//   Pendaftaran.hargaId / diskonId.
//
// - tahun_ajaran: semua role admin boleh membaca & berpindah konteks tahun
//   ajaran, tapi hanya super_admin yang boleh tambah/ubah/aktifkan/hapus.
//   Mengaktifkan tahun ajaran mengubah konteks data SELURUH sistem.
//
// - jadwal untuk admin_keuangan: `update` diberikan karena
//   Gelombang.diskonPersen adalah tuas harga. Route wajib mempersempit
//   field yang boleh disentuh role ini ke diskonPersen saja — tanggal,
//   aktivasi, dan pembuatan gelombang tetap milik SPMB.
export const MATRIX: Matrix = {
  super_admin: {
    dashboard: R,
    pendaftar: ALL,
    verifikasi: RU,
    status: RU,
    tahun_ajaran: RCUD,
    jadwal: RCUD,
    persyaratan: RCUD,
    harga: ALL,
    diskon: ALL,
    tagihan: RUX,
    pembayaran: RUX,
    transaksi: RX,
    laporan_pendaftaran: RX,
    laporan_keuangan: RX,
    pengguna: RCUD,
    pengaturan: RU,
    pengaturan_keuangan: RU,
    audit: RX,
  },

  // Front office: penuh di area SPMB, read-only di area keuangan,
  // KECUALI harga & diskon yang boleh diedit.
  admin_spmb: {
    dashboard: R,
    pendaftar: ['read', 'create', 'update', 'export'],
    verifikasi: RU,
    status: RU,
    tahun_ajaran: R,
    jadwal: RCUD,
    persyaratan: RCUD,
    harga: RCU,
    diskon: RCU,
    tagihan: R,
    pembayaran: R,
    transaksi: RX,
    laporan_pendaftaran: RX,
    laporan_keuangan: RX,
    pengaturan: R,
    pengaturan_keuangan: R,
  },

  // Loket keuangan: penuh di area uang, TIDAK PUNYA AKSES sama sekali ke
  // verifikasi dokumen, status kelulusan, dan persyaratan SPMB.
  admin_keuangan: {
    dashboard: R,
    pendaftar: R,
    tahun_ajaran: R,
    jadwal: RU,
    harga: RCU,
    diskon: RCU,
    tagihan: RUX,
    pembayaran: RUX,
    transaksi: RUX,
    laporan_pendaftaran: RX,
    laporan_keuangan: RX,
    pengaturan: R,
    pengaturan_keuangan: RU,
  },

  // Pendaftar/siswa tidak punya akses admin apa pun.
  user: {},
}

/**
 * Petakan nilai role mentah ke Role yang dikenal.
 *
 * Memetakan nilai lama "admin" -> "super_admin". Ini WAJIB dipertahankan:
 * token JWT yang terbit sebelum migrasi role masih membawa role:"admin",
 * dan tanpa pemetaan ini setiap admin yang sedang login akan langsung
 * kehilangan akses begitu perubahan ini di-deploy.
 */
export function normalizeRole(raw: string | null | undefined): Role {
  switch (raw) {
    case 'admin':
    case 'super_admin':
      return 'super_admin'
    case 'admin_spmb':
      return 'admin_spmb'
    case 'admin_keuangan':
      return 'admin_keuangan'
    default:
      return 'user'
  }
}

/** Apakah role ini boleh masuk ke area /admin sama sekali. */
export function isAdminRole(role: Role): boolean {
  return role !== 'user'
}

/** Boleh melakukan satu aksi spesifik pada satu resource. */
export function can(role: Role, resource: Resource, action: Action): boolean {
  return MATRIX[role]?.[resource]?.includes(action) ?? false
}

/**
 * Punya akses apa pun ke resource ini. Dipakai untuk memutuskan apakah menu
 * sidebar ditampilkan — item yang tidak bisa dibuka sama sekali tidak boleh
 * muncul, supaya admin tidak mengklik sesuatu yang berujung 403.
 */
export function canAny(role: Role, resource: Resource): boolean {
  return (MATRIX[role]?.[resource]?.length ?? 0) > 0
}

/**
 * Resource bisa dilihat tapi tidak bisa diubah. Inilah kondisi yang memicu
 * banner "Mode Tampilan" — datanya sengaja tetap terlihat, hanya tombol
 * aksinya yang hilang.
 */
export function isReadOnly(role: Role, resource: Resource): boolean {
  const actions = MATRIX[role]?.[resource]
  if (!actions?.includes('read')) return false
  return !actions.some(a => a === 'create' || a === 'update' || a === 'delete')
}

export const LABEL_ROLE: Record<Role, string> = {
  super_admin: 'Super Admin',
  admin_spmb: 'Admin SPMB',
  admin_keuangan: 'Admin Keuangan',
  user: 'Pendaftar',
}

/** Keterangan panjang untuk halaman Pengguna Admin & Bantuan. */
export const DESKRIPSI_ROLE: Record<Role, string> = {
  super_admin: 'Akses penuh ke seluruh sistem, termasuk tahun ajaran dan pengguna admin.',
  admin_spmb: 'Front office: kelola pendaftar, verifikasi, jadwal, dan persyaratan. Area keuangan hanya bisa dilihat, kecuali harga dan diskon.',
  admin_keuangan: 'Loket keuangan: kelola tagihan, pembayaran, dan transaksi. Tidak dapat memverifikasi dokumen atau mengubah kelulusan.',
  user: 'Akun pendaftar, tanpa akses panel admin.',
}

export const ROLE_ADMIN_LIST: Role[] = ['super_admin', 'admin_spmb', 'admin_keuangan']

/**
 * Identitas visual per peran.
 *
 * Tiga peran memakai panel yang sama, jadi tanpa penanda yang jelas petugas
 * mudah lupa sedang masuk sebagai siapa — berbahaya ketika satu komputer
 * dipakai bergantian di ruang administrasi. Warna dan lencana ini yang
 * membedakannya sekilas, bukan sekadar tulisan kecil di pojok.
 */
export interface IdentitasPeran {
  /** Nama pendek untuk lencana. */
  lencana: string
  /** Keterangan area kerja utamanya. */
  area: string
  /** Token warna aksen peran (didefinisikan di app/globals.css). */
  warna: string
  warnaLembut: string
}

export const IDENTITAS_PERAN: Record<Role, IdentitasPeran> = {
  super_admin: {
    lencana: 'SUPER ADMIN',
    area: 'Akses penuh seluruh sistem',
    warna: 'var(--peran-super)',
    warnaLembut: 'var(--peran-super-lembut)',
  },
  admin_spmb: {
    lencana: 'FRONT OFFICE',
    area: 'Pendaftaran, verifikasi, dan seleksi',
    warna: 'var(--peran-spmb)',
    warnaLembut: 'var(--peran-spmb-lembut)',
  },
  admin_keuangan: {
    lencana: 'LOKET KEUANGAN',
    area: 'Tagihan, pembayaran, dan transaksi',
    warna: 'var(--peran-keuangan)',
    warnaLembut: 'var(--peran-keuangan-lembut)',
  },
  user: {
    lencana: 'PENDAFTAR',
    area: 'Portal calon peserta didik',
    warna: 'var(--adm-text-muted)',
    warnaLembut: 'var(--adm-neutral-weak)',
  },
}
