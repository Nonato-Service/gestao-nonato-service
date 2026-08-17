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
  gestorToForm,
  tecnicoToForm,
  iniciaisPessoa,
} from '../modules/pessoas'
