'use client';
import { useState, useEffect, Fragment } from 'react';
import { useParams } from 'next/navigation';
import { Printer } from 'lucide-react';
import { formatRupiah, YAYASAN_INFO, JENJANG_LABEL, Jenjang } from '@/lib/biaya';
import TeksKode from '@/components/TeksKode';

// Format resmi "SPMB/0001/SMP/2026-2027/A7K9" (lihat lib/nomorPendaftaran.ts)
// dibuat SEKALI saat formulir dikirim dan disimpan di noPendaftaran — jadi
// di sini cukup ditampilkan apa adanya. Baris lawas dari sebelum kolom itu
// ada belum punya nomor resmi; REG-YYYY-XXXXX di bawah murni jaring pengaman
// supaya kwitansinya tetap tercetak, bukan format baru.
function getRegNo(data: Pendaftar) {
  if (data.noPendaftaran) return data.noPendaftaran;
  const d = new Date(data.createdAt);
  return `REG-${d.getFullYear()}-${data.id.slice(0, 5).toUpperCase()}`;
}

// Nama jurusan SMK disimpan lengkap dengan singkatannya di belakang, mis.
// "Manajemen Perkantoran dan Layanan Bisnis (MPLB)" — ambil singkatannya
// saja (isi dalam kurung) supaya muat satu baris di kolom kwitansi yang sempit.
function jurusanSingkat(jurusan: string | null | undefined): string {
  if (!jurusan) return '-';
  const m = jurusan.match(/\(([^)]+)\)\s*$/);
  return m ? m[1] : jurusan;
}

// ---------------------------------------------------------------------
// Terbilang — mengeja nominal rupiah jadi kata-kata Bahasa Indonesia
// (bukan menuliskan ulang angkanya). Algoritma pengelompokan
// ribu/juta/miliar/triliun secara rekursif.
// ---------------------------------------------------------------------
const SATUAN = ['', 'satu', 'dua', 'tiga', 'empat', 'lima', 'enam', 'tujuh', 'delapan', 'sembilan', 'sepuluh', 'sebelas'];

function angkaKeKata(n: number): string {
  if (n < 12) return SATUAN[n];
  if (n < 20) return angkaKeKata(n - 10) + ' belas';
  if (n < 100) {
    const sisa = n % 10;
    return angkaKeKata(Math.floor(n / 10)) + ' puluh' + (sisa !== 0 ? ' ' + angkaKeKata(sisa) : '');
  }
  if (n < 200) {
    const sisa = n % 100;
    return 'seratus' + (sisa !== 0 ? ' ' + angkaKeKata(sisa) : '');
  }
  if (n < 1000) {
    const sisa = n % 100;
    return angkaKeKata(Math.floor(n / 100)) + ' ratus' + (sisa !== 0 ? ' ' + angkaKeKata(sisa) : '');
  }
  if (n < 2000) {
    const sisa = n % 1000;
    return 'seribu' + (sisa !== 0 ? ' ' + angkaKeKata(sisa) : '');
  }
  if (n < 1_000_000) {
    const sisa = n % 1000;
    return angkaKeKata(Math.floor(n / 1000)) + ' ribu' + (sisa !== 0 ? ' ' + angkaKeKata(sisa) : '');
  }
  if (n < 1_000_000_000) {
    const sisa = n % 1_000_000;
    return angkaKeKata(Math.floor(n / 1_000_000)) + ' juta' + (sisa !== 0 ? ' ' + angkaKeKata(sisa) : '');
  }
  if (n < 1_000_000_000_000) {
    const sisa = n % 1_000_000_000;
    return angkaKeKata(Math.floor(n / 1_000_000_000)) + ' miliar' + (sisa !== 0 ? ' ' + angkaKeKata(sisa) : '');
  }
  const sisa = n % 1_000_000_000_000;
  return angkaKeKata(Math.floor(n / 1_000_000_000_000)) + ' triliun' + (sisa !== 0 ? ' ' + angkaKeKata(sisa) : '');
}

function terbilang(n: number): string {
  const bulat = Math.max(Math.round(n), 0);
  if (bulat === 0) return 'Nol Rupiah';
  const kata = angkaKeKata(bulat).replace(/\s+/g, ' ').trim();
  const kapital = kata.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  return kapital + ' Rupiah';
}

type Cicilan = {
  id: string; angsuranKe: number; nominal: number;
  metodePembayaran: string; status: string; tanggalBayar: string;
  jenis?: string;
};

