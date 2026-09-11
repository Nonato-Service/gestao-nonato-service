/** Validação e mapeamento puro do evento de histórico do equipamento. */

import type { HistoricoEquipamento } from './formState'
import type { HistoricoEquipamentoFormState } from './historicoForm'

export function isHistoricoEquipamentoFormValid(
  form: Pick<HistoricoEquipamentoFormState, 'descricao'>
): boolean {
  return Boolean(form.descricao.trim())
}

export type CreateHistoricoEquipamentoFromFormOpts = {
  id?: string
  data?: string
}

export function createHistoricoEquipamentoFromForm(
  form: HistoricoEquipamentoFormState,
  opts: CreateHistoricoEquipamentoFromFormOpts = {}
): HistoricoEquipamento {
  return {
    id: opts.id ?? Date.now().toString(),
    data: opts.data ?? new Date().toISOString(),
    tipo: form.tipo,
    descricao: form.descricao,
    responsavel: form.responsavel || undefined,
    observacoes: form.observacoes || undefined,
  }
}
