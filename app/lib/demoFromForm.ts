/**
 * I/O de relógio — fromForm canónico em `app/modules/demo/fromForm`.
 */
import {
  createDemoRecipientFromForm as createDemoRecipientFromFormPure,
  type CreateDemoRecipientFromFormOpts,
  type DemoRecipientFormPayload,
} from '../modules/demo/fromForm'
import type { DemoRecipientRecord } from '../modules/demo/tipos'

/** Injeta Date.now() no id e na data quando o call-site não envia. */
export function createDemoRecipientFromForm(
  form: DemoRecipientFormPayload,
  opts: Omit<CreateDemoRecipientFromFormOpts, 'nowMs'> = {}
): DemoRecipientRecord {
  return createDemoRecipientFromFormPure(form, { ...opts, nowMs: Date.now() })
}
