/**
 * I/O de relógio — fromForm canónico em `app/modules/comprovantes/fromForm`.
 */
import {
  createComprovanteDespesaFromForm as createComprovanteDespesaFromFormPure,
  type CreateComprovanteDespesaFromFormOpts,
} from '../modules/comprovantes/fromForm'
import type { ComprovanteDespesaFormState } from '../modules/comprovantes/formState'
import type { ComprovanteDespesa } from '../modules/comprovantes/tipos'

/** Injeta Date.now() no id e nas datas quando o call-site não envia. */
export function createComprovanteDespesaFromForm(
  form: ComprovanteDespesaFormState,
  opts: Omit<CreateComprovanteDespesaFromFormOpts, 'nowMs'> = {}
): ComprovanteDespesa {
  return createComprovanteDespesaFromFormPure(form, { ...opts, nowMs: Date.now() })
}
