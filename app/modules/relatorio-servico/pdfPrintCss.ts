/** CSS de impressão A4 do PDF de relatório de serviço. Sem I/O. */

import {
  PDF_DOCUMENT_LAYOUT_CSS,
  PDF_TABLE_CELL_BORDER,
} from '../pdf/documentLayout'

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

/* Hierarquia do Relatório de Serviço comum — alinhada ao especial; não afecta .rs-pdf--especial.
   Usar block (não flex): flex + break-inside:avoid no Chrome deixa a 1.ª página do PDF em branco. */
body.rs-pdf:not(.rs-pdf--especial) .rs-doc,
body.rs-pdf:not(.rs-pdf--especial) .rs-doc-flow {
  display: block;
  max-width: 100%;
  color: #1e293b;
  counter-reset: rs-sec;
}
body.rs-pdf:not(.rs-pdf--especial) .rs-doc-flow > .ns-pdf-header {
  margin-bottom: 14px;
}
body.rs-pdf:not(.rs-pdf--especial) .rs-doc-flow > .ns-pdf-meta {
  margin-bottom: 16px;
}
body.rs-pdf:not(.rs-pdf--especial) .rs-doc-flow > .info-section,
body.rs-pdf:not(.rs-pdf--especial) .rs-doc-flow > .report-section,
body.rs-pdf:not(.rs-pdf--especial) .rs-doc-flow > .observacoes,
body.rs-pdf:not(.rs-pdf--especial) .rs-doc-flow > .summary,
body.rs-pdf:not(.rs-pdf--especial) .rs-doc-flow > .rs-resumo-bloco,
body.rs-pdf:not(.rs-pdf--especial) .rs-doc-flow > .report-assinatura-cliente {
  margin-bottom: 22px;
}

${PDF_DOCUMENT_LAYOUT_CSS}

.ns-pdf-meta__equip-table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 12px;
  font-size: 0.92em;
}
.ns-pdf-meta__equip-table th,
.ns-pdf-meta__equip-table td {
  border: ${PDF_TABLE_CELL_BORDER};
  padding: 7px 8px;
  text-align: left;
  vertical-align: middle;
}
.ns-pdf-meta__equip-table th {
  background: #1e293b;
  color: #f8fafc;
  font-weight: 600;
  font-size: 0.82em;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}
.ns-pdf-meta__equip-table .ns-pdf-meta__equip-num {
  width: 52px;
  text-align: center;
  font-weight: 700;
  color: #1e3a5f;
}
.ns-pdf-meta__equip-table .ns-pdf-meta__equip-sn {
  min-width: 88px;
  font-family: Consolas, "Courier New", monospace;
  font-size: 0.95em;
}
.ns-pdf-meta__equip-table tbody tr:nth-child(even) td {
  background: #f8fafc;
}
.ns-pdf-meta--dark .ns-pdf-meta__equip-table th {
  background: #0f172a;
}
.ns-pdf-meta--dark .ns-pdf-meta__equip-table tbody tr:nth-child(even) td {
  background: #1e293b22;
}

/* Secções no estilo especial (.re-secao): barra escura + verde, sem caixa arredondada.
   break-inside:auto por defeito — avoid em secções grandes provoca página inicial em branco. */
body.rs-pdf:not(.rs-pdf--especial) .info-section,
body.rs-pdf:not(.rs-pdf--especial) .report-section {
  margin: 0 0 22px;
  padding: 0 0 4px;
  border: none;
  border-radius: 0;
  background: transparent;
  box-shadow: none;
  break-inside: auto;
  page-break-inside: auto;
}

body.rs-pdf:not(.rs-pdf--especial) .info-section h3,
body.rs-pdf:not(.rs-pdf--especial) .report-section h3,
body.rs-pdf:not(.rs-pdf--especial) .report-assinatura-cliente h3 {
  counter-increment: rs-sec;
  font-family: "Segoe UI", system-ui, -apple-system, Arial, sans-serif;
  font-size: 10px;
  margin: 0 0 10px;
  padding: 7px 10px;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: #f8fafc;
  background: #1e293b;
  border: none;
  border-bottom: 3px solid #0d7a3d;
  border-left: none;
  line-height: 1.3;
  border-radius: 0;
}

body.rs-pdf:not(.rs-pdf--especial) .info-section h3::before,
body.rs-pdf:not(.rs-pdf--especial) .report-section h3::before,
body.rs-pdf:not(.rs-pdf--especial) .report-assinatura-cliente h3::before {
  content: counter(rs-sec, decimal-leading-zero) ". ";
  color: #86efac;
  font-weight: 700;
  letter-spacing: 0;
}

