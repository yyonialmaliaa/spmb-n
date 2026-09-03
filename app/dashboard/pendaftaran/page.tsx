'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { XCircle, Edit3 } from 'lucide-react';
import PortalShell, { PortalContext } from '@/components/portal/PortalShell';
import { STATUS_CONFIG, TAHAPAN, teksSelanjutnya } from '@/components/portal/statusConfig';
import { JENJANG_LABEL, Jenjang } from '@/lib/biaya';

function getRegNo(id: string, date: string) {
  const d = new Date(date);
  return `REG-${d.getFullYear()}-${id.slice(0, 5).toUpperCase()}`;
}

export default function PendaftaranPage() {
  return (
    <PortalShell active="pendaftaran">
      {(ctx) => <PendaftaranContent {...ctx} />}
    </PortalShell>
  );
}

function PendaftaranContent({ pendaftaran }: PortalContext) {
  const router = useRouter();

  // Belum ada pendaftaran sama sekali -> tidak ada apa pun untuk ditampilkan
  // di halaman ini, kembali ke Dashboard (yang punya CTA mulai daftar).
  useEffect(() => {
    if (pendaftaran === null) router.replace('/dashboard');
  }, [pendaftaran, router]);

  if (!pendaftaran) return null;

  const isDraft = pendaftaran.status === 'draft';
  const isDitolak = pendaftaran.status === 'ditolak';
  const statusCfg = !isDraft ? (STATUS_CONFIG[pendaftaran.status] || STATUS_CONFIG['verified']) : null;
  const currentStep = statusCfg?.step || 0;
  const selanjutnya = !isDraft ? teksSelanjutnya(pendaftaran.status, pendaftaran.sudahDaftarUlang) : '';
  const jenjang = (pendaftaran.jenjang || 'smk') as Jenjang;
  const asalSekolahLabel = jenjang === 'smp' ? 'Asal SD/MI' : 'Asal Sekolah';
  const asalSekolahNilai = (jenjang === 'smp' ? pendaftaran.asalSD : pendaftaran.asalSMP) || pendaftaran.asalSekolah || '-';

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div>
        <h1 className="font-display" style={{ fontSize: 22, color: '#0B2A1C', marginBottom: 2 }}>Pendaftaran</h1>
        <p style={{ color: '#6B7280', fontSize: 13.5 }}>Status dan data formulir pendaftaran SPMB Anda.</p>
      </div>

      {/* Status — status, progress, dan langkah berikutnya jadi satu bagian
          yang sama (bukan card "Tahapan Selanjutnya" terpisah). */}
      <div style={{ background: 'white', borderRadius: 14, padding: 24, border: '1px solid #F0EBE0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18, flexWrap: 'wrap', gap: 8 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: '#0B2A1C', margin: 0 }}>Status Pendaftaran</h3>
          {isDraft ? (
            <span style={{ background: '#FEF3C7', color: '#92400E', border: '1px solid #FDE68A', padding: '5px 14px', borderRadius: 20, fontSize: 12, fontWeight: 700 }}>Draft — Belum Dikirim</span>
          ) : statusCfg && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: statusCfg.bg, color: statusCfg.color, border: `1px solid ${statusCfg.border}`, padding: '5px 14px', borderRadius: 20, fontSize: 12, fontWeight: 700 }}>
              <statusCfg.icon size={13} /> {statusCfg.label}
            </span>
          )}
        </div>

        {isDraft ? (
          <div>
            <p style={{ fontSize: 13.5, color: '#6B7280', lineHeight: 1.7, marginBottom: 16 }}>
              Formulir Anda tersimpan sebagai draft dan belum masuk ke admin. Lengkapi data & berkas, lalu selesaikan pembayaran untuk dapat mengirim formulir.
            </p>
            <Link href="/spmb/daftar" className="btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 13.5 }}>
              <Edit3 size={15} /> Lanjutkan Formulir
            </Link>
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', alignItems: 'flex-start', marginBottom: 20, overflowX: 'auto' }}>
              {TAHAPAN.map((t, i) => {
                const done = currentStep > t.step;
                const activeStep = currentStep === t.step;
                const isRejected = isDitolak && t.step === 1;
                return (
                  <div key={t.step} style={{ display: 'flex', alignItems: 'flex-start', flex: 1, minWidth: 90 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
                      <div style={{ width: 34, height: 34, borderRadius: '50%', background: isRejected ? '#FEE2E2' : done || activeStep ? 'linear-gradient(135deg,#C8973A,#E8B84B)' : '#F3F4F6', border: isRejected ? '2px solid #FECACA' : 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 13, color: isRejected ? '#DC2626' : done || activeStep ? '#0A1628' : '#9CA3AF', marginBottom: 7, flexShrink: 0 }}>
                        {isRejected ? '✗' : done ? '✓' : t.step}
                      </div>
                      <span style={{ fontSize: 11, fontWeight: activeStep ? 700 : 500, color: isRejected ? '#DC2626' : activeStep ? '#C8973A' : done ? '#0A1628' : '#9CA3AF', textAlign: 'center', whiteSpace: 'nowrap' }}>{t.label}</span>
                      <span style={{ fontSize: 10, color: '#9CA3AF' }}>{t.sub}</span>
                    </div>
                    {i < TAHAPAN.length - 1 && <div style={{ height: 2, flex: 0.4, background: done ? '#C8973A' : '#E5E7EB', margin: '17px 4px 0', flexShrink: 0 }} />}
                  </div>
                );
              })}
            </div>

            {selanjutnya && (
              <div style={{ marginBottom: isDitolak ? 14 : 0 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', marginBottom: 4, letterSpacing: 0.3 }}>SELANJUTNYA</div>
                <p style={{ fontSize: 13.5, color: '#374151', lineHeight: 1.6, margin: 0 }}>{selanjutnya}</p>
              </div>
            )}

            {isDitolak && (pendaftaran.alasanPenolakan || pendaftaran.catatan) && (
              <div style={{ background: '#FFF7ED', border: '1px solid #FED7AA', borderRadius: 10, padding: 16, marginBottom: 14 }}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 6 }}>
                  <XCircle size={14} color="#C2410C" />
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#C2410C' }}>CATATAN DARI ADMIN</span>
                </div>
                {pendaftaran.alasanPenolakan && <p style={{ fontSize: 13, color: '#C2410C', lineHeight: 1.6, margin: 0 }}>{pendaftaran.alasanPenolakan}</p>}
                {pendaftaran.catatan && <p style={{ fontSize: 13, color: '#EA580C', marginTop: pendaftaran.alasanPenolakan ? 8 : 0, lineHeight: 1.6, margin: 0 }}>{pendaftaran.catatan}</p>}
              </div>
            )}

            {isDitolak && (
              <div>
                <Link href="/spmb/revisi" className="btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 13.5 }}>
                  <Edit3 size={15} /> Perbaiki & Kirim Ulang Berkas
                </Link>
                {(pendaftaran.revisiCount || 0) > 0 && <p style={{ fontSize: 12, color: '#9CA3AF', marginTop: 8 }}>Sudah direvisi {pendaftaran.revisiCount}x — riwayat tersimpan</p>}
              </div>
            )}
          </>
        )}
      </div>

      {/* Data Pendaftaran */}
      <div style={{ background: 'white', borderRadius: 14, padding: 24, border: '1px solid #F0EBE0' }}>
        <h3 style={{ fontSize: 15, fontWeight: 700, color: '#0B2A1C', marginBottom: 16 }}>Data Pendaftaran</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12 }}>
          <DataField label="No. Pendaftaran" value={getRegNo(pendaftaran.id, pendaftaran.createdAt)} />
          <DataField label="Jenjang" value={`${JENJANG_LABEL[jenjang]}${pendaftaran.kelas ? ' - ' + pendaftaran.kelas : ''}`} />
          {jenjang === 'smk' && <DataField label="Jurusan" value={pendaftaran.jurusan || '-'} />}
          <DataField label="Gelombang" value={pendaftaran.gelombang || '-'} />
          <DataField label={asalSekolahLabel} value={asalSekolahNilai} />
          <DataField label="Tanggal Pendaftaran" value={new Date(pendaftaran.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })} />
        </div>
      </div>

      {/* Bukti Pendaftaran */}
      <div style={{ background: 'white', borderRadius: 14, padding: 24, border: '1px solid #F0EBE0' }}>
        <h3 style={{ fontSize: 15, fontWeight: 700, color: '#0B2A1C', marginBottom: 8 }}>Bukti Pendaftaran</h3>
        <p style={{ fontSize: 13, color: '#6B7280', lineHeight: 1.6, marginBottom: 12 }}>
          Nomor pendaftaran Anda adalah <strong style={{ color: '#0B2A1C' }}>{getRegNo(pendaftaran.id, pendaftaran.createdAt)}</strong>. Simpan nomor ini sebagai bukti Anda telah mendaftar.
        </p>
        <Link href="/dashboard/dokumen" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 700, color: '#0B3D2E', textDecoration: 'none', background: '#F3EFE3', padding: '9px 16px', borderRadius: 8 }}>
          Lihat Status Berkas Terupload
        </Link>
      </div>
    </div>
  );
}

function DataField({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ background: '#FAFAFA', borderRadius: 10, padding: '12px 14px' }}>
      <div style={{ fontSize: 11, color: '#9CA3AF', fontWeight: 600, marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 13.5, fontWeight: 600, color: '#0A1628' }}>{value}</div>
    </div>
  );
}
