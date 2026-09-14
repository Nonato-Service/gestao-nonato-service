/**
 * I/O de storage — cache do total de peças canónico em `app/modules/biblioteca/completeness`.
 */
import {
  getCachedPecasBibliotecaServerTotal as getCachedPecasBibliotecaServerTotalPure,
  setCachedPecasBibliotecaServerTotal as setCachedPecasBibliotecaServerTotalPure,
  isPecasBibliotecaCatalogIncomplete as isPecasBibliotecaCatalogIncompletePure,
  pecasBibliotecaMinExpected,
  pecasBibliotecaMeetsServerTotal,
} from '../modules/biblioteca/completeness'

export { pecasBibliotecaMinExpected, pecasBibliotecaMeetsServerTotal }

function lsGet(key: string): string | null {
  if (typeof window === 'undefined') return null
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

function lsSet(key: string, value: string): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(key, value)
  } catch {
    /* ignorar */
  }
}

export function getCachedPecasBibliotecaServerTotal(): number | null {
  return getCachedPecasBibliotecaServerTotalPure(lsGet)
}

export function setCachedPecasBibliotecaServerTotal(total: number): void {
  setCachedPecasBibliotecaServerTotalPure(total, lsSet)
}

export function isPecasBibliotecaCatalogIncomplete(
  count: number,
  categoriasCount: number,
  serverTotal?: number | null
): boolean {
  return isPecasBibliotecaCatalogIncompletePure(count, categoriasCount, serverTotal, lsGet)
}
