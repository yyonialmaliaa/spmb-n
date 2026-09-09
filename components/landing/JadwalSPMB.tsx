'use client'

import { useState } from 'react'
import { Muncul, JudulBaris } from './gerak'
import type { DataJenjang } from '@/lib/landing'
import { rentangTanggal } from '@/lib/tanggal'

/**
 * Jadwal gelombang, dibaca langsung dari data Gelombang tahun ajaran aktif.
 * Tidak ada tanggal yang ditulis tangan — kalau admin menggeser jadwal,
 * halaman ini ikut bergeser.
 */
export function JadwalSPMB({ jenjang }: { jenjang: DataJenjang[] }) {
  const adaJadwal = jenjang.some(j => j.jadwal.length > 0)
  const [aktif, setAktif] = useState<string>(jenjang[0]?.jenjang ?? 'smp')

  if (!adaJadwal) return null

  const terpilih = jenjang.find(j => j.jenjang === aktif) ?? jenjang[0]

  return (
    <section id="jadwal" className="lp-bagian">
      <div className="lp-wadah">
        <Muncul>
          <p className="lp-label">Jadwal SPMB</p>
        </Muncul>
        <div style={{ marginTop: '1.4rem' }}>
          <JudulBaris larik={['Kapan harus', 'dimulai?']} className="lp-judul-besar" />
        </div>

        <Muncul jeda={0.1}>
          <div className="lp-tab-baris" role="tablist" aria-label="Jadwal per jenjang" style={{ marginTop: '2.5rem' }}>
            {jenjang.map(j => (
              <button
                key={j.jenjang}
                role="tab"
                type="button"
                aria-selected={j.jenjang === aktif}
                onClick={() => setAktif(j.jenjang)}
                className="lp-tab"
                
              >
                {j.singkat}
              </button>
            ))}
          </div>
        </Muncul>

        <div style={{ marginTop: '2.5rem' }} key={terpilih.jenjang} className="lp-biaya-panel lp-jadwal-daftar">
          {terpilih.jadwal.length === 0 ? (
            <p className="lp-teks">Jadwal {terpilih.label} akan diumumkan.</p>
          ) : (
            terpilih.jadwal.map(g => (
              <div key={g.id} className="lp-jadwal-baris">
                <span className="lp-angka" style={{ fontSize: 'clamp(1.6rem, 2.6vw, 2.6rem)' }}>
                  {String(terpilih.jadwal.indexOf(g) + 1).padStart(2, '0')}
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
                <span className="lp-jadwal-tanggal">{rentangTanggal(g.tanggalMulai, g.tanggalSelesai)}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </section>
  )
}
