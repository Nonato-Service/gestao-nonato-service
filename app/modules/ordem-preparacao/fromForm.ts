/** Validação e mapeamento puro da ordem de preparação. */

import { emptyOrdemPreparacaoForm } from './formState'
import type { OrdemPreparacao, OrdemPreparacaoFormState } from './tipos'

export function isOrdemPreparacaoFormValid(
  form: Pick<OrdemPreparacaoFormState, 'codiceSmeUp'>
): boolean {
  return Boolean(form.codiceSmeUp)
}

export function createOrdemPreparacaoFromForm(form: OrdemPreparacaoFormState): OrdemPreparacao {
  return {
    ...emptyOrdemPreparacaoForm(),
    ...form,
    id: form.id || Date.now().toString(),
    dataCriacao: form.dataCriacao || new Date().toISOString(),
  }
}

export function updateOrdemPreparacaoFromForm(
  existing: OrdemPreparacao,
  form: OrdemPreparacaoFormState
): OrdemPreparacao {
  return {
    ...existing,
    ...form,
    id: existing.id,
    dataCriacao: existing.dataCriacao,
  }
}
