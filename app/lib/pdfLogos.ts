/**
 * I/O de storage — logos de PDF canónicos em `app/modules/pdf/logos`.
 */
import type { PdfLogoSituationId } from '../modules/pdf/logoSituations'
import {
  resolveLogoPrincipalDataUrl as resolveLogoPrincipalDataUrlPure,
  resolveBibliotecaLogoDataUrl as resolveBibliotecaLogoDataUrlPure,
  resolvePdfLogoHtmlBySelectedId as resolvePdfLogoHtmlBySelectedIdPure,
  isIncluirLogoRelatoriosAtivo as isIncluirLogoRelatoriosAtivoPure,
  isIncluirLogoFechamentosAtivo as isIncluirLogoFechamentosAtivoPure,
  readStoredLogoSelectionId as readStoredLogoSelectionIdPure,
  getSelectedLogoIdForSituation as getSelectedLogoIdForSituationPure,
  getLogoHtmlForSituation as getLogoHtmlForSituationPure,
  getLogoHtmlForReport as getLogoHtmlForReportPure,
  getLogoHtmlForFechamento as getLogoHtmlForFechamentoPure,
  getLogoHtmlForOrcamento as getLogoHtmlForOrcamentoPure,
  getLogoHtmlForOrcamentoServico as getLogoHtmlForOrcamentoServicoPure,
  getLogoHtmlForDocumentos as getLogoHtmlForDocumentosPure,
  getLogoHtmlForProtocoloServico as getLogoHtmlForProtocoloServicoPure,
  getLogoHtmlForChecklist as getLogoHtmlForChecklistPure,
  getLogoHtmlForPreChecklist as getLogoHtmlForPreChecklistPure,
  type PdfLogoResolveCtx,
} from '../modules/pdf/logos'

export type { LogoRelatorioLike, PdfLogoResolveCtx, PdfLogoStorageGet } from '../modules/pdf/logos'
export { logoImgHtmlFromDataUrl } from '../modules/pdf/logos'

function lsGet(key: string): string | null {
  if (typeof window === 'undefined') return null
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

export function resolveLogoPrincipalDataUrl(ctx: PdfLogoResolveCtx) {
  return resolveLogoPrincipalDataUrlPure(ctx, lsGet)
}

export function resolveBibliotecaLogoDataUrl(selectedId: string, ctx: PdfLogoResolveCtx) {
  return resolveBibliotecaLogoDataUrlPure(selectedId, ctx, lsGet)
}

export function resolvePdfLogoHtmlBySelectedId(selectedId: string, ctx: PdfLogoResolveCtx) {
  return resolvePdfLogoHtmlBySelectedIdPure(selectedId, ctx, lsGet)
}

export function isIncluirLogoRelatoriosAtivo(ctx: PdfLogoResolveCtx) {
  return isIncluirLogoRelatoriosAtivoPure(ctx, lsGet)
}

export function isIncluirLogoFechamentosAtivo(ctx: PdfLogoResolveCtx) {
  return isIncluirLogoFechamentosAtivoPure(ctx, lsGet)
}

export function readStoredLogoSelectionId(storageKey: string, stateId: string | null | undefined) {
  return readStoredLogoSelectionIdPure(storageKey, stateId, lsGet)
}

export function getSelectedLogoIdForSituation(situationId: PdfLogoSituationId, ctx: PdfLogoResolveCtx) {
  return getSelectedLogoIdForSituationPure(situationId, ctx, lsGet)
}

export function getLogoHtmlForSituation(
  situationId: PdfLogoSituationId,
  ctx: PdfLogoResolveCtx,
  requireInclude?: 'relatorios' | 'fechamentos'
) {
  if (typeof window === 'undefined') return ''
  return getLogoHtmlForSituationPure(situationId, ctx, requireInclude, lsGet)
}

export function getLogoHtmlForReport(ctx: PdfLogoResolveCtx) {
  if (typeof window === 'undefined') return ''
  return getLogoHtmlForReportPure(ctx, lsGet)
}

export function getLogoHtmlForFechamento(ctx: PdfLogoResolveCtx) {
  if (typeof window === 'undefined') return ''
  return getLogoHtmlForFechamentoPure(ctx, lsGet)
}

export function getLogoHtmlForOrcamento(ctx: PdfLogoResolveCtx) {
  if (typeof window === 'undefined') return ''
  return getLogoHtmlForOrcamentoPure(ctx, lsGet)
}

export function getLogoHtmlForOrcamentoServico(ctx: PdfLogoResolveCtx) {
  if (typeof window === 'undefined') return ''
  return getLogoHtmlForOrcamentoServicoPure(ctx, lsGet)
}

export function getLogoHtmlForDocumentos(ctx: PdfLogoResolveCtx) {
  if (typeof window === 'undefined') return ''
  return getLogoHtmlForDocumentosPure(ctx, lsGet)
}

export function getLogoHtmlForProtocoloServico(ctx: PdfLogoResolveCtx) {
  if (typeof window === 'undefined') return ''
  return getLogoHtmlForProtocoloServicoPure(ctx, lsGet)
}

export function getLogoHtmlForChecklist(ctx: PdfLogoResolveCtx) {
  if (typeof window === 'undefined') return ''
  return getLogoHtmlForChecklistPure(ctx, lsGet)
}

export function getLogoHtmlForPreChecklist(ctx: PdfLogoResolveCtx) {
  if (typeof window === 'undefined') return ''
  return getLogoHtmlForPreChecklistPure(ctx, lsGet)
}
