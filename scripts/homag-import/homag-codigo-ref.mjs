/**
 * Referências HOMAG: SKU sem hífen ↔ referência com hífen (ex.: 3607066730 ↔ 3-607-06-6730).
 */

export function compactCodigo(c) {
  return String(c ?? '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
}

export function referenciaHomagDeSku(codigo) {
  const compact = compactCodigo(codigo)
  const m = compact.match(/^(\d)(\d{3})(\d{2})(\d{3,4})$/)
  if (!m) return null
  return `${m[1]}-${m[2]}-${m[3]}-${m[4]}`
}

export function skuHomagDeReferencia(referencia) {
  const ref = String(referencia || '').trim()
  const comHifens = ref.match(/^(\d)-(\d{3})-(\d{2})-(\d{3,4})$/)
  if (comHifens) return `${comHifens[1]}${comHifens[2]}${comHifens[3]}${comHifens[4]}`
  return compactCodigo(ref)
}

function uniq(list) {
  return [...new Set(list.map((s) => String(s || '').trim()).filter(Boolean))]
}

/** Garante codigo SKU + referência com hífen na peça (busca com/sem hífen). */
export function enriquecerPecaHomagComReferencias(peca) {
  if (!peca || typeof peca !== 'object') return peca
  const sku = compactCodigo(peca.codigo)
  if (!sku) return peca

  const ref = referenciaHomagDeSku(sku)
  const refs = uniq([
    ...(peca.referenciasAlternativas || []),
    ...(peca.referenciasAntigas || []),
    ...(ref ? [ref] : []),
  ])
  const cods = uniq([...(peca.codigosAlternativos || []), ...(peca.codigosAntigos || []), sku])

  return {
    ...peca,
    codigo: peca.codigo || sku,
    referenciasAlternativas: refs,
    codigosAlternativos: cods,
    referenciasAntigas: refs,
    codigosAntigos: cods,
  }
}
