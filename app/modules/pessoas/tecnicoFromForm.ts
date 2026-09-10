/** Validação e mapeamento puro do cadastro de técnico. */

import type { Tecnico, TecnicoFormState } from './tipos'

/** Nome, e-mail e telefone (sem trim — comportamento legado). */
export function isTecnicoFormValid(
  form: Pick<TecnicoFormState, 'name' | 'email' | 'phone'>
): boolean {
  return Boolean(form.name && form.email && form.phone)
}

/** Técnico novo (id e dataAtualizacao no call-site). */
export function createTecnicoFromForm(
  form: TecnicoFormState,
  opts: { id: string; dataAtualizacao: string }
): Tecnico {
  return {
    id: opts.id,
    ...form,
    dataAtualizacao: opts.dataAtualizacao,
  }
}

/** Actualiza campos editáveis (preserva id e extras do existente). */
export function updateTecnicoFromForm(
  existing: Tecnico,
  form: TecnicoFormState,
  opts: { dataAtualizacao: string }
): Tecnico {
  return {
    ...existing,
    ...form,
    dataAtualizacao: opts.dataAtualizacao,
  }
}
