'use client'

import { createContext, useCallback, useContext, useMemo } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { can as bolehkan, canAny, isReadOnly, type Action, type Resource, type Role } from '@/lib/permissions'
import { buildAdminHref, type KonteksAdmin } from '@/lib/adminHref'
import { JENJANG_LABEL_FULL, JENJANG_SINGKAT, type Jenjang } from '@/lib/labels'

// Sumber kebenaran tunggal untuk CURRENT_YEAR + CURRENT_LEVEL + CURRENT_ROLE.
//
// Identitas & daftar tahun ajaran datang dari SERVER (app/admin/layout.tsx),
// tapi PILIHAN yang sedang aktif diselesaikan di client dari URL — karena
// layout tidak pernah menerima searchParams dan tidak ikut render ulang saat
// query berubah. Itulah sebabnya bagian ini harus client component.
//
// Menggantikan tujuh guard `fetch('/api/auth/me')` yang dulu disalin di tiap
// halaman, dan memberi guard gratis ke enam halaman yang dulu tidak punya.

export interface TahunAjaranRingkas {
  id: string
  nama: string
  aktif: boolean
}

export interface PenggunaAdmin {
  userId: string
  email: string
  role: Role
  namaLengkap: string | null
  scopeJenjang: string | null
}

interface NilaiAdmin {
  user: PenggunaAdmin
  role: Role
  /** Boleh melakukan aksi tertentu. */
  can: (resource: Resource, action: Action) => boolean
  /** Punya akses apa pun — dipakai untuk menampilkan/menyembunyikan menu. */
  canAny: (resource: Resource) => boolean
  /** Bisa dilihat tapi tidak bisa diubah — pemicu banner "Mode Tampilan". */
  isReadOnly: (resource: Resource) => boolean

  /** Tidak pernah null — akun ber-scope memakai scope-nya, sisanya jatuh ke
   *  bawaan (SMP) kalau URL/path belum menyebutkan yang mana. */
  jenjang: Jenjang
  jenjangLabel: string
  jenjangSingkat: string
  setJenjang: (j: Jenjang) => void
  /** Admin ber-scope tidak boleh berpindah jenjang. */
  bisaGantiJenjang: boolean

  tahunAjaran: TahunAjaranRingkas | null
  tahunAjaranId: string | null
  tahunAjaranList: TahunAjaranRingkas[]
  /** Sedang melihat tahun ajaran yang BUKAN tahun aktif. */
  isHistoris: boolean
  setTahunAjaran: (id: string) => void

  /** Bangun URL admin yang membawa konteks jenjang + tahun ajaran. */
  href: (path: string, extra?: Record<string, string | number | null | undefined>) => string
}

const Ctx = createContext<NilaiAdmin | null>(null)

export interface AwalAdmin {
  user: PenggunaAdmin
  tahunAjaranList: TahunAjaranRingkas[]
}

const JENJANG_SAH = ['smp', 'sma', 'smk']
const isJenjang = (v: unknown): v is Jenjang =>
  typeof v === 'string' && JENJANG_SAH.includes(v)

/** Dipakai kalau akun bebas memilih jenjang (tidak di-scope) dan URL/path
 *  belum menyebutkan yang mana — lihat komentar pada resolusi `jenjang`
 *  di bawah untuk alasannya. */
const JENJANG_BAWAAN: Jenjang = 'smp'

