'use client'

import { useState, type FormEvent, type ReactNode } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowRight, Check, CircleAlert, FileText, Info, LoaderCircle, MessageCircle, Route } from 'lucide-react'
import { YAYASAN_INFO } from '@/lib/biaya'
import { JENJANG_SINGKAT, type Jenjang } from '@/lib/labels'
import {
  BATAS_PANJANG,
  JENJANG_PRA,
  MASA_BERLAKU_HARI,
  catatanBawa,
  contohAsalSekolah,
  labelAsalSekolah,
  validasiPraPendaftaran,
  type BarisBawa,
  type GalatPra,
  type InputPra,
} from '@/lib/praPendaftaran'

const KET_JENJANG: Record<Jenjang, string> = {
  smp: 'Lulusan SD/MI',
  sma: 'Lulusan SMP/MTs',
  smk: 'Lulusan SMP/MTs',
}

const KOSONG: InputPra = { jenjang: '', namaLengkap: '', asalSekolah: '', alamat: '', noHp: '', email: '' }
const URUTAN: (keyof InputPra)[] = ['jenjang', 'namaLengkap', 'asalSekolah', 'alamat', 'noHp', 'email']

const WA_SEKOLAH = '62' + YAYASAN_INFO.telp.replace(/\D/g, '').replace(/^0/, '')
const PESAN_WA = encodeURIComponent('Halo Petugas SPMB Citra Negara, saya ingin bertanya tentang pra-pendaftaran.')

function Medan({ id, label, galat, children }: { id: string; label: string; galat?: string; children: ReactNode }) {
  return (
    <div className="pra-medan">
      <label className="pra-label" htmlFor={id}>
        {label}<span className="pra-wajib" aria-hidden="true">*</span>
      </label>
      {children}
      {galat && <p className="pra-galat" id={`${id}-galat`}><CircleAlert size={14} aria-hidden="true" />{galat}</p>}
    </div>
  )
}

function Bagian({ no, judul, children }: { no: number; judul: string; children: ReactNode }) {
  return (
    <fieldset className="pra-langkah">
      <legend className="pra-langkah-kepala">
        <span className="pra-langkah-no" aria-hidden="true">{no}</span>
        <span className="pra-langkah-judul">{judul}</span>
      </legend>
      {children}
    </fieldset>
  )
}

