import { createClientePrioritarioFromForm as createClientePrioritarioFromFormPure } from '../modules/clientes/prioritarioForm'
import type { ClientePrioritario, ClientePrioritarioForm } from '../modules/clientes/prioritarioTipos'

/** Injeta Date.now() no id quando o call-site não envia um. */
export function createClientePrioritarioFromForm(
  form: ClientePrioritarioForm,
  id?: string
): ClientePrioritario {
  return createClientePrioritarioFromFormPure(form, { id, nowMs: Date.now() })
}
