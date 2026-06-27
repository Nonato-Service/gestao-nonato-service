'use client'

import { useEffect } from 'react'

/**
 * Com pinch-zoom do browser no telemóvel, permite arrastar a vista em todas as direções.
 * Desbloqueia overflow quando visualViewport.scale > 1.
 */
export function MobileBrowserZoomPan() {
  useEffect(() => {
    if (typeof window === 'undefined') return

    const vv = window.visualViewport
    if (!vv) return

    const apply = () => {
      const compact = window.innerWidth <= 1024
      const zoomed = compact && vv.scale > 1.015
      document.documentElement.classList.toggle('mobile-browser-zoomed', zoomed)
    }

    apply()
    vv.addEventListener('resize', apply)
    vv.addEventListener('scroll', apply)
    window.addEventListener('orientationchange', apply)

    return () => {
      vv.removeEventListener('resize', apply)
      vv.removeEventListener('scroll', apply)
      window.removeEventListener('orientationchange', apply)
      document.documentElement.classList.remove('mobile-browser-zoomed')
    }
  }, [])

  return null
}
