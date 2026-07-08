'use client'

import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

import { PDF_MODELO_GROUPS, PDF_MODELO_LABEL_KEYS } from '../lib/pdfModelTypes'

export const RELATORIO_PDF_MODELO_LABEL_KEYS = PDF_MODELO_LABEL_KEYS

const RELATORIO_PDF_MODELO_GROUPS = PDF_MODELO_GROUPS

type RelatorioPdfModeloPickerProps = {
  value: string
  onChange: (model: string) => void
  className?: string
  title?: string
  compact?: boolean
  labels: Record<string, string>
  groupRecomendados: string
  groupOutros: string
}

export function RelatorioPdfModeloPicker({
  value,
  onChange,
  className = '',
  title,
  compact = false,
  labels,
  groupRecomendados,
  groupOutros,
}: RelatorioPdfModeloPickerProps) {
  const [open, setOpen] = useState(false)
  const [menuRect, setMenuRect] = useState<{ top: number; left: number; width: number; maxHeight: number } | null>(
    null
  )
  const triggerRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  const labelFor = (model: string) => {
    const key = RELATORIO_PDF_MODELO_LABEL_KEYS[model]
    return (key && labels[key]) || model
  }

  const groupLabel = (id: 'recomendados' | 'outros') =>
    id === 'recomendados' ? groupRecomendados : groupOutros

  const updateMenuRect = useCallback(() => {
    const el = triggerRef.current
    if (!el || typeof window === 'undefined') return
    const rect = el.getBoundingClientRect()
    const width = Math.max(rect.width, compact ? 150 : 180)
    const estimatedHeight = compact ? 260 : 320
    const gap = 4
    const spaceBelow = window.innerHeight - rect.bottom - gap
    const spaceAbove = rect.top - gap
    const openUp = spaceBelow < estimatedHeight && spaceAbove > spaceBelow
    const maxHeight = Math.max(140, Math.min(estimatedHeight, openUp ? spaceAbove : spaceBelow))
    const top = openUp ? Math.max(gap, rect.top - maxHeight - gap) : rect.bottom + gap
    const left = Math.min(Math.max(gap, rect.left), Math.max(gap, window.innerWidth - width - gap))

    setMenuRect({ top, left, width, maxHeight })
  }, [compact])

  useLayoutEffect(() => {
    if (!open) return
    updateMenuRect()
    const onScrollOrResize = () => updateMenuRect()
    window.addEventListener('resize', onScrollOrResize)
    window.addEventListener('scroll', onScrollOrResize, true)
    return () => {
      window.removeEventListener('resize', onScrollOrResize)
      window.removeEventListener('scroll', onScrollOrResize, true)
    }
  }, [open, updateMenuRect])

  useEffect(() => {
    if (!open) return
    const onPointerDown = (event: MouseEvent) => {
      const target = event.target as Node
      if (triggerRef.current?.contains(target) || menuRef.current?.contains(target)) return
      setOpen(false)
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  const pick = (model: string) => {
    onChange(model)
    setOpen(false)
  }

  const toggle = () => {
    if (open) {
      setOpen(false)
      return
    }
    updateMenuRect()
    setOpen(true)
  }

  const menu =
    open && menuRect && typeof document !== 'undefined'
      ? createPortal(
          <div
            ref={menuRef}
            className={`relatorio-servico-pdf-modelo-picker__menu${compact ? ' relatorio-servico-pdf-modelo-picker__menu--compact' : ''}`}
            style={{
              position: 'fixed',
              top: menuRect.top,
              left: menuRect.left,
              width: menuRect.width,
              maxHeight: menuRect.maxHeight,
              zIndex: 100080,
            }}
            role="listbox"
            aria-label={title}
          >
            {RELATORIO_PDF_MODELO_GROUPS.map((group) => (
              <div key={group.id} className="relatorio-servico-pdf-modelo-picker__group">
                <div className="relatorio-servico-pdf-modelo-picker__group-label">{groupLabel(group.id)}</div>
                {group.models.map((model) => (
                  <button
                    key={model}
                    type="button"
                    role="option"
                    aria-selected={model === value}
                    className={`relatorio-servico-pdf-modelo-picker__option${model === value ? ' is-selected' : ''}`}
                    onClick={() => pick(model)}
                  >
                    {labelFor(model)}
                  </button>
                ))}
              </div>
            ))}
          </div>,
          document.body
        )
      : null

  return (
    <>
      <div
        className={`relatorio-servico-pdf-modelo-picker${className ? ` ${className}` : ''}${
          compact ? ' relatorio-servico-pdf-modelo-picker--compact' : ''
        }`}
      >
        <button
          ref={triggerRef}
          type="button"
          className="relatorio-servico-pdf-modelo-picker__trigger relatorio-servico-pdf-modelo-select"
          aria-haspopup="listbox"
          aria-expanded={open}
          title={title}
          onClick={toggle}
        >
          <span className="relatorio-servico-pdf-modelo-picker__value">{labelFor(value)}</span>
          <span className="relatorio-servico-pdf-modelo-picker__chevron" aria-hidden>
            ▾
          </span>
        </button>
      </div>
      {menu}
    </>
  )
}
