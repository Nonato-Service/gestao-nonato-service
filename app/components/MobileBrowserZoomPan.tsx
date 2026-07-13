'use client'

import { useEffect, useRef } from 'react'

const PAN_ROOT = '.app-layout'

type PanState = {
  mode: 'one' | 'two'
  x: number
  y: number
  sx: number
  sy: number
  pinchDist: number
  locked: boolean
}

/**
 * Telemóvel/tablet: após pinch-zoom do browser, arrastar a vista (1 ou 2 dedos) com transform.
 * O scroll nativo falha com overflow-x:hidden; translate no .app-layout funciona em iOS/Android.
 */
export function MobileBrowserZoomPan() {
  const zoomedRef = useRef(false)
  const panRef = useRef<PanState | null>(null)
  const panOffsetRef = useRef({ x: 0, y: 0 })
  const gestureScaleRef = useRef(1)
  const savedOverflowRef = useRef<{ html: string; body: string } | null>(null)

  useEffect(() => {
    if (typeof window === 'undefined') return

    const vv = window.visualViewport
    if (!vv) return

    const isCompact = () => window.innerWidth <= 1024

    const panRoot = () => document.querySelector<HTMLElement>(PAN_ROOT)

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
      return Math.max(vvScale, layoutScale, gestureScaleRef.current)
    }

    const touchMidpoint = (touches: TouchList) => ({
      x: (touches[0].clientX + touches[1].clientX) / 2,
      y: (touches[0].clientY + touches[1].clientY) / 2,
    })

    const touchDistance = (touches: TouchList) =>
      Math.hypot(touches[0].clientX - touches[1].clientX, touches[0].clientY - touches[1].clientY)

    const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v))

    const panLimits = () => {
      const scale = readScale()
      const margin = Math.max(80, window.innerWidth * (scale - 1) * 1.2 + window.innerWidth * 0.35)
      return { x: margin, y: margin }
    }

    const applyPanTransform = () => {
      const root = panRoot()
      if (!root) return
      const lim = panLimits()
      const x = clamp(panOffsetRef.current.x, -lim.x, lim.x)
      const y = clamp(panOffsetRef.current.y, -lim.y, lim.y)
      panOffsetRef.current = { x, y }
      root.style.transform = x || y ? `translate3d(${x}px, ${y}px, 0)` : ''
      root.style.willChange = x || y ? 'transform' : ''
    }

    const resetPanTransform = () => {
      panOffsetRef.current = { x: 0, y: 0 }
      const root = panRoot()
      if (root) {
        root.style.transform = ''
        root.style.willChange = ''
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
      } else {
        panRef.current = null
        resetPanTransform()
        if (savedOverflowRef.current) {
          document.documentElement.style.overflow = savedOverflowRef.current.html
          document.body.style.overflow = savedOverflowRef.current.body
          savedOverflowRef.current = null
        }
      }
    }

    const apply = () => {
      if (!isCompact()) {
        setZoomed(false)
        gestureScaleRef.current = 1
        return
      }
      const scale = readScale()
      const next = zoomedRef.current ? scale > 1.002 : scale > 1.008
      setZoomed(next)
    }

    let debounce: ReturnType<typeof setTimeout> | undefined
    const schedule = () => {
      if (debounce) clearTimeout(debounce)
      debounce = setTimeout(apply, 16)
    }

    const ensureZoomedForGesture = () => {
      if (!isCompact()) return
      const scale = readScale()
      if (scale > 1.002 && !zoomedRef.current) setZoomed(true)
    }

    const beginPan = (e: TouchEvent) => {
      ensureZoomedForGesture()
      if (!zoomedRef.current) return

      const off = panOffsetRef.current

      if (e.touches.length === 1) {
        panRef.current = {
          mode: 'one',
          x: e.touches[0].clientX,
          y: e.touches[0].clientY,
          sx: off.x,
          sy: off.y,
          pinchDist: 0,
          locked: false,
        }
        return
      }

      if (e.touches.length === 2) {
        const mid = touchMidpoint(e.touches)
        panRef.current = {
          mode: 'two',
          x: mid.x,
          y: mid.y,
          sx: off.x,
          sy: off.y,
          pinchDist: touchDistance(e.touches),
          locked: false,
        }
      }
    }

    const onTouchMove = (e: TouchEvent) => {
      ensureZoomedForGesture()
      if (!zoomedRef.current || !panRef.current) return

      const p = panRef.current

      if (p.mode === 'two' && e.touches.length === 2) {
        const mid = touchMidpoint(e.touches)
        const moveX = Math.abs(mid.x - p.x)
        const moveY = Math.abs(mid.y - p.y)

        if (!p.locked) {
          if (moveX + moveY < 6) return
          const distDelta = Math.abs(touchDistance(e.touches) - p.pinchDist)
          if (distDelta > moveX + moveY) return
          p.locked = true
        }

        const dx = p.x - mid.x
        const dy = p.y - mid.y
        if (Math.abs(dx) < 0.3 && Math.abs(dy) < 0.3) return

        e.preventDefault()
        e.stopPropagation()
        panOffsetRef.current = { x: p.sx + dx, y: p.sy + dy }
        applyPanTransform()
        return
      }

      if (p.mode === 'one' && e.touches.length === 1) {
        const dx = p.x - e.touches[0].clientX
        const dy = p.y - e.touches[0].clientY
        if (Math.abs(dx) < 0.5 && Math.abs(dy) < 0.5) return
        e.preventDefault()
        e.stopPropagation()
        panOffsetRef.current = { x: p.sx + dx, y: p.sy + dy }
        applyPanTransform()
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

    const onGestureStart = (e: Event) => {
      const ge = e as Event & { scale?: number }
      gestureScaleRef.current = ge.scale || 1
      ensureZoomedForGesture()
    }

    const onGestureChange = (e: Event) => {
      const ge = e as Event & { scale?: number }
      gestureScaleRef.current = ge.scale || 1
      ensureZoomedForGesture()
    }

    const onGestureEnd = () => {
      gestureScaleRef.current = 1
      schedule()
    }

    apply()
    vv.addEventListener('resize', schedule)
    vv.addEventListener('scroll', schedule)
    window.addEventListener('orientationchange', schedule)
    window.addEventListener('resize', schedule)
    document.addEventListener('gesturestart', onGestureStart, { capture: true })
    document.addEventListener('gesturechange', onGestureChange, { capture: true })
    document.addEventListener('gestureend', onGestureEnd, { capture: true })
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
      document.removeEventListener('gesturestart', onGestureStart, true)
      document.removeEventListener('gesturechange', onGestureChange, true)
      document.removeEventListener('gestureend', onGestureEnd, true)
      document.removeEventListener('touchstart', beginPan, true)
      document.removeEventListener('touchmove', onTouchMove, true)
      document.removeEventListener('touchend', onTouchEnd, true)
      document.removeEventListener('touchcancel', onTouchEnd, true)
      setZoomed(false)
    }
  }, [])

  return null
}
