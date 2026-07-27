/** Logo PNG oficial (Administrador → upload). Pode não existir em dev até colocar o ficheiro. */
export const NONATO_BRAND_LOGO_PNG_SRC = '/brand/nonato-logo-original.png'

/** Fallback vectorial versionado — sempre disponível offline/PWA. */
export const NONATO_BRAND_LOGO_FALLBACK_SVG_SRC = '/brand/nonato-watermark-gears.svg'

export function isNonatoBrandLogoFallbackSrc(src: string | null | undefined): boolean {
  if (!src) return true
  return src === NONATO_BRAND_LOGO_FALLBACK_SVG_SRC || src.endsWith('/nonato-watermark-gears.svg')
}
