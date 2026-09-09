'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { ArrowRight, UserPlus, Layers, ClipboardList, Upload, ShieldCheck, BellRing, type LucideIcon } from 'lucide-react'
import { Muncul, JudulBaris } from './gerak'

// Enam langkah ini mencerminkan alur yang BENAR-BENAR dijalankan sistem —
// urutannya sama dengan yang ditegakkan /api/pendaftaran dan /api/pendaftaran/kirim.
const LANGKAH: { no: string; judul: string; teks: string; ikon: LucideIcon }[] = [
  { no: '01', judul: 'Registrasi Akun', ikon: UserPlus, teks: 'Daftarkan email untuk membuat akun SPMB. Satu akun untuk satu calon peserta didik.' },
  { no: '02', judul: 'Pilih Jenjang', ikon: Layers, teks: 'Tentukan SMP, SMA, atau SMK. Pilihan ini menentukan formulir dan persyaratan yang muncul.' },
  { no: '03', judul: 'Lengkapi Formulir', ikon: ClipboardList, teks: 'Isi data diri, data orang tua, dan asal sekolah. Isian tersimpan otomatis, boleh dilanjutkan kapan saja.' },
  { no: '04', judul: 'Unggah Dokumen', ikon: Upload, teks: 'Sertakan berkas persyaratan sesuai jenjang yang dipilih dalam format PDF atau gambar.' },
  { no: '05', judul: 'Verifikasi', ikon: ShieldCheck, teks: 'Petugas memeriksa kelengkapan berkas dan keabsahan data yang dikirimkan.' },
  { no: '06', judul: 'Lihat Status', ikon: BellRing, teks: 'Hasil pemeriksaan muncul di dashboard akun, lengkap dengan catatan bila ada yang perlu diperbaiki.' },
]

/**
 * Alur pendaftaran sebagai cerita MENURUN.
 *
 * Berbeda dari bab lain yang deretannya mendatar, bagian ini sengaja dibaca
 * dari atas ke bawah: satu langkah menyusul langkah lain, seperti orang yang
 * benar-benar menjalaninya. Langkah yang sedang berada di tengah layar
 * disorot, dan garis waktu di sebelahnya ikut terisi mengikuti posisi gulir.
 *
 * Sorotan ditentukan IntersectionObserver — bukan hover atau klik — sehingga
 * yang menggerakkannya memang posisi gulir pengguna.
 */
export function AlurSPMB() {
  const [aktif, setAktif] = useState(0)
  const wadah = useRef<HTMLOListElement | null>(null)

  useEffect(() => {
    const el = wadah.current
    if (!el) return
    const baris = Array.from(el.querySelectorAll<HTMLElement>('[data-langkah]'))
    if (baris.length === 0) return

    const io = new IntersectionObserver(
      entri => {
        // Ambil yang paling dekat dengan tengah layar, bukan yang pertama
        // menyentuh tepi — supaya sorotannya terasa mengikuti mata.
        const terlihat = entri.filter(e => e.isIntersecting)
        if (terlihat.length === 0) return
        const tengah = window.innerHeight / 2
        let pilih = -1
        let jarakTerdekat = Infinity
        for (const e of terlihat) {
          const k = e.boundingClientRect
          const jarak = Math.abs(k.top + k.height / 2 - tengah)
          if (jarak < jarakTerdekat) {
            jarakTerdekat = jarak
            pilih = Number((e.target as HTMLElement).dataset.langkah)
          }
        }
        if (pilih >= 0) setAktif(pilih)
      },
      { rootMargin: '-35% 0px -35% 0px', threshold: 0 },
    )
    baris.forEach(b => io.observe(b))
    return () => io.disconnect()
  }, [])

  return (
    <section id="alur" className="lp-bagian lp-alur">
      <div className="lp-wadah">
        <div className="lp-alur-grid">
          {/* Kepala menempel di tempatnya selagi langkah-langkahnya bergulir. */}
          <div className="lp-alur-kepala">
            <Muncul><p className="lp-label">Alur SPMB</p></Muncul>
            <div style={{ marginTop: '1.2rem' }}>
              <JudulBaris larik={['Memulai', 'langkahmu.']} className="lp-judul-besar" />
            </div>
            <Muncul jeda={0.1}>
              <p className="lp-teks" style={{ marginTop: '1.2rem', maxWidth: '34ch' }}>
                Enam langkah, seluruhnya daring. Tidak perlu datang ke sekolah
                sampai berkasmu selesai diperiksa.
              </p>
            </Muncul>

            <Muncul jeda={0.16}>
              <div className="lp-alur-kemajuan" aria-hidden="true">
                <span className="lp-alur-kemajuan-nomor">{LANGKAH[aktif].no}</span>
                <span className="lp-alur-kemajuan-rel">
                  <span
                    className="lp-alur-kemajuan-isi"
                    style={{ transform: `scaleX(${(aktif + 1) / LANGKAH.length})` }}
                  />
                </span>
                <span className="lp-alur-kemajuan-total">{String(LANGKAH.length).padStart(2, '0')}</span>
              </div>
            </Muncul>

            <Muncul jeda={0.22}>
              <Link href="/register" className="lp-tombol lp-tombol--utama" style={{ marginTop: '1.6rem' }}>
                Mulai Pendaftaran <ArrowRight size={16} />
              </Link>
            </Muncul>
          </div>

          {/* Garis waktu menurun. */}
          <ol className="lp-alur-daftar" ref={wadah}>
            {LANGKAH.map((l, i) => {
              const Ikon = l.ikon
              const sudah = i <= aktif
              return (
                <li
                  key={l.no}
                  data-langkah={i}
                  className={`lp-alur-item${i === aktif ? ' is-aktif' : ''}${sudah ? ' is-lewat' : ''}`}
                >
                  <span className="lp-alur-simpul" aria-hidden="true">
                    <Ikon size={16} />
                  </span>
                  <div className="lp-alur-isi">
                    <span className="lp-alur-no">{l.no}</span>
                    <h3 className="lp-alur-judul">{l.judul}</h3>
                    <p className="lp-alur-teks">{l.teks}</p>
                  </div>
                </li>
              )
            })}
          </ol>
        </div>
      </div>
    </section>
  )
}
