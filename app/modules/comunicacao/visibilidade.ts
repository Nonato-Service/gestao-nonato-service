/** Predicados puros de visibilidade / não-lidas no hub de comunicação. */

import type { MensagemComunicacao } from './tipos'

export function isMensagemVisivelParaUsuario(
  mensagem: Pick<MensagemComunicacao, 'remetenteId' | 'destinatarioId'>,
  identityId: string | null | undefined,
  isAdmin: boolean
): boolean {
  if (isAdmin) return true
  if (!identityId) return false
  return mensagem.remetenteId === identityId || mensagem.destinatarioId === identityId
}

export function filterMensagensVisiveis(
  mensagens: MensagemComunicacao[],
  identityId: string | null | undefined,
  isAdmin: boolean
): MensagemComunicacao[] {
  return mensagens.filter((m) => isMensagemVisivelParaUsuario(m, identityId, isAdmin))
}

export function filterMensagensNaoLidas(
  mensagensVisiveis: MensagemComunicacao[],
  identityId: string | null | undefined
): MensagemComunicacao[] {
  if (!identityId) return []
  return mensagensVisiveis.filter(
    (mensagem) => mensagem.destinatarioId === identityId && !mensagem.lida
  )
}

export function countMensagensNaoLidas(
  mensagensVisiveis: MensagemComunicacao[],
  identityId: string | null | undefined
): number {
  return filterMensagensNaoLidas(mensagensVisiveis, identityId).length
}