/* fallback legado (fechamento / outros) — avoid só em ecrã; impressão trata abaixo */
.rs-pdf .info-section {
  margin-bottom: 16px;
}

.rs-pdf .info-section h3 {
  font-family: "Segoe UI", system-ui, -apple-system, Arial, sans-serif;
  font-size: 10px;
  margin: 0 0 10px;
  padding: 7px 10px;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: #f8fafc;
  background: #1e293b;
  border-bottom: 3px solid #0d7a3d;
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
  border: ${PDF_TABLE_CELL_BORDER};
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
.rs-pdf tfoot td,
.rs-pdf tr.rs-row-total td {
  background: #f1f5f9 !important;
  border-top: 1.5px solid #1e293b;
  font-weight: 700;
  color: #0f172a;
}
.rs-pdf tfoot td strong,
.rs-pdf tr.rs-row-total td strong {
  color: #0d7a3d;
}

/* Resumo KPI — faixa contínua como .re-kpi-strip do especial */
body.rs-pdf:not(.rs-pdf--especial) .rs-resumo-bloco {
  margin: 0 0 20px;
  padding: 0;
  border: none;
  border-radius: 0;
  background: transparent;
  break-inside: avoid;
  page-break-inside: avoid;
}
body.rs-pdf:not(.rs-pdf--especial) .rs-resumo-bloco > .summary {
  margin: 0;
}

.rs-pdf .summary {
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: 0;
  margin: 0;
  border: 1px solid #cbd5e1;
  background: #fff;
  break-inside: avoid;
  page-break-inside: avoid;
}
.rs-pdf .summary-card {
  border: none;
  border-right: 1px solid #e2e8f0;
  border-top: none;
  border-radius: 0;
  padding: 12px 8px 11px;
  text-align: left;
  background: #f8fafc;
  min-height: 0;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: flex-start;
  box-shadow: none;
}
.rs-pdf .summary-card:last-child {
  border-right: none;
}
.rs-pdf .summary-card--main {
  background: #fff;
}
.rs-pdf .summary-card h4,
.rs-pdf .summary-card .label {
  display: block;
  font-size: 7.5px;
  margin: 0 0 6px;
  font-weight: 700;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  line-height: 1.25;
  max-width: 100%;
}
.rs-pdf .summary-card .value {
  font-family: "Segoe UI", system-ui, -apple-system, Arial, sans-serif;
  font-size: 16px;
  font-weight: 700;
  color: #0f172a;
  line-height: 1.2;
  font-variant-numeric: tabular-nums lining-nums;
  letter-spacing: 0;
}
.rs-pdf .summary-card--main .value {
  color: #0d7a3d;
  font-size: 18px;
}
.rs-pdf .rs-resumo-valor,
.rs-resumo-valor {
  display: inline-flex;
  align-items: baseline;
  justify-content: center;
  flex-wrap: nowrap;
  gap: 0;
}
.rs-pdf .rs-resumo-num,
.rs-resumo-num {
  font-weight: 700;
  font-variant-numeric: tabular-nums lining-nums;
}
.rs-pdf .rs-resumo-sep,
.rs-resumo-sep {
  opacity: 0.45;
  font-weight: 600;
  padding: 0 1px;
}
.rs-pdf .rs-resumo-un,
.rs-resumo-un {
  font-size: 0.58em;
  font-weight: 600;
  color: #64748b;
  margin-left: 0.2em;
  letter-spacing: 0.03em;
  text-transform: lowercase;
}

.rs-pdf .resultados-grid,
.rs-pdf .report-resultados {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px 12px;
  margin: 4px 0 0;
}
.rs-pdf .resultado-item,
.rs-pdf .report-resultados > div {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 1em;
  color: #334155;
  padding: 7px 10px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 0;
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
  background: #0d7a3d;
  border-color: #0d7a3d;
}

.rs-pdf .observacoes {
  margin: 0 0 22px;
  padding: 0;
  border: none;
  border-radius: 0;
  background: transparent;
}
.rs-pdf .observacoes h4 {
  font-family: "Segoe UI", system-ui, -apple-system, Arial, sans-serif;
  font-size: 10px;
  margin: 0 0 10px;
  padding: 7px 10px;
  font-weight: 700;
  color: #f8fafc;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  background: #1e293b;
  border-bottom: 3px solid #0d7a3d;
}
.rs-pdf .observacoes p {
  font-size: 1em;
  white-space: pre-wrap;
  line-height: 1.55;
  color: #334155;
  padding: 8px 10px;
  border: 1px solid #cbd5e1;
  background: #f8fafc;
}

.rs-pdf .pecas-table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 12px;
  font-size: 1em;
}
.rs-pdf .pecas-table th, .rs-pdf .pecas-table td {
  border: ${PDF_TABLE_CELL_BORDER};
  padding: 8px 6px;
  text-align: left;
  vertical-align: middle;
}
.rs-pdf .pecas-table th {
  background: #1e293b;
  color: #f8fafc;
  font-weight: 600;
}
.rs-pdf .pecas-table .imagem-col { width: 76px; text-align: center; }
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

