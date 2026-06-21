/**
 * Layout partilhado para PDFs / impressão — cabeçalho, bloco meta e rodapé.
 * Visual corporativo: claro, alinhado e legível em A4.
 */

export type PdfDocumentHeaderVariant = 'classic' | 'detailed' | 'compact'

export type PdfMetaField = {
  label: string
  value: string
  /** Ocupa a linha inteira (útil para IDs longos ou listas) */
  fullWidth?: boolean
}

export function escapePdfHtml(s: string | undefined | null): string {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/\r\n|\r|\n/g, '<br/>')
}

export function buildPdfDocumentHeaderHtml(options: {
  logoContent: string
  title: string
  reportNumber?: string
  subtitle?: string
  badgeLabel?: string
  badgeLabelCompact?: string
  variant?: PdfDocumentHeaderVariant
  /** 'service' = navy; 'expense' = verde corporativo */
  theme?: 'service' | 'expense'
}): string {
  const {
    logoContent,
    title,
    reportNumber = '',
    subtitle = '',
    badgeLabel = 'Documento n.º',
    badgeLabelCompact = 'N.º',
    variant = 'classic',
    theme = 'service',
  } = options

  const logoBlock = logoContent.includes('<img')
    ? logoContent
    : `<span class="ns-pdf-header__logo-text">${logoContent}</span>`

  const badgeLabelText = variant === 'compact' ? badgeLabelCompact : badgeLabel
  const badgeBlock =
    reportNumber.trim() !== ''
      ? `<div class="ns-pdf-header__badge">
          <span class="ns-pdf-header__badge-k">${badgeLabelText}</span>
          <span class="ns-pdf-header__badge-v">${reportNumber}</span>
        </div>`
      : ''

  const subtitleBlock =
    subtitle.trim() !== ''
      ? `<p class="ns-pdf-header__subtitle">${subtitle}</p>`
      : ''

  return `<header class="ns-pdf-header ns-pdf-header--${variant} ns-pdf-header--${theme}">
    <div class="ns-pdf-header__row">
      <div class="ns-pdf-header__logo">${logoBlock}</div>
      <div class="ns-pdf-header__titles">
        <h1 class="ns-pdf-header__title">${title}</h1>
        ${subtitleBlock}
      </div>
      ${badgeBlock}
    </div>
    <div class="ns-pdf-header__bar" aria-hidden="true"></div>
  </header>`
}

export function buildPdfMetaSectionHtml(options: {
  title: string
  fields: PdfMetaField[]
  modifier?: '' | 'dark' | 'expense'
}): string {
  const { title, fields, modifier = '' } = options
  const modClass = modifier ? ` ns-pdf-meta--${modifier}` : ''
  const rows: string[] = []
  let pending: PdfMetaField[] = []

  const flushPair = () => {
    if (pending.length === 0) return
    if (pending.length === 1 || pending[0].fullWidth) {
      const f = pending[0]
      rows.push(
        `<tr class="ns-pdf-meta__row ns-pdf-meta__row--full">
          <th scope="row">${f.label}</th>
          <td colspan="3">${f.value || '—'}</td>
        </tr>`
      )
      pending = pending.slice(1)
      return
    }
    const [a, b] = pending
    rows.push(
      `<tr class="ns-pdf-meta__row">
        <th scope="row">${a.label}</th>
        <td>${a.value || '—'}</td>
        <th scope="row">${b.label}</th>
        <td>${b.value || '—'}</td>
      </tr>`
    )
    pending = pending.slice(2)
  }

  for (const field of fields) {
    if (field.fullWidth) {
      flushPair()
      rows.push(
        `<tr class="ns-pdf-meta__row ns-pdf-meta__row--full">
          <th scope="row">${field.label}</th>
          <td colspan="3">${field.value || '—'}</td>
        </tr>`
      )
      continue
    }
    pending.push(field)
    if (pending.length === 2) flushPair()
  }
  flushPair()

  return `<section class="ns-pdf-meta${modClass}">
    <h2 class="ns-pdf-meta__title">${title}</h2>
    <table class="ns-pdf-meta__table" role="presentation">
      <tbody>${rows.join('')}</tbody>
    </table>
  </section>`
}

export function buildPdfDocumentFooterHtml(text: string): string {
  return `<footer class="ns-pdf-footer">${text}</footer>`
}

