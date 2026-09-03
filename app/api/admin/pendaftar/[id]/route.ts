import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { hitungUlangTagihan, previewTagihan, recalculatePembayaran, HargaTidakDitemukanError } from '@/lib/keuangan'
import { kirimNotifikasi } from '@/lib/notifikasi'

const LABEL_STATUS: Record<string, string> = {
  verified: 'Sedang Diverifikasi',
  diterima_berkas: 'Diterima',
  ditolak: 'Berkas Ditolak',
}

// GET - detail lengkap satu pendaftar, termasuk riwayat cicilan pembayaran
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession()
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  try {
    const { id } = await params
    const data = await prisma.pendaftaran.findUnique({
      where: { id },
      include: {
        user: { select: { email: true } },
        pembayaranList: { orderBy: { angsuranKe: 'asc' } },
      },
    })
    if (!data) return NextResponse.json({ error: 'Data tidak ditemukan' }, { status: 404 })
    const breakdown = await previewTagihan(id)
    return NextResponse.json({ data: { ...data, breakdown } })
  } catch (err) {
    console.error('Get detail error:', err)
    return NextResponse.json({ error: 'Terjadi kesalahan' }, { status: 500 })
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession()
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const { id } = await params
    const body = await req.json()

    const allowed = ['verified', 'diterima_berkas', 'ditolak']
    if (body.status && !allowed.includes(body.status)) {
      return NextResponse.json({ error: 'Status tidak valid' }, { status: 400 })
    }

    // Kondisi SEBELUM diubah — dipakai untuk mendeteksi apa yang sungguh
    // berubah, supaya notifikasi ke pendaftar cuma dikirim untuk perubahan
    // yang nyata (bukan setiap kali PUT dipanggil).
    const existing = await prisma.pendaftaran.findUnique({ where: { id } })
    if (!existing) return NextResponse.json({ error: 'Data tidak ditemukan' }, { status: 404 })

    const updateData: Record<string, any> = {}

    if (body.status !== undefined)            updateData.status = body.status
    if (body.catatan !== undefined)            updateData.catatan = body.catatan
    if (body.alasanPenolakan !== undefined)    updateData.alasanPenolakan = body.alasanPenolakan
    if (body.pesanPengumuman !== undefined)    updateData.pesanPengumuman = body.pesanPengumuman
    if (body.catatanDaftarUlang !== undefined) updateData.catatanDaftarUlang = body.catatanDaftarUlang

    // Verifikasi WhatsApp (dicek manual oleh admin)
    if (body.waVerified !== undefined)         updateData.waVerified = body.waVerified

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
  const session = await getSession()
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  try {
    const { id } = await params
    await prisma.pendaftaran.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Data tidak ditemukan' }, { status: 404 })
  }
}
