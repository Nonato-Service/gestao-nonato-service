'use client'

import { useEffect, useRef } from 'react'

const PAN_TARGETS = [
  '.app-layout',
  '.app-compact-layout',
  '.main-app-column',
  '.main-content-area',
  '.tab-inner-scroll',
]

type PanState = {
  mode: 'one' | 'two'
  x: number
  y: number
  sx: number
  sy: number
  pinchDist: number
}

/**
 * Telemóvel/tablet: após pinch-zoom, arrastar a vista com 1 ou 2 dedos (X e Y).
 */
export function MobileBrowserZoomPan() {
  const zoomedRef = useRef(false)
  const panRef = useRef<PanState | null>(null)
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
      const vw = window.innerWidth
      const vh = window.innerHeight
      return {
        x: Math.max(0, se.scrollWidth - vw),
        y: Math.max(0, se.scrollHeight - vh),
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

    const touchMidpoint = (touches: TouchList) => ({
      x: (touches[0].clientX + touches[1].clientX) / 2,
      y: (touches[0].clientY + touches[1].clientY) / 2,
    })

    const touchDistance = (touches: TouchList) =>
      Math.hypot(touches[0].clientX - touches[1].clientX, touches[0].clientY - touches[1].clientY)

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
      if (scale <= 1.008) return
      const pad = 160
      const w = Math.ceil(Math.max(window.innerWidth * scale * 2.2, vv.width * scale * 1.5) + pad)
      const h = Math.ceil(Math.max(window.innerHeight * scale * 2.2, vv.height * scale * 1.5) + pad)

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
      const next = zoomedRef.current ? scale > 1.003 : scale > 1.01
      setZoomed(next)
      if (next) updateScrollExtent()
    }

    let debounce: ReturnType<typeof setTimeout> | undefined
    const schedule = () => {
      if (debounce) clearTimeout(debounce)
      debounce = setTimeout(apply, 30)
    }

    const beginPan = (e: TouchEvent) => {
      if (!zoomedRef.current) return
      const pos = getScrollPos()

      if (e.touches.length === 1) {
        panRef.current = {
          mode: 'one',
          x: e.touches[0].clientX,
          y: e.touches[0].clientY,
          sx: pos.x,
          sy: pos.y,
          pinchDist: 0,
        }
        return
      }

      if (e.touches.length === 2) {
        const mid = touchMidpoint(e.touches)
        panRef.current = {
          mode: 'two',
          x: mid.x,
          y: mid.y,
          sx: pos.x,
          sy: pos.y,
          pinchDist: touchDistance(e.touches),
        }
      }
    }

    const onTouchMove = (e: TouchEvent) => {
      if (!zoomedRef.current || !panRef.current) return

      const p = panRef.current

      if (p.mode === 'two' && e.touches.length === 2) {
        const dist = touchDistance(e.touches)
        const distDelta = Math.abs(dist - p.pinchDist)
        if (distDelta > 14) {
          p.pinchDist = dist
          schedule()
          return
        }
        const mid = touchMidpoint(e.touches)
        const dx = p.x - mid.x
        const dy = p.y - mid.y
        if (Math.abs(dx) < 0.5 && Math.abs(dy) < 0.5) return
        e.preventDefault()
        e.stopPropagation()
        applyScroll(p.sx + dx, p.sy + dy)
        return
      }

      if (p.mode === 'one' && e.touches.length === 1) {
        const dx = p.x - e.touches[0].clientX
        const dy = p.y - e.touches[0].clientY
        if (Math.abs(dx) < 0.5 && Math.abs(dy) < 0.5) return
        e.preventDefault()
        e.stopPropagation()
        applyScroll(p.sx + dx, p.sy + dy)
      }
    }

    const onTouchEnd = (e: TouchEvent) => {
      if (e.touches.length === 0) {
        panRef.current = null
        schedule()
        return
      }
      if (zoomedRef.current && e.touches.length === 1) {
        beginPan(e)
      }
    }

    apply()
    vv.addEventListener('resize', schedule)
    vv.addEventListener('scroll', schedule)
    window.addEventListener('orientationchange', schedule)
    window.addEventListener('resize', schedule)
    document.addEventListener('touchstart', beginPan, { passive: true, capture: true })
    document.addEventListener('touchmove', onTouchMove, { passive: false, capture: true })
    document.addEventListener('touchend', onTouchEnd, { capture: true })
    document.addEventListener('touchcancel', onTouchEnd, { capture: true })

    return () => {
      if (debounce) clearTimeout(debounce)
      vv.removeEventListener('resize', schedule)
      vv.removeEventListener('scroll', schedule)
      window.removeEventListener('orientationchange', schedule)
      window.removeEventListener('resize', schedule)
      document.removeEventListener('touchstart', beginPan, true)
      document.removeEventListener('touchmove', onTouchMove, true)
      document.removeEventListener('touchend', onTouchEnd, true)
      document.removeEventListener('touchcancel', onTouchEnd, true)
      setZoomed(false)
    }
  }, [])

  return null
}
