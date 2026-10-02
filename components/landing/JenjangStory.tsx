'use client'

import { useRef, useState, type CSSProperties, type MouseEvent } from 'react'
import Image from 'next/image'
import { Plus } from 'lucide-react'
import { GAMBAR_JENJANG, type Jenjang } from '@/lib/labels'
import { useHp } from './gerak'
import { useBahasa } from './i18n/PenyediaBahasa'

/**
 * Website masing-masing jenjang (dibuka di tab baru).
 * Selama masih kosong, kartunya tetap bisa diklik/disorot seperti biasa,
 * hanya belum mengarah ke mana pun — tidak error.
 */
const WEB_JENJANG: Record<Jenjang, string> = {
  smp: 'https://smp.citranegara.sch.id', // masukkan link web SMP di sini, contoh: 'https://smp.citranegara.sch.id'
  sma: 'https://sma.citranegara.sch.id', // masukkan link web SMA di sini
  smk: 'https://smk.citranegara.sch.id', // masukkan link web SMK di sini
}

// Nama ("SMP", "SMP Citra Negara") dan ringkasan naratif tiap jenjang ada di
// kamus bahasa (jenjang.nama, jenjang.cerita), jadi ikut bahasa aktif — teks
// pemasaran, bukan data operasional, jadi sengaja tidak di database.
// SMP dan SMA TIDAK menyebut jurusan sama sekali: di sistem ini keduanya
// memang tidak mengenal program keahlian.

export type PanelJenjang = {
  jenjang: Jenjang
}

/**
 * "Kenali jenjangmu di CN" → kartu SMP/SMA/SMK → "CN · Alur SPMB".
 *
 * Satu wadah yang sengaja membentang dari judul bab Jenjang sampai judul
 * bab Alur SPMB, karena tulisan raksasa "CN" di dalamnya menempel (sticky)
 * sepanjang rentang itu:
 *   1. Mula-mula CN adalah bagian judul "Kenali jenjangmu di CN", dengan
 *      penjelasan singkat di sebelah kanannya.
 *   2. Saat digulir, CN tertahan di layar sementara deretan kartu foto
 *      SMP/SMA/SMK naik MENUTUPINYA — CN ada di belakang foto.
 *   3. Setelah kartu lewat, CN tampak lagi di atas pita emas.
 *   4. Pita emas itu MENYUSUT — dari selebar layar menjadi persegi panjang,
 *      lalu terus mengecil — sampai tepat menjadi kotak label "Alur SPMB";
 *      tulisannya makin tegas selama kotak menyusut. Di ujung wadah CN
 *      berhenti menempel dan bersama label itu menjadi judul bab berikutnya:
 *      "CN · Alur SPMB".
 * Label "Kenali jenjangmu di" sendiri masuk seperti disapu stabilo: kotak
 * emasnya memanjang dari kiri sambil menyingkap tulisannya.
 *
 * Kartu jenjang melebar saat disorot kursor (atau difokus keyboard): foto
 * lebih lapang, tombol "+" dan nama lengkap jenjang muncul di bawah.
 *
 * Gerak yang mengikuti gulir diatur di landing.css (blok "JENJANG → ALUR");
 * tanpa dukungan browser, tata letaknya sama dalam keadaan diam.
 *
 * Di HP tanpa gerak gulir: CN tidak menempel, pita emas tidak ada, dan
 * judul bab Alur menjadi "CN" (salinan .lp-cn-kata-akhir) dengan label
 * "Alur SPMB" di bawahnya. Kartunya bertumpuk sebagai pita foto pendek
 * (nama jenjang + "+"): ketukan pertama membuka kartu itu (foto lebih
 * tinggi, "+" bulat, nama, dan ceritanya) sambil menutup yang lain;
 * ketukan berikutnya pada kartu yang terbuka baru membuka website-nya.
 * Lihat blok "TAMPILAN HP" di landing.css.
 */
