/**
 * I/O de relógio/aleatório — fromForm canónico em `app/modules/protocolo/fromForm`.
 */
import {
  createProtocoloServicoFromForm as createProtocoloServicoFromFormPure,
  updateProtocoloServicoFromForm as updateProtocoloServicoFromFormPure,
  type CreateProtocoloServicoFromFormOpts,
} from '../modules/protocolo/fromForm'
import type { ProtocoloServicoFormState } from '../modules/protocolo/formState'
import type { ProtocoloServico } from '../modules/protocolo/tipos'

function protocoloClock() {
  return { nowMs: Date.now(), random: Math.random }
}

/** Injeta Date.now() e Math.random() no id e na data quando o call-site não envia. */
export function createProtocoloServicoFromForm(
  form: ProtocoloServicoFormState,
  opts: Omit<CreateProtocoloServicoFromFormOpts, 'nowMs' | 'random'> = {}
): ProtocoloServico {
  return createProtocoloServicoFromFormPure(form, { ...opts, ...protocoloClock() })
}

export function updateProtocoloServicoFromForm(
  existing: ProtocoloServico,
  form: ProtocoloServicoFormState,
  opts: Omit<CreateProtocoloServicoFromFormOpts, 'id' | 'dataCriacao' | 'nowMs' | 'random'> = {}
): ProtocoloServico {
  return updateProtocoloServicoFromFormPure(existing, form, { ...opts, ...protocoloClock() })
}
