'use client';

import { useCallback, useState } from 'react';
import { KeyRound, Plus, ShieldCheck, Trash2 } from 'lucide-react';
import { TopHeader } from '@/components/admin/TopHeader';
import { useAdmin } from '@/components/admin/AdminProvider';
import { useMuatData, ambilJson } from '@/components/admin/useMuatData';
import {
  ConfirmModal, EmptyState, ErrorState, Modal, SkeletonTabel, StatusBadge, Toast,
} from '@/components/admin/ui';
import { LABEL_ROLE, DESKRIPSI_ROLE, ROLE_ADMIN_LIST, type Role } from '@/lib/permissions';
import { JENJANG_LABEL_FULL, inisial, type Jenjang } from '@/lib/labels';

// ============================================================================
// PENGGUNA ADMIN — khusus Super Admin.
//
// Peran dan SCOPE dipisah, sesuai spesifikasi: tidak ada "Admin SMP" sebagai
// peran. Yang ada adalah peran (Super Admin / Admin SPMB / Admin Keuangan)
// dengan scope jenjang opsional. Scope kosong = boleh semua jenjang.
// ============================================================================

interface Akun {
  id: string;
  email: string;
  namaLengkap: string | null;
  role: Role;
  aktif: boolean;
  scopeJenjang: string | null;
  lastLoginAt: string | null;
  createdAt: string;
}

const JENJANG: Jenjang[] = ['smp', 'sma', 'smk'];

const tglJam = (v: string | null) =>
  v ? new Date(v).toLocaleString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Belum pernah';

