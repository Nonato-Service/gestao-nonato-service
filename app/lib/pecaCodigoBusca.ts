/**
 * Busca de peças por código — correspondência EXACTA (sem peças erradas).
 *
 * Regras HOMAG:
 *   • Referência normal: 3-835-16-6080 = 3835166080 (remove hífens)
 *   • Família especial 2-029-95-0XXX: 2-029-95-0951 → 2029951380 (SKU ≠ referência compacta)
 *   • Códigos alternativos: máq. antiga + máq. nova (índice homag-substituicoes-indice.json)
 */

export type IndiceSubstituicaoHomag = Record<string, string[] | string>

let indiceSubstituicoesHomag: Record<string, string[]> = {}

function normalizarIndiceSubstituicoes(raw: IndiceSubstituicaoHomag): Record<string, string[]> {
  const out: Record<string, string[]> = {}
  for (const [k, v] of Object.entries(raw || {})) {
    if (!k) continue
    const lista = Array.isArray(v) ? v : v ? [v] : []
    const norm = [...new Set(lista.map(compactPecaCodigo).filter(Boolean))]
    if (norm.length > 0) out[k.toLowerCase()] = norm
  }
  return out
}

export function setIndiceSubstituicoesHomag(indice: IndiceSubstituicaoHomag): void {
  indiceSubstituicoesHomag = normalizarIndiceSubstituicoes(indice)
}

export function getIndiceSubstituicoesHomag(): Record<string, string[]> {
  return indiceSubstituicoesHomag
}

function uniteCodigos(parent: Map<string, string>, a: string, b: string): void {
  const ca = compactPecaCodigo(a)
  const cb = compactPecaCodigo(b)
  if (!ca || !cb) return
  if (!parent.has(ca)) parent.set(ca, ca)
  if (!parent.has(cb)) parent.set(cb, cb)
  const find = (x: string): string => {
    const p = parent.get(x)
    if (!p || p === x) return x
    const r = find(p)
    parent.set(x, r)
    return r
  }
  const ra = find(ca)
  const rb = find(cb)
  if (ra !== rb) parent.set(ra, rb)
}

