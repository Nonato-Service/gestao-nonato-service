const MANUAL_ASSET_LOCALES = ['pt-BR', 'es', 'fr', 'it', 'de', 'en'] as const

/** Versão das capturas — bumpar após regenerar imagens para invalidar cache PWA. */
export const MANUAL_SCREENSHOT_CACHE_VERSION = 5

/** Código UI → pasta em public/manual/assets (ex.: en-US → en). */
export function manualProgramaLocale(lang: string): string {
  const raw = (lang || 'pt-BR').trim() || 'pt-BR'
  if (raw === 'en-US' || raw === 'en-GB') return 'en'
  if ((MANUAL_ASSET_LOCALES as readonly string[]).includes(raw)) return raw
  return 'pt-BR'
}

/** Caminho público das capturas de ecrã do Manual do Programa. */
export function manualProgramaScreenshotUrl(locale: string, pageId: string, file = '01.png'): string {
  const safeLocale = manualProgramaLocale(locale)
  const safePageId = (pageId || 'dashboard').trim() || 'dashboard'
  return `/manual/assets/${encodeURIComponent(safeLocale)}/${encodeURIComponent(safePageId)}/${file}?v=${MANUAL_SCREENSHOT_CACHE_VERSION}`
}

export const MANUAL_SCREENSHOT_FILE = '01.png'
