'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ExternalLink, AlertCircle, Upload, CheckCircle, Loader } from 'lucide-react';
import PortalShell, { PortalContext } from '@/components/portal/PortalShell';
import { formatRupiah, LABEL_JENIS_TRANSAKSI } from '@/lib/pembayaran-utils';
import { BANK_TUJUAN } from '@/lib/biaya';

const STATUS_TRANSAKSI: Record<string, { label: string; color: string; bg: string }> = {
  menunggu_verifikasi: { label: 'Menunggu Verifikasi', color: 'var(--adm-info)', bg: 'var(--adm-info-weak)' },
  lunas: { label: 'Terverifikasi', color: 'var(--adm-success)', bg: 'var(--adm-success-weak)' },
  ditolak: { label: 'Ditolak', color: 'var(--adm-danger)', bg: 'var(--adm-danger-weak)' },
};

export default function PembayaranPage() {
  return (
    <PortalShell active="pembayaran">
      {(ctx) => <PembayaranContent {...ctx} />}
    </PortalShell>
  );
}

function PembayaranContent({ pendaftaran, riwayat, reload }: PortalContext) {
  const router = useRouter();
  const [metode, setMetode] = useState('');
  const [bankPengirim, setBankPengirim] = useState('');
  const [namaPengirim, setNamaPengirim] = useState('');
  const [nominal, setNominal] = useState('');
  const [buktiPath, setBuktiPath] = useState('');
  const [buktiUploading, setBuktiUploading] = useState(false);
  const [buktiFileName, setBuktiFileName] = useState('');
  const [bayarLoading, setBayarLoading] = useState(false);
  const [bayarError, setBayarError] = useState('');

  useEffect(() => {
    if (pendaftaran === null) router.replace('/dashboard');
  }, [pendaftaran, router]);

  if (!pendaftaran) return null;

  const totalTagihan = riwayat?.totalTagihan ?? 0;
  const totalDibayar = riwayat?.totalDibayar ?? 0;
  const totalRefund = riwayat?.totalRefund ?? 0;
  const totalAlokasi = riwayat?.totalAlokasi ?? 0;
  const kelebihanBayar = riwayat?.lebihBayar ?? 0;
  const sisaBayar = riwayat?.sisaBayar ?? 0;
  const totalDisetorkan = riwayat?.totalDisetorkan ?? 0;
  const minCicilan = riwayat?.minCicilan || 100000;
  const minimalPembayaranAwal = riwayat?.minimalPembayaranAwal || 200000;
  const sudahAdaPembayaran = (riwayat?.riwayat?.length || 0) > 0;
  const minRequired = sudahAdaPembayaran ? Math.min(minCicilan, sisaBayar || minCicilan) : minimalPembayaranAwal;
  const showForm = sisaBayar > 0 && pendaftaran.status !== 'ditolak';

  const handleBuktiChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { setBayarError('Ukuran file maksimal 2MB'); return; }
    setBuktiFileName(file.name);
    setBuktiUploading(true);
    setBayarError('');
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('fieldName', 'buktiPembayaran');
      const res = await fetch('/api/upload', { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok) { setBayarError(data.error || 'Gagal upload'); setBuktiUploading(false); return; }
      setBuktiPath(data.path);
    } catch {
      setBayarError('Gagal upload, coba lagi');
    } finally {
      setBuktiUploading(false);
    }
  };

  const handleSubmitPembayaran = async () => {
    if (!metode) { setBayarError('Pilih metode pembayaran terlebih dahulu'); return; }
    if (metode === 'online' && (!bankPengirim || !namaPengirim)) { setBayarError('Nama bank & nama pemilik rekening wajib diisi'); return; }
    const nominalNum = Math.round(Number(nominal.replace(/[^\d]/g, '')) || 0);
    if (!nominalNum) { setBayarError('Nominal pembayaran wajib diisi'); return; }
    if (nominalNum < minRequired) { setBayarError(`Minimal pembayaran ${formatRupiah(minRequired)}`); return; }
    if (!buktiPath) { setBayarError('Upload bukti pembayaran terlebih dahulu'); return; }
    setBayarLoading(true);
    setBayarError('');
    try {
      const res = await fetch('/api/pembayaran', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          metodePembayaran: metode,
          buktiPembayaran: buktiPath,
          nominal: nominalNum,
          bankPengirim: metode === 'online' ? bankPengirim : null,
          namaPengirim: metode === 'online' ? namaPengirim : null,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setBayarError(data.error || 'Gagal mengirim bukti pembayaran'); setBayarLoading(false); return; }
      setMetode(''); setNominal(''); setBuktiPath(''); setBankPengirim(''); setNamaPengirim('');
      reload();
    } catch {
      setBayarError('Terjadi kesalahan jaringan');
    } finally {
      setBayarLoading(false);
    }
  };

  return (
    <div>
      <div style={{ marginBottom: 18 }}>
        <h1 className="font-display" style={{ fontSize: 22, color: 'var(--adm-text)', marginBottom: 2 }}>Pembayaran</h1>
        <p style={{ color: 'var(--adm-text-muted)', fontSize: 13.5 }}>Pusat informasi keuangan pendaftaran Anda.</p>
      </div>

      {/* Ringkasan keuangan — satu sumber data yang sama dengan admin
          (server, lewat /api/pembayaran), semua angka selalu ditampilkan. */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12, marginBottom: 20 }}>
        <StatTile label="Total Tagihan" value={formatRupiah(totalTagihan)} />
        <StatTile label="Total Dibayar" value={formatRupiah(totalDibayar)} tone="success" />
        <StatTile label="Kelebihan Pembayaran" value={formatRupiah(kelebihanBayar)} tone={kelebihanBayar > 0 ? 'info' : undefined} />
        <StatTile label="Total Dialokasikan" value={formatRupiah(totalAlokasi)} tone={totalAlokasi > 0 ? 'purple' : undefined} />
        <StatTile label="Total Dikembalikan" value={formatRupiah(totalRefund)} tone={totalRefund > 0 ? 'warning' : undefined} />
        <StatTile label="Saldo Tersedia" value={formatRupiah(kelebihanBayar)} tone={kelebihanBayar > 0 ? 'info' : undefined} emphasis />
      </div>

      {/* Status keseluruhan */}
      <div style={{ background: sisaBayar <= 0 && totalTagihan > 0 ? 'var(--adm-success-weak)' : 'var(--adm-warning-weak)', border: `1px solid ${sisaBayar <= 0 && totalTagihan > 0 ? 'var(--adm-success-border)' : 'var(--adm-warning-border)'}`, borderRadius: 12, padding: 16, marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
        <span style={{ fontSize: 13.5, color: sisaBayar <= 0 && totalTagihan > 0 ? 'var(--adm-success)' : 'var(--adm-warning)', fontWeight: 600 }}>
          {totalTagihan === 0 ? 'Total tagihan belum tersedia — hubungi admin sekolah.' : sisaBayar <= 0 ? 'Pembayaran Anda sudah lunas.' : `Sisa tagihan yang perlu dibayar: ${formatRupiah(sisaBayar)}`}
        </span>
      </div>

      {/* Form bayar/cicilan */}
      {showForm && (
        <div style={{ background: 'var(--adm-surface)', borderRadius: 14, padding: 22, border: '1px solid var(--adm-border)', marginBottom: 20 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--adm-text)', marginBottom: 16 }}>Bayar / Cicil Sekarang</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ background: 'var(--adm-success-weak)', border: '1px solid var(--adm-success-border)', borderRadius: 10, padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div>
                <div style={{ fontSize: 10, color: 'var(--adm-success)', fontWeight: 700 }}>BANK TUJUAN</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--adm-text)' }}>{BANK_TUJUAN.bank}</div>
              </div>
              <div>
                <div style={{ fontSize: 10, color: 'var(--adm-success)', fontWeight: 700 }}>NOMOR REKENING</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--adm-text)', fontFamily: 'monospace' }}>{BANK_TUJUAN.nomorRekening}</div>
              </div>
              <div>
                <div style={{ fontSize: 10, color: 'var(--adm-success)', fontWeight: 700 }}>ATAS NAMA</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--adm-text)' }}>{BANK_TUJUAN.atasNama}</div>
              </div>
              <p style={{ fontSize: 11.5, color: 'var(--adm-success)', margin: 0 }}>Boleh dicicil, minimal {formatRupiah(minCicilan)} per pembayaran.</p>
            </div>

            <FieldGroup>
              <label style={fieldLabelStyle}>Pilih Metode Pembayaran</label>
              <div style={{ display: 'flex', gap: 10 }}>
                {(['offline', 'online'] as const).map(m => (
                  <button key={m} type="button" onClick={() => setMetode(m)} style={{ flex: 1, padding: '10px 14px', borderRadius: 10, border: metode === m ? '2px solid var(--adm-warning)' : '1px solid var(--adm-border)', background: metode === m ? 'var(--adm-warning-weak)' : 'var(--adm-surface)', color: metode === m ? 'var(--adm-warning)' : 'var(--adm-text)', fontWeight: 600, fontSize: 13, cursor: 'pointer', textTransform: 'capitalize' }}>
                    {m === 'offline' ? 'Tunai di Sekolah' : 'Transfer Online'}
                  </button>
                ))}
              </div>
            </FieldGroup>

            {metode === 'online' && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
                <FieldGroup>
                  <label style={fieldLabelStyle}>Nama Bank Pengirim</label>
                  <input type="text" value={bankPengirim} onChange={e => setBankPengirim(e.target.value)} placeholder="Contoh: BCA, BRI, Mandiri" style={inputStyle} />
                </FieldGroup>
                <FieldGroup>
                  <label style={fieldLabelStyle}>Nama Pemilik Rekening</label>
                  <input type="text" value={namaPengirim} onChange={e => setNamaPengirim(e.target.value)} placeholder="Sesuai nama di rekening" style={inputStyle} />
                </FieldGroup>
              </div>
            )}

            <FieldGroup>
              <label style={fieldLabelStyle}>Nominal Pembayaran (minimal {formatRupiah(minRequired)})</label>
              <input
                type="text" inputMode="numeric"
                value={nominal ? Number(nominal.replace(/[^\d]/g, '')).toLocaleString('id-ID') : ''}
                onChange={e => setNominal(e.target.value.replace(/[^\d]/g, ''))}
                placeholder={`Contoh: ${minRequired.toLocaleString('id-ID')}`}
                style={inputStyle}
              />
              <p style={{ fontSize: 11.5, color: 'var(--adm-text-faint)', marginTop: 4 }}>Sisa tagihan Anda: {formatRupiah(sisaBayar)}. Boleh dibayar bertahap.</p>
            </FieldGroup>

            <FieldGroup>
              <label style={fieldLabelStyle}>Upload Bukti Pembayaran</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                <label
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    background: buktiUploading ? '#9CA3AF' : '#0A1628', color: 'white',
                    padding: '10px 18px', borderRadius: 8,
                    cursor: buktiUploading ? 'not-allowed' : 'pointer',
                    fontSize: 13, fontWeight: 600, flexShrink: 0,
                  }}
                >
                  {buktiUploading ? <Loader size={14} className="animate-spin" /> : <Upload size={14} />}
                  {buktiPath ? 'Ganti File' : 'Pilih File'}
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/jpg,application/pdf"
                    onChange={handleBuktiChange}
                    disabled={buktiUploading}
                    style={{ display: 'none' }}
                  />
                </label>
                <span style={{ fontSize: 12.5, color: buktiPath && !buktiUploading ? 'var(--adm-success)' : 'var(--adm-text-muted)', display: 'flex', alignItems: 'center', gap: 5 }}>
                  {buktiUploading
                    ? 'Mengupload...'
                    : buktiPath
                      ? (<><CheckCircle size={14} /> {buktiFileName || 'Bukti berhasil diupload'}</>)
                      : 'Belum ada file yang dipilih'}
                </span>
              </div>
              <p style={{ fontSize: 11, color: 'var(--adm-text-faint)', marginTop: 6 }}>JPG, PNG, atau PDF — maksimal 2MB</p>
            </FieldGroup>

            {bayarError && (
              <div style={{ background: 'var(--adm-danger-weak)', border: '1px solid var(--adm-danger-border)', borderRadius: 8, padding: 10, fontSize: 12, color: 'var(--adm-danger)', display: 'flex', gap: 8, alignItems: 'center' }}>
                <AlertCircle size={14} /> {bayarError}
              </div>
            )}

            <button onClick={handleSubmitPembayaran} disabled={bayarLoading || buktiUploading} className="btn-primary" style={{ alignSelf: 'flex-start', fontSize: 13.5, opacity: bayarLoading || buktiUploading ? 0.6 : 1 }}>
              {bayarLoading ? 'Mengirim...' : 'Kirim Bukti Pembayaran'}
            </button>
          </div>
        </div>
      )}

      {/* Riwayat Transaksi — satu sumber data (pembayaran, alokasi, refund) */}
      <div style={{ background: 'var(--adm-surface)', borderRadius: 14, border: '1px solid var(--adm-border)', overflow: 'hidden' }}>
        <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--adm-border)' }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--adm-text)', margin: 0 }}>Riwayat Transaksi</h3>
        </div>
        {!riwayat || riwayat.riwayat.length === 0 ? (
          <div style={{ padding: 36, textAlign: 'center', color: 'var(--adm-text-faint)', fontSize: 13 }}>Belum ada transaksi</div>
        ) : (
          riwayat.riwayat.map((r: any, i: number) => {
            const isRefund = r.jenis === 'refund';
            const isAlokasi = r.jenis === 'alokasi';
            const sc = isAlokasi && r.status === 'lunas'
              ? { label: 'Dialokasikan', color: 'var(--adm-ungu)', bg: 'var(--adm-ungu-weak)' }
              : isRefund && r.status === 'lunas'
              ? { label: 'Dikembalikan', color: 'var(--adm-danger)', bg: 'var(--adm-danger-weak)' }
              : (STATUS_TRANSAKSI[r.status] || STATUS_TRANSAKSI['menunggu_verifikasi']);
            // Warna sudah berupa token tema, jadi dipakai langsung tanpa
            // pengecekan sentinel string seperti sebelumnya.
            const warna = isRefund ? 'var(--adm-danger)' : isAlokasi ? 'var(--adm-ungu)' : 'var(--adm-text)';
            return (
              <div key={r.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 10, padding: '14px 20px', borderTop: i === 0 ? 'none' : '1px solid var(--adm-border)' }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 600, color: warna }}>
                    {isRefund
                      ? `${LABEL_JENIS_TRANSAKSI.refund}${r.alasanRefund ? ` — ${r.alasanRefund}` : ''}`
                      : isAlokasi
                      ? `${LABEL_JENIS_TRANSAKSI.alokasi} — ${r.kategoriAlokasi || 'Lainnya'}`
                      : `Cicilan ke-${r.angsuranKe}`}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--adm-text-faint)', marginTop: 2 }}>
                    {new Date(r.tanggalBayar).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                    {!isAlokasi && ` · ${r.metodePembayaran === 'online' ? 'Transfer' : 'Tunai'}${r.bankPengirim ? ` (${r.bankPengirim} a.n. ${r.namaPengirim})` : ''}`}
                    {isAlokasi && r.catatanAdmin && ` · ${r.catatanAdmin}`}
                  </div>
                  {r.status === 'ditolak' && r.catatanAdmin && <div style={{ fontSize: 12, color: 'var(--adm-danger)', marginTop: 3 }}>Catatan: {r.catatanAdmin}</div>}
                  {r.buktiPembayaran && (
                    <a href={r.buktiPembayaran} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: 'var(--cn-hijau)', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 4, marginTop: 4 }}>
                      Lihat bukti <ExternalLink size={11} />
                    </a>
                  )}
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: warna }}>{(isRefund || isAlokasi) ? '- ' : ''}{formatRupiah(r.nominal)}</div>
                  <span style={{ background: sc.bg, color: sc.color, fontSize: 10.5, fontWeight: 700, padding: '2px 9px', borderRadius: 10, display: 'inline-block', marginTop: 3 }}>{sc.label}</span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

