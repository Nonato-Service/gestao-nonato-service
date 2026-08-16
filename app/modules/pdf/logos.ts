import {
  PDF_LOGO_SITUATIONS,
  type PdfLogoSituationId,
} from '../../lib/adminPdfLogoSituations'

export type LogoRelatorioLike = {
  id: string
  name?: string
  data?: string
  type: string
}

/** Estado necessário para resolver HTML de logo nos PDFs (injectado pelo NMA). */
export type PdfLogoResolveCtx = {
  logoUrl?: string | null
  logoType?: string | null
  logosRelatorios?: LogoRelatorioLike[] | null
  incluirLogoNosRelatorios?: boolean | null
  incluirLogoFechamentosDespesas?: boolean | null
  pdfLogoSelectedIds?: Partial<Record<PdfLogoSituationId, string | null | undefined>> | null
}

export function logoImgHtmlFromDataUrl(dataUrl: string): string {
  const src = String(dataUrl).replace(/"/g, '&quot;')
  return `<img src="${src}" alt="Logo" width="118" height="58" style="max-height:58px;max-width:118px;width:auto;height:auto;object-fit:contain;display:block;" />`
}

export function resolveLogoPrincipalDataUrl(ctx: PdfLogoResolveCtx): string | null {
  if (ctx.logoUrl && ctx.logoType !== 'video') return ctx.logoUrl
  if (typeof window === 'undefined') return null
  try {
    const logo = localStorage.getItem('nonato-logo')
    const type = localStorage.getItem('nonato-logo-type')
    if (logo && type !== 'video') return logo
  } catch {
    /* ignorar */
  }
  return null
}

export function resolveBibliotecaLogoDataUrl(
  selectedId: string,
  ctx: PdfLogoResolveCtx
): string | null {
  const id = String(selectedId ?? '').trim()
  if (!id) return null
  const list = ctx.logosRelatorios
  if (Array.isArray(list) && list.length > 0) {
    const fromState = list.find((l) => l.id === id)
    if (fromState?.type === 'image' && fromState.data) return fromState.data
  }
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem('nonato-logos-relatorios')
    if (!raw) return null
    const listRaw = JSON.parse(raw)
    if (!Array.isArray(listRaw)) return null
    const logoItem = listRaw.find((l: { id: string; type: string; data?: string }) => l.id === id)
    if (logoItem?.type === 'image' && logoItem.data) return String(logoItem.data)
  } catch {
    /* lista inválida ou muito grande */
  }
  return null
}

export function resolvePdfLogoHtmlBySelectedId(selectedId: string, ctx: PdfLogoResolveCtx): string {
  const bib = resolveBibliotecaLogoDataUrl(selectedId, ctx)
  if (bib) return logoImgHtmlFromDataUrl(bib)
  const principal = resolveLogoPrincipalDataUrl(ctx)
  if (principal) return logoImgHtmlFromDataUrl(principal)
  return ''
}

export function isIncluirLogoRelatoriosAtivo(ctx: PdfLogoResolveCtx): boolean {
  if (ctx.incluirLogoNosRelatorios === true) return true
  if (ctx.incluirLogoNosRelatorios === false) return false
  try {
    const stored = localStorage.getItem('nonato-relatorios-incluir-logo')
    if (stored === 'false') return false
    if (stored === 'true') return true
  } catch {
    /* ignorar */
  }
  return true
}

export function isIncluirLogoFechamentosAtivo(ctx: PdfLogoResolveCtx): boolean {
  if (ctx.incluirLogoFechamentosDespesas === true) return true
  if (ctx.incluirLogoFechamentosDespesas === false) return false
  try {
    const stored = localStorage.getItem('nonato-fechamentos-incluir-logo')
    if (stored === 'false') return false
    if (stored === 'true') return true
  } catch {
    /* ignorar */
  }
  return true
}

export function readStoredLogoSelectionId(
  storageKey: string,
  stateId: string | null | undefined
): string {
  if (stateId !== undefined && stateId !== null) return String(stateId)
  if (typeof window === 'undefined') return ''
  try {
    const r = localStorage.getItem(storageKey)
    return r != null ? r : ''
  } catch {
    return ''
  }
}

export function getSelectedLogoIdForSituation(
  situationId: PdfLogoSituationId,
  ctx: PdfLogoResolveCtx
): string {
  const def = PDF_LOGO_SITUATIONS.find((s) => s.id === situationId)
  if (!def) return ''
  return readStoredLogoSelectionId(def.storageKey, ctx.pdfLogoSelectedIds?.[situationId])
}

export function getLogoHtmlForSituation(
  situationId: PdfLogoSituationId,
  ctx: PdfLogoResolveCtx,
  requireInclude?: 'relatorios' | 'fechamentos'
): string {
  if (typeof window === 'undefined') return ''
  if (requireInclude === 'relatorios' && !isIncluirLogoRelatoriosAtivo(ctx)) return ''
  if (requireInclude === 'fechamentos' && !isIncluirLogoFechamentosAtivo(ctx)) return ''
  const selectedId = getSelectedLogoIdForSituation(situationId, ctx)
  return resolvePdfLogoHtmlBySelectedId(selectedId, ctx)
}

export function getLogoHtmlForReport(ctx: PdfLogoResolveCtx): string {
  return getLogoHtmlForSituation('relatorios', ctx, 'relatorios')
}

export function getLogoHtmlForFechamento(ctx: PdfLogoResolveCtx): string {
  return getLogoHtmlForSituation('fechamentos', ctx, 'fechamentos')
}

export function getLogoHtmlForOrcamento(ctx: PdfLogoResolveCtx): string {
  return getLogoHtmlForSituation('orcamentoPecas', ctx)
}

export function getLogoHtmlForOrcamentoServico(ctx: PdfLogoResolveCtx): string {
  return getLogoHtmlForSituation('orcamentoServico', ctx)
}

export function getLogoHtmlForDocumentos(ctx: PdfLogoResolveCtx): string {
  return getLogoHtmlForSituation('documentos', ctx)
}

export function getLogoHtmlForProtocoloServico(ctx: PdfLogoResolveCtx): string {
  return getLogoHtmlForSituation('protocolos', ctx)
}

export function getLogoHtmlForChecklist(ctx: PdfLogoResolveCtx): string {
  return getLogoHtmlForSituation('checklist', ctx)
}

export function getLogoHtmlForPreChecklist(ctx: PdfLogoResolveCtx): string {
  return getLogoHtmlForSituation('preChecklist', ctx)
}
