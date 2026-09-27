"use client";

import Image from "next/image";
import { Fragment, useEffect, useRef, useState } from "react";
import { FOTO_HERO } from "./Hero";

// ---------------------------------------------------------------------------
// Animasi pembuka landing page.
//
//  1. Deret lima foto meluncur masuk dari kanan ke kiri dan berhenti tepat
//     di tengah layar.
//  2. Deret foto turun sedikit dan menyingkap judul "SPMB SMP-SMA-SMK Citra
//     Negara · TA …" yang sejak awal menunggu di BELAKANGNYA; judul naik
//     pelan ke tengah layar, lalu dibiarkan diam sejenak supaya terbaca.
//  3. Foto tengah membesar sampai memenuhi layar — foto itu sama persis
//     dengan latar hero, dan ukuran akhirnya diukur dari gambar hero yang
//     sudah dirender, jadi saat tirai dilepas tidak ada yang bergeser.
//  4. Tiap kata judul terbang dan mengecil ke posisi kata yang sama di label
//     hero, lalu melebur ke label aslinya; navbar dan isi hero ikut masuk.
//
// Tahap 1–2 murni CSS (landing.css) sehingga sudah berjalan sejak bingkai
// pertama, bahkan sebelum React hidup. Tahap 3–4 butuh ukuran nyata, jadi
// dijalankan lewat Web Animations API setelah jeda baca.
//
// Tirai ini ikut dirender di server: judulnya harus jadi hal PERTAMA yang
// terlihat, bukan muncul setelah hero sempat tampil. Sesi yang sudah pernah
// melihatnya, kunjungan yang langsung menuju bagian tertentu (#jadwal, dst.),
// dan pengguna yang meminta gerak dikurangi tidak melihatnya sama sekali —
// lihat SKRIP_PEMBUKA di app/layout.tsx dan landing.css. Bisa dilewati kapan
// saja dengan tombol apa pun, klik/sentuh, atau gulir.
// ---------------------------------------------------------------------------

/** Deret foto kiri → kanan. */
const DERET = [
  "/images/17agst-112.jpg",
  "/images/cn beersholawat-261.jpg",
  FOTO_HERO,
  "/images/bkst sma-8.jpg",
  "/images/AWS03774.jpg",
];
/** Indeks foto tengah — yang membesar menjadi latar hero. */
const TENGAH = 2;

/** Judul dibiarkan diam selama ini setelah tersingkap penuh, supaya sempat
 *  terbaca sebelum foto tengah mulai membesar. */
const BACA = 1000;
const ZOOM = 1600;
const EASE_ZOOM = "cubic-bezier(0.76, 0, 0.24, 1)";
const TERBANG = 1300;
const EASE_TERBANG = "cubic-bezier(0.65, 0, 0.35, 1)";
/** Baris judul yang lebih bawah berangkat lebih dulu. Semua kata bergerak
 *  turun ke label, jadi baris bawah yang memimpin selalu tetap di bawah baris
 *  atasnya — "TA 2026/2027" tidak menabrak "Citra Negara" saat menyeberang
 *  ke ujung kanan label. */
const JEDA_BARIS = 160;
/** Lama peleburan kata ke label aslinya. */
const LEBUR = 420;
/** Sejak serah terima sampai tirai dilepas dari DOM — isi hero (nilai,
 *  semboyan, tombol) harus sudah selesai masuk, lihat landing.css. */
const SISA = 2200;
/** Warna & bayangan .lp-label--terang (landing.css) — tujuan akhir kata. */
const WARNA_LABEL = "rgba(255, 255, 255, 0.78)";
/** Jarak huruf .lp-label (landing.css). */
const JARAK_HURUF_LABEL = "0.22em";

/** Tiap kata jadi elemen sendiri agar bisa diterbangkan ke posisinya di label. */
function Kata({ teks }: { teks: string }) {
  return (
    <>
      {teks.split(" ").map((k, i) => (
        <Fragment key={i}>
          {i > 0 && " "}
          <span className="lp-pembuka-kata">{k}</span>
        </Fragment>
      ))}
    </>
  );
}

