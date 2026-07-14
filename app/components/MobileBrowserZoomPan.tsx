'use client'

import { useEffect, useRef } from 'react'

const PAN_ROOT_ID = 'mobile-pan-root'
const MIN_SCALE = 1
const MAX_SCALE = 4
/** Menor = pinch mais suave. 0.08 ≈ muito lento; 0.4 = sensível. */
const ZOOM_SENSITIVITY = 0.08
const MIN_PINCH_DIST = 120

/** Áreas com scroll nativo — não capturar pan com 1 dedo quando há zoom. */
const SCROLL_NATIVE_SELECTORS = ['.sidebar-scroll-inner', '.sidebar']

const scaleFromPinch = (startScale: number, fingerRatio: number) => {
  if (Math.abs(fingerRatio - 1) < 0.028) return startScale
  const dampedRatio = 1 + (fingerRatio - 1) * ZOOM_SENSITIVITY
  return Math.min(MAX_SCALE, Math.max(MIN_SCALE, startScale * dampedRatio))
}

type TouchGesture = {
  mode: 'one' | 'two'
  startX: number
  startY: number
  startMidX: number
  startMidY: number
  startDist: number
  startPanX: number
  startPanY: number
  startScale: number
  originX: number
  originY: number
}

/**
 * Telemóvel/tablet (Android Chrome, ex. Ulefone Armor 33 Pro):
 * zoom + arrastar com 2 dedos via transform — não depende do pinch do browser.
 */
