/** Validação e mapeamento puro da peça solicitada ao armazém. */

import type { PecaSolicitadaArmazem } from './tipos'

export type PecaSolicitadaArmazemFormPayload = Omit<PecaSolicitadaArmazem, 'id' | 'dataEnvio'>

export function isPecaSolicitadaArmazemFormValid(
  form: Pick<PecaSolicitadaArmazemFormPayload, 'mensagemId' | 'checklistId'>
): boolean {
  return Boolean(form.mensagemId && form.checklistId)
}

export type CreatePecaSolicitadaArmazemFromFormOpts = {
  id?: string
  dataEnvio?: string
}

export function createPecaSolicitadaArmazemFromForm(
  form: PecaSolicitadaArmazemFormPayload,
  opts: CreatePecaSolicitadaArmazemFromFormOpts = {}
): PecaSolicitadaArmazem {
  return {
    ...form,
    id: opts.id ?? `armazem-${form.checklistId}-${Date.now()}`,
    dataEnvio: opts.dataEnvio ?? new Date().toISOString(),
  }
}
