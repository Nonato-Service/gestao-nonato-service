import {
  PROTOCOLO_PDF_BLOCO_STYLES,
  buildProtocoloServicoPrintHtml,
  clampProtocoloPdfModelo,
  getProtocoloPdfDynamicStyles,
} from '../utils/protocoloServicoPdfThemes'
import type { ProtocoloBlocoMin, ProtocoloEstadoAcao } from './protocoloInteligente'

function escHtml(s: string): string {
  return (s || '').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/\n/g, '<br/>')
}

function escAttr(s: string): string {
  return (s || '').replace(/"/g, '&quot;').replace(/'/g, '&#39;')
}

type EqCliente = {
  tipoEquipamento?: string
  modelo?: string
  marca?: string
  numeroSerie?: string
  cod?: string
  id?: string
}

function idEquipamentoVisivel(eq: EqCliente | undefined, equipamentosArmazem: Array<{ id?: string; numeroSerie?: string; cod?: string }>): string {
  if (!eq) return ''
  const cod = String(eq.cod || '').trim()
  if (cod) return cod
  const sn = String(eq.numeroSerie || '').trim()
  if (sn) {
    const arm = equipamentosArmazem.find((e) => String(e.numeroSerie || '').trim() === sn)
    if (arm?.cod) return String(arm.cod).trim()
    if (arm?.id) return String(arm.id).trim()
  }
  const id = String(eq.id || '').trim()
  return id || ''
}

const ESTADOS_ACAO: Array<{ id: ProtocoloEstadoAcao; label: string }> = [
  { id: 'bom', label: 'Bom' },
  { id: 'reparar', label: 'Reparar' },
  { id: 'substituir', label: 'Substituir' },
  { id: 'nd', label: 'N/D' },
]

function normalizarEstadoAcao(v: unknown): ProtocoloEstadoAcao | undefined {
  return v === 'bom' || v === 'reparar' || v === 'substituir' || v === 'nd' ? v : undefined
}

function estadoGridHtml(estado: ProtocoloEstadoAcao | undefined, esc: (s: string) => string): string {
  return `<div class="proto-estado-grid" role="group" aria-label="Estado">${ESTADOS_ACAO.map((e) => {
    const active = estado === e.id
    const mark = active ? '✓' : ''
    return `<span class="proto-estado proto-estado--${e.id}${active ? ' proto-estado--active' : ''}"><span class="proto-estado__mark" aria-hidden="true">${mark}</span>${esc(e.label)}</span>`
  }).join('')}</div>`
}

function imagensGaleriaHtml(imgs: string[], soloClass = false): string {
  const list = (imgs || []).slice(0, 2).filter(Boolean)
  if (!list.length) return ''
  const solo = soloClass || list.length === 1
  const cells = list
    .map((src) => `<figure class="proto-img-gallery__cell"><img src="${escAttr(src)}" alt="" /></figure>`)
    .join('')
  return `<div class="proto-img-gallery${solo ? ' proto-img-gallery--solo' : ''}">${cells}</div>`
}

function imagensAcaoMediaHtml(imgs: string[]): string {
  const list = (imgs || []).slice(0, 2).filter(Boolean)
  if (!list.length) return ''
  const solo = list.length === 1
  const cells = list
    .map((src) => `<figure class="proto-acao-card__media-cell"><img src="${escAttr(src)}" alt="" /></figure>`)
    .join('')
  return `<div class="proto-acao-card__media-grid${solo ? ' proto-acao-card__media-grid--solo' : ''}">${cells}</div>`
}

function acaoCardHtml(
  b: ProtocoloBlocoMin,
  esc: (s: string) => string,
  acaoNum: number,
  labels: { observacao?: string }
): string {
  const imgs = b.imagens || []
  const txt = (b.texto || '').trim()
  const titulo = (b.titulo || '').trim()
  const estado = normalizarEstadoAcao(b.estadoAcao)
  const ordem = b.ordemConteudo === 'imagens_primeiro' ? 'imagens_primeiro' : 'texto_primeiro'
  const temTexto = Boolean(txt)
  const temImgs = imgs.length > 0
  if (!titulo && !temTexto && !temImgs) return ''

  const tituloHtml = titulo
    ? `<h4 class="proto-acao-card__titulo"><span class="proto-acao-card__num">A${acaoNum}</span>${esc(titulo)}</h4>`
    : `<h4 class="proto-acao-card__titulo"><span class="proto-acao-card__num">A${acaoNum}</span>${esc('Intervenção')}</h4>`

  const textoHtml = temTexto
    ? `<div class="proto-acao-card__texto"><p class="proto-acao-card__texto-label">${esc(labels.observacao || 'Observação')}</p>${esc(txt)}</div>`
    : ''

  const mediaHtml = temImgs ? `<div class="proto-acao-card__media">${imagensAcaoMediaHtml(imgs)}</div>` : ''

  const bodyClasses = [
    'proto-acao-card__body',
    !temTexto || !temImgs ? 'proto-acao-card__body--solo' : '',
    ordem === 'imagens_primeiro' && temTexto && temImgs ? 'proto-acao-card__body--imgs-first' : '',
  ]
    .filter(Boolean)
    .join(' ')

  return `<article class="proto-acao-card">${`<header class="proto-acao-card__head">${tituloHtml}${estadoGridHtml(estado, esc)}</header>`}<div class="${bodyClasses}">${textoHtml}${mediaHtml}</div></article>`
}

export type ProtocoloPdfBuildInput = {
  protocolo: {
    id: string
    clienteId: string
    equipamentoNumeroSerie: string
    situacaoDescricao?: string
    textoInicial: string
    blocos: ProtocoloBlocoMin[]
    pecasTrocadasCodigos: string[]
    dataCriacao: string
    pdfModelo?: number
  }
  clienteNome: string
  equipamento?: EqCliente
  equipamentosArmazem: Array<{ id?: string; numeroSerie?: string; cod?: string }>
  logoHtml: string
  tituloProto: string
  labels: {
    pecasTrocadas?: string
    cliente?: string
    equipamento?: string
    situacao?: string
    textoInicial?: string
    numeroSerie?: string
    idEquipamento?: string
    tipoEquipamento?: string
    modelo?: string
    marca?: string
    observacao?: string
  }
  dateLocale: string
  modeloOverride?: number
}

export function buildProtocoloServicoPdfHtmlFromProtocolo(input: ProtocoloPdfBuildInput): string {
  const { protocolo: p, equipamento: eq, labels: L } = input
  const esc = escHtml
  const modelo = clampProtocoloPdfModelo(
    input.modeloOverride !== undefined && input.modeloOverride !== null ? input.modeloOverride : p.pdfModelo
  )
  const idx = modelo - 1
  const bts = PROTOCOLO_PDF_BLOCO_STYLES[idx] || PROTOCOLO_PDF_BLOCO_STYLES[0]
  const dyn = getProtocoloPdfDynamicStyles(idx)

  const tituloSecaoHtml = (t?: string) =>
    (t || '').trim() ? `<h3 class="proto-sec-titulo">${esc((t || '').trim())}</h3>` : ''

  let blocosHtml = ''
  let acaoNum = 0
  ;(p.blocos || []).forEach((b) => {
    if (b.tipo === 'texto' && b.texto?.trim()) {
      blocosHtml += `<div class="proto-bloco-texto" style="${bts}">${tituloSecaoHtml(b.titulo)}${esc(b.texto)}</div>`
    }
    if (b.tipo === 'imagens' && b.imagens?.length) {
      const gallery = imagensGaleriaHtml(b.imagens)
      blocosHtml += `<section class="proto-img-sec">${tituloSecaoHtml(b.titulo)}${gallery}</section>`
    }
    if (b.tipo === 'acao') {
      acaoNum += 1
      blocosHtml += acaoCardHtml(b, esc, acaoNum, { observacao: L.observacao })
    }
  })

  const pecasList = (p.pecasTrocadasCodigos || []).filter((c) => c.trim())
  const pecasLabelStyle =
    idx >= 14
      ? 'display:block;margin-bottom:8px;font-size:10px;letter-spacing:0.1em;text-transform:uppercase;color:#4ade80;font-weight:800;'
      : idx >= 12
        ? 'display:block;margin-bottom:6px;font-size:10px;letter-spacing:0.06em;text-transform:uppercase;color:#334155;font-weight:800;'
        : 'display:block;margin-bottom:6px;font-size:10px;letter-spacing:0.06em;text-transform:uppercase;color:#475569;font-weight:700;'
  const pecasValStyle = idx >= 14 ? 'color:#ecfdf5;font-weight:600;' : 'color:#0f172a;'
  const pecasStrong = pecasList.length
    ? `<div class="pecas-line" style="${dyn.pecasBox}"><strong style="${pecasLabelStyle}">${esc(L.pecasTrocadas || 'Peças trocadas')}</strong><span style="${pecasValStyle}">${esc(pecasList.join(', '))}</span></div>`
    : ''

  const dataDoc = new Date(p.dataCriacao).toLocaleDateString(input.dateLocale)
  const refDoc = `REF-${String(p.id).replace(/[^a-zA-Z0-9]/g, '').slice(-12).toUpperCase() || 'NS'}`
  const nomeClientePdf = (input.clienteNome || '').trim()
  const idEqPdf = idEquipamentoVisivel(eq, input.equipamentosArmazem)
  const rowIdPdf = idEqPdf
    ? `<tr><td class="cl-label">${esc(L.idEquipamento || 'ID')}</td><td class="cl-value">${esc(idEqPdf)}</td></tr>`
    : ''

  const equipTableRows = eq
    ? [
        eq.tipoEquipamento ? `<tr><td class="cl-label">${esc(L.tipoEquipamento || 'Tipo')}</td><td class="cl-value">${esc(eq.tipoEquipamento)}</td></tr>` : '',
        eq.modelo ? `<tr><td class="cl-label">${esc(L.modelo || 'Modelo')}</td><td class="cl-value">${esc(eq.modelo)}</td></tr>` : '',
        eq.marca ? `<tr><td class="cl-label">${esc(L.marca || 'Marca')}</td><td class="cl-value">${esc(eq.marca)}</td></tr>` : '',
        eq.numeroSerie ? `<tr><td class="cl-label">${esc(L.numeroSerie || 'Nº Série')}</td><td class="cl-value">${esc(eq.numeroSerie)}</td></tr>` : '',
        rowIdPdf,
      ]
        .filter(Boolean)
        .join('')
    : ''

  const sitPdf = (p.situacaoDescricao || '').trim()
  const identSectionParts: string[] = []
  if (nomeClientePdf || equipTableRows || (sitPdf && !eq)) {
    identSectionParts.push('<div class="sec sec-ident-compact">')
    if (nomeClientePdf) {
      identSectionParts.push(
        `<p class="proto-cliente-linha"><span class="proto-cliente-etq">${esc(L.cliente || 'Cliente')}</span><span class="proto-cliente-nome">${esc(nomeClientePdf)}</span></p>`
      )
    }
    if (equipTableRows) {
      identSectionParts.push(
        `<h3 class="sec-title sec-title-sub">${esc(L.equipamento || 'Equipamento')}</h3><table class="cl-table cl-table-compact">${equipTableRows}</table>`
      )
    } else if (sitPdf) {
      identSectionParts.push(
        `<h3 class="sec-title sec-title-sub">${esc(L.situacao || 'Situação / contexto')}</h3><p class="texto-inicial proto-situacao-compact">${esc(sitPdf)}</p>`
      )
    }
    identSectionParts.push('</div>')
  }

  const identSection = identSectionParts.join('')
  const situacaoSectionExtra =
    sitPdf && eq
      ? `<div class="sec sec-ident-compact"><h3 class="sec-title">${esc(L.situacao || 'Situação / contexto')}</h3><p class="texto-inicial proto-situacao-compact">${esc(sitPdf)}</p></div>`
      : ''
  const textoSection = p.textoInicial
    ? `<div class="sec"><h3 class="sec-title">${esc(L.textoInicial || 'Texto inicial')}</h3><p class="texto-inicial">${esc(p.textoInicial)}</p></div>`
    : ''

  const bodyInner = `${identSection}${situacaoSectionExtra}${textoSection}${blocosHtml}${pecasStrong}<div class="footer-bar"><span class="footer-date">${dataDoc}</span><span class="doc-ref">${refDoc}</span></div>`

  return buildProtocoloServicoPrintHtml(idx, { tituloProto: input.tituloProto, dataDoc, logoHtml: input.logoHtml }, bodyInner)
}
