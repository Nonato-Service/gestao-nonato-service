/** Módulo Agenda — tipos, normalização, datas, filtros, rótulos, resolução cliente/equipamento, estado visual e lembretes WhatsApp. */

export type { Agendamento, AgendaListaSecaoId } from './tipos'
export type { ClienteAgendaLike, EquipamentoAgendaLike } from './clienteEquipamento'
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
  statusOperacionalAgenda,
  isStatusOperacionalAtivo,
  statusFromOperacional,
} from './normalize'
export type { StatusOperacionalAgenda } from './normalize'

export {
  normalizeDataKeyAgenda,
  parseDataAgendaLocal,
  formatDataYYYYMMDDLocal,
  expandirIntervaloDatasContinuo,
  getDatasPeriodoAgendamento,
  agendamentoIncluiData,
  agendamentoPeriodoIntersectaIntervalo,
  agendamentoCaiNoAnoMes,
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
  rotuloStatusOperacionalAgenda,
  rotuloStatusOperacionalDeAgendamento,
  corFundoStatusOperacional,
} from './rotulos'

export { estiloCardAgendaEstadoVisualShared, estiloMarcadorAgendamentoCancelado, coresAgendamentoVisual, estiloFundoCardAgendaLista, estiloBotaoRapidoStatusOperacional } from './estilo'

export {
  resolveClienteEEquipamentoParaFormularioAgenda,
  resolverEquipamentoAgendamentoParaExibicao,
} from './clienteEquipamento'

export {
  renderBlocoEquipamentoAgendamentoEstadoVisual,
  renderBlocoAssuntoPessoalEstadoVisual,
  renderLegendaEstadosAgenda,
} from './estadoVisual'

export type { LembreteAgendaTr } from './lembreteWhatsApp'
export {
  filterAgendamentosLembrete,
  formatTelefoneWhatsApp,
  buildMensagemLembreteAgenda,
} from './lembreteWhatsApp'

export {
  normalizeNomeAgenda,
  normalizeNomeClienteAgenda,
  intervalosSobrepoem,
  agendamentosIntervalosSobrepoem,
  mesmoClienteAgendamento,
  mesmoTecnicoAgendamento,
  agendamentoActivoParaConflitoAgenda,
  agendamentoActivoParaConflitoCliente,
  agendamentoEmAndamentoReal,
  encontrarConflitoClienteMesmoDia,
  encontrarConflitoTecnicoMesmoDia,
  encontrarConflitoTecnicoEmAndamento,
  listarParesConflitoClienteLegados,
  listarParesConflitoTecnicoLegados,
  listarParesTecnicoMultiploEmAndamento,
  temConflitosAgendaLegados,
} from './conflitoAgenda'
