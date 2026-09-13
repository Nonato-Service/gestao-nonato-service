/**
 * I/O de relógio/aleatório — fromForm canónico em `app/modules/conhecimento-tecnico`.
 */
import {
  createConhecimentoTecnicoFromForm as createConhecimentoTecnicoFromFormPure,
  type ConhecimentoTecnicoFormPayload,
  type CreateConhecimentoTecnicoFromFormOpts,
} from '../modules/conhecimento-tecnico/fromForm'
import type { ConhecimentoTecnicoEntry } from '../modules/conhecimento-tecnico/tipos'

/** Injeta Date.now() e Math.random() no id quando o call-site não envia. */
export function createConhecimentoTecnicoFromForm(
  form: ConhecimentoTecnicoFormPayload,
  opts: Omit<CreateConhecimentoTecnicoFromFormOpts, 'nowMs' | 'random'> = {}
): ConhecimentoTecnicoEntry {
  return createConhecimentoTecnicoFromFormPure(form, { ...opts, nowMs: Date.now(), random: Math.random })
}
