/**
 * I/O de relógio — form vazio canónico em `app/modules/agenda/agendamentoForm`.
 */
import { emptyAgendamentoFormState as emptyAgendamentoFormStatePure } from '../modules/agenda/agendamentoForm'
import { filterAgendamentosLembrete as filterAgendamentosLembretePure } from '../modules/agenda/lembreteWhatsApp'
import type { Agendamento } from '../modules/agenda/tipos'

/** Injeta Date.now() nas datas iniciais quando o call-site não envia. */
export function emptyAgendamentoFormState(overrides?: Partial<Agendamento>): Agendamento {
  return emptyAgendamentoFormStatePure(overrides, { nowMs: Date.now() })
}

/** Injeta new Date() no filtro de lembretes de hoje/amanhã. */
export function filterAgendamentosLembrete(
  agendamentos: Agendamento[],
  now?: Date
): Agendamento[] {
  return filterAgendamentosLembretePure(agendamentos, now ?? new Date())
}
