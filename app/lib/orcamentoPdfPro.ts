/**
 * Estilos e helpers partilhados para PDFs de orçamento — apresentação profissional A4.
 */
import {
  PDF_DOCUMENT_LAYOUT_CSS,
  buildPdfDocumentFooterHtml,
  buildPdfDocumentHeaderHtml,
  buildPdfMetaSectionHtml,
  escapePdfHtml,
  type PdfMetaField,
} from './pdfDocumentLayout'

export { escapePdfHtml, buildPdfDocumentFooterHtml }

export const ORCAMENTO_PDF_PRO_CSS = `
${PDF_DOCUMENT_LAYOUT_CSS}

:root {
  --orc-brand: #0d7a3d;
  --orc-brand-dark: #14532d;
  --orc-brand-light: #ecfdf5;
  --orc-accent: #1e3a5f;
  --orc-muted: #64748b;
  --orc-border: #e2e8f0;
  --orc-surface: #f8fafc;
}

@page { size: A4 portrait; margin: 11mm 12mm 14mm; }

* { box-sizing: border-box; }

body.orc-pdf-pro {
  font-family: "Segoe UI", system-ui, -apple-system, Arial, sans-serif;
  margin: 0;
  padding: 0;
  color: #0f172a;
  font-size: 10.5px;
  line-height: 1.5;
  background: #fff;
  -webkit-print-color-adjust: exact;
  print-color-adjust: exact;
}

.orc-pdf-pro__page {
  max-width: 210mm;
  margin: 0 auto;
  padding: 16px 18px 20px;
}

.orc-pdf-pro__preview {
  background: linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%);
  border: 2px dashed #f59e0b;
  color: #92400e;
  padding: 11px 16px;
  margin-bottom: 18px;
  border-radius: 10px;
  font-weight: 700;
  font-size: 11px;
  text-align: center;
  letter-spacing: 0.02em;
}

.orc-pdf-pro__empresa {
  margin: -4px 0 14px;
  padding: 10px 14px;
  background: var(--orc-surface);
  border: 1px solid var(--orc-border);
  border-radius: 8px;
  font-size: 10px;
  color: #334155;
  line-height: 1.45;
}

.orc-pdf-pro__empresa-nome {
  font-family: Georgia, "Times New Roman", serif;
  font-size: 13px;
  font-weight: 800;
  color: var(--orc-brand-dark);
  margin-bottom: 4px;
  letter-spacing: 0.02em;
}

.orc-pdf-pro__empresa-line { margin-bottom: 2px; }
.orc-pdf-pro__empresa-label { font-weight: 700; color: var(--orc-muted); }

.orc-pdf-pro__badge-doc {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 14px;
  padding: 5px 12px;
  border-radius: 999px;
  font-size: 9px;
  font-weight: 800;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  background: var(--orc-brand-light);
  color: var(--orc-brand-dark);
  border: 1px solid #86efac;
}

.orc-pdf-pro__equip-block {
  margin: 0 0 16px;
  border: 1px solid var(--orc-border);
  border-radius: 10px;
  overflow: hidden;
  break-inside: avoid;
  page-break-inside: avoid;
  box-shadow: 0 1px 3px rgba(15, 23, 42, 0.06);
}

.orc-pdf-pro__equip-head {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 11px 14px;
  background: linear-gradient(90deg, var(--orc-brand-dark) 0%, var(--orc-brand) 100%);
  color: #fff;
}

.orc-pdf-pro__equip-num {
  flex-shrink: 0;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
  font-size: 14px;
}

.orc-pdf-pro__equip-title {
  margin: 0;
  font-family: Georgia, "Times New Roman", serif;
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.02em;
}

.orc-pdf-pro__equip-detail {
  margin: 2px 0 0;
  font-size: 9.5px;
  opacity: 0.92;
  line-height: 1.4;
}

.orc-pdf-pro__equip-sn {
  margin: 0 0 10px;
  padding: 8px 12px;
  background: rgba(13, 122, 61, 0.12);
  border: 1px solid rgba(13, 122, 61, 0.35);
  border-radius: 8px;
  font-size: 11px;
  color: var(--orc-brand-dark);
}

.orc-pdf-pro__equip-sn strong {
  font-family: ui-monospace, Consolas, monospace;
  font-size: 12px;
  letter-spacing: 0.03em;
}

.orc-pdf-pro__equip-info {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px 12px;
  padding: 10px 14px;
  background: #f8fafc;
  border-bottom: 1px solid var(--orc-border);
}

.orc-pdf-pro__equip-field {
  min-width: 0;
}

.orc-pdf-pro__equip-field .lbl {
  display: block;
  font-size: 7.5px;
  font-weight: 800;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--orc-muted);
  margin-bottom: 2px;
}

.orc-pdf-pro__equip-field .val {
  display: block;
  font-size: 10px;
  font-weight: 600;
  color: #1e293b;
  word-break: break-word;
}

.orc-pdf-pro__equip-field--full {
  grid-column: 1 / -1;
}

.orc-pdf-pro__equip-body { padding: 0; }

.orc-pdf-pro__table {
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed;
}

.orc-pdf-pro__table th {
  background: #f1f5f9;
  color: var(--orc-accent);
  font-size: 8px;
  font-weight: 800;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  padding: 9px 8px;
  border-bottom: 2px solid var(--orc-brand);
  text-align: left;
}

.orc-pdf-pro__table td {
  padding: 9px 8px;
  border-bottom: 1px solid #eef2f6;
  vertical-align: middle;
  font-size: 10px;
}

.orc-pdf-pro__table tbody tr:nth-child(even) td { background: #fafbfc; }
.orc-pdf-pro__table tbody tr:last-child td { border-bottom: none; }

.orc-pdf-pro__col-img { width: 58px; text-align: center; }
.orc-pdf-pro__col-qtd { width: 44px; text-align: center; font-weight: 800; color: var(--orc-brand-dark); }
.orc-pdf-pro__col-cod { width: 88px; font-family: ui-monospace, monospace; font-size: 9px; color: #475569; }
.orc-pdf-pro__col-preco { width: 72px; text-align: right; white-space: nowrap; }
.orc-pdf-pro__col-iva { width: 64px; text-align: right; font-size: 9px; }

.orc-pdf-pro__thumb {
  width: 46px;
  height: 46px;
  object-fit: contain;
  border: 1px solid var(--orc-border);
  border-radius: 6px;
  background: #fff;
}

.orc-pdf-pro__na { color: #cbd5e1; font-size: 9px; }

.orc-pdf-pro__desc-cell { font-weight: 600; color: #1e293b; }

.orc-pdf-pro__summary {
  margin-top: 18px;
  padding: 14px 16px;
  background: linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%);
  border: 1px solid #86efac;
  border-radius: 10px;
  break-inside: avoid;
}

.orc-pdf-pro__summary-row {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 12px;
  margin-bottom: 6px;
  font-size: 11px;
  color: #334155;
}

.orc-pdf-pro__summary-row--total {
  margin: 8px 0 0;
  padding-top: 10px;
  border-top: 2px solid var(--orc-brand);
  font-size: 15px;
  font-weight: 800;
  color: var(--orc-brand-dark);
}

.orc-pdf-pro__summary-label { font-weight: 600; }
.orc-pdf-pro__summary-value { font-weight: 700; text-align: right; }

.orc-pdf-pro__notes {
  margin-top: 14px;
  padding: 12px 14px;
  background: var(--orc-surface);
  border-left: 4px solid var(--orc-accent);
  border-radius: 0 8px 8px 0;
  font-size: 10px;
  color: #475569;
  white-space: pre-wrap;
}

.orc-pdf-pro__notes-title {
  margin: 0 0 6px;
  font-size: 9px;
  font-weight: 800;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--orc-accent);
}

.orc-pdf-pro__kpi-strip {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  margin-bottom: 16px;
}

.orc-pdf-pro__kpi {
  padding: 10px 12px;
  background: var(--orc-surface);
  border: 1px solid var(--orc-border);
  border-radius: 8px;
  text-align: center;
}

.orc-pdf-pro__kpi-val {
  display: block;
  font-size: 18px;
  font-weight: 800;
  color: var(--orc-brand-dark);
  line-height: 1.2;
}

.orc-pdf-pro__kpi-lbl {
  display: block;
  margin-top: 3px;
  font-size: 8px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--orc-muted);
}

.orc-pdf-pro__actions {
  margin-top: 22px;
  padding-top: 16px;
  border-top: 1px solid var(--orc-border);
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  justify-content: center;
}

.orc-pdf-pro__btn {
  padding: 11px 22px;
  border: none;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  letter-spacing: 0.02em;
}

.orc-pdf-pro__btn--print { background: var(--orc-brand); color: #fff; }
.orc-pdf-pro__btn--sec { background: #64748b; color: #fff; }
.orc-pdf-pro__btn--email { background: #1e40af; color: #fff; }
.orc-pdf-pro__btn--wa { background: #128c47; color: #fff; }

.ns-pdf-header--expense .ns-pdf-header__bar {
  background: linear-gradient(90deg, #14532d 0%, #0d7a3d 50%, #14532d 100%);
}

@media print {
  body.orc-pdf-pro { padding: 0; }
  .orc-pdf-pro__page { padding: 0; max-width: none; }
  .no-print { display: none !important; }
  .orc-pdf-pro__equip-block,
  .orc-pdf-pro__summary,
  .ns-pdf-header,
  .ns-pdf-meta { break-inside: avoid; page-break-inside: avoid; }
}
`.trim()

