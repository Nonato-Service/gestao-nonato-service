export function normalizarTextoFaturaBusca(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, '')
}

/**
 * Correspondência exata (normalizada) ou parcial: exige pelo menos 2 caracteres na consulta
 * para evitar coincidências com um único dígito/letra.
 */
export function numeroFaturaCorrespondeConsulta(numeroGuardado: string, consulta: string): boolean {
  const a = normalizarTextoFaturaBusca(numeroGuardado)
  const b = normalizarTextoFaturaBusca(consulta)
  if (!a || !b) return false
  if (a === b) return true
  if (b.length < 2) return false
  return a.includes(b) || b.includes(a)
}
