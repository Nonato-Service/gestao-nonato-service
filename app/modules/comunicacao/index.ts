/** Módulo comunicação — tipos e helpers puros de mensagens / armazém. */

export type {
  MensagemComunicacao,
  PecaSolicitadaArmazem,
  CommunicationIdentity,
  LoginUserComunicacaoLike,
  GestorComunicacaoLike,
  TecnicoComunicacaoLike,
} from './tipos'

export { resolveCommunicationIdentity } from './identity'

export {
  isMensagemVisivelParaUsuario,
  filterMensagensVisiveis,
  filterMensagensNaoLidas,
  countMensagensNaoLidas,
} from './visibilidade'

export type {
  MensagemComunicacaoFormPayload,
  CreateMensagemComunicacaoFromFormOpts,
} from './fromForm'
export {
  isMensagemComunicacaoFormValid,
  createMensagemComunicacaoFromForm,
} from './fromForm'
