/** Parser de colagem HOMAG (shop.homag.com) — alinhado com scripts/homag-import/discover-products.mjs */

export const HOMAG_CODE_STRICT_RE = /^([1-9]\d{9})$/
export const HOMAG_CODE_LOOSE_RE = /^(\d{7,14})$/

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
}

export function isHomagUiNoiseLine(line: string): boolean {
  const t = String(line || '').trim()
  if (!t) return true
  if (t.length <= 2) return true
  return HOMAG_UI_NOISE_RES.some((re) => re.test(t))
}

export function countHomagCodesInText(text: string): number {
  const raw = String(text || '')
  const strict = raw.match(/\b[1-9]\d{9}\b/g) || []
  return new Set(strict).size
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

function matchHomagCodeLine(line: string): string | null {
  const t = String(line || '').trim().replace(/\s+/g, '')
  const strict = t.match(HOMAG_CODE_STRICT_RE)
  if (strict) return strict[1]
  const loose = t.match(HOMAG_CODE_LOOSE_RE)
  if (loose && t.length >= 7 && t.length <= 14) return loose[1]
  return null
}

function isHomagCodeLine(line: string): boolean {
  return matchHomagCodeLine(line) != null
}

/** Parse principal — uma peça por linha de código, nome nas linhas anteriores. */
export function parseHomagPlainTextCatalog(raw: string): HomagClipboardItem[] {
  const section = extractHomagCatalogSection(raw)
  const lines = section
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)

  const items: HomagClipboardItem[] = []
  const seen = new Set<string>()

  for (let i = 0; i < lines.length; i++) {
    const codigo = matchHomagCodeLine(lines[i])
    if (!codigo || seen.has(codigo)) continue

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

    seen.add(codigo)
    items.push({
      codigo,
      nome,
      descricao,
      ...(preco ? { preco } : {}),
      ...(imagem ? { imagem } : {}),
    })
  }

  return items
}

/** Junta listas pelo código; preferência para entradas do parser HOMAG (nomes mais limpos). */
export function mergeHomagClipboardItems(
  primary: HomagClipboardItem[],
  homag: HomagClipboardItem[]
): HomagClipboardItem[] {
  if (homag.length === 0) return primary
  const byCode = new Map<string, HomagClipboardItem>()
  for (const p of primary) {
    const c = String(p.codigo || '').trim()
    if (c) byCode.set(c, p)
  }
  for (const h of homag) {
    const c = String(h.codigo || '').trim()
    if (!c) continue
    const existing = byCode.get(c)
    if (!existing) {
      byCode.set(c, h)
      continue
    }
    byCode.set(c, {
      ...existing,
      nome: h.nome && h.nome !== c ? h.nome : existing.nome,
      descricao: h.descricao || existing.descricao,
      preco: existing.preco || h.preco,
      imagem: existing.imagem || h.imagem,
    })
  }
  return [...byCode.values()]
}