export default function PenggunaPage() {
  const { user } = useAdmin();

  const [toast, setToast] = useState<string | null>(null);
  const [tambah, setTambah] = useState(false);
  const [hapus, setHapus] = useState<Akun | null>(null);
  const [resetFor, setResetFor] = useState<Akun | null>(null);
  const [passwordBaru, setPasswordBaru] = useState('');
  const [memproses, setMemproses] = useState(false);

  const [form, setForm] = useState({
    email: '', namaLengkap: '', password: '', role: 'admin_spmb' as Role, scopeJenjang: '',
  });

  const beriToast = (m: string) => { setToast(m); setTimeout(() => setToast(null), 3500); };

  const ambil = useCallback(
    async (sinyal: AbortSignal) => (await ambilJson<{ data: Akun[] }>('/api/admin/pengguna', sinyal)).data ?? [],
    [],
  );
  const { data, loading, gagal, muatUlang } = useMuatData(ambil, []);
  const rows = data ?? [];

  const ubah = async (a: Akun, patch: Record<string, unknown>, pesan: string) => {
    const res = await fetch(`/api/admin/pengguna/${a.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    });
    const j = await res.json().catch(() => null);
    if (!res.ok) { beriToast(j?.error || 'Gagal menyimpan'); return; }
    beriToast(pesan);
    muatUlang();
  };

  const simpanBaru = async () => {
    setMemproses(true);
    try {
      const res = await fetch('/api/admin/pengguna', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, scopeJenjang: form.scopeJenjang || null }),
      });
      const j = await res.json().catch(() => null);
      if (!res.ok) { beriToast(j?.error || 'Gagal membuat akun'); return; }
      beriToast(`Akun ${form.email} dibuat`);
      setTambah(false);
      setForm({ email: '', namaLengkap: '', password: '', role: 'admin_spmb', scopeJenjang: '' });
      muatUlang();
    } finally { setMemproses(false); }
  };

  const simpanReset = async () => {
    if (!resetFor) return;
    if (passwordBaru.length < 8) { beriToast('Password minimal 8 karakter'); return; }
    setMemproses(true);
    try {
      const res = await fetch('/api/admin/reset-password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: resetFor.id, passwordBaru }),
      });
      const j = await res.json().catch(() => null);
      if (!res.ok) { beriToast(j?.error || 'Gagal mereset password'); return; }
      beriToast(`Password ${resetFor.email} direset`);
      setResetFor(null);
      setPasswordBaru('');
    } finally { setMemproses(false); }
  };

  const konfirmasiHapus = async () => {
    if (!hapus) return;
    setMemproses(true);
    try {
      const res = await fetch(`/api/admin/pengguna/${hapus.id}`, { method: 'DELETE' });
      const j = await res.json().catch(() => null);
      if (!res.ok) { beriToast(j?.error || 'Gagal menghapus'); return; }
      beriToast('Akun dihapus');
      setHapus(null);
      muatUlang();
    } finally { setMemproses(false); }
  };

  return (
    <>
      <Toast pesan={toast} />
      <TopHeader
        judul="Pengguna Admin"
        subjudul="Kelola akun dan wewenang petugas SPMB."
        remah={[{ label: 'Sistem' }, { label: 'Pengguna Admin' }]}
        aksi={
          <button className="adm-btn adm-btn--primary adm-btn--sm" onClick={() => setTambah(true)}>
            <Plus size={14} /> Tambah Admin
          </button>
        }
      />

      <div className="adm-content">
        <div className="adm-banner adm-banner--info" style={{ marginBottom: 18 }}>
          <ShieldCheck size={15} style={{ flexShrink: 0, marginTop: 1 }} />
          <div>
            <strong>Peran</strong> menentukan apa yang boleh dilakukan; <strong>scope jenjang</strong> menentukan
            data jenjang mana yang boleh dibuka. Keduanya terpisah — tidak ada peran &ldquo;Admin SMP&rdquo;,
            yang ada adalah Admin SPMB dengan scope SMP.
          </div>
        </div>

        <div className="adm-card">
          <div className="adm-card-head">
            <div className="adm-card-title">Daftar Akun Admin</div>
            <span style={{ fontSize: 12, color: 'var(--adm-text-muted)' }}>
              {loading ? '…' : `${rows.length} akun`}
            </span>
          </div>

          {loading ? (
            <SkeletonTabel baris={4} kolom={6} />
          ) : gagal ? (
            <ErrorState onCoba={muatUlang} />
          ) : rows.length === 0 ? (
            <EmptyState judul="Belum ada akun admin" />
          ) : (
            <div className="adm-table-wrap">
              <table className="adm-table">
                <thead>
                  <tr>
                    <th>Nama</th>
                    <th style={{ width: 190 }}>Peran</th>
                    <th style={{ width: 150 }}>Scope Jenjang</th>
                    <th style={{ width: 110 }}>Status</th>
                    <th>Terakhir Login</th>
                    <th style={{ width: 110, textAlign: 'right' }}>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map(a => {
                    const sayaSendiri = a.id === user.userId;
                    return (
                      <tr key={a.id}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <span className="adm-avatar" style={{ width: 30, height: 30, fontSize: 11 }}>
                              {inisial(a.namaLengkap || a.email)}
                            </span>
                            <div>
                              <div style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 7 }}>
                                {a.namaLengkap || '—'}
                                {sayaSendiri && <StatusBadge teks="Anda" nada="info" />}
                              </div>
                              <div style={{ fontSize: 11.5, color: 'var(--adm-text-muted)' }}>{a.email}</div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <select
                            className="adm-select"
                            style={{ fontSize: 12, padding: '5px 8px' }}
                            value={a.role}
                            disabled={sayaSendiri}
                            title={sayaSendiri ? 'Anda tidak dapat mengubah peran akun sendiri' : undefined}
                            onChange={e => ubah(a, { role: e.target.value }, 'Peran diperbarui')}
                          >
                            {ROLE_ADMIN_LIST.map(r => <option key={r} value={r}>{LABEL_ROLE[r]}</option>)}
                          </select>
                        </td>
                        <td>
                          <select
                            className="adm-select"
                            style={{ fontSize: 12, padding: '5px 8px' }}
                            value={a.scopeJenjang ?? ''}
                            onChange={e => ubah(a, { scopeJenjang: e.target.value || null }, 'Scope jenjang diperbarui')}
                          >
                            <option value="">Semua jenjang</option>
                            {JENJANG.map(j => <option key={j} value={j}>{JENJANG_LABEL_FULL[j]}</option>)}
                          </select>
                        </td>
                        <td>
                          <button
                            onClick={() => ubah(a, { aktif: !a.aktif }, a.aktif ? 'Akun dinonaktifkan' : 'Akun diaktifkan')}
                            disabled={sayaSendiri}
                            style={{ background: 'none', border: 'none', padding: 0, cursor: sayaSendiri ? 'not-allowed' : 'pointer' }}
                            title={sayaSendiri ? 'Anda tidak dapat menonaktifkan akun sendiri' : 'Klik untuk mengubah'}
                          >
                            <StatusBadge teks={a.aktif ? 'Aktif' : 'Nonaktif'} nada={a.aktif ? 'sukses' : 'netral'} />
                          </button>
                        </td>
                        <td style={{ fontSize: 12.5, color: a.lastLoginAt ? undefined : 'var(--adm-text-faint)' }}>
                          {tglJam(a.lastLoginAt)}
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', gap: 6 }}>
                            <button
                              className="adm-btn adm-btn--ghost adm-btn--sm"
                              onClick={() => { setResetFor(a); setPasswordBaru(''); }}
                              aria-label={`Reset password ${a.email}`}
                              title="Reset password"
                            >
                              <KeyRound size={13} />
                            </button>
                            <button
                              className="adm-btn adm-btn--danger adm-btn--sm"
                              onClick={() => setHapus(a)}
                              disabled={sayaSendiri}
                              aria-label={`Hapus ${a.email}`}
                              title={sayaSendiri ? 'Anda tidak dapat menghapus akun sendiri' : 'Hapus akun'}
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {tambah && (
        <Modal
          judul="Tambah Akun Admin"
          onTutup={() => setTambah(false)}
          footer={
            <>
              <button className="adm-btn adm-btn--ghost" onClick={() => setTambah(false)} disabled={memproses}>Batal</button>
              <button className="adm-btn adm-btn--primary" onClick={simpanBaru} disabled={memproses}>
                {memproses ? 'Menyimpan…' : 'Buat Akun'}
              </button>
            </>
          }
        >
          <div style={{ display: 'grid', gap: 14 }}>
            <div>
              <label className="adm-label" htmlFor="nm">Nama lengkap</label>
              <input id="nm" className="adm-input" value={form.namaLengkap} onChange={e => setForm(f => ({ ...f, namaLengkap: e.target.value }))} placeholder="Nama petugas" />
            </div>
            <div>
              <label className="adm-label" htmlFor="em">Email</label>
              <input id="em" className="adm-input" type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="petugas@citranegara.sch.id" />
            </div>
            <div>
              <label className="adm-label" htmlFor="pw">Password awal</label>
              <input id="pw" className="adm-input" type="text" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} placeholder="Minimal 8 karakter" />
              <p style={{ fontSize: 11.5, color: 'var(--adm-text-muted)', marginTop: 5 }}>
                Sampaikan password ini langsung kepada petugas dan minta segera diganti.
              </p>
            </div>
            <div>
              <label className="adm-label" htmlFor="rl">Peran</label>
              <select id="rl" className="adm-select" value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value as Role }))}>
                {ROLE_ADMIN_LIST.map(r => <option key={r} value={r}>{LABEL_ROLE[r]}</option>)}
              </select>
              <p style={{ fontSize: 11.5, color: 'var(--adm-text-muted)', marginTop: 5 }}>{DESKRIPSI_ROLE[form.role]}</p>
            </div>
            <div>
              <label className="adm-label" htmlFor="sc">Scope jenjang</label>
              <select id="sc" className="adm-select" value={form.scopeJenjang} onChange={e => setForm(f => ({ ...f, scopeJenjang: e.target.value }))}>
                <option value="">Semua jenjang</option>
                {JENJANG.map(j => <option key={j} value={j}>{JENJANG_LABEL_FULL[j]}</option>)}
              </select>
            </div>
          </div>
        </Modal>
      )}

      {resetFor && (
        <Modal
          judul={`Reset password ${resetFor.email}`}
          onTutup={() => setResetFor(null)}
          footer={
            <>
              <button className="adm-btn adm-btn--ghost" onClick={() => setResetFor(null)} disabled={memproses}>Batal</button>
              <button className="adm-btn adm-btn--primary" onClick={simpanReset} disabled={memproses}>
                {memproses ? 'Menyimpan…' : 'Reset Password'}
              </button>
            </>
          }
        >
          <label className="adm-label" htmlFor="pwb">Password baru</label>
          <input id="pwb" className="adm-input" type="text" value={passwordBaru} onChange={e => setPasswordBaru(e.target.value)} placeholder="Minimal 8 karakter" />
          <p style={{ fontSize: 12, color: 'var(--adm-text-muted)', marginTop: 8 }}>
            Tindakan ini tercatat di jejak audit.
          </p>
        </Modal>
      )}

      {hapus && (
        <ConfirmModal
          judul="Hapus akun admin?"
          pesan={`Akun ${hapus.email} (${LABEL_ROLE[hapus.role]}) akan dihapus permanen dan tidak dapat login lagi.`}
          labelKonfirmasi="Hapus Akun"
          nada="danger"
          memproses={memproses}
          onBatal={() => setHapus(null)}
          onKonfirmasi={konfirmasiHapus}
        />
      )}
    </>
  );
}
