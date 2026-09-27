import type { Metadata } from 'next'
import { getDataLanding } from '@/lib/landing'
import { Pembuka } from '@/components/landing/Pembuka'
import { Navigation } from '@/components/landing/Navigation'
import { Hero } from '@/components/landing/Hero'
import { Intro } from '@/components/landing/Intro'
import { JenjangStory } from '@/components/landing/JenjangStory'
import { AlurSPMB } from '@/components/landing/AlurSPMB'
import { JadwalBiaya } from '@/components/landing/JadwalBiaya'
import { Persyaratan } from '@/components/landing/Persyaratan'
import { MitraIndustri } from '@/components/landing/MitraIndustri'
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
 * Urutan bab tetap: hero (termasuk deret nilai MANTAP) → intro → jenjang →
 * alur → jadwal & biaya → persyaratan → mengapa → penutup → footer. Bab
 * jenjang dan alur disambung satu tulisan raksasa "CN" (lihat JenjangStory).
 * Program keahlian SMK tidak lagi tampil sebagai bab tersendiri di sini — daftarnya masih bisa
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
    /** Berlatar "Section" (#f6f8f5) — selang-seling dengan bab putih. */
    lembut?: boolean
    id?: string
  }[] = [
    // id 'nilai': hasil pencarian "Nilai MANTAP" diarahkan ke hero, tempat
    // deret nilai (yang bisa diklik) berada.
    { kunci: 'hero',        id: 'nilai', isi: <Hero tahunAjaran={namaTA} /> },
    { kunci: 'intro',       isi: <Intro /> },
    { kunci: 'jenjang',     id: 'bab-jenjang',
      isi: <JenjangStory daftar={data.jenjang.map(j => ({ jenjang: j.jenjang, singkat: j.singkat, label: j.label }))} /> },
    { kunci: 'alur',        tinggi: true, isi: <AlurSPMB /> },
    // Jadwal & biaya satu bab (tab SMP/SMA/SMK) — id #jadwal & #biaya ada di dalamnya.
    { kunci: 'jadwal-biaya', isi: <JadwalBiaya jenjang={data.jenjang} /> },
    { kunci: 'persyaratan', lembut: true, isi: <Persyaratan jenjang={data.jenjang} /> },
    { kunci: 'mengapa',     id: 'mengapa', isi: <MitraIndustri /> },
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
      <Pembuka tahunAjaran={namaTA} />
      <Navigation />

      {BAB.map(b => (
        <div key={b.kunci} id={b.id} className={['lp-bab-tegak', b.tinggi && 'lp-bab--tinggi', b.lembut && 'lp-bab--lembut'].filter(Boolean).join(' ')}>
          {b.isi}
        </div>
      ))}
    </div>
  )
}
