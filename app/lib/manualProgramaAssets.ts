/** Caminho público das capturas de ecrã do Manual do Programa. */
export function manualProgramaScreenshotUrl(locale: string, pageId: string, file = '01.png'): string {
  const safeLocale = (locale || 'pt-BR').trim() || 'pt-BR'
  const safePageId = (pageId || 'dashboard').trim() || 'dashboard'
  return `/manual/assets/${encodeURIComponent(safeLocale)}/${encodeURIComponent(safePageId)}/${file}`
}

export const MANUAL_SCREENSHOT_FILE = '01.png'
