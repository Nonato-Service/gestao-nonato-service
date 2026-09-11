/** Validação e mapeamento puro do PRE CHECK. */

import type { Equipamento } from '../equipamentos/formState'
import type { PreCheck, PreCheckFormState } from './tipos'

export function isPreCheckFormValid(
  form: Pick<PreCheckFormState, 'tecnicoResponsavel'>
): boolean {
  return Boolean(form.tecnicoResponsavel.trim())
}

export type CreatePreCheckFromFormOpts = {
  id?: string
}

export function createPreCheckFromForm(
  form: PreCheckFormState,
  equipamento: Equipamento,
  opts: CreatePreCheckFromFormOpts = {}
): PreCheck {
  return {
    id: opts.id ?? Date.now().toString() + Math.random().toString(36).substr(2, 9),
    equipamentoId: equipamento.id,
    equipamentoNumero: equipamento.numeroSerie,
    data: form.data,
    tecnicoResponsavel: form.tecnicoResponsavel,
    observacoes: form.observacoes,
    status: form.status,
    equipamento,
  }
}
