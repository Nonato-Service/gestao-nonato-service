/** Módulo Relatório de Serviço — dias, KM, numeração/duplicados e lista vs biblioteca. */

export type { DiaTrabalho, RelatorioServicoNumeroLike, ClienteRelatorioLookup } from './tipos'

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
