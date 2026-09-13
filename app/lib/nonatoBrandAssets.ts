import {
  NONATO_BRAND_LOGO_PNG_SRC,
  NONATO_BRAND_LOGO_FALLBACK_SVG_SRC,
  NONATO_BRAND_LOGO_FALLBACK_DATA_URI,
  isNonatoBrandLogoPngSrc,
  isNonatoBrandLogoFallbackSrc,
} from '../modules/admin/brandAssets'

/** Re-export fino — fonte canónica em `app/modules/admin/brandAssets`. */
export {
  NONATO_BRAND_LOGO_PNG_SRC,
  NONATO_BRAND_LOGO_FALLBACK_SVG_SRC,
  NONATO_BRAND_LOGO_FALLBACK_DATA_URI,
  isNonatoBrandLogoPngSrc,
  getNonatoBrandLogoFallbackSrc,
  getNonatoBrandLogoDisplaySrc,
  isNonatoBrandLogoFallbackSrc,
} from '../modules/admin/brandAssets'

/** Aplica fallback no <img> (DOM). */
export function applyNonatoBrandLogoImgFallback(img: HTMLImageElement): void {
  const cur = img.currentSrc || img.src
  if (isNonatoBrandLogoFallbackSrc(cur)) return
  if (
    isNonatoBrandLogoPngSrc(cur) ||
    cur === NONATO_BRAND_LOGO_FALLBACK_SVG_SRC ||
    cur.endsWith('/nonato-watermark-gears.svg')
  ) {
    img.src = NONATO_BRAND_LOGO_FALLBACK_DATA_URI
    return
  }
  img.src = NONATO_BRAND_LOGO_PNG_SRC
}

/** Valida se o logo guardado (data URL ou API vídeo) carrega antes de mostrar na UI. */
export function validateNonatoLogoMediaSrc(src: string): Promise<boolean> {
  const s = String(src || '').trim()
  if (!s) return Promise.resolve(false)
  if (s === '/api/video/logo' || s === '/api/video/logo-dashboard') {
    return fetch(s, { method: 'HEAD' })
      .then((r) => r.ok)
      .catch(() => false)
  }
  if (s.startsWith('data:image/')) {
    return new Promise((resolve) => {
      if (typeof Image === 'undefined') {
        resolve(s.length > 128)
        return
      }
      const img = new Image()
      img.onload = () => resolve(true)
      img.onerror = () => resolve(false)
      img.src = s
    })
  }
  return Promise.resolve(false)
}

export function validateNonatoBrandLogoPngAvailable(): Promise<boolean> {
  if (typeof fetch === 'undefined') return Promise.resolve(false)
  return fetch(NONATO_BRAND_LOGO_PNG_SRC, { method: 'HEAD' })
    .then((r) => r.ok)
    .catch(() => false)
}
