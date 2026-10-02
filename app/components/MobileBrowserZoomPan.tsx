'use client'

import { useEffect } from 'react'

const PAN_ROOT_ID = 'mobile-pan-root'

/**
 * Pan/pinch custom em #mobile-pan-root foi DESACTIVADO no telemóvel/tablet.
 *
 * Causa do bug «só funciona se der ZOOOOMMMMMMM»:
 * scale/translate no contentor que envolve a sidebar faziam os botões
 * «invisíveis» a 100% até o utilizador pinçar. O fix anterior (reset ao
 * abrir o menu) não bastou na prática — o transform ainda existia.
 *
 * Este componente só garante scale=1 / translate=0 e remove classes de zoom.
 * Scroll nativo do browser + da gaveta; sem transform na UI.
 */
export function MobileBrowserZoomPan() {
  useEffect(() => {
    if (typeof window === 'undefined') return

    const clearEl = (el: HTMLElement | null) => {
      if (!el) return
      el.style.transform = ''
      el.style.transformOrigin = ''
      el.style.willChange = ''
    }

    const hardReset = () => {
      document.documentElement.classList.remove('mobile-browser-zoomed')
      document.body.classList.remove('mobile-browser-zoomed')
      document.documentElement.classList.remove('mobile-biblioteca-local-zoomed')
      document.body.classList.remove('mobile-biblioteca-local-zoomed')

      clearEl(document.getElementById(PAN_ROOT_ID))

      document
        .querySelectorAll<HTMLElement>('.tab-inner-scroll.mobile-local-zoom-active')
        .forEach((scrollEl) => {
          scrollEl.classList.remove('mobile-local-zoom-active')
          delete scrollEl.dataset.nsZoomScrollTop
          delete scrollEl.dataset.nsZoomScrollLeft
          const child = scrollEl.firstElementChild
          if (child instanceof HTMLElement) clearEl(child)
        })
    }

    hardReset()

    // Reafirmar após layout (PWA/cache) e se alguém reaplicar transform.
    const t1 = window.setTimeout(hardReset, 0)
    const t2 = window.setTimeout(hardReset, 400)

    const onResize = () => hardReset()
    window.addEventListener('orientationchange', onResize)
    window.addEventListener('resize', onResize)

    const root = document.getElementById(PAN_ROOT_ID)
    const mo =
      root && typeof MutationObserver !== 'undefined'
        ? new MutationObserver(() => {
            if (root.style.transform && root.style.transform !== 'none') {
              hardReset()
            }
          })
        : null
    if (root && mo) {
      mo.observe(root, { attributes: true, attributeFilter: ['style'] })
    }

    return () => {
      window.clearTimeout(t1)
      window.clearTimeout(t2)
      mo?.disconnect()
      window.removeEventListener('orientationchange', onResize)
      window.removeEventListener('resize', onResize)
      hardReset()
    }
  }, [])

  return null
}
