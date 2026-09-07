'use client';

import { ArrowRight, HelpCircle } from 'lucide-react';
import { TopHeader } from '@/components/admin/TopHeader';
import { useAdmin } from '@/components/admin/AdminProvider';
import { LABEL_ROLE, DESKRIPSI_ROLE, MATRIX, ROLE_ADMIN_LIST, type Resource } from '@/lib/permissions';
import { STATUS_PENDAFTARAN, STATUS_PEMBAYARAN } from '@/lib/labels';
import { StatusBadge } from '@/components/admin/ui';

// ============================================================================
// BANTUAN — halaman rujukan untuk staf administrasi.
//
// Isinya menjawab pertanyaan yang paling sering muncul di sistem seperti ini:
// "kenapa tombolnya tidak ada?", "bedanya harga dan tagihan apa?", dan
// "status ini artinya apa?". Matrix perannya dibaca LANGSUNG dari
// lib/permissions.ts, jadi tidak akan pernah basi terhadap aturan sebenarnya.
// ============================================================================

const RANTAI = [
  { istilah: 'Harga', arti: 'Konfigurasi biaya pendidikan per jenjang, jurusan, dan kelas. Ini aturan, belum menempel ke siapa pun.' },
  { istilah: 'Diskon', arti: 'Konfigurasi potongan biaya. Sama seperti Harga: masih berupa daftar pilihan.' },
  { istilah: 'Tagihan', arti: 'Jumlah yang harus dibayar SATU pendaftar, hasil Harga dikurangi Diskon.' },
  { istilah: 'Pembayaran', arti: 'Uang yang benar-benar disetorkan pendaftar, bisa dicicil.' },
  { istilah: 'Transaksi', arti: 'Riwayat setiap pembayaran, pengembalian, dan alokasi.' },
];

const RESOURCE_LABEL: Partial<Record<Resource, string>> = {
  dashboard: 'Dashboard',
  pendaftar: 'Pendaftar',
  verifikasi: 'Verifikasi',
  status: 'Status SPMB',
  tahun_ajaran: 'Tahun Ajaran',
  jadwal: 'Jadwal SPMB',
  persyaratan: 'Persyaratan',
  harga: 'Harga',
  diskon: 'Diskon',
  tagihan: 'Tagihan',
  pembayaran: 'Pembayaran',
  transaksi: 'Transaksi',
  laporan_pendaftaran: 'Laporan Pendaftaran',
  laporan_keuangan: 'Laporan Keuangan',
  pengguna: 'Pengguna Admin',
  pengaturan: 'Pengaturan',
};

const AKSI_SINGKAT: Record<string, string> = {
  read: 'Lihat', create: 'Tambah', update: 'Ubah', delete: 'Hapus', export: 'Export',
};

function Kartu({ judul, anak }: { judul: string; anak: React.ReactNode }) {
  return (
    <section className="adm-card" style={{ marginBottom: 18 }}>
      <div className="adm-card-head"><div className="adm-card-title">{judul}</div></div>
      <div style={{ padding: '16px 20px' }}>{anak}</div>
    </section>
  );
}

