/** Re-export fino — fonte canónica em `app/modules/pessoas`. */
export type {
  TipoGestor,
  Gestor,
  TecnicoType,
  Tecnico,
  GestorFormState,
  TecnicoFormState,
  TipoGestorFormState,
} from '../modules/pessoas'

export {
  emptyGestorForm,
  emptyTecnicoForm,
  emptyTipoGestorForm,
  gestorToForm,
  tecnicoToForm,
  tipoGestorToForm,
  iniciaisPessoa,
} from '../modules/pessoas'