export function construirIndiceSubstituicoesHomag(
  ligs: Array<{ codigoAntigo?: string; referenciaAntiga?: string; codigoNovo: string; referenciaNova?: string }>,
  pecas: Array<{
    codigo?: string
    codigosAlternativos?: string[]
    referenciasAlternativas?: string[]
    referenciasAntigas?: string[]
    codigosAntigos?: string[]
  }> = []
): Record<string, string[]> {
  const parent = new Map<string, string>()

  const link = (a: string, b: string) => uniteCodigos(parent, a, b)

  for (const l of ligs) {
    if (l.codigoAntigo) link(l.codigoAntigo, l.codigoNovo)
    if (l.referenciaAntiga) link(l.referenciaAntiga, l.codigoNovo)
    if (l.referenciaNova) link(l.referenciaNova, l.codigoNovo)
    if (l.codigoAntigo && l.referenciaNova) link(l.codigoAntigo, l.referenciaNova)
  }

  for (const p of pecas) {
    const principal = compactPecaCodigo(p.codigo)
    if (!principal) continue
    parent.set(principal, parent.get(principal) || principal)
    const alternativos = [
      ...(p.codigosAlternativos || []),
      ...(p.codigosAntigos || []),
      ...(p.referenciasAlternativas || []),
      ...(p.referenciasAntigas || []),
    ]
    for (const alt of alternativos) link(principal, alt)
  }

  const find = (x: string): string => {
    const p = parent.get(x)
    if (!p || p === x) return x
    const r = find(p)
    parent.set(x, r)
    return r
  }

  const grupos = new Map<string, Set<string>>()
  for (const k of parent.keys()) {
    const root = find(k)
    if (!grupos.has(root)) grupos.set(root, new Set())
    grupos.get(root)!.add(k)
  }

  const out: Record<string, string[]> = {}
  for (const members of grupos.values()) {
    const skus = [...members].map(compactPecaCodigo).filter(Boolean)
    if (skus.length < 2) continue
    for (const m of members) {
      const key = m.toLowerCase()
      out[key] = skus
      const ref = referenciaHomagDeTexto(m)
      if (ref) out[ref.toLowerCase()] = skus
    }
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
    const alvos = indice[ch] || indice[compactPecaCodigo(ch)]
    if (!alvos) continue
    for (const alvo of alvos) out.add(compactPecaCodigo(alvo))
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

export function pecaTemCodigoAlternativoRegistado(
  peca: {
    codigosAlternativos?: string[]
    referenciasAlternativas?: string[]
    referenciasAntigas?: string[]
    codigosAntigos?: string[]
  },
  query: string
): boolean {
  const q = query.trim()
  if (!q) return false
  const qLower = q.toLowerCase()
  const qCompact = compactPecaCodigo(q)
  const ref = referenciaHomagDeTexto(q)

  const refs = [...(peca.referenciasAlternativas || []), ...(peca.referenciasAntigas || [])]
  const cods = [...(peca.codigosAlternativos || []), ...(peca.codigosAntigos || [])]

  for (const r of refs) {
    if (r.toLowerCase() === qLower) return true
    if (ref && r.toLowerCase() === ref.toLowerCase()) return true
  }
  for (const c of cods) {
    if (compactPecaCodigo(c) === qCompact) return true
  }
  if (ref) {
    const refCompact = compactPecaCodigo(ref)
    for (const r of refs) {
      if (compactPecaCodigo(r) === refCompact) return true
    }
  }
  return false
}

/** @deprecated Use pecaTemCodigoAlternativoRegistado */
export const pecaTemCodigoAntigoRegistado = pecaTemCodigoAlternativoRegistado

export function pecaBibliotecaMatchesBusca(
  peca: {
    codigo?: string
    nome?: string
    descricao?: string
    codigosAlternativos?: string[]
    referenciasAlternativas?: string[]
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

  if (pecaTemCodigoAlternativoRegistado(peca, q)) return true

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

/** Correspondência parcial em nome ou descrição (várias palavras = todas devem aparecer). */
export function pecaBibliotecaMatchesNome(
  peca: { nome?: string; descricao?: string },
  query: string
): boolean {
  const q = query.trim().toLowerCase()
  if (!q) return true
  const haystack = `${peca.nome ?? ''} ${peca.descricao ?? ''}`.trim().toLowerCase()
  if (!haystack) return false
  const tokens = q.split(/\s+/).filter(Boolean)
  return tokens.every((t) => haystack.includes(t))
}

/** Código (exacto/HOMAG/substituições) ou nome/descrição. */
export function pecaBibliotecaMatchesBuscaCompleta(
  peca: {
    codigo?: string
    nome?: string
    descricao?: string
    codigosAlternativos?: string[]
    referenciasAlternativas?: string[]
    referenciasAntigas?: string[]
    codigosAntigos?: string[]
  },
  query: string
): boolean {
  const q = query.trim()
  if (!q) return true
  return pecaBibliotecaMatchesBusca(peca, q) || pecaBibliotecaMatchesNome(peca, q)
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
  return pecas.filter((p) => pecaBibliotecaMatchesBuscaCompleta(p, q)).slice(0, limit)
}

export function encontrarPecaBibliotecaPorCodigo<
  T extends {
    codigo?: string
    nome?: string
    descricao?: string
    codigosAlternativos?: string[]
    referenciasAlternativas?: string[]
    referenciasAntigas?: string[]
    codigosAntigos?: string[]
  },
>(pecas: T[], codigo: string): T | undefined {
  const direct = pecas.find((p) => pecaBibliotecaMatchesBusca(p, codigo))
  if (direct) return direct
  const skus = new Set(codigosSkuAlvoParaBusca(codigo))
  if (skus.size === 0) return undefined
  return pecas.find((p) => {
    const c = compactPecaCodigo(p.codigo)
    return c && skus.has(c)
  })
}
