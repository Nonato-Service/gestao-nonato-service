/**
 * Estilos de impressão / PDF para relatórios de serviço (A4).
 * Usado pelos modelos Clássico, Detalhado e Compacto — variante via classe no <body>.
 */

export type RelatorioServicoPdfHeaderVariant = 'classic' | 'detailed' | 'compact'

export function buildRelatorioServicoPdfHeaderHtml(options: {
  logoContent: string
  title: string
  reportNumber: string
  subtitle?: string
  variant?: RelatorioServicoPdfHeaderVariant
}): string {
  const {
    logoContent,
    title,
    reportNumber,
    subtitle = 'Assistência Técnica',
    variant = 'classic',
  } = options
  const logoBlock = logoContent.includes('<img')
    ? logoContent
    : `<span class="pdf-header__logo-text">${logoContent}</span>`

  if (variant === 'compact') {
    return `<div class="pdf-header pdf-header--compact">
      <div class="pdf-header__row">
        <div class="pdf-header__brand">${logoBlock}</div>
        <div class="pdf-header__main">
          <div class="pdf-header__title">${title}</div>
          <div class="pdf-header__subtitle">${subtitle}</div>
        </div>
      </div>
      <div class="pdf-header__meta-row">
        <span class="pdf-header__badge-label">Nº</span>
        <span class="pdf-header__badge-value">${reportNumber}</span>
      </div>
      <div class="pdf-header__accent"></div>
    </div>`
  }

  return `<div class="pdf-header pdf-header--${variant}">
    <div class="pdf-header__row">
      <div class="pdf-header__brand">${logoBlock}</div>
      <div class="pdf-header__main">
        <div class="pdf-header__title">${title}</div>
        <div class="pdf-header__subtitle">${subtitle}</div>
      </div>
      <div class="pdf-header__meta">
        <span class="pdf-header__badge-label">Nº Relatório</span>
        <span class="pdf-header__badge-value">${reportNumber}</span>
      </div>
    </div>
    <div class="pdf-header__accent"></div>
  </div>`
}

/** CSS do cabeçalho PDF — reutilizado em todos os modelos (exceto Ferwood). */
export const RELATORIO_SERVICO_PDF_HEADER_CSS = `
.pdf-header {
  margin-bottom: 16px;
  break-inside: avoid;
  page-break-inside: avoid;
  break-after: avoid;
  page-break-after: avoid;
}
.pdf-header__row {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px 16px 12px;
  background: linear-gradient(135deg, #14532d 0%, #166534 42%, #15803d 100%);
  border-radius: 12px 12px 0 0;
  color: #ffffff;
}
.pdf-header__brand {
  flex-shrink: 0;
  min-width: 88px;
  max-width: 130px;
  padding: 8px 10px;
  background: rgba(255, 255, 255, 0.97);
  border-radius: 10px;
  box-shadow: 0 2px 8px rgba(15, 23, 42, 0.12);
  display: flex;
  align-items: center;
  justify-content: center;
}
.pdf-header__brand img {
  max-height: 58px;
  max-width: 118px;
  width: auto;
  height: auto;
  object-fit: contain;
  display: block;
}
.pdf-header__logo-text {
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: #14532d;
  text-align: center;
  line-height: 1.2;
}
.pdf-header__main {
  flex: 1;
  min-width: 0;
  text-align: center;
}
.pdf-header__title {
  font-size: 14px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  line-height: 1.25;
  color: #ffffff;
  text-shadow: 0 1px 2px rgba(15, 23, 42, 0.25);
}
.pdf-header__subtitle {
  margin-top: 4px;
  font-size: 9px;
  font-weight: 600;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.88);
}
.pdf-header__meta {
  flex-shrink: 0;
  text-align: center;
  padding: 8px 12px;
  background: rgba(255, 255, 255, 0.14);
  border: 1px solid rgba(255, 255, 255, 0.35);
  border-radius: 10px;
  min-width: 92px;
}
.pdf-header__meta-row {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 8px 12px;
  background: #f0fdf4;
  border-left: 1px solid #bbf7d0;
  border-right: 1px solid #bbf7d0;
}
.pdf-header__badge-label {
  display: block;
  font-size: 7px;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.82);
  margin-bottom: 2px;
}
.pdf-header__meta-row .pdf-header__badge-label {
  color: #166534;
  margin-bottom: 0;
}
.pdf-header__badge-value {
  display: block;
  font-size: 13px;
  font-weight: 800;
  letter-spacing: 0.04em;
  color: #ffffff;
}
.pdf-header__meta-row .pdf-header__badge-value {
  color: #14532d;
}
.pdf-header__accent {
  height: 4px;
  background: linear-gradient(90deg, #166534 0%, #22c55e 50%, #166534 100%);
  border-radius: 0 0 10px 10px;
  box-shadow: 0 2px 6px rgba(22, 101, 52, 0.18);
}
.pdf-header--detailed .pdf-header__title { font-size: 15px; }
.pdf-header--detailed .pdf-header__subtitle { font-size: 10px; }
.pdf-header--detailed .pdf-header__badge-value { font-size: 14px; }
.pdf-header--compact .pdf-header__row {
  flex-direction: column;
  text-align: center;
  padding: 10px 12px 8px;
  gap: 8px;
}
.pdf-header--compact .pdf-header__brand { max-width: 110px; }
.pdf-header--compact .pdf-header__brand img { max-height: 44px; max-width: 96px; }
.pdf-header--compact .pdf-header__title { font-size: 11px; }
.pdf-header--compact .pdf-header__subtitle { font-size: 7px; }
.pdf-header--compact .pdf-header__meta-row { padding: 6px 10px; }
.pdf-header--compact .pdf-header__badge-value { font-size: 11px; }
`.trim()

