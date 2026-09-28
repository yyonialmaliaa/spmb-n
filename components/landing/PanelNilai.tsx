'use client'

import Image from 'next/image'
import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'
import { NILAI_MANTAP } from './nilaiMantap'

const N = NILAI_MANTAP.length
const EASE_KELUAR = 'cubic-bezier(0.22, 1, 0.36, 1)'
const EASE_SAPU = 'cubic-bezier(0.6, 0.05, 0.2, 1)'
const EASE_BELAH = 'cubic-bezier(0.55, 0, 0.2, 1)'
const EASE_KATUP = 'cubic-bezier(0.65, 0, 0.35, 1)'

type BahasaNilai = 'id' | 'en' | 'ja' | 'tr' | 'de' | 'ko'

const kurangiGerak = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

function getTeksNilai(nilai: (typeof NILAI_MANTAP)[0], bahasa: BahasaNilai) {
  if (bahasa === 'id') {
    return { nama: nilai.nama, teks: nilai.teks }
  }
  
  const terjemahan = nilai.terjemahan?.[bahasa as keyof typeof nilai.terjemahan]
  if (!terjemahan) {
    return { nama: nilai.nama, teks: nilai.teks }
  }
  
  return terjemahan
}

/**
 * Panel penjelasan satu nilai MANTAP, dibuka dari deret nilai di hero.
 *
 * Membuka dengan "membelah" latar hero: celah tegak putih muncul di tengah
 * layar lalu melebar menjadi panel setinggi layar, foto nilai itu menyala di
 * dalamnya, sementara latar kiri-kanannya meredup hijau tua. Di dalamnya bisa
 * berpindah ke nilai sebelum/berikutnya (tombol ‹ ›, panah keyboard, atau
 * geser di HP); foto baru menyapu masuk dari arah perpindahan. Menutup (✕,
 * Esc, klik di luar panel) memutar animasinya terbalik: foto tertutup putih,
 * celahnya menyempit kembali ke garis tengah, dan latar kembali terang.
 *
 * Komponen ini tetap terpasang setelah pertama kali disiapkan (lihat Hero)
 * supaya foto-fotonya sudah dimuat sebelum diklik; saat tertutup ia
 * tersembunyi dan `inert`.
 *
 * Buka/tutup SENGAJA hanya menganimasikan transform & opacity (dikerjakan
 * GPU): celah putihnya adalah elemen yang di-scaleX, bukan clip-path yang
 * harus digambar ulang di thread utama tiap bingkai, dan kunci gulirnya tidak
 * mengubah overflow halaman (yang memaksa seluruh halaman dihitung ulang).
 * Keduanya dulu membuat penutupan tersendat.
 */
