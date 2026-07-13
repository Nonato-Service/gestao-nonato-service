'use client'

import { useEffect, useRef } from 'react'

const PAN_TARGETS = [
  '.app-layout',
  '.app-compact-layout',
  '.main-app-column',
  '.main-content-area',
  '.tab-inner-scroll',
]

/**
 * Telemóvel/tablet: após pinch-zoom, permite arrastar a vista em X e Y.
 */
export function MobileBrowserZoomPan() {
  const zoomedRef = useRef(false)
  const panRef = useRef<{ x: number; y: number; sx: number; sy: number } | null>(null)
  const savedOverflowRef = useRef<{ html: string; body: string } | null>(null)
  const styledElsRef = useRef<HTMLElement[]>([])

  useEffect(() => {
    if (typeof window === 'undefined') return

    const vv = window.visualViewport
    if (!vv) return

    const isCompact = () => window.innerWidth <= 1024

    const panTargets = (): HTMLElement[] => {
      const els: HTMLElement[] = [document.documentElement, document.body]
      for (const sel of PAN_TARGETS) {
        document.querySelectorAll<HTMLElement>(sel).forEach((el) => els.push(el))
      }
      return els
    }

    const toggleLayoutClass = (zoomed: boolean) => {
      document.documentElement.classList.toggle('mobile-browser-zoomed', zoomed)
      document.body.classList.toggle('mobile-browser-zoomed', zoomed)
      document.querySelectorAll('.app-layout, .app-compact-layout').forEach((el) => {
        el.classList.toggle('mobile-browser-zoomed', zoomed)
      })
    }

    const readScale = () => {
      const vvScale = vv.scale || 1
      const layoutScale = vv.width > 0 ? window.innerWidth / vv.width : 1
      return Math.max(vvScale, layoutScale)
    }

    const scrollEl = () => document.scrollingElement || document.documentElement

    const getScrollPos = () => {
      const se = scrollEl()
      return {
        x: se.scrollLeft || window.scrollX || 0,
        y: se.scrollTop || window.scrollY || 0,
      }
    }

    const getMaxScroll = () => {
      const se = scrollEl()
      return {
        x: Math.max(0, se.scrollWidth - window.innerWidth),
        y: Math.max(0, se.scrollHeight - window.innerHeight),
      }
    }

    const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v))

    const applyScroll = (x: number, y: number) => {
      const max = getMaxScroll()
      const nx = clamp(x, 0, max.x)
      const ny = clamp(y, 0, max.y)
      const se = scrollEl()
      se.scrollLeft = nx
      se.scrollTop = ny
      window.scrollTo(nx, ny)
    }

    const clearPanStyles = () => {
      for (const el of styledElsRef.current) {
        el.style.minWidth = ''
        el.style.minHeight = ''
        el.style.overflow = ''
        el.style.overflowX = ''
      }
      styledElsRef.current = []
      document.documentElement.style.minWidth = ''
      document.documentElement.style.minHeight = ''
      document.body.style.minWidth = ''
      document.body.style.minHeight = ''
    }

    const updateScrollExtent = () => {
      const scale = readScale()
      if (scale <= 1.01) return
      const pad = 128
      const w = Math.ceil(Math.max(window.innerWidth * scale, vv.width * scale) + pad)
      const h = Math.ceil(Math.max(window.innerHeight * scale, vv.height * scale) + pad)

      const els = panTargets()
      styledElsRef.current = els
      for (const el of els) {
        el.style.minWidth = `${w}px`
        el.style.minHeight = `${h}px`
        if (el !== document.documentElement && el !== document.body) {
          el.style.overflow = 'visible'
          el.style.overflowX = 'visible'
        }
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
        clearPanStyles()
      }
    }

    const apply = () => {
      if (!isCompact()) {
        setZoomed(false)
        return
      }
      const scale = readScale()
      const next = zoomedRef.current ? scale > 1.005 : scale > 1.015
      setZoomed(next)
      if (next) updateScrollExtent()
    }

    let debounce: ReturnType<typeof setTimeout> | undefined
    const schedule = () => {
      if (debounce) clearTimeout(debounce)
      debounce = setTimeout(apply, 40)
    }

    const onTouchStart = (e: TouchEvent) => {
      if (!zoomedRef.current || e.touches.length !== 1) return
      const pos = getScrollPos()
      panRef.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
        sx: pos.x,
        sy: pos.y,
      }
    }

    const onTouchMove = (e: TouchEvent) => {
      if (!zoomedRef.current || !panRef.current || e.touches.length !== 1) return
      const p = panRef.current
      const dx = p.x - e.touches[0].clientX
      const dy = p.y - e.touches[0].clientY
      if (Math.abs(dx) < 1 && Math.abs(dy) < 1) return
      e.preventDefault()
      e.stopPropagation()
      applyScroll(p.sx + dx, p.sy + dy)
    }

    const onTouchEnd = (e: TouchEvent) => {
      panRef.current = null
      if (e.touches.length === 0) schedule()
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
