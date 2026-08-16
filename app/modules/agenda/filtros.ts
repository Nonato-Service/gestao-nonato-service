import type { Agendamento } from './tipos'
import { isAgendamentoPessoal, normalizeStatusAgendamento, normalizeTipoAgendamento } from './normalize'

export function agendamentoStatusAtivoParaEstadoVisual(ag: Agendamento): boolean {
  const st = normalizeStatusAgendamento(ag)
  return st === 'pendente' || st === 'confirmado' || st === 'em-andamento'
}

/** Agendamentos visíveis no cartão do técnico (serviço do técnico + assuntos pessoais da equipa). */
export function agendamentoVisivelNoEstadoVisualTecnico(ag: Agendamento, tecnicoName: string): boolean {
  if (!agendamentoStatusAtivoParaEstadoVisual(ag)) return false
  if (isAgendamentoPessoal(ag)) return true
  return String(ag.tecnico || '').trim() === String(tecnicoName || '').trim()
}

/** Assuntos pessoais permanecem visíveis na agenda normal mesmo com filtro de tipo de serviço. */
export function agendaPassaFiltroTipoListagem(
  filtro:
    | 'todos'
    | 'pre-agendamento'
    | 'agendamento-tecnico'
    | 'assuntos-pessoais'
    | 'visita-tecnica'
    | 'nenhum'
    | 'folga'
    | 'doente'
    | 'ferias',
  ag: Agendamento
): boolean {
  if (filtro === 'assuntos-pessoais' && !isAgendamentoPessoal(ag)) return false
  if (
    filtro === 'visita-tecnica' &&
    (!isAgendamentoPessoal(ag) || ag.subtipoPessoal !== 'visita-tecnica')
  ) {
    return false
  }
  if (
    (filtro === 'pre-agendamento' || filtro === 'agendamento-tecnico') &&
    !isAgendamentoPessoal(ag) &&
    normalizeTipoAgendamento(ag) !== filtro
  ) {
    return false
  }
  return true
}

export function ordenarAgendamentosCalendarioDia(a: Agendamento, b: Agendamento): number {
  const prioridade = (ag: Agendamento): number => {
    if (isAgendamentoPessoal(ag)) return 2
    const st = normalizeStatusAgendamento(ag)
    if (st === 'cancelado') return 3
    if (st === 'concluido') return 5
    return 1
  }
  const pa = prioridade(a)
  const pb = prioridade(b)
  if (pa !== pb) return pa - pb
  return String(a.hora || '').localeCompare(String(b.hora || ''))
}
