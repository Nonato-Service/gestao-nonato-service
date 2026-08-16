/**
 * @deprecated Preferir `app/modules/biblioteca` — reexport de compatibilidade.
 */
export type { BibliotecaNovidadesMsgTemplates } from '../modules/biblioteca/aviso'
export {
  BIBLIOTECA_AVISO_POLL_MS,
  lerUltimoServidorTotalAvisado,
  gravarUltimoServidorTotalAvisado,
  pedirPermissaoAvisoBibliotecaSeNecessario,
  showBibliotecaBrowserNotification,
  formatBibliotecaNovidadesMsg,
} from '../modules/biblioteca/aviso'
