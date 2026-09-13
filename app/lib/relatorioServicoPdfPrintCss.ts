/**
 * Estilos de impressão / PDF para relatórios de serviço (A4).
 * Canónico em `app/modules/relatorio-servico`.
 */

export { escapePdfHtml } from './pdfDocumentLayout'
export type { RelatorioServicoTotaisResumo } from '../modules/relatorio-servico/pdfResumo'
export {
  formatHorasResumoPdf,
  formatKmResumoPdf,
  formatDiariasResumoPdf,
  buildRelatorioServicoSummaryCardsHtml,
  wrapRelatorioServicoPdfDocHtml,
} from '../modules/relatorio-servico/pdfResumo'

export type {
  RelatorioServicoPdfHeaderVariant,
  RelatorioServicoPdfMetaLabels,
  FechamentoClienteCadastroRef,
} from '../modules/relatorio-servico/pdfMeta'
export {
  buildRelatorioServicoPdfHeaderHtml,
  buildFechamentoDespesasClienteMetaFields,
  buildFechamentoDespesasRelatorioInfoHtml,
  buildRelatorioServicoPdfMetaSectionHtml,
  RELATORIO_SERVICO_PDF_HEADER_CSS,
  RELATORIO_SERVICO_PDF_HEADER_CSS_LEGACY,
} from '../modules/relatorio-servico/pdfMeta'

export { RELATORIO_SERVICO_PDF_PRINT_CSS } from '../modules/relatorio-servico/pdfPrintCss'
