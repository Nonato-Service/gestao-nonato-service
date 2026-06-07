/**

 * Estilos de impressão / PDF para relatórios de serviço (A4).

 * Visual corporativo — tipografia sóbria, acentos navy/carvão (sem faixa verde).

 */



export type RelatorioServicoPdfHeaderVariant = 'classic' | 'detailed' | 'compact'



export function buildRelatorioServicoPdfHeaderHtml(options: {

  logoContent: string

  title: string

  reportNumber: string

  subtitle?: string

  badgeLabel?: string

  badgeLabelCompact?: string

  variant?: RelatorioServicoPdfHeaderVariant

}): string {

  const {

    logoContent,

    title,

    reportNumber,

    subtitle = 'Assistência Técnica',

    badgeLabel = 'Relatório n.º',

    badgeLabelCompact = 'N.º',

    variant = 'classic',

  } = options

  const logoBlock = logoContent.includes('<img')

    ? logoContent

    : `<span class="pdf-header__logo-text">${logoContent}</span>`



  if (variant === 'compact') {

    return `<div class="pdf-header pdf-header--compact">

      <div class="pdf-header__inner">

        <div class="pdf-header__brand">${logoBlock}</div>

        <div class="pdf-header__main">

          <div class="pdf-header__title">${title}</div>

          <div class="pdf-header__subtitle">${subtitle}</div>

        </div>

        <div class="pdf-header__meta">

          <span class="pdf-header__badge-label">${badgeLabelCompact}</span>

          <span class="pdf-header__badge-value">${reportNumber}</span>

        </div>

      </div>

      <div class="pdf-header__rule"></div>

    </div>`

  }



  return `<div class="pdf-header pdf-header--${variant}">

    <div class="pdf-header__inner">

      <div class="pdf-header__brand">${logoBlock}</div>

      <div class="pdf-header__divider-v" aria-hidden="true"></div>

      <div class="pdf-header__main">

        <div class="pdf-header__title">${title}</div>

        <div class="pdf-header__subtitle">${subtitle}</div>

      </div>

      <div class="pdf-header__meta">

        <span class="pdf-header__badge-label">${badgeLabel}</span>

        <span class="pdf-header__badge-value">${reportNumber}</span>

      </div>

    </div>

    <div class="pdf-header__rule"></div>

  </div>`

}



/** CSS do cabeçalho PDF — reutilizado em todos os modelos (exceto Ferwood). */

