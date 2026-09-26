'use client';
import { useEffect, useState } from 'react';
import { ArrowLeftRight, X as XIcon } from 'lucide-react';
import { formatRupiah } from '@/lib/pembayaran-utils';
import { labelTier, pecahKelasHarga } from '@/lib/kelas';
import TeksKode from '@/components/TeksKode';

type Asal = {
  label: string; kelas: string | null; tingkat: string; noPendaftaran: string | null;
  totalTagihan: number; totalDibayar: number; sisaBayar: number; kelebihanBayar: number;
  diskonId: string | null;
};
type Pilihan = {
  jenjang: string[];
  jurusanSmk: string[];
  tingkat: string[];
  diskon: { id: string; jenis: string; tipeNominal: string; nominal: number }[];
};
type Tujuan = {
  jenjang: string; jurusan: string; label: string; tingkat: string;
  pilihanKelas: { kelas: string; nominal: number }[]; kelas: string; diskonId: string | null;
  hargaPokok: number; gelombangNama: string | null; gelombangDiskonPersen: number;
  gelombangDiskonNominal: number; gelombangDipertahankan: boolean;
  diskonNama: string | null; diskonNominal: number; totalTagihan: number;
  totalDibayar: number; sisaBayar: number; kelebihanBayar: number; menungguVerifikasi: number;
};

const kotak = { background: 'var(--adm-surface-alt)', border: '1px solid var(--adm-border)', borderRadius: 10, padding: 12 } as const;
const judulKecil = { fontSize: 10.5, fontWeight: 700, color: 'var(--adm-text-muted)', letterSpacing: 0.3, marginBottom: 6 } as const;
const inputGaya = { width: '100%', padding: '8px 10px', border: '1.5px solid var(--adm-border-strong)', borderRadius: 8, fontSize: 13, fontFamily: 'inherit', background: 'var(--adm-surface)' } as const;

function Baris({ label, nilai, tebal, warna }: { label: string; nilai: string; tebal?: boolean; warna?: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, fontSize: 12.5, padding: '3px 0', fontWeight: tebal ? 700 : 500, color: warna || 'var(--adm-text)' }}>
      <span>{label}</span><span style={{ whiteSpace: 'nowrap' }}>{nilai}</span>
    </div>
  );
}

