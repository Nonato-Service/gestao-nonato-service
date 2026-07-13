/**
 * Busca de peças por código — correspondência EXACTA (sem peças erradas).
 *
 * Regras HOMAG:
 *   • Referência normal: 3-835-16-6080 = 3835166080 (remove hífens)
 *   • Família especial 2-029-95-0XXX: 2-029-95-0951 → 2029951380 (SKU ≠ referência compacta)
 *   • Substituições: código antigo → SKU novo (índice homag-substituicoes-indice.json)
 */

export type IndiceSubstituicaoHomag = Record<string, string>

let indiceSubstituicoesHomag: IndiceSubstituicaoHomag = {}

export function setIndiceSubstituicoesHomag(indice: IndiceSubstituicaoHomag): void {
  indiceSubstituicoesHomag = { ...indice }
}

export function getIndiceSubstituicoesHomag(): IndiceSubstituicaoHomag {
  return indiceSubstituicoesHomag
}

export function construirIndiceSubstituicoesHomag(
  subs: Array<{ codigoAntigo?: string; referenciaAntiga?: string; codigoNovo: string }>,
  pecas: Array<{ codigo?: string; referenciasAntigas?: string[]; codigosAntigos?: string[] }> = []
): IndiceSubstituicaoHomag {
  const out: IndiceSubstituicaoHomag = {}
  const add = (chave: string, novo: string) => {
    const k = chave.trim()
    const n = compactPecaCodigo(novo)
    if (!k || !n) return
    out[k.toLowerCase()] = n
    out[compactPecaCodigo(k)] = n
  }
  for (const s of subs) {
    if (s.codigoAntigo) add(s.codigoAntigo, s.codigoNovo)
    if (s.referenciaAntiga) add(s.referenciaAntiga, s.codigoNovo)
    add(s.codigoNovo, s.codigoNovo)
  }
  for (const p of pecas) {
    const novo = compactPecaCodigo(p.codigo)
    if (!novo) continue
    for (const r of p.referenciasAntigas || []) add(r, novo)
    for (const c of p.codigosAntigos || []) add(c, novo)
  }
  return out
}

function expandirSkusComIndiceSubstituicao(skus: string[], query: string): string[] {
  const out = new Set(skus.map(compactPecaCodigo))
  const indice = indiceSubstituicoesHomag
  const q = query.trim()
  const chaves = [
    q.toLowerCase(),
    compactPecaCodigo(q),
    referenciaHomagDeTexto(q)?.toLowerCase(),
    referenciaHomagDeTexto(q) ? compactPecaCodigo(referenciaHomagDeTexto(q)!) : '',
  ].filter(Boolean)
  for (const ch of chaves) {
    const alvo = indice[ch] || indice[compactPecaCodigo(ch)]
    if (alvo) out.add(compactPecaCodigo(alvo))
  }
  return [...out].filter(Boolean)
}

const HOMAG_REF_RE = /^(\d)-(\d{3})-(\d{2})-(\d{3,4})$/
const HOMAG_REF_COMPACT_RE = /^(\d)(\d{3})(\d{2})(\d{3,4})$/
const HOMAG_REF_SKU_ESPECIAL_RE = /^2-029-95-0\d{3}$/

