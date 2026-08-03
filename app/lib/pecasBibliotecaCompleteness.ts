const SERVER_TOTAL_CACHE_KEY = 'nonato-pecas-biblioteca-server-total'

/** Total conhecido no servidor (cacheado após meta ou repor bem-sucedido). */
export function getCachedPecasBibliotecaServerTotal(): number | null {
  if (typeof window === 'undefined') return null
  try {
    const n = parseInt(localStorage.getItem(SERVER_TOTAL_CACHE_KEY) || '', 10)
    return Number.isFinite(n) && n > 0 ? n : null
  } catch {
    return null
  }
}

export function setCachedPecasBibliotecaServerTotal(total: number): void {
  if (typeof window === 'undefined' || !Number.isFinite(total) || total <= 0) return
  try {
    localStorage.setItem(SERVER_TOTAL_CACHE_KEY, String(Math.round(total)))
  } catch {
    /* ignorar */
  }
}

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

  const expected =
    typeof serverTotal === 'number' && serverTotal > 0
      ? serverTotal
      : getCachedPecasBibliotecaServerTotal()

  /** Total do servidor é a referência — PC e tablet devem coincidir. */
  if (typeof expected === 'number' && expected > 0) {
    return count < expected
  }

  const min = pecasBibliotecaMinExpected(categoriasCount)
  if (categoriasCount >= 5 && count < min) return true
  /** Catálogo real tem centenas de peças — 50–79 com muitas categorias é suspeito. */
  if (categoriasCount >= 15 && count < 100) return true
  return false
}

/** Catálogo recebido do servidor cobre o total esperado? */
export function pecasBibliotecaMeetsServerTotal(
  count: number,
  serverTotal: number | null | undefined
): boolean {
  if (!serverTotal || serverTotal <= 0) return count >= 50
  return count >= serverTotal
}
