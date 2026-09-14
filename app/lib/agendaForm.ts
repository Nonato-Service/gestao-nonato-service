/**
 * I/O de relógio — form vazio canónico em `app/modules/agenda/agendamentoForm`.
 */
import { emptyAgendamentoFormState as emptyAgendamentoFormStatePure } from '../modules/agenda/agendamentoForm'
import type { Agendamento } from '../modules/agenda/tipos'

/** Injeta Date.now() nas datas iniciais quando o call-site não envia. */
export function emptyAgendamentoFormState(overrides?: Partial<Agendamento>): Agendamento {
  return emptyAgendamentoFormStatePure(overrides, { nowMs: Date.now() })
}
