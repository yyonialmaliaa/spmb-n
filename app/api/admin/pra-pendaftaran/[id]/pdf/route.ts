import { NextResponse } from 'next/server'
import { requireJenjang, requirePermission } from '@/lib/adminSession'
import { buatPdfBuktiPra, responsPdf } from '@/lib/buktiPraPdf'
import { namaBerkasBukti } from '@/lib/praPendaftaran'
import { ambilDataBukti } from '@/lib/praPendaftaranServer'

// GET — salinan PDF bukti untuk petugas, mis. saat pendaftar kehilangan buktinya.
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const gate = await requirePermission('pra_pendaftaran', 'read')
  if (!gate.ok) return gate.res

  try {
    const { id } = await params
    const data = await ambilDataBukti({ id })
    if (!data) return NextResponse.json({ error: 'Data pra-pendaftaran tidak ditemukan' }, { status: 404 })
    const tolak = requireJenjang(gate.session, data.jenjang)
    if (tolak) return tolak
    return responsPdf(await buatPdfBuktiPra(data), namaBerkasBukti(data.noPraPendaftaran))
  } catch (err) {
    console.error('PDF bukti pra-pendaftaran (admin) error:', err)
    return NextResponse.json({ error: 'Gagal membuat PDF' }, { status: 500 })
  }
}
