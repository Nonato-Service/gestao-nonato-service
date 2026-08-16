import { countHomagCodesInText } from '../../lib/parseHomagClipboard'

/** HTML/texto colado de uma página de catálogo (não tratar como colagem só de imagem). */
export function clipboardLooksLikeCatalogImport(html: string, plain: string): boolean {
  const h = String(html || '')
  const p = String(plain || '').trim()
  if (h.length >= 40 && (/<table\b/i.test(h) || /<tr\b/i.test(h) || /<img\b/i.test(h))) return true
  if (!p || p.length < 10) return false
  if (/^https?:\/\//i.test(p) && !p.includes('\n')) return true
  if (p.startsWith('[') || p.startsWith('{')) return true
  const lines = p.split(/\r?\n/).map((l) => l.trim()).filter(Boolean)
  if (lines.length >= 2) return true
  if (p.length >= 25) return true
  return false
}

export function pickBestCatalogRawFromClipboard(
  html: string,
  plain: string
): { raw: string; plainFallback: string } {
  const h = String(html || '').trim()
  const p = String(plain || '').trim()
  if (!h && !p) return { raw: '', plainFallback: '' }
  if (/^https?:\/\//i.test(p) && !p.includes('\n') && h.length < 40) return { raw: p, plainFallback: p }
  /** HOMAG: texto plano com códigos 10 dígitos é mais fiável que HTML Salesforce/LWC. */
  if (countHomagCodesInText(p) >= 3) return { raw: p, plainFallback: p }
  if (h.length >= 40 && /<table\b/i.test(h)) return { raw: h, plainFallback: p }
  if (h.length >= 40 && p.length >= 20) {
    const plainLines = p.split(/\r?\n/).map((l) => l.trim()).filter(Boolean)
    const htmlLooksUseful =
      /<table\b/i.test(h) || /<tr\b/i.test(h) || (/<img\b/i.test(h) && plainLines.length >= 2)
    if (htmlLooksUseful && countHomagCodesInText(p) < 3) return { raw: h, plainFallback: p }
    if (plainLines.length >= 2) return { raw: p, plainFallback: p }
  }
  if (h.length >= 40 && countHomagCodesInText(p) < 3) return { raw: h, plainFallback: p }
  return { raw: p, plainFallback: p }
}
