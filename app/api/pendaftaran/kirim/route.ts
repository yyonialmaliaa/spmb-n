import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { hitungTotalDisetorkan, getMinimalPembayaranAwal, lockTagihanJikaBelum, formatRupiah, HargaTidakDitemukanError } from '@/lib/keuangan'
import { notifPendaftarBaru } from '@/lib/notifikasiAdmin'
import { buatNomorPendaftaran } from '@/lib/nomorPendaftaran'
import { asalDariSD, kekuranganFormulir } from '@/lib/kelas'

// POST - "Kirim Formulir" (section A2): mengubah draft menjadi status
// "verified" (masuk ke admin). Ditolak kalau field wajib belum lengkap
// (kekuranganFormulir — definisi yang sama dengan gembok portal) ATAU
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
      include: { pembayaranList: true, tahunAjaran: true },
    })
    if (!pendaftaran) return NextResponse.json({ error: 'Data pendaftaran belum dibuat' }, { status: 404 })
    if (pendaftaran.status !== 'draft') {
      return NextResponse.json({ error: 'Formulir sudah dikirim sebelumnya' }, { status: 400 })
    }

    const kurang = kekuranganFormulir(pendaftaran)
    if (kurang.length > 0) {
      return NextResponse.json({ error: `Formulir belum lengkap: ${kurang.join(', ')}.` }, { status: 400 })
    }
    const dariSD = asalDariSD(pendaftaran.jenjang, pendaftaran.tipePendaftaran)

    const minimal = await getMinimalPembayaranAwal(pendaftaran.tahunAjaranId)
    const totalDisetorkan = hitungTotalDisetorkan(pendaftaran.pembayaranList)
    if (totalDisetorkan < minimal) {
      return NextResponse.json(
        { error: `Formulir belum dapat dikirim. Anda harus membayar uang pendaftaran minimal ${formatRupiah(minimal)} terlebih dahulu.` },
        { status: 400 }
      )
    }

    await lockTagihanJikaBelum(pendaftaran.id)

    const asalSekolah = dariSD ? pendaftaran.asalSD : (pendaftaran.asalSMP || pendaftaran.asalSekolah)
    const namaOrtu = pendaftaran.namaOrtu || pendaftaran.namaAyah || pendaftaran.namaIbu || pendaftaran.namaWali || null
    const noOrtu = pendaftaran.noOrtu || pendaftaran.noHpAyah || pendaftaran.noHpIbu || pendaftaran.noHpWali || null
    const ttl = pendaftaran.ttl || `${pendaftaran.tempatLahir || ''}, ${pendaftaran.tanggalLahir || ''}`

    // Nomor resmi dibuat TEPAT DI SINI, sekali seumur hidup pendaftaran ini
    // — inilah momen "formulir berhasil dikirim" yang dimaksud. Kondisi
    // `!pendaftaran.noPendaftaran` murni jaga-jaga (status sudah dijaga
    // ketat 'draft' di atas, jadi endpoint ini semestinya tidak pernah
    // dipanggil dua kali untuk pendaftaran yang sama) — tapi tidak ada
    // ruginya tidak menimpa nomor yang entah bagaimana sudah ada.
    const noPendaftaran =
      pendaftaran.noPendaftaran ??
      (await buatNomorPendaftaran({
        tahunAjaranId: pendaftaran.tahunAjaranId,
        tahunAjaranNama: pendaftaran.tahunAjaran.nama,
        jenjang: pendaftaran.jenjang,
      }))

    const updated = await prisma.pendaftaran.update({
      where: { id: pendaftaran.id },
      data: { status: 'verified', asalSekolah, namaOrtu, noOrtu, ttl, noPendaftaran, submittedAt: new Date() },
    })

    // Inilah saat pendaftar online benar-benar masuk antrean kerja admin
    // (draft -> verified). Sengaja di sini, bukan saat draft dibuat: draft
    // belum tentu dilanjutkan, dan memang dikecualikan dari semua hitungan.
    await notifPendaftarBaru({
      id: updated.id,
      namaLengkap: updated.namaLengkap,
      jenjang: updated.jenjang,
      tahunAjaranId: updated.tahunAjaranId,
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
