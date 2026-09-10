/** Formulário de modelo de checklist — estado vazio e mapeamento. */

import type { ChecklistItemTemplate, ChecklistTemplate } from './tipos'

export type ChecklistTemplateFormState = {
  nome: string
  descricao: string
  itens: ChecklistItemTemplate[]
}

export function emptyChecklistTemplateForm(): ChecklistTemplateFormState {
  return { nome: '', descricao: '', itens: [] }
}

export function checklistTemplateToForm(template: ChecklistTemplate): ChecklistTemplateFormState {
  return {
    nome: template.nome,
    descricao: template.descricao || '',
    itens: template.itens,
  }
}
