/** Módulo Checklist — tipos e mappers de geração (funções puras). */

export type {
  ChecklistItemTemplate,
  ChecklistTemplate,
  ManutencaoChecklist,
  ItemTrabalhoCriacao,
  ParenteChecklist,
  GrupoChecklist,
  ManutencaoFormularioHorario,
  ManutencaoFormularioHistoricoTecnico,
  ManutencaoFormularioObservacao,
  ManutencaoFormularioChecklist,
  PecaMontagemChecklist,
  PecaPorGrupoVisualizacao,
  GrupoComManutencoesFormulario,
  EquipamentoChecklistLike,
  TecnicoChecklistLike,
  GrupoChecklistGerado,
  ChecklistGeradoRecord,
  PecaSolicitadaArmazemFromChecklist,
} from './tipos'

export type {
  BuildManutencoesDoGrupoOpts,
  BuildChecklistGeradoRecordInput,
  BuildPecasArmazemFromChecklistInput,
} from './gerarMappers'

export {
  mapManutencaoParaFormulario,
  buildManutencoesDoGrupo,
  buildPecasPorGrupoVisualizacao,
  buildChecklistGeradoRecord,
  buildPecasArmazemFromChecklist,
} from './gerarMappers'

export type { ChecklistTemplateFormState } from './templateForm'
export { emptyChecklistTemplateForm, checklistTemplateToForm } from './templateForm'

export {
  checklistTemplateFormMissing,
  isChecklistTemplateFormValid,
  createChecklistTemplateFromForm,
  updateChecklistTemplateFromForm,
} from './templateFromForm'

export type { GrupoChecklistFormState } from './grupoForm'
export { emptyGrupoChecklistForm, grupoChecklistToForm } from './grupoForm'

export {
  resolveGrupoChecklistFamilia,
  grupoChecklistFormMissing,
  isGrupoChecklistFormValid,
  createGrupoChecklistFromForm,
  updateGrupoChecklistFromForm,
} from './grupoFromForm'

export type { ManutencaoChecklistFormState } from './manutencaoForm'
export { emptyManutencaoChecklistForm, manutencaoChecklistToForm } from './manutencaoForm'

export {
  isManutencaoChecklistFormValid,
  createManutencaoChecklistFromForm,
  updateManutencaoChecklistFromForm,
} from './manutencaoFromForm'
