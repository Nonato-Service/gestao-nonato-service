import type { Agendamento } from './tipos'
import {
  isAgendamentoPessoal,
  normalizeStatusAgendamento,
  normalizeTipoAgendamento,
  type StatusOperacionalAgenda,
} from './normalize'
import { coresAgendamentoVisual } from './estilo'

export function rotuloTituloAgendamento(ag: Agendamento, tr?: Record<string, string | undefined>): string {
  if (isAgendamentoPessoal(ag)) {
    const base =
      ag.subtipoPessoal === 'visita-tecnica'
        ? tr?.agendaVisitaTecnica || 'Visita técnica'
        : tr?.agendaPessoal || 'Pessoal'
    const assunto = String(ag.assunto || ag.tipoServico || '').trim()
    return assunto ? `${base} — ${assunto}` : base
  }
  return String(ag.cliente || '').trim() || '—'
}

export function rotuloCurtoAgendamentoCalendario(ag: Agendamento, tr?: Record<string, string | undefined>): string {
  if (isAgendamentoPessoal(ag)) {
    const base =
      ag.subtipoPessoal === 'visita-tecnica'
        ? tr?.agendaVisitaTecnica || 'Visita técnica'
        : tr?.agendaPessoal || 'Pessoal'
    const assunto = String(ag.assunto || '').trim()
    if (assunto) {
      const curto = assunto.length > 14 ? `${assunto.substring(0, 14)}…` : assunto
      return `${base}: ${curto}`
    }
    return base
  }
  const st = normalizeStatusAgendamento(ag)
  const nome = String(ag.cliente || '').trim()
  const curto = nome.length > 14 ? `${nome.substring(0, 14)}…` : nome
  if (st === 'cancelado') {
    return curto ? `${curto} (${tr?.cancelado || 'canc.'})` : tr?.cancelado || 'Cancelado'
  }
  return curto || '—'
}

export function rotuloTipoAgendamentoEstadoVisual(
  ag: Agendamento,
  tr?: Record<string, string | undefined>
): string {
  if (isAgendamentoPessoal(ag)) {
    return (
      ag.subtipoPessoal === 'visita-tecnica'
        ? tr?.agendaVisitaTecnica || 'Visita técnica'
        : tr?.agendaPessoal || 'Pessoal'
    ).toUpperCase()
  }
  return (
    normalizeTipoAgendamento(ag) === 'pre-agendamento'
      ? tr?.preAgendamento || 'Pré-Agendamento'
      : tr?.agendamentoTecnico || 'Agendamento Técnico'
  ).toUpperCase()
}

export function rotuloAgendaPainelSituacao(
  id: 'exec' | 'agend' | 'pre' | 'pessoal' | 'pend' | 'canc' | 'done',
  tr?: Record<string, string | undefined>
): string {
  switch (id) {
    case 'exec':
      return tr?.agendaPainelEmExecucao || 'Em execução'
    case 'agend':
      return tr?.agendaPainelAgendados || 'Agendados (confirmados)'
    case 'pre':
      return tr?.agendaPainelPreAgendados || 'Pré-agendados'
    case 'pessoal':
      return tr?.agendaPainelAssuntosPessoais || 'Assuntos pessoais'
    case 'pend':
      return tr?.agendaPainelPendentes || 'Pendentes (ag. técnico)'
    case 'canc':
      return tr?.agendaPainelCancelados || 'Cancelados'
    default:
      return tr?.agendaPainelConcluidosRecentes || 'Concluídos (recentes)'
  }
}

export function accentCorAgendamentoLista(ag: Agendamento): string {
  return coresAgendamentoVisual(ag).accent
}

export function rotuloStatusOperacionalAgenda(
  op: StatusOperacionalAgenda,
  tr?: Record<string, string | undefined>
): string {
  if (op === 'concluido') return tr?.concluido || 'Concluído'
  if (op === 'cancelado') return tr?.cancelado || 'Cancelado'
  return tr?.emAndamento || 'Em Andamento'
}

/** Rótulo do status real (pendente/confirmado distintos de em-andamento). */
export function rotuloStatusOperacionalDeAgendamento(
  ag: Agendamento,
  tr?: Record<string, string | undefined>
): string {
  const st = normalizeStatusAgendamento(ag)
  if (st === 'concluido') return tr?.concluido || 'Concluído'
  if (st === 'cancelado') return tr?.cancelado || 'Cancelado'
  if (st === 'em-andamento') return tr?.emAndamento || 'Em Andamento'
  if (st === 'confirmado') return tr?.confirmado || 'Confirmado'
  return tr?.pendente || 'Pendente'
}

/** Cores da legenda simples (estado do técnico) — em andamento laranja, alinhado aos cartões. */
export function corFundoStatusOperacional(op: StatusOperacionalAgenda): string {
  if (op === 'concluido') return 'rgba(0, 128, 58, 0.94)'
  if (op === 'cancelado') return 'rgba(178, 28, 28, 0.94)'
  return 'rgba(200, 78, 22, 0.94)'
}
