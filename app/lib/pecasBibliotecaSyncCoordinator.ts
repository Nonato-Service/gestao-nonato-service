/**
 * @deprecated Preferir `app/modules/biblioteca` — reexport de compatibilidade.
 */
export {
  isPecasBibliotecaSyncInFlight,
  getPecasBibliotecaSyncOwner,
  runPecasBibliotecaSyncExclusive,
  shouldDeferPecasBibliotecaImageHydration,
  isBibliotecaMobileDevice,
  shouldRejectPartialPecasSave,
} from '../modules/biblioteca/syncCoordinator'