/** CSS do cabeçalho + meta + rodapé (importar nos PDFs HTML). */
export const PDF_DOCUMENT_LAYOUT_CSS = `
.ns-pdf-header {
  margin: 0 0 16px;
  break-inside: avoid;
  page-break-inside: avoid;
}

.ns-pdf-header__row {
  display: grid;
  grid-template-columns: minmax(72px, 132px) minmax(0, 1fr) auto;
  align-items: center;
  gap: 16px 18px;
  padding: 2px 0 12px;
}

.ns-pdf-header__logo {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 52px;
}

.ns-pdf-header__logo img {
  display: block;
  max-height: 58px;
  max-width: 128px;
  width: auto;
  height: auto;
  object-fit: contain;
}

.ns-pdf-header__logo-text {
  font-family: Georgia, "Times New Roman", serif;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: #1e293b;
  text-align: center;
  line-height: 1.35;
  word-break: break-word;
}

.ns-pdf-header__titles {
  min-width: 0;
}

.ns-pdf-header__title {
  margin: 0;
  font-family: Georgia, "Times New Roman", serif;
  font-size: 17px;
  font-weight: 700;
  letter-spacing: 0.03em;
  line-height: 1.25;
  color: #0f172a;
}

.ns-pdf-header__subtitle {
  margin: 5px 0 0;
  font-size: 9px;
  font-weight: 600;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: #64748b;
  line-height: 1.4;
  word-break: break-word;
}

.ns-pdf-header__badge {
  flex-shrink: 0;
  text-align: center;
  padding: 9px 14px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 4px;
  min-width: 96px;
}

.ns-pdf-header__badge-k {
  display: block;
  font-size: 7px;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: #64748b;
  margin-bottom: 3px;
}

.ns-pdf-header__badge-v {
  display: block;
  font-family: Georgia, "Times New Roman", serif;
  font-size: 15px;
  font-weight: 700;
  letter-spacing: 0.02em;
  color: #1e3a5f;
  line-height: 1.15;
  word-break: break-word;
}

.ns-pdf-header__bar {
  height: 3px;
  border-radius: 2px;
  background: linear-gradient(90deg, #1e3a5f 0%, #475569 45%, #1e3a5f 100%);
}

.ns-pdf-header--expense .ns-pdf-header__badge-v { color: #0d7a3d; }
.ns-pdf-header--expense .ns-pdf-header__bar {
  background: linear-gradient(90deg, #0d7a3d 0%, #00a650 50%, #0d7a3d 100%);
}

.ns-pdf-header--detailed .ns-pdf-header__title { font-size: 19px; }
.ns-pdf-header--detailed .ns-pdf-header__subtitle { font-size: 10px; }
.ns-pdf-header--detailed .ns-pdf-header__logo img { max-height: 66px; max-width: 140px; }
.ns-pdf-header--detailed .ns-pdf-header__badge-v { font-size: 17px; }

.ns-pdf-header--compact .ns-pdf-header__row {
  grid-template-columns: minmax(64px, 108px) minmax(0, 1fr) auto;
  gap: 10px 12px;
  padding-bottom: 8px;
}
.ns-pdf-header--compact .ns-pdf-header__title { font-size: 13px; }
.ns-pdf-header--compact .ns-pdf-header__subtitle { font-size: 7px; letter-spacing: 0.1em; }
.ns-pdf-header--compact .ns-pdf-header__logo img { max-height: 44px; max-width: 100px; }
.ns-pdf-header--compact .ns-pdf-header__badge { padding: 6px 10px; min-width: 78px; }
.ns-pdf-header--compact .ns-pdf-header__badge-v { font-size: 12px; }

.ns-pdf-meta {
  margin: 0 0 16px;
  border: 1px solid #e2e8f0;
  border-radius: 4px;
  overflow: hidden;
  background: #fff;
  break-inside: avoid;
  page-break-inside: avoid;
}

.ns-pdf-meta__title {
  margin: 0;
  padding: 10px 14px;
  font-family: Georgia, "Times New Roman", serif;
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: #1e293b;
  background: #f1f5f9;
  border-bottom: 1px solid #e2e8f0;
}

.ns-pdf-meta__table {
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed;
}

.ns-pdf-meta__table th[scope="row"] {
  width: 18%;
  padding: 9px 10px 9px 14px;
  text-align: left;
  vertical-align: top;
  font-size: 8px;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: #64748b;
  background: #fafbfc;
  border-bottom: 1px solid #eef2f6;
  border-right: 1px solid #eef2f6;
  word-break: break-word;
}

.ns-pdf-meta__table td {
  width: 32%;
  padding: 9px 12px;
  vertical-align: top;
  font-size: 10px;
  font-weight: 500;
  color: #0f172a;
  line-height: 1.45;
  border-bottom: 1px solid #eef2f6;
  word-break: break-word;
  overflow-wrap: anywhere;
}

.ns-pdf-meta__row:last-child th,
.ns-pdf-meta__row:last-child td {
  border-bottom: none;
}

.ns-pdf-meta__row--full th[scope="row"] {
  width: 18%;
}

.ns-pdf-meta__row--full td {
  width: 82%;
}

.ns-pdf-meta--expense {
  border-color: #c8e6c9;
}

.ns-pdf-meta--expense .ns-pdf-meta__title {
  background: #e8f5e9;
  color: #1b5e20;
  border-bottom-color: #c8e6c9;
}

.ns-pdf-meta--expense .ns-pdf-meta__table th[scope="row"] {
  color: #2e7d32;
  background: #f1f8e9;
  border-color: #e8f5e9;
}

.ns-pdf-meta--expense .ns-pdf-meta__table td {
  color: #1b5e20;
  border-color: #e8f5e9;
}

.ns-pdf-meta--dark {
  border-color: #444;
  background: #1a1a1a;
}

.ns-pdf-meta--dark .ns-pdf-meta__title {
  background: #252525;
  color: #e5e5e5;
  border-bottom-color: #444;
}

.ns-pdf-meta--dark .ns-pdf-meta__table th[scope="row"] {
  color: #aaa;
  background: #222;
  border-color: #333;
}

.ns-pdf-meta--dark .ns-pdf-meta__table td {
  color: #eee;
  border-color: #333;
}

.ns-pdf-footer {
  margin-top: 24px;
  padding-top: 12px;
  border-top: 1px solid #e2e8f0;
  font-size: 8px;
  color: #94a3b8;
  text-align: center;
  letter-spacing: 0.05em;
  line-height: 1.5;
}

@media print {
  .ns-pdf-header,
  .ns-pdf-meta {
    break-inside: avoid;
    page-break-inside: avoid;
  }
}
`.trim()
