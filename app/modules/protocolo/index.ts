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
