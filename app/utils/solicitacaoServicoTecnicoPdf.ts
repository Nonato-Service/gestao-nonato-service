/**
 * PDF / impressão — Solicitação de Serviço Técnico (documento para o cliente assinar e devolver).
 */

export type SolicitacaoServicoTecnicoPdfData = {
  id: string
  nomeCliente: string
  tipoEquipamento: string
  marca: string
  modelo: string
  numeroSerie: string
  problemasApresentados: string
  endereco: string
  telefone: string
  responsavel: string
  dataCriacao: string
}

export type SolicitacaoServicoTecnicoPdfLabels = {
  docTitle: string
  docSubtitle: string
  emitidoEmLabel: string
  emitidoEmValue: string
  refLabel: string
  refValue: string
  secDados: string
  nomeCliente: string
  tipoEquipamento: string
  marca: string
  modelo: string
  numeroSerie: string
  problemas: string
  endereco: string
  telefone: string
  responsavel: string
  secAssinatura: string
  textoLegal: string
  zonaAssinar: string
  nomeLegivel: string
  localData: string
  rodape: string
}

function esc(s: string): string {
  return String(s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function row(label: string, value: string): string {
  return `<tr><td class="sl-label">${esc(label)}</td><td class="sl-val">${esc(value)}</td></tr>`
}

export function buildSolicitacaoServicoTecnicoPrintHtml(
  d: SolicitacaoServicoTecnicoPdfData,
  L: SolicitacaoServicoTecnicoPdfLabels,
  logoHtml: string
): string {
  const logo = logoHtml || '<span class="sl-fallback">NONATO SERVICE</span>'
  const titleSafe = esc(L.docTitle)

  const css = `@page{size:A4;margin:14mm}
@media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact;}}
*{box-sizing:border-box}
body{margin:0;padding:0;font-family:'Segoe UI',system-ui,sans-serif;font-size:10.5pt;color:#0f172a;background:#fff;line-height:1.45}
.sl-wrap{max-width:720px;margin:0 auto;padding:0 4px}
.sl-header{display:flex;align-items:flex-start;justify-content:space-between;gap:16px;padding-bottom:14px;border-bottom:3px solid #0f766e;margin-bottom:18px}
.sl-logo{flex-shrink:0}
.sl-head-text{flex:1;min-width:0}
.sl-doc-pill{display:inline-block;font-size:7.5pt;font-weight:800;letter-spacing:0.14em;text-transform:uppercase;color:#0f766e;background:#ecfdf5;border:1px solid #99f6e4;padding:5px 12px;border-radius:999px;margin-bottom:8px}
.sl-title{margin:0;font-size:17pt;font-weight:800;letter-spacing:-0.02em;color:#0f172a;line-height:1.15}
.sl-sub{margin:8px 0 0;font-size:9.5pt;color:#64748b;line-height:1.4}
.sl-meta{display:flex;flex-wrap:wrap;gap:10px 18px;margin-top:10px;font-size:9pt;color:#475569}
.sl-meta strong{color:#0f172a;font-weight:700}
.sl-sec{margin:0 0 16px}
.sl-sec h2{margin:0 0 10px;font-size:8.5pt;font-weight:800;letter-spacing:0.12em;text-transform:uppercase;color:#0f766e;border-bottom:1px solid #ccfbf1;padding-bottom:8px}
.sl-table{width:100%;border-collapse:collapse}
.sl-table tr{border-bottom:1px solid #f1f5f9}
.sl-table tr:last-child{border-bottom:none}
.sl-label{width:34%;padding:9px 12px 9px 0;vertical-align:top;font-weight:700;font-size:8pt;text-transform:uppercase;letter-spacing:0.05em;color:#475569}
.sl-val{padding:9px 0;color:#0f172a;font-size:10.5pt;white-space:pre-wrap}
.sl-legal{margin:14px 0 16px;padding:14px 16px;background:#f8fafc;border:1px solid #e2e8f0;border-left:4px solid #0f766e;border-radius:10px;font-size:9.5pt;color:#334155;line-height:1.55}
.sl-sign-box{margin-top:8px;padding:14px 16px;border:2px dashed #94a3b8;border-radius:12px;background:#fafbfc}
.sl-sign-hint{font-size:8.5pt;color:#64748b;margin:0 0 10px;font-weight:600}
.sl-sign-area{min-height:100px;border:1px solid #cbd5e1;border-radius:8px;background:#fff;margin-bottom:14px}
.sl-lines{display:grid;gap:10px;margin-top:12px}
.sl-line{display:flex;align-items:flex-end;gap:8px;font-size:9.5pt;color:#334155}
.sl-line span{flex:1;border-bottom:1px solid #334155;min-height:22px}
.sl-footer{margin-top:22px;padding-top:12px;border-top:1px solid #e2e8f0;font-size:8.5pt;color:#64748b;text-align:center}
.sl-fallback{font-weight:800;letter-spacing:0.12em;color:#0f766e;font-size:11px}`

  const body = `<div class="sl-wrap">
<header class="sl-header">
  <div class="sl-logo">${logo}</div>
  <div class="sl-head-text">
    <div class="sl-doc-pill">${esc(L.docSubtitle)}</div>
    <h1 class="sl-title">${titleSafe}</h1>
    <div class="sl-meta">
      <span><strong>${esc(L.emitidoEmLabel)}</strong> ${esc(L.emitidoEmValue)}</span>
      <span><strong>${esc(L.refLabel)}</strong> ${esc(L.refValue)}</span>
    </div>
  </div>
</header>

<section class="sl-sec">
  <h2>${esc(L.secDados)}</h2>
  <table class="sl-table" role="presentation">
    ${row(L.nomeCliente, d.nomeCliente)}
    ${row(L.tipoEquipamento, d.tipoEquipamento)}
    ${row(L.marca, d.marca)}
    ${row(L.modelo, d.modelo)}
    ${row(L.numeroSerie, d.numeroSerie)}
    ${row(L.problemas, d.problemasApresentados)}
    ${row(L.endereco, d.endereco)}
    ${row(L.telefone, d.telefone)}
    ${row(L.responsavel, d.responsavel)}
  </table>
</section>

<p class="sl-legal">${esc(L.textoLegal)}</p>

<section class="sl-sec">
  <h2>${esc(L.secAssinatura)}</h2>
  <div class="sl-sign-box">
    <p class="sl-sign-hint">${esc(L.zonaAssinar)}</p>
    <div class="sl-sign-area" aria-hidden="true"></div>
    <div class="sl-lines">
      <div class="sl-line"><span></span><span style="flex:0 0 auto;padding-left:8px;font-weight:600">${esc(L.nomeLegivel)}</span></div>
      <div class="sl-line"><span></span><span style="flex:0 0 auto;padding-left:8px;font-weight:600">${esc(L.localData)}</span></div>
    </div>
  </div>
</section>

<footer class="sl-footer">${esc(L.rodape)}</footer>
</div>`

  return `<!DOCTYPE html><html lang="pt"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1"/><title>${titleSafe}</title><style>${css}</style></head><body>${body}</body></html>`
}
