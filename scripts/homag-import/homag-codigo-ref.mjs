/**
 * Referências HOMAG — SKU, hífen, R prefixo/sufixo (2006807481, 2-006-80-7481, 2006808181R, R2006215960).
 */

const HOMAG_REF_RE = /^(\d)-(\d{3})-(\d{2})-(\d{3,4})$/
const HOMAG_REF_COMPACT_RE = /^(\d)(\d{3})(\d{2})(\d{3,4})$/
const HOMAG_CODE_R_VARIANT_RE = /^R?(\d{7,11})R?$/i

export function compactCodigo(c) {
  return String(c ?? '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
}

export function referenciaHomagDeTexto(texto) {
  const t = String(texto ?? '').trim()
  const comHifens = t.match(HOMAG_REF_RE)
  if (comHifens) return comHifens[0]
  const compact = compactCodigo(t)
  if (compact.length < 9 || compact.length > 11) return null
  const semHifens = compact.match(HOMAG_REF_COMPACT_RE)
  if (!semHifens) return null
  return `${semHifens[1]}-${semHifens[2]}-${semHifens[3]}-${semHifens[4]}`
}

export function referenciaHomagParaCodigoDireto(referencia) {
  const ref = referenciaHomagDeTexto(referencia)
  if (!ref) return null
  const m = ref.match(HOMAG_REF_RE)
  if (!m) return null
  return `${m[1]}${m[2]}${m[3]}${m[4]}`
}

/** @deprecated Use referenciaHomagDeTexto */
export function referenciaHomagDeSku(codigo) {
  return referenciaHomagDeTexto(codigo)
}

export function skuHomagDeReferencia(referencia) {
  const direct = referenciaHomagParaCodigoDireto(referencia)
  if (direct) return direct
  return compactCodigo(referencia)
}

/** Núcleo numérico — ignora hífens e R prefixo/sufixo. */
export function nucleoCodigoHomag(c) {
  let compact = compactCodigo(c)
  if (!compact) return ''
  compact = compact.replace(/^r(?=\d)/, '')
  compact = compact.replace(/(?<=\d)r$/, '')
  if (/^\d{7,11}$/.test(compact)) return compact
  const ref = referenciaHomagDeTexto(String(c ?? ''))
  if (ref) {
    const sku = referenciaHomagParaCodigoDireto(ref)
    if (sku && /^\d{7,11}$/.test(sku)) return sku
  }
  const digits = compact.replace(/[^0-9]/g, '')
  return /^\d{7,11}$/.test(digits) ? digits : digits
}

/** Chave canónica para dedup / importação em massa. */
export function normCodigoHomag(c) {
  const n = nucleoCodigoHomag(c)
  if (n && /^\d{7,11}$/.test(n)) return n
  return compactCodigo(c)
}

export function variantesCodigoHomagParaMatch(c) {
  const raw = String(c ?? '').trim()
  if (!raw) return []
  const out = new Set()
  const push = (v) => {
    const s = String(v ?? '').trim().toLowerCase()
    if (s.length >= 3) out.add(s)
  }
  push(compactCodigo(raw))
  push(raw.toLowerCase())
  const nucleo = nucleoCodigoHomag(raw)
  if (nucleo) {
    push(nucleo)
    push(`r${nucleo}`)
    push(`${nucleo}r`)
    const ref = referenciaHomagDeTexto(nucleo)
    if (ref) {
      push(ref)
      push(compactCodigo(ref))
      const sku = referenciaHomagParaCodigoDireto(ref)
      if (sku) push(sku)
    }
  }
  const refDirect = referenciaHomagDeTexto(raw)
  if (refDirect) {
    push(refDirect)
    push(compactCodigo(refDirect))
    const sku = referenciaHomagParaCodigoDireto(refDirect)
    if (sku) push(sku)
  }
  return [...out]
}

export function codigosHomagEquivalentes(a, b) {
  const vb = new Set(variantesCodigoHomagParaMatch(b))
  return variantesCodigoHomagParaMatch(a).some((x) => vb.has(x))
}

/** Reconhece linha de código HOMAG (texto plano / DOM). */
export function matchHomagCodeLine(line) {
  const t = String(line ?? '').trim()
  if (!t) return null
  const ref = referenciaHomagDeTexto(t)
  if (ref) {
    const sku = referenciaHomagParaCodigoDireto(ref)
    return sku || t.replace(/\s+/g, '')
  }
  const compact = t.replace(/\s+/g, '')
  const rVar = compact.match(HOMAG_CODE_R_VARIANT_RE)
  if (rVar) {
    const nucleo = rVar[1]
    return compact.toUpperCase() === compact ? compact : compact.replace(/^r/i, 'R')
  }
  if (/^[1-9]\d{9}$/.test(compact)) return compact
  const loose = compact.match(/^(\d{7,14})$/)
  if (loose) return loose[1]
  return null
}

function uniq(list) {
  return [...new Set(list.map((s) => String(s || '').trim()).filter(Boolean))]
}

/** Normaliza código vindo da API/DOM para importação. */
export function normalizarCodigoHomagProduto(raw) {
  const original = String(raw ?? '').trim()
  if (!original) return null
  const matched = matchHomagCodeLine(original)
  const nucleo = nucleoCodigoHomag(matched || original)
  if (!nucleo || !/^\d{7,11}$/.test(nucleo)) return null

  const refs = uniq([
    referenciaHomagDeTexto(nucleo),
    referenciaHomagDeTexto(original),
  ])
  const cods = uniq([
    original,
    matched,
    nucleo,
    matched && matched !== nucleo ? matched : '',
    original.toUpperCase() !== original ? original.toUpperCase() : '',
    `R${nucleo}`,
    `${nucleo}R`,
  ]).filter((c) => compactCodigo(c) !== compactCodigo(nucleo))

  return {
    codigo: nucleo,
    codigoOriginal: original,
    referenciasAlternativas: refs,
    codigosAlternativos: cods,
  }
}

/** Todas as chaves de dedup para uma peça (código + alternativas). */
export function chavesDedupHomagPeca(peca) {
  const keys = new Set()
  for (const v of variantesCodigoHomagParaMatch(peca?.codigo)) keys.add(v)
  for (const c of [...(peca?.codigosAlternativos || []), ...(peca?.codigosAntigos || [])]) {
    for (const v of variantesCodigoHomagParaMatch(c)) keys.add(v)
  }
  for (const r of [...(peca?.referenciasAlternativas || []), ...(peca?.referenciasAntigas || [])]) {
    for (const v of variantesCodigoHomagParaMatch(r)) keys.add(v)
  }
  return keys
}

/** Garante codigo SKU + referência + variantes R na peça. */
export function enriquecerPecaHomagComReferencias(peca) {
  if (!peca || typeof peca !== 'object') return peca
  const norm = normalizarCodigoHomagProduto(peca.codigo)
  if (!norm) return peca

  const refs = uniq([
    ...(peca.referenciasAlternativas || []),
    ...(peca.referenciasAntigas || []),
    ...norm.referenciasAlternativas,
  ])
  const cods = uniq([
    ...(peca.codigosAlternativos || []),
    ...(peca.codigosAntigos || []),
    ...norm.codigosAlternativos,
    norm.codigo,
  ]).filter((c) => compactCodigo(c) !== compactCodigo(norm.codigo))

  return {
    ...peca,
    codigo: norm.codigo,
    referenciasAlternativas: refs,
    codigosAlternativos: cods,
    referenciasAntigas: refs,
    codigosAntigos: cods,
  }
}
