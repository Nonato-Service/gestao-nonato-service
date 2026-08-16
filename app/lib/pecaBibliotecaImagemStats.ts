/**
 * @deprecated Preferir `app/modules/biblioteca` — reexport de compatibilidade.
 */
export type {
  PecaBibliotecaImagemKind,
  PecaBibliotecaImagemStats,
  PecaBibliotecaImagemInput,
} from '../modules/biblioteca/imagemStats'
export {
  PECA_BIBLIOTECA_PLACEHOLDER_PATTERNS,
  PECA_BIBLIOTECA_LOGO_PADRAO_SRC,
  pecaBibliotecaSrcEhLogoPadrao,
  pecaBibliotecaTemImagemNoServidor,
  pecaBibliotecaTemFotoVisivel,
  isPecaBibliotecaImagemPlaceholder,
  pecaBibliotecaTemImagemPropria,
  classificarImagemPecaBiblioteca,
  calcularPecasBibliotecaImagemStats,
  pecaBibliotecaTemFotoReal,
  resolvePecaBibliotecaImagemSrcForDisplay,
  resolvePecaBibliotecaCapaSrcForDisplay,
  pecaBibliotecaTemCapaOuFotoVisivel,
  pecaBibliotecaUsarEstiloLogoPadrao,
} from '../modules/biblioteca/imagemStats'
