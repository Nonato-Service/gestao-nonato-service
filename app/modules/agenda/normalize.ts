import type { Agendamento } from './tipos'

/** Normaliza tipo para o calendário: dados antigos podem vir sem `tipo` ou com texto diferente — antes ficava tudo azul. */
export function normalizeTipoAgendamento(ag: { tipo?: string }): 'pre-agendamento' | 'agendamento-tecnico' {
  const raw = ag.tipo
  if (raw === 'pre-agendamento') return 'pre-agendamento'
  if (raw === 'agendamento-tecnico') return 'agendamento-tecnico'
  const s = String(raw ?? '')
    .trim()
    .toLowerCase()
  if (s === 'pre-agendamento' || s.startsWith('pre') || s.includes('pré') || s.includes('preagendamento')) {
    return 'pre-agendamento'
  }
  if (s === 'agendamento-tecnico' || s.includes('tecnico') || s.includes('técnico')) {
    return 'agendamento-tecnico'
  }
  return 'pre-agendamento'
}

/** Normaliza status para UI (localStorage antigo pode trazer texto livre ou acentos). */
export function normalizeStatusAgendamento(ag: { status?: string }): Agendamento['status'] {
  const raw = String(ag.status ?? '').trim()
  const s = raw
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
  if (s === 'concluido') return 'concluido'
  if (s === 'cancelado') return 'cancelado'
  if (s === 'em-andamento' || s === 'em andamento') return 'em-andamento'
  if (s === 'confirmado') return 'confirmado'
  if (s === 'pendente') return 'pendente'
  if (s.includes('conclu')) return 'concluido'
  if (s.includes('cancel')) return 'cancelado'
  if (s.includes('andamento')) return 'em-andamento'
  if (s.includes('confirm')) return 'confirmado'
  return 'pendente'
}

export function normalizeCategoriaAgendamento(ag: { categoria?: string }): 'servico' | 'pessoal' {
  return ag.categoria === 'pessoal' ? 'pessoal' : 'servico'
}

export function isAgendamentoPessoal(ag: { categoria?: string }): boolean {
  return normalizeCategoriaAgendamento(ag) === 'pessoal'
}

export function isAgendamentoCancelado(ag: { status?: string }): boolean {
  return normalizeStatusAgendamento(ag) === 'cancelado'
}

/**
 * Estado operacional simplificado para botões rápidos (3 opções).
 * Usar `isStatusOperacionalAtivo` para destacar o botão — «Em andamento»
 * só fica activo com status persistido `em-andamento`.
 */
export type StatusOperacionalAgenda = 'em-andamento' | 'concluido' | 'cancelado'

export function statusOperacionalAgenda(ag: { status?: string }): StatusOperacionalAgenda {
  const st = normalizeStatusAgendamento(ag)
  if (st === 'concluido') return 'concluido'
  if (st === 'cancelado') return 'cancelado'
  if (st === 'em-andamento') return 'em-andamento'
  // pendente / confirmado: ainda não promovidos a «em andamento»
  return 'em-andamento'
}

/** Destaca o botão rápido correcto (pendente/confirmado ≠ Em andamento activo). */
export function isStatusOperacionalAtivo(
  ag: { status?: string },
  op: StatusOperacionalAgenda
): boolean {
  const st = normalizeStatusAgendamento(ag)
  if (op === 'concluido') return st === 'concluido'
  if (op === 'cancelado') return st === 'cancelado'
  return st === 'em-andamento'
}

/** Mapeia o estado operacional para o status persistido no agendamento. */
export function statusFromOperacional(op: StatusOperacionalAgenda): Agendamento['status'] {
  if (op === 'concluido') return 'concluido'
  if (op === 'cancelado') return 'cancelado'
  return 'em-andamento'
}
