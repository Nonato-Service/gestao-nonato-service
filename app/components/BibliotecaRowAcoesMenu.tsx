'use client'

import React, { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

type BibliotecaRowAcoesMenuProps = {
  label: string
  children: React.ReactNode
  className?: string
  menuClassName?: string
  /** Fecha o menu após clique em botão/item (exceto o próprio seletor PDF, se marcado). */
  closeOnAction?: boolean
}

/**
 * Botão «Ações» compacto com menu em portal (overlay).
 * Não estica a linha da tabela — o conteúdo abre fora do fluxo do `<td>`.
 */
export function BibliotecaRowAcoesMenu({
  label,
  children,
  className = '',
  menuClassName = '',
  closeOnAction = true,
}: BibliotecaRowAcoesMenuProps) {
  const [open, setOpen] = useState(false)
  const [menuRect, setMenuRect] = useState<{
    top: number
    left: number
    minWidth: number
    maxHeight: number
  } | null>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const menuId = useId()

  const updateMenuRect = useCallback(() => {
    const el = triggerRef.current
    if (!el || typeof window === 'undefined') return
    const rect = el.getBoundingClientRect()
    const minWidth = Math.max(rect.width, 220)
    const estimatedHeight = 320
    const gap = 4
    const spaceBelow = window.innerHeight - rect.bottom - gap
    const spaceAbove = rect.top - gap
    const openUp = spaceBelow < estimatedHeight && spaceAbove > spaceBelow
    const maxHeight = Math.max(160, Math.min(estimatedHeight, openUp ? spaceAbove : spaceBelow))
    const top = openUp ? Math.max(gap, rect.top - maxHeight - gap) : rect.bottom + gap
    const left = Math.min(
      Math.max(gap, rect.right - minWidth),
      Math.max(gap, window.innerWidth - minWidth - gap)
    )
    setMenuRect({ top, left, minWidth, maxHeight })
  }, [])

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
      // Menus aninhados em portal (ex.: modelo PDF) vivem em document.body
      const portalEl = target instanceof Element ? target.closest('[data-bib-acoes-nested-portal]') : null
      if (portalEl) return
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

  const toggle = () => {
    if (open) {
      setOpen(false)
      return
    }
    updateMenuRect()
    setOpen(true)
  }

  const onMenuClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!closeOnAction) return
    const target = event.target as HTMLElement | null
    if (!target) return
    // Não fechar ao interagir com o seletor de modelo PDF (abre outro portal)
    if (target.closest('.relatorio-servico-pdf-modelo-picker')) return
    if (target.closest('button, a[href], [role="menuitem"]')) {
      setOpen(false)
    }
  }

  const menu =
    open && menuRect && typeof document !== 'undefined'
      ? createPortal(
          <div
            ref={menuRef}
            id={menuId}
            className={`bib-row-acoes-menu${menuClassName ? ` ${menuClassName}` : ''}`}
            style={{
              position: 'fixed',
              top: menuRect.top,
              left: menuRect.left,
              minWidth: menuRect.minWidth,
              maxHeight: menuRect.maxHeight,
              zIndex: 100070,
            }}
            role="menu"
            aria-label={label}
            onClick={onMenuClick}
          >
            {children}
          </div>,
          document.body
        )
      : null

  return (
    <div className={`bib-row-acoes${className ? ` ${className}` : ''}${open ? ' is-open' : ''}`}>
      <button
        ref={triggerRef}
        type="button"
        className="bib-row-acoes__summary"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        onClick={e => {
          e.stopPropagation()
          toggle()
        }}
      >
        <span className="bib-row-acoes__label">{label}</span>
        <span className="bib-row-acoes__chev" aria-hidden>
          {open ? '▼' : '▶'}
        </span>
      </button>
      {menu}
    </div>
  )
}
