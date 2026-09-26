import { NextResponse } from 'next/server'
import { getAdminSession, forbidden, unauthorized, requirePermission } from '@/lib/adminSession'
import { can, type Resource } from '@/lib/permissions'
import { prisma } from '@/lib/db'
import { FIELD_BERKAS } from '@/lib/labels'
import { hitungUlangTagihan, previewTagihan, recalculatePembayaran, cekKeuanganUntukTerima, HargaTidakDitemukanError } from '@/lib/keuangan'
import { kirimNotifikasi } from '@/lib/notifikasi'

const LABEL_STATUS: Record<string, string> = {
  verified: 'Sedang Diverifikasi',
  diterima_berkas: 'Diterima',
  ditolak: 'Berkas Ditolak',
}

// Route ini menyentuh TIGA area kewenangan yang berbeda dalam satu PUT, jadi
// satu gerbang permission saja tidak cukup — setiap field harus dipetakan ke
// area yang benar. Di sinilah aturan "Admin Keuangan TIDAK BOLEH verifikasi
// dokumen atau mengubah kelulusan" benar-benar ditegakkan. Front Office
// (admin_spmb) BOLEH menyentuh 'tagihan' — tapi HANYA lewat diskonId/
// hitungUlang di bawah, yaitu "menerapkan diskon yang sudah tersedia", bukan
// wewenang keuangan yang lebih luas (lihat lib/permissions.ts).
const FIELD_RESOURCE: Record<string, Resource> = {
  // Hasil pemeriksaan berkas
  status: 'verifikasi',
  alasanPenolakan: 'verifikasi',
  catatan: 'verifikasi',
  waVerified: 'verifikasi',
  validasiBerkas: 'verifikasi',
  // Kelulusan, pengumuman, dan daftar ulang
  nilaiSeleksi: 'status',
  pesanPengumuman: 'status',
  sudahDaftarUlang: 'status',
  catatanDaftarUlang: 'status',
  // Nilai tagihan pendaftar
  diskonId: 'tagihan',
  hitungUlang: 'tagihan',
}

const LABEL_RESOURCE: Record<string, string> = {
  verifikasi: 'memverifikasi berkas',
  status: 'mengubah status kelulusan',
  tagihan: 'mengubah tagihan',
}

