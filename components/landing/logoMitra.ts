// Logo mitra kerja sama & business centre untuk landing page.
//
// Berkas di public/images/logo-mitra dan public/images/logo-bc adalah versi web
// dari logo asli di public/images/"kerja sama" dan "business centre": tepi
// kosongnya dipangkas dan ukurannya diseragamkan (muat di 480×160, WebP),
// supaya besar logonya tampak rata dalam satu deret.
//
// Menambah logo: taruh berkas WebP/PNG/JPG di folder yang sama, lalu tambahkan
// satu baris di daftar ini (w & h = ukuran piksel berkasnya).

export type Logo = { nama: string; src: string; w: number; h: number }

/** Mitra kerja sama industri & lembaga (bab "Kerja sama dengan industri"). */
export const LOGO_MITRA: Logo[] = [
  { nama: '1 MANAJEMEN', src: '/images/logo-mitra/1-manajemen.webp', w: 173, h: 160 },
  { nama: 'ALADIN', src: '/images/logo-mitra/aladin.webp', w: 414, h: 160 },
  { nama: 'ASTRIDO', src: '/images/logo-mitra/astrido.webp', w: 191, h: 160 },
  { nama: 'AXIS', src: '/images/logo-mitra/axis.webp', w: 229, h: 160 },
  { nama: 'BCA', src: '/images/logo-mitra/bca.webp', w: 480, h: 157 },
  { nama: 'BJB', src: '/images/logo-mitra/bjb.webp', w: 291, h: 160 },
  { nama: 'BLITZ', src: '/images/logo-mitra/blitz.webp', w: 138, h: 160 },
  { nama: 'BPTN SYARIAH', src: '/images/logo-mitra/bptn-syariah.webp', w: 133, h: 160 },
  { nama: 'BSI KAMPUS', src: '/images/logo-mitra/bsi-kampus.webp', w: 160, h: 160 },
  { nama: 'BSI', src: '/images/logo-mitra/bsi.webp', w: 460, h: 160 },
  { nama: 'CBN', src: '/images/logo-mitra/cbn.webp', w: 380, h: 160 },
  { nama: 'COLMITRA', src: '/images/logo-mitra/colmitra.webp', w: 480, h: 140 },
  { nama: 'DASA PRIMA', src: '/images/logo-mitra/dasa-prima.webp', w: 204, h: 160 },
  { nama: 'DINO ICECREAM', src: '/images/logo-mitra/dino-icecream.webp', w: 179, h: 160 },
  { nama: 'DIPO', src: '/images/logo-mitra/dipo.webp', w: 201, h: 160 },
  { nama: 'erlangga', src: '/images/logo-mitra/erlangga.webp', w: 480, h: 128 },
  { nama: 'FIBERNETWORKING', src: '/images/logo-mitra/fibernetworking.webp', w: 480, h: 109 },
  { nama: 'GANESHA', src: '/images/logo-mitra/ganesha.webp', w: 160, h: 160 },
  { nama: 'GENDARIS', src: '/images/logo-mitra/gendaris.webp', w: 480, h: 120 },
  { nama: 'HANGTUAH', src: '/images/logo-mitra/hangtuah.webp', w: 158, h: 160 },
  { nama: 'HYPERMART', src: '/images/logo-mitra/hypermart.webp', w: 111, h: 160 },
  { nama: 'INDOMARET', src: '/images/logo-mitra/indomaret.webp', w: 480, h: 156 },
  { nama: 'ITECH', src: '/images/logo-mitra/itech.webp', w: 480, h: 78 },
  { nama: 'KEBAB MONSTER', src: '/images/logo-mitra/kebab-monster.webp', w: 216, h: 160 },
  { nama: 'KOSOGORO', src: '/images/logo-mitra/kosogoro.webp', w: 171, h: 160 },
  { nama: 'TOTAL HR', src: '/images/logo-mitra/logo-total-hr.webp', w: 480, h: 94 },
  { nama: 'LOTEMART', src: '/images/logo-mitra/lotemart.webp', w: 138, h: 160 },
  { nama: 'MANDIRI', src: '/images/logo-mitra/mandiri.webp', w: 480, h: 140 },
  { nama: 'MATIK', src: '/images/logo-mitra/matik.webp', w: 410, h: 160 },
  { nama: 'MBOK DARMI', src: '/images/logo-mitra/mbok-darmi.webp', w: 187, h: 160 },
  { nama: 'MENS BIORE', src: '/images/logo-mitra/mens-biore.webp', w: 258, h: 160 },
  { nama: 'MORAREPUBLIC', src: '/images/logo-mitra/morarepublic.webp', w: 480, h: 103 },
  { nama: 'PRIMA FAJAR', src: '/images/logo-mitra/prima-fajar.webp', w: 434, h: 160 },
  { nama: 'PRINTOK', src: '/images/logo-mitra/printok.webp', w: 294, h: 160 },
  { nama: 'PT CITA RASA', src: '/images/logo-mitra/pt-cita-rasa.webp', w: 156, h: 160 },
  { nama: 'RAMAYANA', src: '/images/logo-mitra/ramayana.webp', w: 165, h: 160 },
  { nama: 'REDDOORZ', src: '/images/logo-mitra/reddoorz.webp', w: 480, h: 115 },
  { nama: 'SEINDONESIA', src: '/images/logo-mitra/seindonesia.webp', w: 374, h: 160 },
  { nama: 'SETIAJAYA', src: '/images/logo-mitra/setiajaya.webp', w: 480, h: 101 },
  { nama: 'SHA', src: '/images/logo-mitra/sha.webp', w: 161, h: 160 },
  { nama: 'SIMGROUP', src: '/images/logo-mitra/simgroup.webp', w: 255, h: 160 },
  { nama: 'SMARTFREN', src: '/images/logo-mitra/smartfren.webp', w: 480, h: 123 },
  { nama: 'STIAMI', src: '/images/logo-mitra/stiami.webp', w: 129, h: 160 },
  { nama: 'TIARA BUNDA', src: '/images/logo-mitra/tiara-bunda.webp', w: 160, h: 160 },
  { nama: 'TRIDAYA', src: '/images/logo-mitra/tridaya.webp', w: 200, h: 160 },
  { nama: 'UHAMKA', src: '/images/logo-mitra/uhamka.webp', w: 480, h: 137 },
  { nama: 'UPJ', src: '/images/logo-mitra/upj.webp', w: 149, h: 160 },
  { nama: 'WELMAGIC', src: '/images/logo-mitra/welmagic.webp', w: 220, h: 160 },
  { nama: 'XL', src: '/images/logo-mitra/xl.webp', w: 197, h: 160 },
  { nama: 'YAMAHA', src: '/images/logo-mitra/yamaha.webp', w: 480, h: 104 },
  { nama: 'YAY SUSHI', src: '/images/logo-mitra/yay-sushi.webp', w: 200, h: 160 },
]

