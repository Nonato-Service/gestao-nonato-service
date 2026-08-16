/** Módulo PDF — resolução unificada de logos nos documentos. */

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
