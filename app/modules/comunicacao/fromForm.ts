/** Validação e mapeamento puro da mensagem de comunicação. */

import type { MensagemComunicacao } from './tipos'

export type MensagemComunicacaoFormPayload = Omit<MensagemComunicacao, 'id' | 'dataEnvio' | 'lida'>

export function isMensagemComunicacaoFormValid(
  form: Pick<MensagemComunicacaoFormPayload, 'assunto' | 'mensagem'>
): boolean {
  return Boolean(form.assunto.trim() && form.mensagem.trim())
}

export type CreateMensagemComunicacaoFromFormOpts = {
  id?: string
  dataEnvio?: string
  lida?: boolean
  nowMs: number
}

export function createMensagemComunicacaoFromForm(
  form: MensagemComunicacaoFormPayload,
  opts: CreateMensagemComunicacaoFromFormOpts
): MensagemComunicacao {
  return {
    ...form,
    id: opts.id ?? String(opts.nowMs),
    dataEnvio: opts.dataEnvio ?? new Date(opts.nowMs).toISOString(),
    lida: opts.lida ?? false,
  }
}