export const RELATORIO_SERVICO_PDF_PRINT_CSS = `
@page { size: A4 portrait; margin: 10mm; }
* { margin: 0; padding: 0; box-sizing: border-box; }
body.rs-pdf {
  font-family: "Segoe UI", system-ui, -apple-system, Roboto, "Helvetica Neue", Arial, sans-serif;
  color: #0f172a;
  background: #ffffff;
  -webkit-print-color-adjust: exact;
  print-color-adjust: exact;
}
body.rs-pdf--classic { font-size: 10px; line-height: 1.45; padding: 10px 12px 16px; }
body.rs-pdf--detailed { font-size: 11px; line-height: 1.5; padding: 12px 14px 18px; }
body.rs-pdf--compact { font-size: 8px; line-height: 1.35; padding: 8px 8px 12px; }

${RELATORIO_SERVICO_PDF_HEADER_CSS}

.rs-pdf .info-section {
  margin-bottom: 14px;
  padding: 14px 14px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  background: #fafafa;
  box-shadow: 0 1px 3px rgba(15, 23, 42, 0.06);
  break-inside: auto;
  page-break-inside: auto;
}
.rs-pdf .info-section:not(:has(table)) {
  break-inside: avoid;
  page-break-inside: avoid;
}
.rs-pdf .info-section h3 {
  font-size: 9px;
  margin: -14px -14px 12px -14px;
  padding: 10px 12px;
  font-weight: 800;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: #14532d;
  background: linear-gradient(90deg, #ecfdf5 0%, rgba(240, 253, 244, 0.35) 55%, transparent 100%);
  border-left: 4px solid #166534;
  border-radius: 10px 10px 0 0;
}
.rs-pdf .info-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px 14px;
  font-size: inherit;
}
.rs-pdf .info-item { display: flex; gap: 6px; align-items: baseline; }
.rs-pdf .info-label { font-weight: 700; color: #334155; flex-shrink: 0; }

.rs-pdf table {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 12px;
  font-size: 0.92em;
  page-break-inside: auto;
}
.rs-pdf th, .rs-pdf td {
  border: 1px solid #e2e8f0;
  padding: 5px 4px;
  text-align: center;
  vertical-align: middle;
}
.rs-pdf th {
  background: #166534;
  color: #ffffff;
  font-weight: 700;
  font-size: 0.85em;
}
.rs-pdf tbody tr:nth-child(even) td { background: #f8fafc; }
.rs-pdf tbody tr td[style*="text-align:left"] { background: #f8fafc !important; border-color: #e2e8f0 !important; }

.rs-pdf .summary {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 10px;
  margin: 14px 0;
}
.rs-pdf .summary-card {
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 10px 8px;
  text-align: center;
  background: #fff;
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.05);
}
.rs-pdf .summary-card h4 {
  font-size: 0.85em;
  margin-bottom: 6px;
  font-weight: 700;
  color: #475569;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}
.rs-pdf .summary-card .value {
  font-size: 1.55em;
  font-weight: 800;
  color: #15803d;
  line-height: 1.1;
}

.rs-pdf .resultados-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px 14px;
  margin: 10px 0;
}
.rs-pdf .resultado-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 1em;
}
.rs-pdf .checkbox {
  width: 12px;
  height: 12px;
  border: 2px solid #94a3b8;
  border-radius: 3px;
  display: inline-block;
  flex-shrink: 0;
}
.rs-pdf .checkbox.checked {
  background: #166534;
  border-color: #166534;
}

.rs-pdf .observacoes {
  margin-top: 12px;
  padding: 12px 14px;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  background: #fff;
}
.rs-pdf .observacoes h4 {
  font-size: 1.05em;
  margin-bottom: 8px;
  font-weight: 800;
  color: #14532d;
}
.rs-pdf .observacoes p {
  font-size: 1em;
  white-space: pre-wrap;
  line-height: 1.55;
  color: #334155;
}

.rs-pdf .pecas-table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 12px;
  font-size: 1em;
}
.rs-pdf .pecas-table th, .rs-pdf .pecas-table td {
  border: 1px solid #e2e8f0;
  padding: 8px 6px;
  text-align: left;
  vertical-align: middle;
}
.rs-pdf .pecas-table th {
  background: #166534;
  color: #fff;
  font-weight: 700;
}
.rs-pdf .pecas-table .imagem-col {
  width: 76px;
  text-align: center;
}
.rs-pdf .pecas-table .imagem-col img {
  max-width: 68px;
  max-height: 68px;
  width: auto;
  height: auto;
  object-fit: contain;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  padding: 2px;
  background: #fff;
}

body.rs-pdf--detailed .pecas-table .imagem-col { width: 88px; }
body.rs-pdf--detailed .pecas-table .imagem-col img { max-width: 80px; max-height: 80px; }
body.rs-pdf--detailed .info-label { min-width: 115px; }
body.rs-pdf--detailed .info-item { gap: 8px; }

body.rs-pdf--compact .summary { gap: 6px; }
body.rs-pdf--compact .summary-card { padding: 6px 4px; }
body.rs-pdf--compact .resultados-grid {
  grid-template-columns: repeat(3, 1fr);
  gap: 6px;
}
body.rs-pdf--compact .pecas-table .imagem-col { width: 56px; }
body.rs-pdf--compact .pecas-table .imagem-col img { max-width: 48px; max-height: 48px; }

.rs-pdf .descricao-trabalho {
  margin-top: 8px;
  padding: 8px 10px;
  background: #f8fafc;
  border-left: 3px solid #166534;
  border-radius: 0 6px 6px 0;
  font-size: 0.95em;
  color: #334155;
}

.rs-pdf .pdf-rs-footer {
  margin-top: 18px;
  padding-top: 12px;
  border-top: 1px solid #e2e8f0;
  font-size: 8px;
  color: #64748b;
  text-align: center;
  letter-spacing: 0.02em;
}

@media print {
  body.rs-pdf { padding-bottom: 8mm; }
  .rs-pdf .info-section:has(table) {
    break-inside: auto;
    page-break-inside: auto;
  }
  .rs-pdf .info-section table,
  .rs-pdf .info-section tbody {
    break-inside: auto;
    page-break-inside: auto;
  }
  .rs-pdf .info-section tbody tr {
    break-inside: avoid;
    page-break-inside: avoid;
  }
  .rs-pdf .summary {
    break-inside: avoid;
    page-break-inside: avoid;
  }
}
`.trim()
