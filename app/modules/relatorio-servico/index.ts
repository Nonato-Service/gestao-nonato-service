/** Módulo Relatório de Serviço — dias, KM, numeração, peça, equipamento, tipo canónico. */

export type { DiaTrabalho, RelatorioServicoNumeroLike, ClienteRelatorioLookup } from './tipos'

export { createEmptyDiaTrabalhoForm } from './diaTrabalhoForm'

export type { PecaSubstituicao } from './pecaSubstituicao'
export { createEmptyPecaSubstituicaoForm } from './pecaSubstituicao'

export type {
  RelatorioEquipamentoOrigem,
  RelatorioEquipamentoRef,
} from './equipamentoRelatorioForm'
export {
  criarEquipamentoRelatorioVazio,
  createEmptyEquipamentoRelatorioForm,
} from './equipamentoRelatorioForm'

export type { RelatorioServico } from './relatorioServicoForm'
export { createEmptyRelatorioServicoForm } from './relatorioServicoForm'

export type {
  ItemRelatorioExcluidoArquivo,
  PastaRelatoriosExcluidosCliente,
  RelatoriosExcluidosClientesStorage,
} from './excluidosArquivo'

export {
  diaTrabalhoDataChaveOrdenacao,
  sortDiasTrabalhoCronologicamente,
  diasTrabalhoRelatorioOrdenados,
  normalizarDiasTrabalhoParaPersist,
  formatDiaTrabalhoCurtoPt,
} from './dias'

export {
  kmStringForNumberField,
  sanitizeKmFieldTyping,
  normalizeKmForPersist,
  isKmFieldEmpty,
  getKmPadraoDoCliente,
} from './km'

export {
  countRelatorioIdInClientesRelatorios,
  relatorioServicoMesmaChaveNegocio,
  encontrarRelatorioServicoDuplicado,
  dataIsoParaYYYYMMDDRelatorio,
  yyyymmddRelatorioValido,
  parseRelatorioServicoNumeroDataSeq,
  normalizeOsNumeroRelatorio,
} from './numero'

export {
  findClienteByRelatorio,
  relatorioEstaNaBibliotecaArquivo,
  relatorioSaiDaListaPrincipalRelatorios,
  relatoriosServicoForaDaBiblioteca,
} from './lista'

export type { TotaisDiasTrabalho } from './calculos'
export { calcularDuracao, atualizarCalculosDia, calcularTotais } from './calculos'

export {
  RELATORIO_SERVICO_PDF_MODELOS,
  PDF_MODEL_PADRAO_STORAGE_KEY,
  PDF_MODEL_POR_RELATORIO_STORAGE_KEY,
  isRelatorioServicoPdfModelo,
  normalizePdfModeloPorRelatorioMap,
  resolvePdfModeloForRelatorio,
} from './pdfModelo'