export function JenjangStory({ daftar }: { daftar: PanelJenjang[] }) {
  const { t } = useBahasa()
  const k = t.jenjang
  const hp = useHp()
  const [buka, setBuka] = useState<Jenjang | null>(null)
  const pewaktu = useRef(0)

  // HP: kartu yang belum terbuka dibuka dulu, alih-alih langsung pindah ke
  // website. Setelah tingginya selesai berubah, kartu itu digeser masuk layar
  // bila sebagian tertutup tepi bawah.
  const ketuk = (e: MouseEvent<HTMLAnchorElement>, j: Jenjang) => {
    if (!hp || buka === j) return
    e.preventDefault()
    setBuka(j)
    const kartu = e.currentTarget.parentElement
    window.clearTimeout(pewaktu.current)
    pewaktu.current = window.setTimeout(() => kartu?.scrollIntoView({ block: 'nearest', behavior: 'smooth' }), 480)
  }
  return (
    <section
      id="jenjang"
      className="lp-cn"
      aria-labelledby="lp-cn-judul"
      // Kotak emas "Alur SPMB" selebar teksnya di bahasa aktif.
      style={{ '--chip-lebar': k.alurChipLebar } as CSSProperties}
    >
      <div className="lp-wadah lp-cn-kepala">
        <h2 id="lp-cn-judul" className="lp-cn-chip" aria-label={k.chipAria}>
          {k.chip}
        </h2>
      </div>

      {/* Tulisan raksasa yang menempel sepanjang wadah ini. */}
      <div className="lp-cn-kata" aria-hidden="true">CN</div>

      <div className="lp-wadah lp-cn-teks">
        <div className="lp-cn-teks-isi">
          <p className="lp-cn-label">{k.label}</p>
          <p className="lp-cn-paragraf">{k.paragraf}</p>
        </div>
      </div>

      <ul className="lp-cn-kartu" aria-label={k.daftarAria}>
        {daftar.map(j => {
          const web = WEB_JENJANG[j.jenjang]
          const { singkat, lengkap } = k.nama[j.jenjang]
          // Link kosong: <a> tanpa href — tetap bisa difokus & diklik, tapi
          // tidak berpindah halaman.
          const tautan = web
            ? { href: web, target: '_blank', rel: 'noopener noreferrer' }
            : { tabIndex: 0, 'aria-disabled': true }
          return (
          <li key={j.jenjang} className="lp-cn-kartu-item" data-buka={buka === j.jenjang || undefined}>
            <a
              {...tautan}
              className="lp-cn-kartu-tautan"
              aria-label={k.website(lengkap)}
              aria-expanded={hp ? buka === j.jenjang : undefined}
              onClick={e => ketuk(e, j.jenjang)}
            >
              <Image
                src={GAMBAR_JENJANG[j.jenjang]}
                alt=""
                fill
                sizes="(max-width: 767px) 100vw, (max-width: 900px) 34vw, 55vw"
                style={{ objectFit: 'cover' }}
              />
              <span className="lp-cn-kartu-tirai" aria-hidden="true" />
              <span className="lp-cn-kartu-atas" aria-hidden="true">{singkat}</span>
              {/* HP, kartu tertutup: nama di tengah, "+" di kanan. */}
              <span className="lp-cn-kartu-baris" aria-hidden="true">
                {lengkap}
                <Plus size={30} strokeWidth={2} />
              </span>
              <span className="lp-cn-kartu-bawah" aria-hidden="true">
                <span className="lp-cn-kartu-plus"><Plus size={26} strokeWidth={2.4} /></span>
                <span className="lp-cn-kartu-judul">{lengkap}</span>
                <span className="lp-cn-kartu-teks">{k.cerita[j.jenjang]}</span>
              </span>
              <span className="lp-cn-kartu-garis" aria-hidden="true" />
            </a>
          </li>
          )
        })}
      </ul>

      {/* Ruang pita emas (warnanya dilukis .lp-cn-emas di bawah). */}
      <div className="lp-cn-pita" aria-hidden="true" />

      {/* Baris judul bab Alur SPMB: CN yang tadi menempel berhenti tepat di
          sini, setinggi CN. Tujuan tautan #alur. Di HP (CN tidak menempel)
          baris ini memuat CN-nya sendiri. */}
      <div id="alur" className="lp-wadah lp-cn-akhir">
        <span className="lp-cn-kata-akhir" aria-hidden="true">CN</span>
      </div>

      {/* Kotak emas: mula-mula pita lebar di belakang CN, lalu menyusut
          sampai tepat menjadi kotak label "Alur SPMB" di bawah ini. */}
      <div className="lp-cn-emas" aria-hidden="true" />
      <p className="lp-cn-chip lp-cn-chip--akhir">{k.alurChip}</p>
    </section>
  )
}
