'use client'

import { useEffect, useRef, useState, type CSSProperties, type KeyboardEvent, type TouchEvent } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { Muncul } from './gerak'
import { formatRupiah } from '@/lib/pembayaran-utils'
import { rentangTanggal } from '@/lib/tanggal'
import type { BarisHarga, BarisJadwal, DataJenjang } from '@/lib/landing'
import type { Jenjang } from '@/lib/labels'

/**
 * Jadwal & Biaya — satu bab untuk dua pertanyaan yang selalu datang
 * bersamaan: "kapan daftarnya?" dan "berapa biayanya?".
 *
 * Polanya "profil siswa": tab SMP · SMA · SMK di atas garis tipis, dengan
 * lingkaran gelap yang bergeser ke tab terpilih. Di kiri biaya jenjang itu;
 * di kanan seorang peserta didiknya (foto tanpa latar) dikelilingi gelombang
 * pendaftaran sebagai catatan tempel yang melayang.
 *
 * Ketiga jenjang dirender sekaligus dan ditumpuk di sel grid yang sama.
 * Berpindah tab hanya mengganti atribut data-keadaan (kiri/aktif/kanan), jadi
 * seluruh transisinya CSS (transform & opacity) dan ketiga fotonya sudah
 * termuat sebelum diklik. Semua angka tetap dari data admin (lib/landing.ts).
 */

/** Foto tanpa latar per jenjang. */
const POTRET: Record<Jenjang, { src: string; alt: string; skala: number }> = {
  smp: { src: '/images/talent-34.png', alt: 'Peserta didik SMP Citra Negara berseragam sekolah', skala: 1 },
  sma: { src: '/images/sma-7.png', alt: 'Peserta didik SMA Citra Negara berseragam sekolah', skala: 1 },
  // Foto SMK diambil lebih dekat (kepalanya lebih besar dan lebih tinggi di
  // bingkai) — diperkecil sedikit supaya sejajar dengan dua foto lainnya.
  smk: { src: '/images/talent-567.png', alt: 'Peserta didik SMK Citra Negara berseragam sekolah', skala: 0.9 },
}

/** Kemiringan & geseran tiap catatan dalam satu tumpukan — sengaja tidak seragam. */
const MIRING = [-3.2, 2.6, -1.8, 3.1, -2.4, 1.6]
const GESER = ['0rem', '1.5rem', '0.35rem', '1.2rem', '0rem', '0.9rem']

/**
 * Biaya kelas awal satu jenjang, siap ditampilkan:
 * - "pasangan": satu harga per tipe kelas (SMP, SMA — Reguler | Plus);
 * - "tabel": program keahlian × tipe kelas (SMK).
 */
type BiayaAwal =
  | { jenis: 'pasangan'; harga: { tipe: string; dari: number; sampai: number }[] }
  | {
      jenis: 'tabel'
      tipe: string[]
      baris: { kode: string | null; nama: string; harga: Record<string, number | null> }[]
    }

/** "Kelas 10 - REGULER" → "Reguler". */
function tipeKelas(kelas: string) {
  const bagian = kelas.split(' - ')
  const tipe = bagian.length > 1 ? bagian[bagian.length - 1].trim() : ''
  return tipe ? tipe.charAt(0).toUpperCase() + tipe.slice(1).toLowerCase() : 'Biaya'
}

/**
 * Halaman depan untuk pendaftar BARU, jadi yang tampil hanya baris kelas
 * awal (kelas 7 SMP, kelas 10 SMA/SMK) — kelas lanjutan tidak. "Kelas awal"
 * = nomor kelas terkecil di data harga jenjang itu, jadi tidak ada angka
 * kelas yang ditulis tangan. Nominalnya nominal dasar yang berlaku di tahun
 * ajaran ini; potongan gelombang tampil di catatan gelombangnya sendiri.
 */
