/** Módulo Desmontados — tipos, formulário e migração legado. */

export type {
  LocalizacaoDesmontado,
  GrupoDesmontado,
  PecaDesmontada,
  PecaDesmontadaStatusFuncional,
} from './tipos'

export type { GrupoDesmontadoFormState, PecaDesmontadaFormState } from './formState'
export {
  emptyLocalizacaoDesmontado,
  createEmptyGrupoDesmontadoForm,
  createEmptyPecaDesmontadaForm,
  grupoDesmontadoToFormState,
  pecaDesmontadaToFormState,
} from './formState'

export {
  migrateGrupoDesmontado,
  migratePecaDesmontada,
  migrateGruposDesmontadosList,
  migratePecasDesmontadasList,
  precisaRegravarGruposDesmontados,
  precisaRegravarPecasDesmontadas,
} from './migrate'
