/**
 * Shell HTML partilhado para todos os PDFs / impressão do sistema.
 * Usa cabeçalho, meta e rodapé de pdfDocumentLayout + cartões, tabelas e modelos visuais.
 */
import {
  PDF_DOCUMENT_LAYOUT_CSS,
  buildPdfDocumentFooterHtml,
  buildPdfDocumentHeaderHtml,
  buildPdfMetaSectionHtml,
  escapePdfHtml,
  type PdfDocumentHeaderVariant,
  type PdfMetaField,
} from './pdfDocumentLayout'
import { documentPdfThemeCss } from './pdfDocumentThemes'
import { normalizePdfModelo, pdfModeloBodyClass } from './pdfModelTypes'

export { escapePdfHtml, buildPdfDocumentFooterHtml, buildPdfMetaSectionHtml }

export type PdfDocTheme = 'service' | 'expense' | 'billing' | 'cadastro'

export type PdfDataCardRow = {
  label: string
  value: string
  highlight?: boolean
  /** Não renderiza a linha se value estiver vazio ou "—" */
  hideIfEmpty?: boolean
}

export function resolvePdfHeaderVariant(model: string): PdfDocumentHeaderVariant {
  const m = normalizePdfModelo(model)
  if (m === 'compacto' || m === 'resumido' || m === 'lista') return 'compact'
  if (m === 'detalhado' || m === 'formal' || m === 'executivo' || m === 'tecnico') return 'detailed'
  return 'classic'
}

export function buildPdfLogoContent(logo?: string, fallback = 'NONATO SERVICE'): string {
  const l = String(logo ?? '').trim()
  if (l.startsWith('data:')) {
    return `<img src="${l}" alt="Logo" />`
  }
  return escapePdfHtml(l || fallback)
}

export function buildPdfPrintToolbarHtml(labels?: {
  print?: string
  close?: string
}): string {
  const printLabel = labels?.print ?? 'Imprimir / Guardar como PDF'
  const closeLabel = labels?.close ?? 'Fechar'
  return `<div class="ns-pdf-no-print">
    <button type="button" onclick="window.print()">${escapePdfHtml(printLabel)}</button>
    <button type="button" class="ns-pdf-no-print__secondary" onclick="window.close()">${escapePdfHtml(closeLabel)}</button>
  </div>`
}

export function buildPdfDataCardSectionHtml(title: string, rows: PdfDataCardRow[]): string {
  const visible = rows.filter((r) => {
    if (!r.hideIfEmpty) return true
    const v = String(r.value ?? '').trim()
    return v !== '' && v !== '—'
  })
  if (visible.length === 0) return ''
  const inner = visible
    .map(
      (r) => `<div class="ns-pdf-card__row">
        <div class="ns-pdf-card__label">${escapePdfHtml(r.label)}</div>
        <div class="ns-pdf-card__value${r.highlight ? ' ns-pdf-card__value--highlight' : ''}">${r.value || '—'}</div>
      </div>`
    )
    .join('')
  return `<section class="ns-pdf-card-section">
    <h2 class="ns-pdf-card-section__title">${escapePdfHtml(title)}</h2>
    <div class="ns-pdf-card">${inner}</div>
  </section>`
}

export function buildPdfNoticeHtml(
  text: string,
  tone: 'info' | 'success' | 'warning' = 'info'
): string {
  return `<aside class="ns-pdf-notice ns-pdf-notice--${tone}">${escapePdfHtml(text)}</aside>`
}

export function buildPdfSummaryCardsHtml(
  cards: { label: string; value: string; modifier?: 'pago' | 'pendente' | 'total' }[]
): string {
  return `<div class="ns-pdf-summary-grid">${cards
    .map(
      (c) => `<div class="ns-pdf-summary-card${c.modifier ? ` ns-pdf-summary-card--${c.modifier}` : ''}">
        <span class="ns-pdf-summary-card__label">${escapePdfHtml(c.label)}</span>
        <strong class="ns-pdf-summary-card__value">${escapePdfHtml(c.value)}</strong>
      </div>`
    )
    .join('')}</div>`
}

export function buildPdfSectionTitleHtml(title: string): string {
  return `<h2 class="ns-pdf-section-title">${escapePdfHtml(title)}</h2>`
}

export function buildPdfInstructionsBoxHtml(title: string, items: string[]): string {
  const lis = items.map((i) => `<li>${escapePdfHtml(i)}</li>`).join('')
  return `<section class="ns-pdf-instructions">
    <h3 class="ns-pdf-instructions__title">${escapePdfHtml(title)}</h3>
    <ul class="ns-pdf-instructions__list">${lis}</ul>
  </section>`
}

