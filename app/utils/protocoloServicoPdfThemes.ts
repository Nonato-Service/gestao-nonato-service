/**
 * Formatos visuais para impressão PDF dos Protocolos de Serviço (HTML → Imprimir / Guardar como PDF).
 * Cabeçalho único, alinhado como documento profissional; modelos diferem só em cor/accento e corpo.
 */

export const PROTOCOLO_SERVICO_PDF_MODELOS_MAX = 12

export function clampProtocoloPdfModelo(n: number | undefined): number {
  return Math.min(PROTOCOLO_SERVICO_PDF_MODELOS_MAX, Math.max(1, Number(n) || 1))
}

type HeaderOpts = {
  tituloProto: string
  dataDoc: string
  logoHtml: string
}

const PRINT_SAFE = `@page{size:A4;margin:12mm}@media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact;}}`

function logoOrName(logoHtml: string): string {
  return logoHtml || '<span class="logo-fallback">NONATO SERVICE</span>'
}

function escAttr(s: string): string {
  return String(s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/** Layout do cabeçalho: igual em todos os modelos (distribuição estável na impressão) */
const HDR_LAYOUT_CSS = `
.pdf-header.hdr-doc{margin:0 0 20px;padding:0;background:#fff;}
.hdr-table{width:100%;border-collapse:collapse;table-layout:fixed;margin:0;}
.hdr-table td{vertical-align:middle;padding:0;}
.hdr-td-logo{width:32%;padding:12px 16px 12px 0;border-right:1px solid #e2e8f8;box-sizing:border-box;}
.hdr-td-main{padding:12px 0 12px 20px;box-sizing:border-box;}
.hdr-logo-box{min-height:40px;display:flex;align-items:center;}
.hdr-logo-box img{max-height:40px;max-width:160px;width:auto;height:auto;object-fit:contain;display:block;}
.logo-fallback{font-family:'Segoe UI',system-ui,sans-serif;font-size:11px;font-weight:700;color:#475569;letter-spacing:0.06em;line-height:1.2;display:block;}
.hdr-empresa{margin:8px 0 0;font-size:7.5pt;font-weight:700;letter-spacing:0.2em;text-transform:uppercase;color:#94a3b8;line-height:1.35;}
.hdr-etiq{margin:0 0 3px;font-size:7.5pt;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#64748b;}
.hdr-titulo{margin:0;font-size:13.5pt;font-weight:700;color:#0f172a;line-height:1.28;letter-spacing:-0.015em;}
.hdr-data{margin:5px 0 0;font-size:9pt;color:#64748b;font-weight:500;}
.hdr-linha{height:2px;margin-top:12px;width:100%;clear:both;}
`

/** Por modelo: fundo suave na coluna do logo, cor da linha inferior e da divisória */
const HDR_VARIANT_CSS: string[] = [
  '.hdr-v1 .hdr-td-logo{background:#f7faf7;border-radius:6px 0 0 6px;padding-left:12px;border-right-color:#bbf7d0;}.hdr-v1 .hdr-linha{background:#15803d;}.hdr-v1 .hdr-etiq{color:#166534;}',
  '.hdr-v2 .hdr-td-logo{background:#f8fafc;border-radius:6px 0 0 6px;padding-left:12px;border-right-color:#bfdbfe;}.hdr-v2 .hdr-linha{background:#2563eb;}.hdr-v2 .hdr-titulo{color:#1e3a8a;}',
  '.hdr-v3 .hdr-td-logo{background:#fff7ed;border-radius:6px 0 0 6px;padding-left:12px;border-right-color:#fed7aa;}.hdr-v3 .hdr-linha{background:#c2410c;}.hdr-v3 .hdr-etiq{color:#9a3412;}',
  '.hdr-v4 .hdr-td-logo{background:#f0fdfa;border-radius:6px 0 0 6px;padding-left:12px;border-right-color:#99f6e4;}.hdr-v4 .hdr-linha{background:#0d9488;}.hdr-v4 .hdr-titulo{color:#115e59;}',
  '.hdr-v5 .hdr-td-logo{background:#f9fafb;border-radius:6px 0 0 6px;padding-left:12px;border-right-color:#d1d5db;}.hdr-v5 .hdr-linha{background:#374151;}.hdr-v5 .hdr-titulo{font-family:Consolas,ui-monospace,monospace;font-size:12.5pt;}',
  '.hdr-v6 .hdr-td-logo{background:#fffbeb;border-radius:6px 0 0 6px;padding-left:12px;border-right-color:#fde68a;}.hdr-v6 .hdr-linha{background:#b45309;}.hdr-v6 .hdr-titulo{font-family:Georgia,ui-serif,serif;color:#78350f;}',
  '.hdr-v7 .hdr-td-logo{background:#f1f5f9;border-radius:6px 0 0 6px;padding-left:12px;border-right-color:#cbd5e1;}.hdr-v7 .hdr-linha{background:#334155;}.hdr-v7 .hdr-etiq{color:#475569;}',
  '.hdr-v8 .hdr-td-logo{background:#fff;border-radius:0;padding-left:12px;border-right:2px solid #1e293b;}.hdr-v8 .hdr-linha{background:#1e293b;height:3px;}.hdr-v8 .hdr-table{outline:1px solid #cbd5e1;outline-offset:4px;}',
  '.hdr-v9 .hdr-td-logo{background:#eff6ff;border-radius:6px 0 0 6px;padding-left:12px;border-right-color:#93c5fd;}.hdr-v9 .hdr-linha{background:#1d4ed8;}.hdr-v9 .hdr-titulo{color:#1e40af;}',
  '.hdr-v10 .hdr-td-logo{background:#fafafa;border-radius:6px 0 0 6px;padding-left:12px;border-right-color:#d4d4d8;}.hdr-v10 .hdr-linha{background:linear-gradient(90deg,#a16207,#ca8a04,#a16207);height:3px;}.hdr-v10 .hdr-titulo{color:#18181b;}',
  '.hdr-v11 .hdr-td-logo{background:#eef2ff;border-radius:6px 0 0 6px;padding-left:12px;border-right-color:#c7d2fe;}.hdr-v11 .hdr-linha{background:#4f46e5;}.hdr-v11 .hdr-titulo{color:#312e81;}',
  '.hdr-v12 .hdr-td-logo{background:#f9fafb;border-radius:0;padding-left:12px;border-right-color:#9ca3af;}.hdr-v12 .hdr-linha{background:#111827;}.hdr-v12 .hdr-titulo,.hdr-v12 .hdr-data,.hdr-v12 .hdr-etiq,.hdr-v12 .hdr-empresa{font-family:Consolas,ui-monospace,monospace;}.hdr-v12 .hdr-titulo{font-size:12pt;}',
]

function buildHeaderHtml(variantIndex: number, o: HeaderOpts): string {
  const t = escAttr(o.tituloProto)
  const d = escAttr(o.dataDoc)
  const L = logoOrName(o.logoHtml)
  const v = variantIndex + 1
  return `<header class="pdf-header hdr-doc hdr-v${v}" role="banner"><table class="hdr-table" role="presentation"><tr><td class="hdr-td-logo"><div class="hdr-logo-box">${L}</div><p class="hdr-empresa">Nonato Service</p></td><td class="hdr-td-main"><p class="hdr-etiq">Protocolo de serviço</p><h1 class="hdr-titulo">${t}</h1><p class="hdr-data">Emitido em ${d}</p></td></tr></table><div class="hdr-linha" aria-hidden="true"></div></header>`
}

function buildHeaderFragments(o: HeaderOpts): string[] {
  return Array.from({ length: 12 }, (_, i) => buildHeaderHtml(i, o))
}

/** Estilos de blocos de texto / imagens no corpo */
export const PROTOCOLO_PDF_BLOCO_STYLES: string[] = [
  'margin:14px 0;padding:15px 18px;background:#f8fafc;border-radius:10px;border:1px solid #e2e8f0;color:#334155;font-size:11.5pt;line-height:1.5;',
  'margin:14px 0;padding:14px 16px;background:#f8fafc;border-radius:8px;border-left:4px solid #2563eb;color:#0f172a;font-size:11.5pt;line-height:1.5;',
  'margin:14px 0;padding:15px 17px;background:#fff;border-radius:10px;border:1px solid #cbd5e1;color:#1e293b;font-size:11.5pt;line-height:1.5;',
  'margin:14px 0;padding:16px 18px;background:#fff;border-radius:12px;border:1px solid #99f6e4;color:#134e4a;font-size:11.5pt;line-height:1.45;',
  'margin:14px 0;padding:12px 14px;background:#fafafa;border:1px dashed #64748b;border-radius:4px;font-family:Consolas,ui-monospace,monospace;font-size:10.5pt;line-height:1.55;color:#111827;',
  'margin:14px 0;padding:16px 18px;background:#fffbeb;border:1px solid #e7d5c4;border-radius:6px;font-family:Georgia,ui-serif,serif;font-size:11.5pt;line-height:1.55;color:#422006;',
  'margin:14px 0;padding:15px 18px;background:#f8fafc;border-radius:8px;border-left:5px solid #475569;color:#334155;font-size:11.5pt;line-height:1.5;',
  'margin:14px 0;padding:16px 20px;background:#fff;border:2px solid #1e293b;border-radius:2px;color:#0f172a;font-size:11.5pt;line-height:1.55;',
  'margin:14px 0;padding:15px 18px;background:#eff6ff;border-radius:12px;border:1px solid #bfdbfe;color:#1e3a5f;font-size:11.5pt;line-height:1.5;',
  'margin:14px 0;padding:16px 18px;background:#fafafa;border:1px solid #e4e4e7;border-radius:10px;color:#18181b;font-size:11.5pt;line-height:1.5;',
  'margin:14px 0;padding:14px 17px;background:#fff;border-radius:8px;border-left:6px solid #4f46e5;color:#1e1b4b;font-size:11.5pt;line-height:1.5;',
  'margin:14px 0;padding:13px 15px;background:#f9fafb;border:1px solid #d1d5db;border-radius:2px;font-family:ui-monospace,Consolas,monospace;font-size:10.5pt;line-height:1.55;color:#111827;',
]

export const PROTOCOLO_PDF_IMG_RADIUS: number[] = [8, 8, 8, 10, 4, 6, 8, 2, 10, 8, 8, 3]

/** CSS do corpo + secções (sem cabeçalho) */
const BODY_CSS: string[] = [
  `body{font-family:'Segoe UI',system-ui,sans-serif;margin:0;padding:0;color:#1e293b;font-size:11pt;line-height:1.45;background:#fff;}.body-wrap{padding:0 0 24px;}.sec{margin:16px 0;padding:16px 18px;background:#fff;border:1px solid #e2e8f0;border-radius:10px;}.sec-title{margin:0 0 12px;font-size:8.5pt;font-weight:700;letter-spacing:0.1em;color:#15803d;text-transform:uppercase;border-bottom:1px solid #e2e8f0;padding-bottom:8px;}.cl-table{width:100%;border-collapse:collapse;}.cl-table tr:not(:last-child){border-bottom:1px solid #f1f5f9;}.cl-table .cl-label{width:32%;padding:8px 12px 8px 0;vertical-align:top;font-weight:600;color:#64748b;font-size:8.5pt;text-transform:uppercase;letter-spacing:0.04em;}.cl-table .cl-value{padding:8px 0;color:#0f172a;font-size:10.5pt;}.texto-inicial{white-space:pre-wrap;margin:0;color:#334155;line-height:1.55;}.footer-bar{margin-top:22px;padding-top:14px;border-top:1px solid #e2e8f0;display:flex;justify-content:space-between;align-items:flex-end;flex-wrap:wrap;gap:10px;}.footer-date{font-size:9pt;color:#64748b;}.doc-ref{font-size:8pt;color:#94a3b8;font-family:Consolas,ui-monospace,monospace;}`,
  `body{font-family:'Segoe UI',system-ui,sans-serif;margin:0;padding:0;color:#0f172a;font-size:11pt;background:#fff;}.body-wrap{padding:0 0 24px;}.sec{margin:16px 0;padding:16px 18px;background:#fff;border:1px solid #e2e8f0;border-radius:8px;border-left:3px solid #2563eb;}.sec-title{margin:0 0 11px;font-size:8.5pt;font-weight:700;letter-spacing:0.08em;color:#1d4ed8;text-transform:uppercase;border-bottom:1px solid #e2e8f0;padding-bottom:8px;}.cl-table{width:100%;border-collapse:collapse;}.cl-table tr{border-bottom:1px solid #f1f5f9;}.cl-table .cl-label{width:30%;padding:8px 10px 8px 0;font-weight:600;color:#475569;font-size:8.5pt;text-transform:uppercase;}.cl-table .cl-value{color:#0f172a;font-size:10.5pt;}.texto-inicial{white-space:pre-wrap;margin:0;}.footer-bar{margin-top:20px;padding-top:12px;border-top:1px solid #e2e8f0;display:flex;justify-content:space-between;flex-wrap:wrap;}.footer-date{font-size:9pt;color:#64748b;}.doc-ref{font-size:8pt;color:#94a3b8;font-family:Consolas,monospace;}`,
  `body{font-family:'Segoe UI',system-ui,sans-serif;margin:0;padding:0;color:#1e293b;font-size:11pt;background:#fff;}.body-wrap{padding:0 0 24px;}.sec{margin:16px 0;padding:16px 18px;background:#fff;border:1px solid #cbd5e1;border-radius:8px;}.sec-title{margin:0 0 11px;font-size:8.5pt;font-weight:700;color:#c2410c;text-transform:uppercase;letter-spacing:0.07em;border-bottom:1px solid #fed7aa;padding-bottom:8px;}.cl-table .cl-label{width:28%;font-weight:600;color:#64748b;font-size:8.5pt;text-transform:uppercase;}.cl-table .cl-value{color:#0f172a;}.texto-inicial{white-space:pre-wrap;margin:0;}.footer-bar{margin-top:20px;padding-top:12px;border-top:1px solid #cbd5e1;display:flex;justify-content:space-between;flex-wrap:wrap;}.footer-date{font-size:9pt;color:#64748b;}.doc-ref{font-size:8pt;color:#94a3b8;font-family:Consolas,monospace;}`,
  `body{font-family:'Segoe UI',system-ui,sans-serif;margin:0;padding:0;color:#134e4a;font-size:11pt;background:#fff;}.body-wrap{padding:0 0 24px;}.sec{margin:16px 0;padding:16px 18px;background:#fff;border:1px solid #99f6e4;border-radius:10px;}.sec-title{margin:0 0 11px;font-size:8.5pt;font-weight:700;color:#0f766e;text-transform:uppercase;letter-spacing:0.08em;border-bottom:1px solid #ccfbf1;padding-bottom:8px;}.cl-table .cl-label{color:#0d9488;font-weight:600;width:30%;font-size:8.5pt;text-transform:uppercase;}.cl-table .cl-value{color:#134e4a;}.texto-inicial{white-space:pre-wrap;margin:0;}.footer-bar{margin-top:20px;padding-top:12px;border-top:1px solid #99f6e4;display:flex;justify-content:space-between;flex-wrap:wrap;}.footer-date{font-size:9pt;color:#0d9488;}.doc-ref{font-size:8pt;color:#64748b;font-family:Consolas,monospace;}`,
  `body{font-family:Consolas,ui-monospace,monospace;margin:0;padding:0;color:#111827;font-size:10.5pt;background:#fff;line-height:1.5;}.body-wrap{padding:0 0 20px;}.sec{margin:14px 0;padding:14px 16px;background:#fff;border:1px dashed #9ca3af;border-radius:2px;}.sec-title{margin:0 0 8px;color:#111827;font-size:8pt;font-weight:700;text-transform:uppercase;border-bottom:1px dashed #d1d5db;padding-bottom:6px;letter-spacing:0.06em;}.cl-table .cl-label{width:32%;font-weight:700;color:#4b5563;font-size:8pt;text-transform:uppercase;}.cl-table .cl-value{color:#111827;}.texto-inicial{white-space:pre-wrap;margin:0;}.footer-bar{margin-top:18px;padding-top:10px;border-top:1px dashed #6b7280;display:flex;justify-content:space-between;flex-wrap:wrap;}.footer-date{font-size:8.5pt;color:#6b7280;}.doc-ref{font-size:7.5pt;color:#9ca3af;}`,
  `body{font-family:Georgia,ui-serif,serif;margin:0;padding:0;color:#422006;font-size:11pt;background:#fff;}.body-wrap{padding:0 0 24px;}.sec{margin:16px 0;padding:16px 18px;background:#fffbf5;border:1px solid #e7d5c4;border-radius:2px;}.sec-title{margin:0 0 10px;color:#7f1d1d;font-size:8.5pt;font-weight:700;text-transform:uppercase;border-left:3px solid #ca8a04;padding-left:10px;letter-spacing:0.05em;}.cl-table .cl-label{width:30%;color:#78350f;font-weight:700;font-size:9pt;}.cl-table .cl-value{color:#422006;}.texto-inicial{white-space:pre-wrap;margin:0;line-height:1.55;}.footer-bar{margin-top:20px;padding-top:12px;border-top:1px solid #e7d5c4;display:flex;justify-content:space-between;flex-wrap:wrap;}.footer-date{font-size:9pt;color:#92400e;}.doc-ref{font-size:8pt;color:#a8a29e;}`,
  `body{font-family:'Segoe UI',system-ui,sans-serif;margin:0;padding:0;color:#334155;font-size:11pt;background:#fff;}.body-wrap{padding:0 0 24px;}.sec{margin:16px 0;padding:16px 18px;background:#fff;border:1px solid #e2e8f0;border-radius:8px;}.sec-title{margin:0 0 11px;font-size:8.5pt;font-weight:700;letter-spacing:0.09em;color:#475569;text-transform:uppercase;border-bottom:2px solid #e2e8f0;padding-bottom:8px;}.cl-table{width:100%;border-collapse:collapse;}.cl-table tr{border-bottom:1px solid #f1f5f9;}.cl-table .cl-label{width:32%;padding:8px 12px 8px 0;font-weight:600;color:#64748b;font-size:8.5pt;text-transform:uppercase;}.cl-table .cl-value{color:#0f172a;}.texto-inicial{white-space:pre-wrap;margin:0;line-height:1.55;}.footer-bar{margin-top:20px;padding-top:12px;border-top:1px solid #cbd5e1;display:flex;justify-content:space-between;flex-wrap:wrap;}.footer-date{font-size:9pt;color:#64748b;}.doc-ref{font-size:8pt;color:#94a3b8;font-family:Consolas,monospace;}`,
  `body{font-family:'Segoe UI',system-ui,sans-serif;margin:0;padding:0;color:#0f172a;font-size:11pt;background:#fff;}.body-wrap{padding:0 0 24px;}.sec{margin:16px 0;padding:16px 18px;background:#fafafa;border:1px solid #cbd5e1;border-radius:2px;}.sec-title{margin:0 0 10px;font-size:8.5pt;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:#334155;border-bottom:1px solid #94a3b8;padding-bottom:8px;}.cl-table .cl-label{width:32%;font-weight:600;font-size:8.5pt;color:#475569;text-transform:uppercase;}.cl-table .cl-value{color:#0f172a;}.texto-inicial{white-space:pre-wrap;margin:0;}.footer-bar{margin-top:20px;padding-top:12px;border-top:2px solid #1e293b;display:flex;justify-content:space-between;flex-wrap:wrap;}.footer-date{font-size:9pt;color:#64748b;}.doc-ref{font-size:8pt;color:#94a3b8;font-family:Consolas,monospace;}`,
  `body{font-family:'Segoe UI',system-ui,sans-serif;margin:0;padding:0;color:#1e3a5f;font-size:11pt;background:#fff;}.body-wrap{padding:0 0 24px;}.sec{margin:16px 0;padding:16px 18px;background:#fff;border:1px solid #bfdbfe;border-radius:10px;}.sec-title{margin:0 0 11px;color:#1d4ed8;font-size:8.5pt;font-weight:700;text-transform:uppercase;letter-spacing:0.07em;border-bottom:1px solid #bfdbfe;padding-bottom:8px;}.cl-table .cl-label{color:#3b82f6;font-weight:600;width:30%;font-size:8.5pt;text-transform:uppercase;}.cl-table .cl-value{color:#1e293b;}.texto-inicial{white-space:pre-wrap;margin:0;line-height:1.55;}.footer-bar{margin-top:20px;padding-top:12px;border-top:1px solid #bfdbfe;display:flex;justify-content:space-between;flex-wrap:wrap;}.footer-date{font-size:9pt;color:#64748b;}.doc-ref{font-size:8pt;color:#94a3b8;font-family:Consolas,monospace;}`,
  `body{font-family:'Segoe UI',system-ui,sans-serif;margin:0;padding:0;color:#18181b;font-size:11pt;background:#fff;}.body-wrap{padding:0 0 24px;}.sec{margin:16px 0;padding:16px 18px;background:#fff;border:1px solid #e4e4e7;border-radius:10px;}.sec-title{margin:0 0 11px;font-size:8.5pt;font-weight:700;text-transform:uppercase;letter-spacing:0.07em;padding-bottom:8px;border-bottom:1px solid #e4e4e7;color:#18181b;}.cl-table{width:100%;border-collapse:collapse;}.cl-table tr{border-bottom:1px solid #f4f4f5;}.cl-table .cl-label{width:32%;padding:8px 12px 8px 0;font-weight:600;font-size:8.5pt;text-transform:uppercase;color:#52525b;}.cl-table .cl-value{color:#18181b;}.texto-inicial{white-space:pre-wrap;margin:0;line-height:1.55;}.footer-bar{margin-top:20px;padding-top:12px;border-top:1px solid #d4d4d8;display:flex;justify-content:space-between;flex-wrap:wrap;}.footer-date{font-size:9pt;color:#52525b;}.doc-ref{font-size:8pt;color:#71717a;font-family:Consolas,monospace;}`,
  `body{font-family:'Segoe UI',system-ui,sans-serif;margin:0;padding:0;color:#312e81;font-size:11pt;background:#fff;}.body-wrap{padding:0 0 24px;}.sec{margin:16px 0;padding:16px 18px;background:#fff;border:1px solid #e0e7ff;border-radius:10px;}.sec-title{margin:0 0 11px;color:#4338ca;font-size:8.5pt;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;border-bottom:1px solid #e0e7ff;padding-bottom:8px;}.cl-table .cl-label{width:31%;font-weight:700;color:#6366f1;font-size:8.5pt;text-transform:uppercase;}.cl-table .cl-value{color:#1e1b4b;}.texto-inicial{white-space:pre-wrap;margin:0;line-height:1.55;}.footer-bar{margin-top:20px;padding-top:12px;border-top:1px solid #c7d2fe;display:flex;justify-content:space-between;flex-wrap:wrap;}.footer-date{font-size:9pt;color:#64748b;}.doc-ref{font-size:8pt;color:#94a3b8;font-family:Consolas,monospace;}`,
  `body{font-family:Consolas,ui-monospace,monospace;margin:0;padding:0;color:#111827;font-size:10.5pt;background:#fff;}.body-wrap{padding:0 0 22px;}.sec{margin:14px 0;padding:14px 16px;background:#f9fafb;border:1px solid #e5e7eb;border-left:3px solid #111827;}.sec-title{margin:0 0 9px;font-size:8pt;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:#111827;border-bottom:1px solid #d1d5db;padding-bottom:6px;}.cl-table .cl-label{width:30%;font-weight:700;color:#4b5563;font-size:7.5pt;text-transform:uppercase;}.cl-table .cl-value{color:#111827;}.texto-inicial{white-space:pre-wrap;margin:0;line-height:1.5;}.footer-bar{margin-top:18px;padding-top:10px;border-top:2px solid #111827;display:flex;justify-content:space-between;flex-wrap:wrap;}.footer-date{font-size:8.5pt;color:#6b7280;}.doc-ref{font-size:7.5pt;color:#9ca3af;}`,
]

function cssBlocks(): string[] {
  return BODY_CSS.map((body, i) => PRINT_SAFE + HDR_LAYOUT_CSS + HDR_VARIANT_CSS[i] + body)
}

let _cssCache: string[] | null = null
function getCssBlocks(): string[] {
  if (!_cssCache) _cssCache = cssBlocks()
  return _cssCache
}

export function buildProtocoloServicoPrintHtml(
  idx0: number,
  headerOpts: HeaderOpts,
  bodyInner: string
): string {
  const idx = Math.max(0, Math.min(11, idx0))
  const css = getCssBlocks()[idx]
  const header = buildHeaderFragments(headerOpts)[idx]
  const titleSafe = headerOpts.tituloProto.replace(/</g, '&lt;').replace(/>/g, '&gt;')
  return `<!DOCTYPE html><html lang="pt"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1"/><title>${titleSafe}</title><style>${css}</style></head><body>${header}<div class="body-wrap">${bodyInner}</div></body></html>`
}
