import {
  buildOrcamentoPdfShell,
  EMPRESA_NONATO_DEFAULT,
  escapePdfHtml,
  fmtDataPdf,
  type OrcamentoPdfEmpresa,
} from './orcamentoPdfPro'

export type PedidoAvulsoPdfPeca = {
  codigo: string
  nome: string
  quantidade: number
  imagem?: string
}

export type PedidoAvulsoPdfEquipamentoBloco = {
  titulo: string
  detalhes?: string
  numeroSerie?: string
  campos?: Array<{ label: string; value: string }>
  pecas: PedidoAvulsoPdfPeca[]
}

export type PedidoAvulsoPdfData = {
  codigo: string
  preview?: boolean
  dataIso?: string
  clienteNomeDoc: string
  equipamentoTexto: string
  pecas: PedidoAvulsoPdfPeca[]
  equipamentosBlocos?: PedidoAvulsoPdfEquipamentoBloco[]
  logoHtml?: string
  empresa?: OrcamentoPdfEmpresa
  labels?: {
    titulo?: string
    previewBanner?: string
    codigo?: string
    data?: string
    cliente?: string
    equipamento?: string
    equipamentoNumero?: string
    numeroEquipamento?: string
    numeroSerie?: string
    colImagem?: string
    colDescricao?: string
    colCodigo?: string
    colQtd?: string
    imprimir?: string
    fechar?: string
    metaTitulo?: string
    pecasSolicitadas?: string
    totalPecas?: string
    totalEquipamentos?: string
    documentoSemValor?: string
    rodape?: string
    emitidoEm?: string
  }
}

function renderLinhaPeca(p: PedidoAvulsoPdfPeca, L: PedidoAvulsoPdfData['labels']): string {
  const img = p.imagem
    ? `<img src="${String(p.imagem).replace(/"/g, '&quot;')}" alt="" class="orc-pdf-pro__thumb" onerror="this.outerHTML='<span class=\\'orc-pdf-pro__na\\'>—</span>'" />`
    : '<span class="orc-pdf-pro__na">—</span>'
  return `<tr>
    <td class="orc-pdf-pro__col-img">${img}</td>
    <td class="orc-pdf-pro__desc-cell">${escapePdfHtml(p.nome)}</td>
    <td class="orc-pdf-pro__col-cod">${escapePdfHtml(p.codigo || '—')}</td>
    <td class="orc-pdf-pro__col-qtd">${p.quantidade}</td>
  </tr>`
}

function renderTabelaPecas(pecas: PedidoAvulsoPdfPeca[], L: PedidoAvulsoPdfData['labels']): string {
  const linhas = pecas.map((p) => renderLinhaPeca(p, L)).join('')
  return `<table class="orc-pdf-pro__table">
    <thead>
      <tr>
        <th class="orc-pdf-pro__col-img">${escapePdfHtml(L?.colImagem || 'Imagem')}</th>
        <th>${escapePdfHtml(L?.colDescricao || 'Descrição')}</th>
        <th class="orc-pdf-pro__col-cod">${escapePdfHtml(L?.colCodigo || 'Código')}</th>
        <th class="orc-pdf-pro__col-qtd">${escapePdfHtml(L?.colQtd || 'Quantia')}</th>
      </tr>
    </thead>
    <tbody>${linhas || `<tr><td colspan="4" style="text-align:center;color:#94a3b8;padding:14px;">—</td></tr>`}</tbody>
  </table>`
}

function resolverSerieBlocoPdf(
  bloco: PedidoAvulsoPdfEquipamentoBloco,
  L: PedidoAvulsoPdfData['labels']
): string {
  const direto = String(bloco.numeroSerie ?? '').trim()
  if (direto) return direto
  const lblNum = L?.numeroEquipamento || 'Número do Equipamento'
  for (const c of bloco.campos || []) {
    if (c.label === lblNum) {
      const v = String(c.value ?? '').trim()
      if (v) return v
    }
  }
  return ''
}

function renderEquipInfoGrid(
  bloco: PedidoAvulsoPdfEquipamentoBloco,
  L: PedidoAvulsoPdfData['labels']
): string {
  const partes: string[] = []
  const serie = resolverSerieBlocoPdf(bloco, L)
  if (serie) {
    partes.push(
      `<div class="orc-pdf-pro__equip-sn">${escapePdfHtml(L?.numeroEquipamento || 'Número do Equipamento')}: <strong>${escapePdfHtml(serie)}</strong></div>`
    )
  }
  const campos = (bloco.campos || []).filter((c) => {
    const v = String(c.value ?? '').trim()
    if (!v) return false
    if (serie && v === serie) return false
    const lblNum = L?.numeroEquipamento || ''
    const lblSerie = L?.numeroSerie || ''
    if (serie && (c.label === lblNum || c.label === lblSerie)) return false
    return true
  })
  if (campos.length > 0) {
    partes.push(
      `<div class="orc-pdf-pro__equip-info">${campos
        .map((c) => {
          const full = c.label === (L?.numeroEquipamento || '') || c.label === (L?.numeroSerie || '')
          return `<div class="orc-pdf-pro__equip-field${full ? ' orc-pdf-pro__equip-field--full' : ''}">
            <span class="lbl">${escapePdfHtml(c.label)}</span>
            <span class="val">${escapePdfHtml(c.value)}</span>
          </div>`
        })
        .join('')}</div>`
    )
  } else if (bloco.detalhes) {
    partes.push(`<div class="orc-pdf-pro__equip-info"><div class="orc-pdf-pro__equip-field orc-pdf-pro__equip-field--full"><span class="lbl">${escapePdfHtml(L?.equipamento || 'Equipamento')}</span><span class="val">${escapePdfHtml(bloco.detalhes)}</span></div></div>`)
  }
  return partes.join('')
}

