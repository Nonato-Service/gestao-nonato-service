export type OrcamentoPecasEspeciaisLinhaPdf = {
  pos: number
  numeroArtigo: string
  quantidade: string
  precoUnitario: string
  precoTotal: string
  titulo: string
  descricao?: string
  infoExtra?: string
}

export type OrcamentoPecasEspeciaisPdfData = {
  numeroOferta: string
  dataIso: string
  clienteNome: string
  clienteMorada?: string
  clienteCodigo?: string
  contactoNome?: string
  contactoTelefone?: string
  contactoEmail?: string
  linhas: OrcamentoPecasEspeciaisLinhaPdf[]
  linhaEmbalagemTitulo?: string
  linhaEmbalagemDescricao?: string
  totalLiquido: string
  condicoesPagamento?: string
  notasRodape?: string
  logoHtml?: string
  labels?: Record<string, string | undefined>
  preview?: boolean
}

function esc(s: string): string {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function fmtData(iso: string): string {
  try {
    const d = new Date(iso.includes('T') ? iso : `${iso}T12:00:00`)
    return d.toLocaleDateString('pt-PT')
  } catch {
    return iso
  }
}

function blocoLinha(l: OrcamentoPecasEspeciaisLinhaPdf): string {
  const extras: string[] = []
  if (l.descricao?.trim()) extras.push(`<div class="item-desc">${esc(l.descricao).replace(/\n/g, '<br/>')}</div>`)
  if (l.infoExtra?.trim()) {
    extras.push(
      `<div class="item-extra"><strong>Mais informação:</strong><br/>${esc(l.infoExtra).replace(/\n/g, '<br/>')}</div>`
    )
  }
  return `<tr class="item-row">
    <td class="c-pos">${l.pos}</td>
    <td class="c-art">${esc(l.numeroArtigo || '—')}</td>
    <td class="c-qty">${esc(l.quantidade || '1')}</td>
    <td class="c-unit">${esc(l.precoUnitario || '—')}</td>
    <td class="c-total">${esc(l.precoTotal || '—')}</td>
  </tr>
  <tr class="item-detail-row"><td colspan="5">
    <div class="item-title">${esc(l.titulo || '—')}</div>
    ${extras.join('')}
  </td></tr>`
}

export function buildOrcamentoPecasEspeciaisPdfHtml(data: OrcamentoPecasEspeciaisPdfData): string {
  const L = data.labels || {}
  const titulo = L.titulo || 'Orçamento de peças especiais'
  const linhasHtml = data.linhas.map(blocoLinha).join('')
  const embalagem =
    data.linhaEmbalagemTitulo?.trim() || data.linhaEmbalagemDescricao?.trim()
      ? `<div class="ship-block">
      <h4>${esc(data.linhaEmbalagemTitulo || L.embalagemTitulo || 'Embalagem e envio')}</h4>
      <div class="ship-text">${esc(data.linhaEmbalagemDescricao || '').replace(/\n/g, '<br/>')}</div>
    </div>`
      : ''

  const previewBanner = data.preview
    ? `<div class="preview-banner">${esc(L.previewBanner || 'Pré-visualização — confira os dados antes de imprimir')}</div>`
    : ''

  const moradaCliente = [data.clienteNome, data.clienteMorada].filter(Boolean).join('<br/>')

  return `<!DOCTYPE html>
<html lang="pt-PT">
<head>
  <meta charset="UTF-8" />
  <title>${esc(titulo)} — ${esc(data.numeroOferta)}</title>
  <style>
    @page { size: A4 portrait; margin: 12mm; }
    @media print { .no-print { display: none !important; } }
    * { box-sizing: border-box; }
    body { font-family: "Segoe UI", Arial, sans-serif; margin: 0; padding: 18px; color: #111; font-size: 11px; line-height: 1.4; }
    .preview-banner { background: #fff8e1; border: 2px dashed #f59e0b; color: #92400e; padding: 10px; margin-bottom: 16px; border-radius: 8px; font-weight: 600; text-align: center; }
    .header { display: flex; justify-content: space-between; gap: 16px; align-items: flex-start; margin-bottom: 18px; padding-bottom: 12px; border-bottom: 2px solid #166534; }
    .header-logo { flex: 0 0 auto; max-width: 180px; }
    .header-logo img { max-width: 100%; max-height: 72px; object-fit: contain; }
    .header-offer { text-align: right; flex: 1; min-width: 0; }
    .header-offer h1 { margin: 0 0 6px; font-size: 20px; color: #14532d; }
    .header-offer .meta { font-size: 12px; color: #334155; line-height: 1.5; }
    .client-block { margin-bottom: 16px; padding: 10px 12px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; }
    .contact-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px; margin-bottom: 14px; font-size: 11px; }
    .contact-grid div { background: #f1f5f9; padding: 8px; border-radius: 4px; }
    .contact-grid strong { display: block; font-size: 10px; text-transform: uppercase; color: #64748b; margin-bottom: 3px; }
    table.items { width: 100%; border-collapse: collapse; margin-bottom: 12px; }
    table.items th { background: #ecfdf5; color: #14532d; font-size: 10px; text-transform: uppercase; padding: 8px 6px; border: 1px solid #cbd5e1; text-align: left; }
    table.items td { border: 1px solid #e2e8f0; padding: 6px; vertical-align: top; }
    .item-detail-row td { background: #fafafa; border-top: none; padding-top: 0; }
    .item-title { font-weight: 700; margin: 4px 0 6px; font-size: 12px; }
    .item-desc, .item-extra { font-size: 10px; color: #334155; margin-bottom: 6px; white-space: pre-wrap; }
    .c-pos { width: 32px; text-align: center; }
    .c-qty { width: 48px; text-align: center; }
    .c-unit, .c-total { width: 88px; text-align: right; white-space: nowrap; }
    .summary { margin-top: 16px; padding: 12px; background: #f0fdf4; border: 1px solid #86efac; border-radius: 6px; }
    .summary-row { display: flex; justify-content: space-between; font-size: 14px; font-weight: 700; color: #14532d; }
    .ship-block { margin: 14px 0; padding: 10px 12px; border: 1px dashed #94a3b8; border-radius: 6px; }
    .ship-block h4 { margin: 0 0 6px; font-size: 12px; color: #0f172a; }
    .ship-text { font-size: 10px; white-space: pre-wrap; color: #334155; }
    .terms { margin-top: 14px; font-size: 10px; color: #475569; white-space: pre-wrap; }
    .actions { margin-top: 20px; display: flex; gap: 10px; flex-wrap: wrap; }
    .btn-print { background: #166534; color: #fff; border: none; padding: 10px 18px; border-radius: 8px; cursor: pointer; font-weight: 600; }
    .btn-close { background: #64748b; color: #fff; border: none; padding: 10px 18px; border-radius: 8px; cursor: pointer; }
    @media (max-width: 640px) {
      .header { flex-direction: column; }
      .header-offer { text-align: left; }
      .contact-grid { grid-template-columns: 1fr; }
    }
  </style>
</head>
<body>
  ${previewBanner}
  <div class="header">
    <div class="header-logo">${data.logoHtml || ''}</div>
    <div class="header-offer">
      <h1>${esc(L.ofertaLabel || 'Oferta')} ${esc(data.numeroOferta)}</h1>
      <div class="meta">
        <div>${esc(L.dataLabel || 'Data')}: ${esc(fmtData(data.dataIso))}</div>
        <div>${esc(L.codClienteLabel || 'Cod. cliente')}: ${esc(data.clienteCodigo || '—')}</div>
      </div>
    </div>
  </div>
  <div class="client-block">${moradaCliente || '—'}</div>
  <div class="contact-grid">
    <div><strong>${esc(L.contactoLabel || 'Pessoa de contacto')}</strong>${esc(data.contactoNome || '—')}</div>
    <div><strong>${esc(L.telefoneLabel || 'Telefone')}</strong>${esc(data.contactoTelefone || '—')}</div>
    <div><strong>${esc(L.emailLabel || 'E-mail')}</strong>${esc(data.contactoEmail || '—')}</div>
  </div>
  <table class="items">
    <thead>
      <tr>
        <th>${esc(L.colPos || 'Pos.')}</th>
        <th>${esc(L.colArtigo || 'N.º artigo')}</th>
        <th>${esc(L.colQtd || 'Qtd.')}</th>
        <th>${esc(L.colUnit || 'Preço unit.')}</th>
        <th>${esc(L.colTotal || 'Preço EUR')}</th>
      </tr>
    </thead>
    <tbody>${linhasHtml || `<tr><td colspan="5" style="text-align:center;color:#64748b;">—</td></tr>`}</tbody>
  </table>
  ${embalagem}
  <div class="summary">
    <div class="summary-row">
      <span>${esc(L.totalLiquidoLabel || 'Total EUR líquido')}</span>
      <span>${esc(data.totalLiquido || '—')}</span>
    </div>
  </div>
  ${
    data.condicoesPagamento?.trim()
      ? `<div class="terms"><strong>${esc(L.condicoesPagamentoLabel || 'Condições de pagamento')}:</strong><br/>${esc(data.condicoesPagamento).replace(/\n/g, '<br/>')}</div>`
      : ''
  }
  ${
    data.notasRodape?.trim()
      ? `<div class="terms">${esc(data.notasRodape).replace(/\n/g, '<br/>')}</div>`
      : ''
  }
  <div class="actions no-print">
    <button type="button" class="btn-print" onclick="window.print()">🖨️ ${esc(L.imprimir || 'Imprimir / Guardar PDF')}</button>
    <button type="button" class="btn-close" onclick="window.close()">${esc(L.fechar || 'Fechar')}</button>
  </div>
</body>
</html>`
}

export function openOrcamentoPecasEspeciaisPdf(data: OrcamentoPecasEspeciaisPdfData): boolean {
  if (typeof window === 'undefined') return false
  const w = window.open('', '_blank')
  if (!w) {
    alert('Permita pop-ups para ver o orçamento em PDF.')
    return false
  }
  w.document.write(buildOrcamentoPecasEspeciaisPdfHtml(data))
  w.document.close()
  w.document.title = `${data.labels?.titulo || 'Orçamento'} — ${data.numeroOferta}`
  return true
}

export function gerarNumeroOfertaPecasEspeciais(
  existentes: Array<{ numeroOferta?: string }>,
  dataIso: string
): string {
  const yy = dataIso.slice(2, 4) || String(new Date().getFullYear()).slice(2)
  let max = 0
  const re = new RegExp(`^AN${yy}(\\d{4,6})`, 'i')
  for (const o of existentes) {
    const n = String(o.numeroOferta || '').trim()
    const m = n.match(re)
    if (m) {
      const v = parseInt(m[1], 10)
      if (Number.isFinite(v) && v > max) max = v
    }
  }
  return `AN${yy}${String(max + 1).padStart(5, '0')}`
}

export function formatarPrecoOrcamentoEur(valor: number): string {
  if (!Number.isFinite(valor)) return '—'
  const fmt = valor.toLocaleString('de-DE', { minimumFractionDigits: 0, maximumFractionDigits: 2 })
  return `${fmt},-`
}
