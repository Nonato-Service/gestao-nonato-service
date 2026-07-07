import {
  buildOrcamentoPdfShell,
  EMPRESA_NONATO_DEFAULT,
  escapePdfHtml,
  fmtDataPdf,
  type OrcamentoPdfEmpresa,
} from './orcamentoPdfPro'

export type OrcamentoGeradoPdfItem = {
  descricao: string
  quantidade: number
  precoUnitario?: number
  total?: number
  codigo?: string
  tipoItem?: 'sem-valor' | 'com-valor'
  iva?: number
  imagem?: string
}

export type OrcamentoGeradoPdfData = {
  id: string
  numeroOrcamento: string
  data: string
  validade?: string
  descricao?: string
  observacoes?: string
  relatorioNumero?: string
  equipamentoNumeroSerie?: string
  equipamentoDescricao?: string
  clienteNome: string
  clienteEmail?: string
  clienteTelefone?: string
  clienteMorada?: string
  clienteConselho?: string
  clienteCodigoPostal?: string
  clienteNif?: string
  itens: OrcamentoGeradoPdfItem[]
  total?: number
  totalSemIva?: number
  totalIva?: number
  logoHtml?: string
  empresa?: OrcamentoPdfEmpresa
  labels?: Record<string, string | undefined>
  resolveImagem?: (item: OrcamentoGeradoPdfItem) => string | undefined
  actionsHtml?: string
}

function renderItemRow(
  item: OrcamentoGeradoPdfItem,
  idx: number,
  data: OrcamentoGeradoPdfData
): string {
  const L = data.labels || {}
  const subtotal = item.total || 0
  const valorIva = item.iva ? (subtotal * item.iva) / 100 : 0
  const precoUnitario = item.precoUnitario || 0
  const temValor = item.tipoItem === 'com-valor' && precoUnitario > 0
  const srcImg = data.resolveImagem?.(item)
  const img = srcImg
    ? `<img src="${String(srcImg).replace(/"/g, '&quot;')}" alt="" class="orc-pdf-pro__thumb" onerror="this.outerHTML='<span class=\\'orc-pdf-pro__na\\'>—</span>'" />`
    : '<span class="orc-pdf-pro__na">—</span>'
  const temIvaCol = data.itens.some((i) => i.iva && i.iva > 0)

  return `<tr>
    <td class="orc-pdf-pro__col-img">${img}</td>
    <td class="orc-pdf-pro__desc-cell">${escapePdfHtml(item.descricao)}</td>
    <td class="orc-pdf-pro__col-cod">${escapePdfHtml(item.codigo || '—')}</td>
    <td class="orc-pdf-pro__col-qtd">${item.quantidade}</td>
    <td class="orc-pdf-pro__col-preco">${temValor ? `€ ${precoUnitario.toFixed(2)}` : escapePdfHtml(L.aDefinir || 'A definir')}</td>
    <td class="orc-pdf-pro__col-preco">${temValor ? `€ ${subtotal.toFixed(2)}` : escapePdfHtml(L.aDefinir || 'A definir')}</td>
    ${temIvaCol ? `<td class="orc-pdf-pro__col-iva">${item.iva && item.iva > 0 && temValor ? `${item.iva}% · € ${valorIva.toFixed(2)}` : '—'}</td>` : ''}
  </tr>`
}

