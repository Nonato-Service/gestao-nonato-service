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
