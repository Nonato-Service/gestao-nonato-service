'use client'

import { useEffect } from 'react'

type ManualProgramaLightboxProps = {
  open: boolean
  src: string
  alt: string
  closeLabel: string
  onClose: () => void
}

export function ManualProgramaLightbox({ open, src, alt, closeLabel, onClose }: ManualProgramaLightboxProps) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="manual-pro-v3-lightbox" role="dialog" aria-modal="true" aria-label={alt}>
      <button type="button" className="manual-pro-v3-lightbox__backdrop" aria-label={closeLabel} onClick={onClose} />
      <div className="manual-pro-v3-lightbox__panel">
        <button type="button" className="manual-pro-v3-lightbox__close" onClick={onClose} aria-label={closeLabel}>
          ✕
        </button>
        <img className="manual-pro-v3-lightbox__img" src={src} alt={alt} />
      </div>
    </div>
  )
}
