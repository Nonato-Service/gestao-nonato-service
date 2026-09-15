/** Módulo Protocolo de Serviço — tipos e normalização de blocos (funções puras). */

export type {
  ProtocoloEstadoAcao,
  ProtocoloBloco,
  ProtocoloBlocoMin,
  ProtocoloServicoStatus,
  ProtocoloServico,
} from './tipos'

export type { ProtocoloIdDeps } from './blocos'
export { newProtocoloBlocoId, ensureProtocoloBlocosIds } from './blocos'
export type { ProtocoloServicoFormState, ProtocoloServicoFormSimNao } from './formState'
export { emptyProtocoloServicoForm, protocoloServicoToForm } from './formState'
export {
  PROTOCOLO_SERVICO_PDF_MODELOS_MAX,
  PROTOCOLO_PDF_MODELO_PADRAO,
  clampProtocoloPdfModelo,
} from './pdfModelo'
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

export { historicoProtocolosCliente, pecasMaisUsadasHistorico } from './intelHistorico'

export type { RelatorioServicoMin as ProtocoloRelatorioServicoMin } from './intelRelatorio'
export { relatoriosServicoParaProtocolo, sugerirRelatorioServicoId } from './intelRelatorio'

export type { ProtocoloArquivoItem, GrupoProtocolosExecutadosCliente } from './intelArquivo'
export {
  normalizeProtocoloStatus,
  protocoloEstaEmExecucao,
  protocoloEstaExecutadoEnviado,
  dataChaveArquivoProtocolo,
  agruparProtocolosExecutadosPorClienteEData,
} from './intelArquivo'

export type { ProtocoloUiCopy } from './intelLabels'
export {
  rotuloProtocoloIntelFiltroChip,
  rotuloProtocoloTemplate,
  rotulosProtocoloWizardPassos,
} from './intelLabels'
export type { ProtocoloIntelFiltroChipsProps } from './intelChips'
export { ProtocoloIntelFiltroChips } from './intelChips'
export type { ProtocoloCompletudeBarProps } from './intelCompletude'
export { ProtocoloCompletudeBar } from './intelCompletude'