/** Posisi tiap kata di label hero, diukur dari teks yang benar-benar dirender. */
function kataDiLabel(label: HTMLElement) {
  const hasil: { teks: string; r: DOMRect }[] = [];
  const jalan = document.createTreeWalker(label, NodeFilter.SHOW_TEXT);
  const rentang = document.createRange();
  for (let n = jalan.nextNode(); n; n = jalan.nextNode()) {
    const isi = n.textContent ?? "";
    for (const m of isi.matchAll(/\S+/g)) {
      rentang.setStart(n, m.index);
      rentang.setEnd(n, m.index + m[0].length);
      hasil.push({
        teks: m[0].toLowerCase(),
        r: rentang.getBoundingClientRect(),
      });
    }
  }
  return hasil;
}

export function Pembuka({ tahunAjaran }: { tahunAjaran: string | null }) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [selesai, setSelesai] = useState(false);

  useEffect(() => {
    const akar = ref.current;
    const html = document.documentElement;
    if (!akar || html.dataset.pembuka === "lewat") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    // React datang sangat terlambat dan jaring pengaman CSS sudah
    // menyingkirkan tirainya sendiri — jangan dimunculkan lagi.
    const gaya = getComputedStyle(akar);
    if (gaya.visibility === "hidden" || Number(gaya.opacity) < 1) return;

    akar.classList.add("is-hidup");
    // Kunci gulir di <html>, bukan <body> (body dipegang panel menu). Talang
    // scrollbar tetap dipesan supaya lebar halaman tidak berubah saat dibuka.
    html.style.overflow = "hidden";
    html.style.scrollbarGutter = "stable";
    const bukaGulir = () => {
      html.style.overflow = "";
      html.style.scrollbarGutter = "";
    };

    let tahap: "awal" | "zoom" | "lepas" | "lewati" | "usai" = "awal";
    let batal = false;
    const animasi: Animation[] = [];
    const pewaktu: number[] = [];
    const jalan = (a: Animation) => {
      animasi.push(a);
      return a;
    };
    const nanti = (fn: () => void, ms: number) => {
      pewaktu.push(window.setTimeout(fn, ms));
    };
    const selesaiSemua = (daftar: Animation[]) =>
      Promise.all(daftar.map((a) => a.finished.catch(() => null)));

    const foto = Array.from(
      akar.querySelectorAll<HTMLElement>(".lp-pembuka-foto"),
    );
    const judul = akar.querySelector<HTMLElement>(".lp-pembuka-judul");
    const baris = Array.from(
      akar.querySelectorAll<HTMLElement>(".lp-pembuka-baris"),
    );
    const kata = Array.from(
      akar.querySelectorAll<HTMLElement>(".lp-pembuka-kata"),
    );
    const lapis = akar.querySelector<HTMLElement>(".lp-pembuka-zoom");
    const bingkai = akar.querySelector<HTMLElement>(".lp-pembuka-zoom-bingkai");
    const tirai = akar.querySelector<HTMLElement>(".lp-pembuka-zoom-tirai");
    const gambarZoom = bingkai?.querySelector("img") ?? null;
    const hero = document.querySelector<HTMLElement>(".lp-hero");
    const gambarHero =
      document.querySelector<HTMLImageElement>(".lp-hero-media img");
    const label = document.querySelector<HTMLElement>(".lp-hero-label");

    const akhiri = () => {
      if (tahap === "usai") return;
      tahap = "usai";
      bukaGulir();
      // Juga mencegah tirai tampil lagi bila pengguna kembali ke halaman ini
      // lewat navigasi di dalam aplikasi (skrip di <head> tidak berjalan ulang).
      html.dataset.pembuka = "lewat";
      setSelesai(true);
    };

    // Dilewati pengguna (atau ada yang tidak bisa diukur): tirai memudar,
    // hero dan navbar masuk dengan animasi biasanya.
    const lewati = () => {
      if (tahap !== "awal" && tahap !== "zoom") return;
      tahap = "lewati";
      bukaGulir();
      akar.classList.add("is-lepas", "is-lewati");
      if (label) {
        label.style.animation = "none";
        jalan(
          label.animate(
            [
              { opacity: 0, transform: "translateY(18px)" },
              { opacity: 1, transform: "none" },
            ],
            {
              duration: 800,
              delay: 120,
              easing: "cubic-bezier(0.16, 1, 0.3, 1)",
              fill: "both",
            },
          ),
        );
      }
      nanti(akhiri, SISA);
    };

    // Tahap 4: serah terima ke tata letak hero.
    const lepas = () => {
      if (tahap !== "zoom") return;
      if (!judul || !label) return lewati();
      const rLabel = label.getBoundingClientRect();
      if (rLabel.bottom <= 0 || rLabel.top >= window.innerHeight)
        return lewati();
      tahap = "lepas";

      // Label asli tidak ikut animasi masuknya sendiri: kata-kata inilah
      // yang "menjadi" label itu.
      label.style.animation = "none";
      akar.classList.add("is-lepas");

      // Bekukan posisi tiap kata supaya jarak hurufnya bisa ikut berubah
      // tanpa menggeser kata di sebelahnya.
      judul.getAnimations({ subtree: true }).forEach((a) => {
        if (a instanceof CSSAnimation) a.cancel();
      });
      const rJudul = judul.getBoundingClientRect();
      const kotak = kata.map((k) => k.getBoundingClientRect());
      judul.style.height = `${rJudul.height}px`;
      kata.forEach((k, i) => {
        k.style.position = "absolute";
        k.style.left = `${kotak[i].left - rJudul.left}px`;
        k.style.top = `${kotak[i].top - rJudul.top}px`;
      });

      const tujuan = kataDiLabel(label);
      const ukuranLabel = parseFloat(getComputedStyle(label).fontSize);
      // Nomor baris tiap kata (0 = paling atas), dari posisi yang sudah dirender.
      const puncak = [...new Set(kotak.map((r) => Math.round(r.top)))].sort(
        (a, b) => a - b,
      );
      const barisKe = kotak.map((r) => puncak.indexOf(Math.round(r.top)));
      const jeda = barisKe.map((b) => (puncak.length - 1 - b) * JEDA_BARIS);
      const mulaiLebur = TERBANG + Math.max(0, ...jeda) - LEBUR * 0.35;
      let p = 0;
      kata.forEach((k, i) => {
        const teks = (k.textContent ?? "").toLowerCase();
        let j = p;
        while (j < tujuan.length && tujuan[j].teks !== teks) j++;
        if (j >= tujuan.length) {
          jalan(
            k.animate([{ opacity: 1 }, { opacity: 0 }], {
              duration: 500,
              fill: "both",
            }),
          );
          return;
        }
        p = j + 1;
        const r0 = kotak[i];
        const r1 = tujuan[j].r;
        const gk = getComputedStyle(k);
        const s = ukuranLabel / parseFloat(gk.fontSize);
        // Titik tumpu di tepi kiri-tengah kata (lihat landing.css).
        const dx = r1.left - r0.left;
        const dy = r1.top + r1.height / 2 - (r0.top + r0.height / 2);
        jalan(
          k.animate(
            [
              {
                transform: "translate(0px, 0px) scale(1)",
                color: gk.color,
                textShadow: gk.textShadow,
              },
              {
                transform: `translate(${dx}px, ${dy}px) scale(${s})`,
                color: WARNA_LABEL,
                // Bayangan .lp-label--terang, dibagi skala karena ikut mengecil.
                textShadow: `0 ${1 / s}px ${2 / s}px rgba(0, 0, 0, 0.4), 0 ${4 / s}px ${12 / s}px rgba(0, 0, 0, 0.3)`,
              },
            ],
            {
              duration: TERBANG,
              delay: jeda[i],
              easing: EASE_TERBANG,
              fill: "both",
            },
          ),
        );
        // Jarak huruf baru melebar menjelang mendarat: kalau ikut sejak awal,
        // kata-kata sempat berdempetan di tengah jalan.
        jalan(
          k.animate(
            [
              { letterSpacing: gk.letterSpacing },
              { letterSpacing: JARAK_HURUF_LABEL },
            ],
            {
              duration: TERBANG * 0.45,
              delay: jeda[i] + TERBANG * 0.55,
              easing: "ease-out",
              fill: "both",
            },
          ),
        );
        jalan(
          k.animate([{ opacity: 1 }, { opacity: 0 }], {
            duration: LEBUR,
            delay: mulaiLebur,
            fill: "both",
          }),
        );
      });
      jalan(
        label.animate([{ opacity: 0 }, { opacity: 1 }], {
          duration: LEBUR,
          delay: mulaiLebur,
          fill: "both",
        }),
      );
      nanti(akhiri, Math.max(SISA, mulaiLebur + LEBUR + 50));
    };

    // Tahap 3: foto tengah membesar menjadi latar hero.
    const zoom = async () => {
      if (batal || tahap !== "awal") return;
      tahap = "zoom";
      const fotoTengah = foto[TENGAH];
      if (
        !fotoTengah ||
        !lapis ||
        !bingkai ||
        !tirai ||
        !gambarZoom ||
        !hero ||
        !gambarHero
      )
        return lewati();

      // Gambar hero belum siap (koneksi lambat) → jangan membesarkan kotak kosong.
      const siap = await Promise.race([
        gambarZoom.decode().then(
          () => true,
          () => false,
        ),
        new Promise<boolean>((r) => nanti(() => r(false), 2500)),
      ]);
      if (batal || tahap !== "zoom") return;
      if (!siap || gambarZoom.naturalWidth === 0) return lewati();

      const rC = fotoTengah.getBoundingClientRect();
      const rB = gambarHero.getBoundingClientRect();
      const rH = hero.getBoundingClientRect();
      const rL = lapis.getBoundingClientRect();
      if (rC.width === 0 || rB.bottom <= 0) return lewati();

      // Bingkai memuat foto UTUH seukuran tampilan "cover" di kotak gambar hero
      // (sudah termasuk skala 1.1-nya) dan berpusat di pusat kotak itu. Yang
      // terlihat dibatasi klip lapisan — bukan dipotong ke kotak hero —
      // supaya saat mengecil ke ukuran kartu fotonya tetap menutupi kartu,
      // juga di HP yang kotak hero-nya tegak sementara kartunya lebih lebar.
      const nw = gambarZoom.naturalWidth;
      const nh = gambarZoom.naturalHeight;
      const sB = Math.max(rB.width / nw, rB.height / nh);
      const sC = Math.max(rC.width / nw, rC.height / nh);
      const pusatB = {
        x: rB.left + rB.width / 2 - rL.left,
        y: rB.top + rB.height / 2 - rL.top,
      };
      Object.assign(bingkai.style, {
        left: `${pusatB.x - (nw * sB) / 2}px`,
        top: `${pusatB.y - (nh * sB) / 2}px`,
        width: `${nw * sB}px`,
        height: `${nh * sB}px`,
      });
      Object.assign(tirai.style, {
        left: `${rH.left - rL.left}px`,
        top: `${rH.top - rL.top}px`,
        width: `${rH.width}px`,
        height: `${rH.height}px`,
      });

      // Mulai dari tampilan foto tengah: object-fit cover di kotak kartu.
      const k = sC / sB;
      const dx = rC.left + rC.width / 2 - (rB.left + rB.width / 2);
      const dy = rC.top + rC.height / 2 - (rB.top + rB.height / 2);
      const sudut =
        parseFloat(getComputedStyle(fotoTengah).borderTopLeftRadius) || 0;
      const klip = (
        atas: number,
        kanan: number,
        bawah: number,
        kiri: number,
        r: number,
      ) => `inset(${atas}px ${kanan}px ${bawah}px ${kiri}px round ${r}px)`;
      const klipAwal = klip(
        rC.top - rL.top,
        rL.right - rC.right,
        rL.bottom - rC.bottom,
        rC.left - rL.left,
        sudut,
      );
      // Berakhir di area hero yang tampak di layar — di HP, hero (100svh)
      // bisa sedikit lebih pendek dari layar saat bilah alamat tersembunyi.
      const klipAkhir = klip(
        Math.max(0, rH.top - rL.top),
        Math.max(0, rL.right - rH.right),
        Math.max(0, rL.bottom - rH.bottom),
        Math.max(0, rH.left - rL.left),
        0,
      );
      const opsi: KeyframeAnimationOptions = {
        duration: ZOOM,
        easing: EASE_ZOOM,
        fill: "both",
      };

      akar.classList.add("is-zoom");
      fotoTengah.style.visibility = "hidden";
      const inti = [
        jalan(
          lapis.animate(
            [{ clipPath: klipAwal }, { clipPath: klipAkhir }],
            opsi,
          ),
        ),
        jalan(
          bingkai.animate(
            [
              { transform: `translate(${dx}px, ${dy}px) scale(${k})` },
              { transform: "translate(0px, 0px) scale(1)" },
            ],
            opsi,
          ),
        ),
      ];
      jalan(
        tirai.animate([{ opacity: 0 }, { opacity: 1 }], {
          duration: ZOOM * 0.6,
          delay: ZOOM * 0.4,
          easing: "ease-in-out",
          fill: "both",
        }),
      );
      // Foto di kiri-kanannya terdorong menjauh selagi tertutup.
      foto.forEach((f, i) => {
        if (i === TENGAH) return;
        jalan(
          f.animate(
            [
              { transform: "none" },
              { transform: `translateX(${(i - TENGAH) * 6}vw) scale(0.94)` },
            ],
            opsi,
          ),
        );
      });
      // Judul berganti dari tinta ke putih karena kini berdiri di atas foto.
      baris.forEach((b, i) => {
        jalan(
          b.animate(
            [
              {
                color: getComputedStyle(b).color,
                textShadow: "0 2px 18px rgba(0, 0, 0, 0)",
              },
              {
                color: i === 0 ? "#ffffff" : "#fff000",
                textShadow: "0 2px 18px rgba(0, 0, 0, 0.35)",
              },
            ],
            {
              duration: ZOOM * 0.45,
              delay: ZOOM * 0.22,
              easing: "ease-in-out",
              fill: "both",
            },
          ),
        );
      });

      await selesaiSemua(inti);
      if (!batal) lepas();
    };

    // Tahap 1–2 digerakkan CSS; tunggu sampai judul selesai naik, lalu beri
    // waktu untuk membacanya.
    const tahapCss = akar
      .getAnimations({ subtree: true })
      .filter((a) => a instanceof CSSAnimation);
    selesaiSemua(tahapCss).then(() => {
      if (!batal)
        nanti(() => {
          void zoom();
        }, BACA);
    });

    const onLewati = () => lewati();
    window.addEventListener("keydown", onLewati);
    window.addEventListener("pointerdown", onLewati);
    window.addEventListener("wheel", onLewati, { passive: true });
    window.addEventListener("touchstart", onLewati, { passive: true });

    return () => {
      batal = true;
      window.removeEventListener("keydown", onLewati);
      window.removeEventListener("pointerdown", onLewati);
      window.removeEventListener("wheel", onLewati);
      window.removeEventListener("touchstart", onLewati);
      pewaktu.forEach((t) => window.clearTimeout(t));
      animasi.forEach((a) => a.cancel());
      bukaGulir();
      // Kembalikan ke keadaan awal (penting untuk efek yang dijalankan dua
      // kali oleh React Strict Mode saat pengembangan).
      akar.classList.remove("is-hidup", "is-zoom", "is-lepas", "is-lewati");
      foto[TENGAH]?.style.removeProperty("visibility");
      if (label) label.style.removeProperty("animation");
    };
  }, []);

  if (selesai) return null;

  return (
    // Murni dekorasi: isinya sudah ada di halaman, jadi pembaca layar tidak
    // perlu membacanya dua kali.
    <div ref={ref} className="lp-pembuka" aria-hidden="true">
      <div className="lp-pembuka-judul">
        <span className="lp-pembuka-baris">
          <Kata teks="SPMB SMP-SMA-SMK Citra Negara" />
        </span>
        {tahunAjaran && (
          <span className="lp-pembuka-baris lp-pembuka-baris--dua">
            <Kata teks={`TA ${tahunAjaran}`} />
          </span>
        )}
      </div>

      <div className="lp-pembuka-panggung">
        {DERET.map((src, i) => (
          <div
            key={src}
            className="lp-pembuka-kartu"
            style={{ "--i": i } as React.CSSProperties}
          >
            <div className="lp-pembuka-foto">
              <Image
                src={src}
                alt=""
                fill
                loading="eager"
                sizes="(max-width: 640px) 40vw, 20vw"
                style={{ objectFit: "cover" }}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="lp-pembuka-zoom">
        <div className="lp-pembuka-zoom-bingkai">
          <Image
            src={FOTO_HERO}
            alt=""
            fill
            loading="eager"
            sizes="100vw"
            style={{ objectFit: "cover" }}
          />
        </div>
        <div className="lp-pembuka-zoom-tirai" />
      </div>
    </div>
  );
}
