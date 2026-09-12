/** Política do visualizador PDF dentro do ZIP (índice e fallback nativo). */

import type { ManualSection } from './zipSection'

export type ZipPdfLinkHint = { centerX: number; centerY: number; viewportWidth: number }

export const MAX_PDFJS_PAGES = 12
export const MAX_PDFJS_BYTES = 3 * 1024 * 1024

export function inferIndexSectionHints(
  links: ZipPdfLinkHint[],
  indexPath: string
): Map<number, ManualSection> {
  const hints = new Map<number, ManualSection>()
  if (!/(^|\/)index\.pdf$/i.test(indexPath)) return hints

  const rightSide = links
    .map((l, i) => ({ ...l, i }))
    .filter((l) => l.centerX >= l.viewportWidth * 0.4)
    .sort((a, b) => a.centerX - b.centerX || a.centerY - b.centerY)

  if (rightSide.length >= 2) {
    hints.set(rightSide[rightSide.length - 2].i, 'mecanica')
    hints.set(rightSide[rightSide.length - 1].i, 'eletrica')
  } else if (rightSide.length === 1) {
    hints.set(rightSide[0].i, 'eletrica')
  }

  return hints
}

export function preferNativePdfViewer(path: string, byteLength: number, numPages: number): boolean {
  if (numPages > MAX_PDFJS_PAGES) return true
  if (byteLength > MAX_PDFJS_BYTES) return true
  if (/(elektr|eletric|electric|elektro|mechan|mecan|mechanik)/i.test(path) && !/(^|\/)index\.pdf$/i.test(path)) {
    return true
  }
  return false
}