type Pendaftar = {
  id: string; namaLengkap: string | null; jenisKelamin: string | null;
  asalSMP?: string; asalSekolah?: string; alamat: string | null;
  gelombang?: string; jenjang?: string; jurusan: string | null; kelas?: string;
  noPribadi?: string; totalTagihan?: number; createdAt: string;
  noPendaftaran?: string | null;
  tahunAjaran?: { nama: string } | null;
  pembayaranList: Cicilan[];
};

export default function KwitansiPage() {
  const params = useParams();
  const id = (Array.isArray(params.id) ? params.id[0] : params.id) as string;
  const [data, setData] = useState<Pendaftar | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    fetch(`/api/admin/pendaftar/${id}`).then(r => r.json()).then(d => {
      setData(d.data || null);
      setLoading(false);
    });
  }, [id]);

  if (loading) return <div style={{ padding: 40, textAlign: 'center', color: 'var(--adm-text-faint)' }}>Memuat...</div>;
  if (!data) return <div style={{ padding: 40, textAlign: 'center', color: 'var(--adm-text-faint)' }}>Data tidak ditemukan</div>;

  const jenjang = (data.jenjang || 'smk') as Jenjang;
  const totalTagihan = data.totalTagihan || 0;
  // Kwitansi adalah BUKTI PEMBAYARAN — hanya transaksi jenis "bayar" yang
  // muncul di sini. Sebelumnya filter ini tidak memeriksa `jenis` sama
  // sekali, jadi refund & alokasi (yang statusnya juga "lunas") ikut
  // tercantum sebagai baris pembayaran DAN ikut DIJUMLAHKAN ke Total
  // Dibayar — padahal refund seharusnya MENGURANGI, bukan menambah, dan
  // alokasi bukan transaksi bayar sama sekali.
  const lunas = data.pembayaranList
    .filter(c => c.status === 'lunas' && (c.jenis || 'bayar') === 'bayar')
    .sort((a, b) => a.angsuranKe - b.angsuranKe);
  const totalDibayar = lunas.reduce((s, c) => s + c.nominal, 0);
  const sisaBayar = Math.max(totalTagihan - totalDibayar, 0);
  const tanggalTerakhir = lunas.length > 0 ? lunas[lunas.length - 1].tanggalBayar : data.createdAt;

  // Baris pembayaran makin banyak (cicilan panjang) makin tinggi tabelnya —
  // supaya kwitansi TIDAK PERNAH meluber dari satu halaman A5 berapa pun
  // banyaknya cicilan, kepadatan tabel menyesuaikan jumlah barisnya sendiri.
  // Di layar/cetak yang normal (<=5 baris) ukurannya tetap seperti biasa.
  const banyakBaris = lunas.length > 5;
  const padSelAdaptif = banyakBaris ? '2px 5px' : undefined;
  const fsTabelAdaptif = banyakBaris ? '9px' : undefined;

  // Baris "label : nilai" — DUA per baris berdampingan. Grid 6 kolom
  // (label-kolon-nilai, dua kali) membuat browser sendiri yang menghitung
  // lebar kolom label & kolon dari isi TERLEBARnya, jadi kolonnya otomatis
  // sejajar di semua baris. No.Pendaftaran & Tahun Ajaran ditulis LANGSUNG
  // di JSX (bukan lewat array ini) karena keduanya butuh tata letak khusus
  // di grid yang sama — lihat komentar di tempat grid dirender.
  const BARIS: [string, React.ReactNode, string, React.ReactNode][] = [
    ['Nama', data.namaLengkap, 'Gelombang', data.gelombang || '-'],
    ['Jenis Kelamin', data.jenisKelamin, 'Jenjang', `${JENJANG_LABEL[jenjang]}${data.kelas ? ` - ${data.kelas}` : ''}`],
    ['Asal Sekolah', data.asalSMP || data.asalSekolah || '-',
      // Jurusan cukup singkatannya saja (mis. "MPLB") — nama lengkapnya
      // kepanjangan dan bikin kolom ini pecah jadi 2 baris.
      'Jurusan', jenjang === 'smk' ? jurusanSingkat(data.jurusan) : '-'],
    ['Alamat', data.alamat, 'No.Hp', data.noPribadi || '-'],
  ];

  return (
    <div className="kwitansi-halaman" style={{ background: 'var(--adm-neutral-weak)', minHeight: '100vh', padding: '32px 16px' }}>
      <style>{`
        /* Setiap ukuran teks/jarak di kwitansi ini SENGAJA lewat variabel CSS
           (bukan angka literal langsung), supaya versi CETAK bisa benar-benar
           mengecil bersamaan (font, jarak, ukuran logo) sesuai lebar kertas
           A5 yang jauh lebih sempit dari tampilan layar. Sebelumnya cetak
           cuma menimpa font-size di elemen PEMBUNGKUS — tidak berpengaruh
           sama sekali karena tiap anak sudah punya ukurannya sendiri secara
           inline (selalu menang atas warisan dari induk) — hasilnya di
           kertas fisik teksnya tetap sebesar di layar tapi dipaksa masuk
           kertas yang jauh lebih sempit: itulah yang terlihat "numpuk"/
           berantakan dan berisiko meluber dari satu halaman.
        */
        .kwitansi-sheet {
          --kw-fs-yayasan: 16px;
          --kw-fs-alamat: 11px;
          --kw-fs-judul: 16px;
          --kw-fs-data: 12.5px;
          --kw-fs-label-bayar: 12.5px;
          --kw-fs-tabel: 12px;
          --kw-fs-ttd: 12.5px;
          --kw-logo: 62px;
          --kw-gap-kop: 12px;
          --kw-pad-kop-b: 12px;
          --kw-mb-kop: 16px;
          --kw-mb-judul: 18px;
          --kw-mb-data: 18px;
          --kw-gap-data-col: 4px;
          --kw-gap-data-row: 4px;
          --kw-pad-label: 3px;
          --kw-pad-val: 2px;
          --kw-mb-label-bayar: 8px;
          --kw-pad-sel: 6px 8px;
          --kw-mt-ttd: 40px;
          --kw-h-ttd-kosong: 60px;
        }
        @media print {
          /* size + margin:0 sengaja SATU PAKET: margin nol membuat Chrome/Edge
             tidak sempat melukis header/footer bawaannya sendiri (judul tab,
             URL, tanggal, nomor halaman) sama sekali -- ruangnya memang tidak
             ada. Jarak ke tepi kertas lalu diambil alih penuh oleh padding
             .kwitansi-sheet sendiri di bawah, bukan oleh margin halaman. */
          @page { size: A5 portrait; margin: 0; }
          .no-print { display: none !important; }
          html, body { background: white !important; margin: 0 !important; }
          /* Pembungkus di luar kertas (.adm-root dari layout admin & latar abu
             halaman ini) setinggi 100vh + padding di layar. Saat cetak 100vh =
             tinggi A5, jadi ditambah padding totalnya melebihi satu halaman
             (keluar halaman kedua kosong) dan kertasnya tergeser ke kanan-bawah
             sejauh padding itu. Di kertas keduanya harus lenyap total. */
          .adm-root, .kwitansi-halaman {
            min-height: 0 !important;
            padding: 0 !important;
            background: none !important;
          }
          .kwitansi-sheet {
            box-shadow: none !important;
            margin: 0 !important;
            width: 148mm;
            max-width: none !important;
            padding: 9mm 8mm !important;
            /* Diciutkan proporsional (bukan cuma font, tapi jarak & logo
               ikut) supaya kertas A5 terisi rapi -- tidak kosong melompong,
               tapi juga tidak berdesakan -- dan pasti muat SATU halaman.
               Body teks 11px (di bawah 12px) -- cukup terbaca, cukup kecil
               untuk menampung banyak cicilan tanpa meluber; jarak antar
               bagian dirapatkan (bukan lebar-lebar) supaya isi kertas A5
               terasa padat-rapi, bukan renggang. */
            --kw-fs-yayasan: 13px;
            --kw-fs-alamat: 9px;
            --kw-fs-judul: 13px;
            --kw-fs-data: 11px;
            --kw-fs-label-bayar: 11px;
            --kw-fs-tabel: 10.5px;
            --kw-fs-ttd: 11px;
            --kw-logo: 38px;
            --kw-gap-kop: 6px;
            --kw-pad-kop-b: 6px;
            --kw-mb-kop: 8px;
            --kw-mb-judul: 8px;
            --kw-mb-data: 8px;
            --kw-gap-data-col: 2px;
            --kw-gap-data-row: 1.5px;
            --kw-pad-label: 2px;
            --kw-pad-val: 1px;
            --kw-mb-label-bayar: 4px;
            --kw-pad-sel: 2.5px 5px;
            /* Pengecualian dari "dirapatkan": ruang kosong tanda tangan
               harus cukup tinggi untuk benar-benar ditandatangani di kertas
               (60px ~ 16mm). */
            --kw-mt-ttd: 16px;
            --kw-h-ttd-kosong: 60px;
          }
        }
      `}</style>

      <div className="no-print" style={{ maxWidth: 700, margin: '0 auto 16px', display: 'flex', justifyContent: 'flex-end' }}>
        <button onClick={() => window.print()} style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--adm-primary)', color: 'var(--adm-text-invert)', border: 'none', borderRadius: 8, padding: '10px 20px', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
          <Printer size={16} /> Cetak / Simpan PDF
        </button>
      </div>

      <div className="kwitansi-sheet" style={{ maxWidth: 700, margin: '0 auto', background: 'var(--adm-surface)', padding: 40, boxShadow: '0 1px 6px rgba(0,0,0,0.1)', fontFamily: 'Georgia, serif', color: '#111' }}>
        {/* Kop Surat — logo di KIRI, dirapatkan ke tulisan (bukan dipisah ke
            ujung baris): keduanya dibungkus jadi satu kelompok yang rata
            tengah bersama, jaraknya cuma --kw-gap-kop. */}
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 'var(--kw-gap-kop)', borderBottom: '2px solid #111', paddingBottom: 'var(--kw-pad-kop-b)', marginBottom: 'var(--kw-mb-kop)' }}>
          <img src="/images/logo-yayasan.png" alt="Logo Yayasan" style={{ width: 'var(--kw-logo)', height: 'var(--kw-logo)', objectFit: 'contain', flexShrink: 0 }} />
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 'var(--kw-fs-yayasan)', fontWeight: 700, letterSpacing: 0.5 }}>{YAYASAN_INFO.nama}</div>
            <div style={{ fontSize: 'var(--kw-fs-alamat)', marginTop: 2 }}>{YAYASAN_INFO.alamat}</div>
            <div style={{ fontSize: 'var(--kw-fs-alamat)' }}>Email: {YAYASAN_INFO.email} &nbsp;Telp: {YAYASAN_INFO.telp}</div>
          </div>
        </div>

        <h2 style={{ textAlign: 'center', fontSize: 'var(--kw-fs-judul)', textDecoration: 'underline', fontWeight: 700, marginBottom: 'var(--kw-mb-judul)' }}>KWITANSI PEMBAYARAN</h2>

        {/* Data pendaftar — SATU grid untuk semuanya (termasuk No.Pendaftaran
            & Tahun Ajaran) supaya label & titik duanya benar-benar sejajar
            dengan baris lain, bukan tata letak terpisah yang cuma mirip.
            No.Pendaftaran & Tahun Ajaran satu baris berdampingan sama
            seperti pasangan label lain (Nama/Gelombang, dst) — bukan baris
            sendiri — supaya keduanya sejajar horizontal. Nilai No.Pendaftaran
            SENGAJA tidak dipaksa nowrap: kalau kepanjangan (mis. nama tahun
            ajaran custom yang tidak biasa), dia boleh turun ke baris kedua
            di dalam kolomnya sendiri (overflowWrap) daripada meluber keluar
            kertas. Kolom nilai KIRI dibuat sedikit lebih lebar (1.3fr vs 1fr)
            drpd kolom nilai KANAN karena isinya (No.Pendaftaran) biasanya
            lebih panjang dari isi kolom kanan (Gelombang/Jenjang/dst) — tanpa
            ini, di mode CETAK (font & padding lebih kecil) nomor pendaftaran
            yg panjangnya wajar pun masih terpaksa turun baris walau di layar
            sudah muat satu baris. */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'max-content max-content minmax(0, 1.3fr) max-content max-content minmax(0, 1fr)',
            columnGap: 'var(--kw-gap-data-col)',
            rowGap: 'var(--kw-gap-data-row)',
            fontSize: 'var(--kw-fs-data)',
            marginBottom: 'var(--kw-mb-data)',
          }}
        >
          <span style={{ whiteSpace: 'nowrap', paddingRight: 'var(--kw-pad-label)' }}>No.Pendaftaran</span>
          <span>:</span>
          <span style={{ paddingRight: 'var(--kw-pad-val)', overflowWrap: 'anywhere' }}><TeksKode teks={getRegNo(data)} /></span>
          <span style={{ whiteSpace: 'nowrap', paddingRight: 'var(--kw-pad-label)' }}>Tahun Ajaran</span>
          <span>:</span>
          <span>{data.tahunAjaran?.nama || '-'}</span>

          {BARIS.map(([labelKiri, nilaiKiri, labelKanan, nilaiKanan], i) => (
            <Fragment key={i}>
              <span style={{ whiteSpace: 'nowrap', paddingRight: 'var(--kw-pad-label)' }}>{labelKiri}</span>
              <span>:</span>
              <span style={{ paddingRight: 'var(--kw-pad-val)' }}>{nilaiKiri}</span>
              <span style={{ whiteSpace: 'nowrap', paddingRight: 'var(--kw-pad-label)' }}>{labelKanan}</span>
              <span>:</span>
              <span>{nilaiKanan}</span>
            </Fragment>
          ))}
        </div>

        {/* Data Pembayaran — semua cicilan yang sudah terverifikasi/lunas */}
        <div style={{ fontSize: 'var(--kw-fs-label-bayar)', fontWeight: 700, marginBottom: 'var(--kw-mb-label-bayar)' }}>Data Pembayaran</div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: fsTabelAdaptif || 'var(--kw-fs-tabel)', marginBottom: 4 }}>
          <thead>
            <tr>
              {['Tipe Bayar', 'Tanggal', 'Angsuran Ke-', 'Nominal Bayar'].map(h => (
                <th key={h} style={{ border: '1px solid #999', padding: padSelAdaptif || 'var(--kw-pad-sel)', background: 'var(--adm-neutral-weak)', fontWeight: 700 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {lunas.length === 0 ? (
              <tr><td colSpan={4} style={{ border: '1px solid #999', padding: padSelAdaptif || 'var(--kw-pad-sel)', textAlign: 'center', color: 'var(--adm-text-faint)' }}>Belum ada pembayaran terverifikasi</td></tr>
            ) : (
              lunas.map(c => (
                <tr key={c.id}>
                  <td style={{ border: '1px solid #999', padding: padSelAdaptif || 'var(--kw-pad-sel)' }}>{c.metodePembayaran === 'online' ? 'Transfer' : 'Tunai'}</td>
                  <td style={{ border: '1px solid #999', padding: padSelAdaptif || 'var(--kw-pad-sel)' }}>{new Date(c.tanggalBayar).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                  <td style={{ border: '1px solid #999', padding: padSelAdaptif || 'var(--kw-pad-sel)', textAlign: 'center' }}>{c.angsuranKe}</td>
                  <td style={{ border: '1px solid #999', padding: padSelAdaptif || 'var(--kw-pad-sel)', textAlign: 'right' }}>{formatRupiah(c.nominal).replace('Rp', '')}</td>
                </tr>
              ))
            )}
            <tr>
              <td colSpan={3} style={{ border: '1px solid #999', padding: padSelAdaptif || 'var(--kw-pad-sel)', textAlign: 'left', fontWeight: 700 }}>Terbilang: {terbilang(totalDibayar)}</td>
              <td style={{ border: '1px solid #999', padding: padSelAdaptif || 'var(--kw-pad-sel)', textAlign: 'right', fontWeight: 700 }}>{formatRupiah(totalDibayar).replace('Rp', '')}</td>
            </tr>
            <tr>
              <td colSpan={3} style={{ border: '1px solid #999', padding: padSelAdaptif || 'var(--kw-pad-sel)', textAlign: 'right' }}>Total Wajib Bayar</td>
              <td style={{ border: '1px solid #999', padding: padSelAdaptif || 'var(--kw-pad-sel)', textAlign: 'right' }}>{formatRupiah(totalTagihan).replace('Rp', '')}</td>
            </tr>
            <tr>
              <td colSpan={3} style={{ border: '1px solid #999', padding: padSelAdaptif || 'var(--kw-pad-sel)', textAlign: 'right' }}>Sisa Bayar</td>
              <td style={{ border: '1px solid #999', padding: padSelAdaptif || 'var(--kw-pad-sel)', textAlign: 'right' }}>{formatRupiah(sisaBayar).replace('Rp', '')}</td>
            </tr>
          </tbody>
        </table>

        {/* Tanda tangan */}
        <div style={{ marginTop: 'var(--kw-mt-ttd)', display: 'flex', justifyContent: 'flex-end' }}>
          <div style={{ textAlign: 'center', fontSize: 'var(--kw-fs-ttd)' }}>
            <div>{YAYASAN_INFO.kota}, {new Date(tanggalTerakhir).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}.</div>
            <div>Diterima Oleh</div>
            <div style={{ height: 'var(--kw-h-ttd-kosong)' }} />
            <div style={{ borderTop: '1px solid #111', minWidth: 160 }} />
          </div>
        </div>
      </div>
    </div>
  );
}
