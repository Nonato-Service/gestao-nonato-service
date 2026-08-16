/** Módulo Protocolo de Serviço — tipos e normalização de blocos (funções puras). */

export type {
  ProtocoloEstadoAcao,
  ProtocoloBloco,
  ProtocoloBlocoMin,
  ProtocoloServicoStatus,
  ProtocoloServico,
} from './tipos'

export { newProtocoloBlocoId, ensureProtocoloBlocosIds } from './blocos'
