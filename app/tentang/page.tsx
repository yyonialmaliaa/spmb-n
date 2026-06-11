'use client';
import Image from 'next/image';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { Target, Eye } from 'lucide-react';

/* ══════════════════════════════════════════
   KOMPONEN STRUKTUR ORGANISASI
══════════════════════════════════════════ */
function Box({ name, label, variant = 'default', wide = false }: {
  name: string; label: string; variant?: string; wide?: boolean;
}) {
  const styles: Record<string, { bg: string; border: string; nameColor: string; labelColor: string }> = {
    default: { bg: 'white',                                    border: '#E2D9C8', nameColor: '#0A1628', labelColor: '#6B7280' },
    dark:    { bg: '#023d17',                                  border: '#C8973A', nameColor: 'white',   labelColor: '#C8973A' },
    gold:    { bg: 'linear-gradient(135deg,#C8973A,#E8B84B)', border: '#C8973A', nameColor: '#0A1628', labelColor: '#0A1628' },
    cream:   { bg: '#FAF7F0',                                  border: '#E2D9C8', nameColor: '#0A1628', labelColor: '#6B7280' },
  };
  const s = styles[variant] ?? styles.default;
  return (
    <div style={{
      background: s.bg, border: `1.5px solid ${s.border}`, borderRadius: 9,
      padding: '8px 14px', textAlign: 'center',
      minWidth: wide ? 220 : 148, maxWidth: wide ? 260 : 200,
      boxShadow: '0 2px 8px rgba(0,0,0,0.06)', flexShrink: 0,
    }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: s.nameColor, lineHeight: 1.35 }}>{name}</div>
      <div style={{ fontSize: 10, color: s.labelColor, marginTop: 2, fontWeight: 600 }}>{label}</div>
    </div>
  );
}

const VLine = ({ h = 18 }: { h?: number }) => (
  <div style={{ width: 2, height: h, background: '#C8973A', alignSelf: 'center', flexShrink: 0 }} />
);
const HLine = ({ w = 32 }: { w?: number }) => (
  <div style={{ height: 2, width: w, background: '#C8973A', alignSelf: 'center', flexShrink: 0 }} />
);
function VCol({ children }: { children: React.ReactNode }) {
  return <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>{children}</div>;
}

