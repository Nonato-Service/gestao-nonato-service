/** Validação e mapeamento puro do cadastro de fornecedor. */

import type { Fornecedor, FornecedorFormState } from './tipos'

export type FornecedorFromFormOpts = {
  id: string
}

/** Campos obrigatórios no save (empresa, morada, e-mail). */
export function isFornecedorFormValid(
  form: Pick<FornecedorFormState, 'nomeEmpresa' | 'morada' | 'email'>
): boolean {
  return Boolean(form.nomeEmpresa && form.morada && form.email)
}

/** Monta um Fornecedor novo a partir do form (sem I/O / alertas). */
export function createFornecedorFromForm(
  form: FornecedorFormState,
  opts: FornecedorFromFormOpts
): Fornecedor {
  return {
    id: opts.id,
    ...form,
    faturas: [],
  }
}

/** Actualiza campos editáveis (preserva id, faturas e extras do existente). */
export function updateFornecedorFromForm(
  existing: Fornecedor,
  form: FornecedorFormState
): Fornecedor {
  return {
    ...existing,
    ...form,
  }
}