function renderBlocoEquipamento(
  bloco: PedidoAvulsoPdfEquipamentoBloco,
  index: number,
  L: PedidoAvulsoPdfData['labels']
): string {
  return `<div class="orc-pdf-pro__equip-block">
    <div class="orc-pdf-pro__equip-head">
      <div class="orc-pdf-pro__equip-num">${index + 1}</div>
      <div>
        <h3 class="orc-pdf-pro__equip-title">${escapePdfHtml(bloco.titulo)}</h3>
      </div>
    </div>
    ${renderEquipInfoGrid(bloco, L)}
    <div class="orc-pdf-pro__equip-body">
      ${renderTabelaPecas(bloco.pecas, L)}
    </div>
  </div>`
}

export function buildPedidoOrcamentoAvulsoPdfHtml(data: PedidoAvulsoPdfData): string {
  const L = data.labels || {}
  const titulo = L.titulo || 'PEDIDO DE ORÇAMENTO'
  const dataFmt = fmtDataPdf(data.dataIso)
  const blocos = data.equipamentosBlocos?.filter((b) => b.pecas.length > 0) || []
  const totalPecas = blocos.length > 0
    ? blocos.reduce((s, b) => s + b.pecas.length, 0)
    : data.pecas.length
  const totalQtd = (blocos.length > 0 ? blocos.flatMap((b) => b.pecas) : data.pecas).reduce(
    (s, p) => s + (p.quantidade || 0),
    0
  )
  const numEquip = blocos.length > 0 ? blocos.length : 1

  const secoesEquipamento =
    blocos.length > 0
      ? blocos.map((b, i) => renderBlocoEquipamento(b, i, L)).join('')
      : `<div class="orc-pdf-pro__equip-block">
    <div class="orc-pdf-pro__equip-head">
      <div class="orc-pdf-pro__equip-num">1</div>
      <div>
        <h3 class="orc-pdf-pro__equip-title">${escapePdfHtml(L.equipamento || 'Equipamento')}</h3>
        <p class="orc-pdf-pro__equip-detail">${escapePdfHtml(data.equipamentoTexto || '—')}</p>
      </div>
    </div>
    <div class="orc-pdf-pro__equip-body">${renderTabelaPecas(data.pecas, L)}</div>
  </div>`

  const kpiStrip = `<div class="orc-pdf-pro__kpi-strip">
    <div class="orc-pdf-pro__kpi">
      <span class="orc-pdf-pro__kpi-val">${numEquip}</span>
      <span class="orc-pdf-pro__kpi-lbl">${escapePdfHtml(L.totalEquipamentos || 'Equipamentos')}</span>
    </div>
    <div class="orc-pdf-pro__kpi">
      <span class="orc-pdf-pro__kpi-val">${totalPecas}</span>
      <span class="orc-pdf-pro__kpi-lbl">${escapePdfHtml(L.pecasSolicitadas || 'Referências')}</span>
    </div>
    <div class="orc-pdf-pro__kpi">
      <span class="orc-pdf-pro__kpi-val">${totalQtd}</span>
      <span class="orc-pdf-pro__kpi-lbl">${escapePdfHtml(L.totalPecas || 'Unidades')}</span>
    </div>
  </div>`

  const bodyHtml = `${kpiStrip}${secoesEquipamento}
  <div class="orc-pdf-pro__summary">
    <div class="orc-pdf-pro__summary-row">
      <span class="orc-pdf-pro__summary-label">${escapePdfHtml(L.documentoSemValor || 'Documento de pedido de orçamento')}</span>
      <span class="orc-pdf-pro__summary-value">${escapePdfHtml(L.emitidoEm || 'Emitido em')} ${escapePdfHtml(dataFmt)}</span>
    </div>
    <div class="orc-pdf-pro__summary-row orc-pdf-pro__summary-row--total">
      <span class="orc-pdf-pro__summary-label">${escapePdfHtml(L.totalPecas || 'Total de unidades solicitadas')}</span>
      <span class="orc-pdf-pro__summary-value">${totalQtd}</span>
    </div>
  </div>`

  const actionsHtml = `
    <button type="button" class="orc-pdf-pro__btn orc-pdf-pro__btn--print" onclick="window.print()">🖨️ ${escapePdfHtml(L.imprimir || 'Imprimir / Guardar PDF')}</button>
    <button type="button" class="orc-pdf-pro__btn orc-pdf-pro__btn--sec" onclick="window.close()">${escapePdfHtml(L.fechar || 'Fechar')}</button>
  `

  const rodape =
    L.rodape ||
    `NONATO SERVICE — Documento gerado automaticamente. ${L.emitidoEm || 'Emitido em'} ${dataFmt}.`

  return buildOrcamentoPdfShell({
    title: titulo,
    reportNumber: data.codigo,
    subtitle: L.pecasSolicitadas || 'Pedido de peças e equipamentos',
    logoHtml: data.logoHtml,
    empresa: data.empresa || EMPRESA_NONATO_DEFAULT,
    previewBanner: data.preview
      ? L.previewBanner || 'Pré-visualização — o número definitivo é atribuído ao gerar o pedido'
      : undefined,
    badgeDoc: L.documentoSemValor || 'Pedido sem valores — aguarda orçamento',
    metaTitle: L.metaTitulo || L.cliente || 'Dados do pedido',
    metaFields: [
      { label: L.cliente || 'Cliente', value: data.clienteNomeDoc, fullWidth: true },
      { label: L.data || 'Data', value: dataFmt },
      { label: L.codigo || 'Código', value: data.codigo },
    ],
    bodyHtml,
    footerText: rodape,
    actionsHtml,
  })
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
