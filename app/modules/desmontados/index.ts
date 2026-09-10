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

export type { PecaDesmontadaFromFormOpts } from './pecaDesmontadaFromForm'
export {
  isPecaDesmontadaFormValid,
  resolverGrupoNomeDesmontado,
  createPecaDesmontadaFromForm,
  updatePecaDesmontadaFromForm,
} from './pecaDesmontadaFromForm'

export {
  migrateGrupoDesmontado,
  migratePecaDesmontada,
  migrateGruposDesmontadosList,
  migratePecasDesmontadasList,
  precisaRegravarGruposDesmontados,
  precisaRegravarPecasDesmontadas,
} from './migrate'