export const RELATORIO_SERVICO_PDF_HEADER_CSS = `

.pdf-header {

  margin-bottom: 18px;

  break-inside: avoid;

  page-break-inside: avoid;

  break-after: avoid;

  page-break-after: avoid;

}

.pdf-header__inner {

  display: flex;

  align-items: center;

  gap: 18px;

  padding: 4px 2px 14px;

  background: transparent;

  color: #0f172a;

}

.pdf-header__brand {

  flex-shrink: 0;

  min-width: 96px;

  max-width: 148px;

  padding: 4px 6px;

  display: flex;

  align-items: center;

  justify-content: center;

}

.pdf-header__brand img {

  max-height: 62px;

  max-width: 136px;

  width: auto;

  height: auto;

  object-fit: contain;

  display: block;

}

.pdf-header__logo-text {

  font-family: Georgia, "Times New Roman", serif;

  font-size: 12px;

  font-weight: 700;

  letter-spacing: 0.06em;

  text-transform: uppercase;

  color: #1e293b;

  text-align: center;

  line-height: 1.3;

}

.pdf-header__divider-v {

  width: 1px;

  align-self: stretch;

  min-height: 52px;

  background: linear-gradient(180deg, transparent 0%, #cbd5e1 18%, #94a3b8 50%, #cbd5e1 82%, transparent 100%);

  flex-shrink: 0;

}

.pdf-header__main {

  flex: 1;

  min-width: 0;

  text-align: left;

  padding-left: 2px;

}

.pdf-header__title {

  font-family: Georgia, "Times New Roman", serif;

  font-size: 17px;

  font-weight: 700;

  letter-spacing: 0.04em;

  line-height: 1.22;

  color: #0f172a;

  text-transform: none;

}

.pdf-header__subtitle {

  margin-top: 5px;

  font-size: 9px;

  font-weight: 600;

  letter-spacing: 0.16em;

  text-transform: uppercase;

  color: #64748b;

}

.pdf-header__meta {

  flex-shrink: 0;

  text-align: right;

  padding: 10px 14px;

  background: #f8fafc;

  border: 1px solid #e2e8f0;

  border-top: 2px solid #1e3a5f;

  border-radius: 2px;

  min-width: 108px;

}

.pdf-header__badge-label {

  display: block;

  font-size: 7px;

  font-weight: 700;

  letter-spacing: 0.16em;

  text-transform: uppercase;

  color: #64748b;

  margin-bottom: 4px;

}

.pdf-header__badge-value {

  display: block;

  font-family: Georgia, "Times New Roman", serif;

  font-size: 15px;

  font-weight: 700;

  letter-spacing: 0.03em;

  color: #1e3a5f;

  line-height: 1.15;

}

.pdf-header__rule {

  height: 2px;

  background: linear-gradient(90deg, #1e3a5f 0%, #475569 42%, #a67c52 50%, #475569 58%, #1e3a5f 100%);

  opacity: 0.85;

}

.pdf-header--detailed .pdf-header__title { font-size: 19px; }

.pdf-header--detailed .pdf-header__subtitle { font-size: 10px; }

.pdf-header--detailed .pdf-header__badge-value { font-size: 17px; }

.pdf-header--detailed .pdf-header__brand img { max-height: 68px; max-width: 148px; }

.pdf-header--compact .pdf-header__inner {

  flex-wrap: wrap;

  gap: 10px 14px;

  padding-bottom: 10px;

}

.pdf-header--compact .pdf-header__divider-v { display: none; }

.pdf-header--compact .pdf-header__brand { max-width: 120px; }

.pdf-header--compact .pdf-header__brand img { max-height: 46px; max-width: 108px; }

.pdf-header--compact .pdf-header__main { flex: 1 1 180px; }

.pdf-header--compact .pdf-header__title { font-size: 13px; }

.pdf-header--compact .pdf-header__subtitle { font-size: 7px; letter-spacing: 0.12em; }

.pdf-header--compact .pdf-header__meta { padding: 7px 10px; min-width: 88px; }

.pdf-header--compact .pdf-header__badge-value { font-size: 12px; }

`.trim()



