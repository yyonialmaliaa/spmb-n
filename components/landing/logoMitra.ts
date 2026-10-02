// Logo mitra kerja sama & business centre untuk landing page.
//
// Berkas di public/images/mitra dan public/images/mitra-bc adalah versi web
// dari logo asli di public/images/"kerja sama" dan "business centre": tepi
// kosongnya dipangkas, ukurannya diseragamkan (muat di 480×160, WebP), dan
// latar putihnya dibuang (transparan) supaya logo tampil mengikuti bentuknya
// sendiri, tanpa kotak.
//
// Menambah logo: taruh berkas WebP/PNG berlatar transparan di folder yang sama,
// lalu tambahkan satu baris di daftar ini (w & h = ukuran piksel berkasnya).

export type Logo = { nama: string; src: string; w: number; h: number }

/** Mitra kerja sama industri & lembaga (bab "Kerja sama dengan industri"). */
export const LOGO_MITRA: Logo[] = [
  { nama: '1 MANAJEMEN', src: '/images/mitra/1-manajemen.webp', w: 173, h: 160 },
  { nama: 'ALADIN', src: '/images/mitra/aladin.webp', w: 414, h: 160 },
  { nama: 'ASTRIDO', src: '/images/mitra/astrido.webp', w: 191, h: 160 },
  { nama: 'AXIS', src: '/images/mitra/axis.webp', w: 229, h: 160 },
  { nama: 'BCA', src: '/images/mitra/bca.webp', w: 480, h: 157 },
  { nama: 'BJB', src: '/images/mitra/bjb.webp', w: 291, h: 160 },
  { nama: 'BLITZ', src: '/images/mitra/blitz.webp', w: 138, h: 160 },
  { nama: 'BPTN SYARIAH', src: '/images/mitra/bptn-syariah.webp', w: 133, h: 160 },
  { nama: 'BSI KAMPUS', src: '/images/mitra/bsi-kampus.webp', w: 160, h: 160 },
  { nama: 'BSI', src: '/images/mitra/bsi.webp', w: 460, h: 160 },
  { nama: 'CBN', src: '/images/mitra/cbn.webp', w: 380, h: 160 },
  { nama: 'COLMITRA', src: '/images/mitra/colmitra.webp', w: 480, h: 140 },
  { nama: 'DASA PRIMA', src: '/images/mitra/dasa-prima.webp', w: 204, h: 160 },
  { nama: 'DINO ICECREAM', src: '/images/mitra/dino-icecream.webp', w: 179, h: 160 },
  { nama: 'DIPO', src: '/images/mitra/dipo.webp', w: 201, h: 160 },
  { nama: 'erlangga', src: '/images/mitra/erlangga.webp', w: 480, h: 128 },
  { nama: 'FIBERNETWORKING', src: '/images/mitra/fibernetworking.webp', w: 480, h: 109 },
  { nama: 'GANESHA', src: '/images/mitra/ganesha.webp', w: 160, h: 160 },
  { nama: 'GENDARIS', src: '/images/mitra/gendaris.webp', w: 480, h: 120 },
  { nama: 'HANGTUAH', src: '/images/mitra/hangtuah.webp', w: 158, h: 160 },
  { nama: 'HYPERMART', src: '/images/mitra/hypermart.webp', w: 111, h: 160 },
  { nama: 'INDOMARET', src: '/images/mitra/indomaret.webp', w: 480, h: 156 },
  { nama: 'ITECH', src: '/images/mitra/itech.webp', w: 480, h: 78 },
  { nama: 'KEBAB MONSTER', src: '/images/mitra/kebab-monster.webp', w: 216, h: 160 },
  { nama: 'KOSOGORO', src: '/images/mitra/kosogoro.webp', w: 171, h: 160 },
  { nama: 'TOTAL HR', src: '/images/mitra/logo-total-hr.webp', w: 480, h: 94 },
  { nama: 'LOTEMART', src: '/images/mitra/lotemart.webp', w: 138, h: 160 },
  { nama: 'MANDIRI', src: '/images/mitra/mandiri.webp', w: 480, h: 140 },
  { nama: 'MATIK', src: '/images/mitra/matik.webp', w: 410, h: 160 },
  { nama: 'MBOK DARMI', src: '/images/mitra/mbok-darmi.webp', w: 187, h: 160 },
  { nama: 'MENS BIORE', src: '/images/mitra/mens-biore.webp', w: 258, h: 160 },
  { nama: 'MORAREPUBLIC', src: '/images/mitra/morarepublic.webp', w: 480, h: 103 },
  { nama: 'PRIMA FAJAR', src: '/images/mitra/prima-fajar.webp', w: 434, h: 160 },
  { nama: 'PRINTOK', src: '/images/mitra/printok.webp', w: 294, h: 160 },
  { nama: 'PT CITA RASA', src: '/images/mitra/pt-cita-rasa.webp', w: 156, h: 160 },
  { nama: 'RAMAYANA', src: '/images/mitra/ramayana.webp', w: 161, h: 157 },
  { nama: 'REDDOORZ', src: '/images/mitra/reddoorz.webp', w: 480, h: 115 },
  { nama: 'SEINDONESIA', src: '/images/mitra/seindonesia.webp', w: 374, h: 160 },
  { nama: 'SETIAJAYA', src: '/images/mitra/setiajaya.webp', w: 480, h: 101 },
  { nama: 'SHA', src: '/images/mitra/sha.webp', w: 161, h: 160 },
  { nama: 'SIMGROUP', src: '/images/mitra/simgroup.webp', w: 255, h: 160 },
  { nama: 'SMARTFREN', src: '/images/mitra/smartfren.webp', w: 480, h: 123 },
  { nama: 'STIAMI', src: '/images/mitra/stiami.webp', w: 129, h: 160 },
  { nama: 'TIARA BUNDA', src: '/images/mitra/tiara-bunda.webp', w: 160, h: 160 },
  { nama: 'TRIDAYA', src: '/images/mitra/tridaya.webp', w: 200, h: 160 },
  { nama: 'UHAMKA', src: '/images/mitra/uhamka.webp', w: 480, h: 137 },
  { nama: 'UPJ', src: '/images/mitra/upj.webp', w: 149, h: 160 },
  { nama: 'WELMAGIC', src: '/images/mitra/welmagic.webp', w: 220, h: 160 },
  { nama: 'XL', src: '/images/mitra/xl.webp', w: 197, h: 160 },
  { nama: 'YAMAHA', src: '/images/mitra/yamaha.webp', w: 480, h: 104 },
  { nama: 'YAY SUSHI', src: '/images/mitra/yay-sushi.webp', w: 200, h: 160 },
]