export function buildOrcamentoGeradoPdfHtml(data: OrcamentoGeradoPdfData): string {
  const L = data.labels || {}
  const titulo = L.titulo || 'ORÇAMENTO'
  const dataFmt = fmtDataPdf(data.data)
  const temIvaCol = data.itens.some((i) => i.iva && i.iva > 0)
  const temValorTotal = (data.total || 0) > 0

  const metaFields = [
    { label: L.cliente || 'Cliente', value: data.clienteNome, fullWidth: true },
    { label: L.data || 'Data', value: dataFmt },
    { label: L.validade || 'Validade', value: data.validade ? `${data.validade} ${L.dias || 'dias'}` : '—' },
  ]
  if (data.clienteEmail) metaFields.push({ label: L.email || 'E-mail', value: data.clienteEmail })
  if (data.clienteTelefone) metaFields.push({ label: L.telefone || 'Telefone', value: data.clienteTelefone })
  if (data.clienteMorada) metaFields.push({ label: L.morada || 'Morada', value: data.clienteMorada, fullWidth: true })
  if (data.clienteNif) metaFields.push({ label: L.contribuicaoFiscal || 'NIF', value: data.clienteNif })
  if (data.relatorioNumero) metaFields.push({ label: L.numeroRelatorio || 'N.º Relatório', value: data.relatorioNumero, fullWidth: true })
  if (data.equipamentoNumeroSerie?.trim()) {
    metaFields.push({
      label: L.numeroEquipamento || L.numeroSerie || 'Número do Equipamento',
      value: data.equipamentoNumeroSerie.trim(),
      fullWidth: true,
    })
  }
  if (data.equipamentoDescricao?.trim()) {
    metaFields.push({ label: L.equipamento || 'Equipamento', value: data.equipamentoDescricao.trim(), fullWidth: true })
  }

  const itensHtml = data.itens.map((item, idx) => renderItemRow(item, idx, data)).join('')

  const tabela = `<table class="orc-pdf-pro__table">
    <thead>
      <tr>
        <th class="orc-pdf-pro__col-img">${escapePdfHtml(L.imagem || 'Img.')}</th>
        <th>${escapePdfHtml(L.descricao || 'Descrição')}</th>
        <th class="orc-pdf-pro__col-cod">${escapePdfHtml(L.codigo || 'Código')}</th>
        <th class="orc-pdf-pro__col-qtd">${escapePdfHtml(L.quantidade || 'Qtd')}</th>
        <th class="orc-pdf-pro__col-preco">${escapePdfHtml(L.precoUnitario || 'Preço un.')}</th>
        <th class="orc-pdf-pro__col-preco">${escapePdfHtml(L.subtotal || 'Subtotal')}</th>
        ${temIvaCol ? `<th class="orc-pdf-pro__col-iva">${escapePdfHtml(L.iva || 'IVA')}</th>` : ''}
      </tr>
    </thead>
    <tbody>${itensHtml || `<tr><td colspan="${temIvaCol ? 7 : 6}" style="text-align:center;padding:14px;color:#94a3b8;">—</td></tr>`}</tbody>
  </table>`

  const summary = temValorTotal
    ? `<div class="orc-pdf-pro__summary">
        ${(data.totalSemIva || 0) > 0 ? `<div class="orc-pdf-pro__summary-row"><span class="orc-pdf-pro__summary-label">${escapePdfHtml(L.totalSemIva || 'Total sem IVA')}</span><span class="orc-pdf-pro__summary-value">€ ${(data.totalSemIva || 0).toFixed(2)}</span></div>` : ''}
        ${(data.totalIva || 0) > 0 ? `<div class="orc-pdf-pro__summary-row"><span class="orc-pdf-pro__summary-label">${escapePdfHtml(L.iva || 'IVA')}</span><span class="orc-pdf-pro__summary-value">€ ${(data.totalIva || 0).toFixed(2)}</span></div>` : ''}
        <div class="orc-pdf-pro__summary-row orc-pdf-pro__summary-row--total">
          <span class="orc-pdf-pro__summary-label">${escapePdfHtml(L.totalComIva || L.total || 'Total')}</span>
          <span class="orc-pdf-pro__summary-value">€ ${(data.total || 0).toFixed(2)}</span>
        </div>
      </div>`
    : `<div class="orc-pdf-pro__summary">
        <div class="orc-pdf-pro__summary-row orc-pdf-pro__summary-row--total">
          <span class="orc-pdf-pro__summary-label">${escapePdfHtml(L.itemSemValor || 'Orçamento sem valores')}</span>
          <span class="orc-pdf-pro__summary-value">${data.itens.length} ${escapePdfHtml(L.itens || 'itens')}</span>
        </div>
      </div>`

  const descricaoBlock = data.descricao?.trim()
    ? `<div class="orc-pdf-pro__notes"><p class="orc-pdf-pro__notes-title">${escapePdfHtml(L.descricao || 'Descrição')}</p>${escapePdfHtml(data.descricao)}</div>`
    : ''

  const obsBlock = data.observacoes?.trim()
    ? `<div class="orc-pdf-pro__notes"><p class="orc-pdf-pro__notes-title">${escapePdfHtml(L.observacoes || 'Observações')}</p>${escapePdfHtml(data.observacoes)}</div>`
    : ''

  const defaultActions = `
    <button type="button" class="orc-pdf-pro__btn orc-pdf-pro__btn--print" onclick="window.print()">🖨️ ${escapePdfHtml(L.imprimirOrcamento || L.imprimir || 'Imprimir / Guardar PDF')}</button>
    <button type="button" class="orc-pdf-pro__btn orc-pdf-pro__btn--sec" onclick="window.close()">${escapePdfHtml(L.fechar || 'Fechar')}</button>
  `

  return buildOrcamentoPdfShell({
    title: titulo,
    reportNumber: data.numeroOrcamento,
    subtitle: L.subtituloOrcamento || 'Proposta comercial',
    logoHtml: data.logoHtml,
    empresa: data.empresa || EMPRESA_NONATO_DEFAULT,
    badgeDoc: temValorTotal
      ? L.badgeComValores || 'Orçamento com valores'
      : L.badgeSemValores || 'Orçamento sem valores',
    metaTitle: L.dadosCliente || 'Dados do cliente',
    metaFields,
    bodyHtml: `${descricaoBlock}${tabela}${summary}${obsBlock}`,
    footerText:
      L.rodapeOrcamento ||
      `NONATO SERVICE — ${L.emitidoEm || 'Emitido em'} ${dataFmt}. ${L.rodapeLegal || 'Documento válido mediante aceitação do cliente.'}`,
    actionsHtml: data.actionsHtml || defaultActions,
  })
}

export function openOrcamentoGeradoPdf(data: OrcamentoGeradoPdfData): boolean {
  if (typeof window === 'undefined') return false
  const w = window.open('', '_blank')
  if (!w) {
    alert('Permita pop-ups para ver o orçamento em PDF.')
    return false
  }
  w.document.write(buildOrcamentoGeradoPdfHtml(data))
  w.document.close()
  w.document.title = (data.labels?.titulo || 'Orçamento') + ' — ' + data.numeroOrcamento
  return true
}
