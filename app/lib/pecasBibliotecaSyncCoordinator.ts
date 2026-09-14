/**
 * @deprecated Preferir `app/modules/biblioteca` — reexport de compatibilidade.
 */
import {
  isPecasBibliotecaSyncInFlight,
  getPecasBibliotecaSyncOwner,
  runPecasBibliotecaSyncExclusive,
  shouldDeferPecasBibliotecaImageHydration,
  isBibliotecaMobileDevice as isBibliotecaMobileDevicePure,
  shouldRejectPartialPecasSave,
} from '../modules/biblioteca/syncCoordinator'

export {
  isPecasBibliotecaSyncInFlight,
  getPecasBibliotecaSyncOwner,
  runPecasBibliotecaSyncExclusive,
  shouldDeferPecasBibliotecaImageHydration,
  shouldRejectPartialPecasSave,
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
