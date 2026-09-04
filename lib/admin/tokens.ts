// Token desain admin untuk dipakai dari inline style.
//
// Nilainya SENGAJA berupa string `var(--adm-*)`, bukan hex. Lima halaman
// admin lama tetap memakai inline style `style={{...}}` (strukturnya tidak
// boleh diubah), dan inline style tidak bisa diretema oleh class CSS — tapi
// bisa memakai custom property. Dengan ini palet hanya hidup di satu tempat,
// app/admin/admin.css, sementara komponen boleh mengonsumsinya lewat CSS
// class maupun inline style tanpa pernah menduplikasi kode warna.

export const warna = {
  primary: 'var(--adm-primary)',
  primaryHover: 'var(--adm-primary-hover)',
  primaryWeak: 'var(--adm-primary-weak)',
  primaryBorder: 'var(--adm-primary-border)',

  secondary: 'var(--adm-secondary)',
  secondaryWeak: 'var(--adm-secondary-weak)',

  tertiary: 'var(--adm-tertiary)',

  bg: 'var(--adm-bg)',
  surface: 'var(--adm-surface)',
  surfaceAlt: 'var(--adm-surface-alt)',
  border: 'var(--adm-border)',
  borderStrong: 'var(--adm-border-strong)',

  text: 'var(--adm-text)',
  textMuted: 'var(--adm-text-muted)',
  textFaint: 'var(--adm-text-faint)',
  textInvert: 'var(--adm-text-invert)',

  success: 'var(--adm-success)',
  successWeak: 'var(--adm-success-weak)',
  successBorder: 'var(--adm-success-border)',

  warning: 'var(--adm-warning)',
  warningWeak: 'var(--adm-warning-weak)',
  warningBorder: 'var(--adm-warning-border)',

  danger: 'var(--adm-danger)',
  dangerWeak: 'var(--adm-danger-weak)',
  dangerBorder: 'var(--adm-danger-border)',

  info: 'var(--adm-info)',
  infoWeak: 'var(--adm-info-weak)',

  neutralWeak: 'var(--adm-neutral-weak)',
} as const

export const radius = {
  sm: 'var(--adm-r-sm)',
  md: 'var(--adm-r-md)',
  lg: 'var(--adm-r-lg)',
} as const

export const bayangan = {
  sm: 'var(--adm-shadow-sm)',
  md: 'var(--adm-shadow-md)',
  lg: 'var(--adm-shadow-lg)',
} as const

/** Skala 8px. Dipakai supaya jarak antar elemen konsisten di semua halaman. */
export const ruang = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const

/** Nada semantik -> warna teks & latar, dipakai StatusBadge dan StatCard. */
export const nadaWarna = {
  netral: { teks: warna.tertiary, latar: warna.neutralWeak, garis: warna.border },
  info: { teks: warna.info, latar: warna.infoWeak, garis: '#BAE6FD' },
  sukses: { teks: warna.success, latar: warna.successWeak, garis: warna.successBorder },
  peringatan: { teks: warna.warning, latar: warna.warningWeak, garis: warna.warningBorder },
  bahaya: { teks: warna.danger, latar: warna.dangerWeak, garis: warna.dangerBorder },
} as const