/** Unit business centre (deret paling bawah footer). */
export const LOGO_BUSINESS_CENTRE: Logo[] = [
  { nama: 'ADIWIYATA', src: '/images/logo-bc/logo-adiwiyata.webp', w: 160, h: 160 },
  { nama: 'ANABUKI', src: '/images/logo-bc/logo-anabuki.webp', w: 92, h: 160 },
  { nama: 'BANK BJB', src: '/images/logo-bc/logo-bank-bjb.webp', w: 205, h: 160 },
  { nama: 'BKK', src: '/images/logo-bc/logo-bkk.webp', w: 173, h: 160 },
  { nama: 'CN DP', src: '/images/logo-bc/logo-cn-dp.webp', w: 480, h: 131 },
  { nama: 'IRMA', src: '/images/logo-bc/logo-irma.webp', w: 170, h: 160 },
  { nama: 'LSPRO', src: '/images/logo-bc/logo-lspro.webp', w: 155, h: 160 },
  { nama: 'MAKARA UI ACADEMY', src: '/images/logo-bc/logo-makara-ui-academy.webp', w: 200, h: 160 },
  { nama: 'MASAGI', src: '/images/logo-bc/logo-masagi.webp', w: 101, h: 160 },
  { nama: 'TEFA', src: '/images/logo-bc/logo-tefa.webp', w: 480, h: 159 },
]
