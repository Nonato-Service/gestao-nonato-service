'use client'

import { useEffect, useRef } from 'react'

/**
 * Telemóvel/tablet: após pinch-zoom do browser, permite arrastar a vista em X e Y.
 * Os contentores internos (.tab-inner-scroll, pan-y) bloqueiam o pan nativo — aqui
 * libertamos o documento e fazemos scroll manual com um dedo quando ampliado.
 */
export function MobileBrowserZoomPan() {
  const zoomedRef = useRef(false)
  const panRef = useRef<{ x: number; y: number; sx: number; sy: number } | null>(null)
  const savedOverflowRef = useRef<{ html: string; body: string } | null>(null)

  useEffect(() => {
    if (typeof window === 'undefined') return

    const vv = window.visualViewport
    if (!vv) return

    const isCompact = () => window.innerWidth <= 1024

    const toggleLayoutClass = (zoomed: boolean) => {
      document.documentElement.classList.toggle('mobile-browser-zoomed', zoomed)
      document.body.classList.toggle('mobile-browser-zoomed', zoomed)
      document.querySelector('.app-layout')?.classList.toggle('mobile-browser-zoomed', zoomed)
    }

    const updateScrollExtent = () => {
      const scale = vv.scale
      if (scale <= 1.01) return
      const pad = 64
      const w = Math.ceil(Math.max(document.documentElement.scrollWidth, vv.width * scale) + pad)
      const h = Math.ceil(Math.max(document.documentElement.scrollHeight, vv.height * scale) + pad)
      document.documentElement.style.minWidth = `${w}px`
      document.documentElement.style.minHeight = `${h}px`
      document.body.style.minWidth = `${w}px`
      document.body.style.minHeight = `${h}px`
    }

    const clearScrollExtent = () => {
      document.documentElement.style.minWidth = ''
      document.documentElement.style.minHeight = ''
      document.body.style.minWidth = ''
      document.body.style.minHeight = ''
    }

    const setZoomed = (zoomed: boolean) => {
      if (zoomedRef.current === zoomed) return
      zoomedRef.current = zoomed
      toggleLayoutClass(zoomed)

      if (zoomed) {
        savedOverflowRef.current = {
          html: document.documentElement.style.overflow,
          body: document.body.style.overflow,
        }
        document.documentElement.style.overflow = 'auto'
        document.body.style.overflow = 'auto'
        updateScrollExtent()
      } else {
        panRef.current = null
        if (savedOverflowRef.current) {
          document.documentElement.style.overflow = savedOverflowRef.current.html
          document.body.style.overflow = savedOverflowRef.current.body
          savedOverflowRef.current = null
        }
        clearScrollExtent()
      }
    }

    const apply = () => {
      if (!isCompact()) {
        setZoomed(false)
        return
      }
      const scale = vv.scale
      const next = zoomedRef.current ? scale > 1.012 : scale > 1.028
      setZoomed(next)
      if (next) updateScrollExtent()
    }

    let debounce: ReturnType<typeof setTimeout> | undefined
    const schedule = () => {
      if (debounce) clearTimeout(debounce)
      debounce = setTimeout(apply, 50)
    }

    const onTouchStart = (e: TouchEvent) => {
      if (!zoomedRef.current || e.touches.length !== 1) return
      panRef.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
        sx: window.scrollX,
        sy: window.scrollY,
      }
    }

    const onTouchMove = (e: TouchEvent) => {
      if (!zoomedRef.current || !panRef.current || e.touches.length !== 1) return
      const p = panRef.current
      const dx = p.x - e.touches[0].clientX
      const dy = p.y - e.touches[0].clientY
      if (Math.abs(dx) + Math.abs(dy) < 3) return
      e.preventDefault()
      window.scrollTo(Math.max(0, p.sx + dx), Math.max(0, p.sy + dy))
    }

    const onTouchEnd = () => {
      panRef.current = null
    }

    apply()
    vv.addEventListener('resize', schedule)
    vv.addEventListener('scroll', schedule)
    window.addEventListener('orientationchange', schedule)
    window.addEventListener('resize', schedule)
    document.addEventListener('touchstart', onTouchStart, { passive: true, capture: true })
    document.addEventListener('touchmove', onTouchMove, { passive: false, capture: true })
    document.addEventListener('touchend', onTouchEnd, { capture: true })
    document.addEventListener('touchcancel', onTouchEnd, { capture: true })

    return () => {
      if (debounce) clearTimeout(debounce)
      vv.removeEventListener('resize', schedule)
      vv.removeEventListener('scroll', schedule)
      window.removeEventListener('orientationchange', schedule)
      window.removeEventListener('resize', schedule)
      document.removeEventListener('touchstart', onTouchStart, true)
      document.removeEventListener('touchmove', onTouchMove, true)
      document.removeEventListener('touchend', onTouchEnd, true)
      document.removeEventListener('touchcancel', onTouchEnd, true)
      setZoomed(false)
    }
  }, [])

  return null
}
