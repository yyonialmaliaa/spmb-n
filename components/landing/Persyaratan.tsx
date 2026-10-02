'use client'

import { useState, type CSSProperties } from 'react'
import { Camera, FileText, GraduationCap, IdCard, ScrollText, Users, type LucideIcon } from 'lucide-react'
import { Muncul, JudulBaris } from './gerak'
import type { DataJenjang } from '@/lib/landing'
import { useBahasa } from './i18n/PenyediaBahasa'
import { infoBahasa } from './i18n/bahasa'
import { namaSyarat } from './i18n/data'

/** Ikon kotak persyaratan, ditebak dari nama berkasnya. */
function ikonSyarat(nama: string): LucideIcon {
  const n = nama.toLowerCase()
  if (/ijazah|skl|lulus/.test(n)) return GraduationCap
  if (/akte|akta|kelahiran/.test(n)) return ScrollText
  if (/kartu keluarga|\bkk\b/.test(n)) return Users
  if (/ktp|identitas/.test(n)) return IdCard
  if (/foto|photo/.test(n)) return Camera
  return FileText
}

/** Sidik jari isi persyaratan sebuah jenjang, untuk membandingkan antar-jenjang. */
function sidik(j: DataJenjang) {
  return JSON.stringify(
    j.persyaratan.map(s => `${s.nama}|${s.wajib}`).sort(),
  )
}

/**
 * Persyaratan berkas.
 *
 * Daftarnya dibaca dari DokumenPersyaratan(kategori='pendaftaran') — sumber
 * yang sama dengan checklist yang dipakai petugas saat memverifikasi. Jadi apa
 * yang dijanjikan di halaman depan persis yang diperiksa di loket.
 *
 * Tab per jenjang hanya muncul kalau isinya MEMANG berbeda. Saat ini SMP, SMA,
 * dan SMK meminta lima berkas yang sama, sehingga menampilkan tiga tab yang
 * isinya identik cuma menyuruh pengunjung mengklik untuk membaca hal yang
 * sama tiga kali. Perbandingannya dilakukan atas data, bukan diputuskan di
 * sini — begitu admin membedakan satu jenjang, tab-nya kembali dengan
 * sendirinya tanpa mengubah kode.
 */
export function Persyaratan({ jenjang }: { jenjang: DataJenjang[] }) {
  const berisi = jenjang.filter(j => j.persyaratan.length > 0)
  const [aktif, setAktif] = useState<string>(berisi[0]?.jenjang ?? 'smp')
  const { bahasa, t } = useBahasa()

  if (berisi.length === 0) return null

  const seragam = berisi.length > 1 && new Set(berisi.map(sidik)).size === 1
  const terpilih = seragam ? berisi[0] : (berisi.find(j => j.jenjang === aktif) ?? berisi[0])
  // Nama jenjang di bahasa aktif ("SMP" → "Junior High"); daftarnya dirangkai
  // sesuai bahasa ("…, Senior High, and Vocational High"), Indonesia tetap
  // "SMP, SMA, SMK".
  const nama = berisi.map(j => t.jenjang.nama[j.jenjang].singkat)
  const daftarNama = bahasa === 'id'
    ? nama.join(', ')
    : new Intl.ListFormat(infoBahasa(bahasa).locale, { type: 'conjunction' }).format(nama)

  return (
    <section id="persyaratan" className="lp-bagian">
      <div className="lp-wadah">
        <Muncul>
          <p className="lp-label">{t.syarat.label}</p>
        </Muncul>
        <div style={{ marginTop: '1.4rem' }}>
          <JudulBaris larik={t.syarat.judul} className="lp-judul-besar" />
        </div>

        <Muncul jeda={0.1}>
          <p className="lp-teks" style={{ marginTop: '1.6rem', maxWidth: '50ch' }}>
            {seragam
              ? t.syarat.seragam(daftarNama)
              : t.syarat.beda}
          </p>
        </Muncul>

        {!seragam && (
          <Muncul jeda={0.16}>
            <div className="lp-tab-baris" role="tablist" aria-label={t.syarat.tabAria} style={{ marginTop: '2.2rem' }}>
              {berisi.map(j => (
                <button
                  key={j.jenjang}
                  type="button"
                  role="tab"
                  aria-selected={j.jenjang === aktif}
                  onClick={() => setAktif(j.jenjang)}
                  className="lp-tab"
                >
                  {t.jenjang.nama[j.jenjang].singkat}
                </button>
              ))}
            </div>
          </Muncul>
        )}

        {/* Kotak bernomor: nomor urut membantu pendaftar mencentang berkasnya
            satu per satu. */}
        <ol key={terpilih.jenjang} className="lp-syarat-kotak-daftar lp-biaya-panel">
          {terpilih.persyaratan.map((s, i) => {
            const Ikon = ikonSyarat(s.nama)
            return (
              <li key={s.id} className="lp-syarat-kotak" style={{ '--i': i } as CSSProperties}>
                <Ikon className="lp-syarat-kotak-ikon" size={40} strokeWidth={1.35} aria-hidden="true" />
                <span className="lp-syarat-kotak-no" aria-hidden="true">{String(i + 1).padStart(2, '0')}</span>
                <h3 className="lp-syarat-kotak-nama">{namaSyarat(s.nama, bahasa)}</h3>
                {s.deskripsi && <p className="lp-syarat-kotak-desk">{s.deskripsi}</p>}
                <span className={`lp-syarat-kotak-status${s.wajib ? ' is-wajib' : ''}`}>
                  {s.wajib ? t.syarat.wajib : t.syarat.bilaAda}
                </span>
                <span className="lp-syarat-kotak-garis" aria-hidden="true" />
              </li>
            )
          })}
        </ol>
      </div>
    </section>
  )
}
