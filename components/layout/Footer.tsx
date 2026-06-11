import Link from 'next/link';
import Image from 'next/image';
import { GraduationCap, Phone, Mail, MapPin, Share2, MessageCircle, Play, Clock1, Clock2Icon, Clock12Icon } from 'lucide-react';
import {
  FaInstagram,
  FaYoutube,
  FaWhatsapp,
  FaFacebookF,
  FaTiktok,
} from 'react-icons/fa';

export default function Footer() {
  return (
    <footer style={{ background: '#0B3D2E ', color: 'white', borderTop: '2px solid #C8973A' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '60px 24px 30px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 40, marginBottom: 40 }}>
          
          {/* Brand */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <div
                style={{
                  width: 50,
                  height: 50,
                  position: 'relative',
                  overflow: 'hidden',
                  borderRadius: 8,
                  flexShrink: 0,
                }}
              >
                <Image
                  src="/images/logo.png"
                  alt="Logo SMK Citra Negara"
                  fill
                  style={{
                    objectFit: 'contain',
                  }}
                />
              </div>
              <div>
                <div style={{ fontWeight: 800, fontSize: 15 }}>SMK Citra Negara</div>
                <div style={{ fontSize: 11, color: '#C8973A' }}>Terakreditasi A</div>
              </div>
            </div>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', lineHeight: 1.7, marginBottom: 20 }}>
              Sekolah Menengah Kejuruan unggulan yang mencetak generasi profesional, berkarakter, dan siap kerja.
            </p>
            <div style={{ display: 'flex', gap: 12 }}>
 <a
  href="https://instagram.com/smkcitranegaradepok"
  target="_blank"
  rel="noopener noreferrer"
  style={{
    width: 40,
    height: 40,
    background: 'rgba(200,151,58,0.15)',
    borderRadius: 10,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#C8973A', // warna icon
    textDecoration: 'none',
  }}
>
  <FaInstagram size={18} />
</a>

 <a
  href="https://youtube.com/@citranegaratv9070"
  target="_blank"
  rel="noopener noreferrer"
  style={{
    width: 40,
    height: 40,
    background: 'rgba(200,151,58,0.15)',
    borderRadius: 10,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#C8973A', // warna icon
    textDecoration: 'none',
  }}
>
  <FaYoutube size={18} />
</a>

 <a
  href="https://facebook.com/smkcitranegaraofficial"
  target="_blank"
  rel="noopener noreferrer"
  style={{
    width: 40,
    height: 40,
    background: 'rgba(200,151,58,0.15)',
    borderRadius: 10,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#C8973A', // warna icon
    textDecoration: 'none',
  }}
>
  <FaFacebookF size={18} />
</a>

<a
  href="https://tiktok.com/@smkcnofficial"
  target="_blank"
  rel="noopener noreferrer"
  style={{
    width: 40,
    height: 40,
    background: 'rgba(200,151,58,0.15)',
    borderRadius: 10,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#C8973A',
    textDecoration: 'none',
    transition: 'all 0.2s',
  }}
>
  <FaTiktok size={18} />
</a>

 <a
  href="https://wa.me/6281325269477"
  target="_blank"
  rel="noopener noreferrer"
  style={{
    width: 40,
    height: 40,
    background: 'rgba(200,151,58,0.15)',
    borderRadius: 10,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#C8973A', // warna icon
    textDecoration: 'none',
  }}
>
  <FaWhatsapp size={18} />
</a>



  
</div>
          </div>

          {/* Links */}
          <div>
            <h4 style={{ fontWeight: 700, marginBottom: 16, fontSize: 14, color: '#C8973A' }}>Menu Utama</h4>
            {[
              { href: '/', label: 'Beranda' },
              { href: '/tentang', label: 'Tentang Kami' },
              { href: '/jurusan', label: 'Program Keahlian' },
              { href: '/spmb', label: 'SPMB Online' },
              { href: '/login', label: 'Login Siswa' },
            ].map(link => (
              <Link key={link.href} href={link.href} style={{
                display: 'block', color: 'rgba(255,255,255,0.6)',
                textDecoration: 'none', fontSize: 13, padding: '5px 0',
                transition: 'color 0.2s',
              }}
              onMouseEnter={e => (e.currentTarget.style.color = '#C8973A')}
              onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.6)')}
              >→ {link.label}</Link>
            ))}
          </div>

          {/* Jurusan */}
          <div>
            <h4 style={{ fontWeight: 700, marginBottom: 16, fontSize: 14, color: '#C8973A' }}>Program Keahlian</h4>
            {[
              'Teknik Jaringan Komputer dan Telekomunikasi (TJKT)',
              'Pengembangan Perangkat Lunak dan Gim (PPLG)',
              'Manajemen Perkantoran dan Layanan Bisnis (MPLB)',
              'Desain Komunikasi Visual (DKV)',
              'Pemasaran (PM)',
              'Perhotelan (PH)',
            ].map(j => (
              <div key={j} style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13, padding: '5px 0' }}>
                 {j}
              </div>
            ))}
          </div>

          {/* Kontak */}
          <div>
            <h4 style={{ fontWeight: 700, marginBottom: 16, fontSize: 14, color: '#C8973A' }}>Kontak</h4>
            {[
              { Icon: MapPin, text: 'Jl. Tanah Baru Jl. Kemiri Jaya No.99, Beji, Kecamatan Beji, Kota Depok, Jawa Barat 16421' },
              { Icon: Phone, text: '(021) 7720-1052 / WA: 0813-2526-9477' },
              { Icon: Mail, text: 'info@citranegara.sch.id' },
              { Icon: Clock12Icon, text: 'Senin - Jumat: 07:00 - 15:30 | Sabtu - Minggu: 07:00 - 13:00' },
            ].map(({ Icon, text }, i) => (
              <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 12, alignItems: 'flex-start' }}>
                <Icon size={14} color="#C8973A" style={{ marginTop: 3, flexShrink: 0 }} />
                <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', lineHeight: 1.5 }}>{text}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={{
          borderTop: '1px solid rgba(255,255,255,0.1)',
          paddingTop: 20,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 10,
        }}>
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>
            © 2026 SMK Citra Negara. All rights reserved.
          </p>
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>
            SPMB v1.0 team 5
          </p>
        </div>
      </div>
    </footer>
  );
}
