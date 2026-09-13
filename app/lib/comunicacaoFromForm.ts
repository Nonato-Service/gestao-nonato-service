/**
 * I/O de relógio — fromForm canónico em `app/modules/comunicacao`.
 */
import {
  createMensagemComunicacaoFromForm as createMensagemComunicacaoFromFormPure,
  type CreateMensagemComunicacaoFromFormOpts,
  type MensagemComunicacaoFormPayload,
} from '../modules/comunicacao/fromForm'
import {
  createPecaSolicitadaArmazemFromForm as createPecaSolicitadaArmazemFromFormPure,
  type CreatePecaSolicitadaArmazemFromFormOpts,
  type PecaSolicitadaArmazemFormPayload,
} from '../modules/comunicacao/pecaArmazemFromForm'
import type { MensagemComunicacao, PecaSolicitadaArmazem } from '../modules/comunicacao/tipos'

/** Injeta Date.now() no id e na data quando o call-site não envia. */
export function createMensagemComunicacaoFromForm(
  form: MensagemComunicacaoFormPayload,
  opts: Omit<CreateMensagemComunicacaoFromFormOpts, 'nowMs'> = {}
): MensagemComunicacao {
  return createMensagemComunicacaoFromFormPure(form, { ...opts, nowMs: Date.now() })
}

export function createPecaSolicitadaArmazemFromForm(
  form: PecaSolicitadaArmazemFormPayload,
  opts: Omit<CreatePecaSolicitadaArmazemFromFormOpts, 'nowMs'> = {}
): PecaSolicitadaArmazem {
  return createPecaSolicitadaArmazemFromFormPure(form, { ...opts, nowMs: Date.now() })
}
