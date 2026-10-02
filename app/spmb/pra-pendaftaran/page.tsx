import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowLeft, CalendarClock, MessageCircle, Timer } from 'lucide-react'
import { FormPraPendaftaran } from '@/components/pra/FormPraPendaftaran'
import { YAYASAN_INFO } from '@/lib/biaya'
import { MASA_BERLAKU_HARI } from '@/lib/praPendaftaran'
import { ambilPersyaratanSemuaJenjang } from '@/lib/praPendaftaranServer'
import { resolveTahunAjaran } from '@/lib/tahunAjaran'
import '../landing.css'
import './pra.css'

export const metadata: Metadata = {
  title: 'Pra-Pendaftaran — SPMB Citra Negara',
  description:
    'Isi pra-pendaftaran singkat tanpa membuat akun untuk mendapatkan Bukti Pra-Pendaftaran dan antrean layanan pendaftaran di SMP, SMA, dan SMK Citra Negara.',
}

export const dynamic = 'force-dynamic'

export default async function HalamanPraPendaftaran() {
  const tahunAjaran = await resolveTahunAjaran()
  const persyaratan = tahunAjaran ? await ambilPersyaratanSemuaJenjang(tahunAjaran.id) : null
  const waSekolah = '62' + YAYASAN_INFO.telp.replace(/\D/g, '').replace(/^0/, '')

  return (
    <div className="lp-root">
      <main className="pra-halaman">
        <div className="pra-isi">
          <Link href="/spmb" className="pra-kembali" aria-label="Kembali ke beranda SPMB" title="Kembali ke beranda SPMB">
            <ArrowLeft size={18} aria-hidden="true" />
          </Link>

          <header className="pra-kartu pra-kepala">
            <Image src="/images/logo-bukti.png" alt="Logo Citra Negara" width={300} height={254} priority className="pra-kepala-logo" />
            <div className="pra-kepala-teks">
              <p className="pra-kepala-label">
                SPMB Citra Negara{tahunAjaran ? ` · Tahun Ajaran ${tahunAjaran.nama}` : ''}
              </p>
              <h1 className="pra-kepala-judul">Formulir Pra-Pendaftaran</h1>
              <p className="pra-kepala-sub">
                Lengkapi data singkat berikut untuk mendapatkan Bukti Pra-Pendaftaran. Bawa bukti tersebut ke sekolah dalam
                waktu maksimal {MASA_BERLAKU_HARI} hari untuk melanjutkan proses pendaftaran.
              </p>
            </div>
            <ul className="pra-chip-deret" aria-label="Keterangan singkat">
              <li className="pra-chip"><Timer size={14} aria-hidden="true" /> ± 2 menit</li>
              <li className="pra-chip"><CalendarClock size={14} aria-hidden="true" /> Berlaku {MASA_BERLAKU_HARI} hari</li>
            </ul>
          </header>

          {tahunAjaran && persyaratan ? (
            <FormPraPendaftaran persyaratan={persyaratan} />
          ) : (
            <div className="pra-kartu pra-tutup">
              <h2>Pra-pendaftaran belum dibuka</h2>
              <p>Jadwal penerimaan tahun ajaran baru belum diumumkan. Silakan hubungi petugas SPMB untuk informasi terbaru.</p>
              <a className="pra-bantuan-tombol" href={`https://wa.me/${waSekolah}`} target="_blank" rel="noopener noreferrer">
                <MessageCircle size={17} aria-hidden="true" /> Hubungi Petugas
              </a>
            </div>
          )}

          <p className="pra-kaki">© {new Date().getFullYear()} SPMB Citra Negara</p>
        </div>
      </main>
    </div>
  )
}
