/**
 * Formatos visuais para impressão PDF dos Protocolos de Serviço (HTML → Imprimir / Guardar como PDF).
 * Cabeçalho único, alinhado como documento profissional; modelos diferem só em cor/accento e corpo.
 */

export const PROTOCOLO_SERVICO_PDF_MODELOS_MAX = 15
/** Modelo recomendado para novos protocolos — visual forte (navy + verde). */
export const PROTOCOLO_PDF_MODELO_PADRAO = 15

export function clampProtocoloPdfModelo(n: number | undefined): number {
  return Math.min(PROTOCOLO_SERVICO_PDF_MODELOS_MAX, Math.max(1, Number(n) || 1))
}

type HeaderOpts = {
  tituloProto: string
  dataDoc: string
  logoHtml: string
  clienteNome?: string
  equipamentoId?: string
  equipamentoModelo?: string
  equipamentoNumeroSerie?: string
  labels?: {
    cliente?: string
    idEquipamento?: string
    modelo?: string
    numeroSerie?: string
  }
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

/** Layout do cabeçalho v3 — sem logo; dados do cliente e equipamento em destaque */
const HDR_LAYOUT_CSS = `
.pdf-watermark{position:fixed;inset:0;z-index:99999;pointer-events:none;overflow:hidden;}
.pdf-watermark__tile{position:absolute;inset:-18%;background-repeat:repeat;background-size:min(42vw,320px) auto;background-position:center;opacity:0.05;transform:rotate(-32deg);-webkit-print-color-adjust:exact;print-color-adjust:exact;}
.pdf-watermark__hero{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;padding:8mm;box-sizing:border-box;}
.pdf-watermark__logo{width:min(96%,760px);height:min(92vh,980px);max-width:96%;max-height:92%;object-fit:contain;opacity:0.16;transform:rotate(-25deg);mix-blend-mode:multiply;-webkit-print-color-adjust:exact;print-color-adjust:exact;filter:saturate(1.05);}
.pdf-watermark__inner{display:flex;align-items:center;justify-content:center;transform:rotate(-25deg);width:min(96%,760px);opacity:0.16;font-size:clamp(28px,8vw,56px);font-weight:900;color:#14532d;letter-spacing:0.14em;text-align:center;line-height:1.2;mix-blend-mode:multiply;}
.pdf-page-content{position:relative;z-index:1;}
.pdf-header.hdr-pro{position:relative;z-index:1;}
body{position:relative;}
.pdf-header.hdr-pro{margin:0 0 22px;padding:0;background:#fff;border:2px solid #0f172a;border-radius:10px;overflow:hidden;box-sizing:border-box;box-shadow:0 4px 18px rgba(15,23,42,0.08);}
.hdr-pro__inner{display:flex;flex-direction:column;gap:14px;padding:18px 22px;box-sizing:border-box;width:100%;}
.hdr-pro__top{display:flex;flex-wrap:wrap;align-items:flex-start;justify-content:space-between;gap:12px 20px;width:100%;}
.hdr-pro__company-block{display:flex;flex-direction:column;gap:3px;min-width:0;}
.hdr-pro__company-name{font-size:11pt;font-weight:900;color:#0f172a;letter-spacing:0.04em;line-height:1.2;}
.hdr-pro__company-tag{font-size:7pt;font-weight:700;text-transform:uppercase;letter-spacing:0.14em;color:#64748b;line-height:1.3;}
.hdr-pro__doc-meta{display:flex;flex-direction:column;align-items:flex-end;gap:6px;text-align:right;min-width:0;}
.hdr-pro__kicker{margin:0;font-size:7.5pt;font-weight:800;text-transform:uppercase;letter-spacing:0.16em;color:#15803d;line-height:1.3;}
.hdr-pro__client-block{padding:12px 14px;border-radius:8px;border:1px solid #e2e8f0;background:linear-gradient(180deg,#f8fafc 0%,#f1f5f9 100%);box-sizing:border-box;}
.hdr-pro__client-label{display:block;margin:0 0 5px;font-size:7pt;font-weight:800;text-transform:uppercase;letter-spacing:0.12em;color:#64748b;line-height:1.2;}
.hdr-pro__cliente{margin:0;font-size:16pt;font-weight:800;color:#0f172a;line-height:1.25;letter-spacing:-0.02em;word-break:break-word;}
.hdr-pro__equip{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;margin:0;width:100%;}
.hdr-pro__equip--duo{grid-template-columns:repeat(2,minmax(0,1fr));}
.hdr-pro__equip--solo{grid-template-columns:1fr;}
.hdr-pro__equip-item{padding:8px 10px;border-radius:8px;border:1px solid #e2e8f0;background:#fff;box-sizing:border-box;min-width:0;}
.hdr-pro__equip-label{display:block;margin:0 0 4px;font-size:7pt;font-weight:800;text-transform:uppercase;letter-spacing:0.1em;color:#64748b;line-height:1.2;}
.hdr-pro__equip-value{display:block;margin:0;font-size:10pt;font-weight:700;color:#0f172a;line-height:1.35;word-break:break-word;}
.hdr-pro__meta{margin:0;display:flex;flex-wrap:wrap;align-items:center;justify-content:flex-end;gap:6px 14px;}
.hdr-pro__meta-chip{display:inline-flex;align-items:center;gap:6px;padding:5px 10px;border-radius:999px;border:1px solid #e2e8f0;background:#f8fafc;font-size:9pt;line-height:1.2;}
.hdr-pro__meta-label{font-size:7.5pt;font-weight:800;text-transform:uppercase;letter-spacing:0.08em;color:#64748b;}
.hdr-pro__meta-value{font-size:9.5pt;font-weight:700;color:#0f172a;}
.hdr-pro__accent{height:4px;background:linear-gradient(90deg,#14532d 0%,#22c55e 35%,#4ade80 50%,#22c55e 65%,#14532d 100%);border:0;margin:0;width:100%;}
@media print{.pdf-header.hdr-pro{break-inside:avoid;page-break-inside:avoid;}.pdf-watermark{position:fixed;inset:0;}.pdf-watermark__logo{opacity:0.13;}.pdf-watermark__tile{opacity:0.04;}.pdf-watermark__inner{opacity:0.13;}}
`

/** Por modelo: acentos de cor no cabeçalho v2 */
const HDR_VARIANT_CSS: string[] = [
  '.hdr-v1.hdr-pro .hdr-pro__kicker{color:#15803d;}.hdr-v1.hdr-pro .hdr-pro__accent{background:linear-gradient(90deg,#15803d,#22c55e,#15803d);}',
  '.hdr-v2.hdr-pro{border-color:#2563eb;}.hdr-v2.hdr-pro .hdr-pro__kicker{color:#1d4ed8;}.hdr-v2.hdr-pro .hdr-pro__accent{background:linear-gradient(90deg,#1d4ed8,#3b82f6,#1d4ed8);}',
  '.hdr-v3.hdr-pro{border-color:#ea580c;}.hdr-v3.hdr-pro .hdr-pro__kicker{color:#9a3412;}.hdr-v3.hdr-pro .hdr-pro__accent{background:linear-gradient(90deg,#9a3412,#ea580c,#9a3412);}',
  '.hdr-v4.hdr-pro{border-color:#0d9488;}.hdr-v4.hdr-pro .hdr-pro__kicker{color:#0f766e;}.hdr-v4.hdr-pro .hdr-pro__accent{background:linear-gradient(90deg,#0f766e,#14b8a6,#0f766e);}',
  '.hdr-v5.hdr-pro{border-color:#374151;}.hdr-v5.hdr-pro .hdr-pro__kicker{color:#374151;}.hdr-v5.hdr-pro .hdr-pro__cliente{font-family:Consolas,ui-monospace,monospace;font-size:14pt;}.hdr-v5.hdr-pro .hdr-pro__accent{background:#1f2937;}',
  '.hdr-v6.hdr-pro{border-color:#b45309;}.hdr-v6.hdr-pro .hdr-pro__kicker{color:#92400e;}.hdr-v6.hdr-pro .hdr-pro__cliente{font-family:Georgia,ui-serif,serif;color:#78350f;}.hdr-v6.hdr-pro .hdr-pro__accent{background:linear-gradient(90deg,#92400e,#d97706,#92400e);}',
  '.hdr-v7.hdr-pro{border-color:#475569;}.hdr-v7.hdr-pro .hdr-pro__kicker{color:#475569;}.hdr-v7.hdr-pro .hdr-pro__accent{background:#475569;}',
  '.hdr-v8.hdr-pro{border-width:2px;border-color:#1e293b;border-radius:8px;}.hdr-v8.hdr-pro .hdr-pro__accent{height:5px;background:#0f172a;}',
  '.hdr-v9.hdr-pro{border-color:#2563eb;}.hdr-v9.hdr-pro .hdr-pro__kicker{color:#1e40af;}.hdr-v9.hdr-pro .hdr-pro__accent{background:linear-gradient(90deg,#1e40af,#2563eb,#1e40af);}',
  '.hdr-v10.hdr-pro{border-color:#ca8a04;}.hdr-v10.hdr-pro .hdr-pro__kicker{color:#713f12;}.hdr-v10.hdr-pro .hdr-pro__accent{background:linear-gradient(90deg,#713f12,#ca8a04,#713f12);height:5px;}',
  '.hdr-v11.hdr-pro{border-color:#4f46e5;}.hdr-v11.hdr-pro .hdr-pro__kicker{color:#4338ca;}.hdr-v11.hdr-pro .hdr-pro__accent{background:linear-gradient(90deg,#3730a3,#6366f1,#3730a3);}',
  '.hdr-v12.hdr-pro{border-color:#111827;border-radius:4px;}.hdr-v12.hdr-pro .hdr-pro__kicker,.hdr-v12.hdr-pro .hdr-pro__cliente,.hdr-v12.hdr-pro .hdr-pro__equip-label,.hdr-v12.hdr-pro .hdr-pro__equip-value,.hdr-v12.hdr-pro .hdr-pro__meta-label,.hdr-v12.hdr-pro .hdr-pro__meta-value{font-family:Consolas,ui-monospace,monospace;}.hdr-v12.hdr-pro .hdr-pro__cliente{font-size:14pt;}.hdr-v12.hdr-pro .hdr-pro__accent{background:#111827;height:5px;}',
  '.hdr-v13.hdr-pro{border-color:#1e293b;box-shadow:0 6px 24px rgba(15,23,42,0.14);}.hdr-v13.hdr-pro .hdr-pro__kicker{color:#0f172a;}.hdr-v13.hdr-pro .hdr-pro__accent{background:linear-gradient(90deg,#92400e,#fbbf24,#92400e);height:5px;}',
  '.hdr-v14.hdr-pro{border-color:#e2e8f0;border-radius:12px;box-shadow:0 2px 10px rgba(15,23,42,0.06);}.hdr-v14.hdr-pro .hdr-pro__kicker{color:#0d9488;letter-spacing:0.18em;}.hdr-v14.hdr-pro .hdr-pro__accent{background:linear-gradient(90deg,#0f766e,#14b8a6,#0d9488);}',
  '.hdr-v15.hdr-pro{border-color:#0f172a;box-shadow:0 6px 22px rgba(21,128,61,0.12);}.hdr-v15.hdr-pro .hdr-pro__kicker{color:#14532d;}.hdr-v15.hdr-pro .hdr-pro__cliente{color:#0f172a;}.hdr-v15.hdr-pro .hdr-pro__accent{height:5px;background:linear-gradient(90deg,#14532d 0%,#22c55e 35%,#4ade80 50%,#22c55e 65%,#14532d 100%);}',
]

function buildEquipGridHtml(o: HeaderOpts): string {
  const L = o.labels || {}
  const items: Array<{ label: string; value: string }> = []
  const id = String(o.equipamentoId || '').trim()
  const modelo = String(o.equipamentoModelo || '').trim()
  const sn = String(o.equipamentoNumeroSerie || '').trim()
  if (id) items.push({ label: L.idEquipamento || 'ID', value: id })
  if (modelo) items.push({ label: L.modelo || 'Modelo', value: modelo })
  if (sn) items.push({ label: L.numeroSerie || 'Nº Série', value: sn })
  if (!items.length) return ''
  const gridClass = items.length === 1 ? ' hdr-pro__equip--solo' : items.length === 2 ? ' hdr-pro__equip--duo' : ''
  const cells = items
    .map(
      (it) =>
        `<div class="hdr-pro__equip-item"><span class="hdr-pro__equip-label">${escAttr(it.label)}</span><span class="hdr-pro__equip-value">${escAttr(it.value)}</span></div>`
    )
    .join('')
  return `<div class="hdr-pro__equip${gridClass}">${cells}</div>`
}

function buildHeaderHtml(variantIndex: number, o: HeaderOpts): string {
  const d = escAttr(o.dataDoc)
  const v = variantIndex + 1
  const cliente = String(o.clienteNome || '').trim()
  const clienteLabel = escAttr(o.labels?.cliente || 'Cliente')
  const clienteHtml = cliente
    ? `<p class="hdr-pro__cliente">${escAttr(cliente)}</p>`
    : `<p class="hdr-pro__cliente">—</p>`
  const equipHtml = buildEquipGridHtml(o)
  return `<header class="pdf-header hdr-pro hdr-v${v}" role="banner"><div class="hdr-pro__inner"><div class="hdr-pro__top"><div class="hdr-pro__company-block"><span class="hdr-pro__company-name">Nonato Service</span><span class="hdr-pro__company-tag">Assistência técnica</span></div><div class="hdr-pro__doc-meta"><p class="hdr-pro__kicker">Protocolo de serviço</p><div class="hdr-pro__meta"><span class="hdr-pro__meta-chip"><span class="hdr-pro__meta-label">Emitido em</span><span class="hdr-pro__meta-value">${d}</span></span></div></div></div><div class="hdr-pro__client-block"><span class="hdr-pro__client-label">${clienteLabel}</span>${clienteHtml}</div>${equipHtml}</div><div class="hdr-pro__accent" aria-hidden="true"></div></header>`
}

function extractImgSrcFromLogoHtml(logoHtml: string): string {
  const m = String(logoHtml || '').match(/\ssrc\s*=\s*(["'])([\s\S]*?)\1/i)
  return m?.[2]?.trim() || ''
}

function buildWatermarkLogoImg(logoHtml: string): string {
  const src = extractImgSrcFromLogoHtml(logoHtml)
  if (!src) return ''
  const safe = src.replace(/"/g, '&quot;')
  return `<img class="pdf-watermark__logo" src="${safe}" alt="Nonato Service" />`
}

function buildWatermarkHtml(logoHtml: string): string {
  const src = extractImgSrcFromLogoHtml(logoHtml)
  const logoImg = buildWatermarkLogoImg(logoHtml)
  const heroInner = logoImg || logoOrName(logoHtml)
  const tile = src
    ? `<div class="pdf-watermark__tile" style="background-image:url('${src.replace(/'/g, '%27')}')"></div>`
    : ''
  return `<div class="pdf-watermark" aria-hidden="true">${tile}<div class="pdf-watermark__hero">${heroInner}</div></div>`
}

function buildHeaderFragments(o: HeaderOpts): string[] {
  return Array.from({ length: PROTOCOLO_SERVICO_PDF_MODELOS_MAX }, (_, i) => buildHeaderHtml(i, o))
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
  /* 13 — blocos tipo relatório executivo */
  'margin:16px 0;padding:17px 20px;background:linear-gradient(180deg,#ffffff 0%,#f8fafc 100%);border-radius:12px;border:1px solid #e2e8f0;box-shadow:0 2px 8px rgba(15,23,42,0.05);color:#1e293b;font-size:11.5pt;line-height:1.55;border-left:4px solid #1e293b;',
  /* 14 — blocos clean com acento */
  'margin:16px 0;padding:18px 20px;background:#fff;border-radius:14px;border:1px solid #e2e8f0;box-shadow:0 1px 3px rgba(15,23,42,0.04);color:#334155;font-size:11.5pt;line-height:1.58;border-top:3px solid #14b8a6;',
  /* 15 — blocos impacto: borda forte + sombra verde */
  'margin:18px 0;padding:18px 22px;background:linear-gradient(180deg,#f0fdf4 0%,#ecfdf5 100%);border-radius:4px;border:2px solid #15803d;border-left:8px solid #22c55e;color:#0f172a;font-size:11.5pt;line-height:1.6;font-weight:500;box-shadow:0 3px 14px rgba(21,128,61,0.14);',
]

export const PROTOCOLO_PDF_IMG_RADIUS: number[] = [8, 8, 8, 10, 4, 6, 8, 2, 10, 8, 8, 3, 10, 12, 4]

/** Identificação no PDF: só nome do cliente + tabela do equipamento, pouco espaço vertical */
const COMPACT_IDENT_CSS =
  '.sec-ident-compact{margin:6px 0 12px;padding:10px 14px 12px;box-shadow:none;}.sec-ident-compact .sec-title-sub{margin:8px 0 4px;padding-bottom:4px;font-size:7.5pt;border-bottom-width:1px;}.proto-cliente-linha{margin:0 0 6px;padding:0;display:flex;flex-wrap:wrap;align-items:baseline;gap:4px 10px;line-height:1.3;}.proto-cliente-etq{font-size:7.5pt;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:#64748b;}.proto-cliente-nome{font-size:11.5pt;font-weight:700;color:#0f172a;}.cl-table-compact .cl-label{padding:3px 10px 3px 0;font-size:7.5pt;}.cl-table-compact .cl-value{padding:3px 0;font-size:10pt;}.cl-table-compact tr{border-bottom:1px solid #f1f5f9;}.proto-situacao-compact{margin:0;font-size:10.5pt;line-height:1.45;}'

/** Blocos de conteúdo PDF v2 — cartões de acção, galeria de imagens e estados legíveis */
export const PROTO_PDF_CONTENT_CSS = `
.proto-sec-titulo{margin:0 0 12px;font-size:9pt;font-weight:800;letter-spacing:0.12em;text-transform:uppercase;color:#0f172a;border-bottom:2px solid #22c55e;padding-bottom:8px;line-height:1.3;}
.proto-bloco-texto{margin:16px 0;padding:16px 18px;page-break-inside:avoid;}
.proto-img-sec{margin:18px 0;page-break-inside:avoid;}
.proto-img-gallery{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;padding:14px;border:2px solid #15803d;border-radius:8px;background:linear-gradient(180deg,#f8fafc 0%,#f1f5f9 100%);box-sizing:border-box;}
.proto-img-gallery--solo{grid-template-columns:1fr;}
.proto-img-gallery__cell{margin:0;padding:0;overflow:hidden;border-radius:6px;border:2px solid #94a3b8;background:#fff;min-height:260px;display:flex;align-items:center;justify-content:center;}
.proto-img-gallery__cell img{display:block;width:100%;height:100%;min-height:260px;max-height:380px;object-fit:contain;object-position:center;}
.proto-acao-card{margin:20px 0;border:2px solid #0f172a;border-radius:10px;overflow:hidden;page-break-inside:avoid;box-shadow:0 6px 22px rgba(15,23,42,0.1);background:#fff;}
.proto-acao-card__head{display:flex;flex-wrap:wrap;align-items:flex-start;justify-content:space-between;gap:12px;padding:14px 16px;background:linear-gradient(180deg,#f8fafc 0%,#eef2f7 100%);border-bottom:2px solid #cbd5e1;}
.proto-acao-card__titulo{margin:0;font-size:10pt;font-weight:900;text-transform:uppercase;letter-spacing:0.1em;color:#0f172a;flex:1 1 180px;line-height:1.35;}
.proto-acao-card__num{font-size:8pt;font-weight:800;color:#64748b;letter-spacing:0.14em;margin-right:8px;}
.proto-estado-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:6px;flex:1 1 300px;min-width:260px;}
.proto-estado{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:5px;padding:8px 4px;border:2px solid #cbd5e1;border-radius:8px;font-size:7.5pt;font-weight:800;text-transform:uppercase;letter-spacing:0.05em;color:#64748b;background:#fff;text-align:center;line-height:1.2;min-height:52px;box-sizing:border-box;}
.proto-estado__mark{width:18px;height:18px;border-radius:50%;border:2px solid #94a3b8;display:inline-flex;align-items:center;justify-content:center;font-size:10px;font-weight:900;line-height:1;color:transparent;background:#fff;flex-shrink:0;}
.proto-estado--active .proto-estado__mark{color:#fff;border-color:transparent;}
.proto-estado--bom.proto-estado--active{border-color:#15803d;background:#dcfce7;color:#14532d;}
.proto-estado--bom.proto-estado--active .proto-estado__mark{background:#16a34a;}
.proto-estado--reparar.proto-estado--active{border-color:#ea580c;background:#ffedd5;color:#9a3412;}
.proto-estado--reparar.proto-estado--active .proto-estado__mark{background:#ea580c;}
.proto-estado--substituir.proto-estado--active{border-color:#dc2626;background:#fee2e2;color:#991b1b;}
.proto-estado--substituir.proto-estado--active .proto-estado__mark{background:#dc2626;}
.proto-estado--nd.proto-estado--active{border-color:#475569;background:#f1f5f9;color:#334155;}
.proto-estado--nd.proto-estado--active .proto-estado__mark{background:#475569;}
.proto-acao-card__body{display:grid;grid-template-columns:1fr 1fr;gap:0;align-items:stretch;min-height:140px;}
.proto-acao-card__body--solo{grid-template-columns:1fr;}
.proto-acao-card__body--imgs-first .proto-acao-card__media{order:-1;}
.proto-acao-card__texto{padding:16px 18px;font-size:11pt;line-height:1.65;color:#1e293b;white-space:pre-wrap;border-right:1px solid #e2e8f0;box-sizing:border-box;display:flex;flex-direction:column;justify-content:flex-start;}
.proto-acao-card__body--solo .proto-acao-card__texto{border-right:none;}
.proto-acao-card__texto-label{margin:0 0 8px;font-size:7.5pt;font-weight:800;letter-spacing:0.14em;text-transform:uppercase;color:#64748b;}
.proto-acao-card__media{padding:12px;background:#f8fafc;border-left:1px solid #e2e8f0;box-sizing:border-box;display:flex;flex-direction:column;gap:10px;justify-content:center;}
.proto-acao-card__body--solo .proto-acao-card__media{border-left:none;}
.proto-acao-card__media-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px;width:100%;}
.proto-acao-card__media-grid--solo{grid-template-columns:1fr;}
.proto-acao-card__media-cell{margin:0;padding:0;border-radius:8px;border:2px solid #64748b;background:#fff;overflow:hidden;min-height:220px;display:flex;align-items:center;justify-content:center;}
.proto-acao-card__media-cell img{display:block;width:100%;height:100%;min-height:220px;max-height:340px;object-fit:contain;object-position:center;}
.proto-condicoes-equip{margin:24px 0 8px;padding:0;border:none;border-radius:0;background:transparent;box-shadow:none;page-break-inside:avoid;}
.proto-condicoes-equip .sec-title{margin:0 0 14px;font-size:9pt;font-weight:900;letter-spacing:0.14em;text-transform:uppercase;color:#0f172a;border-bottom:2px solid #22c55e;padding-bottom:8px;}
.proto-condicoes-card{border:2px solid #0f172a;border-radius:10px;overflow:hidden;background:#fff;box-shadow:0 4px 16px rgba(15,23,42,0.08);}
.proto-condicoes-table{width:100%;border-collapse:collapse;}
.proto-condicoes-table tr{border-bottom:1px solid #e2e8f0;}
.proto-condicoes-table tr:last-child{border-bottom:none;}
.proto-condicoes-label{width:42%;padding:14px 16px;font-size:8.5pt;font-weight:800;text-transform:uppercase;letter-spacing:0.08em;color:#64748b;background:#f8fafc;vertical-align:middle;line-height:1.35;}
.proto-condicoes-value{padding:14px 18px;font-size:11pt;font-weight:700;color:#0f172a;vertical-align:middle;line-height:1.4;}
.proto-condicoes-value--destaque{font-size:12pt;font-weight:800;color:#14532d;}
.proto-simnao{display:inline-flex;align-items:center;justify-content:center;min-width:52px;padding:6px 14px;border-radius:999px;font-size:9.5pt;font-weight:800;letter-spacing:0.04em;text-transform:uppercase;border:2px solid #cbd5e1;background:#f8fafc;color:#64748b;}
.proto-simnao--sim{border-color:#15803d;background:#dcfce7;color:#14532d;}
.proto-simnao--nao{border-color:#dc2626;background:#fee2e2;color:#991b1b;}
.proto-condicoes-obs{padding:14px 16px;border-top:1px solid #e2e8f0;background:#fafbfc;}
.proto-condicoes-obs-label{display:block;margin:0 0 6px;font-size:7.5pt;font-weight:800;text-transform:uppercase;letter-spacing:0.1em;color:#64748b;}
.proto-condicoes-obs-text{margin:0;font-size:10.5pt;line-height:1.55;color:#334155;white-space:pre-wrap;}
@media print{.proto-acao-card,.proto-img-sec,.proto-bloco-texto,.proto-condicoes-equip{break-inside:avoid;page-break-inside:avoid;}}
`

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
  /* 13 — corpo: secções com sombra suave, rótulos navy */
  `body{font-family:'Segoe UI',system-ui,sans-serif;margin:0;padding:0;color:#1e293b;font-size:11pt;line-height:1.5;background:#f8fafc;}.body-wrap{padding:0 0 28px;}.sec{margin:18px 0;padding:18px 20px;background:#fff;border:1px solid #e2e8f0;border-radius:14px;box-shadow:0 2px 12px rgba(15,23,42,0.06);}.sec-title{margin:0 0 14px;font-size:8pt;font-weight:800;letter-spacing:0.14em;color:#0f172a;text-transform:uppercase;border-bottom:2px solid #1e293b;padding-bottom:10px;}.cl-table{width:100%;border-collapse:collapse;}.cl-table tr{border-bottom:1px solid #f1f5f9;}.cl-table .cl-label{width:32%;padding:10px 14px 10px 0;font-weight:700;color:#475569;font-size:8pt;text-transform:uppercase;letter-spacing:0.05em;}.cl-table .cl-value{padding:10px 0;color:#0f172a;font-size:10.5pt;}.texto-inicial{white-space:pre-wrap;margin:0;color:#334155;line-height:1.62;}.footer-bar{margin-top:26px;padding-top:16px;border-top:1px solid #cbd5e1;display:flex;justify-content:space-between;align-items:flex-end;flex-wrap:wrap;gap:12px;}.footer-date{font-size:9pt;color:#475569;font-weight:500;}.doc-ref{font-size:8pt;color:#94a3b8;font-family:ui-monospace,Consolas,monospace;}`,
  /* 14 — corpo: espaçamento generoso, títulos teal */
  `body{font-family:'Segoe UI',system-ui,sans-serif;margin:0;padding:0;color:#334155;font-size:11pt;line-height:1.55;background:#fff;}.body-wrap{padding:0 0 28px;}.sec{margin:18px 0;padding:20px 22px;background:#fafbfc;border:1px solid #e2e8f0;border-radius:16px;}.sec-title{margin:0 0 14px;font-size:8pt;font-weight:800;letter-spacing:0.16em;color:#0f766e;text-transform:uppercase;padding-bottom:10px;border-bottom:1px solid #ccfbf1;}.cl-table{width:100%;border-collapse:separate;border-spacing:0;}.cl-table tr td{padding:11px 0;border-bottom:1px solid #f1f5f9;}.cl-table tr:last-child td{border-bottom:none;}.cl-table .cl-label{width:30%;font-weight:700;color:#0d9488;font-size:8pt;text-transform:uppercase;letter-spacing:0.06em;}.cl-table .cl-value{color:#1e293b;font-size:10.5pt;padding-left:8px;}.texto-inicial{white-space:pre-wrap;margin:0;color:#475569;line-height:1.65;}.footer-bar{margin-top:26px;padding-top:14px;border-top:1px solid #e2e8f0;display:flex;justify-content:space-between;flex-wrap:wrap;gap:10px;}.footer-date{font-size:9pt;color:#64748b;}.doc-ref{font-size:8pt;color:#94a3b8;font-family:Consolas,monospace;}`,
  /* 15 — corpo impacto: secções com moldura forte */
  `body{font-family:'Segoe UI',system-ui,sans-serif;margin:0;padding:0;color:#0f172a;font-size:11.5pt;line-height:1.55;background:#fff;}.body-wrap{padding:0 0 32px;}.sec{margin:20px 0;padding:20px 22px;background:#fff;border:2px solid #0f172a;border-radius:4px;box-shadow:0 4px 0 #22c55e,0 8px 24px rgba(15,23,42,0.08);}.sec-title{margin:0 0 14px;font-size:9pt;font-weight:900;letter-spacing:0.18em;color:#14532d;text-transform:uppercase;border-bottom:3px solid #22c55e;padding-bottom:10px;}.cl-table{width:100%;border-collapse:collapse;}.cl-table tr{border-bottom:1px solid #e2e8f0;}.cl-table .cl-label{width:32%;padding:10px 14px 10px 0;font-weight:800;color:#14532d;font-size:8pt;text-transform:uppercase;letter-spacing:0.07em;}.cl-table .cl-value{padding:10px 0;color:#0f172a;font-size:11pt;font-weight:600;}.texto-inicial{white-space:pre-wrap;margin:0;color:#1e293b;line-height:1.68;font-size:11.5pt;}.footer-bar{margin-top:28px;padding-top:16px;border-top:3px solid #0f172a;display:flex;justify-content:space-between;align-items:flex-end;flex-wrap:wrap;gap:12px;}.footer-date{font-size:9.5pt;font-weight:800;color:#14532d;letter-spacing:0.04em;}.doc-ref{font-size:8pt;font-weight:700;color:#64748b;font-family:Consolas,ui-monospace,monospace;letter-spacing:0.06em;}`,
]

function cssBlocks(): string[] {
  return BODY_CSS.map((body, i) => PRINT_SAFE + HDR_LAYOUT_CSS + HDR_VARIANT_CSS[i] + body + COMPACT_IDENT_CSS + PROTO_PDF_CONTENT_CSS)
}

let _cssCache: string[] | null = null
function getCssBlocks(): string[] {
  if (!_cssCache) _cssCache = cssBlocks()
  return _cssCache
}

/** Estilos inline dinâmicos (blocos, imagens, peças) conforme o modelo PDF. */
export function getProtocoloPdfDynamicStyles(idx0: number): {
  tituloBloco: string
  imgStyle: string
  quadroImagens: string
  balaoTexto: string
  pecasBox: string
} {
  const idx = Math.max(0, Math.min(PROTOCOLO_SERVICO_PDF_MODELOS_MAX - 1, idx0))
  const imgR = PROTOCOLO_PDF_IMG_RADIUS[idx] ?? 8
  const impacto = idx >= 12
  const maxImpacto = idx === 14
  if (maxImpacto) {
    return {
      tituloBloco:
        'margin:0 0 12px;font-size:10pt;font-weight:900;letter-spacing:0.16em;text-transform:uppercase;color:#14532d;border-bottom:3px solid #22c55e;padding-bottom:8px;',
      imgStyle: `max-width:320px;max-height:240px;object-fit:contain;border-radius:${imgR}px;border:3px solid #0f172a;box-shadow:0 6px 20px rgba(21,128,61,0.28);`,
      quadroImagens:
        'margin:10px 0;padding:16px 14px;border:3px solid #15803d;border-radius:4px;background:linear-gradient(180deg,#f0fdf4 0%,#ecfdf5 100%);box-sizing:border-box;',
      balaoTexto:
        'margin:10px 0;padding:16px 20px;border-radius:4px;background:#fff;border:2px solid #0f172a;border-left:8px solid #22c55e;box-shadow:0 4px 12px rgba(15,23,42,0.1);color:#0f172a;font-size:11.5pt;line-height:1.6;font-weight:500;',
      pecasBox:
        'margin-top:20px;padding:16px 18px;border-radius:4px;font-size:11px;line-height:1.55;background:#0f172a;border:2px solid #22c55e;color:#ecfdf5;',
    }
  }
  if (impacto) {
    return {
      tituloBloco:
        'margin:0 0 10px;font-size:9.5pt;font-weight:800;letter-spacing:0.12em;text-transform:uppercase;color:#0f172a;border-bottom:2px solid #1e293b;padding-bottom:7px;',
      imgStyle: `max-width:300px;max-height:220px;object-fit:contain;border-radius:${imgR}px;box-shadow:0 4px 16px rgba(15,23,42,0.18);border:2px solid #334155;`,
      quadroImagens:
        'margin:8px 0;padding:14px 12px;border:2px solid #475569;border-radius:10px;background:#f8fafc;box-sizing:border-box;',
      balaoTexto:
        'margin:8px 0;padding:15px 18px;border-radius:12px;background:#fff;border:1px solid #cbd5e1;box-shadow:0 3px 16px rgba(15,23,42,0.08);color:#1e293b;font-size:11.5pt;line-height:1.58;',
      pecasBox:
        'margin-top:18px;padding:14px 16px;border-radius:10px;font-size:11px;line-height:1.5;background:#f1f5f9;border:2px solid #334155;',
    }
  }
  return {
    tituloBloco:
      'margin:0 0 10px;font-size:9pt;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#475569;border-bottom:1px solid #e2e8f0;padding-bottom:6px;',
    imgStyle: `max-width:300px;max-height:220px;object-fit:contain;border-radius:${imgR}px;box-shadow:0 2px 12px rgba(15,23,42,0.12);border:1px solid rgba(0,0,0,0.06);`,
    quadroImagens:
      'margin:8px 0;padding:14px 12px;border:2px dashed #94a3b8;border-radius:14px;background:#f8fafc;box-sizing:border-box;',
    balaoTexto:
      'margin:8px 0;padding:15px 18px;border-radius:22px;background:linear-gradient(180deg,#ffffff 0%,#f1f5f9 100%);border:1px solid #e2e8f0;box-shadow:0 2px 14px rgba(15,23,42,0.07);color:#334155;font-size:11.5pt;line-height:1.55;',
    pecasBox:
      'margin-top:18px;padding:14px 16px;border-radius:10px;font-size:11px;line-height:1.5;background:rgba(241,245,249,0.9);border:1px solid #e2e8f0;',
  }
}

export function buildProtocoloServicoPrintHtml(
  idx0: number,
  headerOpts: HeaderOpts,
  bodyInner: string
): string {
  const idx = Math.max(0, Math.min(PROTOCOLO_SERVICO_PDF_MODELOS_MAX - 1, idx0))
  const css = getCssBlocks()[idx]
  const header = buildHeaderFragments(headerOpts)[idx]
  const watermark = buildWatermarkHtml(headerOpts.logoHtml)
  const titleSafe = headerOpts.tituloProto.replace(/</g, '&lt;').replace(/>/g, '&gt;')
  return `<!DOCTYPE html><html lang="pt"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1"/><title>${titleSafe}</title><style>${css}</style></head><body class="pdf-has-watermark">${header}<div class="body-wrap pdf-page-content">${bodyInner}</div>${watermark}</body></html>`
}
