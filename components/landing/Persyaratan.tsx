'use client'

import { useState } from 'react'
import { Muncul, JudulBaris } from './gerak'
import type { DataJenjang } from '@/lib/landing'

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
 * dan SMK meminta enam berkas yang sama, sehingga menampilkan tiga tab yang
 * isinya identik cuma menyuruh pengunjung mengklik untuk membaca hal yang
 * sama tiga kali. Perbandingannya dilakukan atas data, bukan diputuskan di
 * sini — begitu admin membedakan satu jenjang, tab-nya kembali dengan
 * sendirinya tanpa mengubah kode.
 */
export function Persyaratan({ jenjang }: { jenjang: DataJenjang[] }) {
  const berisi = jenjang.filter(j => j.persyaratan.length > 0)
  const [aktif, setAktif] = useState<string>(berisi[0]?.jenjang ?? 'smp')

  if (berisi.length === 0) return null

  const seragam = berisi.length > 1 && new Set(berisi.map(sidik)).size === 1
  const terpilih = seragam ? berisi[0] : (berisi.find(j => j.jenjang === aktif) ?? berisi[0])

  return (
    <section id="persyaratan" className="lp-bagian">
      <div className="lp-wadah">
        <Muncul>
          <p className="lp-label">Persyaratan</p>
        </Muncul>
        <div style={{ marginTop: '1.4rem' }}>
          <JudulBaris larik={['Yang perlu', 'kamu siapkan.']} className="lp-judul-besar" />
        </div>

        <Muncul jeda={0.1}>
          <p className="lp-teks" style={{ marginTop: '1.6rem', maxWidth: '50ch' }}>
            {seragam
              ? `Berkas yang sama berlaku untuk ketiga jenjang — ${berisi.map(j => j.singkat).join(', ')} Citra Negara.`
              : 'Berkas yang diminta berbeda menurut jenjang. Pilih jenjang yang kamu tuju.'}
          </p>
        </Muncul>

        {!seragam && (
          <Muncul jeda={0.16}>
            <div className="lp-tab-baris" role="tablist" aria-label="Persyaratan per jenjang" style={{ marginTop: '2.2rem' }}>
              {berisi.map(j => (
                <button
                  key={j.jenjang}
                  type="button"
                  role="tab"
                  aria-selected={j.jenjang === aktif}
                  onClick={() => setAktif(j.jenjang)}
                  className="lp-tab"
                >
                  {j.singkat}
                </button>
              ))}
            </div>
          </Muncul>
        )}

        <div style={{ marginTop: '2.5rem' }} key={terpilih.jenjang} className="lp-biaya-panel">
          <ol className="lp-syarat-daftar" style={{ listStyle: 'none', margin: 0, padding: 0 }}>
            {terpilih.persyaratan.map((s, i) => (
              <li key={s.id} className="lp-syarat-baris">
                <span className="lp-syarat-no">{String(i + 1).padStart(2, '0')}</span>
                <div>
                  <div style={{ fontWeight: 650, lineHeight: 1.5 }}>{s.nama}</div>
                  {s.deskripsi && (
                    <p className="lp-teks" style={{ marginTop: '0.35rem', fontSize: '0.92rem' }}>{s.deskripsi}</p>
                  )}
                </div>
                <span className={`lp-lencana lp-lencana--${s.wajib ? 'wajib' : 'opsional'}`}>
                  {s.wajib ? 'Wajib' : 'Bila ada'}
                </span>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  )
}
