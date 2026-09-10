/** Validação e mapeamento puro do cadastro de gestor. */

import type { Gestor, GestorFormState } from './tipos'

/** Nome, e-mail e telefone (sem trim — comportamento legado). */
export function isGestorFormValid(
  form: Pick<GestorFormState, 'name' | 'email' | 'phone'>
): boolean {
  return Boolean(form.name && form.email && form.phone)
}

/** Gestor novo (id e dataAtualizacao no call-site). */
export function createGestorFromForm(
  form: GestorFormState,
  opts: { id: string; dataAtualizacao: string }
): Gestor {
  return {
    id: opts.id,
    ...form,
    dataAtualizacao: opts.dataAtualizacao,
  }
}

/** Actualiza campos editáveis (preserva id e extras do existente). */
export function updateGestorFromForm(
  existing: Gestor,
  form: GestorFormState,
  opts: { dataAtualizacao: string }
): Gestor {
  return {
    ...existing,
    ...form,
    dataAtualizacao: opts.dataAtualizacao,
  }
}
