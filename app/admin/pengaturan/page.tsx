'use client';

import { useCallback, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Building2, Wallet } from 'lucide-react';
import { TopHeader } from '@/components/admin/TopHeader';
import { useAdmin } from '@/components/admin/AdminProvider';
import { useMuatData, ambilJson } from '@/components/admin/useMuatData';
import {
  EmptyState, ErrorState, PermissionGate, ReadOnlyBanner, SkeletonTabel, Toast,
} from '@/components/admin/ui';
import { LABEL_ROLE } from '@/lib/permissions';
import { NAMA_INSTITUSI } from '@/lib/labels';
import { formatRupiah } from '@/lib/pembayaran-utils';

// ============================================================================
// PENGATURAN — tiga bagian:
//   Keuangan        : minimal pembayaran awal & minimal cicilan (per TA).
//                     Memakai endpoint yang SAMA dengan halaman Harga, jadi
//                     nilainya mustahil berbeda antar halaman.
//   Identitas       : data yayasan, saat ini masih konstanta di lib/biaya.ts.
//   Log Aktivitas   : jejak audit, khusus Super Admin.
// ============================================================================

interface Pengaturan {
  minimalPembayaranAwal: number;
  minimalCicilan: number;
}

interface Audit {
  id: string; ringkasan: string; actorEmail: string; actorRole: string;
  entitas: string; jenjang: string | null; createdAt: string;
}

const tglJam = (v: string) =>
  new Date(v).toLocaleString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

export default function PengaturanPage() {
  return <Suspense fallback={null}><PengaturanInner /></Suspense>;
}