export function AdminProvider({
  initial,
  children,
}: {
  initial: AwalAdmin
  children: React.ReactNode
}) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const routeParams = useParams()

  const { user, tahunAjaranList } = initial

  const aktifTA = useMemo(
    () => tahunAjaranList.find(t => t.aktif) ?? null,
    [tahunAjaranList],
  )

  // Tahun ajaran: dari URL, kalau tidak ada pakai yang aktif. Karena seluruh
  // daftar sudah dikirim server, namanya terselesaikan tanpa fetch tambahan —
  // termasuk untuk banner "sedang melihat data historis".
  const tahunAjaran = useMemo(() => {
    const dariUrl = searchParams.get('tahunAjaranId')
    if (dariUrl) {
      const ketemu = tahunAjaranList.find(t => t.id === dariUrl)
      if (ketemu) return ketemu
    }
    return aktifTA
  }, [searchParams, tahunAjaranList, aktifTA])

  // Jenjang: query -> segmen path (/admin/dashboard/[jenjang]) -> scope akun
  // -> bawaan. Cookie sengaja TIDAK dibaca di sini supaya render server dan
  // client tidak berbeda.
  //
  // TIDAK LAGI berakhir di `null`: sebelumnya, begitu ketiga sumber di atas
  // kosong, tiap halaman jenjang-aware (Harga, Persyaratan, Tagihan, dst.)
  // terpaksa menampilkan layarnya sendiri-sendiri meminta jenjang dipilih
  // dulu — padahal "Ganti Jenjang" di sidebar (lihat KartuKonteks) hanya
  // muncul KETIKA jenjang sudah terisi, jadi akun yang baru login dan belum
  // pernah membuka /admin/dashboard bisa macet tidak punya jalan memilih
  // sama sekali. Sekarang akun yang bebas memilih (tidak di-scope) langsung
  // mendapat SMP sebagai bawaan begitu tiba di halaman apa pun — bisa
  // langsung bekerja, dan tinggal pakai "Ganti Jenjang" di sidebar (yang
  // sekarang juga selalu tampil) kalau maksudnya jenjang lain.
  const jenjang = useMemo<Jenjang>(() => {
    const dariQuery = searchParams.get('jenjang')
    if (isJenjang(dariQuery)) return dariQuery
    const dariPath = routeParams?.jenjang
    if (isJenjang(dariPath)) return dariPath
    if (isJenjang(user.scopeJenjang)) return user.scopeJenjang
    return JENJANG_BAWAAN
  }, [searchParams, routeParams, user.scopeJenjang])

  const ctx: KonteksAdmin = useMemo(
    () => ({
      jenjang,
      tahunAjaranId: tahunAjaran?.id ?? null,
      aktifTahunAjaranId: aktifTA?.id ?? null,
    }),
    [jenjang, tahunAjaran, aktifTA],
  )

  const href = useCallback(
    (path: string, extra?: Record<string, string | number | null | undefined>) =>
      buildAdminHref(path, ctx, extra),
    [ctx],
  )

  const setJenjang = useCallback(
    (j: Jenjang) => {
      router.push(buildAdminHref('/admin/dashboard', { ...ctx, jenjang: j }))
    },
    [router, ctx],
  )

  const setTahunAjaran = useCallback(
    (id: string) => {
      // Tetap di halaman yang sama, hanya konteks tahunnya yang berpindah.
      const path = window.location.pathname
      router.push(buildAdminHref(path, { ...ctx, tahunAjaranId: id }))
    },
    [router, ctx],
  )

  const nilai = useMemo<NilaiAdmin>(
    () => ({
      user,
      role: user.role,
      can: (r, a) => bolehkan(user.role, r, a),
      canAny: r => canAny(user.role, r),
      isReadOnly: r => isReadOnly(user.role, r),

      jenjang,
      jenjangLabel: JENJANG_LABEL_FULL[jenjang],
      jenjangSingkat: JENJANG_SINGKAT[jenjang],
      setJenjang,
      bisaGantiJenjang: !user.scopeJenjang,

      tahunAjaran,
      tahunAjaranId: tahunAjaran?.id ?? null,
      tahunAjaranList,
      isHistoris: !!tahunAjaran && !tahunAjaran.aktif,
      setTahunAjaran,

      href,
    }),
    [user, jenjang, tahunAjaran, tahunAjaranList, setJenjang, setTahunAjaran, href],
  )

  return <Ctx.Provider value={nilai}>{children}</Ctx.Provider>
}

export function useAdmin(): NilaiAdmin {
  const v = useContext(Ctx)
  if (!v) throw new Error('useAdmin harus dipakai di dalam <AdminProvider>')
  return v
}
