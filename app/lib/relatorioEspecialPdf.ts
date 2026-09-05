/**
 * @deprecated Preferir `app/modules/relatorios-especiais` — reexport de compatibilidade.
 */
export type {
  RelatorioEspecialPdfLabels,
  RelatorioEspecialPdfOptions,
  RelatorioEspecialPdfSecaoId,
  RelatorioEspecialPdfSecoes,
} from '../modules/relatorios-especiais/pdf'
export {
  RELATORIO_ESPECIAL_PDF_SECAO_IDS,
  defaultRelatorioEspecialPdfSecoes,
  normalizeRelatorioEspecialPdfSecoes,
  temAlgumaSecaoPdfEspecial,
  imprimirRelatorioEspecialPdf,
} from '../modules/relatorios-especiais/pdf'
