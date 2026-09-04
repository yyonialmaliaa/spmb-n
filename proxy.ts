import { NextResponse, type NextRequest } from 'next/server'
import { jwtVerify } from 'jose'
import { canAny, normalizeRole, type Resource, type Role } from '@/lib/permissions'

// Penjaga route tingkat server. Di Next 16 file ini bernama `proxy.ts`
// (dulu `middleware.ts`) dan berjalan di runtime Node.js.
//
// APA YANG DILAKUKAN DI SINI HANYA UNTUK PENGALAMAN PENGGUNA:
// mengarahkan pengunjung yang belum masuk ke /login, dan menyembunyikan
// section yang tidak boleh dibuka supaya tidak pernah muncul 403 mentah.
//
// APA YANG TIDAK BISA DILAKUKAN DI SINI:
//   1. Mengakses database. Dokumentasi Next menyarankan proxy tidak
//      bergantung pada modul/global bersama, dan Prisma tidak cocok di sini.
//      Akibatnya akun yang baru dinonaktifkan atau role yang baru diturunkan
//      MASIH terlihat valid di lapisan ini sampai tokennya kedaluwarsa.
//   2. Otorisasi per-field (mis. Admin Keuangan boleh mengubah diskon tapi
//      tidak boleh mengubah status kelulusan pada route yang sama).
//
// Karena itu pemeriksaan yang OTORITATIF tetap ada di setiap route API lewat
// requirePermission() di lib/adminSession.ts, yang membaca role & status
// aktif langsung dari database. Proxy ini lapisan kenyamanan, bukan lapisan
// keamanan — persis peringatan di dokumentasi Next sendiri.

const SECRET = new TextEncoder().encode(
  process.env.NEXTAUTH_SECRET || 'smk-citra-negara-secret-2026'
)

// Segmen pertama /admin/<segmen> -> resource pada matrix permission.
// Segmen yang tidak terdaftar tidak digerbangi di sini (tetap dijaga API).
const SECTION_RESOURCE: Record<string, Resource> = {
  pendaftar: 'pendaftar',
  verifikasi: 'verifikasi',
  status: 'status',
  'tahun-ajaran': 'tahun_ajaran',
  gelombang: 'jadwal',
  persyaratan: 'persyaratan',
  dokumen: 'persyaratan',
  harga: 'harga',
  diskon: 'diskon',
  tagihan: 'tagihan',
  pembayaran: 'pembayaran',
  transaksi: 'transaksi',
  laporan: 'laporan_pendaftaran',
  pengguna: 'pengguna',
  pengaturan: 'pengaturan',
}

type TokenPayload = { userId?: string; role?: string }

async function bacaRole(request: NextRequest): Promise<Role | null> {
  const token = request.cookies.get('token')?.value
  if (!token) return null
  try {
    const { payload } = await jwtVerify(token, SECRET)
    const { userId, role } = payload as TokenPayload
    if (!userId) return null
    return normalizeRole(role)
  } catch {
    return null
  }
}

export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl
  const role = await bacaRole(request)

  // Sudah masuk sebagai admin tapi membuka /login -> langsung ke pemilihan
  // jenjang. Pendaftar biasa tetap boleh melihat /login.
  if (pathname === '/login') {
    if (role && role !== 'user') {
      return NextResponse.redirect(new URL('/admin/dashboard', request.url))
    }
    return NextResponse.next()
  }

  if (pathname.startsWith('/admin')) {
    if (!role) {
      const url = new URL('/login', request.url)
      url.searchParams.set('next', pathname + search)
      return NextResponse.redirect(url)
    }
    if (role === 'user') {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }

    // Gerbang kasar per-section: kalau role ini tidak punya akses APA PUN ke
    // section tersebut, kembalikan ke dashboard dengan penanda supaya UI bisa
    // menjelaskan alasannya, bukan menampilkan halaman kosong atau 403.
    const segmen = pathname.split('/')[2]
    const resource = segmen ? SECTION_RESOURCE[segmen] : undefined
    if (resource && !canAny(role, resource)) {
      const url = new URL('/admin/dashboard', request.url)
      url.searchParams.set('ditolak', resource)
      return NextResponse.redirect(url)
    }

    return NextResponse.next()
  }

  // Area portal siswa: cukup pastikan sudah masuk.
  if (pathname.startsWith('/dashboard') && !role) {
    const url = new URL('/login', request.url)
    url.searchParams.set('next', pathname + search)
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*', '/login', '/dashboard/:path*'],
}