export type OrcamentoPdfEmpresa = {
  nomeEmpresa?: string
  morada?: string
  nif?: string
  telefone?: string
  email?: string
  website?: string
}

export function fmtDataPdf(iso?: string): string {
  if (!iso) return new Date().toLocaleDateString('pt-PT')
  try {
    const d = new Date(iso.includes('T') ? iso : `${iso}T12:00:00`)
    return d.toLocaleDateString('pt-PT')
  } catch {
    return iso
  }
}

export function buildEmpresaBlockHtml(
  empresa: OrcamentoPdfEmpresa | undefined,
  L: Record<string, string | undefined>
): string {
  if (!empresa) return ''
  const nome = String(empresa.nomeEmpresa ?? '').trim()
  const morada = String(empresa.morada ?? '').trim()
  const nif = String(empresa.nif ?? '').trim()
  const tel = String(empresa.telefone ?? '').trim()
  const email = String(empresa.email ?? '').trim()
  const web = String(empresa.website ?? '').trim()
  if (!nome && !morada && !nif && !tel && !email) return ''

  const line = (label: string | undefined, val: string) =>
    val
      ? `<div class="orc-pdf-pro__empresa-line">${label ? `<span class="orc-pdf-pro__empresa-label">${escapePdfHtml(label)}:</span> ` : ''}${escapePdfHtml(val)}</div>`
      : ''

  return `<div class="orc-pdf-pro__empresa">
    ${nome ? `<div class="orc-pdf-pro__empresa-nome">${escapePdfHtml(nome)}</div>` : ''}
    ${morada ? `<div class="orc-pdf-pro__empresa-line">${escapePdfHtml(morada).replace(/\n/g, '<br/>')}</div>` : ''}
    ${line(L.empresaNifLabel || 'NIF', nif)}
    ${line(L.empresaTelefoneLabel || L.telefone || 'Telefone', tel)}
    ${line(L.empresaEmailLabel || L.email || 'E-mail', email)}
    ${line(L.website || 'Website', web)}
  </div>`
}

