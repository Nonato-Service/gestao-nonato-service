/**
 * Re-export fino — fonte canónica em `app/modules/protocolo`.
 */

export type {
  ProtocoloEstadoAcao,
  ProtocoloBlocoMin,
  ProtocoloServicoStatus,
} from '../modules/protocolo'
export { newProtocoloBlocoId, ensureProtocoloBlocosIds } from '../modules/protocolo'

export type {
  ProtocoloIntelFiltroChip,
  ProtocoloCondicaoSimNao,
  ProtocoloFormMin,
  ProtocoloServicoMin,
  ProtocoloCompletudeItem,
} from '../modules/protocolo/intelFiltro'
export {
  PROTOCOLO_FILTRO_CHIPS,
  protocoloTemImagens,
  protocoloTemPecas,
  protocoloIdentificacaoOk,
  protocoloConteudoOk,
  protocoloEstaIncompleto,
  avaliarCompletudeProtocolo,
  aplicarFiltroInteligenteChip,
} from '../modules/protocolo/intelFiltro'

export type { ProtocoloTemplateId } from '../modules/protocolo/intelTemplates'
export { PROTOCOLO_TEMPLATE_IDS, blocosDeTemplate } from '../modules/protocolo/intelTemplates'

export { historicoProtocolosCliente, pecasMaisUsadasHistorico } from '../modules/protocolo/intelHistorico'

export { emptyProtocoloServicoForm as protocoloFormVazio, protocoloServicoToForm as formRascunhoDeProtocolo } from '../modules/protocolo'

export type { RelatorioServicoMin } from '../modules/protocolo/intelRelatorio'
export { relatoriosServicoParaProtocolo, sugerirRelatorioServicoId } from '../modules/protocolo/intelRelatorio'

export type { ProtocoloArquivoItem, GrupoProtocolosExecutadosCliente } from '../modules/protocolo/intelArquivo'
export {
  normalizeProtocoloStatus,
  protocoloEstaEmExecucao,
  protocoloEstaExecutadoEnviado,
  dataChaveArquivoProtocolo,
  agruparProtocolosExecutadosPorClienteEData,
} from '../modules/protocolo/intelArquivo'
