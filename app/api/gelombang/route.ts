import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// GET - daftar gelombang, dipakai halaman publik /spmb untuk menampilkan
// gelombang yang sedang berjalan beserta diskonnya.
//
// Endpoint ini SENGAJA read-only. Seluruh mutasi gelombang (buat, ubah
// tanggal, aktifkan, atur diskon) ada di /api/admin/gelombang dan
// /api/admin/gelombang/[id] yang terlindungi permission — dulu ada PUT
// admin di sini yang menduplikasi route tersebut.
//
// Pengisian gelombang default juga bukan tugas endpoint publik: itu milik
// prisma/seed.ts. Auto-seed lama di sini hanya memeriksa "tabel kosong
// secara global", sehingga bisa membuat gelombang SMK milik tahun ajaran
// aktif padahal yang kosong tahun ajaran lain.
export async function GET() {
  try {
    const list = await prisma.gelombang.findMany({
      orderBy: [{ jenjang: 'asc' }, { untukAlumni: 'asc' }, { urutan: 'asc' }],
    })
    return NextResponse.json({ data: list })
  } catch (err) {
    console.error('Gelombang GET error:', err)
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 })
  }
}
