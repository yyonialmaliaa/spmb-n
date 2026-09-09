import type { Metadata } from 'next'
import { getDataLanding } from '@/lib/landing'
import { Pembuka } from '@/components/landing/Pembuka'
import { JalurMendatar, Bab } from '@/components/landing/JalurMendatar'
import { Kemajuan } from '@/components/landing/Kemajuan'
import { Navigation } from '@/components/landing/Navigation'
import { Hero } from '@/components/landing/Hero'
import { Intro } from '@/components/landing/Intro'
import { Values } from '@/components/landing/Values'
import { JenjangStory } from '@/components/landing/JenjangStory'
import { Experience } from '@/components/landing/Experience'
import { SMKPrograms } from '@/components/landing/SMKPrograms'
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
 * Server component: seluruh angka (tahun ajaran, jadwal, harga, persyaratan,
 * program keahlian) sudah ada di HTML pertama, dibaca langsung dari database
 * yang sama dengan yang dikelola admin.
 *
 * SUMBU UTAMANYA MENDATAR di layar lebar — gulir ke bawah memajukan cerita ke
 * kanan, satu bab satu layar. Deretan yang tadinya bergerak mendatar (jenjang,
 * program keahlian, alur) otomatis membalik jadi menurun di dalam babnya,
 * sehingga tidak ada dua gulir mendatar yang saling berebut.
 *
 * Di ponsel dan bagi pengguna yang meminta gerak dikurangi, seluruhnya kembali
 * menurun seperti halaman biasa.
 *
 * Urutan bab tetap: hero → intro → nilai → jenjang → pengalaman → program SMK
 * → alur → jadwal → biaya → persyaratan → mengapa → penutup → footer.
 */
export default async function LandingSPMB() {
  const data = await getDataLanding()
  const namaTA = data.tahunAjaran?.nama ?? null

  // Satu daftar untuk urutan bab dan isinya — supaya urutan cerita dan
  // penanda kemajuan mustahil saling meleset.
  const BAB: {
    kunci: string
    nama: string
    isi: React.ReactNode
    lebar?: boolean
    tinggi?: boolean
    id?: string
  }[] = [
    { kunci: 'hero',        nama: 'Pembuka',              isi: <Hero tahunAjaran={namaTA} /> },
    { kunci: 'intro',       nama: 'Tentang',              isi: <Intro /> },
    { kunci: 'nilai',       nama: 'Yang Kami Pegang',     lebar: true, isi: <Values /> },
    { kunci: 'jenjang',     nama: 'Jenjang',              lebar: true, id: 'bab-jenjang',
      isi: <JenjangStory daftar={data.jenjang.map(j => ({ jenjang: j.jenjang, singkat: j.singkat, label: j.label }))} /> },
    { kunci: 'pengalaman',  nama: 'Pengalaman',           lebar: true, isi: <Experience /> },
    { kunci: 'program',     nama: 'Program Keahlian',     lebar: true, isi: <SMKPrograms program={data.programSMK} /> },
    { kunci: 'alur',        nama: 'Alur SPMB',            lebar: true, tinggi: true, isi: <AlurSPMB /> },
    { kunci: 'jadwal',      nama: 'Jadwal',               lebar: true, isi: <JadwalSPMB jenjang={data.jenjang} /> },
    { kunci: 'biaya',       nama: 'Biaya',                lebar: true, isi: <Biaya jenjang={data.jenjang} /> },
    { kunci: 'persyaratan', nama: 'Persyaratan',          lebar: true, isi: <Persyaratan jenjang={data.jenjang} /> },
    { kunci: 'mengapa',     nama: 'Mengapa Citra Negara', isi: <WhyCitraNegara /> },
    // Penutup dan footer SATU bab, bukan dua. Sebelumnya footer punya bab
    // sendiri, sehingga di mode mendatar ia terasa sebagai "layar kosong"
    // yang berdiri sendirian setelah CTA. Digabung + ditandai `tinggi`
    // (pola yang sama dipakai Alur SPMB), footer sekarang menyusul CTA di
    // dalam bab yang sama — dicapai dengan menggulir sedikit lagi, bukan
    // dengan berpindah ke "chapter" baru.
    { kunci: 'penutup', nama: 'Daftar Sekarang', lebar: true, tinggi: true,
      isi: (
        <>
          <FinalCTA tahunAjaran={namaTA} />
          <Footer tahunAjaran={namaTA} />
        </>
      ) },
  ]

  const NAMA_BAB = BAB.map(b => b.nama)

  return (
    <div className="lp-root">
      {/* Penanda anti-kedip tirai (data-pembuka) dipasang skrip di
          app/layout.tsx, bukan di sini — lihat komentar di sana. */}
      <Pembuka />
      <Navigation />

      {/* Penanda kemajuan dikirim lewat prop `lapisan`, BUKAN sebagai anak —
          agar tidak ikut tergeser bersama jalur. Nama babnya harus urut sama
          persis dengan urutan <Bab> di bawah. */}
      <JalurMendatar lapisan={<Kemajuan bab={NAMA_BAB} />}>
        {BAB.map(b => (
          <Bab
            key={b.kunci}
            id={b.id}
            lebar={b.lebar}
            tinggi={b.tinggi}
          >
            {b.isi}
          </Bab>
        ))}
      </JalurMendatar>
    </div>
  )
}