export function FormPraPendaftaran({ persyaratan }: { persyaratan: Record<Jenjang, BarisBawa[]> }) {
  const router = useRouter()
  const [isian, setIsian] = useState<InputPra>(KOSONG)
  const [situs, setSitus] = useState('')
  const [galat, setGalat] = useState<GalatPra>({})
  const [pesan, setPesan] = useState('')
  const [mengirim, setMengirim] = useState(false)
  const [sudahDicoba, setSudahDicoba] = useState(false)

  const jenjang = (JENJANG_PRA as string[]).includes(isian.jenjang) ? (isian.jenjang as Jenjang) : null

  // Bila ketiga jenjang meminta dokumen yang sama, daftarnya langsung tampil tanpa menunggu jenjang dipilih.
  const sidik = (l: BarisBawa[]) => l.map(b => `${b.nama}|${b.wajib}|${b.fieldKey}`).join('¦')
  const seragam = new Set(JENJANG_PRA.map(j => sidik(persyaratan[j]))).size === 1
  const berkas = jenjang ? persyaratan[jenjang] : seragam ? persyaratan[JENJANG_PRA[0]] : null

  const ubah = (k: keyof InputPra, v: string) => {
    const baru = { ...isian, [k]: v }
    setIsian(baru)
    if (!sudahDicoba && !galat[k]) return
    const cek = validasiPraPendaftaran(baru)
    if (sudahDicoba) setGalat(cek.ok ? {} : cek.galat)
    else setGalat(g => ({ ...g, [k]: cek.ok ? undefined : cek.galat[k] }))
  }

  const periksa = (k: keyof InputPra) => {
    if (!isian[k].trim()) return
    const cek = validasiPraPendaftaran(isian)
    setGalat(g => ({ ...g, [k]: cek.ok ? undefined : cek.galat[k] }))
  }

  const atribut = (k: Exclude<keyof InputPra, 'jenjang'>) => ({
    id: `pra-${k}`,
    name: k,
    value: isian[k],
    onChange: (e: { target: { value: string } }) => ubah(k, e.target.value),
    onBlur: () => periksa(k),
    maxLength: BATAS_PANJANG[k],
    'aria-invalid': galat[k] ? true : undefined,
    'aria-describedby': galat[k] ? `pra-${k}-galat` : undefined,
    className: 'pra-input',
    required: true,
  })

  const kirim = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (mengirim) return
    setSudahDicoba(true)
    setPesan('')
    const cek = validasiPraPendaftaran(isian)
    if (!cek.ok) {
      setGalat(cek.galat)
      const pertama = URUTAN.find(k => cek.galat[k])
      if (pertama) document.getElementById(`pra-${pertama}`)?.focus()
      return
    }

    setMengirim(true)
    try {
      const res = await fetch('/api/pra-pendaftaran', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...cek.data, situs }),
      })
      const d = await res.json().catch(() => ({}))
      if (res.ok && typeof d.token === 'string') {
        router.push(`/spmb/pra-pendaftaran/bukti/${d.token}?unduh=1`)
        return
      }
      if (d.galat) setGalat(d.galat)
      setPesan(d.error || 'Pra-pendaftaran belum terkirim. Silakan coba lagi.')
    } catch {
      setPesan('Koneksi terputus. Periksa internet Anda, lalu coba kirim lagi.')
    }
    setMengirim(false)
  }

  return (
    <div className="pra-tata">
      <form className="pra-kartu pra-form" onSubmit={kirim} noValidate aria-describedby="pra-catatan">
        <p className="pra-catatan" id="pra-catatan">
          <Info size={17} aria-hidden="true" />
          <span>
            Pra-pendaftaran ini digunakan untuk mendapatkan antrean layanan pendaftaran di sekolah. Silakan datang ke sekolah
            dengan membawa Bukti Pra-Pendaftaran dan dokumen yang dipersyaratkan.
          </span>
        </p>

        <Bagian no={1} judul="Jenjang yang Diminati">
          <div className="pra-jenjang" role="radiogroup" aria-label="Jenjang yang diminati" aria-invalid={galat.jenjang ? true : undefined}>
            {JENJANG_PRA.map((j, i) => (
              <label key={j} className="pra-jenjang-opsi">
                <input
                  id={i === 0 ? 'pra-jenjang' : undefined}
                  type="radio"
                  name="jenjang"
                  value={j}
                  checked={isian.jenjang === j}
                  onChange={() => ubah('jenjang', j)}
                />
                <span className="pra-jenjang-kartu">
                  <span className="pra-jenjang-singkat">{JENJANG_SINGKAT[j]}</span>
                  <span className="pra-jenjang-ket">{KET_JENJANG[j]}</span>
                </span>
                <span className="pra-jenjang-centang" aria-hidden="true"><Check size={11} strokeWidth={3.2} /></span>
              </label>
            ))}
          </div>
          {galat.jenjang && <p className="pra-galat"><CircleAlert size={14} aria-hidden="true" />{galat.jenjang}</p>}
        </Bagian>

        <Bagian no={2} judul="Data Calon Peserta Didik">
          <div className="pra-isian">
            <Medan id="pra-namaLengkap" label="Nama Lengkap" galat={galat.namaLengkap}>
              <input {...atribut('namaLengkap')} type="text" autoComplete="name" placeholder="Contoh: Budi Santoso" />
            </Medan>
            <Medan id="pra-asalSekolah" label={labelAsalSekolah(jenjang)} galat={galat.asalSekolah}>
              <input {...atribut('asalSekolah')} type="text" autoComplete="off" placeholder={contohAsalSekolah(jenjang)} />
            </Medan>
            <Medan id="pra-alamat" label="Alamat Tempat Tinggal" galat={galat.alamat}>
              <textarea {...atribut('alamat')} rows={3} autoComplete="street-address" placeholder="Contoh: Jl. Melati No. 5, RT 02/RW 04, Kel. Beji, Kec. Beji, Depok" />
            </Medan>
          </div>
        </Bagian>

        <Bagian no={3} judul="Kontak yang Bisa Dihubungi">
          <div className="pra-isian pra-isian--dua">
            <Medan id="pra-noHp" label="Nomor HP / WhatsApp" galat={galat.noHp}>
              <input {...atribut('noHp')} type="tel" inputMode="tel" autoComplete="tel" placeholder="081234567890" />
            </Medan>
            <Medan id="pra-email" label="Email" galat={galat.email}>
              <input {...atribut('email')} type="email" inputMode="email" autoComplete="email" autoCapitalize="none" spellCheck={false} placeholder="nama@gmail.com" />
            </Medan>
          </div>
        </Bagian>

        <div className="pra-jebakan" aria-hidden="true">
          <label htmlFor="pra-situs">Situs web</label>
          <input id="pra-situs" name="situs" type="text" tabIndex={-1} autoComplete="off" value={situs} onChange={e => setSitus(e.target.value)} />
        </div>

        {pesan && (
          <p className="pra-banner-galat" role="alert">
            <CircleAlert size={16} aria-hidden="true" />
            <span>{pesan}</span>
          </p>
        )}

        <div className="pra-kirim">
          <button type="submit" className="lp-tombol lp-tombol--utama pra-tombol-kirim" disabled={mengirim}>
            {mengirim ? (
              <><LoaderCircle size={17} className="pra-putar" aria-hidden="true" /> Mengirim…</>
            ) : (
              <>Kirim Pra-Pendaftaran <ArrowRight size={17} aria-hidden="true" /></>
            )}
          </button>
          <p className="pra-alternatif">
            Ingin mengisi formulir lengkap dari rumah? <Link href="/register">Daftar Online</Link>
            {' · '}Sudah punya akun? <Link href="/login">Masuk</Link>
          </p>
        </div>
      </form>

      <aside className="pra-samping" aria-label="Bantuan dan informasi">
        <section className="pra-kartu pra-kotak pra-bantuan">
          <p className="pra-kotak-label">Layanan bantuan</p>
          <h2 className="pra-bantuan-judul">Bingung atau sulit mengisi formulir?</h2>
          <p className="pra-kotak-teks">Petugas SPMB siap membantu lewat WhatsApp.</p>
          <a className="pra-bantuan-tombol" href={`https://wa.me/${WA_SEKOLAH}?text=${PESAN_WA}`} target="_blank" rel="noopener noreferrer">
            <MessageCircle size={17} aria-hidden="true" /> Hubungi Petugas
          </a>
        </section>

        <section className="pra-kartu pra-kotak">
          <h2 className="pra-kotak-judul"><Route size={17} aria-hidden="true" /> Hanya tiga langkah</h2>
          <ol className="pra-tahap">
            <li>
              <span className="pra-tahap-no">1</span>
              <span>
                <span className="pra-tahap-judul">Isi formulir singkat</span>
                <span className="pra-tahap-ket">Tanpa membuat akun dan tanpa unggah berkas.</span>
              </span>
            </li>
            <li>
              <span className="pra-tahap-no">2</span>
              <span>
                <span className="pra-tahap-judul">Unduh Bukti Pra-Pendaftaran</span>
                <span className="pra-tahap-ket">Berisi nomor antrean dan daftar dokumen yang perlu dibawa.</span>
              </span>
            </li>
            <li>
              <span className="pra-tahap-no">3</span>
              <span>
                <span className="pra-tahap-judul">Datang ke sekolah</span>
                <span className="pra-tahap-ket">Paling lambat {MASA_BERLAKU_HARI} hari, bawa bukti dan dokumen.</span>
              </span>
            </li>
          </ol>
        </section>

        <section className="pra-kartu pra-kotak">
          <h2 className="pra-kotak-judul">
            <FileText size={17} aria-hidden="true" /> Berkas Yang Wajib Dibawa{jenjang && !seragam ? ` (${JENJANG_SINGKAT[jenjang]})` : ''}
          </h2>
          {berkas ? (
            <ul className="pra-berkas">
              {berkas.map(b => (
                <li key={b.nama}>
                  <Check size={15} strokeWidth={2.4} aria-hidden="true" />
                  <span>
                    <span className="pra-berkas-nama">{b.nama}</span>
                    <span className="pra-berkas-catatan">{catatanBawa(b)}{!b.wajib ? ' · Bila ada' : ''}</span>
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="pra-kotak-teks">Pilih jenjang terlebih dahulu untuk melihat dokumen yang perlu disiapkan.</p>
          )}
        </section>
      </aside>
    </div>
  )
}
