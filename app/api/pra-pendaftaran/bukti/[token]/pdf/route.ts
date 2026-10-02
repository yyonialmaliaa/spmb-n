import { buatPdfBuktiPra, responsPdf } from '@/lib/buktiPraPdf'
import { namaBerkasBukti } from '@/lib/praPendaftaran'
import { ambilDataBukti, ipKlien, lolosBatasLaju, tokenSah } from '@/lib/praPendaftaranServer'

// GET — PDF bukti untuk pendaftar tanpa akun; token acak 256-bit adalah satu-satunya kunci aksesnya.
export async function GET(req: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  if (!tokenSah(token)) return new Response('Bukti tidak ditemukan.', { status: 404 })
  if (!lolosBatasLaju(`pdf:${ipKlien(req)}`, 30, 60_000)) {
    return new Response('Terlalu banyak permintaan. Coba lagi sebentar lagi.', { status: 429 })
  }

  try {
    const data = await ambilDataBukti({ tokenAkses: token })
    if (!data) return new Response('Bukti tidak ditemukan.', { status: 404 })
    return responsPdf(await buatPdfBuktiPra(data), namaBerkasBukti(data.noPraPendaftaran))
  } catch (err) {
    console.error('PDF bukti pra-pendaftaran error:', err)
    return new Response('Gagal membuat PDF bukti. Silakan coba lagi.', { status: 500 })
  }
}
