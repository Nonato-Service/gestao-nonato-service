/** Validação e mapeamento puro da peça desmontada. */

import type { PecaDesmontadaFormState } from './formState'
import type { GrupoDesmontado, PecaDesmontada } from './tipos'

export type PecaDesmontadaFromFormOpts = {
  grupoNome: string
}

/** Campos obrigatórios no save (n.º da peça, família, nome). */
export function isPecaDesmontadaFormValid(
  form: Pick<PecaDesmontadaFormState, 'numeroPeca' | 'familia' | 'nome'>
): boolean {
  return Boolean(form.numeroPeca && form.familia && form.nome)
}

/** Nome do grupo a partir do id (número do grupo; vazio se não existir). */
export function resolverGrupoNomeDesmontado(
  grupos: Pick<GrupoDesmontado, 'id' | 'numeroGrupo'>[],
  grupoId: string
): string {
  return grupos.find((g) => g.id === grupoId)?.numeroGrupo || ''
}

/** Monta uma PecaDesmontada nova a partir do form (sem I/O / alertas). */
export function createPecaDesmontadaFromForm(
  form: PecaDesmontadaFormState,
  opts: PecaDesmontadaFromFormOpts & { id: string; dataCriacao: string }
): PecaDesmontada {
  return {
    id: opts.id,
    ...form,
    grupoNome: opts.grupoNome,
    dataCriacao: opts.dataCriacao,
  }
}

/** Actualiza campos editáveis (preserva id, dataCriacao e extras do existente). */
export function updatePecaDesmontadaFromForm(
  existing: PecaDesmontada,
  form: PecaDesmontadaFormState,
  opts: PecaDesmontadaFromFormOpts
): PecaDesmontada {
  return {
    ...existing,
    ...form,
    grupoNome: opts.grupoNome,
  }
}
