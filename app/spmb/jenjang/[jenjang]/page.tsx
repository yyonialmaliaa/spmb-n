import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import { getDataSatuJenjang, isJenjang, GAMBAR_JENJANG } from '@/lib/landing'
import { Navigation } from '@/components/landing/Navigation'
import { Footer } from '@/components/landing/Footer'
import { BiayaJenjang } from '@/components/landing/BiayaJenjang'
import { Muncul, Singkap, JudulBaris } from '@/components/landing/gerak'
import { rentangTanggal } from '@/lib/tanggal'
import type { Jenjang } from '@/lib/labels'
import '../../landing.css'

export const dynamic = 'force-dynamic'

// Di Next 16, `params` adalah Promise dan harus di-await — konvensi yang
// sudah dipakai seluruh rute dinamis di proyek ini.
type Props = { params: Promise<{ jenjang: string }> }

/** Naskah khusus tiap jenjang. SMP & SMA sengaja tidak menyinggung jurusan. */
const NASKAH: Record<Jenjang, {
  kalimat: string
  paragraf: string[]
  fokus: { judul: string; teks: string }[]
  galeri: { src: string; alt: string }[]
}> = {
  smp: {
    kalimat: 'Tempat kebiasaan baik mulai terbentuk.',
    paragraf: [
      'SMP Citra Negara memusatkan perhatian pada fondasi: cara belajar, cara bertanya, dan cara bertanggung jawab atas pekerjaan sendiri. Tiga tahun ini menentukan bagaimana seorang anak memandang sekolah untuk seterusnya.',
      'Kami menjaga kelas tetap berukuran wajar supaya setiap anak terlihat, bukan tenggelam. Guru mengenal nama, kekuatan, dan kesulitan masing-masing.',
    ],
    fokus: [
      { judul: 'Fondasi belajar', teks: 'Membangun kebiasaan membaca, mencatat, dan menyelesaikan tugas sampai tuntas.' },
      { judul: 'Pengembangan karakter', teks: 'Kejujuran dan tanggung jawab dilatih lewat kegiatan harian, bukan sekadar diajarkan.' },
      { judul: 'Eksplorasi minat', teks: 'Pramuka, olahraga, dan seni menjadi ruang mencoba banyak hal sejak dini.' },
      { judul: 'Kemandirian', teks: 'Anak dibiasakan mengatur waktu dan mengambil keputusan kecil sendiri.' },
    ],
    galeri: [
      { src: '/images/pramuka.jpg', alt: 'Kegiatan pramuka SMP Citra Negara' },
      { src: '/images/voli.jpg', alt: 'Latihan bola voli peserta didik' },
      { src: '/images/tari.jpg', alt: 'Latihan seni tari peserta didik' },
    ],
  },
  sma: {
    kalimat: 'Memperdalam akademik, menguji minat.',
    paragraf: [
      'SMA Citra Negara menyiapkan peserta didik untuk melanjutkan ke pendidikan tinggi. Kedalaman akademik dibangun bersamaan dengan kemampuan berpikir mandiri dan menyampaikan gagasan.',
      'Di saat yang sama, minat diuji lewat kegiatan nyata — supaya pilihan jurusan kuliah nanti diambil karena tahu, bukan karena menebak.',
    ],
    fokus: [
      { judul: 'Kedalaman akademik', teks: 'Penguasaan konsep diutamakan di atas hafalan, dengan pendampingan yang dekat.' },
      { judul: 'Pengembangan potensi', teks: 'Setiap peserta didik didorong menemukan bidang yang benar-benar ia kuasai.' },
      { judul: 'Persiapan masa depan', teks: 'Pendampingan menuju seleksi masuk perguruan tinggi dan pilihan karier.' },
      { judul: 'Eksplorasi minat', teks: 'Organisasi, kompetisi, dan kegiatan seni sebagai ruang menguji ketertarikan.' },
    ],
    galeri: [
      { src: '/images/paskibra.jpg', alt: 'Latihan paskibra SMA Citra Negara' },
      { src: '/images/basket.jpg', alt: 'Latihan bola basket peserta didik' },
      { src: '/images/band.jpg', alt: 'Penampilan band peserta didik' },
    ],
  },
  smk: {
    kalimat: 'Belajar dengan mengerjakan.',
    paragraf: [
      'SMK Citra Negara membangun kompetensi lewat praktik. Peserta didik bekerja dengan alat, perangkat, dan alur kerja yang sama dengan yang dipakai di industri.',
      'Lulusannya siap memilih: langsung bekerja, merintis usaha sendiri, atau melanjutkan ke pendidikan tinggi vokasi maupun akademik.',
    ],
    fokus: [
      { judul: 'Kompetensi terukur', teks: 'Kemampuan dinilai dari hasil kerja nyata, bukan sekadar nilai ujian tulis.' },
      { judul: 'Praktik sejak awal', teks: 'Waktu di bengkel dan studio menjadi bagian utama pembelajaran.' },
      { judul: 'Kreativitas', teks: 'Persoalan nyata diselesaikan dengan gagasan sendiri, bukan mengikuti contoh.' },
      { judul: 'Kesiapan melangkah', teks: 'Praktik kerja lapangan menjembatani sekolah dengan dunia kerja sesungguhnya.' },
    ],
    galeri: [
      { src: '/images/tekon.jpg', alt: 'Praktik teknik peserta didik SMK Citra Negara' },
      { src: '/images/esport.jpg', alt: 'Kegiatan esport peserta didik' },
      { src: '/images/gakuen.jpg', alt: 'Kegiatan kreatif peserta didik' },
    ],
  },
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { jenjang } = await params
  if (!isJenjang(jenjang)) return { title: 'Jenjang tidak ditemukan — SPMB Citra Negara' }
  const nama = jenjang.toUpperCase()
  return {
    title: `${nama} Citra Negara — SPMB`,
    description: `Profil, jadwal pendaftaran, biaya, dan persyaratan ${nama} Citra Negara.`,
  }
}

