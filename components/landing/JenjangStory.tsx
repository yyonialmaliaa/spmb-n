import Image from 'next/image'
import { Plus } from 'lucide-react'
import { GAMBAR_JENJANG, type Jenjang } from '@/lib/labels'

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

/**
 * Ringkasan naratif tiap jenjang. Sengaja disimpan di sini dan bukan di
 * database: ini teks pemasaran, bukan data operasional.
 *
 * SMP dan SMA TIDAK menyebut jurusan sama sekali — di sistem ini keduanya
 * memang tidak mengenal program keahlian.
 */
const CERITA: Record<Jenjang, { teks: string }> = {
  smp: { teks: 'Tiga tahun untuk membangun fondasi: kebiasaan belajar, keberanian bertanya, dan kemandirian yang terbawa seumur hidup.' },
  sma: { teks: 'Ruang untuk memperdalam akademik sekaligus menguji minat, hingga pilihan setelah lulus diambil dengan yakin.' },
  smk: { teks: 'Belajar dengan mengerjakan. Kompetensi diasah lewat praktik nyata, siap melangkah ke dunia kerja maupun pendidikan lanjutan.' },
}

export type PanelJenjang = {
  jenjang: Jenjang
  singkat: string
  label: string
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
 * lebih lapang, tombol "+" dan nama lengkap jenjang muncul di bawah. Di HP
 * ketiganya sama lebar dan cukup diketuk.
 *
 * Gerak yang mengikuti gulir diatur di landing.css (blok "JENJANG → ALUR");
 * tanpa dukungan browser, tata letaknya sama dalam keadaan diam.
 */
export function JenjangStory({ daftar }: { daftar: PanelJenjang[] }) {
  return (
    <section id="jenjang" className="lp-cn" aria-labelledby="lp-cn-judul">
      <div className="lp-wadah lp-cn-kepala">
        <h2 id="lp-cn-judul" className="lp-cn-chip" aria-label="Kenali jenjangmu di Citra Negara">
          Kenali jenjangmu di
        </h2>
      </div>

      {/* Tulisan raksasa yang menempel sepanjang wadah ini. */}
      <div className="lp-cn-kata" aria-hidden="true">CN</div>

      <div className="lp-wadah lp-cn-teks">
        <div className="lp-cn-teks-isi">
          <p className="lp-cn-label">Tiga jenjang, satu naungan</p>
          <p className="lp-cn-paragraf">
            Kenali setiap jenjang pendidikan dan temukan pilihan yang sesuai dengan rencana masa depanmu.
          </p>
        </div>
      </div>

      <ul className="lp-cn-kartu" aria-label="Jenjang pendidikan Citra Negara">
        {daftar.map(j => {
          const web = WEB_JENJANG[j.jenjang]
          // Link kosong: <a> tanpa href — tetap bisa difokus & diklik, tapi
          // tidak berpindah halaman.
          const tautan = web
            ? { href: web, target: '_blank', rel: 'noopener noreferrer' }
            : { tabIndex: 0, 'aria-disabled': true }
          return (
          <li key={j.jenjang} className="lp-cn-kartu-item">
            <a {...tautan} className="lp-cn-kartu-tautan" aria-label={`Website ${j.label}`}>
              <Image
                src={GAMBAR_JENJANG[j.jenjang]}
                alt=""
                fill
                sizes="(max-width: 900px) 34vw, 55vw"
                style={{ objectFit: 'cover' }}
              />
              <span className="lp-cn-kartu-tirai" aria-hidden="true" />
              <span className="lp-cn-kartu-atas" aria-hidden="true">{j.singkat}</span>
              <span className="lp-cn-kartu-bawah" aria-hidden="true">
                <span className="lp-cn-kartu-plus"><Plus size={26} strokeWidth={2.4} /></span>
                <span className="lp-cn-kartu-judul">{j.label}</span>
                <span className="lp-cn-kartu-teks">{CERITA[j.jenjang].teks}</span>
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
          sini, setinggi CN. Tujuan tautan #alur. */}
      <div id="alur" className="lp-wadah lp-cn-akhir" />

      {/* Kotak emas: mula-mula pita lebar di belakang CN, lalu menyusut
          sampai tepat menjadi kotak label "Alur SPMB" di bawah ini. */}
      <div className="lp-cn-emas" aria-hidden="true" />
      <p className="lp-cn-chip lp-cn-chip--akhir">Alur SPMB</p>
    </section>
  )
}
