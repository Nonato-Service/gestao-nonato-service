/** Módulo ficha cadastral — tipos e normalização do cadastro da empresa. */

export type { FichaCadastral, FichaCadastralBancaria } from './tipos'

export {
  emptyFichaCadastral,
  normalizeFichaCadastral,
  fichaCadastralToBancaria,
} from './formState'
