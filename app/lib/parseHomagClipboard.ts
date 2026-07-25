/** Parser de colagem HOMAG (shop.homag.com) — alinhado com scripts/homag-import/discover-products.mjs */

import {
  compactPecaCodigo,
  nucleoCodigoHomag,
  referenciaHomagDeTexto,
  referenciaHomagParaCodigoDireto,
  variantesCodigoHomagParaMatch,
} from './pecaCodigoBusca'

export const HOMAG_CODE_STRICT_RE = /^([1-9]\d{9})$/
export const HOMAG_CODE_LOOSE_RE = /^(\d{7,14})$/
/** SKU com R prefixo/sufixo: 2006808181R, R2006215960 */
export const HOMAG_CODE_R_VARIANT_RE = /^R?(\d{7,11})R?$/i

const HOMAG_RANGE_RE = /\d+\s*-\s*\d+\s+of\s+\d+\s+Items?/gi

const HOMAG_UI_NOISE_RES: RegExp[] = [
  /^\d+\s*-\s*\d+\s+of\s+\d+\s+Items?$/i,
  /^sort by$/i,
  /^filters?$/i,
  /^clear all$/i,
  /^category$/i,
  /^loading\.?\.?\.?$/i,
  /^best match$/i,
  /^spare parts$/i,
  /^price reduced$/i,
  /^log in$/i,
  /^search$/i,
  /^home$/i,
  /^>>+$/,
  /^next$/i,
  /^previous$/i,
  /^page\s+\d+/i,
  /^showing\s+\d+/i,
  /^add to cart$/i,
  /^view details$/i,
  /^homag$/i,
  /^shop$/i,
  /^language$/i,
  /^english$/i,
  /^portugu[eê]s$/i,
  /^€$/,
  /^eur$/i,
  /^usd$/i,
]