// GET - detail lengkap satu pendaftar, termasuk riwayat cicilan pembayaran
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const gate = await requirePermission('pendaftar', 'read')
  if (!gate.ok) return gate.res
  try {
    const { id } = await params
    const data = await prisma.pendaftaran.findUnique({
      where: { id },
      include: {
        user: { select: { email: true } },
        pembayaranList: { orderBy: { angsuranKe: 'asc' } },
        tahunAjaran: { select: { nama: true } },
        mutasiList: { orderBy: { createdAt: 'desc' } },
      },
    })
    if (!data) return NextResponse.json({ error: 'Data tidak ditemukan' }, { status: 404 })
    const [breakdown, syaratTerima] = await Promise.all([previewTagihan(id), cekKeuanganUntukTerima(id)])
    return NextResponse.json({ data: { ...data, breakdown, syaratTerima } })
  } catch (err) {
    console.error('Get detail error:', err)
    return NextResponse.json({ error: 'Terjadi kesalahan' }, { status: 500 })
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAdminSession()
  if (!session) return unauthorized()

  try {
    const { id } = await params
    const body = await req.json()

    // Tentukan area kewenangan mana saja yang disentuh permintaan ini, lalu
    // TOLAK SELURUH permintaan kalau ada satu saja yang tidak diizinkan.
    // Menolak seluruhnya (bukan diam-diam membuang field terlarang) supaya
    // admin tidak pernah mengira perubahannya tersimpan padahal tidak.
    const disentuh = new Set<Resource>()
    for (const field of Object.keys(body)) {
      const resource = FIELD_RESOURCE[field]
      if (resource) disentuh.add(resource)
    }
    for (const resource of disentuh) {
      if (!can(session.role, resource, 'update')) {
        return forbidden(`Anda tidak memiliki akses untuk ${LABEL_RESOURCE[resource] ?? resource}.`)
      }
    }

    const allowed = ['verified', 'diterima_berkas', 'ditolak']
    if (body.status && !allowed.includes(body.status)) {
      return NextResponse.json({ error: 'Status tidak valid' }, { status: 400 })
    }

    // Kondisi SEBELUM diubah — dipakai untuk mendeteksi apa yang sungguh
    // berubah, supaya notifikasi ke pendaftar cuma dikirim untuk perubahan
    // yang nyata (bukan setiap kali PUT dipanggil).
    const existing = await prisma.pendaftaran.findUnique({ where: { id } })
    if (!existing) return NextResponse.json({ error: 'Data tidak ditemukan' }, { status: 404 })

    // Menerima berkas menunggu Loket Keuangan memverifikasi pembayarannya.
    // Ditegakkan di sini (bukan cuma tombol yang dinonaktifkan) karena semua
    // jalur penerimaan — Terima Berkas, Setujui Semua, halaman Verifikasi —
    // lewat route ini.
    if (body.status === 'diterima_berkas' && existing.status !== 'diterima_berkas') {
      const syarat = await cekKeuanganUntukTerima(id)
      if (syarat && !syarat.boleh) {
        return NextResponse.json({ error: `Berkas belum bisa diterima. ${syarat.alasan}` }, { status: 400 })
      }
    }

    const updateData: Record<string, any> = {}

    if (body.status !== undefined)            updateData.status = body.status
    if (body.catatan !== undefined)            updateData.catatan = body.catatan
    if (body.alasanPenolakan !== undefined)    updateData.alasanPenolakan = body.alasanPenolakan
    if (body.pesanPengumuman !== undefined)    updateData.pesanPengumuman = body.pesanPengumuman
    if (body.catatanDaftarUlang !== undefined) updateData.catatanDaftarUlang = body.catatanDaftarUlang

    // Verifikasi WhatsApp (dicek manual oleh admin)
    if (body.waVerified !== undefined)         updateData.waVerified = body.waVerified

    // Checklist per-berkas — DIGABUNG (bukan ditimpa) dengan yang sudah ada,
    // supaya menandai satu dokumen "Valid" tidak menghapus catatan dokumen
    // lain yang sudah lebih dulu ditandai "Perlu Revisi". Klien cukup
    // mengirim entri yang berubah saja, mis. { fileKK: { status: 'valid' } }.
    // Kirim `null` pada satu fieldKey untuk membersihkan tandanya (tombol ✕).
    // Revisi per-dokumen HARUS sampai ke siswa saat itu juga — admin bisa
    // menandai satu berkas "Perlu Revisi" tanpa melalui aksi "Tolak Berkas"
    // (yang baru mengubah status keseluruhan). Tanpa notifikasi di sini,
    // siswa tidak akan pernah tahu ada dokumen yang perlu diperbaiki sampai
    // admin membuat keputusan akhir kelulusan.
    const notifRevisiBerkas: { label: string; catatan?: string }[] = []
    if (body.validasiBerkas !== undefined) {
      const sudahAda = (existing.validasiBerkas as Record<string, { status?: string; catatan?: string }> | null) || {}
      const gabungan: Record<string, unknown> = { ...sudahAda }
      for (const [fieldKey, nilai] of Object.entries(body.validasiBerkas as Record<string, { status?: string; catatan?: string } | null>)) {
        if (nilai === null) { delete gabungan[fieldKey]; continue }
        gabungan[fieldKey] = nilai
        const sebelum = sudahAda[fieldKey]
        if (nilai.status === 'revisi' && (sebelum?.status !== 'revisi' || sebelum?.catatan !== nilai.catatan)) {
          notifRevisiBerkas.push({ label: FIELD_BERKAS[fieldKey] || fieldKey, catatan: nilai.catatan })
        }
      }
      updateData.validasiBerkas = gabungan
    }

    // Nilai seleksi
    if (body.nilaiSeleksi !== undefined && body.nilaiSeleksi !== '') {
      updateData.nilaiSeleksi = parseFloat(body.nilaiSeleksi)
    }

    // Konfirmasi daftar ulang
    if (body.sudahDaftarUlang !== undefined) {
      updateData.sudahDaftarUlang = body.sudahDaftarUlang
      if (body.sudahDaftarUlang === true) {
        updateData.tanggalDaftarUlang = new Date()
        // status tetap 'diterima_berkas' — daftar ulang cukup ditandai lewat sudahDaftarUlang
      }
    }

    // Terapkan/lepas diskon (section B2). Kalau totalTagihan BELUM terkunci,
    // cukup set diskonId — previewTagihan akan menghitungnya langsung saat
    // ditampilkan. Kalau SUDAH terkunci, diskonId baru tidak otomatis
    // mengubah tagihan — admin harus mengonfirmasi lewat body.hitungUlang
    // supaya tagihan yang sudah berjalan pembayarannya tidak berubah diam-diam.
    let diskonDipilihNama: string | null = null
    if (body.diskonId !== undefined) {
      if (body.diskonId) {
        const diskonDipilih = await prisma.diskon.findUnique({ where: { id: body.diskonId } })
        if (!diskonDipilih) {
          return NextResponse.json({ error: 'Diskon yang dipilih sudah tidak ada — muat ulang halaman lalu coba lagi' }, { status: 400 })
        }
        diskonDipilihNama = diskonDipilih.jenis
      }
      updateData.diskonId = body.diskonId || null
    }

    const updated = await prisma.pendaftaran.update({
      where: { id },
      data: updateData,
    })

    // Notifikasi ke pendaftar — cuma untuk perubahan yang sungguh terjadi
    // (dibandingkan dengan kondisi sebelum di-update), tidak menggagalkan
    // response kalau gagal (lihat lib/notifikasi.ts).
    if (updateData.status !== undefined && updateData.status !== existing.status) {
      const label = LABEL_STATUS[updateData.status] || updateData.status
      if (updateData.status === 'diterima_berkas') {
        await kirimNotifikasi(id, 'Selamat! Anda dinyatakan diterima. Silakan cek halaman Pendaftaran untuk info selanjutnya.')
      } else if (updateData.status === 'ditolak') {
        await kirimNotifikasi(id, 'Berkas Anda ditolak oleh admin. Silakan cek catatan admin dan kirim ulang berkas.')
      } else {
        await kirimNotifikasi(id, `Status pendaftaran Anda diperbarui menjadi "${label}".`)
      }
    }
    if (updateData.diskonId !== undefined && updateData.diskonId !== existing.diskonId) {
      await kirimNotifikasi(id, diskonDipilihNama
        ? `Diskon "${diskonDipilihNama}" telah diterapkan pada tagihan Anda.`
        : 'Diskon pada tagihan Anda telah dihapus oleh admin.')
    }
    if (updateData.sudahDaftarUlang === true && !existing.sudahDaftarUlang) {
      await kirimNotifikasi(id, 'Daftar ulang Anda telah dikonfirmasi oleh admin. Selamat bergabung!')
    }
    if (updateData.pesanPengumuman && updateData.pesanPengumuman !== existing.pesanPengumuman) {
      await kirimNotifikasi(id, 'Ada pengumuman baru dari admin — cek halaman Dashboard Anda.')
    }
    for (const r of notifRevisiBerkas) {
      await kirimNotifikasi(id, `Dokumen "${r.label}" perlu direvisi.${r.catatan ? ` Catatan admin: ${r.catatan}` : ''}`)
    }

    if (body.diskonId !== undefined && updated.totalTagihanLocked && body.hitungUlang === true) {
      await hitungUlangTagihan(id)
      // totalTagihan berubah -> statusPembayaran (lunas/cicilan berjalan/dst) HARUS
      // disegarkan juga di sini, supaya tidak ada jeda di mana badge status di
      // manapun (admin, dashboard siswa, laporan) menampilkan status lama yang
      // sudah tidak sesuai dengan tagihan barunya — keuangan harus tetap sinkron.
      const rehitung = await recalculatePembayaran(id)
      return NextResponse.json({ success: true, data: rehitung })
    }

    return NextResponse.json({ success: true, data: updated })
  } catch (err) {
    if (err instanceof HargaTidakDitemukanError) {
      return NextResponse.json({ error: err.message }, { status: 400 })
    }
    console.error('Update error:', err)
    return NextResponse.json({ error: 'Terjadi kesalahan' }, { status: 500 })
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const gate = await requirePermission('pendaftar', 'delete')
  if (!gate.ok) return gate.res
  try {
    const { id } = await params
    await prisma.pendaftaran.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Data tidak ditemukan' }, { status: 404 })
  }
}