export function buildOrcamentoPdfShell(options: {
  title: string
  reportNumber: string
  subtitle?: string
  logoHtml?: string
  empresa?: OrcamentoPdfEmpresa
  metaTitle: string
  metaFields: PdfMetaField[]
  bodyHtml: string
  footerText: string
  previewBanner?: string
  badgeDoc?: string
  actionsHtml?: string
}): string {
  const header = buildPdfDocumentHeaderHtml({
    logoContent: options.logoHtml || '<span class="ns-pdf-header__logo-text">NONATO SERVICE</span>',
    title: options.title,
    reportNumber: options.reportNumber,
    subtitle: options.subtitle,
    badgeLabel: 'Documento n.º',
    variant: 'detailed',
    theme: 'expense',
  })

  const meta = buildPdfMetaSectionHtml({
    title: options.metaTitle,
    fields: options.metaFields,
    modifier: 'expense',
  })

  const empresa = buildEmpresaBlockHtml(options.empresa, {})

  return `<!DOCTYPE html>
<html lang="pt-PT">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapePdfHtml(options.title)} — ${escapePdfHtml(options.reportNumber)}</title>
  <style>${ORCAMENTO_PDF_PRO_CSS}</style>
</head>
<body class="orc-pdf-pro">
  <div class="orc-pdf-pro__page">
    ${options.previewBanner ? `<div class="orc-pdf-pro__preview">${escapePdfHtml(options.previewBanner)}</div>` : ''}
    ${header}
    ${empresa}
    ${options.badgeDoc ? `<div class="orc-pdf-pro__badge-doc">${escapePdfHtml(options.badgeDoc)}</div>` : ''}
    ${meta}
    ${options.bodyHtml}
    ${buildPdfDocumentFooterHtml(options.footerText)}
    ${options.actionsHtml ? `<div class="orc-pdf-pro__actions no-print">${options.actionsHtml}</div>` : ''}
  </div>
</body>
</html>`
}

export const EMPRESA_NONATO_DEFAULT: OrcamentoPdfEmpresa = {
  nomeEmpresa: 'NONATO SERVICE',
  morada: 'Portugal',
  website: 'www.nonatoservice.pt',
}
