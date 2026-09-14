import { PDF_LOGO_SITUATIONS, type PdfLogoSituationId } from './logoSituations'

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

export type PdfLogoStorageGet = (key: string) => string | null

function readStored(readItem: PdfLogoStorageGet | undefined, key: string): string | null {
  if (!readItem) return null
  try {
    const v = readItem(key)
    return v == null || v === '' ? null : String(v)
  } catch {
    return null
  }
}

export function logoImgHtmlFromDataUrl(dataUrl: string): string {
  const src = String(dataUrl).replace(/"/g, '&quot;')
  return `<img src="${src}" alt="Logo" width="118" height="58" style="max-height:58px;max-width:118px;width:auto;height:auto;object-fit:contain;display:block;" />`
}

export function resolveLogoPrincipalDataUrl(
  ctx: PdfLogoResolveCtx,
  readItem?: PdfLogoStorageGet
): string | null {
  if (ctx.logoUrl && ctx.logoType !== 'video') return ctx.logoUrl
  const logo = readStored(readItem, 'nonato-logo')
  const type = readStored(readItem, 'nonato-logo-type')
  if (logo && type !== 'video') return logo
  return null
}

export function resolveBibliotecaLogoDataUrl(
  selectedId: string,
  ctx: PdfLogoResolveCtx,
  readItem?: PdfLogoStorageGet
): string | null {
  const id = String(selectedId ?? '').trim()
  if (!id) return null
  const list = ctx.logosRelatorios
  if (Array.isArray(list) && list.length > 0) {
    const fromState = list.find((l) => l.id === id)
    if (fromState?.type === 'image' && fromState.data) return fromState.data
  }
  const raw = readStored(readItem, 'nonato-logos-relatorios')
  if (!raw) return null
  try {
    const listRaw = JSON.parse(raw)
    if (!Array.isArray(listRaw)) return null
    const logoItem = listRaw.find((l: { id: string; type: string; data?: string }) => l.id === id)
    if (logoItem?.type === 'image' && logoItem.data) return String(logoItem.data)
  } catch {
    /* lista inválida ou muito grande */
  }
  return null
}

export function resolvePdfLogoHtmlBySelectedId(
  selectedId: string,
  ctx: PdfLogoResolveCtx,
  readItem?: PdfLogoStorageGet
): string {
  const bib = resolveBibliotecaLogoDataUrl(selectedId, ctx, readItem)
  if (bib) return logoImgHtmlFromDataUrl(bib)
  const principal = resolveLogoPrincipalDataUrl(ctx, readItem)
  if (principal) return logoImgHtmlFromDataUrl(principal)
  return ''
}

export function isIncluirLogoRelatoriosAtivo(
  ctx: PdfLogoResolveCtx,
  readItem?: PdfLogoStorageGet
): boolean {
  if (ctx.incluirLogoNosRelatorios === true) return true
  if (ctx.incluirLogoNosRelatorios === false) return false
  const stored = readStored(readItem, 'nonato-relatorios-incluir-logo')
  if (stored === 'false') return false
  if (stored === 'true') return true
  return true
}

export function isIncluirLogoFechamentosAtivo(
  ctx: PdfLogoResolveCtx,
  readItem?: PdfLogoStorageGet
): boolean {
  if (ctx.incluirLogoFechamentosDespesas === true) return true
  if (ctx.incluirLogoFechamentosDespesas === false) return false
  const stored = readStored(readItem, 'nonato-fechamentos-incluir-logo')
  if (stored === 'false') return false
  if (stored === 'true') return true
  return true
}

export function readStoredLogoSelectionId(
  storageKey: string,
  stateId: string | null | undefined,
  readItem?: PdfLogoStorageGet
): string {
  if (stateId !== undefined && stateId !== null) return String(stateId)
  return readStored(readItem, storageKey) || ''
}

export function getSelectedLogoIdForSituation(
  situationId: PdfLogoSituationId,
  ctx: PdfLogoResolveCtx,
  readItem?: PdfLogoStorageGet
): string {
  const def = PDF_LOGO_SITUATIONS.find((s) => s.id === situationId)
  if (!def) return ''
  return readStoredLogoSelectionId(def.storageKey, ctx.pdfLogoSelectedIds?.[situationId], readItem)
}

export function getLogoHtmlForSituation(
  situationId: PdfLogoSituationId,
  ctx: PdfLogoResolveCtx,
  requireInclude?: 'relatorios' | 'fechamentos',
  readItem?: PdfLogoStorageGet
): string {
  if (requireInclude === 'relatorios' && !isIncluirLogoRelatoriosAtivo(ctx, readItem)) return ''
  if (requireInclude === 'fechamentos' && !isIncluirLogoFechamentosAtivo(ctx, readItem)) return ''
  const selectedId = getSelectedLogoIdForSituation(situationId, ctx, readItem)
  return resolvePdfLogoHtmlBySelectedId(selectedId, ctx, readItem)
}

export function getLogoHtmlForReport(ctx: PdfLogoResolveCtx, readItem?: PdfLogoStorageGet): string {
  return getLogoHtmlForSituation('relatorios', ctx, 'relatorios', readItem)
}

export function getLogoHtmlForFechamento(ctx: PdfLogoResolveCtx, readItem?: PdfLogoStorageGet): string {
  return getLogoHtmlForSituation('fechamentos', ctx, 'fechamentos', readItem)
}

export function getLogoHtmlForOrcamento(ctx: PdfLogoResolveCtx, readItem?: PdfLogoStorageGet): string {
  return getLogoHtmlForSituation('orcamentoPecas', ctx, undefined, readItem)
}

export function getLogoHtmlForOrcamentoServico(ctx: PdfLogoResolveCtx, readItem?: PdfLogoStorageGet): string {
  return getLogoHtmlForSituation('orcamentoServico', ctx, undefined, readItem)
}

export function getLogoHtmlForDocumentos(ctx: PdfLogoResolveCtx, readItem?: PdfLogoStorageGet): string {
  return getLogoHtmlForSituation('documentos', ctx, undefined, readItem)
}

export function getLogoHtmlForProtocoloServico(ctx: PdfLogoResolveCtx, readItem?: PdfLogoStorageGet): string {
  return getLogoHtmlForSituation('protocolos', ctx, undefined, readItem)
}

export function getLogoHtmlForChecklist(ctx: PdfLogoResolveCtx, readItem?: PdfLogoStorageGet): string {
  return getLogoHtmlForSituation('checklist', ctx, undefined, readItem)
}

export function getLogoHtmlForPreChecklist(ctx: PdfLogoResolveCtx, readItem?: PdfLogoStorageGet): string {
  return getLogoHtmlForSituation('preChecklist', ctx, undefined, readItem)
}