export function MobileBrowserZoomPan() {
  const scaleRef = useRef(1)
  const panRef = useRef({ x: 0, y: 0 })
  const gestureRef = useRef<TouchGesture | null>(null)

  useEffect(() => {
    if (typeof window === 'undefined') return

    const isTouchMobile = () =>
      window.innerWidth <= 1024 &&
      (window.matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window)

    const panRoot = () => document.getElementById(PAN_ROOT_ID)

    const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v))

    const touchMidpoint = (touches: TouchList) => ({
      x: (touches[0].clientX + touches[1].clientX) / 2,
      y: (touches[0].clientY + touches[1].clientY) / 2,
    })

    const touchDistance = (touches: TouchList) =>
      Math.hypot(touches[0].clientX - touches[1].clientX, touches[0].clientY - touches[1].clientY)

    const setZoomedClass = (zoomed: boolean) => {
      document.documentElement.classList.toggle('mobile-browser-zoomed', zoomed)
      document.body.classList.toggle('mobile-browser-zoomed', zoomed)
    }

    const applyTransform = () => {
      const root = panRoot()
      if (!root) return

      const scale = scaleRef.current
      const { x, y } = panRef.current
      const zoomed = scale > 1.004

      setZoomedClass(zoomed)

      if (zoomed) {
        root.style.transformOrigin = `${gestureRef.current?.originX ?? 0}px ${gestureRef.current?.originY ?? 0}px`
        root.style.transform = `translate3d(${x}px, ${y}px, 0) scale(${scale})`
        root.style.willChange = 'transform'
      } else {
        root.style.transform = ''
        root.style.transformOrigin = ''
        root.style.willChange = ''
        panRef.current = { x: 0, y: 0 }
      }
    }

    const resetView = () => {
      scaleRef.current = 1
      panRef.current = { x: 0, y: 0 }
      gestureRef.current = null
      applyTransform()
    }

    const panLimits = (scale: number) => {
      const base = Math.max(window.innerWidth, window.innerHeight)
      const extra = base * (scale - 1) * 1.35 + base * 0.25
      return { x: extra, y: extra }
    }

    const clampPan = (x: number, y: number, scale: number) => {
      const lim = panLimits(scale)
      return {
        x: clamp(x, -lim.x, lim.x),
        y: clamp(y, -lim.y, lim.y),
      }
    }

    const originFromMid = (midX: number, midY: number) => {
      const root = panRoot()
      if (!root) return { x: midX, y: midY }
      const rect = root.getBoundingClientRect()
      return { x: midX - rect.left, y: midY - rect.top }
    }

    const isNativeScrollTarget = (target: EventTarget | null) => {
      if (!(target instanceof Element)) return false
      return SCROLL_NATIVE_SELECTORS.some((sel) => target.closest(sel))
    }

    const beginGesture = (e: TouchEvent) => {
      if (!isTouchMobile()) return

      const root = panRoot()
      if (!root) return

      const { x: panX, y: panY } = panRef.current
      const scale = scaleRef.current
      const inScrollArea = isNativeScrollTarget(e.target)

      if (e.touches.length === 1 && inScrollArea) return

      if (e.touches.length === 2) {
        if (inScrollArea) return
        const mid = touchMidpoint(e.touches)
        const origin = originFromMid(mid.x, mid.y)
        gestureRef.current = {
          mode: 'two',
          startX: 0,
          startY: 0,
          startMidX: mid.x,
          startMidY: mid.y,
          startDist: Math.max(touchDistance(e.touches), MIN_PINCH_DIST),
          startPanX: panX,
          startPanY: panY,
          startScale: scale,
          originX: origin.x,
          originY: origin.y,
        }
        return
      }

      if (e.touches.length === 1 && scale > 1.004) {
        gestureRef.current = {
          mode: 'one',
          startX: e.touches[0].clientX,
          startY: e.touches[0].clientY,
          startMidX: 0,
          startMidY: 0,
          startDist: 0,
          startPanX: panX,
          startPanY: panY,
          startScale: scale,
          originX: 0,
          originY: 0,
        }
      }
    }

    const onTouchMove = (e: TouchEvent) => {
      if (!isTouchMobile() || !gestureRef.current) return
      if (isNativeScrollTarget(e.target)) return

      const g = gestureRef.current

      if (g.mode === 'two' && e.touches.length === 2) {
        const mid = touchMidpoint(e.touches)
        const dist = Math.max(touchDistance(e.touches), MIN_PINCH_DIST)
        const ratio = dist / g.startDist
        const nextScale = scaleFromPinch(g.startScale, ratio)

        const panX = g.startPanX + (mid.x - g.startMidX)
        const panY = g.startPanY + (mid.y - g.startMidY)

        const origin = originFromMid(g.startMidX, g.startMidY)
        g.originX = origin.x
        g.originY = origin.y

        scaleRef.current = nextScale
        panRef.current = clampPan(panX, panY, nextScale)

        e.preventDefault()
        applyTransform()
        return
      }

      if (g.mode === 'one' && e.touches.length === 1 && scaleRef.current > 1.004) {
        const dx = e.touches[0].clientX - g.startX
        const dy = e.touches[0].clientY - g.startY
        if (Math.abs(dx) < 0.4 && Math.abs(dy) < 0.4) return

        panRef.current = clampPan(g.startPanX + dx, g.startPanY + dy, scaleRef.current)
        e.preventDefault()
        applyTransform()
      }
    }

    const onTouchEnd = (e: TouchEvent) => {
      if (e.touches.length === 0) {
        gestureRef.current = null
        if (scaleRef.current <= 1.004) resetView()
        return
      }
      if (e.touches.length === 1 && scaleRef.current > 1.004) {
        gestureRef.current = {
          mode: 'one',
          startX: e.touches[0].clientX,
          startY: e.touches[0].clientY,
          startMidX: 0,
          startMidY: 0,
          startDist: 0,
          startPanX: panRef.current.x,
          startPanY: panRef.current.y,
          startScale: scaleRef.current,
          originX: 0,
          originY: 0,
        }
        return
      }
      if (e.touches.length === 2) {
        beginGesture(e)
      }
    }

    const onResize = () => {
      if (!isTouchMobile()) resetView()
    }

    document.addEventListener('touchstart', beginGesture, { passive: true, capture: true })
    document.addEventListener('touchmove', onTouchMove, { passive: false, capture: true })
    document.addEventListener('touchend', onTouchEnd, { capture: true })
    document.addEventListener('touchcancel', onTouchEnd, { capture: true })
    window.addEventListener('orientationchange', onResize)
    window.addEventListener('resize', onResize)

    return () => {
      document.removeEventListener('touchstart', beginGesture, true)
      document.removeEventListener('touchmove', onTouchMove, true)
      document.removeEventListener('touchend', onTouchEnd, true)
      document.removeEventListener('touchcancel', onTouchEnd, true)
      window.removeEventListener('orientationchange', onResize)
      window.removeEventListener('resize', onResize)
      resetView()
    }
  }, [])

  return null
}