export function compactPecaCodigo(c: string | undefined | null): string {
  return String(c ?? '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
}

export function referenciaHomagDeTexto(texto: string): string | null {
  const t = texto.trim()
  const comHifens = t.match(HOMAG_REF_RE)
  if (comHifens) return comHifens[0]

  const compact = compactPecaCodigo(t)
  if (compact.length < 9 || compact.length > 11) return null
  const semHifens = compact.match(HOMAG_REF_COMPACT_RE)
  if (!semHifens) return null
  return `${semHifens[1]}-${semHifens[2]}-${semHifens[3]}-${semHifens[4]}`
}

export function referenciaHomagParaCodigoDireto(referencia: string): string | null {
  const ref = referenciaHomagDeTexto(referencia)
  if (!ref) return null
  const m = ref.match(HOMAG_REF_RE)
  if (!m) return null
  return `${m[1]}${m[2]}${m[3]}${m[4]}`
}

function homagFamilia202995ParaCodigoSku(ref: string): string | null {
  if (!HOMAG_REF_SKU_ESPECIAL_RE.test(ref)) return null
  const m = ref.match(HOMAG_REF_RE)
  if (!m) return null
  const [, g1, g2, g3, g4] = m
  const prefix = `${g1}${g2}${g3}1`
  const last2 = parseInt(g4.slice(-2), 10)
  if (Number.isNaN(last2)) return null
  const suffix = 370 + (last2 - 50) * 10
  if (suffix < 0 || suffix > 999) return null
  return `${prefix}${String(suffix).padStart(3, '0')}`
}

export function homagReferenciaParaCodigoSku(referencia: string): string | null {
  const ref = referenciaHomagDeTexto(referencia)
  if (!ref) return null
  const especial = homagFamilia202995ParaCodigoSku(ref)
  if (especial) return especial
  return referenciaHomagParaCodigoDireto(referencia)
}

export function codigosSkuAlvoParaBusca(query: string): string[] {
  const out = new Set<string>()
  const q = query.trim()
  if (!q) return []

  const qCompact = compactPecaCodigo(q)
  if (/^\d{9,11}$/.test(qCompact)) out.add(qCompact)

  const ref = referenciaHomagDeTexto(q)
  if (ref) {
    const direct = referenciaHomagParaCodigoDireto(ref)
    if (direct) out.add(compactPecaCodigo(direct))
    const especial = homagFamilia202995ParaCodigoSku(ref)
    if (especial) out.add(compactPecaCodigo(especial))
  }

  return expandirSkusComIndiceSubstituicao([...out].filter(Boolean), q)
}

export function pecaTemCodigoAntigoRegistado(
  peca: { referenciasAntigas?: string[]; codigosAntigos?: string[] },
  query: string
): boolean {
  const q = query.trim()
  if (!q) return false
  const qLower = q.toLowerCase()
  const qCompact = compactPecaCodigo(q)
  const ref = referenciaHomagDeTexto(q)

  for (const r of peca.referenciasAntigas || []) {
    if (r.toLowerCase() === qLower) return true
    if (ref && r.toLowerCase() === ref.toLowerCase()) return true
  }
  for (const c of peca.codigosAntigos || []) {
    if (compactPecaCodigo(c) === qCompact) return true
  }
  if (ref) {
    const refCompact = compactPecaCodigo(ref)
    for (const r of peca.referenciasAntigas || []) {
      if (compactPecaCodigo(r) === refCompact) return true
    }
  }
  return false
}

export function pecaBibliotecaMatchesBusca(
  peca: {
    codigo?: string
    nome?: string
    descricao?: string
    referenciasAntigas?: string[]
    codigosAntigos?: string[]
  },
  query: string
): boolean {
  const q = query.trim()
  if (!q) return true

  const qLower = q.toLowerCase()
  const codigoPeca = compactPecaCodigo(peca.codigo)
  if (!codigoPeca) return false

  const skusAlvo = codigosSkuAlvoParaBusca(q)
  if (skusAlvo.length > 0 && skusAlvo.some((sku) => sku === codigoPeca)) {
    return true
  }

  if (pecaTemCodigoAntigoRegistado(peca, q)) return true

  const ref = referenciaHomagDeTexto(q)
  if (ref) {
    const nome = (peca.nome || '').toLowerCase()
    const descricao = (peca.descricao || '').toLowerCase()
    const refLower = ref.toLowerCase()
    const refCompact = compactPecaCodigo(ref)
    if (nome.includes(refLower) || descricao.includes(refLower)) return true
    if (refCompact && (nome.includes(refCompact) || descricao.includes(refCompact))) return true
  }

  if (q.includes('-') && q.length >= 5) {
    const nome = (peca.nome || '').toLowerCase()
    const descricao = (peca.descricao || '').toLowerCase()
    if (nome.includes(qLower) || descricao.includes(qLower)) return true
  }

  return false
}

export function filtrarPecasBibliotecaPorBusca<
  T extends {
    codigo?: string
    nome?: string
    descricao?: string
    referenciasAntigas?: string[]
    codigosAntigos?: string[]
  },
>(pecas: T[], query: string, limit = 50): T[] {
  const q = query.trim()
  if (!q) return pecas.slice(0, limit)
  return pecas.filter((p) => pecaBibliotecaMatchesBusca(p, q)).slice(0, limit)
}

export function encontrarPecaBibliotecaPorCodigo<
  T extends { codigo?: string; nome?: string; descricao?: string },
>(pecas: T[], codigo: string): T | undefined {
  const skus = new Set(codigosSkuAlvoParaBusca(codigo))
  if (skus.size === 0) return undefined
  return pecas.find((p) => {
    const c = compactPecaCodigo(p.codigo)
    return c && skus.has(c)
  })
}
