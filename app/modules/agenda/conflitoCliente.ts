/** Reexporta regras de conflito da agenda (cliente + técnico). Fonte: conflitoAgenda.ts */
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
