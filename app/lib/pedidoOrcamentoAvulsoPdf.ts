export type PedidoAvulsoPdfPeca = {
  codigo: string
  nome: string
  quantidade: number
  imagem?: string
}

export type PedidoAvulsoPdfData = {
  codigo: string
  preview?: boolean
  dataIso?: string
  clienteNomeDoc: string
  equipamentoTexto: string
  pecas: PedidoAvulsoPdfPeca[]
  logoHtml?: string
  labels?: {
    titulo?: string
    previewBanner?: string
    codigo?: string
    data?: string
    cliente?: string
    equipamento?: string
    colImagem?: string
    colDescricao?: string
    colCodigo?: string
    colQtd?: string
    imprimir?: string
    fechar?: string
  }
}

function esc(s: string): string {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

export function buildPedidoOrcamentoAvulsoPdfHtml(data: PedidoAvulsoPdfData): string {
  const L = data.labels || {}
  const titulo = L.titulo || 'PEDIDO DE ORÇAMENTO'
  const dataFmt = data.dataIso
    ? new Date(data.dataIso.includes('T') ? data.dataIso : data.dataIso + 'T12:00:00').toLocaleDateString('pt-BR')
    : new Date().toLocaleDateString('pt-BR')

  const linhas = data.pecas
    .map((p) => {
      const img = p.imagem
        ? `<img src="${String(p.imagem).replace(/"/g, '&quot;')}" alt="" class="item-image" onerror="this.style.display='none'" />`
        : '<span class="na">—</span>'
      return `<tr>
        <td class="col-img">${img}</td>
        <td>${esc(p.nome)}</td>
        <td>${esc(p.codigo || '—')}</td>
        <td class="col-qtd">${p.quantidade}</td>
      </tr>`
    })
    .join('')

  const previewBanner = data.preview
    ? `<div class="preview-banner">${esc(L.previewBanner || 'Pré-visualização — o número definitivo é atribuído ao gerar o pedido')}</div>`
    : ''

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <title>${esc(titulo)} — ${esc(data.codigo)}</title>
  <style>
    @page { size: A4 portrait; margin: 12mm; }
    @media print { .no-print { display: none !important; } .preview-banner { border-style: solid; } }
    * { box-sizing: border-box; }
    body { font-family: "Segoe UI", Arial, sans-serif; margin: 0; padding: 20px; color: #111; font-size: 12px; line-height: 1.45; }
    .preview-banner { background: #fff8e1; border: 2px dashed #f59e0b; color: #92400e; padding: 10px 14px; margin-bottom: 18px; border-radius: 8px; font-weight: 600; text-align: center; }
    .header { text-align: center; margin-bottom: 22px; padding-bottom: 16px; border-bottom: 2px solid #166534; }
    .header h1 { margin: 8px 0 4px; font-size: 22px; letter-spacing: 0.06em; color: #14532d; }
    .header .meta { font-size: 13px; color: #334155; }
    .section { margin-bottom: 16px; }
    .section h3 { margin: 0 0 8px; font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; color: #14532d; background: #ecfdf5; padding: 8px 10px; border-left: 4px solid #166534; }
    .section p { margin: 4px 0; }
    table { width: 100%; border-collapse: collapse; margin-top: 8px; }
    th, td { border: 1px solid #cbd5e1; padding: 8px; vertical-align: middle; }
    th { background: #166534; color: #fff; font-size: 11px; text-transform: uppercase; }
    tbody tr:nth-child(even) td { background: #f8fafc; }
    .col-img { width: 64px; text-align: center; }
    .col-qtd { width: 56px; text-align: center; font-weight: 700; }
    .item-image { width: 48px; height: 48px; object-fit: cover; border-radius: 4px; }
    .na { color: #94a3b8; }
    .actions { margin-top: 24px; text-align: center; padding-top: 16px; border-top: 1px solid #e2e8f0; }
    .actions button { margin: 4px 8px; padding: 10px 20px; font-size: 14px; cursor: pointer; border: none; border-radius: 6px; font-weight: 700; }
    .btn-print { background: #166534; color: #fff; }
    .btn-close { background: #64748b; color: #fff; }
  </style>
</head>
<body>
  ${previewBanner}
  <div class="header">
    ${data.logoHtml ? `<div style="margin-bottom:12px;display:flex;justify-content:center;">${data.logoHtml}</div>` : ''}
    <h1>${esc(titulo)}</h1>
    <div class="meta"><strong>${esc(L.codigo || 'Código')}:</strong> ${esc(data.codigo)}</div>
    <div class="meta"><strong>${esc(L.data || 'Data')}:</strong> ${esc(dataFmt)}</div>
  </div>
  <div class="section">
    <h3>${esc(L.cliente || 'Cliente')}</h3>
    <p><strong>${esc(data.clienteNomeDoc)}</strong></p>
  </div>
  <div class="section">
    <h3>${esc(L.equipamento || 'Equipamento')}</h3>
    <p>${esc(data.equipamentoTexto || '—')}</p>
  </div>
  <div class="section">
    <h3>${esc(L.colDescricao || 'Peças solicitadas')}</h3>
    <table>
      <thead>
        <tr>
          <th>${esc(L.colImagem || 'Imagem')}</th>
          <th>${esc(L.colDescricao || 'Descrição')}</th>
          <th>${esc(L.colCodigo || 'Código')}</th>
          <th>${esc(L.colQtd || 'Qtd')}</th>
        </tr>
      </thead>
      <tbody>${linhas || `<tr><td colspan="4" style="text-align:center;color:#64748b;">—</td></tr>`}</tbody>
    </table>
  </div>
  <div class="actions no-print">
    <button type="button" class="btn-print" onclick="window.print()">🖨️ ${esc(L.imprimir || 'Imprimir / Guardar PDF')}</button>
    <button type="button" class="btn-close" onclick="window.close()">${esc(L.fechar || 'Fechar')}</button>
  </div>
</body>
</html>`
}

export function openPedidoOrcamentoAvulsoPdf(data: PedidoAvulsoPdfData): boolean {
  if (typeof window === 'undefined') return false
  const w = window.open('', '_blank')
  if (!w) {
    alert('Permita pop-ups para ver a pré-visualização em PDF.')
    return false
  }
  w.document.write(buildPedidoOrcamentoAvulsoPdfHtml(data))
  w.document.close()
  w.document.title = (data.labels?.titulo || 'Pedido') + ' — ' + data.codigo
  return true
}
