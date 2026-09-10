/** Módulo pessoas — gestores/técnicos (tipos, formulário, classes de papel). */

export type {
  TipoGestor,
  Gestor,
  TecnicoType,
  Tecnico,
  GestorFormState,
  TecnicoFormState,
  TipoGestorFormState,
} from './tipos'

export {
  emptyGestorForm,
  emptyTecnicoForm,
  emptyTipoGestorForm,
  gestorToForm,
  tecnicoToForm,
  tipoGestorToForm,
  iniciaisPessoa,
} from './formState'

export {
  isGestorFormValid,
  createGestorFromForm,
  updateGestorFromForm,
} from './gestorFromForm'

export {
  isTecnicoFormValid,
  createTecnicoFromForm,
  updateTecnicoFromForm,
} from './tecnicoFromForm'

export {
  isTipoGestorFormValid,
  isTipoGestorEdicaoExistente,
  tipoGestorIdDuplicado,
  proximaOrdemTipoGestor,
  createTipoGestorFromForm,
  updateTipoGestorFromForm,
  remapGestoresAreaTipoGestor,
} from './tipoGestorFromForm'

export type { GestorClasse, TecnicoClasse, TecnicoTipoUi } from './classes'
export { getGestorClasse, getTecnicoClasse, getTecnicoTipo } from './classes'
