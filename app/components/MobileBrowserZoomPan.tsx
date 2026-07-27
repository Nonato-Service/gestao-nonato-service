'use client'

import { useEffect, useRef } from 'react'

const PAN_ROOT_ID = 'mobile-pan-root'
const MIN_SCALE = 1
const MAX_SCALE = 4
const ZOOM_SENSITIVITY = 0.075
const MIN_PINCH_DIST = 96
const PINCH_CAPTURE_DELTA_PX = 22
const ZOOM_ACTIVE_SCALE = 1.045

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

type ZoomSurface = {
  mode: 'root' | 'biblioteca'
  transformEl: HTMLElement
  scrollEl: HTMLElement | null
}

type ScrollSnapshot = {
  windowX: number
  windowY: number
  containers: Array<{ el: HTMLElement; top: number; left: number }>
}

/**
 * Telemóvel/tablet touch: zoom com 2 dedos.
 * Biblioteca de peças: zoom local no conteúdo da aba (não move o cabeçalho).
 * Resto da app: zoom global em #mobile-pan-root (comportamento v74).
 */
export function MobileBrowserZoomPan() {
  const scaleRef = useRef(1)
  const panRef = useRef({ x: 0, y: 0 })
  const originRef = useRef({ x: 0, y: 0 })
  const lastPinchMidRef = useRef({ x: 0, y: 0 })
  const gestureRef = useRef<TouchGesture | null>(null)
  const zoomSurfaceRef = useRef<ZoomSurface | null>(null)
  const pinchArmDistRef = useRef(0)
  const pinchCapturedRef = useRef(false)
  const scrollSnapshotRef = useRef<ScrollSnapshot | null>(null)

  useEffect(() => {
    if (typeof window === 'undefined') return

    const isTouchMobile = () => {
      if (window.innerWidth > 1280) return false
      if (window.matchMedia('(pointer: coarse)').matches) return true
      return navigator.maxTouchPoints > 0 && window.innerWidth <= 1024
    }

    const panRoot = () => document.getElementById(PAN_ROOT_ID)

    const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v))

    const touchMidpoint = (touches: TouchList) => ({
      x: (touches[0].clientX + touches[1].clientX) / 2,
      y: (touches[0].clientY + touches[1].clientY) / 2,
    })

    const touchDistance = (touches: TouchList) =>
      Math.hypot(touches[0].clientX - touches[1].clientX, touches[0].clientY - touches[1].clientY)

    const resolveZoomSurface = (target: EventTarget | null): ZoomSurface | null => {
      const root = panRoot()
      if (!root) return null

      if (target instanceof Element) {
        const inBiblioteca = target.closest('.biblioteca-pecas-hub')
        if (inBiblioteca) {
          const scrollEl = inBiblioteca.closest('.tab-inner-scroll')
          if (scrollEl instanceof HTMLElement) {
            const contentEl = scrollEl.firstElementChild
            if (contentEl instanceof HTMLElement) {
              return { mode: 'biblioteca', transformEl: contentEl, scrollEl }
            }
          }
        }
      }

      return { mode: 'root', transformEl: root, scrollEl: null }
    }

    const setGlobalZoomedClass = (zoomed: boolean) => {
      document.documentElement.classList.toggle('mobile-browser-zoomed', zoomed)
      document.body.classList.toggle('mobile-browser-zoomed', zoomed)
    }

    const setBibliotecaZoomedClass = (zoomed: boolean) => {
      document.documentElement.classList.toggle('mobile-biblioteca-local-zoomed', zoomed)
      document.body.classList.toggle('mobile-biblioteca-local-zoomed', zoomed)
    }

    const originFromMid = (midX: number, midY: number, el: HTMLElement) => {
      const rect = el.getBoundingClientRect()
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

      document
        .querySelectorAll<HTMLElement>(
          '.tab-inner-scroll:has(.biblioteca-pecas-hub), .biblioteca-pecas-hub__grupos-scroll, .biblioteca-pecas-hub__catalog-table-wrap'
        )
        .forEach(pushEl)

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

    const lockBibliotecaScroll = (scrollEl: HTMLElement) => {
      if (!scrollEl.dataset.nsZoomScrollTop) {
        scrollEl.dataset.nsZoomScrollTop = String(scrollEl.scrollTop)
        scrollEl.dataset.nsZoomScrollLeft = String(scrollEl.scrollLeft)
      }
      scrollEl.classList.add('mobile-local-zoom-active')
      restoreScrollSnapshot()
    }

    const unlockBibliotecaScroll = (scrollEl: HTMLElement) => {
      const top = Number(scrollEl.dataset.nsZoomScrollTop ?? scrollEl.scrollTop)
      const left = Number(scrollEl.dataset.nsZoomScrollLeft ?? scrollEl.scrollLeft)
      scrollEl.classList.remove('mobile-local-zoom-active')
      scrollEl.scrollTop = top
      scrollEl.scrollLeft = left
      delete scrollEl.dataset.nsZoomScrollTop
      delete scrollEl.dataset.nsZoomScrollLeft
    }

    const clearTransform = (el: HTMLElement) => {
      el.style.transform = ''
      el.style.transformOrigin = ''
      el.style.willChange = ''
    }

    const applyTransform = () => {
      const surface =
        zoomSurfaceRef.current ??
        (panRoot() ? { mode: 'root' as const, transformEl: panRoot()!, scrollEl: null } : null)
      if (!surface) return

      const scale = scaleRef.current
      const { x, y } = panRef.current
      const { x: ox, y: oy } = originRef.current
      const zoomed = scale > ZOOM_ACTIVE_SCALE

      if (surface.mode === 'root') {
        setGlobalZoomedClass(zoomed)
        setBibliotecaZoomedClass(false)
      } else if (surface.scrollEl) {
        setGlobalZoomedClass(false)
        setBibliotecaZoomedClass(zoomed)
        if (zoomed) {
          lockBibliotecaScroll(surface.scrollEl)
        } else {
          unlockBibliotecaScroll(surface.scrollEl)
        }
      }

      if (zoomed) {
        surface.transformEl.style.transformOrigin = `${ox}px ${oy}px`
        surface.transformEl.style.transform = `translate3d(${x}px, ${y}px, 0) scale(${scale})`
        surface.transformEl.style.willChange = 'transform'
      } else {
        clearTransform(surface.transformEl)
        if (surface.mode === 'root') {
          panRef.current = { x: 0, y: 0 }
          originRef.current = { x: 0, y: 0 }
        }
      }

      if (zoomed && surface.mode === 'biblioteca') {
        scheduleScrollRestore()
      }
    }

    const resetAllSurfaces = () => {
      setGlobalZoomedClass(false)
      setBibliotecaZoomedClass(false)
      const root = panRoot()
      if (root) clearTransform(root)
      document.querySelectorAll<HTMLElement>('.tab-inner-scroll:has(.biblioteca-pecas-hub)').forEach((scrollEl) => {
        unlockBibliotecaScroll(scrollEl)
        const child = scrollEl.firstElementChild
        if (child instanceof HTMLElement) clearTransform(child)
      })
    }

    const resetView = () => {
      scaleRef.current = 1
      panRef.current = { x: 0, y: 0 }
      originRef.current = { x: 0, y: 0 }
      gestureRef.current = null
      zoomSurfaceRef.current = null
      pinchCapturedRef.current = false
      pinchArmDistRef.current = 0
      scrollSnapshotRef.current = null
      resetAllSurfaces()
    }

    const panLimits = (scale: number, surface: ZoomSurface) => {
      const baseEl = surface.scrollEl ?? surface.transformEl
      const base = Math.max(baseEl.clientWidth || window.innerWidth, baseEl.clientHeight || window.innerHeight)
      let extraY = base * (scale - 1) * 1.35 + base * 0.25
      if (surface.mode === 'biblioteca' && surface.scrollEl) {
        const scrollTop = Number(surface.scrollEl.dataset.nsZoomScrollTop ?? surface.scrollEl.scrollTop)
        const maxScroll = Math.max(0, surface.scrollEl.scrollHeight - surface.scrollEl.clientHeight)
        extraY += (scrollTop + maxScroll * 0.35) * Math.max(0, scale - 1)
      }
      const extraX = base * (scale - 1) * 1.35 + base * 0.25
      return { x: extraX, y: extraY }
    }

    const clampPan = (x: number, y: number, scale: number, surface: ZoomSurface) => {
      const lim = panLimits(scale, surface)
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
      const surface = resolveZoomSurface(e.target)
      if (!surface) return

      zoomSurfaceRef.current = surface
      saveScrollSnapshot(e.target)

      const { x: panX, y: panY } = panRef.current
      const scale = scaleRef.current
      const mid = touchMidpoint(e.touches)
      const dist = Math.max(touchDistance(e.touches), MIN_PINCH_DIST)

      originRef.current = originFromMid(mid.x, mid.y, surface.transformEl)
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
      if (!panRoot()) return

      const { x: panX, y: panY } = panRef.current
      const scale = scaleRef.current
      const inScrollArea = isNativeScrollTarget(e.target)
      const surface = resolveZoomSurface(e.target)

      if (e.touches.length >= 2) {
        armTwoFingerGesture(e)
        if (surface?.mode === 'root') {
          e.preventDefault()
          scheduleScrollRestore()
        }
        return
      }

      if (e.touches.length === 1 && inScrollArea && scale <= 1.008) return

      if (e.touches.length === 1 && scale > 1.008) {
        if (!zoomSurfaceRef.current) {
          zoomSurfaceRef.current = surface
        }
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
      const surface = zoomSurfaceRef.current
      if (!surface) return

      if (g.mode === 'two' && e.touches.length === 2) {
        const dist = Math.max(touchDistance(e.touches), MIN_PINCH_DIST)
        if (!pinchCapturedRef.current) {
          if (Math.abs(dist - pinchArmDistRef.current) < PINCH_CAPTURE_DELTA_PX) return
          pinchCapturedRef.current = true
          if (surface.mode === 'biblioteca' && surface.scrollEl) {
            lockBibliotecaScroll(surface.scrollEl)
          }
        }

        const mid = touchMidpoint(e.touches)
        const ratio = dist / g.startDist
        const nextScale = scaleFromPinch(g.startScale, ratio)

        const panX = g.startPanX + (mid.x - g.startMidX)
        const panY = g.startPanY + (mid.y - g.startMidY)

        lastPinchMidRef.current = mid
        originRef.current = originFromMid(g.startMidX, g.startMidY, surface.transformEl)

        scaleRef.current = nextScale
        panRef.current = clampPan(panX, panY, nextScale, surface)

        e.preventDefault()
        applyTransform()
        if (surface.mode === 'biblioteca') restoreScrollSnapshot()
        return
      }

      if (g.mode === 'one' && e.touches.length === 1 && scaleRef.current > 1.008) {
        const dx = e.touches[0].clientX - g.startX
        const dy = e.touches[0].clientY - g.startY
        if (Math.abs(dx) < 0.4 && Math.abs(dy) < 0.4) return

        panRef.current = clampPan(g.startPanX + dx, g.startPanY + dy, scaleRef.current, surface)
        e.preventDefault()
        applyTransform()
      }
    }

    const onTouchEnd = (e: TouchEvent) => {
      const surface = zoomSurfaceRef.current

      if (e.touches.length === 0) {
        if (gestureRef.current?.mode === 'two' && surface) {
          const mid = lastPinchMidRef.current
          originRef.current = originFromMid(
            mid.x || gestureRef.current.startMidX,
            mid.y || gestureRef.current.startMidY,
            surface.transformEl
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

    /** Firefox/desktop: Ctrl+scroll mantém posição na biblioteca (evita saltar ao cabeçalho). */
    const onWheel = (e: WheelEvent) => {
      if (!e.ctrlKey) return
      const t = e.target
      if (!(t instanceof Element) || !t.closest('.biblioteca-pecas-hub')) return
      saveScrollSnapshot(t)
      scheduleScrollRestore()
      window.setTimeout(scheduleScrollRestore, 0)
      window.setTimeout(scheduleScrollRestore, 80)
    }

    document.addEventListener('touchstart', onTouchStart, { passive: false, capture: true })
    document.addEventListener('touchmove', onTouchMove, { passive: false, capture: true })
    document.addEventListener('touchend', onTouchEnd, { capture: true })
    document.addEventListener('touchcancel', onTouchEnd, { capture: true })
    window.addEventListener('orientationchange', onResize)
    window.addEventListener('resize', onResize)
    window.addEventListener('wheel', onWheel, { passive: true, capture: true })

    return () => {
      document.removeEventListener('touchstart', onTouchStart, true)
      document.removeEventListener('touchmove', onTouchMove, true)
      document.removeEventListener('touchend', onTouchEnd, true)
      document.removeEventListener('touchcancel', onTouchEnd, true)
      window.removeEventListener('orientationchange', onResize)
      window.removeEventListener('resize', onResize)
      window.removeEventListener('wheel', onWheel, true)
      resetView()
    }
  }, [])

  return null
}
