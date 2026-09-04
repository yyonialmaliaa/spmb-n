'use client';

import { useCallback, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  ArrowRight, Building2, ChevronRight, ClipboardList, Cog, FileSpreadsheet,
  GraduationCap, Info, Layers, ShieldAlert,
} from 'lucide-react';
import { PortalHeader } from '@/components/admin/PortalHeader';
import { useAdmin } from '@/components/admin/AdminProvider';
import { EmptyState, ErrorState, Skeleton } from '@/components/admin/ui';
import { useMuatData, ambilJson } from '@/components/admin/useMuatData';
import {
  NAMA_INSTITUSI, JENJANG_LABEL_FULL, JENJANG_SINGKAT, JENJANG_SUBJUDUL,
  badgeJenjang, type Jenjang,
} from '@/lib/labels';
import { LABEL_ROLE, type Resource } from '@/lib/permissions';

// ============================================================================
// PILIH JENJANG — pintu masuk setelah login, untuk SEMUA role admin.
//
// Flow wajib: LOGIN -> PILIH JENJANG -> DASHBOARD JENJANG -> operasional.
// Halaman ini SENGAJA tanpa sidebar (lihat isPolos() di AdminShell): menu
// operasional per-jenjang belum bermakna sebelum jenjangnya dipilih.
//
// TIDAK ADA pemilihan jurusan di sini — hanya SMP / SMA / SMK. Tahun ajaran
// ditampilkan sebagai KONTEKS GLOBAL (dengan pemindah cepat), bukan sebagai
// bagian dari pemilihan jenjang.
// ============================================================================

interface RingkasanJenjang {
  jenjang: Jenjang;
  total: number;
  butuhVerifikasi: number;
  terverifikasi: number;
  sudahDaftarUlang: number;
  jumlahJurusan: number;
  gelombang: { nama: string; tanggalMulai: string | null; tanggalSelesai: string | null } | null;
}

interface Aktivitas {
  id: string; ringkasan: string; actorEmail: string; actorRole: string;
  jenjang: string | null; entitas: string; createdAt: string;
}

const URUTAN: Jenjang[] = ['smp', 'sma', 'smk'];

const IKON: Record<Jenjang, React.ComponentType<{ size?: number; color?: string }>> = {
  smp: Building2,
  sma: Layers,
  smk: Cog,
};

const tglPendek = (v?: string | null) =>
  v ? new Date(v).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : null;

function lamanya(iso: string): string {
  const detik = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (detik < 60) return 'baru saja';
  if (detik < 3600) return `${Math.floor(detik / 60)} menit lalu`;
  if (detik < 86400) return `${Math.floor(detik / 3600)} jam lalu`;
  return `${Math.floor(detik / 86400)} hari lalu`;
}

export default function PilihJenjangPage() {
  return <Suspense fallback={null}><PilihJenjangInner /></Suspense>;
}

function PilihJenjangInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, tahunAjaran, tahunAjaranList, isHistoris, canAny, can } = useAdmin();

  // Proxy mengarahkan ke sini dengan ?ditolak=<resource> ketika role ini tidak
  // punya akses ke section yang dibuka — supaya admin mendapat penjelasan,
  // bukan halaman 403 mentah.
  const ditolak = searchParams.get('ditolak') as Resource | null;
  const tahunAjaranId = searchParams.get('tahunAjaranId') || '';
  const qsTa = tahunAjaranId ? `?tahunAjaranId=${tahunAjaranId}` : '';

  const ambil = useCallback(
    (sinyal: AbortSignal) =>
      ambilJson<{
        data: RingkasanJenjang[];
        periode: { mulai: string | null; selesai: string | null } | null;
        aktivitas: Aktivitas[];
      }>(`/api/admin/ringkasan-jenjang${qsTa}`, sinyal),
    [qsTa],
  );

  const { data: hasil, loading, gagal, muatUlang } = useMuatData(ambil, [qsTa]);
  const data = hasil?.data ?? null;
  const periode = hasil?.periode ?? null;
  const aktivitas = hasil?.aktivitas ?? [];

  const gelombangBerjalan = data?.find(d => d.gelombang)?.gelombang ?? null;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--adm-bg)', display: 'flex', flexDirection: 'column' }}>
      <PortalHeader />

      <main style={{ maxWidth: 1180, margin: '0 auto', padding: '26px 24px 48px', width: '100%', flex: 1 }}>
        <nav className="adm-breadcrumb" aria-label="Breadcrumb">
          <span>{NAMA_INSTITUSI}</span>
          <ChevronRight size={12} />
          <span>Portal Seleksi &amp; Manajemen SPMB</span>
        </nav>

        <h1 style={{ fontSize: 25, fontWeight: 700, letterSpacing: '-0.028em', marginTop: 8 }}>
          Pilih Jenjang Administrasi
        </h1>
        <p style={{ fontSize: 13.5, color: 'var(--adm-text-muted)', marginTop: 6, maxWidth: 720 }}>
          Pilih unit pendidikan yang ingin dikelola. Seluruh data operasional yang Anda buka setelah ini
          mengikuti jenjang dan tahun ajaran yang sedang aktif.
        </p>

        {ditolak && (
          <div className="adm-banner adm-banner--warning" style={{ marginTop: 18 }}>
            <ShieldAlert size={15} style={{ flexShrink: 0, marginTop: 1 }} />
            <div>
              Menu <strong>{ditolak.replace(/_/g, ' ')}</strong> tidak tersedia untuk peran{' '}
              <strong>{LABEL_ROLE[user.role]}</strong>. Hubungi Super Admin bila Anda memerlukan akses tersebut.
            </div>
          </div>
        )}

        {/* ---------- Kartu konteks Tahun Ajaran (GLOBAL, bukan per jenjang) ---------- */}
        <section className="adm-card" style={{ marginTop: 20, padding: '20px 22px' }}>
          <div style={{ display: 'flex', gap: 26, flexWrap: 'wrap', alignItems: 'flex-start', justifyContent: 'space-between' }}>
            <div style={{ minWidth: 210 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 9, flexWrap: 'wrap' }}>
                <span className="adm-label" style={{ margin: 0 }}>Tahun Ajaran Aktif</span>
                {gelombangBerjalan && (
                  <span className={`adm-badge adm-badge--${isHistoris ? 'peringatan' : 'sukses'}`}>
                    <span className="adm-dot" style={{ background: 'currentColor' }} />
                    {isHistoris ? 'Historis' : `Aktif · ${gelombangBerjalan.nama} Berjalan`}
                  </span>
                )}
              </div>
              <div style={{ fontSize: 30, fontWeight: 700, letterSpacing: '-0.03em', marginTop: 8 }}>
                TA {tahunAjaran?.nama ?? '—'}
              </div>
            </div>

            <div style={{ minWidth: 230 }}>
              <div className="adm-label">Periode SPMB</div>
              <div style={{ fontSize: 13.5, fontWeight: 600 }}>
                {periode?.mulai && periode?.selesai
                  ? `${tglPendek(periode.mulai)} – ${tglPendek(periode.selesai)}`
                  : 'Belum diatur'}
              </div>
              <Link
                href="/admin/gelombang"
                style={{ fontSize: 12, color: 'var(--adm-primary)', fontWeight: 600, textDecoration: 'none', display: 'inline-block', marginTop: 6 }}
              >
                Atur Jadwal SPMB →
              </Link>
            </div>

            {can('tahun_ajaran', 'update') && (
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <Link href="/admin/tahun-ajaran" className="adm-btn adm-btn--outlined adm-btn--sm">
                  Kelola Tahun Ajaran
                </Link>
              </div>
            )}
          </div>

          {/* Pemindah cepat konteks tahun ajaran. */}
          {tahunAjaranList.length > 1 && (
            <div style={{ marginTop: 16, paddingTop: 14, borderTop: '1px solid var(--adm-border)', display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 12, color: 'var(--adm-text-muted)' }}>Pindah cepat tahun ajaran:</span>
              {tahunAjaranList.map(ta => (
                <button
                  key={ta.id}
                  onClick={() => router.push(ta.aktif ? '/admin/dashboard' : `/admin/dashboard?tahunAjaranId=${ta.id}`)}
                  className={`adm-ta-chip${ta.id === tahunAjaran?.id ? ' is-active' : ''}`}
                >
                  TA {ta.nama}{ta.aktif ? ' · Aktif' : ''}
                </button>
              ))}
              <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11.5, color: 'var(--adm-text-faint)' }}>
                <Info size={12} /> Peralihan tahun ajaran mengubah konteks data di seluruh modul.
              </span>
            </div>
          )}
        </section>

        {/* ---------- Kartu jenjang ---------- */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(290px, 1fr))', gap: 18, marginTop: 20 }}>
          {loading && URUTAN.map(j => (
            <div key={j} className="adm-card adm-card-pad">
              <Skeleton tinggi={38} lebar={38} radius={10} />
              <div style={{ height: 16 }} />
              <Skeleton tinggi={17} lebar="65%" />
              <div style={{ height: 8 }} />
              <Skeleton tinggi={12} lebar="80%" />
              <div style={{ height: 20 }} />
              <Skeleton tinggi={44} />
              <div style={{ height: 16 }} />
              <Skeleton tinggi={34} />
            </div>
          ))}

          {!loading && gagal && (
            <div style={{ gridColumn: '1 / -1' }} className="adm-card">
              <ErrorState onCoba={muatUlang} />
            </div>
          )}

          {!loading && !gagal && data && URUTAN.map(j => {
            const r = data.find(x => x.jenjang === j);
            const Ikon = IKON[j];
            const sampai = tglPendek(r?.gelombang?.tanggalSelesai);

            return (
              <section key={j} className="adm-card" style={{ display: 'flex', flexDirection: 'column', padding: 20 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
                  <span
                    style={{
                      width: 38, height: 38, borderRadius: 'var(--adm-r-md)',
                      background: 'var(--adm-primary-weak)', display: 'flex',
                      alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                    }}
                  >
                    <Ikon size={19} color="var(--adm-primary)" />
                  </span>
                  <span className="adm-badge adm-badge--netral">
                    {badgeJenjang(j, r?.jumlahJurusan ?? 0)}
                  </span>
                </div>

                <h2 style={{ fontSize: 16.5, fontWeight: 700, letterSpacing: '-0.02em', marginTop: 14 }}>
                  {JENJANG_LABEL_FULL[j].toUpperCase()}
                </h2>
                <p style={{ fontSize: 12, color: 'var(--adm-text-muted)', marginTop: 4 }}>
                  {JENJANG_SUBJUDUL[j]}
                </p>

                {/* Metrik: Kuota sengaja TIDAK ditampilkan — tidak ada kolom
                    kuota di basis data, dan menampilkan angka karangan lebih
                    buruk daripada tidak menampilkannya sama sekali. */}
                <div
                  style={{
                    display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 16,
                    padding: '13px 14px', background: 'var(--adm-surface-alt)',
                    border: '1px solid var(--adm-border)', borderRadius: 'var(--adm-r-md)',
                  }}
                >
                  <div>
                    <div style={{ fontSize: 11, color: 'var(--adm-text-muted)' }}>Total Pendaftar</div>
                    <div style={{ fontSize: 21, fontWeight: 700, letterSpacing: '-0.02em', marginTop: 2 }}>{r?.total ?? 0}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: 'var(--adm-warning)', fontWeight: 600 }}>Butuh Verifikasi</div>
                    <div style={{ fontSize: 21, fontWeight: 700, letterSpacing: '-0.02em', marginTop: 2, color: (r?.butuhVerifikasi ?? 0) > 0 ? 'var(--adm-warning)' : 'var(--adm-text)' }}>
                      {r?.butuhVerifikasi ?? 0}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: 'var(--adm-text-muted)' }}>Terverifikasi</div>
                    <div style={{ fontSize: 15, fontWeight: 650, marginTop: 2, color: 'var(--adm-success)' }}>{r?.terverifikasi ?? 0}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: 'var(--adm-text-muted)' }}>Sudah Daftar Ulang</div>
                    <div style={{ fontSize: 15, fontWeight: 650, marginTop: 2, color: 'var(--adm-info)' }}>{r?.sudahDaftarUlang ?? 0}</div>
                  </div>
                </div>

                <div
                  style={{
                    display: 'flex', alignItems: 'center', gap: 7, marginTop: 12, fontSize: 12,
                    color: r?.gelombang ? 'var(--adm-text-muted)' : 'var(--adm-text-faint)',
                  }}
                >
                  <span className="adm-dot" style={{ background: r?.gelombang ? 'var(--adm-success)' : 'var(--adm-text-faint)' }} />
                  {r?.gelombang
                    ? <span>{r.gelombang.nama}{sampai ? ` · s.d. ${sampai}` : ''}</span>
                    : <span>Belum ada gelombang berjalan</span>}
                </div>

                <Link
                  href={`/admin/dashboard/${j}${qsTa}`}
                  className="adm-btn adm-btn--primary"
                  style={{ marginTop: 'auto', width: '100%', marginBlockStart: 18 }}
                >
                  Masuk Dashboard {JENJANG_SINGKAT[j]} <ArrowRight size={15} />
                </Link>

                {canAny('verifikasi') && (
                  <Link
                    href={`/admin/verifikasi?jenjang=${j}${tahunAjaranId ? `&tahunAjaranId=${tahunAjaranId}` : ''}`}
                    style={{ display: 'block', textAlign: 'center', marginTop: 10, fontSize: 12, color: 'var(--adm-text-muted)', textDecoration: 'none' }}
                  >
                    Lihat antrean verifikasi {JENJANG_SINGKAT[j]} →
                  </Link>
                )}
              </section>
            );
          })}
        </div>

        {!loading && !gagal && data && data.every(d => d.total === 0) && (
          <div className="adm-card" style={{ marginTop: 20 }}>
            <EmptyState
              judul={`Belum ada pendaftar pada TA ${tahunAjaran?.nama ?? 'ini'}`}
              pesan="Pendaftar akan muncul setelah calon siswa mengirimkan formulir, atau setelah admin menambahkan pendaftar offline."
            />
          </div>
        )}

        {/* ---------- Aktivitas & akses cepat ---------- */}
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.6fr) minmax(0, 1fr)', gap: 18, marginTop: 20 }} className="adm-bawah">
          {canAny('audit') && (
            <section className="adm-card">
              <div className="adm-card-head">
                <div>
                  <div className="adm-card-title">Aktivitas Terakhir Sistem SPMB</div>
                  <div style={{ fontSize: 11.5, color: 'var(--adm-text-muted)', marginTop: 2 }}>
                    Perubahan konfigurasi dan tindakan administratif yang tercatat
                  </div>
                </div>
                <Link href="/admin/pengaturan" style={{ fontSize: 12, color: 'var(--adm-primary)', fontWeight: 600, textDecoration: 'none' }}>
                  Lihat Audit Trail →
                </Link>
              </div>
              {aktivitas.length === 0 ? (
                <EmptyState
                  judul="Belum ada aktivitas tercatat"
                  pesan="Perubahan harga, diskon, tahun ajaran, dan verifikasi pembayaran akan muncul di sini."
                />
              ) : (
                <div>
                  {aktivitas.map(a => (
                    <div
                      key={a.id}
                      style={{
                        display: 'flex', gap: 12, padding: '12px 20px',
                        borderTop: '1px solid var(--adm-border)', alignItems: 'flex-start',
                      }}
                    >
                      <span className="adm-badge adm-badge--netral" style={{ minWidth: 44, justifyContent: 'center', fontSize: 10 }}>
                        {a.jenjang ? a.jenjang.toUpperCase() : a.entitas.slice(0, 4).toUpperCase()}
                      </span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 550 }}>{a.ringkasan}</div>
                        <div style={{ fontSize: 11.5, color: 'var(--adm-text-muted)', marginTop: 2 }}>
                          Oleh {a.actorEmail} · {LABEL_ROLE[a.actorRole as keyof typeof LABEL_ROLE] ?? a.actorRole}
                        </div>
                      </div>
                      <span style={{ fontSize: 11, color: 'var(--adm-text-faint)', whiteSpace: 'nowrap' }}>
                        {lamanya(a.createdAt)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}

          <section className="adm-card" style={{ gridColumn: canAny('audit') ? undefined : '1 / -1' }}>
            <div className="adm-card-head">
              <div>
                <div className="adm-card-title">Akses Cepat</div>
                <div style={{ fontSize: 11.5, color: 'var(--adm-text-muted)', marginTop: 2 }}>
                  Pintasan administrasi lintas jenjang
                </div>
              </div>
            </div>
            <div>
              {[
                { href: '/admin/gelombang', label: 'Jadwal SPMB & Gelombang', ikon: ClipboardList, resource: 'jadwal' as Resource },
                { href: '/admin/persyaratan', label: 'Persyaratan Berkas', ikon: GraduationCap, resource: 'persyaratan' as Resource },
                { href: '/admin/laporan/keuangan', label: 'Laporan Keuangan', ikon: FileSpreadsheet, resource: 'laporan_keuangan' as Resource },
                { href: '/admin/pengguna', label: 'Pengguna Admin', ikon: Cog, resource: 'pengguna' as Resource },
              ]
                .filter(x => canAny(x.resource))
                .map(x => {
                  const Ikon = x.ikon;
                  return (
                    <Link
                      key={x.href}
                      href={x.href}
                      style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10,
                        padding: '12px 20px', borderTop: '1px solid var(--adm-border)',
                        textDecoration: 'none', color: 'var(--adm-text)', fontSize: 13,
                      }}
                    >
                      <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <Ikon size={15} color="var(--adm-text-muted)" />
                        {x.label}
                      </span>
                      <ChevronRight size={15} color="var(--adm-text-faint)" />
                    </Link>
                  );
                })}
            </div>
          </section>
        </div>
      </main>

      <footer style={{ borderTop: '1px solid var(--adm-border)', background: 'var(--adm-surface)' }}>
        <div style={{ maxWidth: 1180, margin: '0 auto', padding: '14px 24px', display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', fontSize: 11.5, color: 'var(--adm-text-muted)' }}>
          <span>© {new Date().getFullYear()} Yayasan Pendidikan {NAMA_INSTITUSI}. Seluruh hak cipta dilindungi.</span>
          <Link href="/admin/bantuan" style={{ color: 'var(--adm-text-muted)', textDecoration: 'none' }}>
            Bantuan &amp; Panduan Admin
          </Link>
        </div>
      </footer>
    </div>
  );
}
