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
  gestorToForm,
  tecnicoToForm,
  iniciaisPessoa,
} from './formState'

export type { GestorClasse, TecnicoClasse, TecnicoTipoUi } from './classes'
export { getGestorClasse, getTecnicoClasse, getTecnicoTipo } from './classes'
