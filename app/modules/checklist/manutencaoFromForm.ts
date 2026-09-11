/** Validação e mapeamento puro da manutenção de checklist. */

import type { ManutencaoChecklistFormState } from './manutencaoForm'
import type { ManutencaoChecklist } from './tipos'

export function isManutencaoChecklistFormValid(
  form: Pick<ManutencaoChecklistFormState, 'nome'>
): boolean {
  return Boolean(form.nome.trim())
}

export function createManutencaoChecklistFromForm(
  form: ManutencaoChecklistFormState,
  opts?: { id?: string; dataCriacao?: string }
): ManutencaoChecklist {
  return {
    id: opts?.id ?? Date.now().toString(),
    nome: form.nome.trim(),
    avaliacaoFeitaVisual: form.avaliacaoFeitaVisual,
    testeMecanico: form.testeMecanico,
    testeEletrico: form.testeEletrico,
    testeOperacional: form.testeOperacional,
    pecas: form.pecas || [],
    dataCriacao: opts?.dataCriacao ?? new Date().toISOString(),
  }
}

export function updateManutencaoChecklistFromForm(
  existing: ManutencaoChecklist,
  form: ManutencaoChecklistFormState
): ManutencaoChecklist {
  return createManutencaoChecklistFromForm(form, {
    id: existing.id,
    dataCriacao: existing.dataCriacao,
  })
}
