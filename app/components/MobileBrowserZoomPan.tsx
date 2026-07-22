'use client'

import { useEffect, useRef } from 'react'

const PAN_ROOT_ID = 'mobile-pan-root'
const MIN_SCALE = 1
const MAX_SCALE = 4
/** Equilíbrio entre controlo e resposta (0.05=lento, 0.08=rápido). */
const ZOOM_SENSITIVITY = 0.075
const MIN_PINCH_DIST = 72
/** Mínimo movimento entre dedos antes de capturar o pinch (evita bloquear scroll). */
const PINCH_CAPTURE_DELTA_PX = 14

/** Só sidebar e listas internas pequenas — NÃO tab-inner-scroll (bloqueava pinch e scroll). */
const SCROLL_NATIVE_SELECTORS = [
  '.sidebar-scroll-inner',
  '.sidebar',
  '.biblioteca-pecas-hub__grupos-scroll',
  '.biblioteca-pecas-hub__catalog-table-wrap',
]

const scaleFromPinch = (startScale: number, fingerRatio: number) => {
  if (Math.abs(fingerRatio - 1) < 0.01) return startScale
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
}

type ScrollSnapshot = {
  windowX: number
  windowY: number
  containers: Array<{ el: HTMLElement; top: number; left: number }>
}

/**
 * Telemóvel/tablet touch (pointer: coarse, ≤1024px):
 * zoom + arrastar com 2 dedos via transform.
 */
