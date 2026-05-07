/**
 * Estilos de impressão / PDF para relatórios de serviço (A4).
 * Usado pelos modelos Clássico, Detalhado e Compacto — variante via classe no <body>.
 */
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

.rs-pdf .header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
  padding-bottom: 14px;
  border-bottom: 3px solid #166534;
}
.rs-pdf .header-logo { font-size: 15px; font-weight: 800; letter-spacing: 0.04em; color: #14532d; }
.rs-pdf .header-logo img { max-height: 52px; max-width: 200px; object-fit: contain; display: block; }
.rs-pdf .header-title {
  font-size: 13px;
  font-weight: 800;
  text-align: center;
  flex: 1;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: #0f172a;
  line-height: 1.25;
}
.rs-pdf .header-number {
  font-size: 11px;
  font-weight: 800;
  color: #14532d;
  white-space: nowrap;
  padding: 6px 10px;
  border: 1px solid #bbf7d0;
  border-radius: 8px;
  background: #f0fdf4;
}

.rs-pdf .info-section {
  margin-bottom: 14px;
  padding: 14px 14px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  background: #fafafa;
  box-shadow: 0 1px 3px rgba(15, 23, 42, 0.06);
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

/* Compacto: cabeçalho em coluna (h2 / p) em vez de .header-title / .header-number */
body.rs-pdf--compact .header {
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 6px;
}
body.rs-pdf--compact .header h2 {
  margin: 0;
  font-size: 12px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: #15803d;
  line-height: 1.25;
}
body.rs-pdf--compact .header p {
  margin: 0;
  font-size: 9px;
  font-weight: 700;
  color: #334155;
}

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
}
`.trim()