function biayaKelasAwal(harga: BarisHarga[]): BiayaAwal | null {
  if (harga.length === 0) return null
  const nomor = (kelas: string) => {
    const m = kelas.match(/\d+/)
    return m ? Number(m[0]) : null
  }
  const semua = harga.map(h => nomor(h.kelas)).filter((n): n is number => n !== null)
  const awal = semua.length > 0 ? Math.min(...semua) : null
  const baris = awal === null ? harga : harga.filter(h => nomor(h.kelas) === awal)

  const tipe = [...new Set(baris.map(h => tipeKelas(h.kelas)))]
  const jurusan = [...new Set(baris.map(h => h.jurusan).filter(j => j && j !== '-'))]

  if (jurusan.length > 1) {
    return {
      jenis: 'tabel',
      tipe,
      baris: jurusan.map(nama => {
        const hargaTipe: Record<string, number | null> = {}
        for (const t of tipe) {
          const n = baris.filter(h => h.jurusan === nama && tipeKelas(h.kelas) === t).map(h => h.nominal)
          hargaTipe[t] = n.length > 0 ? Math.min(...n) : null
        }
        return {
          // "Perhotelan (PH)" → kode "PH", nama "Perhotelan".
          kode: nama.match(/\(([^)]+)\)\s*$/)?.[1] ?? null,
          nama: nama.replace(/\s*\([^)]*\)\s*$/, '').trim(),
          harga: hargaTipe,
        }
      }),
    }
  }

  return {
    jenis: 'pasangan',
    harga: tipe.map(t => {
      const n = baris.filter(h => tipeKelas(h.kelas) === t).map(h => h.nominal)
      return { tipe: t, dari: Math.min(...n), sampai: Math.max(...n) }
    }),
  }
}

/**
 * Penanda "sudah terlihat" dengan histeresis: menyala saat bagian elemen yang
 * tampak mencapai ambang, dan baru padam setelah elemen benar-benar keluar
 * layar (supaya animasi masuknya bisa diputar lagi saat kembali). Dengan
 * penanda biasa, foto di dasar bab yang tinggi (HP) justru disembunyikan
 * tepat ketika hanya bagian bawah bab — tempat foto itu — yang masih tampak.
 */
function useMasuk<T extends HTMLElement>(ambang: number, kunci: unknown) {
  const ref = useRef<T | null>(null)
  const [masuk, setMasuk] = useState(false)
  // `kunci` berganti saat elemen yang diamati berganti (tab lain) — observer
  // dipasang ulang pada elemen barunya tanpa mengubah keadaan yang sekarang.
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.intersectionRatio >= ambang) setMasuk(true)
        else if (!e.isIntersecting) setMasuk(false)
      },
      { threshold: [0, ambang] },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [ambang, kunci])
  return { ref, masuk }
}

function rentangRupiah(dari: number, sampai: number) {
  return dari === sampai ? formatRupiah(dari) : `${formatRupiah(dari)} – ${sampai.toLocaleString('id-ID')}`
}

function Catatan({ g, k, i, kanan }: { g: BarisJadwal; k: number; i: number; kanan?: boolean }) {
  // Tumpukan kanan dicerminkan: miring dan geserannya berlawanan arah.
  const geser = GESER[i % GESER.length]
  const gaya = {
    '--k': k,
    '--r': `${MIRING[i % MIRING.length] * (kanan ? -1 : 1)}deg`,
    '--gx': kanan ? `calc(${geser} * -1)` : geser,
  } as CSSProperties
  return (
    <li className="lp-jb-catatan" data-aktif={g.aktif || undefined} data-alumni={g.untukAlumni || undefined} style={gaya}>
      <div className="lp-jb-kertas">
        {g.aktif && (
          <p className="lp-jb-status">
            <span className="lp-jb-titik" aria-hidden="true" />
            Sedang berjalan
          </p>
        )}
        <h3 className="lp-jb-nama">{g.nama}</h3>
        <p className="lp-jb-tanggal">{rentangTanggal(g.tanggalMulai, g.tanggalSelesai)}</p>
        {g.diskonPersen > 0 && <p className="lp-jb-diskon">Potongan {g.diskonPersen}%</p>}
      </div>
    </li>
  )
}

