'use client'

import { useEffect, useRef, useState } from 'react'
import { Check, Copy, Download, LoaderCircle, Printer, Share2 } from 'lucide-react'

type Props = {
  token: string
  nomor: string
  namaBerkas: string
  teksBagikan: string
  unduhOtomatis: boolean
}

export function SalinNomor({ nomor }: { nomor: string }) {
  const [disalin, setDisalin] = useState(false)
  const salin = async () => {
    try {
      await navigator.clipboard.writeText(nomor)
      setDisalin(true)
      setTimeout(() => setDisalin(false), 2000)
    } catch {
      // Peramban tanpa izin clipboard: nomor tetap bisa diblok dan disalin manual.
    }
  }
  return (
    <button type="button" className="pra-salin pra-tanpa-cetak" onClick={salin} aria-live="polite">
      {disalin ? <><Check size={14} aria-hidden="true" /> Tersalin</> : <><Copy size={14} aria-hidden="true" /> Salin</>}
    </button>
  )
}

export function AksiBukti({ token, nomor, namaBerkas, teksBagikan, unduhOtomatis }: Props) {
  const urlPdf = `/api/pra-pendaftaran/bukti/${token}/pdf`
  const [membagikan, setMembagikan] = useState(false)
  const berkasPdf = useRef<File | null>(null)
  const sudahDiunduh = useRef(false)

  useEffect(() => {
    if (!unduhOtomatis || sudahDiunduh.current) return
    sudahDiunduh.current = true
    const a = document.createElement('a')
    a.href = urlPdf
    a.download = namaBerkas
    document.body.appendChild(a)
    a.click()
    a.remove()
    window.history.replaceState(null, '', window.location.pathname)
  }, [unduhOtomatis, urlPdf, namaBerkas])

  // Berkas disiapkan lebih dulu: Safari menolak navigator.share yang dipanggil setelah menunggu unduhan.
  useEffect(() => {
    if (typeof navigator.canShare !== 'function') return
    const ac = new AbortController()
    fetch(urlPdf, { signal: ac.signal })
      .then(r => (r.ok ? r.blob() : null))
      .then(blob => {
        if (!blob) return
        const berkas = new File([blob], namaBerkas, { type: 'application/pdf' })
        if (navigator.canShare({ files: [berkas] })) berkasPdf.current = berkas
      })
      .catch(() => {})
    return () => ac.abort()
  }, [urlPdf, namaBerkas])

  const bagikan = async () => {
    const lewatWa = () => window.open(`https://wa.me/?text=${encodeURIComponent(teksBagikan)}`, '_blank', 'noopener,noreferrer')
    if (!berkasPdf.current) { lewatWa(); return }
    setMembagikan(true)
    try {
      await navigator.share({ files: [berkasPdf.current], title: `Bukti Pra-Pendaftaran ${nomor}`, text: teksBagikan })
    } catch (err) {
      if ((err as Error)?.name !== 'AbortError') lewatWa()
    } finally {
      setMembagikan(false)
    }
  }

  return (
    <div className="pra-aksi-tombol pra-tanpa-cetak">
      <a className="lp-tombol lp-tombol--utama" href={urlPdf} download={namaBerkas}>
        <Download size={18} aria-hidden="true" /> Unduh Bukti (PDF)
      </a>
      <button type="button" className="lp-tombol lp-tombol--garis" onClick={() => window.print()}>
        <Printer size={18} aria-hidden="true" /> Cetak
      </button>
      <button type="button" className="lp-tombol lp-tombol--garis" onClick={bagikan} disabled={membagikan}>
        {membagikan ? <LoaderCircle size={18} className="pra-putar" aria-hidden="true" /> : <Share2 size={18} aria-hidden="true" />}
        Bagikan ke WhatsApp
      </button>
    </div>
  )
}
