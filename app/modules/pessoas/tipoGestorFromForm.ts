/** Validação e mapeamento puro do cadastro de tipo de gestor. */

import type { Gestor, TipoGestor, TipoGestorFormState } from './tipos'

/** Nome e ID (sem trim — comportamento legado). */
export function isTipoGestorFormValid(
  form: Pick<TipoGestorFormState, 'id' | 'nome'>
): boolean {
  return Boolean(form.nome && form.id)
}

/** Edição de um tipo que já está na lista. */
export function isTipoGestorEdicaoExistente(
  editing: Pick<TipoGestor, 'id'> | null | undefined,
  tipos: Array<Pick<TipoGestor, 'id'>>
): boolean {
  return Boolean(editing?.id && tipos.some((t) => t.id === editing.id))
}

/** ID já usado por outro tipo (só no cadastro novo). */
export function tipoGestorIdDuplicado(
  id: string,
  tipos: Array<Pick<TipoGestor, 'id'>>
): boolean {
  return tipos.some((t) => t.id === id)
}

export function proximaOrdemTipoGestor(tipos: Array<Pick<TipoGestor, 'ordem'>>): number {
  if (tipos.length === 0) return 1
  return Math.max(...tipos.map((t) => t.ordem)) + 1
}

export function createTipoGestorFromForm(form: TipoGestorFormState): TipoGestor {
  return { ...form }
}

export function updateTipoGestorFromForm(
  existing: TipoGestor,
  form: TipoGestorFormState
): TipoGestor {
  return { ...existing, ...form }
}

/** Se o ID do tipo mudar, actualiza a área dos gestores ligados. */
export function remapGestoresAreaTipoGestor(
  gestores: Gestor[],
  fromAreaId: string,
  toAreaId: string
): Gestor[] {
  if (!fromAreaId || fromAreaId === toAreaId) return gestores
  return gestores.map((g) => (g.area === fromAreaId ? { ...g, area: toAreaId } : g))
}
