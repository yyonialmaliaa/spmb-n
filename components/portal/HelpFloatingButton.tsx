'use client';

// =====================================================================
// Tombol bantuan mengambang — menggantikan card "Butuh Bantuan?" yang
// dulu permanen memakan tempat di dashboard. Kontaknya SAMA PERSIS
// (telepon/WhatsApp/email sekolah), cuma bentuknya jadi sekunder/opsional
// supaya tidak mengambil ruang utama.
// =====================================================================

import { useEffect, useRef, useState } from 'react';
import { CircleHelp, X, Phone, MessageCircle, Mail } from 'lucide-react';

const KONTAK = {
  telepon: '(021) 7720-1052',
  teleponHref: 'tel:+622177201052',
  email: 'info@citranegara.sch.id',
  emailHref: 'mailto:info@citranegara.sch.id',
};

// Nomor WhatsApp beda per jenjang — SMP punya admin pendaftaran sendiri,
// terpisah dari SMA/SMK.
function getWhatsapp(jenjang?: string): { nomor: string; href: string } {
  if (jenjang === 'smp') return { nomor: '0878-7872-4527', href: 'https://wa.me/6287878724527' };
  return { nomor: '0813-2526-9477', href: 'https://wa.me/6281325269477' };
}

const CSS = `
  @keyframes helpPanelIn {
    from { opacity: 0; transform: translateY(8px) scale(0.98); }
    to   { opacity: 1; transform: translateY(0) scale(1); }
  }
  .help-fab {
    position: fixed;
    right: 20px;
    bottom: 24px;
    z-index: 150;
  }
  @media (max-width: 860px) {
    .help-fab { bottom: 78px; right: 16px; }
    /* Di mobile cukup lingkaran ber-ikon — labelnya tetap ada untuk
       screen reader (lihat aria-label pada tombol), cuma disembunyikan
       secara visual supaya tombol tidak memakan tempat. */
    .help-fab-btn { padding: 12px !important; border-radius: 50% !important; }
    .help-fab-label { display: none; }
  }
  .help-fab-btn:hover { background: #123524; }
  .help-fab-btn:focus-visible { outline: 2px solid #E8B84B; outline-offset: 2px; }
  .help-contact-link:hover { background: var(--adm-warning-weak) !important; }
  .help-contact-link:focus-visible { outline: 2px solid #C8973A; outline-offset: 2px; }
`;

export default function HelpFloatingButton({ jenjang }: { jenjang?: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const whatsapp = getWhatsapp(jenjang);

  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { setOpen(false); buttonRef.current?.focus(); }
    };
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="help-fab">
      <style>{CSS}</style>

      {open && (
        <div
          role="dialog"
          aria-label="Panel bantuan"
          style={{
            position: 'absolute', bottom: '100%', right: 0, marginBottom: 12,
            width: 288, maxWidth: '82vw', background: 'var(--adm-surface)', borderRadius: 14,
            border: '1px solid var(--adm-border)', boxShadow: '0 16px 40px rgba(10,22,40,0.18)',
            overflow: 'hidden', animation: 'helpPanelIn 0.16s ease-out',
          }}
        >
          <div style={{ background: '#0B2A1C', padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ color: 'white', fontSize: 14, fontWeight: 700 }}>Perlu Bantuan?</span>
            <button
              onClick={() => setOpen(false)}
              aria-label="Tutup panel bantuan"
              style={{ background: 'rgba(255,255,255,0.12)', border: 'none', borderRadius: 6, width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
            >
              <X size={13} color="white" />
            </button>
          </div>

          <div style={{ padding: '14px 16px' }}>
            <p style={{ fontSize: 12.5, color: 'var(--adm-text-muted)', lineHeight: 1.6, margin: '0 0 14px' }}>
              Hubungi kami jika Anda memiliki pertanyaan seputar SPMB.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <ContactLink href={KONTAK.teleponHref} icon={Phone} label="Hubungi Admin" value={KONTAK.telepon} />
              <ContactLink href={whatsapp.href} icon={MessageCircle} label="WhatsApp" value={whatsapp.nomor} external />
              <ContactLink href={KONTAK.emailHref} icon={Mail} label="Email" value={KONTAK.email} />
            </div>
          </div>
        </div>
      )}

      <button
        ref={buttonRef}
        onClick={() => setOpen(v => !v)}
        aria-label={open ? 'Tutup bantuan' : 'Buka bantuan'}
        aria-expanded={open}
        title="Bantuan"
        style={{
          display: 'flex', alignItems: 'center', gap: 8,
          background: '#0B2A1C', color: 'white', border: '1.5px solid #C8973A',
          borderRadius: 999, padding: '11px 18px 11px 14px', cursor: 'pointer',
          fontSize: 13, fontWeight: 700, fontFamily: 'inherit',
          boxShadow: '0 6px 18px rgba(10,22,40,0.22)',
        }}
        className="help-fab-btn"
      >
        <CircleHelp size={18} color="#E8B84B" />
        <span className="help-fab-label">Bantuan</span>
      </button>
    </div>
  );
}

function ContactLink({ href, icon: Icon, label, value, external }: { href: string; icon: any; label: string; value: string; external?: boolean }) {
  return (
    <a
      href={href}
      className="help-contact-link"
      {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
      style={{
        display: 'flex', alignItems: 'center', gap: 10, padding: '9px 10px',
        borderRadius: 9, textDecoration: 'none', background: 'var(--adm-surface-alt)',
        border: '1px solid var(--adm-border)',
      }}
    >
      <span style={{ width: 30, height: 30, borderRadius: '50%', background: 'var(--adm-warning-weak)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Icon size={14} color="var(--adm-warning)" />
      </span>
      <span style={{ minWidth: 0 }}>
        <span style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--adm-text)' }}>{label}</span>
        <span style={{ display: 'block', fontSize: 11.5, color: 'var(--adm-text-muted)' }}>{value}</span>
      </span>
    </a>
  );
}
