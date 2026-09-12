/** Módulo PDF — resolução unificada de logos nos documentos. */

export type { PdfLogoSituationId, PdfLogoSituationDef } from './logoSituations'
export {
  PDF_LOGO_SITUATIONS,
  PDF_LOGO_SITUATION_STORAGE_KEYS,
  PDF_LOGO_LEGACY_STORAGE_KEYS,
  PDF_LOGO_SITUATION_ACCENT,
  buildEmptyPdfLogoSelection,
  resolvePdfLogoSituation,
  pdfLogoSituationAccent,
} from './logoSituations'

export type { LogoRelatorioLike, PdfLogoResolveCtx } from './logos'
export {
  logoImgHtmlFromDataUrl,
  resolveLogoPrincipalDataUrl,
  resolveBibliotecaLogoDataUrl,
  resolvePdfLogoHtmlBySelectedId,
  isIncluirLogoRelatoriosAtivo,
  isIncluirLogoFechamentosAtivo,
  readStoredLogoSelectionId,
  getSelectedLogoIdForSituation,
  getLogoHtmlForSituation,
  getLogoHtmlForReport,
  getLogoHtmlForFechamento,
  getLogoHtmlForOrcamento,
  getLogoHtmlForOrcamentoServico,
  getLogoHtmlForDocumentos,
  getLogoHtmlForProtocoloServico,
  getLogoHtmlForChecklist,
  getLogoHtmlForPreChecklist,
} from './logos'
