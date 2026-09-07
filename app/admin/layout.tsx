import { redirect } from 'next/navigation'
import { getAdminSession } from '@/lib/adminSession'
import { prisma } from '@/lib/db'
import { AdminProvider } from '@/components/admin/AdminProvider'
import { AdminShell } from '@/components/admin/AdminShell'
import './admin.css'

export const metadata = {
  title: 'SPMB Admin — Citra Negara',
  // Deskripsi ditimpa di sini supaya tidak mewarisi milik layout root —
  // area admin melayani ketiga jenjang sekaligus.
  description: 'Panel administrasi SPMB Citra Negara.',
}

// Layout server untuk SELURUH area /admin.
//
// Ini yang akhirnya memberi ketiga belas halaman admin satu sidebar bersama —
// sebelumnya sidebar disalin inline ke lima halaman dan delapan halaman lain
// tidak punya navigasi sama sekali.
//
// Redirect di sini bersifat UX (mencegah halaman kosong berkedip). Penegakan
// akses yang sesungguhnya tetap di requirePermission() pada setiap route API,
// sesuai panduan Next: jangan pernah bergantung pada satu lapisan saja.
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getAdminSession()
  if (!session) redirect('/login')

  const tahunAjaranList = await prisma.tahunAjaran.findMany({
    select: { id: true, nama: true, aktif: true },
    orderBy: { createdAt: 'desc' },
  })

  return (
    <AdminProvider initial={{ user: session, tahunAjaranList }}>
      <AdminShell>{children}</AdminShell>
    </AdminProvider>
  )
}
