/** Módulo Agenda — tipos, normalização, datas, filtros, rótulos e resolução cliente/equipamento. */

export type { Agendamento, AgendaListaSecaoId } from './tipos'
export {
  AGENDA_CONCLUIDOS_LISTA_MAX,
  AGENDA_PAINEL_CONCLUIDOS_MAX,
  AGENDA_PAINEL_CANCELADOS_MAX,
  LS_AGENDA_CAL_CONCLUIDOS,
  AGENDA_LISTA_SECAO_IDS,
  AGENDA_CANCELADO_BG,
  AGENDA_CANCELADO_BORDA,
  AGENDA_CANCELADO_SOMBRA,
  AGENDA_FILTRO_CTRL_STYLE,
  AGENDA_FILTRO_BAR_STYLE,
} from './tipos'

export {
  normalizeTipoAgendamento,
  normalizeStatusAgendamento,
  normalizeCategoriaAgendamento,
  isAgendamentoPessoal,
  isAgendamentoCancelado,
} from './normalize'

export {
  normalizeDataKeyAgenda,
  parseDataAgendaLocal,
  formatDataYYYYMMDDLocal,
  getDatasPeriodoAgendamento,
  agendamentoIncluiData,
  agendamentoPeriodoIntersectaIntervalo,
  rotuloPeriodoAgendamento,
} from './datas'

export {
  agendamentoStatusAtivoParaEstadoVisual,
  agendamentoVisivelNoEstadoVisualTecnico,
  agendaPassaFiltroTipoListagem,
  ordenarAgendamentosCalendarioDia,
} from './filtros'

export {
  rotuloTituloAgendamento,
  rotuloCurtoAgendamentoCalendario,
  rotuloTipoAgendamentoEstadoVisual,
  rotuloAgendaPainelSituacao,
  accentCorAgendamentoLista,
} from './rotulos'

export { estiloCardAgendaEstadoVisualShared, estiloMarcadorAgendamentoCancelado } from './estilo'

export {
  resolveClienteEEquipamentoParaFormularioAgenda,
  resolverEquipamentoAgendamentoParaExibicao,
} from './clienteEquipamento'
