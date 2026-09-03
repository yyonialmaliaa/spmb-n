import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { hitungTotalDisetorkan, getMinimalPembayaranAwal, lockTagihanJikaBelum, formatRupiah, HargaTidakDitemukanError } from '@/lib/keuangan'

// POST - "Kirim Formulir" (section A2): mengubah draft menjadi status
// "verified" (masuk ke admin). Ditolak kalau field wajib belum lengkap ATAU
// user belum menyetor pembayaran pendaftaran minimal (default Rp200.000,
// lihat PengaturanKeuangan). Menyetor cukup — TIDAK perlu menunggu admin
// memverifikasi pembayarannya (keputusan produk: gerbang dibuka begitu
// bukti pembayaran disetor).
export async function POST() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const pendaftaran = await prisma.pendaftaran.findUnique({
      where: { userId: session.userId },
      include: { pembayaranList: true },
    })
    if (!pendaftaran) return NextResponse.json({ error: 'Data pendaftaran belum dibuat' }, { status: 404 })
    if (pendaftaran.status !== 'draft') {
      return NextResponse.json({ error: 'Formulir sudah dikirim sebelumnya' }, { status: 400 })
    }

    const isSMP = pendaftaran.jenjang === 'smp'
    const isBaru = pendaftaran.tipePendaftaran !== 'pindahan'

    if (isSMP && isBaru && !pendaftaran.asalSD) {
      return NextResponse.json({ error: 'Asal SD/MI wajib diisi untuk pendaftaran SMP baru' }, { status: 400 })
    }
    if (!isSMP && !pendaftaran.asalSMP) {
      return NextResponse.json({ error: 'Asal SMP/MTs wajib diisi' }, { status: 400 })
    }
    if (!pendaftaran.namaLengkap || !pendaftaran.jenisKelamin || !pendaftaran.agama) {
      return NextResponse.json({ error: 'Data pribadi belum lengkap' }, { status: 400 })
    }
    if (!isSMP && !pendaftaran.jurusan) {
      return NextResponse.json({ error: 'Jurusan wajib dipilih' }, { status: 400 })
    }
    if (!pendaftaran.nik || pendaftaran.nik.length !== 16) {
      return NextResponse.json({ error: 'NIK wajib diisi (16 digit)' }, { status: 400 })
    }
    if (!pendaftaran.fileIjazah) return NextResponse.json({ error: 'Berkas Ijazah/SKL wajib diunggah' }, { status: 400 })
    if (!pendaftaran.fileAkte) return NextResponse.json({ error: 'Berkas Akte Kelahiran wajib diunggah' }, { status: 400 })
    if (!pendaftaran.fileKK) return NextResponse.json({ error: 'Berkas Kartu Keluarga wajib diunggah' }, { status: 400 })
    if (!pendaftaran.fileKtpOrtu) return NextResponse.json({ error: 'Berkas KTP Orang Tua wajib diunggah' }, { status: 400 })
    if (!pendaftaran.fileFoto) return NextResponse.json({ error: 'Berkas Pas Foto wajib diunggah' }, { status: 400 })

    const minimal = await getMinimalPembayaranAwal(pendaftaran.tahunAjaranId)
    const totalDisetorkan = hitungTotalDisetorkan(pendaftaran.pembayaranList)
    if (totalDisetorkan < minimal) {
      return NextResponse.json(
        { error: `Formulir belum dapat dikirim. Anda harus membayar uang pendaftaran minimal ${formatRupiah(minimal)} terlebih dahulu.` },
        { status: 400 }
      )
    }

    await lockTagihanJikaBelum(pendaftaran.id)

    const asalSekolah = isSMP && isBaru ? pendaftaran.asalSD : (pendaftaran.asalSMP || pendaftaran.asalSekolah)
    const namaOrtu = pendaftaran.namaOrtu || pendaftaran.namaAyah || pendaftaran.namaIbu || pendaftaran.namaWali || null
    const noOrtu = pendaftaran.noOrtu || pendaftaran.noHpAyah || pendaftaran.noHpIbu || pendaftaran.noHpWali || null
    const ttl = pendaftaran.ttl || `${pendaftaran.tempatLahir || ''}, ${pendaftaran.tanggalLahir || ''}`

    const updated = await prisma.pendaftaran.update({
      where: { id: pendaftaran.id },
      data: { status: 'verified', asalSekolah, namaOrtu, noOrtu, ttl },
    })

    return NextResponse.json({ success: true, data: updated })
  } catch (err) {
    if (err instanceof HargaTidakDitemukanError) {
      return NextResponse.json({ error: err.message }, { status: 400 })
    }
    console.error('Kirim formulir error:', err)
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 })
  }
}