/**
 * Mitra program Go Internasional (tulisan "Go Internasional" di hero) —
 * berkas logo yang sama dengan deret business centre di bawah.
 */
export const LOGO_MITRA_GO: Logo[] = [
  { nama: 'Anabuki', src: '/images/mitra-bc/logo-anabuki.webp', w: 92, h: 160 },
  { nama: 'Makara UI Academy', src: '/images/mitra-bc/logo-makara-ui-academy.webp', w: 200, h: 160 },
]

/** Unit business centre (deret paling bawah footer). */
export const LOGO_BUSINESS_CENTRE: Logo[] = [
  { nama: 'ADIWIYATA', src: '/images/mitra-bc/logo-adiwiyata.webp', w: 160, h: 160 },
  { nama: 'ANABUKI', src: '/images/mitra-bc/logo-anabuki.webp', w: 92, h: 160 },
  { nama: 'BANK BJB', src: '/images/mitra-bc/logo-bank-bjb.webp', w: 205, h: 160 },
  { nama: 'BKK', src: '/images/mitra-bc/logo-bkk.webp', w: 173, h: 160 },
  { nama: 'CN DP', src: '/images/mitra-bc/logo-cn-dp.webp', w: 480, h: 131 },
  { nama: 'IRMA', src: '/images/mitra-bc/logo-irma.webp', w: 170, h: 160 },
  { nama: 'LSPRO', src: '/images/mitra-bc/logo-lspro.webp', w: 155, h: 160 },
  { nama: 'MAKARA UI ACADEMY', src: '/images/mitra-bc/logo-makara-ui-academy.webp', w: 200, h: 160 },
  { nama: 'MASAGI', src: '/images/mitra-bc/logo-masagi.webp', w: 101, h: 160 },
  { nama: 'TEFA', src: '/images/mitra-bc/logo-tefa.webp', w: 480, h: 159 },
]