export const RELATORIO_SERVICO_PDF_PRINT_CSS = `

@page { size: A4 portrait; margin: 12mm; }

* { margin: 0; padding: 0; box-sizing: border-box; }

body.rs-pdf {

  font-family: "Segoe UI", system-ui, -apple-system, Roboto, "Helvetica Neue", Arial, sans-serif;

  color: #0f172a;

  background: #ffffff;

  -webkit-print-color-adjust: exact;

  print-color-adjust: exact;

}

body.rs-pdf--classic { font-size: 10px; line-height: 1.5; padding: 8px 10px 18px; }

body.rs-pdf--detailed { font-size: 11px; line-height: 1.55; padding: 10px 12px 20px; }

body.rs-pdf--compact { font-size: 8px; line-height: 1.38; padding: 6px 8px 14px; }



${RELATORIO_SERVICO_PDF_HEADER_CSS}



.rs-pdf .info-section {

  margin-bottom: 16px;

  padding: 16px 16px 14px;

  border: 1px solid #e2e8f0;

  border-radius: 2px;

  background: #ffffff;

  box-shadow: none;

  break-inside: auto;

  page-break-inside: auto;

}

.rs-pdf .info-section:not(:has(table)) {

  break-inside: avoid;

  page-break-inside: avoid;

}

.rs-pdf .info-section h3 {

  font-family: Georgia, "Times New Roman", serif;

  font-size: 10px;

  margin: 0 0 14px 0;

  padding: 0 0 8px 0;

  font-weight: 700;

  letter-spacing: 0.12em;

  text-transform: uppercase;

  color: #1e293b;

  background: transparent;

  border-left: none;

  border-bottom: 1px solid #cbd5e1;

  border-radius: 0;

}

.rs-pdf .info-grid {

  display: grid;

  grid-template-columns: repeat(2, 1fr);

  gap: 10px 18px;

  font-size: inherit;

}

.rs-pdf .info-item { display: flex; gap: 8px; align-items: baseline; }

.rs-pdf .info-label {

  font-weight: 600;

  color: #64748b;

  flex-shrink: 0;

  font-size: 0.92em;

  letter-spacing: 0.02em;

}

.rs-pdf .info-item > :not(.info-label) {

  color: #0f172a;

  font-weight: 500;

}



.rs-pdf table {

  width: 100%;

  border-collapse: collapse;

  margin-bottom: 12px;

  font-size: 0.92em;

  page-break-inside: auto;

}

.rs-pdf th, .rs-pdf td {

  border: 1px solid #e2e8f0;

  padding: 6px 5px;

  text-align: center;

  vertical-align: middle;

}

.rs-pdf th {

  background: #1e293b;

  color: #f8fafc;

  font-weight: 600;

  font-size: 0.82em;

  letter-spacing: 0.04em;

  text-transform: uppercase;

}

.rs-pdf tbody tr:nth-child(even) td { background: #f8fafc; }

.rs-pdf tbody tr td[style*="text-align:left"] {

  background: #fafafa !important;

  border-color: #e2e8f0 !important;

  text-align: left !important;

  font-size: 0.95em;

  line-height: 1.45;

  color: #334155;

}



.rs-pdf .summary {

  display: grid;

  grid-template-columns: repeat(6, 1fr);

  gap: 10px;

  margin: 16px 0;

}

.rs-pdf .summary-card {

  border: 1px solid #e2e8f0;

  border-top: 2px solid #1e3a5f;

  border-radius: 2px;

  padding: 12px 8px;

  text-align: center;

  background: #fff;

}

.rs-pdf .summary-card h4 {

  font-size: 0.78em;

  margin-bottom: 8px;

  font-weight: 600;

  color: #64748b;

  text-transform: uppercase;

  letter-spacing: 0.06em;

}

.rs-pdf .summary-card .value {

  font-family: Georgia, "Times New Roman", serif;

  font-size: 1.65em;

  font-weight: 700;

  color: #1e3a5f;

  line-height: 1.1;

}



.rs-pdf .resultados-grid {

  display: grid;

  grid-template-columns: repeat(2, 1fr);

  gap: 10px 16px;

  margin: 10px 0;

}

.rs-pdf .resultado-item {

  display: flex;

  align-items: center;

  gap: 8px;

  font-size: 1em;

  color: #334155;

}

.rs-pdf .checkbox {

  width: 12px;

  height: 12px;

  border: 1.5px solid #94a3b8;

  border-radius: 2px;

  display: inline-block;

  flex-shrink: 0;

}

.rs-pdf .checkbox.checked {

  background: #1e293b;

  border-color: #1e293b;

}



.rs-pdf .observacoes {

  margin-top: 14px;

  padding: 14px 16px;

  border: 1px solid #e2e8f0;

  border-left: 3px solid #1e3a5f;

  border-radius: 0 2px 2px 0;

  background: #fafafa;

}

.rs-pdf .observacoes h4 {

  font-family: Georgia, "Times New Roman", serif;

  font-size: 1.05em;

  margin-bottom: 8px;

  font-weight: 700;

  color: #1e293b;

  letter-spacing: 0.04em;

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

  background: #1e293b;

  color: #f8fafc;

  font-weight: 600;

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

  border-radius: 2px;

  padding: 3px;

  background: #fff;

}



body.rs-pdf--detailed .pecas-table .imagem-col { width: 88px; }

body.rs-pdf--detailed .pecas-table .imagem-col img { max-width: 80px; max-height: 80px; }

body.rs-pdf--detailed .info-label { min-width: 115px; }

body.rs-pdf--detailed .info-item { gap: 8px; }



body.rs-pdf--compact .summary { gap: 6px; }

body.rs-pdf--compact .summary-card { padding: 7px 4px; }

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

  border-left: 2px solid #475569;

  border-radius: 0 2px 2px 0;

  font-size: 0.95em;

  color: #334155;

}



.rs-pdf .pdf-rs-footer {

  margin-top: 22px;

  padding-top: 14px;

  border-top: 1px solid #e2e8f0;

  font-size: 8px;

  color: #94a3b8;

  text-align: center;

  letter-spacing: 0.06em;

  text-transform: uppercase;

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


