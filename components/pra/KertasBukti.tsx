import Image from 'next/image'
import { YAYASAN_INFO } from '@/lib/biaya'
import { JENJANG_LABEL_FULL } from '@/lib/labels'
import { STATUS_PRA, butirPetunjuk, catatanBawa, formatNoHp, tanggalWib } from '@/lib/praPendaftaran'
import type { DataBukti } from '@/lib/praPendaftaranServer'

/** Pratinjau HTML dari PDF bukti (lib/buktiPraPdf.ts) — isi keduanya harus tetap sama. */
export function KertasBukti({ data }: { data: DataBukti }) {
  const status = STATUS_PRA[data.status]
  const isian: { label: string; nilai: string; penuh?: boolean }[] = [
    { label: 'Nama Lengkap', nilai: data.namaLengkap },
    { label: 'Jenjang Tujuan', nilai: JENJANG_LABEL_FULL[data.jenjang] },
    { label: 'Asal Sekolah', nilai: data.asalSekolah },
    { label: 'Nomor HP / WhatsApp', nilai: formatNoHp(data.noHp) },
    { label: 'Email', nilai: data.email },
    { label: 'Tanggal Pra-Pendaftaran', nilai: tanggalWib(data.createdAt, true) },
    { label: 'Batas Waktu Kedatangan', nilai: tanggalWib(data.batasKedatangan) },
    ...(data.noPendaftaranResmi ? [{ label: 'Nomor Pendaftaran Resmi', nilai: data.noPendaftaranResmi }] : []),
    { label: 'Alamat', nilai: data.alamat, penuh: true },
  ]

  return (
    <article className="pra-kertas" aria-label="Bukti Pra-Pendaftaran">
      <header className="pra-kop">
        <Image src="/images/logo-bukti.png" alt="Logo YATKJ SMP · SMA · SMK" width={300} height={254} />
        <div>
          <p className="pra-kop-yayasan">{YAYASAN_INFO.nama}</p>
          <p className="pra-kop-nama">SPMB CITRA NEGARA</p>
          <p className="pra-kop-ket">
            SMP · SMA · SMK Citra Negara · Tahun Ajaran {data.tahunAjaranNama}
            <br />
            {YAYASAN_INFO.alamat} · Telp/WhatsApp {YAYASAN_INFO.telp}
          </p>
        </div>
      </header>

      <h2 className="pra-kertas-judul">BUKTI PRA-PENDAFTARAN SPMB</h2>

      <div className="pra-kertas-nomor">
        <div>
          <p className="pra-kertas-nomor-label">NOMOR PRA-PENDAFTARAN</p>
          <p className="pra-kertas-nomor-isi">{data.noPraPendaftaran}</p>
        </div>
        <div className="pra-kertas-nomor-kanan">
          <span className={`pra-status pra-status--${status.nada}`}>{status.teks}</span>
          <span>Berlaku sampai {tanggalWib(data.batasKedatangan)}</span>
        </div>
      </div>

      <h3 className="pra-kertas-bagian">I. DATA PRA-PENDAFTARAN</h3>
      <dl className="pra-kertas-data">
        {isian.map(s => (
          <div key={s.label} className={s.penuh ? 'pra-penuh' : undefined}>
            <dt>{s.label}</dt>
            <dd>{s.nilai}</dd>
          </div>
        ))}
      </dl>

      <h3 className="pra-kertas-bagian">II. DOKUMEN YANG WAJIB DIBAWA</h3>
      <ol className="pra-kertas-dokumen">
        {data.persyaratan.map((s, i) => (
          <li key={`${s.nama}-${i}`}>
            <span className="pra-kertas-dokumen-no">{String(i + 1).padStart(2, '0')}</span>
            <span className="pra-kertas-dokumen-nama">
              {s.nama}
              {catatanBawa(s) && <span className="pra-kertas-dokumen-desk">{catatanBawa(s)}</span>}
            </span>
            {!s.wajib ? <span className="pra-tag">BILA ADA</span> : <span />}
          </li>
        ))}
      </ol>

      <div className="pra-kertas-petunjuk">
        <p>PETUNJUK KEDATANGAN</p>
        <ul>
          {butirPetunjuk(data.batasKedatangan).map(b => <li key={b}>{b}</li>)}
        </ul>
      </div>

      <p className="pra-kertas-kaki">Dokumen ini dibuat otomatis oleh sistem SPMB Citra Negara.</p>
    </article>
  )
}
