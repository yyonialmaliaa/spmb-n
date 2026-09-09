'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowRight, ChevronDown, ChevronUp } from 'lucide-react'
import { Muncul, JudulBaris } from './gerak'
import { formatRupiah } from '@/lib/pembayaran-utils'
import type { DataJenjang } from '@/lib/landing'

/**
 * Rincian biaya satu jenjang di halaman detail — tetap tertutup sampai
 * pengunjung menekan tombolnya, sama seperti di halaman depan.
 *
 * Nominalnya dari tabel Harga tahun ajaran aktif; potongannya dari gelombang
 * yang sedang berjalan. Tidak ada angka yang ditulis tangan.
 */
export function BiayaJenjang({ data }: { data: DataJenjang }) {
  const [terbuka, setTerbuka] = useState(false)

  if (data.harga.length === 0) return null

  const potongan = data.gelombangAktif?.diskonPersen ?? 0
  const setelah = (n: number) => Math.round(n * (1 - potongan / 100))
  const terendah = Math.min(...data.harga.map(h => h.nominal))
  const tertinggi = Math.max(...data.harga.map(h => h.nominal))

  return (
    <section id="biaya-jenjang" className="lp-bagian">
      <div className="lp-wadah">
        <Muncul><p className="lp-label">Biaya Pendidikan {data.singkat}</p></Muncul>
        <div style={{ marginTop: '1.4rem' }}>
          <JudulBaris larik={['Transparan', 'sejak awal.']} className="lp-judul-besar" />
        </div>

        <Muncul jeda={0.1}>
          <p className="lp-teks" style={{ marginTop: '1.6rem', maxWidth: '48ch' }}>
            Rincian biaya {data.label} pada tahun ajaran yang sedang dibuka.
          </p>
        </Muncul>

        <Muncul jeda={0.16}>
          <button
            type="button"
            onClick={() => setTerbuka(v => !v)}
            aria-expanded={terbuka}
            aria-controls="rincian-biaya-jenjang"
            className="lp-tombol lp-tombol--garis"
            style={{ marginTop: '2rem' }}
          >
            {terbuka ? 'Sembunyikan rincian' : 'Lihat rincian biaya'}
            {terbuka ? <ChevronUp size={17} /> : <ChevronDown size={17} />}
          </button>
        </Muncul>

        {terbuka && (
          <div id="rincian-biaya-jenjang" className="lp-biaya-panel" style={{ marginTop: '2.4rem' }}>
            {data.harga.map((h, i) => (
              <div className="lp-biaya-baris" key={`${h.jurusan}-${h.kelas}-${i}`}>
                <div>
                  <div style={{ fontWeight: 650 }}>{h.kelas}</div>
                  {h.jurusan && h.jurusan !== '-' && (
                    <div style={{ fontSize: '0.88rem', color: 'var(--lp-tinta-samar)', marginTop: '0.2rem' }}>
                      {h.jurusan}
                    </div>
                  )}
                </div>
                <span className="lp-biaya-nominal">
                  {potongan > 0 && <span className="lp-coret">{formatRupiah(h.nominal)}</span>}
                  {formatRupiah(setelah(h.nominal))}
                </span>
              </div>
            ))}

            {potongan > 0 && data.gelombangAktif && (
              <div className="lp-biaya-baris" style={{ borderBottom: 'none' }}>
                <div>
                  <div style={{ fontWeight: 650, color: 'var(--lp-hijau)' }}>
                    Potongan {data.gelombangAktif.nama}
                  </div>
                  <div style={{ fontSize: '0.88rem', color: 'var(--lp-tinta-samar)', marginTop: '0.2rem' }}>
                    Berlaku selama gelombang ini berjalan
                  </div>
                </div>
                <span className="lp-biaya-nominal" style={{ color: 'var(--lp-hijau)' }}>−{potongan}%</span>
              </div>
            )}

            <div className="lp-biaya-total" style={{ borderTop: '2px solid var(--lp-tinta)' }}>
              <span style={{ fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', fontSize: '0.82rem' }}>
                {terendah === tertinggi ? 'Total' : 'Rentang biaya'}
              </span>
              <span className="lp-biaya-nominal" style={{ fontSize: 'clamp(1.5rem, 2.6vw, 2.2rem)' }}>
                {terendah === tertinggi
                  ? formatRupiah(setelah(terendah))
                  : `${formatRupiah(setelah(terendah))} – ${formatRupiah(setelah(tertinggi))}`}
              </span>
            </div>

            <Link href="/register" className="lp-tombol lp-tombol--utama" style={{ marginTop: '2rem' }}>
              Daftar Sekarang <ArrowRight size={16} />
            </Link>
          </div>
        )}
      </div>
    </section>
  )
}