body.rs-pdf--compact .summary { gap: 0; }
body.rs-pdf--compact .summary-card { padding: 8px 5px; }
body.rs-pdf--compact .summary-card .value { font-size: 13px; }
body.rs-pdf--compact .summary-card--main .value { font-size: 14px; }
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

body.rs-pdf:not(.rs-pdf--especial) tr.rs-dia-desc td,
body.rs-pdf:not(.rs-pdf--especial) .rs-dia-desc-cell {
  text-align: left !important;
  padding: 8px 10px !important;
  font-size: 0.95em;
  line-height: 1.45;
  vertical-align: top;
  background: #f8fafc !important;
  border-color: #e2e8f0 !important;
  color: #334155;
}
body.rs-pdf:not(.rs-pdf--especial) .rs-dia-desc-label {
  font-weight: 700;
  color: #1e293b;
  margin-right: 4px;
}

body.rs-pdf:not(.rs-pdf--especial) .report-assinatura-cliente {
  margin: 0 0 22px;
  padding: 0 0 4px;
  border: none;
  border-radius: 0;
  background: transparent;
  break-inside: avoid;
  page-break-inside: avoid;
}
body.rs-pdf:not(.rs-pdf--especial) .report-assinatura-cliente__hint {
  font-size: 8.5px;
  color: #64748b;
  margin: 0 0 10px;
  padding: 0 2px;
  line-height: 1.45;
}
body.rs-pdf:not(.rs-pdf--especial) .report-assinatura-cliente__img {
  max-width: 280px;
  max-height: 100px;
  object-fit: contain;
  display: block;
  border-bottom: 1px solid #0f172a;
  padding-bottom: 4px;
  background: #fff;
}
body.rs-pdf:not(.rs-pdf--especial) .report-assinatura-cliente__linha {
  width: 280px;
  height: 70px;
  border-bottom: 2px solid #0f172a;
  margin-top: 8px;
}
body.rs-pdf:not(.rs-pdf--especial) .report-assinatura-cliente__data {
  font-size: 9px;
  color: #555;
  margin-top: 6px;
}

/* Meta do comum: título no mesmo idioma visual do especial (barra escura) */
body.rs-pdf:not(.rs-pdf--especial) .ns-pdf-meta {
  border-color: #cbd5e1;
  border-radius: 0;
}
body.rs-pdf:not(.rs-pdf--especial) .ns-pdf-meta__title {
  font-family: "Segoe UI", system-ui, -apple-system, Arial, sans-serif;
  padding: 7px 10px;
  font-size: 10px;
  letter-spacing: 0.1em;
  color: #f8fafc;
  background: #1e293b;
  border-bottom: 3px solid #0d7a3d;
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
  /* Comum: forçar fluxo em bloco e quebras normais — evita 1.ª página vazia no Chrome */
  body.rs-pdf:not(.rs-pdf--especial) .rs-doc,
  body.rs-pdf:not(.rs-pdf--especial) .rs-doc-flow {
    display: block !important;
  }
  body.rs-pdf:not(.rs-pdf--especial) .info-section,
  body.rs-pdf:not(.rs-pdf--especial) .report-section,
  body.rs-pdf:not(.rs-pdf--especial) .observacoes {
    break-inside: auto !important;
    page-break-inside: auto !important;
  }
  .rs-pdf .info-section,
  .rs-pdf .report-section {
    break-inside: auto;
    page-break-inside: auto;
  }
  .rs-pdf .summary,
  .rs-pdf .rs-resumo-bloco,
  .rs-pdf .report-assinatura-cliente {
    break-inside: avoid;
    page-break-inside: avoid;
  }
}
`.trim()