/** Tabela profissional partilhada (despeas, contador, confirmações). */
export function wrapPdfTableHtml(tableInnerHtml: string, modifier: '' | 'expense' | 'billing' = ''): string {
  const mod = modifier ? ` ns-pdf-table-wrap--${modifier}` : ''
  return `<div class="ns-pdf-table-wrap${mod}"><table class="ns-pdf-table">${tableInnerHtml}</table></div>`
}

export const PDF_SHELL_EXTRA_CSS = `
@media print {
  .ns-pdf-no-print { display: none !important; }
}
* { box-sizing: border-box; }
@page { size: A4 portrait; margin: 12mm; }
body.ns-pdf-doc {
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  margin: 0;
  padding: 18px 20px 24px;
  color: #1a1a1a;
  line-height: 1.5;
  font-size: 10pt;
  background: #fff;
  -webkit-print-color-adjust: exact;
  print-color-adjust: exact;
}
body.ns-pdf-doc.ns-pdf-doc--cadastro {
  max-width: 720px;
  margin-left: auto;
  margin-right: auto;
}
.ns-pdf-no-print {
  margin-bottom: 20px;
  display: flex;
  gap: 10px;
  align-items: center;
  flex-wrap: wrap;
}
.ns-pdf-no-print button {
  padding: 10px 20px;
  font-size: 14px;
  background: #0d7a3d;
  color: #fff;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
}
.ns-pdf-no-print button:hover { background: #0a6230; }
.ns-pdf-no-print__secondary,
.ns-pdf-no-print button.ns-pdf-no-print__secondary {
  background: #334155;
}
.ns-pdf-no-print__secondary:hover { background: #475569; }
body.ns-pdf-doc--billing .ns-pdf-no-print button { background: #1565c0; }
body.ns-pdf-doc--billing .ns-pdf-no-print button:hover { background: #0d47a1; }

.ns-pdf-card-section { margin-bottom: 20px; }
.ns-pdf-card-section__title {
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: #64748b;
  margin: 0 0 10px;
  font-weight: 700;
}
.ns-pdf-card {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 16px 18px;
}
.ns-pdf-card__row { margin-bottom: 12px; }
.ns-pdf-card__row:last-child { margin-bottom: 0; }
.ns-pdf-card__label {
  font-size: 10px;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  margin-bottom: 4px;
  font-weight: 600;
}
.ns-pdf-card__value {
  font-size: 14px;
  font-weight: 600;
  color: #0f172a;
  word-break: break-word;
}
.ns-pdf-card__value--highlight {
  font-size: 15px;
  color: #0d7a3d;
  font-family: Consolas, Monaco, monospace;
  word-break: break-all;
}
body.ns-pdf-doc--billing .ns-pdf-card__value--highlight { color: #1565c0; }

.ns-pdf-notice {
  padding: 14px 16px;
  margin: 20px 0 0;
  font-size: 12px;
  border-radius: 0 8px 8px 0;
  line-height: 1.5;
}
.ns-pdf-notice--success {
  background: #e8f5e9;
  border-left: 4px solid #0d7a3d;
  color: #1b5e20;
}
.ns-pdf-notice--info {
  background: #e3f2fd;
  border-left: 4px solid #1565c0;
  color: #0d47a1;
}
.ns-pdf-notice--warning {
  background: #fffbeb;
  border: 1px solid #fcd34d;
  border-left: 4px solid #f59e0b;
  border-radius: 6px;
  color: #713f12;
}

.ns-pdf-summary-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  margin: 0 0 18px;
}
@media (max-width: 640px) {
  .ns-pdf-summary-grid { grid-template-columns: 1fr; }
}
.ns-pdf-summary-card {
  padding: 12px 14px;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  background: #fafafa;
}
.ns-pdf-summary-card__label {
  display: block;
  font-size: 9px;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: #64748b;
  font-weight: 600;
}
.ns-pdf-summary-card__value {
  display: block;
  font-size: 16px;
  margin-top: 4px;
  color: #0f172a;
}
.ns-pdf-summary-card--pago .ns-pdf-summary-card__value { color: #15803d; }
.ns-pdf-summary-card--pendente .ns-pdf-summary-card__value { color: #a16207; }

.ns-pdf-section-title {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #1e3a5f;
  margin: 20px 0 10px;
  padding-bottom: 6px;
  border-bottom: 1px solid #e2e8f0;
}
body.ns-pdf-doc--expense .ns-pdf-section-title { color: #0d7a3d; border-bottom-color: #c8e6c9; }

.ns-pdf-table-wrap {
  margin: 0 0 16px;
  border: 1px solid #dbeafe;
  border-radius: 4px;
  overflow: hidden;
}
.ns-pdf-table-wrap--expense { border-color: #c8e6c9; }
.ns-pdf-table-wrap--billing { border-color: #bbdefb; }
.ns-pdf-table {
  width: 100%;
  border-collapse: collapse;
  margin: 0;
  font-size: 9.5pt;
}
.ns-pdf-table th,
.ns-pdf-table td {
  border: 1px solid #e2e8f0;
  padding: 9px 10px;
  text-align: left;
  vertical-align: top;
}
.ns-pdf-table th {
  background: #1e3a5f;
  color: #fff;
  font-weight: 600;
  font-size: 8.5pt;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}
.ns-pdf-table-wrap--expense .ns-pdf-table th { background: #0d7a3d; }
.ns-pdf-table-wrap--billing .ns-pdf-table th { background: #1565c0; }
.ns-pdf-table tbody tr:nth-child(even) td { background: #f8fafc; }
.ns-pdf-table .num { text-align: right; white-space: nowrap; }
.ns-pdf-table .nowrap { white-space: nowrap; }
.ns-pdf-table .total-row td {
  background: #e8f5e9 !important;
  font-weight: 700;
  color: #0d7a3d;
}
.ns-pdf-table-wrap--billing .ns-pdf-table .total-row td {
  background: #e3f2fd !important;
  color: #1565c0;
}
.ns-pdf-table .status-pago { color: #15803d; font-weight: 600; }
.ns-pdf-table .status-pend { color: #a16207; font-weight: 600; }
.ns-pdf-table .anexos { font-size: 8.5pt; color: #64748b; margin-top: 2px; }

.ns-pdf-instructions {
  margin-top: 20px;
  padding: 14px 16px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
}
.ns-pdf-instructions__title {
  margin: 0 0 10px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: #1e3a5f;
}
.ns-pdf-instructions__list {
  margin: 0;
  padding-left: 20px;
  font-size: 10pt;
  color: #334155;
}
.ns-pdf-instructions__list li { margin-bottom: 6px; }
`.trim()