export function PanelNilai({
  aktif,
  setAktif,
  asal,
  bahasa = 'id',
}: {
  /** Indeks nilai yang tampil; null = tertutup. */
  aktif: number | null
  setAktif: (i: number | null) => void
  /** Tombol nilai di hero — fokus keyboard kembali ke sini saat ditutup. */
  asal: (i: number) => HTMLElement | null
  /** Bahasa yang aktif */
  bahasa?: BahasaNilai
}) {
  const akarRef = useRef<HTMLDivElement | null>(null)
  const panelRef = useRef<HTMLDivElement | null>(null)
  const isiRef = useRef<HTMLDivElement | null>(null)
  const tutupRef = useRef<HTMLButtonElement | null>(null)
  const fotoRef = useRef<(HTMLDivElement | null)[]>([])
  const lalu = useRef<number | null>(null)
  const animasi = useRef<Animation[]>([])
  const menutup = useRef(false)
  const sibuk = useRef(false)
  const geserAwal = useRef<{ x: number; y: number } | null>(null)
  const [sebelumnya, setSebelumnya] = useState<number | null>(null)
  const [arah, setArah] = useState<1 | -1>(1)
  const idJudul = useId()

  const terbuka = aktif !== null
  const i = aktif ?? 0
  const nilai = NILAI_MANTAP[i]
  const { nama, teks } = getTeksNilai(nilai, bahasa)

  const jalan = (el: Element | null | undefined, kf: Keyframe[], opsi: KeyframeAnimationOptions) => {
    if (!el) return null
    const a = el.animate(kf, { fill: 'both', ...opsi })
    animasi.current.push(a)
    return a
  }
  const bersihkan = () => {
    animasi.current.forEach(a => a.cancel())
    animasi.current = []
  }
  /** Label, judul, dan paragraf masuk bergiliran; `dari` = arah datangnya. */
  const isiMasuk = (dari: -1 | 0 | 1, jeda: number) => {
    isiRef.current?.querySelectorAll('.lp-nilai-muncul').forEach((el, k) => {
      jalan(
        el,
        [{ opacity: 0, transform: `translate(${dari * 44}px, ${dari === 0 ? 26 : 0}px)` }, { opacity: 1, transform: 'none' }],
        { duration: 650, delay: jeda + k * 70, easing: EASE_KELUAR },
      )
    })
  }

  // Animasi buka & pindah — dijalankan sebelum browser melukis supaya
  // keadaan awalnya (panel masih berupa garis tengah) sudah berlaku di bingkai
  // pertama. Sengaja tanpa daftar dependensi: efek ini membandingkan sendiri
  // `aktif` dengan nilai sebelumnya dan langsung keluar bila tidak berubah.
  useLayoutEffect(() => {
    const dari = lalu.current
    if (dari === aktif) return
    lalu.current = aktif
    const akar = akarRef.current
    const panel = panelRef.current
    if (!akar || !panel) return

    bersihkan()
    if (aktif === null) return // selesai ditutup; animasi tutup sudah dibatalkan

    const kurangi = kurangiGerak()
    if (dari === null) {
      // BUKA
      if (kurangi) {
        jalan(akar, [{ opacity: 0 }, { opacity: 1 }], { duration: 200 })
      } else {
        // Latar terbelah: celah PUTIH tumbuh dari garis tengah, fotonya
        // menyala di dalam celah begitu celah hampir penuh (kilatan putih
        // singkat), lalu judul & penjelasan menyusul. Total ±1 dtk.
        const foto = fotoRef.current[aktif]
        jalan(akar.querySelector('.lp-nilai-tirai'), [{ opacity: 0 }, { opacity: 1 }], { duration: 450, easing: 'ease-out' })
        jalan(akar.querySelector('.lp-nilai-celah'), [{ transform: 'scaleX(0)' }, { transform: 'scaleX(1)' }], { duration: 520, easing: EASE_BELAH })
        jalan(foto, [{ opacity: 0 }, { opacity: 1 }], { duration: 360, delay: 470, easing: 'ease-out' })
        jalan(akar.querySelector('.lp-nilai-gelap'), [{ opacity: 0 }, { opacity: 1 }], { duration: 360, delay: 470, easing: 'ease-out' })
        akar.querySelectorAll('.lp-nilai-bingkai').forEach(el =>
          jalan(el, [{ opacity: 0 }, { opacity: 1 }], { duration: 320, delay: 520, easing: 'ease-out' }))
        isiMasuk(0, 600)
      }
      // Satu bingkai kemudian: di mode gerak-dikurangi, landing.css memberi
      // SEMUA elemen transisi 0,01 ms — termasuk `visibility` — sehingga pada
      // bingkai ini tombolnya masih terhitung tersembunyi dan tidak bisa difokus.
      requestAnimationFrame(() => tutupRef.current?.focus({ preventScroll: true }))
      return
    }

    // PINDAH ke nilai lain: foto baru menyapu masuk dari arah perpindahan.
    if (!kurangi) {
      const baru = fotoRef.current[aktif]
      const lama = fotoRef.current[dari]
      jalan(baru, [{ clipPath: arah > 0 ? 'inset(0px 0px 0px 100%)' : 'inset(0px 100% 0px 0px)' }, { clipPath: 'inset(0px 0px 0px 0px)' }], { duration: 850, easing: EASE_SAPU })
      jalan(baru?.querySelector('img'), [{ transform: `translateX(${arah * 14}%) scale(1.12)` }, { transform: 'none' }], { duration: 1100, easing: EASE_SAPU })
      jalan(lama?.querySelector('img'), [{ transform: 'none' }, { transform: `translateX(${-arah * 10}%)` }], { duration: 850, easing: EASE_SAPU })
      isiMasuk(arah, 180)
    }
    window.setTimeout(() => { sibuk.current = false }, kurangi ? 0 : 450)
  })

  /** `lewatKeyboard`: ditutup dengan Esc — hanya saat itu cincin fokus boleh
   *  tampak di kata nilai hero; klik/sentuh tidak meninggalkan garis apa pun. */
  const tutup = (lewatKeyboard = false) => {
    if (aktif === null || menutup.current) return
    menutup.current = true
    const akar = akarRef.current
    const panel = panelRef.current
    const tombolAsal = asal(aktif)
    // Tidak ada setState selama animasi berjalan (render ulang di tengah
    // animasi = bingkai yang tersendat). Sisa lapisan foto dari perpindahan
    // sebelumnya cukup disembunyikan lewat kelas; navbar mulai kembali sejak
    // awal supaya muncul bersamaan dengan latar yang kembali terang.
    akar?.classList.add('is-menutup')
    delete document.documentElement.dataset.nilaiBuka
    const selesai = () => {
      menutup.current = false
      sibuk.current = false
      setSebelumnya(null)
      setAktif(null)
      tombolAsal?.focus({ preventScroll: true, focusVisible: lewatKeyboard } as FocusOptions)
    }
    if (!akar || !panel) return selesai()
    if (kurangiGerak()) {
      jalan(akar, [{ opacity: 1 }, { opacity: 0 }], { duration: 200 })?.finished.then(selesai, selesai)
      return
    }
    // Kebalikan dari membuka: teks menghilang, foto TERTUTUP putih dulu
    // (kilatan singkat), baru celah putih itu menyempit ke garis tengah
    // sementara latar kembali terang. Total ±0,9 dtk.
    const foto = fotoRef.current[aktif]
    akar.querySelectorAll('.lp-nilai-bingkai, .lp-nilai-muncul').forEach(el =>
      jalan(el, [{ opacity: 1 }, { opacity: 0 }], { duration: 180, easing: 'ease-in' }))
    jalan(foto, [{ opacity: 1 }, { opacity: 0 }], { duration: 240, delay: 60, easing: 'ease-in' })
    jalan(akar.querySelector('.lp-nilai-gelap'), [{ opacity: 1 }, { opacity: 0 }], { duration: 240, delay: 60, easing: 'ease-in' })
    const a = jalan(akar.querySelector('.lp-nilai-celah'), [{ transform: 'scaleX(1)' }, { transform: 'scaleX(0)' }], { duration: 540, delay: 280, easing: EASE_KATUP })
    const b = jalan(akar.querySelector('.lp-nilai-tirai'), [{ opacity: 1 }, { opacity: 0 }], { duration: 400, delay: 460, easing: 'ease-in-out' })
    Promise.all([a?.finished, b?.finished]).then(selesai, selesai)
  }

  const pindah = (j: number, ke: 1 | -1) => {
    if (aktif === null || menutup.current || sibuk.current || j === aktif) return
    sibuk.current = true
    const berikut = () => {
      setArah(ke)
      setSebelumnya(aktif)
      setAktif(j)
    }
    if (kurangiGerak()) return berikut()
    // Teks lama keluar dulu ke arah berlawanan, baru panel berganti isi.
    const keluar = [...(isiRef.current?.querySelectorAll('.lp-nilai-muncul') ?? [])].map((el, k) =>
      jalan(el, [{ opacity: 1, transform: 'none' }, { opacity: 0, transform: `translateX(${-ke * 36}px)` }], { duration: 180, delay: k * 30, easing: 'ease-in' }))
    Promise.all(keluar.map(a => a?.finished)).then(berikut, berikut)
  }
  const geser = (ke: 1 | -1) => { if (aktif !== null) pindah((aktif + ke + N) % N, ke) }

  // Selama terbuka: navbar asli disembunyikan (panel punya kepala sendiri),
  // dan halaman di belakang tidak ikut tergulir. Gulir dikunci lewat event —
  // BUKAN overflow:hidden, karena mengubah overflow memaksa seluruh halaman
  // dihitung ulang tepat saat panel dibuka/ditutup dan membuat animasinya
  // tersendat.
  useEffect(() => {
    if (!terbuka) return
    const html = document.documentElement
    html.dataset.nilaiBuka = ''
    const y = window.scrollY
    const cegah = (e: Event) => e.preventDefault()
    const tahan = () => { if (window.scrollY !== y) window.scrollTo(0, y) }
    window.addEventListener('wheel', cegah, { passive: false })
    window.addEventListener('touchmove', cegah, { passive: false })
    window.addEventListener('scroll', tahan, { passive: true })
    return () => {
      delete html.dataset.nilaiBuka
      window.removeEventListener('wheel', cegah)
      window.removeEventListener('touchmove', cegah)
      window.removeEventListener('scroll', tahan)
    }
  }, [terbuka])

  // Keyboard: Esc menutup, panah kiri/kanan berpindah, Tab berputar di dalam
  // panel (fokus tidak bocor ke halaman di belakangnya).
  useEffect(() => {
    if (!terbuka) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.preventDefault(); tutup(true) }
      else if (e.key === 'ArrowRight') { e.preventDefault(); geser(1) }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); geser(-1) }
      else if (e.key === 'Tab') {
        const tombol = [...(akarRef.current?.querySelectorAll<HTMLElement>('button') ?? [])]
        if (tombol.length === 0) return
        const pertama = tombol[0]
        const terakhir = tombol[tombol.length - 1]
        const kini = document.activeElement
        if (!akarRef.current?.contains(kini)) { e.preventDefault(); pertama.focus() }
        else if (e.shiftKey && kini === pertama) { e.preventDefault(); terakhir.focus() }
        else if (!e.shiftKey && kini === terakhir) { e.preventDefault(); pertama.focus() }
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  })

  return (
    <div
      ref={akarRef}
      className={`lp-nilai${terbuka ? '' : ' is-tertutup'}`}
      role="dialog"
      aria-modal="true"
      aria-labelledby={idJudul}
      aria-hidden={!terbuka}
      inert={!terbuka}
    >
      <div className="lp-nilai-tirai" onClick={() => tutup()} />

      <div
        ref={panelRef}
        className="lp-nilai-panel"
        onPointerDown={e => { if (e.pointerType !== 'mouse') geserAwal.current = { x: e.clientX, y: e.clientY } }}
        onPointerUp={e => {
          const awal = geserAwal.current
          geserAwal.current = null
          if (!awal) return
          const dx = e.clientX - awal.x
          if (Math.abs(dx) > 56 && Math.abs(dx) > Math.abs(e.clientY - awal.y)) geser(dx < 0 ? 1 : -1)
        }}
      >
        {/* Kilatan putih "celah" yang membelah latar — di bawah foto. */}
        <div className="lp-nilai-celah" />
        {NILAI_MANTAP.map((n, k) => (
          <div
            key={n.nama}
            ref={el => { fotoRef.current[k] = el }}
            className="lp-nilai-foto"
            data-tahap={k === i ? 'aktif' : k === sebelumnya ? 'lalu' : undefined}
          >
            <Image
              src={n.foto}
              alt=""
              fill
              loading="eager"
              sizes="(max-width: 768px) 100vw, 80vw"
              style={{ objectFit: 'cover', objectPosition: n.posisi }}
            />
          </div>
        ))}
        <div className="lp-nilai-gelap" />

        <div ref={isiRef} className="lp-nilai-isi" aria-live="polite">
          <h2 id={idJudul} className="lp-nilai-judul lp-nilai-muncul">{nama}</h2>
          <p className="lp-nilai-teks lp-nilai-muncul">{teks}</p>
        </div>
      </div>

      <div className="lp-nilai-kepala lp-nilai-bingkai">
        <span className="lp-nilai-garis" aria-hidden="true" />
        <span className="lp-nilai-merek">
          <Image src="/images/logo-yatkj.png" alt="" width={900} height={362} />
          <span>Citra Negara</span>
        </span>
        <span className="lp-nilai-garis" aria-hidden="true" />
      </div>
      <button ref={tutupRef} type="button" className="lp-nilai-tutup lp-nilai-bingkai" onClick={() => tutup()} aria-label="Tutup penjelasan nilai">
        <X size={30} strokeWidth={1.8} />
      </button>

      <button type="button" className="lp-nilai-panah lp-nilai-panah--kiri lp-nilai-bingkai" onClick={() => geser(-1)} aria-label="Nilai sebelumnya">
        <ChevronLeft size={22} />
      </button>
      <button type="button" className="lp-nilai-panah lp-nilai-panah--kanan lp-nilai-bingkai" onClick={() => geser(1)} aria-label="Nilai berikutnya">
        <ChevronRight size={22} />
      </button>
    </div>
  )
}
