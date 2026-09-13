/** Validação e mapeamento puro da manutenção de checklist. */

import type { ManutencaoChecklistFormState } from './manutencaoForm'
import type { ManutencaoChecklist } from './tipos'

export function isManutencaoChecklistFormValid(
  form: Pick<ManutencaoChecklistFormState, 'nome'>
): boolean {
  return Boolean(form.nome.trim())
}

export type CreateManutencaoChecklistFromFormOpts = {
  id?: string
  dataCriacao?: string
  nowMs: number
}

export function createManutencaoChecklistFromForm(
  form: ManutencaoChecklistFormState,
  opts: CreateManutencaoChecklistFromFormOpts
): ManutencaoChecklist {
  return {
    id: opts.id ?? String(opts.nowMs),
    nome: form.nome.trim(),
    avaliacaoFeitaVisual: form.avaliacaoFeitaVisual,
    testeMecanico: form.testeMecanico,
    testeEletrico: form.testeEletrico,
    testeOperacional: form.testeOperacional,
    pecas: form.pecas || [],
    dataCriacao: opts.dataCriacao ?? new Date(opts.nowMs).toISOString(),
  }
}

export function updateManutencaoChecklistFromForm(
  existing: ManutencaoChecklist,
  form: ManutencaoChecklistFormState
): ManutencaoChecklist {
  return createManutencaoChecklistFromForm(form, {
    id: existing.id,
    dataCriacao: existing.dataCriacao,
    nowMs: 0,
  })
}
