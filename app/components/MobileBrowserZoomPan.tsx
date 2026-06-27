'use client'

import { useEffect, useRef } from 'react'

/**
 * Telemóvel/tablet: após pinch-zoom do browser, permite arrastar a vista em X e Y.
 * Firefox: visualViewport.scale pode falhar — usa fallbacks e touch-action via CSS.
 */
export function MobileBrowserZoomPan() {
  const zoomedRef = useRef(false)
  const panRef = useRef<{ x: number; y: number; sx: number; sy: number } | null>(null)
  const savedOverflowRef = useRef<{ html: string; body: string } | null>(null)
  const savedExtentRef = useRef<{ el: HTMLElement; minW: string; minH: string }[]>([])

  useEffect(() => {
    if (typeof window === 'undefined') return

    const vv = window.visualViewport
    const isTouchDevice =
      navigator.maxTouchPoints > 0 || 'ontouchstart' in window
    const isFirefox = /Firefox\//i.test(navigator.userAgent || '')

    if (!isTouchDevice) return

    const shouldHandle = () => window.innerWidth <= 1280

    const getScale = () => {
      if (vv && vv.scale > 0 && Number.isFinite(vv.scale)) {
        return vv.scale
      }
      const cw = document.documentElement.clientWidth
      const iw = window.innerWidth
      if (cw > 0 && iw > 0 && cw > iw + 1) return cw / iw
      if (isFirefox && vv && vv.width > 0 && iw > 0 && iw > vv.width + 1) {
        return iw / vv.width
      }
      return 1
    }

    const hasScrollOverflow = () => {
      const root = document.documentElement
      return (
        root.scrollWidth > root.clientWidth + 4 ||
        root.scrollHeight > root.clientHeight + 4
      )
    }

    const toggleLayoutClass = (zoomed: boolean) => {
      document.documentElement.classList.toggle('mobile-browser-zoomed', zoomed)
      document.body.classList.toggle('mobile-browser-zoomed', zoomed)
      for (const sel of ['.app-layout', '.app-compact-layout']) {
        document.querySelector(sel)?.classList.toggle('mobile-browser-zoomed', zoomed)
      }
    }

    const clearScrollExtent = () => {
      for (const { el, minW, minH } of savedExtentRef.current) {
        el.style.minWidth = minW
        el.style.minHeight = minH
      }
      savedExtentRef.current = []
      document.documentElement.style.minWidth = ''
      document.documentElement.style.minHeight = ''
      document.body.style.minWidth = ''
      document.body.style.minHeight = ''
    }

    const updateScrollExtent = () => {
      const scale = Math.max(getScale(), 1)
      const pad = isFirefox ? 128 : 96
      const layoutW = document.documentElement.clientWidth
      const layoutH = document.documentElement.clientHeight
      const contentH = Math.max(
        document.documentElement.scrollHeight,
        document.body.scrollHeight,
        layoutH
      )
      const w = Math.ceil(layoutW * scale + pad)
      const h = Math.ceil(Math.max(contentH, layoutH * scale) + pad)

      document.documentElement.style.minWidth = `${w}px`
      document.documentElement.style.minHeight = `${h}px`
      document.body.style.minWidth = `${w}px`
      document.body.style.minHeight = `${h}px`

      const targets = ['.app-layout', '.app-compact-layout', '.main-app-column'] as const
      for (const sel of targets) {
        const el = document.querySelector(sel) as HTMLElement | null
        if (!el) continue
        const already = savedExtentRef.current.find((item) => item.el === el)
        if (!already) {
          savedExtentRef.current.push({
            el,
            minW: el.style.minWidth,
            minH: el.style.minHeight,
          })
        }
        el.style.minWidth = `${w}px`
        el.style.minHeight = `${Math.max(h, contentH)}px`
      }
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
      if (!shouldHandle()) {
        setZoomed(false)
        return
      }
      const scale = getScale()
      const desktopSite = document.documentElement.classList.contains('app-touch-desktop-site')
      const scaleZoomed = zoomedRef.current ? scale > 1.003 : scale > 1.012
      const overflowZoomed = isFirefox && (scaleZoomed || (desktopSite && hasScrollOverflow()))
      const next = isFirefox ? overflowZoomed || scaleZoomed : scaleZoomed
      setZoomed(next)
      if (next) updateScrollExtent()
    }

    let debounce: ReturnType<typeof setTimeout> | undefined
    const schedule = () => {
      if (debounce) clearTimeout(debounce)
      debounce = setTimeout(apply, 40)
    }

    const scrollToPan = (left: number, top: number) => {
      const root = document.documentElement
      const maxX = Math.max(0, root.scrollWidth - root.clientWidth)
      const maxY = Math.max(0, root.scrollHeight - root.clientHeight)
      const x = Math.min(maxX, Math.max(0, left))
      const y = Math.min(maxY, Math.max(0, top))
      window.scrollTo(x, y)
      root.scrollLeft = x
      root.scrollTop = y
      document.body.scrollLeft = x
      document.body.scrollTop = y
    }

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        schedule()
        if (isFirefox) updateScrollExtent()
        return
      }
      if (!zoomedRef.current || e.touches.length !== 1) return
      updateScrollExtent()
      panRef.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
        sx: window.scrollX || document.documentElement.scrollLeft,
        sy: window.scrollY || document.documentElement.scrollTop,
      }
    }

    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 2) return
      if (!zoomedRef.current || !panRef.current || e.touches.length !== 1) return

      const p = panRef.current
      const dx = p.x - e.touches[0].clientX
      const dy = p.y - e.touches[0].clientY
      if (Math.abs(dx) + Math.abs(dy) < 2) return

      e.preventDefault()
      scrollToPan(p.sx + dx, p.sy + dy)
    }

    const onTouchEnd = () => {
      panRef.current = null
      schedule()
    }

    apply()
    if (vv) {
      vv.addEventListener('resize', schedule)
      vv.addEventListener('scroll', schedule)
    }
    window.addEventListener('orientationchange', schedule)
    window.addEventListener('resize', schedule)
    document.addEventListener('touchstart', onTouchStart, { passive: true, capture: true })
    document.addEventListener('touchmove', onTouchMove, { passive: false, capture: true })
    document.addEventListener('touchend', onTouchEnd, { capture: true })
    document.addEventListener('touchcancel', onTouchEnd, { capture: true })

    return () => {
      if (debounce) clearTimeout(debounce)
      if (vv) {
        vv.removeEventListener('resize', schedule)
        vv.removeEventListener('scroll', schedule)
      }
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
