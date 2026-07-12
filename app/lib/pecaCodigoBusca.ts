/**
 * Busca de peças na biblioteca — aceita códigos HOMAG com ou sem hífens
 * e referências HOMAG (ex.: 2-029-95-0951 → código real 2029951380).
 */

const HOMAG_REF_RE = /^(\d)-(\d{3})-(\d{2})-(\d{3,4})$/

export function compactPecaCodigo(c: string | undefined | null): string {
  return String(c ?? '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
}

/**
 * Converte referência HOMAG com hífens para o código SKU de 10 dígitos quando possível.
 * Ex.: 2-029-95-0951 → 2029951380 | 2-029-95-0950 → 2029951370
 */
export function homagReferenciaParaCodigoSku(referencia: string): string | null {
  const m = referencia.trim().match(HOMAG_REF_RE)
  if (!m) return null
  const [, g1, g2, g3, g4] = m
  const prefix = `${g1}${g2}${g3}1`
  const last2 = parseInt(g4.slice(-2), 10)
  if (Number.isNaN(last2)) return null
  const suffix = 370 + (last2 - 50) * 10
  if (suffix < 0 || suffix > 999) return null
  return `${prefix}${String(suffix).padStart(3, '0')}`
}

/** Prefixo de família a partir da referência (ex.: 2-029-95-0951 → 2029951). */
export function homagReferenciaParaPrefixoFamilia(referencia: string): string | null {
  const m = referencia.trim().match(HOMAG_REF_RE)
  if (!m) return null
  return `${m[1]}${m[2]}${m[3]}1`
}

export function pecaBibliotecaMatchesBusca(
  peca: { codigo?: string; nome?: string; descricao?: string },
  query: string
): boolean {
  const q = query.trim().toLowerCase()
  if (!q) return true

  const codigo = (peca.codigo || '').toLowerCase()
  const nome = (peca.nome || '').toLowerCase()
  const descricao = (peca.descricao || '').toLowerCase()

  if (codigo.includes(q) || nome.includes(q) || descricao.includes(q)) return true

  const qCompact = compactPecaCodigo(q)
  if (qCompact.length < 3) return false

  const codigoCompact = compactPecaCodigo(peca.codigo)
  if (!codigoCompact) return false

  if (codigoCompact.includes(qCompact) || qCompact.includes(codigoCompact)) return true

  const skuFromHomagRef = homagReferenciaParaCodigoSku(query)
  if (skuFromHomagRef && codigoCompact === compactPecaCodigo(skuFromHomagRef)) return true

  const familiaPrefix = homagReferenciaParaPrefixoFamilia(query)
  if (familiaPrefix && codigoCompact.startsWith(familiaPrefix)) {
    if (skuFromHomagRef) return codigoCompact === compactPecaCodigo(skuFromHomagRef)
    const lastSeg = query.trim().match(HOMAG_REF_RE)?.[4]
    if (lastSeg && (nome.includes(lastSeg) || descricao.includes(lastSeg))) return true
  }

  return false
}

export function filtrarPecasBibliotecaPorBusca<
  T extends { codigo?: string; nome?: string; descricao?: string },
>(pecas: T[], query: string, limit = 50): T[] {
  const q = query.trim()
  if (!q) return pecas.slice(0, limit)
  return pecas.filter((p) => pecaBibliotecaMatchesBusca(p, q)).slice(0, limit)
}

/** Encontra peça por código exato (com normalização de hífens/espaços e referência HOMAG). */
export function encontrarPecaBibliotecaPorCodigo<
  T extends { codigo?: string },
>(pecas: T[], codigo: string): T | undefined {
  const alvo = compactPecaCodigo(codigo)
  if (!alvo) return undefined
  const fromHomag = homagReferenciaParaCodigoSku(codigo)
  const alvoHomag = fromHomag ? compactPecaCodigo(fromHomag) : null
  return pecas.find((p) => {
    const c = compactPecaCodigo(p.codigo)
    return c === alvo || (alvoHomag != null && c === alvoHomag)
  })
}
