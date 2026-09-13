/**
 * I/O de relógio/aleatório — fromForm canónico em `app/modules/pre-check/fromForm`.
 */
import {
  createPreCheckFromForm as createPreCheckFromFormPure,
  type CreatePreCheckFromFormOpts,
} from '../modules/pre-check/fromForm'
import type { Equipamento } from '../modules/equipamentos/formState'
import type { PreCheck, PreCheckFormState } from '../modules/pre-check/tipos'

/** Injeta Date.now() e Math.random() no id quando o call-site não envia. */
export function createPreCheckFromForm(
  form: PreCheckFormState,
  equipamento: Equipamento,
  opts: Omit<CreatePreCheckFromFormOpts, 'nowMs' | 'random'> = {}
): PreCheck {
  return createPreCheckFromFormPure(form, equipamento, {
    ...opts,
    nowMs: Date.now(),
    random: Math.random,
  })
}
