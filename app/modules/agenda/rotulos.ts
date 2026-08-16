import type { Agendamento } from './tipos'
import { isAgendamentoPessoal, normalizeStatusAgendamento, normalizeTipoAgendamento } from './normalize'

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
  if (isAgendamentoPessoal(ag)) return 'rgba(168, 85, 247, 0.92)'
  const st = normalizeStatusAgendamento(ag)
  if (st === 'cancelado') return '#f87171'
  if (st === 'em-andamento') return 'rgba(255, 107, 45, 0.92)'
  if (st === 'confirmado') return 'rgba(55, 130, 235, 0.92)'
  if (st === 'pendente') return 'rgba(234, 88, 12, 0.92)'
  if (normalizeTipoAgendamento(ag) === 'pre-agendamento') return 'rgba(255, 190, 50, 0.95)'
  return 'rgba(90, 150, 255, 0.45)'
}
