/** Validação e mapeamento puro do item de trabalho na criação de checklist. */

import type { CriacaoChecklistItemForm } from './itemTrabalhoForm'
import type { ItemTrabalhoCriacao } from './tipos'

export function isCriacaoChecklistItemFormValid(
  form: Pick<CriacaoChecklistItemForm, 'descricaoTrabalho'>
): boolean {
  return Boolean(form.descricaoTrabalho.trim())
}

export type CreateItemTrabalhoCriacaoFromFormOpts = {
  id?: string
  dataCriacao?: string
  tipoFallback?: string
}

export function createItemTrabalhoCriacaoFromForm(
  form: CriacaoChecklistItemForm,
  opts: CreateItemTrabalhoCriacaoFromFormOpts = {}
): ItemTrabalhoCriacao {
  return {
    id: opts.id ?? Date.now().toString(),
    tipo: form.tipo.trim() || opts.tipoFallback || 'Outro',
    descricaoTrabalho: form.descricaoTrabalho.trim(),
    necessitaPecas: form.necessitaPecas,
    origemPecas: form.necessitaPecas ? form.origemPecas : undefined,
    codigoPeca:
      form.necessitaPecas && form.codigoPeca?.trim() ? form.codigoPeca.trim() : undefined,
    pecasManuais:
      form.necessitaPecas && form.origemPecas === 'codigo-manual'
        ? form.pecasManuais.filter((p) => p.codigo.trim())
        : undefined,
    dataCriacao: opts.dataCriacao ?? new Date().toISOString(),
  }
}
