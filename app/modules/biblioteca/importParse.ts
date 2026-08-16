/** Orquestrador: HTML vs plain → mapItemToPecaBiblioteca + filtro normalizeImportKey. */

import { parseRawCatalogItensHtml } from './importParseHtml'
import { parseRawCatalogItensPlain } from './importParsePlain'
import { mapItemToPecaBiblioteca } from './importMappers'
import { normalizeImportKey } from './merge'
import type { PecaBibliotecaLike } from './tipos'

export function looksLikeCatalogImportHtml(trimRaw: string): boolean {
  return (
    trimRaw.startsWith('<') ||
    /<table\b/i.test(trimRaw) ||
    /<img\b[^>]*\bsrc\s*=/i.test(trimRaw)
  )
}

function resolveLojaOrigin(lojaBaseUrl: string): string {
  const s = String(lojaBaseUrl || '').trim()
  if (!s) return ''
  try {
    const u = new URL(s.includes('://') ? s : `https://${s}`)
    if (u.protocol !== 'http:' && u.protocol !== 'https:') return ''
    return u.origin
  } catch {
    return ''
  }
}

/** URL da página de onde veio o HTML — resolve src relativos. */
function resolvePageBaseHref(pageUrl: string): string {
  const s = String(pageUrl || '').trim()
  if (!s) return ''
  try {
    const u = new URL(s.includes('://') ? s : `https://${s}`)
    if (u.protocol !== 'http:' && u.protocol !== 'https:') return ''
    return u.href
  } catch {
    return ''
  }
}

/**
 * Converte texto colado / HTML / JSON / CSV em peças da biblioteca.
 * Preserva o comportamento exacto de `parseRawToPecas` no NonatoMainApp.
 */
export function parseRawToPecas(
  raw: string,
  lojaBaseUrl = '',
  pageUrl = ''
): PecaBibliotecaLike[] {
  const trimRaw = raw.trim()
  const lojaOrigin = resolveLojaOrigin(lojaBaseUrl)
  const pageBaseHref = resolvePageBaseHref(pageUrl)

  let itens: any[] = []
  if (looksLikeCatalogImportHtml(trimRaw)) {
    itens = parseRawCatalogItensHtml(raw, lojaOrigin, pageBaseHref)
  } else {
    itens = parseRawCatalogItensPlain(raw)
  }

  // Normaliza e remove duplicados da própria importação.
  const absolutizeImagem = (p: PecaBibliotecaLike): PecaBibliotecaLike => {
    const im = (p.imagem || '').trim()
    if (!im || !lojaOrigin) return p
    if (im.startsWith('/') && !im.startsWith('//')) {
      try {
        return { ...p, imagem: new URL(im, `${lojaOrigin}/`).href }
      } catch {
        return p
      }
    }
    return p
  }
  const mapped = itens.map((item, idx) =>
    absolutizeImagem(mapItemToPecaBiblioteca(item, idx) as PecaBibliotecaLike)
  )
  return mapped.filter((p) => {
    const codigoNorm = normalizeImportKey(p.codigo)
    const nomeNorm = normalizeImportKey(p.nome)
    return Boolean(codigoNorm || nomeNorm)
  })
}