export function MobileBrowserZoomPan() {
  const scaleRef = useRef(1)
  const panRef = useRef({ x: 0, y: 0 })
  const originRef = useRef({ x: 0, y: 0 })
  const lastPinchMidRef = useRef({ x: 0, y: 0 })
  const gestureRef = useRef<TouchGesture | null>(null)
  /** Distância inicial quando o 2.º dedo toca — pinch só activo após delta mínimo. */
  const pinchArmDistRef = useRef(0)
  const pinchCapturedRef = useRef(false)
  /** Posição de scroll antes do pinch — evita saltar ao topo (ex.: última peça da biblioteca). */
  const scrollSnapshotRef = useRef<ScrollSnapshot | null>(null)

  useEffect(() => {
    if (typeof window === 'undefined') return

    const isTouchMobile = () => {
      if (window.innerWidth > 1024) return false
      return window.matchMedia('(pointer: coarse)').matches
    }

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

    const originFromMid = (midX: number, midY: number) => {
      const root = panRoot()
      if (!root) return { x: midX, y: midY }
      const rect = root.getBoundingClientRect()
      return { x: midX - rect.left, y: midY - rect.top }
    }

    const isScrollableEl = (el: HTMLElement) => {
      const style = window.getComputedStyle(el)
      const oy = style.overflowY
      const ox = style.overflowX
      const scrollableY =
        (oy === 'auto' || oy === 'scroll' || oy === 'overlay') && el.scrollHeight > el.clientHeight + 1
      const scrollableX =
        (ox === 'auto' || ox === 'scroll' || ox === 'overlay') && el.scrollWidth > el.clientWidth + 1
      return scrollableY || scrollableX
    }

    const collectScrollSnapshot = (target: EventTarget | null): ScrollSnapshot => {
      const containers: ScrollSnapshot['containers'] = []
      const seen = new Set<HTMLElement>()

      const pushEl = (el: HTMLElement) => {
        if (seen.has(el) || !el.isConnected) return
        if (!isScrollableEl(el)) return
        seen.add(el)
        containers.push({ el, top: el.scrollTop, left: el.scrollLeft })
      }

      if (target instanceof Element) {
        let node: Element | null = target
        while (node) {
          if (node instanceof HTMLElement) pushEl(node)
          node = node.parentElement
        }
      }

      document.querySelectorAll<HTMLElement>('.tab-inner-scroll, .biblioteca-pecas-hub__grupos-scroll, .biblioteca-pecas-hub__catalog-table-wrap').forEach(pushEl)

      return { windowX: window.scrollX, windowY: window.scrollY, containers }
    }

    const saveScrollSnapshot = (target: EventTarget | null) => {
      scrollSnapshotRef.current = collectScrollSnapshot(target)
    }

    const restoreScrollSnapshot = () => {
      const snap = scrollSnapshotRef.current
      if (!snap) return
      for (const { el, top, left } of snap.containers) {
        if (!el.isConnected) continue
        if (el.scrollTop !== top) el.scrollTop = top
        if (el.scrollLeft !== left) el.scrollLeft = left
      }
      if (window.scrollX !== snap.windowX || window.scrollY !== snap.windowY) {
        window.scrollTo(snap.windowX, snap.windowY)
      }
    }

    const scheduleScrollRestore = () => {
      restoreScrollSnapshot()
      requestAnimationFrame(() => {
        restoreScrollSnapshot()
        requestAnimationFrame(restoreScrollSnapshot)
      })
    }

    const applyTransform = () => {
      const root = panRoot()
      if (!root) return

      const scale = scaleRef.current
      const { x, y } = panRef.current
      const { x: ox, y: oy } = originRef.current
      const zoomed = scale > 1.008

      setZoomedClass(zoomed)

      if (zoomed) {
        root.style.transformOrigin = `${ox}px ${oy}px`
        root.style.transform = `translate3d(${x}px, ${y}px, 0) scale(${scale})`
        root.style.willChange = 'transform'
      } else {
        root.style.transform = ''
        root.style.transformOrigin = ''
        root.style.willChange = ''
        panRef.current = { x: 0, y: 0 }
        originRef.current = { x: 0, y: 0 }
      }

      if (zoomed) scheduleScrollRestore()
    }

    const resetView = () => {
      scaleRef.current = 1
      panRef.current = { x: 0, y: 0 }
      originRef.current = { x: 0, y: 0 }
      gestureRef.current = null
      pinchCapturedRef.current = false
      pinchArmDistRef.current = 0
      scrollSnapshotRef.current = null
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

    const isNativeScrollTarget = (target: EventTarget | null) => {
      if (!(target instanceof Element)) return false
      return SCROLL_NATIVE_SELECTORS.some((sel) => target.closest(sel))
    }

    const armTwoFingerGesture = (e: TouchEvent) => {
      saveScrollSnapshot(e.target)
      const { x: panX, y: panY } = panRef.current
      const scale = scaleRef.current
      const mid = touchMidpoint(e.touches)
      const dist = Math.max(touchDistance(e.touches), MIN_PINCH_DIST)
      originRef.current = originFromMid(mid.x, mid.y)
      lastPinchMidRef.current = mid
      pinchArmDistRef.current = dist
      pinchCapturedRef.current = false
      gestureRef.current = {
        mode: 'two',
        startX: 0,
        startY: 0,
        startMidX: mid.x,
        startMidY: mid.y,
        startDist: dist,
        startPanX: panX,
        startPanY: panY,
        startScale: scale,
      }
    }

    const onTouchStart = (e: TouchEvent) => {
      if (!isTouchMobile()) return

      const root = panRoot()
      if (!root) return

      const { x: panX, y: panY } = panRef.current
      const scale = scaleRef.current
      const inScrollArea = isNativeScrollTarget(e.target)

      if (e.touches.length >= 2) {
        saveScrollSnapshot(e.target)
        e.preventDefault()
        scheduleScrollRestore()
        armTwoFingerGesture(e)
        return
      }

      if (e.touches.length === 1 && inScrollArea && scale <= 1.008) return

      if (e.touches.length === 1 && scale > 1.008) {
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
        }
      }
    }

    const onTouchMove = (e: TouchEvent) => {
      if (!isTouchMobile()) return

      if (e.touches.length === 2 && !gestureRef.current) {
        armTwoFingerGesture(e)
      }

      if (!gestureRef.current) return

      const g = gestureRef.current

      if (g.mode === 'two' && e.touches.length === 2) {
        const dist = Math.max(touchDistance(e.touches), MIN_PINCH_DIST)
        if (!pinchCapturedRef.current) {
          if (Math.abs(dist - pinchArmDistRef.current) < PINCH_CAPTURE_DELTA_PX) return
          pinchCapturedRef.current = true
        }

        const mid = touchMidpoint(e.touches)
        const ratio = dist / g.startDist
        const nextScale = scaleFromPinch(g.startScale, ratio)

        const panX = g.startPanX + (mid.x - g.startMidX)
        const panY = g.startPanY + (mid.y - g.startMidY)

        lastPinchMidRef.current = mid
        originRef.current = originFromMid(g.startMidX, g.startMidY)

        scaleRef.current = nextScale
        panRef.current = clampPan(panX, panY, nextScale)

        e.preventDefault()
        applyTransform()
        restoreScrollSnapshot()
        return
      }

      if (g.mode === 'one' && e.touches.length === 1 && scaleRef.current > 1.008) {
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
        if (gestureRef.current?.mode === 'two') {
          const mid = lastPinchMidRef.current
          originRef.current = originFromMid(
            mid.x || gestureRef.current.startMidX,
            mid.y || gestureRef.current.startMidY
          )
        }
        gestureRef.current = null
        pinchCapturedRef.current = false
        pinchArmDistRef.current = 0
        applyTransform()
        if (scaleRef.current <= 1.008) resetView()
        return
      }
      if (e.touches.length === 1 && scaleRef.current > 1.008) {
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
        }
        pinchCapturedRef.current = false
        return
      }
      if (e.touches.length === 2) {
        onTouchStart(e)
      }
    }

    const onResize = () => {
      if (!isTouchMobile()) resetView()
    }

    document.addEventListener('touchstart', onTouchStart, { passive: false, capture: true })
    document.addEventListener('touchmove', onTouchMove, { passive: false, capture: true })
    document.addEventListener('touchend', onTouchEnd, { capture: true })
    document.addEventListener('touchcancel', onTouchEnd, { capture: true })
    window.addEventListener('orientationchange', onResize)
    window.addEventListener('resize', onResize)

    return () => {
      document.removeEventListener('touchstart', onTouchStart, true)
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
