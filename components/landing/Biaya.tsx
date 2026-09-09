'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowRight, ChevronDown } from 'lucide-react'
import { Muncul, JudulBaris } from './gerak'
import { formatRupiah } from '@/lib/pembayaran-utils'
import type { DataJenjang } from '@/lib/landing'

/**
 * Biaya pendidikan — sengaja TERTUTUP sampai pengunjung memilih jenjang.
 *
 * Alasannya bukan sekadar gaya: biaya SMP, SMA, dan SMK berbeda, dan
 * menampilkan ketiganya sekaligus membuat orang membaca angka yang bukan
 * miliknya. Memilih dulu, baru melihat, membuat angkanya selalu punya
 * konteks yang benar.
 *
 * Seluruh nominal berasal dari tabel Harga tahun ajaran aktif, dan potongannya
 * dari gelombang yang sedang berjalan — sama persis dengan yang dipakai saat
 * tagihan pendaftar dihitung.
 */
export function Biaya({ jenjang }: { jenjang: DataJenjang[] }) {
  const [dipilih, setDipilih] = useState<string | null>(null)
  const data = jenjang.find(j => j.jenjang === dipilih) ?? null

  const adaHarga = jenjang.some(j => j.harga.length > 0)
  if (!adaHarga) return null

  const potongan = data?.gelombangAktif?.diskonPersen ?? 0

  // Satu jenjang bisa punya beberapa baris harga (kelas / program berbeda).
  // Yang ditampilkan adalah rentangnya, bukan satu angka yang menyesatkan.
  const nominalTerendah = data && data.harga.length > 0 ? Math.min(...data.harga.map(h => h.nominal)) : 0
  const nominalTertinggi = data && data.harga.length > 0 ? Math.max(...data.harga.map(h => h.nominal)) : 0
  const setelahPotongan = (n: number) => Math.round(n * (1 - potongan / 100))

  return (
    <section id="biaya" className="lp-bagian">
      <div className="lp-wadah">
        <Muncul>
          <p className="lp-label">Biaya Pendidikan</p>
        </Muncul>
        <div style={{ marginTop: '1.4rem' }}>
          <JudulBaris larik={['Transparan', 'sejak awal.']} className="lp-judul-besar" />
        </div>

        <Muncul jeda={0.1}>
          <p className="lp-teks" style={{ marginTop: '1.6rem', maxWidth: '48ch' }}>
            Pilih jenjang untuk melihat rincian biayanya. Angka di bawah adalah
            biaya yang berlaku pada tahun ajaran yang sedang dibuka.
          </p>
        </Muncul>

        <Muncul jeda={0.16}>
          <div className="lp-tab-baris" role="tablist" aria-label="Biaya per jenjang" style={{ marginTop: '2.2rem' }}>
            {jenjang.filter(j => j.harga.length > 0).map(j => (
              <button
                key={j.jenjang}
                type="button"
                role="tab"
                aria-selected={j.jenjang === dipilih}
                aria-controls="panel-biaya"
                onClick={() => setDipilih(prev => (prev === j.jenjang ? null : j.jenjang))}
                className="lp-tab"
              >
                {j.singkat}
              </button>
            ))}
          </div>
        </Muncul>

        <div id="panel-biaya" style={{ marginTop: '2.5rem', minHeight: '10rem' }}>
          {!data ? (
            <Muncul>
              <div
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.9rem',
                  padding: 'clamp(2rem, 4vw, 3rem)',
                  border: '1px dashed var(--lp-garis)', borderRadius: 10,
                  color: 'var(--lp-tinta-samar)',
                }}
              >
                <ChevronDown size={20} />
                <span className="lp-teks" style={{ margin: 0 }}>
                  Pilih SMP, SMA, atau SMK di atas untuk menampilkan rincian biaya.
                </span>
              </div>
            </Muncul>
          ) : (
            <div className="lp-biaya-panel" key={data.jenjang}>
              <h3 className="lp-judul-sedang" style={{ marginBottom: '1.6rem' }}>{data.label}</h3>

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
                    {formatRupiah(setelahPotongan(h.nominal))}
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
                  <span className="lp-biaya-nominal" style={{ color: 'var(--lp-hijau)' }}>
                    −{potongan}%
                  </span>
                </div>
              )}

              <div className="lp-biaya-total" style={{ borderTop: '2px solid var(--lp-tinta)' }}>
                <span style={{ fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', fontSize: '0.82rem' }}>
                  {nominalTerendah === nominalTertinggi ? 'Total' : 'Rentang biaya'}
                </span>
                <span className="lp-biaya-nominal" style={{ fontSize: 'clamp(1.5rem, 2.6vw, 2.2rem)' }}>
                  {nominalTerendah === nominalTertinggi
                    ? formatRupiah(setelahPotongan(nominalTerendah))
                    : `${formatRupiah(setelahPotongan(nominalTerendah))} – ${formatRupiah(setelahPotongan(nominalTertinggi))}`}
                </span>
              </div>

              <Link href="/register" className="lp-tombol lp-tombol--utama" style={{ marginTop: '2rem' }}>
                Daftar Sekarang <ArrowRight size={16} />
              </Link>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
