/**
 * Busca de peças na biblioteca — aceita códigos com ou sem hífens, espaços ou pontuação.
 * Referências HOMAG:
 *   • Maioria: 3-835-16-6080 → 3835166080 (só remove hífens)
 *   • Família 2-029-95-XXXX: 2-029-95-0951 → 2029951380 (SKU diferente da referência compacta)
 */

const HOMAG_REF_RE = /^(\d)-(\d{3})-(\d{2})-(\d{3,4})$/
const HOMAG_REF_COMPACT_RE = /^(\d)(\d{3})(\d{2})(\d{3,4})$/
/** Família em que o SKU no catálogo ≠ dígitos da referência sem hífens */
const HOMAG_FAMILY_SKU_ESPECIAL_RE = /^2-029-95-\d{3,4}$/

export function compactPecaCodigo(c: string | undefined | null): string {
  return String(c ?? '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
}

/** Normaliza referência HOMAG com ou sem hífens → formato 3-835-16-6080 */
export function referenciaHomagDeTexto(texto: string): string | null {
  const t = texto.trim()
  const comHifens = t.match(HOMAG_REF_RE)
  if (comHifens) return comHifens[0]

  const compact = compactPecaCodigo(t)
  const semHifens = compact.match(HOMAG_REF_COMPACT_RE)
  if (!semHifens) return null
  return `${semHifens[1]}-${semHifens[2]}-${semHifens[3]}-${semHifens[4]}`
}

/** SKU directo = dígitos da referência sem hífens (ex.: 3-835-16-6080 → 3835166080) */
export function referenciaHomagParaCodigoDireto(referencia: string): string | null {
  const ref = referenciaHomagDeTexto(referencia)
  if (!ref) return null
  const m = ref.match(HOMAG_REF_RE)
  if (!m) return null
  return `${m[1]}${m[2]}${m[3]}${m[4]}`
}

function homagFamilia202995ParaCodigoSku(ref: string): string | null {
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

/**
 * Converte referência HOMAG (com ou sem hífens) para código SKU de 10 dígitos.
 */
export function homagReferenciaParaCodigoSku(referencia: string): string | null {
  const ref = referenciaHomagDeTexto(referencia)
  if (!ref) return null

  if (HOMAG_FAMILY_SKU_ESPECIAL_RE.test(ref)) {
    return homagFamilia202995ParaCodigoSku(ref)
  }

  return referenciaHomagParaCodigoDireto(referencia)
}

/** Todas as variantes SKU possíveis para uma referência/código HOMAG */
export function skusHomagEquivalentes(referencia: string): string[] {
  const out = new Set<string>()
  const direct = referenciaHomagParaCodigoDireto(referencia)
  if (direct) out.add(direct)
  const mapped = homagReferenciaParaCodigoSku(referencia)
  if (mapped) out.add(mapped)
  const compact = compactPecaCodigo(referencia)
  if (/^\d{9,11}$/.test(compact)) out.add(compact)
  return [...out]
}

/** Prefixo de família a partir da referência (ex.: 2-029-95-0951 → 2029951). */
export function homagReferenciaParaPrefixoFamilia(referencia: string): string | null {
  const ref = referenciaHomagDeTexto(referencia)
  if (!ref) return null
  const m = ref.match(HOMAG_REF_RE)
  if (!m) return null
  return `${m[1]}${m[2]}${m[3]}1`
}

/** Variantes compactas equivalentes para comparar busca ↔ peça (com/sem hífens). */
export function variantesBuscaCodigoPeca(query: string): string[] {
  const out = new Set<string>()
  const q = query.trim().toLowerCase()
  if (!q) return []

  out.add(q)
  const qCompact = compactPecaCodigo(q)
  if (qCompact.length >= 3) out.add(qCompact)

  const ref = referenciaHomagDeTexto(q)
  if (ref) {
    out.add(ref.toLowerCase())
    out.add(compactPecaCodigo(ref))
  }

  for (const sku of skusHomagEquivalentes(q)) {
    out.add(sku.toLowerCase())
    out.add(compactPecaCodigo(sku))
  }

  return [...out].filter((v) => v.length >= 3)
}

function compactosPecaParaBusca(peca: {
  codigo?: string
  nome?: string
  descricao?: string
}): string[] {
  const out = new Set<string>()
  for (const campo of [peca.codigo, peca.nome, peca.descricao]) {
    const raw = String(campo ?? '').trim().toLowerCase()
    if (!raw) continue
    out.add(raw)
    const compact = compactPecaCodigo(raw)
    if (compact.length >= 3) out.add(compact)
    const ref = referenciaHomagDeTexto(raw)
    if (ref) {
      out.add(ref.toLowerCase())
      out.add(compactPecaCodigo(ref))
    }
    for (const sku of skusHomagEquivalentes(raw)) {
      out.add(compactPecaCodigo(sku))
    }
  }
  return [...out]
}

function codigosEquivalentes(a: string, b: string): boolean {
  if (!a || !b) return false
  if (a === b) return true
  const va = variantesBuscaCodigoPeca(a)
  const vb = variantesBuscaCodigoPeca(b)
  if (va.some((x) => vb.includes(x))) return true
  const ca = compactPecaCodigo(a)
  const cb = compactPecaCodigo(b)
  if (ca.length >= 3 && cb.length >= 3) {
    if (ca === cb) return true
    if (ca.length >= 8 && cb.length >= 8 && (ca.includes(cb) || cb.includes(ca))) return true
  }
  return false
}

export function pecaBibliotecaMatchesBusca(
  peca: { codigo?: string; nome?: string; descricao?: string },
  query: string
): boolean {
  const q = query.trim().toLowerCase()
  if (!q) return true

  const alvos = variantesBuscaCodigoPeca(q)
  const campos = compactosPecaParaBusca(peca)

  if (alvos.some((alvo) => campos.some((c) => c === alvo || c.includes(alvo) || alvo.includes(c)))) {
    return true
  }

  const codigo = (peca.codigo || '').toLowerCase()
  const nome = (peca.nome || '').toLowerCase()
  const descricao = (peca.descricao || '').toLowerCase()

  if (codigo.includes(q) || nome.includes(q) || descricao.includes(q)) return true

  const qCompact = compactPecaCodigo(q)
  if (qCompact.length < 3) return false

  if (codigosEquivalentes(q, peca.codigo || '')) return true

  const nomeCompact = compactPecaCodigo(peca.nome)
  const descCompact = compactPecaCodigo(peca.descricao)
  if (
    (nomeCompact && (nomeCompact.includes(qCompact) || qCompact.includes(nomeCompact))) ||
    (descCompact && (descCompact.includes(qCompact) || qCompact.includes(descCompact)))
  ) {
    return true
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

/** Encontra peça por código exato (com/sem hífens e referência HOMAG). */
export function encontrarPecaBibliotecaPorCodigo<
  T extends { codigo?: string; nome?: string; descricao?: string },
>(pecas: T[], codigo: string): T | undefined {
  const alvo = compactPecaCodigo(codigo)
  if (!alvo) return undefined
  const alvos = new Set(variantesBuscaCodigoPeca(codigo).map(compactPecaCodigo))
  alvos.add(alvo)

  return pecas.find((p) => {
    const c = compactPecaCodigo(p.codigo)
    if (c && alvos.has(c)) return true
    return pecaBibliotecaMatchesBusca(p, codigo) && codigosEquivalentes(codigo, p.codigo || '')
  })
}
