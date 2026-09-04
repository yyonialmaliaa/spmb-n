import { NextResponse } from 'next/server'
import { requirePermission, requireJenjang } from '@/lib/adminSession'
import { catatAudit } from '@/lib/audit'
import { prisma } from '@/lib/db'
import { resolveTahunAjaran } from '@/lib/tahunAjaran'
import { isJenjangValid } from '@/lib/pendaftarQuery'

// Persyaratan = baris DokumenPersyaratan, dipisah oleh `kategori`:
//   pendaftaran  -> berkas yang diunggah pendaftar (fieldKey menunjuk kolom
//                   file di Pendaftaran, mis. fileIjazah)
//   daftar_ulang -> template dokumen yang diunduh pendaftar
const KATEGORI = ['pendaftaran', 'daftar_ulang']

// fieldKey dibatasi kolom file yang BENAR-BENAR ada di model Pendaftaran.
// Nilai di luar daftar ini akan membuat berkas tidak pernah terbaca halaman
// Verifikasi, jadi ditolak di sini.
const FIELD_SAH = ['fileIjazah', 'fileAkte', 'fileKK', 'fileKtpOrtu', 'fileKip', 'fileFoto']

// GET ?jenjang=&kategori=&tahunAjaranId=
export async function GET(req: Request) {
  const gate = await requirePermission('persyaratan', 'read')
  if (!gate.ok) return gate.res

  try {
    const url = new URL(req.url)
    const jenjang = (url.searchParams.get('jenjang') || '').toLowerCase()
    const kategori = url.searchParams.get('kategori') || ''

    if (jenjang && !isJenjangValid(jenjang)) {
      return NextResponse.json({ error: 'jenjang tidak valid' }, { status: 400 })
    }
    const tolak = requireJenjang(gate.session, jenjang || null)
    if (tolak) return tolak

    const tahunAjaran = await resolveTahunAjaran(url.searchParams.get('tahunAjaranId'))
    if (!tahunAjaran) return NextResponse.json({ data: [], tahunAjaran: null })

    const data = await prisma.dokumenPersyaratan.findMany({
      where: {
        tahunAjaranId: tahunAjaran.id,
        ...(jenjang ? { jenjang } : {}),
        ...(kategori && KATEGORI.includes(kategori) ? { kategori } : {}),
      },
      orderBy: [{ kategori: 'asc' }, { urutan: 'asc' }],
    })

    return NextResponse.json({
      data,
      tahunAjaran: { id: tahunAjaran.id, nama: tahunAjaran.nama, aktif: tahunAjaran.aktif },
    })
  } catch (err) {
    console.error('Persyaratan GET error:', err)
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 })
  }
}

// POST — tambah baris persyaratan baru
export async function POST(req: Request) {
  const gate = await requirePermission('persyaratan', 'create')
  if (!gate.ok) return gate.res

  try {
    const body = await req.json().catch(() => null)
    if (!body) return NextResponse.json({ error: 'Permintaan tidak valid' }, { status: 400 })

    const { jenjang, kategori, jenis, nama, deskripsi, fieldKey, wajib, tahunAjaranId } = body

    if (!isJenjangValid(jenjang)) {
      return NextResponse.json({ error: 'jenjang tidak valid' }, { status: 400 })
    }
    if (!KATEGORI.includes(kategori)) {
      return NextResponse.json({ error: 'kategori tidak valid' }, { status: 400 })
    }
    if (!nama?.trim()) {
      return NextResponse.json({ error: 'Nama persyaratan wajib diisi' }, { status: 400 })
    }
    if (fieldKey && !FIELD_SAH.includes(fieldKey)) {
      return NextResponse.json({ error: 'Kolom berkas tidak dikenal' }, { status: 400 })
    }
    const tolak = requireJenjang(gate.session, jenjang)
    if (tolak) return tolak

    const tahunAjaran = await resolveTahunAjaran(tahunAjaranId)
    if (!tahunAjaran) return NextResponse.json({ error: 'Tahun ajaran belum diatur' }, { status: 400 })

    // `jenis` adalah bagian dari kunci unik. Kalau tidak dikirim, turunkan
    // dari nama supaya admin tidak perlu memikirkannya.
    const kode = (jenis || nama).toString().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '').slice(0, 40)

    const terakhir = await prisma.dokumenPersyaratan.findFirst({
      where: { tahunAjaranId: tahunAjaran.id, jenjang, kategori },
      orderBy: { urutan: 'desc' },
      select: { urutan: true },
    })

    const dibuat = await prisma.dokumenPersyaratan.create({
      data: {
        tahunAjaranId: tahunAjaran.id,
        jenjang,
        kategori,
        jenis: kode,
        nama: nama.trim(),
        deskripsi: deskripsi?.trim() || null,
        fieldKey: kategori === 'pendaftaran' ? (fieldKey || null) : null,
        wajib: wajib !== false,
        urutan: (terakhir?.urutan ?? -1) + 1,
      },
    })

    await catatAudit({
      session: gate.session,
      aksi: 'create',
      entitas: 'persyaratan',
      entitasId: dibuat.id,
      ringkasan: `Menambah persyaratan "${dibuat.nama}" untuk ${jenjang.toUpperCase()}`,
      sesudah: { nama: dibuat.nama, wajib: dibuat.wajib, fieldKey: dibuat.fieldKey },
      jenjang,
      tahunAjaranId: tahunAjaran.id,
      req,
    })

    return NextResponse.json({ success: true, data: dibuat })
  } catch (err: unknown) {
    if ((err as { code?: string })?.code === 'P2002') {
      return NextResponse.json({ error: 'Persyaratan dengan nama itu sudah ada untuk jenjang ini' }, { status: 400 })
    }
    console.error('Persyaratan POST error:', err)
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 })
  }
}
