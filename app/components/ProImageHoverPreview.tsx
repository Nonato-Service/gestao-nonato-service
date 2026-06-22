'use client'

import React, { useCallback, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

type Props = {
  src?: string
  alt?: string
  label?: string
  className?: string
  thumbClassName?: string
  /** Quando true, mostra miniatura mas sem popup ampliado (ex.: logo padrao). */
  disablePreview?: boolean
  children?: React.ReactNode
}

export function ProImageHoverPreview({
  src,
  alt = '',
  label,
  className = 'fg-pro-preview',
  thumbClassName = 'fg-pro-preview__thumb',
  disablePreview = false,
  children,
}: Props) {
  const anchorRef = useRef<HTMLSpanElement>(null)
  const [visible, setVisible] = useState(false)
  const [pos, setPos] = useState({ top: 0, left: 0 })

  const canPreview = Boolean(src) && !disablePreview

  const updatePosition = useCallback(() => {
    const el = anchorRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const flyoutW = 380
    const flyoutH = 320
    let left = rect.right + 14
    if (left + flyoutW > window.innerWidth - 16) {
      left = Math.max(16, rect.left - flyoutW - 14)
    }
    let top = rect.top + rect.height / 2 - flyoutH / 2
    top = Math.max(16, Math.min(window.innerHeight - flyoutH - 16, top))
    setPos({ top, left })
  }, [])

  const show = useCallback(() => {
    if (!canPreview) return
    updatePosition()
    setVisible(true)
  }, [canPreview, updatePosition])

  const hide = useCallback(() => setVisible(false), [])

  if (!src) {
    return <span className={thumbClassName}>{children}</span>
  }

  const flyout =
    visible && canPreview && typeof document !== 'undefined'
      ? createPortal(
          <div
            className="fg-pro-preview__flyout"
            style={{ top: pos.top, left: pos.left }}
            onMouseEnter={show}
            onMouseLeave={hide}
            role="dialog"
            aria-label={label || alt || 'Pre-visualizacao da imagem'}
          >
            {label ? <p className="fg-pro-preview__flyout-label">{label}</p> : null}
            <img src={src} alt={alt} className="fg-pro-preview__flyout-img" draggable={false} />
          </div>,
          document.body
        )
      : null

  return (
    <>
      <span
        ref={anchorRef}
        className={`${className} ${visible ? 'is-active' : ''} ${canPreview ? 'fg-pro-preview--zoomable' : ''}`}
        onMouseEnter={show}
        onMouseLeave={hide}
        title={canPreview ? label || alt || undefined : undefined}
      >
        <span className={thumbClassName}>
          <img src={src} alt={alt} draggable={false} />
        </span>
      </span>
      {flyout}
    </>
  )
}
