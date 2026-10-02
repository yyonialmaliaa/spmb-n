import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, CalendarClock, Check, CircleAlert, CircleCheckBig, Hourglass } from 'lucide-react'
import { AksiBukti, SalinNomor } from '@/components/pra/AksiBukti'
import { KertasBukti } from '@/components/pra/KertasBukti'
import { JENJANG_LABEL_FULL } from '@/lib/labels'
import { STATUS_PRA, namaBerkasBukti, tanggalWib, teksSisaHari } from '@/lib/praPendaftaran'
import { ambilDataBukti, tokenSah, type DataBukti } from '@/lib/praPendaftaranServer'
import '../../../landing.css'
import '../../pra.css'

export const metadata: Metadata = {
  title: 'Bukti Pra-Pendaftaran — SPMB Citra Negara',
  robots: { index: false, follow: false },
}

export const dynamic = 'force-dynamic'

type Props = {
  params: Promise<{ token: string }>
  searchParams: Promise<{ unduh?: string }>
}

function naskah(data: DataBukti) {
  const batas = tanggalWib(data.batasKedatangan)
  switch (data.status) {
    case 'kedaluwarsa':
      return {
        judul: 'Bukti Sudah Kedaluwarsa',
        sub: `Batas kedatangan ${batas} sudah lewat, sehingga pra-pendaftaran ini tidak dapat diproses lagi. Silakan isi pra-pendaftaran baru.`,
        tenggat: `Kedaluwarsa sejak ${batas}.`,
        nada: 'bahaya' as const,
      }
    case 'datang':
    case 'diproses':
      return {
        judul: 'Kedatangan Sudah Dikonfirmasi',
        sub: 'Petugas SPMB sedang memproses pendaftaran resmi Anda di sekolah.',
        tenggat: 'Kedatangan Anda sudah tercatat. Ikuti arahan petugas untuk melanjutkan pendaftaran.',
        nada: 'sukses' as const,
      }
    case 'selesai':
      return {
        judul: 'Pendaftaran Resmi Sudah Dibuat',
        sub: data.noPendaftaranResmi
          ? `Nomor pendaftaran resmi Anda: ${data.noPendaftaranResmi}. Tahap SPMB berikutnya mengikuti arahan petugas.`
          : 'Tahap SPMB berikutnya mengikuti arahan petugas.',
        tenggat: 'Pra-pendaftaran ini sudah selesai diproses menjadi pendaftaran resmi.',
        nada: 'sukses' as const,
      }
    default:
      return {
        judul: 'Pra-Pendaftaran Berhasil',
        sub: `Simpan bukti di bawah ini, lalu datang ke sekolah paling lambat ${batas} dengan membawa dokumen persyaratan.`,
        tenggat: `${teksSisaHari(data.batasKedatangan)}: datang paling lambat ${batas}. Lewat dari tanggal itu, bukti otomatis kedaluwarsa.`,
        nada: 'peringatan' as const,
      }
  }
}

export default async function HalamanBuktiPra({ params, searchParams }: Props) {
  const { token } = await params
  if (!tokenSah(token)) notFound()
  const data = await ambilDataBukti({ tokenAkses: token })
  if (!data) notFound()

  const { unduh } = await searchParams
  const isi = naskah(data)
  const status = STATUS_PRA[data.status]
  const kedaluwarsa = data.status === 'kedaluwarsa'
  const teksBagikan = [
    'Bukti Pra-Pendaftaran SPMB Citra Negara',
    `Nomor: ${data.noPraPendaftaran}`,
    `Nama: ${data.namaLengkap}`,
    `Jenjang: ${JENJANG_LABEL_FULL[data.jenjang]}`,
    `Datang paling lambat: ${tanggalWib(data.batasKedatangan)}`,
  ].join('\n')

  return (
    <div className="lp-root">
      <main className="pra-halaman">
        <div className="pra-isi pra-hasil">
          <Link href="/spmb" className="pra-kembali pra-tanpa-cetak" aria-label="Kembali ke beranda SPMB" title="Kembali ke beranda SPMB">
            <ArrowLeft size={18} aria-hidden="true" />
          </Link>

          <header className="pra-kartu pra-kepala pra-tanpa-cetak">
            <span className={`pra-kepala-ikon${kedaluwarsa ? ' pra-kepala-ikon--lewat' : ''}`} aria-hidden="true">
              {kedaluwarsa ? <Hourglass size={24} /> : <Check size={26} strokeWidth={2.6} />}
            </span>
            <div className="pra-kepala-teks">
              <p className="pra-kepala-label">SPMB Citra Negara · Tahun Ajaran {data.tahunAjaranNama}</p>
              <h1 className="pra-kepala-judul">{isi.judul}</h1>
              <p className="pra-kepala-sub">{isi.sub}</p>
            </div>
          </header>

          <div className="pra-kartu pra-aksi pra-tanpa-cetak">
            <div className="pra-aksi-atas">
              <div>
                <p className="pra-nomor-label">Nomor Pra-Pendaftaran</p>
                <p className="pra-nomor">
                  <span>{data.noPraPendaftaran}</span>
                  <SalinNomor nomor={data.noPraPendaftaran} />
                </p>
              </div>
              <span className={`pra-status pra-status--${status.nada}`}>{status.teks}</span>
            </div>

            <div className={`pra-tenggat${isi.nada === 'bahaya' ? ' pra-tenggat--bahaya' : ''}`}>
              {isi.nada === 'bahaya'
                ? <CircleAlert size={18} aria-hidden="true" />
                : isi.nada === 'sukses'
                  ? <CircleCheckBig size={18} aria-hidden="true" />
                  : <CalendarClock size={18} aria-hidden="true" />}
              <span>{isi.tenggat}</span>
            </div>

            {kedaluwarsa ? (
              <div className="pra-aksi-tombol" style={{ gridTemplateColumns: 'minmax(0, 1fr)' }}>
                <Link className="lp-tombol lp-tombol--utama" href="/spmb/pra-pendaftaran">Isi Pra-Pendaftaran Baru</Link>
              </div>
            ) : (
              <AksiBukti
                token={token}
                nomor={data.noPraPendaftaran}
                namaBerkas={namaBerkasBukti(data.noPraPendaftaran)}
                teksBagikan={teksBagikan}
                unduhOtomatis={unduh === '1' && data.status === 'menunggu'}
              />
            )}

            <p className="pra-pesan-kecil">
              Simpan halaman ini atau berkas PDF-nya. Bila bukti hilang, petugas SPMB dapat mencetak ulang berdasarkan nama dan nomor HP.
            </p>
          </div>

          <KertasBukti data={data} />
        </div>
      </main>
    </div>
  )
}
