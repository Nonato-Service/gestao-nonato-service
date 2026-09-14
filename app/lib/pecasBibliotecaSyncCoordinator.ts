/**
 * @deprecated Preferir `app/modules/biblioteca` — reexport de compatibilidade.
 */
import {
  isPecasBibliotecaSyncInFlight,
  getPecasBibliotecaSyncOwner,
  runPecasBibliotecaSyncExclusive,
  shouldDeferPecasBibliotecaImageHydration,
  isBibliotecaMobileDevice as isBibliotecaMobileDevicePure,
  shouldRejectPartialPecasSave as shouldRejectPartialPecasSavePure,
} from '../modules/biblioteca/syncCoordinator'

export {
  isPecasBibliotecaSyncInFlight,
  getPecasBibliotecaSyncOwner,
  runPecasBibliotecaSyncExclusive,
  shouldDeferPecasBibliotecaImageHydration,
}

function lsGet(key: string): string | null {
  if (typeof window === 'undefined') return null
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

/** Injeta window.matchMedia e navigator.userAgent. */
export function isBibliotecaMobileDevice(): boolean {
  if (typeof window === 'undefined') return false
  try {
    return isBibliotecaMobileDevicePure(
      (q) => window.matchMedia(q).matches,
      navigator.userAgent || ''
    )
  } catch {
    return false
  }
}

/** Injeta o cache do total de peças no servidor. */
export function shouldRejectPartialPecasSave(count: number, expected?: number | null): boolean {
  return shouldRejectPartialPecasSavePure(count, expected, lsGet)
}
