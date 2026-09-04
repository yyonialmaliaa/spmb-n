'use client';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Printer } from 'lucide-react';
import { formatRupiah, YAYASAN_INFO, JENJANG_LABEL, Jenjang } from '@/lib/biaya';

function getRegNo(id: string, date: string) {
  const d = new Date(date);
  return `REG-${d.getFullYear()}-${id.slice(0, 5).toUpperCase()}`;
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
};

type Pendaftar = {
  id: string; namaLengkap: string | null; jenisKelamin: string | null;
  asalSMP?: string; asalSekolah?: string; alamat: string | null;
  gelombang?: string; jenjang?: string; jurusan: string | null; kelas?: string;
  noPribadi?: string; totalTagihan?: number; createdAt: string;
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
  const lunas = data.pembayaranList.filter(c => c.status === 'lunas').sort((a, b) => a.angsuranKe - b.angsuranKe);
  const totalDibayar = lunas.reduce((s, c) => s + c.nominal, 0);
  const sisaBayar = Math.max(totalTagihan - totalDibayar, 0);
  const tanggalTerakhir = lunas.length > 0 ? lunas[lunas.length - 1].tanggalBayar : data.createdAt;

  return (
    <div style={{ background: 'var(--adm-neutral-weak)', minHeight: '100vh', padding: '32px 16px' }}>
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; }
          .kwitansi-sheet { box-shadow: none !important; margin: 0 !important; }
        }
      `}</style>

      <div className="no-print" style={{ maxWidth: 700, margin: '0 auto 16px', display: 'flex', justifyContent: 'flex-end' }}>
        <button onClick={() => window.print()} style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--adm-primary)', color: 'var(--adm-text-invert)', border: 'none', borderRadius: 8, padding: '10px 20px', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
          <Printer size={16} /> Cetak / Simpan PDF
        </button>
      </div>

      <div className="kwitansi-sheet" style={{ maxWidth: 700, margin: '0 auto', background: 'var(--adm-surface)', padding: 40, boxShadow: '0 1px 6px rgba(0,0,0,0.1)', fontFamily: 'Georgia, serif', color: '#111' }}>
        {/* Kop Surat — logo & teks dipusatkan sebagai satu grup, jaraknya
            rapat (bukan logo mepet kiri lalu teks memenuhi sisa ruang). */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, borderBottom: '2px solid #111', paddingBottom: 12, marginBottom: 16 }}>
          <img src="/images/logo-yayasan.png" alt="Logo Yayasan" style={{ width: 62, height: 62, objectFit: 'contain', flexShrink: 0 }} />
          <div style={{ textAlign: 'left' }}>
            <div style={{ fontSize: 16, fontWeight: 700, letterSpacing: 0.5 }}>{YAYASAN_INFO.nama}</div>
            <div style={{ fontSize: 11, marginTop: 2 }}>{YAYASAN_INFO.alamat}</div>
            <div style={{ fontSize: 11 }}>Email: {YAYASAN_INFO.email} &nbsp;Telp: {YAYASAN_INFO.telp}</div>
          </div>
        </div>

        <h2 style={{ textAlign: 'center', fontSize: 16, textDecoration: 'underline', fontWeight: 700, marginBottom: 18 }}>KWITANSI PEMBAYARAN</h2>

        {/* Data pendaftar */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 24px', fontSize: 12.5, marginBottom: 18 }}>
          <div>No.Pendaftaran &nbsp;: {getRegNo(data.id, data.createdAt)}</div>
          <div>Gelombang &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;: {data.gelombang || '-'}</div>
          <div>Nama &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;: {data.namaLengkap}</div>
          <div>Jenjang &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;: {JENJANG_LABEL[jenjang]}{data.kelas ? ` - ${data.kelas}` : ''}</div>
          <div>Jenis Kelamin &nbsp;: {data.jenisKelamin}</div>
          {/* Jurusan cukup singkatannya saja (mis. "MPLB") — nama lengkapnya
              kepanjangan dan bikin kolom ini pecah jadi 2 baris. */}
          <div>Jurusan &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;: {jenjang === 'smk' ? jurusanSingkat(data.jurusan) : '-'}</div>
          <div>Asal Sekolah &nbsp;: {data.asalSMP || data.asalSekolah || '-'}</div>
          <div>No.Hp &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;: {data.noPribadi || '-'}</div>
          <div style={{ gridColumn: '1 / -1' }}>Alamat &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;: {data.alamat}</div>
        </div>

        {/* Data Pembayaran — semua cicilan yang sudah terverifikasi/lunas */}
        <div style={{ fontSize: 12.5, fontWeight: 700, marginBottom: 8 }}>Data Pembayaran</div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, marginBottom: 4 }}>
          <thead>
            <tr>
              {['Tipe Bayar', 'Tanggal', 'Angsuran Ke-', 'Nominal Bayar'].map(h => (
                <th key={h} style={{ border: '1px solid #999', padding: '6px 8px', background: 'var(--adm-neutral-weak)', fontWeight: 700 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {lunas.length === 0 ? (
              <tr><td colSpan={4} style={{ border: '1px solid #999', padding: '10px 8px', textAlign: 'center', color: 'var(--adm-text-faint)' }}>Belum ada pembayaran terverifikasi</td></tr>
            ) : (
              lunas.map(c => (
                <tr key={c.id}>
                  <td style={{ border: '1px solid #999', padding: '6px 8px' }}>{c.metodePembayaran === 'online' ? 'Transfer' : 'Tunai'}</td>
                  <td style={{ border: '1px solid #999', padding: '6px 8px' }}>{new Date(c.tanggalBayar).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                  <td style={{ border: '1px solid #999', padding: '6px 8px', textAlign: 'center' }}>{c.angsuranKe}</td>
                  <td style={{ border: '1px solid #999', padding: '6px 8px', textAlign: 'right' }}>{formatRupiah(c.nominal).replace('Rp', '')}</td>
                </tr>
              ))
            )}
            <tr>
              <td colSpan={3} style={{ border: '1px solid #999', padding: '6px 8px', textAlign: 'left', fontWeight: 700 }}>Terbilang: {terbilang(totalDibayar)}</td>
              <td style={{ border: '1px solid #999', padding: '6px 8px', textAlign: 'right', fontWeight: 700 }}>{formatRupiah(totalDibayar).replace('Rp', '')}</td>
            </tr>
            <tr>
              <td colSpan={3} style={{ border: '1px solid #999', padding: '6px 8px', textAlign: 'right' }}>Total Wajib Bayar</td>
              <td style={{ border: '1px solid #999', padding: '6px 8px', textAlign: 'right' }}>{formatRupiah(totalTagihan).replace('Rp', '')}</td>
            </tr>
            <tr>
              <td colSpan={3} style={{ border: '1px solid #999', padding: '6px 8px', textAlign: 'right' }}>Sisa Bayar</td>
              <td style={{ border: '1px solid #999', padding: '6px 8px', textAlign: 'right' }}>{formatRupiah(sisaBayar).replace('Rp', '')}</td>
            </tr>
          </tbody>
        </table>

        {/* Tanda tangan */}
        <div style={{ marginTop: 40, display: 'flex', justifyContent: 'flex-end' }}>
          <div style={{ textAlign: 'center', fontSize: 12.5 }}>
            <div>{YAYASAN_INFO.kota}, {new Date(tanggalTerakhir).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}.</div>
            <div>Diterima Oleh</div>
            <div style={{ height: 60 }} />
            <div style={{ borderTop: '1px solid #111', paddingTop: 4, minWidth: 160 }}>Admin SPMB</div>
          </div>
        </div>
      </div>
    </div>
  );
}
