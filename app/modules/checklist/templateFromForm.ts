/** Validação e mapeamento puro do modelo de checklist. */

import type { ChecklistTemplateFormState } from './templateForm'
import type { ChecklistTemplate } from './tipos'

export function checklistTemplateFormMissing(
  form: Pick<ChecklistTemplateFormState, 'nome' | 'itens'>
): 'nome' | 'itens' | null {
  if (!form.nome.trim()) return 'nome'
  if (form.itens.length === 0) return 'itens'
  return null
}

export function isChecklistTemplateFormValid(
  form: Pick<ChecklistTemplateFormState, 'nome' | 'itens'>
): boolean {
  return checklistTemplateFormMissing(form) === null
}

export function createChecklistTemplateFromForm(
  form: ChecklistTemplateFormState,
  opts?: { id?: string; dataCriacao?: string }
): ChecklistTemplate {
  return {
    id: opts?.id ?? Date.now().toString(),
    nome: form.nome,
    descricao: form.descricao,
    itens: form.itens,
    dataCriacao: opts?.dataCriacao ?? new Date().toISOString(),
  }
}

export function updateChecklistTemplateFromForm(
  existing: ChecklistTemplate,
  form: ChecklistTemplateFormState
): ChecklistTemplate {
  return {
    ...existing,
    nome: form.nome,
    descricao: form.descricao,
    itens: form.itens,
  }
}
