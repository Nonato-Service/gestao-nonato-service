/** Validação, período, sanitização e mapeamento puro do agendamento. */

import type { ClienteAgendaLike } from './clienteEquipamento'
import { expandirIntervaloDatasContinuo } from './datas'
import {
  isAgendamentoPessoal,
  normalizeStatusAgendamento,
  normalizeTipoAgendamento,
} from './normalize'
import type { Agendamento } from './tipos'

/** Data e hora; serviço exige técnico e cliente (sem trim — comportamento legado). */
export function isAgendamentoFormValid(
  form: Pick<Agendamento, 'data' | 'hora' | 'tecnico' | 'cliente' | 'categoria'>
): boolean {
  if (!form.data || !form.hora) return false
  if (!isAgendamentoPessoal(form) && (!form.tecnico || !form.cliente)) return false
  return true
}

/** Rascunho do calendário (ou dias do form) → intervalo contínuo na data/duração. */
export function aplicarPeriodoAgendamentoForm(
  form: Agendamento,
  diasRascunho: string[]
): Agendamento {
  const diasExpandidos = expandirIntervaloDatasContinuo(
    diasRascunho.length > 0 ? diasRascunho : form.diasSelecionados || []
  )
  if (diasExpandidos.length === 0) return form
  return {
    ...form,
    data: diasExpandidos[0],
    diasSelecionados: diasExpandidos,
    duracaoEstimada: String(diasExpandidos.length),
  }
}

/** Normaliza tipo/status/categoria; assunto pessoal limpa campos de serviço. */
export function sanitizarAgendamentoFromForm(form: Agendamento): Agendamento {
  const pessoal = isAgendamentoPessoal(form)
  return {
    ...form,
    tipo: pessoal ? 'pre-agendamento' : normalizeTipoAgendamento(form),
    status: normalizeStatusAgendamento(form),
    categoria: pessoal ? 'pessoal' : 'servico',
    subtipoPessoal: pessoal ? form.subtipoPessoal || 'pessoal' : undefined,
    assunto: pessoal ? String(form.assunto || '').trim() : undefined,
    ...(pessoal
      ? {
          tecnico: '',
          cliente: '',
          clienteId: '',
          equipamento: '',
          equipamentoId: '',
          telefone: '',
          endereco: '',
          cidade: '',
          necessidadePecas: false,
          codigoNotaFiscal: '',
          pecasAnexadas: [],
        }
      : {}),
  }
}

/** Se há equipamentoId sem rótulo, preenche `modelo (série)` a partir do cadastro. */
export function completarRotuloEquipamentoAgendamento(
  form: Agendamento,
  clientes: ClienteAgendaLike[]
): Agendamento {
  if (isAgendamentoPessoal(form)) return form
  if (!form.equipamentoId || String(form.equipamento || '').trim()) return form
  const cliSave = clientes.find((c) => c.id === form.clienteId)
  const eqSave = cliSave?.equipamentos?.find(
    (e) => e.numeroSerie === form.equipamentoId || e.id === form.equipamentoId
  )
  if (!eqSave) return form
  return { ...form, equipamento: `${eqSave.modelo} (${eqSave.numeroSerie})` }
}

/** Passou a concluído nesta gravação (timestamp no call-site). */
export function deveMarcarConclusaoAgendamento(
  existing: Agendamento | null | undefined,
  form: Agendamento
): boolean {
  const statusAntes = existing ? normalizeStatusAgendamento(existing) : null
  const statusDepois = normalizeStatusAgendamento(form)
  return statusDepois === 'concluido' && statusAntes !== 'concluido'
}

/** Agendamento novo (id / dataRegistoConclusao no call-site). */
export function createAgendamentoFromForm(
  form: Agendamento,
  opts: { id: string; dataRegistoConclusao?: string }
): Agendamento {
  return {
    ...form,
    id: opts.id,
    ...(opts.dataRegistoConclusao ? { dataRegistoConclusao: opts.dataRegistoConclusao } : {}),
  }
}

/** Actualiza campos do form; preserva o id existente. */
export function updateAgendamentoFromForm(
  existing: Agendamento,
  form: Agendamento,
  opts?: { dataRegistoConclusao?: string }
): Agendamento {
  return {
    ...form,
    id: existing.id,
    ...(opts?.dataRegistoConclusao ? { dataRegistoConclusao: opts.dataRegistoConclusao } : {}),
  }
}
