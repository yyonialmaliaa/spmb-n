import type { Metadata } from 'next'
import { getDataLanding } from '@/lib/landing'
import { Pembuka } from '@/components/landing/Pembuka'
import { Navigation } from '@/components/landing/Navigation'
import { Hero } from '@/components/landing/Hero'
import { Intro } from '@/components/landing/Intro'
import { Values } from '@/components/landing/Values'
import { JenjangStory } from '@/components/landing/JenjangStory'
import { Experience } from '@/components/landing/Experience'
import { AlurSPMB } from '@/components/landing/AlurSPMB'
import { JadwalSPMB } from '@/components/landing/JadwalSPMB'
import { Biaya } from '@/components/landing/Biaya'
import { Persyaratan } from '@/components/landing/Persyaratan'
import { WhyCitraNegara } from '@/components/landing/WhyCitraNegara'
import { FinalCTA } from '@/components/landing/FinalCTA'
import { Footer } from '@/components/landing/Footer'
import './landing.css'

export const metadata: Metadata = {
  title: 'SPMB Citra Negara — Penerimaan Murid Baru',
  description:
    'Penerimaan murid baru Citra Negara untuk jenjang SMP, SMA, dan SMK. Kenali jenjang, alur pendaftaran, jadwal, biaya, dan persyaratannya.',
}

// Halaman ini membaca tahun ajaran yang sedang aktif, jadi tidak boleh
// dibekukan saat build — ia harus ikut berubah ketika admin mengganti
// tahun ajaran, harga, jadwal, atau persyaratan.
export const dynamic = 'force-dynamic'

/**
 * Landing page SPMB Citra Negara.
 *
 * Server component: seluruh angka (tahun ajaran, jadwal, harga, persyaratan)
 * sudah ada di HTML pertama, dibaca langsung dari database yang sama dengan
 * yang dikelola admin.
 *
 * Seluruh halaman bergulir MENURUN seperti halaman biasa, di semua ukuran
 * layar — tidak ada bagian yang bergeser ke samping.
 *
 * Urutan bab tetap: hero → intro → nilai → jenjang → pengalaman → alur →
 * jadwal → biaya → persyaratan → mengapa → penutup → footer. Program keahlian
 * SMK tidak lagi tampil sebagai bab tersendiri di sini — daftarnya masih bisa
 * dilihat di halaman detail /spmb/jenjang/smk (yang punya markup sendiri,
 * tidak lewat komponen SMKPrograms — komponen itu sudah dihapus karena
 * setelah ini tidak dipakai di mana pun lagi).
 */
export default async function LandingSPMB() {
  const data = await getDataLanding()
  const namaTA = data.tahunAjaran?.nama ?? null

  // Satu daftar untuk urutan bab dan isinya.
  const BAB: {
    kunci: string
    isi: React.ReactNode
    /** Ruang atas/bawah ekstra (Alur SPMB, Penutup+Footer). */
    tinggi?: boolean
    id?: string
  }[] = [
    { kunci: 'hero',        isi: <Hero tahunAjaran={namaTA} /> },
    { kunci: 'intro',       isi: <Intro /> },
    { kunci: 'nilai',       isi: <Values /> },
    { kunci: 'jenjang',     id: 'bab-jenjang',
      isi: <JenjangStory daftar={data.jenjang.map(j => ({ jenjang: j.jenjang, singkat: j.singkat, label: j.label }))} /> },
    { kunci: 'pengalaman',  isi: <Experience /> },
    { kunci: 'alur',        tinggi: true, isi: <AlurSPMB /> },
    { kunci: 'jadwal',      isi: <JadwalSPMB jenjang={data.jenjang} /> },
    { kunci: 'biaya',       isi: <Biaya jenjang={data.jenjang} /> },
    { kunci: 'persyaratan', isi: <Persyaratan jenjang={data.jenjang} /> },
    { kunci: 'mengapa',     isi: <WhyCitraNegara /> },
    { kunci: 'penutup', tinggi: true,
      isi: (
        <>
          <FinalCTA tahunAjaran={namaTA} />
          <Footer tahunAjaran={namaTA} />
        </>
      ) },
  ]

  return (
    <div className="lp-root">
      {/* Penanda anti-kedip tirai (data-pembuka) dipasang skrip di
          app/layout.tsx, bukan di sini — lihat komentar di sana. */}
      <Pembuka />
      <Navigation />

      {BAB.map(b => (
        <div key={b.kunci} id={b.id} className={b.tinggi ? 'lp-bab-tegak lp-bab--tinggi' : 'lp-bab-tegak'}>
          {b.isi}
        </div>
      ))}
    </div>
  )
}