function PengaturanInner() {
  const searchParams = useSearchParams();
  const { can, canAny, tahunAjaran } = useAdmin();
  const tahunAjaranId = searchParams.get('tahunAjaranId') || '';
  const qs = tahunAjaranId ? `?tahunAjaranId=${tahunAjaranId}` : '';

  const [toast, setToast] = useState<string | null>(null);
  const [menyimpan, setMenyimpan] = useState(false);
  const [form, setForm] = useState<Pengaturan | null>(null);

  const beriToast = (m: string) => { setToast(m); setTimeout(() => setToast(null), 3000); };

  const ambil = useCallback(
    async (sinyal: AbortSignal) => {
      const [pk, au] = await Promise.all([
        ambilJson<{ data: Pengaturan | null }>(`/api/admin/pengaturan-keuangan${qs}`, sinyal),
        // Log audit hanya untuk role yang boleh membacanya.
        ambilJson<{ data: Audit[] }>('/api/admin/audit?limit=30', sinyal).catch(() => ({ data: [] })),
      ]);
      return { pengaturan: pk.data, audit: au.data ?? [] };
    },
    [qs],
  );

  const { data, loading, gagal, muatUlang } = useMuatData(ambil, [qs]);
  const nilai = form ?? data?.pengaturan ?? null;

  const simpan = async () => {
    if (!nilai) return;
    setMenyimpan(true);
    try {
      const res = await fetch(`/api/admin/pengaturan-keuangan${qs}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(nilai),
      });
      const j = await res.json().catch(() => null);
      if (!res.ok) { beriToast(j?.error || 'Gagal menyimpan'); return; }
      beriToast('Pengaturan keuangan tersimpan');
      setForm(null);
      muatUlang();
    } finally { setMenyimpan(false); }
  };

  const bolehUbah = can('pengaturan_keuangan', 'update');

  return (
    <>
      <Toast pesan={toast} />
      <TopHeader
        judul="Pengaturan"
        subjudul="Konfigurasi sistem dan jejak aktivitas administrasi."
        remah={[{ label: 'Sistem' }, { label: 'Pengaturan' }]}
      />

      <div className="adm-content" style={{ maxWidth: 940 }}>
        <ReadOnlyBanner
          resource="pengaturan"
          pesan="Anda dapat melihat pengaturan sistem. Perubahannya dilakukan oleh Super Admin."
        />

        {/* ---------- Keuangan ---------- */}
        <section className="adm-card" style={{ marginBottom: 18 }}>
          <div className="adm-card-head">
            <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
              <Wallet size={16} color="var(--adm-text-muted)" />
              <div>
                <div className="adm-card-title">Pengaturan Keuangan</div>
                <div style={{ fontSize: 11.5, color: 'var(--adm-text-muted)', marginTop: 2 }}>
                  Berlaku untuk TA {tahunAjaran?.nama ?? '—'}
                </div>
              </div>
            </div>
          </div>

          {loading ? (
            <SkeletonTabel baris={2} kolom={2} />
          ) : gagal ? (
            <ErrorState onCoba={muatUlang} />
          ) : !nilai ? (
            <EmptyState judul="Belum ada pengaturan keuangan" pesan="Aktifkan tahun ajaran terlebih dahulu." />
          ) : (
            <div style={{ padding: '18px 20px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 18 }}>
                <div>
                  <label className="adm-label" htmlFor="mpa">Minimal pembayaran awal</label>
                  <input
                    id="mpa"
                    className="adm-input"
                    type="number"
                    disabled={!bolehUbah}
                    value={nilai.minimalPembayaranAwal}
                    onChange={e => setForm({ ...nilai, minimalPembayaranAwal: Number(e.target.value) || 0 })}
                  />
                  <p style={{ fontSize: 11.5, color: 'var(--adm-text-muted)', marginTop: 5 }}>
                    Setoran minimal agar pendaftar dapat mengirim formulir. Saat ini {formatRupiah(nilai.minimalPembayaranAwal)}.
                  </p>
                </div>
                <div>
                  <label className="adm-label" htmlFor="mc">Minimal cicilan</label>
                  <input
                    id="mc"
                    className="adm-input"
                    type="number"
                    disabled={!bolehUbah}
                    value={nilai.minimalCicilan}
                    onChange={e => setForm({ ...nilai, minimalCicilan: Number(e.target.value) || 0 })}
                  />
                  <p style={{ fontSize: 11.5, color: 'var(--adm-text-muted)', marginTop: 5 }}>
                    Nominal terkecil tiap angsuran berikutnya. Saat ini {formatRupiah(nilai.minimalCicilan)}.
                  </p>
                </div>
              </div>

              <PermissionGate resource="pengaturan_keuangan" action="update">
                <div style={{ marginTop: 18, display: 'flex', gap: 8 }}>
                  <button className="adm-btn adm-btn--primary" onClick={simpan} disabled={menyimpan || !form}>
                    {menyimpan ? 'Menyimpan…' : 'Simpan Perubahan'}
                  </button>
                  {form && (
                    <button className="adm-btn adm-btn--ghost" onClick={() => setForm(null)} disabled={menyimpan}>
                      Batalkan
                    </button>
                  )}
                </div>
              </PermissionGate>
            </div>
          )}
        </section>

        {/* ---------- Identitas ---------- */}
        <section className="adm-card" style={{ marginBottom: 18 }}>
          <div className="adm-card-head">
            <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
              <Building2 size={16} color="var(--adm-text-muted)" />
              <div className="adm-card-title">Identitas Sekolah</div>
            </div>
          </div>
          <div style={{ padding: '16px 20px' }}>
            <div style={{ display: 'grid', gap: 10, fontSize: 13.5 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                <span style={{ color: 'var(--adm-text-muted)' }}>Nama yayasan</span>
                <strong>Yayasan Pendidikan {NAMA_INSTITUSI}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                <span style={{ color: 'var(--adm-text-muted)' }}>Jenjang dikelola</span>
                <strong>SMP · SMA · SMK {NAMA_INSTITUSI}</strong>
              </div>
            </div>
            <p style={{ fontSize: 11.5, color: 'var(--adm-text-muted)', marginTop: 14 }}>
              Identitas ini masih tersimpan sebagai konstanta sistem. Untuk membuatnya dapat diubah dari
              panel, diperlukan tabel pengaturan tersendiri.
            </p>
          </div>
        </section>

        {/* ---------- Log aktivitas ---------- */}
        {canAny('audit') && (
          <section className="adm-card">
            <div className="adm-card-head">
              <div>
                <div className="adm-card-title">Log Aktivitas</div>
                <div style={{ fontSize: 11.5, color: 'var(--adm-text-muted)', marginTop: 2 }}>
                  Jejak perubahan harga, diskon, tahun ajaran, pembayaran, dan akun admin
                </div>
              </div>
            </div>
            {loading ? (
              <SkeletonTabel baris={5} kolom={3} />
            ) : (data?.audit.length ?? 0) === 0 ? (
              <EmptyState
                judul="Belum ada aktivitas tercatat"
                pesan="Setiap perubahan penting akan otomatis tercatat di sini beserta pelakunya."
              />
            ) : (
              <div className="adm-table-wrap">
                <table className="adm-table">
                  <thead>
                    <tr><th>Aktivitas</th><th style={{ width: 210 }}>Oleh</th><th style={{ width: 170 }}>Waktu</th></tr>
                  </thead>
                  <tbody>
                    {data!.audit.map(a => (
                      <tr key={a.id}>
                        <td>
                          {a.ringkasan}
                          {a.jenjang && (
                            <span className="adm-badge adm-badge--netral" style={{ marginLeft: 8, fontSize: 10 }}>
                              {a.jenjang.toUpperCase()}
                            </span>
                          )}
                        </td>
                        <td style={{ fontSize: 12.5 }}>
                          {a.actorEmail}
                          <div style={{ fontSize: 11, color: 'var(--adm-text-muted)' }}>
                            {LABEL_ROLE[a.actorRole as keyof typeof LABEL_ROLE] ?? a.actorRole}
                          </div>
                        </td>
                        <td style={{ fontSize: 12.5, whiteSpace: 'nowrap' }}>{tglJam(a.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}
      </div>
    </>
  );
}
