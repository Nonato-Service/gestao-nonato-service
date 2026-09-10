/** Validação e mapeamento puro do grupo desmontado. */

import type { GrupoDesmontadoFormState } from './formState'
import type { GrupoDesmontado } from './tipos'

/** Campos obrigatórios no save (n.º do grupo, família). */
export function isGrupoDesmontadoFormValid(
  form: Pick<GrupoDesmontadoFormState, 'numeroGrupo' | 'familia'>
): boolean {
  return Boolean(form.numeroGrupo && form.familia)
}

/** Monta um GrupoDesmontado novo a partir do form (nome = n.º do grupo). */
export function createGrupoDesmontadoFromForm(
  form: GrupoDesmontadoFormState,
  opts: { id: string; dataCriacao: string }
): GrupoDesmontado {
  return {
    id: opts.id,
    ...form,
    nome: form.numeroGrupo,
    dataCriacao: opts.dataCriacao,
  }
}

/** Actualiza campos editáveis (preserva id, dataCriacao; nome = n.º do grupo). */
export function updateGrupoDesmontadoFromForm(
  existing: GrupoDesmontado,
  form: GrupoDesmontadoFormState
): GrupoDesmontado {
  return {
    ...existing,
    ...form,
    nome: form.numeroGrupo,
  }
}