export function JadwalBiaya({ jenjang }: { jenjang: DataJenjang[] }) {
  const daftar = jenjang.filter(j => j.jadwal.length > 0 || j.harga.length > 0)
  const [aktif, setAktif] = useState(0)
  // Bertambah setiap kali pindah tab — dipakai me-mount ulang lingkaran agar
  // animasi "meregang"-nya berulang (dan tidak diputar saat halaman dimuat).
  const [pindah, setPindah] = useState(0)
  const tombol = useRef<(HTMLButtonElement | null)[]>([])
  const sentuh = useRef<{ x: number; y: number } | null>(null)
  // Yang diamati selalu catatan & foto milik panel aktif (di HP letaknya
  // berbeda-beda menurut jumlah catatan).
  const catatanIO = useMasuk<HTMLDivElement>(0.5, aktif)
  const fotoIO = useMasuk<HTMLDivElement>(0.3, aktif)

  if (daftar.length === 0) return null

  const pilih = (i: number, fokus = false) => {
    if (fokus) tombol.current[i]?.focus()
    if (i === aktif) return
    setAktif(i)
    setPindah(p => p + 1)
  }

  const tekanTombol = (e: KeyboardEvent, i: number) => {
    const n = daftar.length
    const tujuan =
      e.key === 'ArrowRight' ? (i + 1) % n
      : e.key === 'ArrowLeft' ? (i - 1 + n) % n
      : e.key === 'Home' ? 0
      : e.key === 'End' ? n - 1
      : -1
    if (tujuan < 0) return
    e.preventDefault()
    pilih(tujuan, true)
  }

  // Geser ke kiri/kanan di layar sentuh juga berpindah jenjang.
  const mulaiSentuh = (e: TouchEvent) => {
    const t = e.touches[0]
    sentuh.current = { x: t.clientX, y: t.clientY }
  }
  const akhirSentuh = (e: TouchEvent) => {
    const awal = sentuh.current
    sentuh.current = null
    if (!awal) return
    const t = e.changedTouches[0]
    const dx = t.clientX - awal.x
    const dy = t.clientY - awal.y
    if (Math.abs(dx) < 56 || Math.abs(dx) < Math.abs(dy) * 1.4) return
    pilih(dx < 0 ? Math.min(aktif + 1, daftar.length - 1) : Math.max(aktif - 1, 0))
  }

  return (
    <section
      id="jadwal"
      className={`lp-jb${catatanIO.masuk ? ' is-catatan' : ''}${fotoIO.masuk ? ' is-foto' : ''}`}
      aria-labelledby="lp-jb-judul"
    >
      {/* Tautan lama "#biaya" (navigasi, footer, pencarian) mendarat di sini. */}
      <span id="biaya" className="lp-jb-jangkar" aria-hidden="true" />

      <div className="lp-wadah lp-jb-wadah" onTouchStart={mulaiSentuh} onTouchEnd={akhirSentuh}>
        <Muncul className="lp-jb-label">
          <h2 id="lp-jb-judul" className="lp-label">Jadwal &amp; Biaya</h2>
        </Muncul>

        <div
          className="lp-jb-tab"
          role="tablist"
          aria-label="Jadwal dan biaya per jenjang"
          style={{ '--i': aktif, '--n': daftar.length } as CSSProperties}
        >
          <span className="lp-jb-lingkar" aria-hidden="true">
            <span key={pindah} className={`lp-jb-lingkar-isi${pindah ? ' is-regang' : ''}`} />
          </span>
          {daftar.map((j, i) => (
            <button
              key={j.jenjang}
              ref={el => { tombol.current[i] = el }}
              type="button"
              role="tab"
              id={`lp-jb-tab-${j.jenjang}`}
              aria-selected={i === aktif}
              aria-controls={`lp-jb-panel-${j.jenjang}`}
              tabIndex={i === aktif ? 0 : -1}
              className="lp-jb-tab-tombol"
              onClick={() => pilih(i)}
              onKeyDown={e => tekanTombol(e, i)}
            >
              {j.singkat}
            </button>
          ))}
        </div>

        {daftar.map((j, i) => {
          const biaya = biayaKelasAwal(j.harga)
          const umum = j.jadwal.filter(g => !g.untukAlumni)
          const alumni = j.jadwal.filter(g => g.untukAlumni)
          const foto = POTRET[j.jenjang]
          const keadaan = i === aktif ? 'aktif' : i < aktif ? 'kiri' : 'kanan'

          return (
            <div
              key={j.jenjang}
              id={`lp-jb-panel-${j.jenjang}`}
              role="tabpanel"
              aria-labelledby={`lp-jb-tab-${j.jenjang}`}
              className="lp-jb-panel"
              data-keadaan={keadaan}
              inert={i !== aktif}
            >
              <div className="lp-jb-teks">
                <p className="lp-jb-sub">Biaya pendidikan · {j.label}</p>
                <p className="lp-jb-keterangan">Berlaku pada tahun ajaran yang sedang dibuka.</p>
                {!biaya ? (
                  <p className="lp-jb-harga-kosong">Biaya segera diumumkan.</p>
                ) : biaya.jenis === 'tabel' ? (
                  <table className="lp-jb-tabel">
                    <caption className="lp-jb-sr">Biaya pendidikan {j.label} per program keahlian</caption>
                    <thead>
                      <tr>
                        <th scope="col">Program keahlian</th>
                        {biaya.tipe.map(t => <th key={t} scope="col">{t}</th>)}
                      </tr>
                    </thead>
                    <tbody>
                      {biaya.baris.map(b => (
                        <tr key={b.nama}>
                          <th scope="row">
                            <span className="lp-jb-program">
                              {b.kode && <span className="lp-jb-kode">{b.kode}</span>}
                              <span className="lp-jb-program-nama">{b.nama}</span>
                            </span>
                          </th>
                          {biaya.tipe.map(t => {
                            const n = b.harga[t]
                            return (
                              <td key={t}>
                                {n != null ? formatRupiah(n) : (
                                  <>
                                    <span className="lp-jb-strip" aria-hidden="true">—</span>
                                    <span className="lp-jb-sr">Tidak tersedia</span>
                                  </>
                                )}
                              </td>
                            )
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <dl className="lp-jb-pasangan">
                    {biaya.harga.map(h => (
                      <div key={h.tipe}>
                        <dt>{h.tipe}</dt>
                        <dd>{rentangRupiah(h.dari, h.sampai)}</dd>
                      </div>
                    ))}
                  </dl>
                )}
                <div className="lp-jb-aksi">
                  <Link href="/register" className="lp-jb-tombol">
                    Daftar sekarang
                    <ArrowRight size={16} aria-hidden="true" />
                  </Link>
                </div>
              </div>

              <div className="lp-jb-adegan">
                <span className="lp-jb-tanda" aria-hidden="true">{j.singkat}</span>
                <div ref={i === aktif ? fotoIO.ref : undefined} className="lp-jb-foto" style={{ '--skala': foto.skala } as CSSProperties}>
                  <div className="lp-jb-foto-isi">
                    <Image
                      src={foto.src}
                      alt={foto.alt}
                      fill
                      sizes="(max-width: 900px) 80vw, 40vw"
                      style={{ objectFit: 'contain', objectPosition: '50% 100%' }}
                    />
                  </div>
                </div>

                <div ref={i === aktif ? catatanIO.ref : undefined} className="lp-jb-kelompok lp-jb-kelompok--umum">
                  <p className="lp-jb-kelompok-judul">{alumni.length > 0 ? 'Jalur umum' : 'Gelombang pendaftaran'}</p>
                  {umum.length > 0 ? (
                    <ul className="lp-jb-tumpukan">
                      {umum.map((g, n) => <Catatan key={g.id} g={g} k={n} i={n} />)}
                    </ul>
                  ) : (
                    <ul className="lp-jb-tumpukan">
                      <li className="lp-jb-catatan" style={{ '--k': 0, '--r': '-2deg', '--gx': '0rem' } as CSSProperties}>
                        <div className="lp-jb-kertas">
                          <h3 className="lp-jb-nama">Jadwal menyusul</h3>
                          <p className="lp-jb-tanggal">Jadwal {j.label} akan diumumkan.</p>
                        </div>
                      </li>
                    </ul>
                  )}
                </div>
                {alumni.length > 0 && (
                  <div className="lp-jb-kelompok lp-jb-kelompok--alumni">
                    <p className="lp-jb-kelompok-judul">
                      Jalur alumni<span className="lp-jb-judul-ekor"> SMP CN</span>
                    </p>
                    <ul className="lp-jb-tumpukan">
                      {alumni.map((g, n) => <Catatan key={g.id} g={g} k={umum.length + n} i={n} kanan />)}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