function StrukturOrganisasi() {
  return (
    <section style={{ padding: '70px 16px', background: 'white', overflowX: 'auto' }}>
      <div style={{ maxWidth: 1280, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <div style={{ width: 3, height: 32, background: 'linear-gradient(#C8973A,#E8B84B)', margin: '0 auto 16px', borderRadius: 2 }} />
          <h2 style={{ fontFamily: 'Georgia, serif', fontSize: 36, color: '#0A1628', margin: 0 }}>Struktur Organisasi</h2>
          <p style={{ color: '#C8973A', fontWeight: 700, marginTop: 6, fontSize: 14, letterSpacing: 1 }}>SMK CITRA NEGARA</p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 1100 }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <Box name="Dr. M. Rizki Darmaguna Hasan, S.Tr., M.Pd" label="Ketua BPH" variant="gold" wide />
            <HLine w={40} />
            <Box name="Hj. Mutiah, S.Pd., MM" label="Advisor BPH" />
          </div>
          <VLine />
          <Box name="Agustin Wijayanti, S.H., MM" label="Wakil Ketua BPH" />
          <VLine />
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <Box name="Mursyid Waskito, MT" label="Ketua Komite" variant="cream" />
            <HLine w={32} />
            <Box name="Abdul Kodir Zaelani, S.Pd.I" label="Kepala SMK Citra Negara" variant="dark" wide />
          </div>
          <VLine h={24} />

          {/* 6 Divisi */}
          <div style={{ display: 'flex', alignItems: 'flex-start', width: '100%', justifyContent: 'space-between', position: 'relative' }}>
            <div style={{ position: 'absolute', top: 0, left: '8%', right: '8%', height: 2, background: '#C8973A' }} />

            <VCol>
              <VLine h={16} />
              <Box name="Endang Eva Yurita, MM" label="Waka Kurikulum" />
              <VLine />
              <div style={{ display: 'flex', gap: 8 }}>
                <VCol>
                  <Box name="Tubagus Soca, S.Kom" label="Kaprog TJKT" variant="cream" />
                  <VLine h={10} />
                  <Box name="Nurhakim Wirasena, S.IKom" label="Kaprog DKV" variant="cream" />
                  <VLine h={10} />
                  <Box name="Nurul Pratiwi" label="Kaprog PM" variant="cream" />
                </VCol>
                <VCol>
                  <Box name="Satria Yudha, S.Kom" label="Kaprog PPLG & BKK" variant="cream" />
                  <VLine h={10} />
                  <Box name="Ebon Sunarti, S.Pd" label="Kaprog MPLB" variant="cream" />
                </VCol>
              </div>
              <VLine h={10} />
              <Box name="Salmah, S.Pd" label="BK & Piket Gedung A" variant="cream" />
            </VCol>

            <VCol>
              <VLine h={16} />
              <Box name="Ir. Lukman Kharis, M.Pd" label="Waka Humas" />
              <VLine />
              <Box name="Rista Bagus H. Handoko, S.Pd" label="Pembina Kedisiplinan Siswa" variant="cream" />
              <VLine h={10} />
              <Box name="Fikri Zaenurihal, S.Pd" label="Pembina IRMA" variant="cream" />
              <VLine h={10} />
              <Box name="Helmi Fathurrahman, S.Pd" label="BK & Piket Gedung C" variant="cream" />
            </VCol>

            <VCol>
              <VLine h={16} />
              <Box name="M. Djunaedi Lubis, S.Sn" label="Waka Kesiswaan" />
              <VLine />
              <Box name="Moh. Aries S.Hum, M.Pd" label="Pembina OSIS" variant="cream" />
              <VLine h={10} />
              <Box name="Rustandi, M.Pd" label="SARPRAS" variant="cream" />
              <VLine h={10} />
              <Box name="Zahara Maharani, S.Pd" label="BK & Piket Gedung D & E" variant="cream" />
            </VCol>

            <VCol>
              <VLine h={16} />
              <Box name="Decky Ryansyah, M.Kom" label="Kepala IT" />
              <VLine />
              <Box name="Hari Suryanto, A.Md" label="Medsos" variant="cream" />
              <VLine h={10} />
              <Box name="Dita Aprilya SP" label="Media Kreatif" variant="cream" />
              <VLine h={10} />
              <Box name="Alvino Andina Rahman, S.Pd" label="Desain Grafis" variant="cream" />
              <VLine h={10} />
              <Box name="Nazwan" label="Server" variant="cream" />
              <VLine h={10} />
              <Box name="M. Nugraha" label="Teknisi" variant="cream" />
            </VCol>

            <VCol>
              <VLine h={16} />
              <Box name="Dina Sundari Wijaya, SE" label="KA TU Keuangan" />
              <VLine />
              <Box name="Andi Septiani Nabillah" label="Staff TU Keuangan" variant="cream" />
              <VLine h={10} />
              <Box name="Siti Afifah N, S.Pd" label="Staff TU Keuangan" variant="cream" />
              <VLine h={10} />
              <Box name="Nindi Tiara, S.Pd" label="Admin Kurikulum & Keuangan" variant="cream" />
              <VLine h={10} />
              <Box name="Naviyanti, S.Pd" label="Admin Kurikulum & Keuangan" variant="cream" />
              <VLine h={10} />
              <Box name="Imam Suzzai, S.IKom" label="Bendahara BOS" variant="cream" />
            </VCol>

            <VCol>
              <VLine h={16} />
              <Box name="Rohmat" label="Kepala TU & DAPODIK" />
              <VLine />
              <Box name="Seta Fitriana, A.Md" label="Logistik" variant="cream" />
              <VLine h={10} />
              <Box name="Yeni Herawati, S.Kom" label="Admin Keguruan" variant="cream" />
              <VLine h={10} />
              <Box name="Lia Lestari" label="Admin Kesiswaan" variant="cream" />
              <VLine h={10} />
              <Box name="Fitri Yanti" label="Perpustakaan" variant="cream" />
              <VLine h={10} />
              <Box name="Nandhita D.H, S.Pd" label="Seragam, BTBA & Piket Gedung D" variant="cream" />
              <VLine h={10} />
              <Box name="Putri Irmawati" label="Seragam, BTBA & Piket Gedung E" variant="cream" />
            </VCol>
          </div>

          <VLine h={24} />
          <div style={{ background: '#FAF7F0', border: '1.5px solid #C8973A', borderRadius: 10, padding: '10px 60px', fontWeight: 800, color: '#0A1628', fontSize: 14, letterSpacing: 2 }}>WALAS</div>
          <VLine />
          <div style={{ background: '#FAF7F0', border: '1.5px solid #C8973A', borderRadius: 10, padding: '10px 60px', fontWeight: 800, color: '#0A1628', fontSize: 14, letterSpacing: 2 }}>GURU</div>
          <VLine />
          <div style={{ background: 'linear-gradient(135deg,#C8973A,#E8B84B)', border: '1.5px solid #C8973A', borderRadius: 10, padding: '10px 60px', fontWeight: 800, color: '#0A1628', fontSize: 14, letterSpacing: 2 }}>PESERTA DIDIK</div>
        </div>
      </div>
    </section>
  );
}

/* ══════════════════════════════════════════
   HALAMAN TENTANG (tanpa section Prestasi)
══════════════════════════════════════════ */
export default function TentangPage() {
  return (
    <>
      <Navbar />
      <main>

        {/* Hero */}
        <section className="hero-gradient" style={{ padding: '80px 24px' }}>
          <div style={{ maxWidth: 800, margin: '0 auto', textAlign: 'center' }}>
            <div className="flex justify-center mb-6">
              <div style={{ width: 200, height: 200, borderRadius: 10, overflow: 'hidden', position: 'relative' }}>
                <Image src="/images/logo.png" alt="Logo SMK Citra Negara" width={200} height={200} style={{ objectFit: 'cover' }} />
              </div>
            </div>
            <h1 className="font-display" style={{ fontSize: 48, color: 'white', marginBottom: 16 }}>Tentang SMK Citra Negara</h1>
            <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 17, lineHeight: 1.7, maxWidth: 580, margin: '0 auto' }}>
              Berdiri sejak 2004, kami telah menjadi institusi pendidikan kejuruan terkemuka yang menghasilkan lulusan siap kerja dan berkarakter.
            </p>
          </div>
        </section>

        {/* Visi Misi */}
        <section style={{ padding: '80px 24px', background: 'white' }}>
          <div style={{ maxWidth: 1100, margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: 56 }}>
              <div className="gold-line" style={{ margin: '0 auto 16px' }} />
              <h2 className="font-display" style={{ fontSize: 38, color: '#0A1628' }}>Visi & Misi</h2>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
              {[
                { icon: Eye, title: 'Visi', color: '#023d17', content: 'Terwujudnya Sekolah Kejujuran yang Religius, Disiplin dan Terampil Dalam Menyongsong Generasi Emas di Tahun 2045' },
                { icon: Target, title: 'Misi', color: '#C8973A', content: '1. Mewujudkan Insan yang taat beribadah, cinta kepada kitab suci dan pandai dalam dakwah keagamaan\n2. Mewujudkan peserta didik yang beperilaku baik, patuh, dan memiliki jiwa kepemimpinan\n3. Mewujudkan peserta didik yang ahli sesuai dengan kejuruannya, sinkronasi kurikulum intrakurikuler dengan ekstrakurikuler, dan pengembangan kerjasama dengan dunia industri' },
              ].map(item => (
                <div key={item.title} style={{ background: item.color, borderRadius: 18, padding: 32 }}>
                  <div style={{ width: 50, height: 50, background: 'rgba(255,255,255,0.1)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
                    <item.icon size={24} color="#E8B84B" />
                  </div>
                  <h3 className="font-display" style={{ fontSize: 24, color: 'white', marginBottom: 14 }}>{item.title}</h3>
                  <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.8)', lineHeight: 1.8, whiteSpace: 'pre-line' }}>{item.content}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Sejarah */}
        <section style={{ padding: '70px 24px', background: '#FAF7F0' }}>
          <div style={{ maxWidth: 1100, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 60, alignItems: 'center' }}>
            <div>
              <div className="gold-line" style={{ marginBottom: 16 }} />
              <h2 className="font-display" style={{ fontSize: 38, color: '#0A1628', marginBottom: 20 }}>Sejarah Singkat</h2>
              <p style={{ color: '#6B7280', lineHeight: 1.8, fontSize: 15, marginBottom: 16 }}>
                Yayasan AT-TAQWA Kemiri Jaya didirikan pada tahun 2004 dan berlokasi di Jl. Raya Tanah Baru No. 99, Kemiri Jaya, Beji, Depok 16421. Yayasan ini diprakarsai sekaligus dipimpin oleh H. Drs. Nasan, M.M.. Pada tahun yang sama, didirikan pula SMK Citra Negara sebagai salah satu lembaga pendidikan di bawah naungan yayasan tersebut.
              </p>
              <p style={{ color: '#6B7280', lineHeight: 1.8, fontSize: 15, marginBottom: 16 }}>
                Sejak awal berdirinya pada tahun 2004, SMK Citra Negara hanya memiliki satu program keahlian, yaitu Tata Niaga (TN). Seiring dengan perkembangan dan meningkatnya kebutuhan pendidikan kejuruan, sekolah terus menambah program keahlian baru, yaitu Teknik Komputer dan Jaringan (TKJ) pada tahun 2007, Multimedia (MM) pada tahun 2011, Administrasi Perkantoran (AP) pada tahun 2015, serta Rekayasa Perangkat Lunak (RPL) yang juga didirikan pada tahun 2015.
              </p>
              <p style={{ color: '#6B7280', lineHeight: 1.8, fontSize: 15, marginBottom: 16 }}>
                Pada tahun 2026, SMK Citra Negara kembali mengembangkan kualitas pendidikan dengan membuka program keahlian baru, yaitu Perhotelan.
              </p>
              <p style={{ color: '#6B7280', lineHeight: 1.8, fontSize: 15 }}>
                Hingga saat ini, SMK Citra Negara telah memiliki enam program keahlian yang berkomitmen mencetak lulusan yang kompeten, profesional, berkarakter, dan siap bersaing di dunia kerja maupun pendidikan lanjutan.
              </p>
            </div>
            <div>
              {[
                { tahun: '2004', event: 'Sekolah didirikan dengan satu jurusan keahlian yaitu Tata Niaga' },
                { tahun: '2007', event: 'Penambahan jurusan Teknik Komputer Jaringan' },
                { tahun: '2011', event: 'Penambahan jurusan Multimedia' },
                { tahun: '2015', event: 'Penambahan jurusan Administrasi Perkantoran dan Rekayasa Perangkat Lunak' },
                { tahun: '2026', event: 'Penambahan jurusan Perhotelan' },
              ].map((item, i) => (
                <div key={i} style={{ display: 'flex', gap: 20, alignItems: 'flex-start', marginBottom: 4 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div style={{
                      width: 40, height: 40, borderRadius: '50%',
                      background: i === 4 ? 'linear-gradient(135deg,#C8973A,#E8B84B)' : 'white',
                      border: `2px solid ${i === 4 ? '#C8973A' : '#E5E7EB'}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 10, fontWeight: 800, color: i === 4 ? '#0A1628' : '#9CA3AF', flexShrink: 0,
                    }}>{item.tahun}</div>
                    {i < 4 && <div style={{ width: 2, height: 28, background: '#E5E7EB', margin: '3px 0' }} />}
                  </div>
                  <div style={{ background: 'white', borderRadius: 10, padding: '10px 16px', flex: 1, border: '1px solid #F0EBE0', marginBottom: 4 }}>
                    <p style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>{item.event}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Struktur Organisasi */}
        <StrukturOrganisasi />

      </main>
      <Footer />
    </>
  );
}