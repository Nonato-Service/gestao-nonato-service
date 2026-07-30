/** Logo PNG oficial (Administrador → upload). Pode não existir em dev até colocar o ficheiro. */
export const NONATO_BRAND_LOGO_PNG_SRC = '/brand/nonato-logo-original.png'

/** Fallback vectorial em disco — precache PWA. */
export const NONATO_BRAND_LOGO_FALLBACK_SVG_SRC = '/brand/nonato-watermark-gears.svg'

/** Fallback embutido — funciona offline mesmo se o ficheiro /brand/ falhar ou cache antigo. */
const NONATO_BRAND_WATERMARK_SVG_MARKUP =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 320" role="img" aria-label="Nonato Service"><defs><linearGradient id="g1" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#22c55e"/><stop offset="100%" stop-color="#15803d"/></linearGradient></defs><path d="M248 78c24 40 36 84 28 128-10 46-48 80-94 92-50 12-104-6-134-46S12 154 34 104 108 22 162 24c36 2 66 20 86 54" fill="none" stroke="url(#g1)" stroke-width="18" stroke-linecap="round" stroke-linejoin="round" opacity=".95"/><g transform="translate(118 168)"><circle r="46" fill="url(#g1)"/><circle r="18" fill="#ecfdf5"/><g fill="url(#g1)"><rect x="-7" y="-58" width="14" height="18" rx="3"/><rect x="-7" y="40" width="14" height="18" rx="3"/><rect x="-58" y="-7" width="18" height="14" rx="3"/><rect x="40" y="-7" width="18" height="14" rx="3"/><rect x="-41" y="-41" width="14" height="18" rx="3" transform="rotate(-45)"/><rect x="27" y="27" width="14" height="18" rx="3" transform="rotate(-45)"/><rect x="27" y="-41" width="14" height="18" rx="3" transform="rotate(45)"/><rect x="-41" y="27" width="14" height="18" rx="3" transform="rotate(45)"/></g></g><g transform="translate(196 108)"><circle r="30" fill="url(#g1)"/><circle r="11" fill="#ecfdf5"/><g fill="url(#g1)"><rect x="-5" y="-38" width="10" height="12" rx="2"/><rect x="-5" y="26" width="10" height="12" rx="2"/><rect x="-38" y="-5" width="12" height="10" rx="2"/><rect x="26" y="-5" width="12" height="10" rx="2"/></g></g></svg>'

export const NONATO_BRAND_LOGO_FALLBACK_DATA_URI = `data:image/svg+xml,${encodeURIComponent(
  NONATO_BRAND_WATERMARK_SVG_MARKUP
)}`

/** Preferir data URI (sempre disponível); ficheiro SVG como reserva. */
export function getNonatoBrandLogoFallbackSrc(): string {
  return NONATO_BRAND_LOGO_FALLBACK_DATA_URI
}

export function isNonatoBrandLogoFallbackSrc(src: string | null | undefined): boolean {
  if (!src) return true
  if (src === NONATO_BRAND_LOGO_FALLBACK_DATA_URI) return true
  if (src === NONATO_BRAND_LOGO_FALLBACK_SVG_SRC) return true
  return src.endsWith('/nonato-watermark-gears.svg')
}

export function applyNonatoBrandLogoImgFallback(img: HTMLImageElement): void {
  const cur = img.currentSrc || img.src
  if (isNonatoBrandLogoFallbackSrc(cur)) return
  if (cur === NONATO_BRAND_LOGO_FALLBACK_SVG_SRC || cur.endsWith('/nonato-watermark-gears.svg')) {
    img.src = NONATO_BRAND_LOGO_FALLBACK_DATA_URI
    return
  }
  img.src = getNonatoBrandLogoFallbackSrc()
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
