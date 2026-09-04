'use client'

import { createContext, useCallback, useContext, useMemo, useSyncExternalStore } from 'react'

// Tema terang/gelap untuk SELURUH aplikasi — dipakai Super Admin, Admin SPMB
// (front office), Admin Keuangan (loket), maupun pendaftar.
//
// Pilihan disimpan di localStorage per-perangkat, bukan di database: ini
// preferensi tampilan pribadi, bukan data sekolah.
//
// Sumber kebenarannya adalah atribut data-tema pada <html>, yang sudah
// dipasang skrip anti-kedip di app/layout.tsx SEBELUM halaman dilukis. Kita
// membacanya lewat useSyncExternalStore — API React yang memang untuk
// berlangganan store di luar React — sehingga tidak ada setState di dalam
// effect (yang memicu render berantai) dan tidak ada ketidakcocokan hidrasi:
// server selalu melaporkan 'terang', lalu React menyesuaikan setelah hidrasi
// sementara tampilannya sendiri sudah benar sejak cat pertama.

export type Tema = 'terang' | 'gelap'

const KUNCI = 'spmb-tema'
const PERISTIWA = 'spmb-tema-berubah'

interface NilaiTema {
  tema: Tema
  setTema: (t: Tema) => void
  gantiTema: () => void
}

const Ctx = createContext<NilaiTema | null>(null)

function berlangganan(callback: () => void) {
  window.addEventListener(PERISTIWA, callback)
  // Ikut berubah bila pengguna mengganti tema di tab lain.
  window.addEventListener('storage', callback)
  return () => {
    window.removeEventListener(PERISTIWA, callback)
    window.removeEventListener('storage', callback)
  }
}

function bacaDom(): Tema {
  return document.documentElement.getAttribute('data-tema') === 'gelap' ? 'gelap' : 'terang'
}

function bacaServer(): Tema {
  return 'terang'
}

export function TemaProvider({ children }: { children: React.ReactNode }) {
  const tema = useSyncExternalStore(berlangganan, bacaDom, bacaServer)

  const setTema = useCallback((t: Tema) => {
    const el = document.documentElement
    if (t === 'gelap') el.setAttribute('data-tema', 'gelap')
    else el.removeAttribute('data-tema')
    try { localStorage.setItem(KUNCI, t) } catch { /* mode privat: abaikan */ }
    window.dispatchEvent(new Event(PERISTIWA))
  }, [])

  const gantiTema = useCallback(() => {
    setTema(bacaDom() === 'gelap' ? 'terang' : 'gelap')
  }, [setTema])

  const nilai = useMemo(() => ({ tema, setTema, gantiTema }), [tema, setTema, gantiTema])

  return <Ctx.Provider value={nilai}>{children}</Ctx.Provider>
}

export function useTema(): NilaiTema {
  const v = useContext(Ctx)
  if (!v) throw new Error('useTema harus dipakai di dalam <TemaProvider>')
  return v
}

/**
 * Skrip anti-kedip. Dijalankan sinkron di <head> SEBELUM halaman dilukis,
 * sehingga pengguna bertema gelap tidak pernah melihat kilatan putih.
 * Bila belum pernah memilih, ikuti preferensi sistem operasinya.
 */
export const SKRIP_TEMA = `(function(){try{var t=localStorage.getItem('${KUNCI}');if(!t){t=window.matchMedia&&window.matchMedia('(prefers-color-scheme: dark)').matches?'gelap':'terang';}if(t==='gelap'){document.documentElement.setAttribute('data-tema','gelap');}}catch(e){}})();`
