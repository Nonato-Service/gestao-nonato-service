/** Validação e mapeamento puro do item incluso do equipamento. */

import type { ItemIncluso } from './formState'
import type { ItemInclusoFormState } from './itemInclusoForm'

export function isItemInclusoFormValid(nome: string): boolean {
  return Boolean(nome.trim())
}

export type CreateItemInclusoFromFormOpts = {
  id?: string
  nowMs: number
}

export function createItemInclusoFromForm(
  form: Pick<ItemInclusoFormState, 'nome'> & { imagem?: string },
  opts: CreateItemInclusoFromFormOpts
): ItemIncluso {
  return {
    id: opts.id ?? opts.nowMs.toString(),
    nome: form.nome.trim(),
    imagem: form.imagem,
  }
}

export function updateItemInclusoFromForm(
  existing: ItemIncluso,
  form: ItemInclusoFormState
): ItemIncluso {
  return {
    ...existing,
    nome: form.nome,
    imagem: form.imagem || existing.imagem,
  }
}
