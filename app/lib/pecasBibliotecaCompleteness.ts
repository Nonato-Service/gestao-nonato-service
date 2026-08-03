/** Limiar mínimo esperado de peças consoante o número de categorias cadastradas. */
export function pecasBibliotecaMinExpected(categoriasCount: number): number {
  if (categoriasCount < 5) return 50
  return Math.max(15, Math.min(categoriasCount, 80))
}

/** Catálogo ainda incompleto (ex.: tablet com warm resume e cópia parcial). */
export function isPecasBibliotecaCatalogIncomplete(
  count: number,
  categoriasCount: number,
  serverTotal?: number | null
): boolean {
  if (count <= 0) return categoriasCount >= 5
  const min = pecasBibliotecaMinExpected(categoriasCount)
  if (categoriasCount >= 5 && count < min) return true
  if (typeof serverTotal === 'number' && serverTotal >= min && count < Math.floor(serverTotal * 0.9)) {
    return true
  }
  return false
}
