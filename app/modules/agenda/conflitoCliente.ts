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
  encontrarConflitoClienteMesmoDia,
  encontrarConflitoTecnicoMesmoDia,
  listarParesConflitoClienteLegados,
  listarParesConflitoTecnicoLegados,
  temConflitosAgendaLegados,
} from './conflitoAgenda'
