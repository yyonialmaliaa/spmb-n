import { Fragment } from 'react';

// Kode panjang bergaris miring (mis. No. Pendaftaran
// "SPMB/0002/SMP/2026-2027/388H") boleh pindah baris tepat SETELAH "/",
// bukan terpotong di tengah angka. <wbr> tidak ikut tersalin saat nomor
// di-copy, jadi pencarian memakai nomor hasil salinan tetap cocok.
export default function TeksKode({ teks }: { teks: string }) {
  return (
    <>
      {teks.split('/').map((bagian, i) => (
        <Fragment key={i}>
          {i > 0 && <>/<wbr /></>}
          {bagian}
        </Fragment>
      ))}
    </>
  );
}