const HOMAG_PRICE_RE = /(\d{1,3}(?:[.\s]\d{3})*(?:[.,]\d{2})\s?(?:€|eur|usd)?)/i
const HOMAG_IMAGE_RE =
  /^\s*https?:\/\/[^\s<>"']+\.(jpg|jpeg|png|webp|gif|svg)(?:\?[^\s<>"']*)?\s*$/i

export type HomagClipboardItem = {
  codigo: string
  nome: string
  descricao: string
  preco?: string
  imagem?: string
  referenciasAlternativas?: string[]
  codigosAlternativos?: string[]
}

export function isHomagUiNoiseLine(line: string): boolean {
  const t = String(line || '').trim()
  if (!t) return true
  if (t.length <= 2) return true
  return HOMAG_UI_NOISE_RES.some((re) => re.test(t))
}

export function countHomagCodesInText(text: string): number {
  const found = new Set<string>()
  const raw = String(text || '')

  for (const m of raw.matchAll(/\bR?\d{7,11}R?\b/gi)) {
    const n = nucleoCodigoHomag(m[0])
    if (n) found.add(n)
  }
  for (const m of raw.matchAll(/\b\d-\d{3}-\d{2}-\d{3,4}\b/g)) {
    const sku = referenciaHomagParaCodigoDireto(m[0])
    if (sku) found.add(sku)
  }
  return found.size
}

export function looksLikeHomagClipboard(text: string): boolean {
  return countHomagCodesInText(text) >= 2
}

/** Extrai secção de produtos entre paginação HOMAG («1 - 20 of 31133 Items»). */
export function extractHomagCatalogSection(text: string): string {
  const raw = String(text || '').replace(/\u00a0/g, ' ').replace(/\r/g, '')
  const ranges = [...raw.matchAll(HOMAG_RANGE_RE)]
  if (ranges.length === 0) return raw

  const last = ranges[ranges.length - 1]
  const start = (last.index ?? 0) + last[0].length
  let section = raw.slice(start)

  const nextRange = section.match(HOMAG_RANGE_RE)
  if (nextRange?.index != null && nextRange.index > 0) {
    section = section.slice(0, nextRange.index)
  }

  return section.slice(0, 20000).trim()
}

/** Reconhece linha de código HOMAG (2006807481, 2-006-80-7481, 2006808181R, R2006215960). */
export function matchHomagCodeLine(line: string): string | null {
  const t = String(line || '').trim()
  if (!t) return null

  const ref = referenciaHomagDeTexto(t)
  if (ref) {
    const sku = referenciaHomagParaCodigoDireto(ref)
    return sku || t.replace(/\s+/g, '')
  }

  const compact = t.replace(/\s+/g, '')
  const rVar = compact.match(HOMAG_CODE_R_VARIANT_RE)
  if (rVar) {
    return compact.toUpperCase() === compact ? compact : compact.replace(/^r/i, 'R')
  }

  const strict = compact.match(HOMAG_CODE_STRICT_RE)
  if (strict) return strict[1]

  const loose = compact.match(HOMAG_CODE_LOOSE_RE)
  if (loose && compact.length >= 7 && compact.length <= 14) return loose[1]

  return null
}

function isHomagCodeLine(line: string): boolean {
  return matchHomagCodeLine(line) != null
}

function alternativasHomagDeCodigo(codigo: string): {
  referenciasAlternativas: string[]
  codigosAlternativos: string[]
} {
  const refs = new Set<string>()
  const cods = new Set<string>()
  const ref = referenciaHomagDeTexto(codigo)
  if (ref) refs.add(ref)
  const nucleo = nucleoCodigoHomag(codigo)
  if (nucleo) {
    cods.add(nucleo)
    const refN = referenciaHomagDeTexto(nucleo)
    if (refN) refs.add(refN)
  }
  const compact = compactPecaCodigo(codigo)
  if (compact) cods.add(compact)
  return {
    referenciasAlternativas: [...refs],
    codigosAlternativos: [...cods],
  }
}

/** Parse principal — uma peça por linha de código, nome nas linhas anteriores. */
export function parseHomagPlainTextCatalog(raw: string): HomagClipboardItem[] {
  const section = extractHomagCatalogSection(raw)
  const lines = section
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)

  const items: HomagClipboardItem[] = []
  const seenNucleo = new Set<string>()

  for (let i = 0; i < lines.length; i++) {
    const codigo = matchHomagCodeLine(lines[i])
    if (!codigo) continue

    const nucleo = nucleoCodigoHomag(codigo) || compactPecaCodigo(codigo)
    if (!nucleo || seenNucleo.has(nucleo)) continue

    const textLines: string[] = []
    let imagem = ''
    let preco = ''

    for (let j = i - 1; j >= Math.max(0, i - 10); j--) {
      const prev = lines[j]
      if (isHomagCodeLine(prev)) break
      if (isHomagUiNoiseLine(prev)) continue
      if (HOMAG_IMAGE_RE.test(prev)) {
        if (!imagem) imagem = prev.trim()
        continue
      }
      const priceOnly = prev.replace(HOMAG_PRICE_RE, '').trim().length < 4 && HOMAG_PRICE_RE.test(prev)
      if (priceOnly) {
        if (!preco) preco = (prev.match(HOMAG_PRICE_RE)?.[1] || '').trim()
        continue
      }
      if (prev.length >= 2 && prev.length < 240) {
        textLines.unshift(prev)
      }
    }

    for (let j = i + 1; j <= Math.min(lines.length - 1, i + 3); j++) {
      const next = lines[j]
      if (isHomagCodeLine(next)) break
      if (HOMAG_IMAGE_RE.test(next) && !imagem) imagem = next.trim()
    }

    const nome = textLines[0] || codigo
    const descricao = textLines.slice(1).join(' ').trim() || nome
    const alt = alternativasHomagDeCodigo(codigo)

    seenNucleo.add(nucleo)
    items.push({
      codigo,
      nome,
      descricao,
      referenciasAlternativas: alt.referenciasAlternativas,
      codigosAlternativos: alt.codigosAlternativos,
      ...(preco ? { preco } : {}),
      ...(imagem ? { imagem } : {}),
    })
  }

  return items
}

/** Junta listas pelo núcleo do código; preferência para entradas do parser HOMAG. */
export function mergeHomagClipboardItems(
  primary: HomagClipboardItem[],
  homag: HomagClipboardItem[]
): HomagClipboardItem[] {
  if (homag.length === 0) return primary
  const byNucleo = new Map<string, HomagClipboardItem>()

  const keyOf = (item: HomagClipboardItem) =>
    nucleoCodigoHomag(item.codigo) || compactPecaCodigo(item.codigo) || item.codigo

  for (const p of primary) {
    const k = keyOf(p)
    if (k) byNucleo.set(k, p)
  }
  for (const h of homag) {
    const k = keyOf(h)
    if (!k) continue
    const existing = byNucleo.get(k)
    if (!existing) {
      byNucleo.set(k, h)
      continue
    }
    byNucleo.set(k, {
      ...existing,
      nome: h.nome && h.nome !== h.codigo ? h.nome : existing.nome,
      descricao: h.descricao || existing.descricao,
      preco: existing.preco || h.preco,
      imagem: existing.imagem || h.imagem,
      referenciasAlternativas: [
        ...new Set([
          ...(existing.referenciasAlternativas || []),
          ...(h.referenciasAlternativas || []),
        ]),
      ],
      codigosAlternativos: [
        ...new Set([...(existing.codigosAlternativos || []), ...(h.codigosAlternativos || [])]),
      ],
    })
  }
  return [...byNucleo.values()]
}