function StatTile({ label, value, tone, emphasis }: { label: string; value: string; tone?: 'success' | 'warning' | 'info' | 'purple'; emphasis?: boolean }) {
  const map = {
    success: { bg: 'var(--adm-success-weak)', color: 'var(--adm-success)' },
    warning: { bg: 'var(--adm-warning-weak)', color: 'var(--adm-warning)' },
    info: { bg: 'var(--adm-info-weak)', color: 'var(--adm-info)' },
    purple: { bg: 'var(--adm-ungu-weak)', color: 'var(--adm-ungu)' },
  };
  const c = tone ? map[tone] : { bg: 'var(--adm-surface-alt)', color: 'var(--adm-text)' };
  return (
    <div style={{ background: c.bg, borderRadius: 12, padding: '14px 16px', border: emphasis ? `1.5px solid ${c.color}33` : '1px solid transparent' }}>
      <div style={{ fontSize: 10.5, color: c.color, fontWeight: 700, opacity: 0.85, marginBottom: 4 }}>{label.toUpperCase()}</div>
      <div style={{ fontSize: 17, fontWeight: 700, color: c.color }}>{value}</div>
    </div>
  );
}

function FieldGroup({ children }: { children: React.ReactNode }) {
  return <div>{children}</div>;
}

const fieldLabelStyle: React.CSSProperties = { fontSize: 12, fontWeight: 600, color: 'var(--adm-text)', display: 'block', marginBottom: 8 };
const inputStyle: React.CSSProperties = { width: '100%', padding: '10px 14px', border: '1.5px solid var(--adm-border-strong)', borderRadius: 8, fontSize: 14, fontFamily: 'inherit', background: 'var(--adm-surface)', color: 'var(--adm-text)' };