export function buildPdfHtmlDocument(options: {
  title: string
  lang?: string
  model?: string
  docTheme?: PdfDocTheme
  headerHtml: string
  metaHtml?: string
  bodyHtml: string
  footerHtml: string
  extraCss?: string
  showToolbar?: boolean
  toolbarLabels?: { print?: string; close?: string }
}): string {
  const {
    title,
    lang = 'pt-PT',
    model = 'profissional',
    docTheme = 'service',
    headerHtml,
    metaHtml = '',
    bodyHtml,
    footerHtml,
    extraCss = '',
    showToolbar = true,
    toolbarLabels,
  } = options

  const m = normalizePdfModelo(model)
  const variant = resolvePdfHeaderVariant(m)
  const bodyClass = [
    pdfModeloBodyClass(m, 'ns-pdf-doc'),
    `ns-pdf-doc--${docTheme}`,
    variant !== 'classic' ? `ns-pdf-doc--header-${variant}` : '',
  ]
    .filter(Boolean)
    .join(' ')

  const style = [
    PDF_DOCUMENT_LAYOUT_CSS,
    PDF_SHELL_EXTRA_CSS,
    documentPdfThemeCss(m, docTheme),
    extraCss,
  ].join('\n')

  const toolbar = showToolbar ? buildPdfPrintToolbarHtml(toolbarLabels) : ''

  return `<!DOCTYPE html>
<html lang="${escapePdfHtml(lang)}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapePdfHtml(title)}</title>
  <style>${style}</style>
</head>
<body class="${bodyClass}">
  ${toolbar}
  ${headerHtml}
  ${metaHtml}
  ${bodyHtml}
  ${footerHtml}
</body>
</html>`
}

export function buildPdfHeaderForDoc(options: {
  logo?: string
  title: string
  subtitle?: string
  reportNumber?: string
  badgeLabel?: string
  model?: string
  docTheme?: PdfDocTheme
}): string {
  const themeMap: Record<PdfDocTheme, 'service' | 'expense'> = {
    service: 'service',
    expense: 'expense',
    billing: 'service',
    cadastro: 'service',
  }
  const docTheme = options.docTheme ?? 'service'
  const headerTheme = docTheme === 'expense' ? 'expense' : themeMap[docTheme]
  return buildPdfDocumentHeaderHtml({
    logoContent: buildPdfLogoContent(options.logo),
    title: options.title,
    reportNumber: options.reportNumber ?? '',
    subtitle: options.subtitle ?? '',
    badgeLabel: options.badgeLabel ?? 'Documento n.º',
    badgeLabelCompact: 'N.º',
    variant: resolvePdfHeaderVariant(options.model ?? 'profissional'),
    theme: headerTheme,
  })
}

export function buildPdfMetaFieldsHtml(
  title: string,
  fields: PdfMetaField[],
  modifier: '' | 'dark' | 'expense' = ''
): string {
  return buildPdfMetaSectionHtml({ title, fields, modifier })
}
