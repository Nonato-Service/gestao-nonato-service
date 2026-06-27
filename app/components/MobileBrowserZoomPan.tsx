'use client'

import { useEffect, useRef } from 'react'

/**
 * Com pinch-zoom do browser no telemóvel, permite arrastar a vista em todas as direções.
 * Usa histerese para evitar alternar layout zoom/normal (causa saltos e páginas “gigantes”).
 */
export function MobileBrowserZoomPan() {
  const zoomedRef = useRef(false)

  useEffect(() => {
    if (typeof window === 'undefined') return

    const vv = window.visualViewport
    if (!vv) return

    let debounce: ReturnType<typeof setTimeout> | undefined

    const apply = () => {
      const compact = window.innerWidth <= 1024
      if (!compact) {
        zoomedRef.current = false
        document.documentElement.classList.remove('mobile-browser-zoomed')
        document.body.classList.remove('mobile-browser-zoomed')
        return
      }

      const scale = vv.scale
      const nextZoomed = zoomedRef.current ? scale > 1.02 : scale > 1.06
      zoomedRef.current = nextZoomed
      document.documentElement.classList.toggle('mobile-browser-zoomed', nextZoomed)
      document.body.classList.toggle('mobile-browser-zoomed', nextZoomed)
    }

    const schedule = () => {
      if (debounce) clearTimeout(debounce)
      debounce = setTimeout(apply, 80)
    }

    apply()
    vv.addEventListener('resize', schedule)
    vv.addEventListener('scroll', schedule)
    window.addEventListener('orientationchange', schedule)
    window.addEventListener('resize', schedule)

    return () => {
      if (debounce) clearTimeout(debounce)
      vv.removeEventListener('resize', schedule)
      vv.removeEventListener('scroll', schedule)
      window.removeEventListener('orientationchange', schedule)
      window.removeEventListener('resize', schedule)
      document.documentElement.classList.remove('mobile-browser-zoomed')
      document.body.classList.remove('mobile-browser-zoomed')
    }
  }, [])

  return null
}
