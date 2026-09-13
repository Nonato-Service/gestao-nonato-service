import {
  createClienteFromForm as createClienteFromFormPure,
  type ClienteFromFormCreateOpts,
} from '../modules/clientes/clienteFromForm'
import type { Cliente } from '../modules/clientes/clienteTipos'
import type { ClienteFormState } from '../modules/clientes/clienteFormState'

/** Injeta Date.now() no id quando o call-site não envia um. */
export function createClienteFromForm(
  form: ClienteFormState,
  opts: ClienteFromFormCreateOpts
): Cliente {
  return createClienteFromFormPure(form, { ...opts, nowMs: Date.now() })
}