// Mutasi / pindah pendaftar (SMA <-> SMK, antar-jurusan SMK). Semua angka
// pratinjau datang dari server (GET .../mutasi) — fungsi yang sama yang
// dipakai saat benar-benar memindahkan, jadi yang tampil = yang tersimpan.
export function MutasiModal({ pendaftarId, nama, onTutup, onBerhasil }: {
  pendaftarId: string;
  nama: string | null;
  onTutup: () => void;
  onBerhasil: (pesan: string) => void;
}) {
  const [dasar, setDasar] = useState<{ asal: Asal; pilihan: Pilihan } | null>(null);
  const [jenjang, setJenjang] = useState('');
  const [jurusan, setJurusan] = useState('');
  // Tingkat tujuan bebas (Kelas 10/11/12) — awalnya tingkat pendaftar sekarang.
  const [tingkat, setTingkat] = useState('');
  // '' = biarkan server memilih (tier program yang sama dengan sekarang bila ada).
  const [kelas, setKelas] = useState('');
  const [diskonId, setDiskonId] = useState('');
  const [alasan, setAlasan] = useState('');
  const [tujuan, setTujuan] = useState<Tujuan | null>(null);
  const [galat, setGalat] = useState('');
  const [memuat, setMemuat] = useState(false);
  const [menyimpan, setMenyimpan] = useState(false);

  useEffect(() => {
    fetch(`/api/admin/pendaftar/${pendaftarId}/mutasi`).then(async r => {
      const d = await r.json().catch(() => ({}));
      if (!r.ok) { setGalat(d.error || 'Gagal memuat data mutasi'); return; }
      setDasar(d.data);
      setDiskonId(d.data.asal.diskonId || '');
      setTingkat(d.data.asal.tingkat);
      // Asal SMA hanya punya satu tujuan (SMK) — langsung dipilihkan.
      if (d.data.pilihan.jenjang.length === 1) setJenjang(d.data.pilihan.jenjang[0]);
    });
  }, [pendaftarId]);

  const tujuanLengkap = !!jenjang && (jenjang !== 'smk' || !!jurusan);

  useEffect(() => {
    if (!dasar || !tujuanLengkap) { setTujuan(null); return; }
    const ac = new AbortController();
    const qs = new URLSearchParams({ jenjang, jurusan: jenjang === 'smk' ? jurusan : '', tingkat, kelas, diskonId });
    setMemuat(true);
    setGalat('');
    fetch(`/api/admin/pendaftar/${pendaftarId}/mutasi?${qs}`, { signal: ac.signal })
      .then(async r => {
        const d = await r.json().catch(() => ({}));
        if (!r.ok) { setTujuan(null); setGalat(d.error || 'Gagal menghitung pratinjau'); return; }
        setTujuan(d.data.tujuan);
      })
      .catch(() => {})
      .finally(() => { if (!ac.signal.aborted) setMemuat(false); });
    return () => ac.abort();
  }, [dasar, tujuanLengkap, jenjang, jurusan, tingkat, kelas, diskonId, pendaftarId]);

  const pilihJenjang = (j: string) => { setJenjang(j); setJurusan(''); setKelas(''); };

  const kirim = async () => {
    if (!dasar || !tujuan) return;
    if (!alasan.trim()) { setGalat('Alasan mutasi wajib diisi.'); return; }
    if (!confirm(`Pindahkan ${nama || 'pendaftar ini'} dari ${dasar.asal.label} ke ${tujuan.label}?\n\nNomor pendaftaran baru akan dibuat dan tagihan dihitung ulang mengikuti harga tujuan.`)) return;
    setMenyimpan(true);
    setGalat('');
    try {
      const r = await fetch(`/api/admin/pendaftar/${pendaftarId}/mutasi`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jenjang: tujuan.jenjang, jurusan: tujuan.jurusan, kelas: tujuan.kelas, diskonId: tujuan.diskonId || '', alasan: alasan.trim() }),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) { setGalat(d.error || 'Gagal memindahkan pendaftar'); return; }
      onBerhasil(`✅ Pendaftar dipindahkan ke ${tujuan.label}`);
    } finally {
      setMenyimpan(false);
    }
  };

  const bisaKirim = !!tujuan && !memuat && !menyimpan && !!alasan.trim();

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }} onClick={() => !menyimpan && onTutup()}>
      {/* Kepala & kaki tetap terlihat, hanya isi yang bergulir — tombol
          "Pindahkan" tidak boleh tersembunyi di bawah lipatan layar. */}
      <div style={{ background: 'var(--adm-surface)', borderRadius: 16, width: '100%', maxWidth: 560, maxHeight: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }} onClick={e => e.stopPropagation()}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--adm-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
          <h3 style={{ fontSize: 14.5, fontWeight: 700, color: 'var(--adm-text)', display: 'flex', alignItems: 'center', gap: 7 }}>
            <ArrowLeftRight size={16} /> Mutasi / Pindah Pendaftar — {nama}
          </h3>
          <button onClick={onTutup} aria-label="Tutup" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--adm-text-faint)' }}><XIcon size={18} /></button>
        </div>

        <div style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 14, overflowY: 'auto', flex: 1, minHeight: 0 }}>
          {!dasar ? (
            !galat && <p style={{ fontSize: 13, color: 'var(--adm-text-muted)' }}>Memuat…</p>
          ) : (
            <>
              <div style={kotak}>
                <div style={judulKecil}>POSISI SEKARANG</div>
                <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--adm-text)' }}>{dasar.asal.label}{dasar.asal.kelas && <span style={{ fontWeight: 500, color: 'var(--adm-text-muted)' }}> · {dasar.asal.kelas}</span>}</div>
                {dasar.asal.noPendaftaran && <div style={{ fontSize: 11.5, color: 'var(--adm-text-muted)', marginTop: 2 }}>No. <TeksKode teks={dasar.asal.noPendaftaran} /></div>}
                <div style={{ fontSize: 12, color: 'var(--adm-text-muted)', marginTop: 6 }}>
                  Tagihan {formatRupiah(dasar.asal.totalTagihan)} · Dibayar {formatRupiah(dasar.asal.totalDibayar)} · {dasar.asal.kelebihanBayar > 0 ? `Kelebihan ${formatRupiah(dasar.asal.kelebihanBayar)}` : `Sisa ${formatRupiah(dasar.asal.sisaBayar)}`}
                </div>
              </div>

              {dasar.pilihan.jenjang.length === 0 ? (
                <p style={{ fontSize: 13, color: 'var(--adm-text-muted)' }}>Belum ada tujuan yang harganya diatur di Panel Harga.</p>
              ) : (
                <div>
                  <div style={judulKecil}>PINDAH KE</div>
                  <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
                    {dasar.pilihan.jenjang.map(j => (
                      <button key={j} onClick={() => pilihJenjang(j)} style={{ flex: 1, padding: '9px 10px', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', border: `1.5px solid ${jenjang === j ? 'var(--adm-primary)' : 'var(--adm-border)'}`, background: jenjang === j ? 'var(--adm-primary-weak)' : 'var(--adm-surface)', color: jenjang === j ? 'var(--adm-primary)' : 'var(--adm-text)' }}>
                        {j.toUpperCase()}
                      </button>
                    ))}
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {jenjang === 'smk' && (
                      <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--adm-text)' }}>
                        Jurusan
                        <select value={jurusan} onChange={e => { setJurusan(e.target.value); setKelas(''); }} style={{ ...inputGaya, marginTop: 4 }}>
                          <option value="">— Pilih jurusan —</option>
                          {dasar.pilihan.jurusanSmk.map(j => <option key={j} value={j}>{j}</option>)}
                        </select>
                      </label>
                    )}
                    {jenjang && (
                      <div style={{ display: 'flex', gap: 10 }}>
                        <label style={{ flex: 1, fontSize: 12, fontWeight: 600, color: 'var(--adm-text)' }}>
                          Tingkat kelas
                          <select value={tingkat} onChange={e => { setTingkat(e.target.value); setKelas(''); }} style={{ ...inputGaya, marginTop: 4 }}>
                            {dasar.pilihan.tingkat.map(t => (
                              <option key={t} value={t}>{t}{t === dasar.asal.tingkat ? ' (sekarang)' : ''}</option>
                            ))}
                          </select>
                        </label>
                        {tujuan && (
                          <label style={{ flex: 1, fontSize: 12, fontWeight: 600, color: 'var(--adm-text)' }}>
                            Program
                            <select value={tujuan.kelas} onChange={e => setKelas(e.target.value)} style={{ ...inputGaya, marginTop: 4 }}>
                              {tujuan.pilihanKelas.map(k => (
                                <option key={k.kelas} value={k.kelas}>{labelTier(pecahKelasHarga(k.kelas).tier)} · {formatRupiah(k.nominal)}</option>
                              ))}
                            </select>
                          </label>
                        )}
                      </div>
                    )}
                    <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--adm-text)' }}>
                      Diskon
                      <select value={diskonId} onChange={e => setDiskonId(e.target.value)} style={{ ...inputGaya, marginTop: 4 }}>
                        <option value="">Tanpa diskon</option>
                        {dasar.pilihan.diskon.map(d => (
                          <option key={d.id} value={d.id}>{d.jenis} ({d.tipeNominal === 'persen' ? `${d.nominal}%` : formatRupiah(d.nominal)})</option>
                        ))}
                      </select>
                    </label>
                    <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--adm-text)' }}>
                      Alasan mutasi *
                      <textarea value={alasan} onChange={e => setAlasan(e.target.value)} placeholder="Contoh: Siswa & orang tua meminta pindah ke jurusan DKV." style={{ ...inputGaya, marginTop: 4, minHeight: 70, resize: 'vertical' }} />
                    </label>
                  </div>
                </div>
              )}

              {tujuan && (
                <div style={{ ...kotak, background: 'var(--adm-info-weak)', borderColor: 'var(--adm-info-border)', opacity: memuat ? 0.6 : 1 }}>
                  <div style={judulKecil}>TAGIHAN BARU SETELAH PINDAH</div>
                  <Baris label={`Harga ${tujuan.label} · ${tujuan.kelas}`} nilai={formatRupiah(tujuan.hargaPokok)} />
                  {tujuan.gelombangDiskonNominal > 0 && (
                    <Baris label={`Potongan ${tujuan.gelombangNama} (${tujuan.gelombangDiskonPersen}%)`} nilai={`−${formatRupiah(tujuan.gelombangDiskonNominal)}`} />
                  )}
                  <div style={{ fontSize: 11, color: 'var(--adm-text-muted)', margin: '1px 0 3px' }}>
                    {!tujuan.gelombangNama
                      ? `Tidak ada gelombang aktif di ${tujuan.jenjang.toUpperCase()} — tanpa potongan gelombang.`
                      : tujuan.gelombangDipertahankan
                        ? `${tujuan.gelombangNama} tetap dipakai (jenjang tidak berubah).`
                        : `${tujuan.gelombangNama} = gelombang ${tujuan.jenjang.toUpperCase()} yang sedang aktif.`}
                  </div>
                  {tujuan.diskonNominal > 0 && (
                    <Baris label={`Diskon ${tujuan.diskonNama}`} nilai={`−${formatRupiah(tujuan.diskonNominal)}`} />
                  )}
                  <div style={{ borderTop: '1px solid var(--adm-info-border)', margin: '6px 0' }} />
                  <Baris label="Total tagihan baru" nilai={formatRupiah(tujuan.totalTagihan)} tebal />
                  <div style={{ fontSize: 11, color: 'var(--adm-text-muted)', textAlign: 'right' }}>sebelumnya {formatRupiah(dasar.asal.totalTagihan)}</div>
                  <Baris label="Sudah dibayar (tetap tercatat)" nilai={formatRupiah(tujuan.totalDibayar)} />
                  {tujuan.sisaBayar > 0 ? (
                    <Baris label="Sisa tagihan" nilai={formatRupiah(tujuan.sisaBayar)} tebal warna="var(--adm-warning)" />
                  ) : tujuan.kelebihanBayar > 0 ? (
                    <Baris label="Kelebihan bayar" nilai={formatRupiah(tujuan.kelebihanBayar)} tebal warna="var(--adm-info)" />
                  ) : (
                    <Baris label="Status" nilai="Lunas" tebal warna="var(--adm-success)" />
                  )}
                  {tujuan.kelebihanBayar > 0 && (
                    <div style={{ fontSize: 11, color: 'var(--adm-text-muted)', marginTop: 2 }}>Kelebihan bayar bisa dikembalikan atau dialokasikan oleh Admin Keuangan di tab Keuangan.</div>
                  )}
                  {tujuan.menungguVerifikasi > 0 && (
                    <div style={{ fontSize: 11, color: 'var(--adm-text-muted)', marginTop: 2 }}>+ {formatRupiah(tujuan.menungguVerifikasi)} masih menunggu verifikasi, dihitung setelah diverifikasi.</div>
                  )}
                  <div style={{ fontSize: 11, color: 'var(--adm-text-muted)', marginTop: 8 }}>
                    Nomor pendaftaran baru dibuat untuk {tujuan.jenjang.toUpperCase()}; nomor lama{dasar.asal.noPendaftaran && <> (<TeksKode teks={dasar.asal.noPendaftaran} />)</>} disimpan di riwayat mutasi.
                  </div>
                </div>
              )}
            </>
          )}

          {galat && (
            <div style={{ background: 'var(--adm-danger-weak)', border: '1px solid var(--adm-danger-border)', borderRadius: 8, padding: '9px 12px', fontSize: 12.5, color: 'var(--adm-danger)' }}>{galat}</div>
          )}
        </div>

        <div style={{ display: 'flex', gap: 8, padding: '14px 20px', borderTop: '1px solid var(--adm-border)', flexShrink: 0 }}>
          <button onClick={onTutup} disabled={menyimpan} style={{ flex: 1, padding: '10px', background: 'var(--adm-neutral-weak)', border: '1px solid var(--adm-border)', borderRadius: 8, color: 'var(--adm-text)', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
            Batal
          </button>
          <button onClick={kirim} disabled={!bisaKirim} style={{ flex: 1, padding: '10px', background: 'var(--adm-primary)', border: 'none', borderRadius: 8, color: 'var(--adm-text-invert)', fontSize: 13, fontWeight: 700, cursor: bisaKirim ? 'pointer' : 'not-allowed', fontFamily: 'inherit', opacity: bisaKirim ? 1 : 0.5 }}>
            {menyimpan ? 'Memindahkan…' : 'Pindahkan'}
          </button>
        </div>
      </div>
    </div>
  );
}