export default function BantuanPage() {
  const { role } = useAdmin();

  return (
    <>
      <TopHeader
        judul="Bantuan"
        subjudul="Panduan singkat penggunaan panel SPMB Admin."
        remah={[{ label: 'Bantuan' }]}
      />

      <div className="adm-content" style={{ maxWidth: 940 }}>
        <Kartu
          judul="Alur kerja SPMB"
          anak={
            <>
              <p style={{ fontSize: 13.5, color: 'var(--adm-text-muted)', marginBottom: 14 }}>
                Setiap kali masuk, Anda memilih jenjang terlebih dahulu. Seluruh menu setelahnya
                otomatis menampilkan data jenjang tersebut pada tahun ajaran yang sedang aktif.
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', fontSize: 13 }}>
                {['Login', 'Pilih Jenjang', 'Dashboard Jenjang', 'Modul Operasional'].map((s, i, a) => (
                  <span key={s} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span
                      style={{
                        padding: '6px 12px', background: 'var(--adm-primary-weak)',
                        color: 'var(--adm-primary)', borderRadius: 'var(--adm-r-sm)', fontWeight: 600,
                      }}
                    >
                      {s}
                    </span>
                    {i < a.length - 1 && <ArrowRight size={14} color="var(--adm-text-faint)" />}
                  </span>
                ))}
              </div>
            </>
          }
        />

        <Kartu
          judul="Harga, Tagihan, dan Pembayaran itu berbeda"
          anak={
            <>
              <p style={{ fontSize: 13.5, color: 'var(--adm-text-muted)', marginBottom: 14 }}>
                Lima istilah ini sering tertukar. Urutannya selalu dari aturan menuju uang yang nyata:
              </p>
              <div style={{ display: 'grid', gap: 10 }}>
                {RANTAI.map((r, i) => (
                  <div
                    key={r.istilah}
                    style={{
                      display: 'flex', gap: 12, padding: '11px 14px',
                      background: 'var(--adm-surface-alt)', border: '1px solid var(--adm-border)',
                      borderRadius: 'var(--adm-r-md)',
                    }}
                  >
                    <span
                      style={{
                        width: 22, height: 22, borderRadius: 999, flexShrink: 0,
                        background: 'var(--adm-primary)', color: 'var(--adm-text-invert)', fontSize: 11,
                        fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}
                    >
                      {i + 1}
                    </span>
                    <div>
                      <div style={{ fontWeight: 650, fontSize: 13.5 }}>{r.istilah}</div>
                      <div style={{ fontSize: 12.5, color: 'var(--adm-text-muted)', marginTop: 2 }}>{r.arti}</div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="adm-banner adm-banner--info" style={{ marginTop: 14 }}>
                <div>
                  Contoh: Harga Rp1.000.000 − Diskon Rp100.000 = <strong>Tagihan Rp900.000</strong>.
                  Bila pendaftar baru menyetor Rp500.000, maka Pembayaran = Rp500.000, sisa Rp400.000,
                  status <strong>Belum Lunas</strong>.
                </div>
              </div>
            </>
          }
        />

        <Kartu
          judul="Status Pendaftaran ≠ Status Pembayaran"
          anak={
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 18 }}>
              <div>
                <div className="adm-label">Status Pendaftaran</div>
                <div style={{ display: 'grid', gap: 7 }}>
                  {Object.entries(STATUS_PENDAFTARAN).map(([k, v]) => (
                    <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <StatusBadge teks={v.teks} nada={v.nada} />
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <div className="adm-label">Status Pembayaran</div>
                <div style={{ display: 'grid', gap: 7 }}>
                  {Object.entries(STATUS_PEMBAYARAN).map(([k, v]) => (
                    <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <StatusBadge teks={v.teks} nada={v.nada} />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          }
        />

        <Kartu
          judul="Kenapa sebuah menu atau tombol tidak muncul?"
          anak={
            <>
              <p style={{ fontSize: 13.5, color: 'var(--adm-text-muted)', marginBottom: 14 }}>
                Panel ini menyembunyikan tindakan yang memang bukan wewenang peran Anda, supaya Anda
                tidak menekan tombol yang pasti ditolak. Peran Anda sekarang:{' '}
                <strong>{LABEL_ROLE[role]}</strong> — {DESKRIPSI_ROLE[role]}
              </p>
              <div className="adm-table-wrap">
                <table className="adm-table">
                  <thead>
                    <tr>
                      <th>Modul</th>
                      {ROLE_ADMIN_LIST.map(r => (
                        <th key={r} style={{ background: r === role ? 'var(--adm-primary-weak)' : undefined }}>
                          {LABEL_ROLE[r]}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {(Object.keys(RESOURCE_LABEL) as Resource[]).map(res => (
                      <tr key={res}>
                        <td style={{ fontWeight: 550 }}>{RESOURCE_LABEL[res]}</td>
                        {ROLE_ADMIN_LIST.map(r => {
                          const aksi = MATRIX[r]?.[res] ?? [];
                          return (
                            <td key={r} style={{ background: r === role ? 'var(--adm-primary-weak)' : undefined, fontSize: 12 }}>
                              {aksi.length === 0
                                ? <span style={{ color: 'var(--adm-text-faint)' }}>Tidak ada akses</span>
                                : aksi.map(a => AKSI_SINGKAT[a]).join(', ')}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p style={{ fontSize: 12, color: 'var(--adm-text-muted)', marginTop: 12 }}>
                Tabel ini dibaca langsung dari aturan yang berlaku di server, bukan salinan manual —
                jadi selalu sama dengan yang benar-benar ditegakkan sistem.
              </p>
            </>
          }
        />

        <Kartu
          judul="Pertanyaan yang sering muncul"
          anak={
            <div style={{ display: 'grid', gap: 14 }}>
              {[
                {
                  t: 'Angka di Dashboard berbeda dengan halaman Pendaftar?',
                  j: 'Tidak akan berbeda. Keduanya memakai satu sumber query yang sama. Kalau tampak berbeda, periksa apakah tahun ajaran atau jenjang yang sedang dibuka sudah sama.',
                },
                {
                  t: 'Kenapa pendaftar yang baru mengisi formulir belum muncul?',
                  j: 'Calon siswa yang masih menyimpan draf sendiri belum terhitung sebagai pendaftar. Mereka muncul setelah menekan "Kirim Formulir". Draf yang dibuat admin lewat Tambah Offline tetap langsung terlihat.',
                },
                {
                  t: 'Saya mengubah harga, kenapa tagihan pendaftar lama tidak berubah?',
                  j: 'Disengaja. Tagihan dikunci saat pendaftar melakukan pembayaran pertama, supaya nominal yang sudah disepakati tidak berubah diam-diam. Gunakan Hitung Ulang di halaman detail pendaftar bila memang perlu diperbarui.',
                },
                {
                  t: 'Apa efek mengganti Tahun Ajaran aktif?',
                  j: 'Seluruh modul — pendaftar, harga, diskon, jadwal, laporan, keuangan — otomatis berpindah konteks ke tahun ajaran tersebut. Hanya Super Admin yang dapat mengaktifkan tahun ajaran.',
                },
                {
                  t: 'Saya melihat data keuangan tapi tombolnya hilang.',
                  j: 'Itu Mode Tampilan. Front Office memang boleh melihat dan mengekspor data keuangan, tetapi pencatatan dan verifikasi pembayaran adalah wewenang Admin Keuangan.',
                },
              ].map(f => (
                <div key={f.t}>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                    <HelpCircle size={15} color="var(--adm-primary)" style={{ flexShrink: 0, marginTop: 2 }} />
                    <div>
                      <div style={{ fontWeight: 650, fontSize: 13.5 }}>{f.t}</div>
                      <div style={{ fontSize: 13, color: 'var(--adm-text-muted)', marginTop: 3, lineHeight: 1.55 }}>{f.j}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          }
        />
      </div>
    </>
  );
}
