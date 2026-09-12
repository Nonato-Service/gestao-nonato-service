/** Módulo Protocolo de Serviço — tipos e normalização de blocos (funções puras). */

export type {
  ProtocoloEstadoAcao,
  ProtocoloBloco,
  ProtocoloBlocoMin,
  ProtocoloServicoStatus,
  ProtocoloServico,
} from './tipos'

export { newProtocoloBlocoId, ensureProtocoloBlocosIds } from './blocos'
export type { ProtocoloServicoFormState, ProtocoloServicoFormSimNao } from './formState'
export { emptyProtocoloServicoForm, protocoloServicoToForm } from './formState'
export type { ProtocoloServicoFormMissing, CreateProtocoloServicoFromFormOpts } from './fromForm'
export {
  protocoloServicoFormMissing,
  isProtocoloServicoFormValid,
  createProtocoloServicoFromForm,
  updateProtocoloServicoFromForm,
} from './fromForm'

export type {
  ProtocoloIntelFiltroChip,
  ProtocoloCondicaoSimNao,
  ProtocoloFormMin,
  ProtocoloServicoMin,
  ProtocoloCompletudeItem,
} from './intelFiltro'
export {
  PROTOCOLO_FILTRO_CHIPS,
  protocoloTemImagens,
  protocoloTemPecas,
  protocoloIdentificacaoOk,
  protocoloConteudoOk,
  protocoloEstaIncompleto,
  avaliarCompletudeProtocolo,
  aplicarFiltroInteligenteChip,
} from './intelFiltro'

export type { ProtocoloTemplateId } from './intelTemplates'
export { PROTOCOLO_TEMPLATE_IDS, blocosDeTemplate } from './intelTemplates'