export default async function HalamanJenjang({ params }: Props) {
  const { jenjang } = await params
  if (!isJenjang(jenjang)) notFound()

  const { data, tahunAjaran, programSMK } = await getDataSatuJenjang(jenjang)
  if (!data) notFound()

  const naskah = NASKAH[jenjang]
  const namaTA = tahunAjaran?.nama ?? null

  return (
    <div className="lp-root">
      <Navigation />

      <main>
        {/* Hero jenjang */}
        <section className="lp-hero" style={{ height: '82svh', minHeight: '30rem' }}>
          <div className="lp-hero-media">
            <Image
              src={GAMBAR_JENJANG[jenjang]}
              alt={`Suasana ${data.label}`}
              fill
              priority
              sizes="100vw"
              style={{ objectFit: 'cover' }}
            />
          </div>
          <div className="lp-hero-tirai" />
          <div className="lp-hero-isi">
            <div className="lp-wadah">
              <p className="lp-label lp-label--terang">
                SPMB Citra Negara{namaTA ? ` · TA ${namaTA}` : ''}
              </p>
              <h1 className="lp-hero-judul" style={{ fontSize: 'clamp(3.5rem, 12vw, 10rem)' }}>
                {data.singkat}
              </h1>
              <p className="lp-panel-sub" style={{ fontSize: '1.05rem', marginTop: '0.8rem' }}>Citra Negara</p>
              <p className="lp-hero-sub">{naskah.kalimat}</p>
            </div>
          </div>
        </section>

        {/* Pengantar */}
        <section className="lp-bagian">
          <div className="lp-wadah">
            <div className="lp-editorial">
              <div>
                <Muncul><p className="lp-label">Tentang {data.label}</p></Muncul>
                <div style={{ marginTop: '1.4rem' }}>
                  <JudulBaris larik={naskah.kalimat.split(', ')} className="lp-judul-besar" />
                </div>
              </div>
              <div>
                {naskah.paragraf.map((p, i) => (
                  <Muncul key={i} jeda={i * 0.1}>
                    <p className="lp-teks" style={{ marginTop: i === 0 ? 0 : '1.4rem' }}>{p}</p>
                  </Muncul>
                ))}
                {data.hargaTerendah !== null && (
                  <Muncul jeda={0.24}>
                    <a href="#biaya-jenjang" className="lp-tombol lp-tombol--garis" style={{ marginTop: '2rem' }}>
                      Lihat biaya {data.singkat} <ArrowRight size={16} />
                    </a>
                  </Muncul>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Fokus pendidikan */}
        <section className="lp-bagian">
          <div className="lp-wadah">
            <div className="lp-nilai-grid">
              <div className="lp-nilai-lengket">
                <Muncul><p className="lp-label">Fokus pendidikan</p></Muncul>
                <div style={{ marginTop: '1.4rem' }}>
                  <JudulBaris larik={['Yang kami', 'utamakan.']} className="lp-judul-besar" />
                </div>
              </div>
              <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
                {naskah.fokus.map((f, i) => (
                  <Muncul as="li" key={f.judul} className="lp-nilai-item" jeda={i * 0.06}>
                    <span className="lp-angka">{String(i + 1).padStart(2, '0')}</span>
                    <div>
                      <h3 className="lp-judul-sedang">{f.judul}</h3>
                      <p className="lp-teks" style={{ marginTop: '0.8rem', maxWidth: '42ch' }}>{f.teks}</p>
                    </div>
                  </Muncul>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* Galeri */}
        <section className="lp-bagian">
          <div className="lp-wadah">
            <Muncul><p className="lp-label">Keseharian</p></Muncul>
            <div style={{ display: 'grid', gap: '1.2rem', marginTop: '2rem', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 18rem), 1fr))' }}>
              {naskah.galeri.map(g => (
                <Singkap key={g.src}>
                  <div className="lp-bingkai" style={{ aspectRatio: '3 / 4' }}>
                    <Image src={g.src} alt={g.alt} fill loading="lazy" sizes="(max-width: 900px) 100vw, 30vw" style={{ objectFit: 'cover' }} />
                  </div>
                </Singkap>
              ))}
            </div>
          </div>
        </section>

        {/* Program keahlian — HANYA SMK */}
        {programSMK.length > 0 && (
          <section className="lp-bagian">
            <div className="lp-wadah">
              <Muncul><p className="lp-label">Program Keahlian</p></Muncul>
              <div style={{ marginTop: '1.4rem' }}>
                <JudulBaris larik={['Pilih jalanmu.']} className="lp-judul-besar" />
              </div>
              <div style={{ display: 'grid', gap: '1.2rem', marginTop: '2.5rem', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 17rem), 1fr))' }}>
                {programSMK.map(p => (
                  <Muncul key={p.kode}>
                    <article className="lp-program" style={{ width: '100%', height: 'min(52svh, 24rem)' }}>
                      <div className="lp-program-media">
                        <Image src={p.gambar} alt="" fill loading="lazy" sizes="(max-width: 900px) 100vw, 25vw" style={{ objectFit: 'cover' }} />
                      </div>
                      <div className="lp-program-isi">
                        <span className="lp-program-kode">{p.kode}</span>
                        <h3 className="lp-program-nama">{p.nama}</h3>
                      </div>
                    </article>
                  </Muncul>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Jadwal jenjang ini */}
        {data.jadwal.length > 0 && (
          <section className="lp-bagian">
            <div className="lp-wadah">
              <Muncul><p className="lp-label">Jadwal Pendaftaran {data.singkat}</p></Muncul>
              <div style={{ marginTop: '1.4rem' }}>
                <JudulBaris larik={['Kapan harus', 'dimulai?']} className="lp-judul-besar" />
              </div>
              <div style={{ marginTop: '2.5rem' }}>
                {data.jadwal.map((g, i) => (
                  <Muncul key={g.id} className="lp-jadwal-baris" jeda={i * 0.05}>
                    <span className="lp-angka" style={{ fontSize: 'clamp(1.6rem, 2.6vw, 2.6rem)' }}>
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <div>
                      <h3 style={{ fontFamily: 'var(--lp-serif)', fontSize: 'clamp(1.2rem, 2vw, 1.7rem)', margin: 0 }}>
                        {g.nama}
                        {g.aktif && (
                          <span className="lp-lencana lp-lencana--wajib" style={{ marginLeft: '0.8rem', verticalAlign: 'middle' }}>
                            Sedang berjalan
                          </span>
                        )}
                      </h3>
                      <p className="lp-teks" style={{ marginTop: '0.4rem', fontSize: '0.92rem' }}>
                        {g.untukAlumni ? 'Jalur alumni SMP Citra Negara' : 'Jalur umum'}
                        {g.diskonPersen > 0 ? ` · potongan ${g.diskonPersen}%` : ''}
                      </p>
                    </div>
                    <span className="lp-jadwal-tanggal">
                      {rentangTanggal(g.tanggalMulai, g.tanggalSelesai)}
                    </span>
                  </Muncul>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Biaya — tetap tersembunyi sampai diklik */}
        <BiayaJenjang data={data} />

        {/* Persyaratan jenjang ini */}
        {data.persyaratan.length > 0 && (
          <section className="lp-bagian" style={{ background: 'var(--lp-kertas-hangat)' }}>
            <div className="lp-wadah">
              <Muncul><p className="lp-label">Persyaratan {data.singkat}</p></Muncul>
              <div style={{ marginTop: '1.4rem' }}>
                <JudulBaris larik={['Yang perlu', 'kamu siapkan.']} className="lp-judul-besar" />
              </div>
              <ol style={{ listStyle: 'none', margin: '2.5rem 0 0', padding: 0 }}>
                {data.persyaratan.map((s, i) => (
                  <Muncul as="li" key={s.id} className="lp-syarat-baris" jeda={i * 0.04}>
                    <span className="lp-syarat-no">{String(i + 1).padStart(2, '0')}</span>
                    <div>
                      <div style={{ fontWeight: 650, lineHeight: 1.5 }}>{s.nama}</div>
                      {s.deskripsi && <p className="lp-teks" style={{ marginTop: '0.35rem', fontSize: '0.92rem' }}>{s.deskripsi}</p>}
                    </div>
                    <span className={`lp-lencana lp-lencana--${s.wajib ? 'wajib' : 'opsional'}`}>
                      {s.wajib ? 'Wajib' : 'Bila ada'}
                    </span>
                  </Muncul>
                ))}
              </ol>
            </div>
          </section>
        )}

        {/* Penutup */}
        <section className="lp-bagian" style={{ textAlign: 'center' }}>
          <div className="lp-wadah">
            <Muncul>
              <h2 className="lp-judul-besar" style={{ margin: '0 auto', maxWidth: '18ch' }}>
                Siap bergabung dengan {data.label}?
              </h2>
            </Muncul>
            <Muncul jeda={0.12}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.9rem', justifyContent: 'center', marginTop: '2.4rem' }}>
                <Link href="/register" className="lp-tombol lp-tombol--utama">
                  Daftar Sekarang <ArrowRight size={17} />
                </Link>
                <Link href="/spmb" className="lp-tombol lp-tombol--garis">
                  <ArrowLeft size={17} /> Kembali ke Beranda
                </Link>
              </div>
            </Muncul>
          </div>
        </section>
      </main>

      <Footer tahunAjaran={namaTA} />
    </div>
  )
}
