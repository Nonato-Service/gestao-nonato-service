/** Cabeçalho e meta HTML do PDF de relatório de serviço. Sem I/O. */

import {
  PDF_DOCUMENT_LAYOUT_CSS,
  buildPdfDocumentHeaderHtml,
  buildPdfMetaSectionHtml,
  escapePdfHtml,
  type PdfDocumentHeaderVariant,
  type PdfMetaField,
} from '../pdf/documentLayout'
import {
  getRelatorioCabecalhoEquipamentoDados,
  type EquipamentoArmazemIdLookup,
  type EquipamentoClienteIdLookup,
  type RelatorioEquipamentoCabecalhoLinha,
  type RelatorioServicoEquipamentosHost,
} from '../equipamentos/relatorio'

export type RelatorioServicoPdfHeaderVariant = PdfDocumentHeaderVariant

export function buildRelatorioServicoPdfHeaderHtml(options: {
  logoContent: string
  title: string
  reportNumber: string
  subtitle?: string
  badgeLabel?: string
  badgeLabelCompact?: string
  variant?: RelatorioServicoPdfHeaderVariant
}): string {
  return buildPdfDocumentHeaderHtml({
    ...options,
    theme: 'service',
  })
}

export type RelatorioServicoPdfMetaLabels = {
  tecnico: string
  data: string
  cliente: string
  equipamentoId: string
  maquinaModelo: string
  numeroMaquina: string
  equipNumero: string
  cidade: string
  telefone: string
  tipoServico: string
}

function buildPdfEquipamentosRelatorioTableHtml(
  linhas: RelatorioEquipamentoCabecalhoLinha[],
  labels: Pick<RelatorioServicoPdfMetaLabels, 'equipNumero' | 'equipamentoId' | 'numeroMaquina' | 'maquinaModelo'>,
  esc: (s: string | undefined | null) => string
): string {
  const rows = linhas
    .map(
      (linha) => `<tr>
      <td class="ns-pdf-meta__equip-num">${linha.numero}</td>
      <td class="ns-pdf-meta__equip-id">${esc(linha.equipamentoId)}</td>
      <td class="ns-pdf-meta__equip-sn">${esc(linha.numeroMaquina)}</td>
      <td class="ns-pdf-meta__equip-modelo">${esc(linha.maquinaModelo)}</td>
    </tr>`
    )
    .join('')

  return `<table class="ns-pdf-meta__equip-table" role="presentation">
    <thead>
      <tr>
        <th scope="col">${labels.equipNumero}</th>
        <th scope="col">${labels.equipamentoId}</th>
        <th scope="col">${labels.numeroMaquina}</th>
        <th scope="col">${labels.maquinaModelo}</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>`
}

/** Meta (cliente + equipamentos) para PDF de fechamento / despesas — lista todos os equipamentos se > 1. */
export type FechamentoClienteCadastroRef = {
  codigoCliente?: string
  nomeEmpresa?: string
  morada?: string
  localidade?: string
  conselho?: string
  codigoPostal?: string
  pais?: string
  numeroContribuicaoFiscal?: string
  telefones?: string
  email?: string
  contato?: string
}

function montarMoradaClientePdf(c: FechamentoClienteCadastroRef): string {
  return [
    c.morada,
    [c.codigoPostal, c.localidade].filter(Boolean).join(' '),
    c.conselho,
    c.pais,
  ]
    .filter(Boolean)
    .join(' · ')
}

/** Campos extra do cadastro do cliente (morada, telefone, NIF, etc.). */
export function buildFechamentoDespesasClienteMetaFields(
  relatorio: { telefone?: string; cidade?: string },
  clienteCadastro: FechamentoClienteCadastroRef | null | undefined,
  labels: {
    codigoCliente?: string
    morada?: string
    telefone?: string
    email?: string
    contribuicaoFiscal?: string
    contato?: string
    cidade?: string
  },
  esc: (s: string | undefined | null) => string
): PdfMetaField[] {
  const fields: PdfMetaField[] = []
  if (clienteCadastro) {
    const cod = String(clienteCadastro.codigoCliente ?? '').trim()
    if (cod) {
      fields.push({ label: esc(labels.codigoCliente || 'Cód. cliente'), value: esc(cod) })
    }
    const morada = montarMoradaClientePdf(clienteCadastro)
    if (morada) {
      fields.push({ label: esc(labels.morada || 'Morada'), value: esc(morada), fullWidth: true })
    }
    const tel = String(clienteCadastro.telefones || relatorio.telefone || '').trim()
    if (tel) {
      fields.push({ label: esc(labels.telefone || 'Telefone'), value: esc(tel) })
    }
    const email = String(clienteCadastro.email ?? '').trim()
    if (email) {
      fields.push({ label: esc(labels.email || 'E-mail'), value: esc(email) })
    }
    const nif = String(clienteCadastro.numeroContribuicaoFiscal ?? '').trim()
    if (nif) {
      fields.push({
        label: esc(labels.contribuicaoFiscal || 'NIF'),
        value: esc(nif),
      })
    }
    const contato = String(clienteCadastro.contato ?? '').trim()
    if (contato) {
      fields.push({ label: esc(labels.contato || 'Contacto'), value: esc(contato) })
    }
  } else {
    const tel = String(relatorio.telefone ?? '').trim()
    if (tel) {
      fields.push({ label: esc(labels.telefone || 'Telefone'), value: esc(tel) })
    }
    const cid = String(relatorio.cidade ?? '').trim()
    if (cid) {
      fields.push({ label: esc(labels.cidade || 'Cidade'), value: esc(cid) })
    }
  }
  return fields
}

export function buildFechamentoDespesasRelatorioInfoHtml(options: {
  relatorio: RelatorioServicoEquipamentosHost & {
    cliente?: string
    data?: string
    numero?: string
    telefone?: string
    cidade?: string
  }
  title: string
  labels: {
    cliente: string
    numeroRelatorio: string
    equipamento: string
    data: string
    equipNumero: string
    equipamentoId: string
    numeroMaquina: string
    maquinaModelo: string
    codigoCliente?: string
    morada?: string
    telefone?: string
    email?: string
    contribuicaoFiscal?: string
    contato?: string
    cidade?: string
  }
  clienteCadastro?: FechamentoClienteCadastroRef | null
  esc?: (s: string | undefined | null) => string
  equipamentosArmazem?: EquipamentoArmazemIdLookup[]
  equipamentosCliente?: EquipamentoClienteIdLookup[]
}): string {
  const {
    relatorio,
    title,
    labels,
    clienteCadastro,
    esc = escapePdfHtml,
    equipamentosArmazem = [],
    equipamentosCliente = [],
  } = options
  const cab = getRelatorioCabecalhoEquipamentoDados(relatorio, equipamentosArmazem, equipamentosCliente)
  const nomeCliente =
    String(clienteCadastro?.nomeEmpresa ?? '').trim() ||
    String(relatorio.cliente ?? '').trim() ||
    '—'
  const fields: PdfMetaField[] = [
    { label: esc(labels.cliente), value: esc(nomeCliente), fullWidth: true },
    ...buildFechamentoDespesasClienteMetaFields(relatorio, clienteCadastro, labels, esc),
    { label: esc(labels.numeroRelatorio), value: esc(relatorio.numero) },
  ]
  if (!cab.multiplos || cab.linhas.length <= 1) {
    const equipTexto =
      cab.modelos !== '—' ? cab.modelos : String(relatorio.maquinaModelo ?? '').trim() || '—'
    fields.push({
      label: esc(labels.equipamento),
      value: esc(equipTexto),
      fullWidth: String(equipTexto).length > 42,
    })
  }
  fields.push({ label: esc(labels.data), value: esc(relatorio.data) })
  let html = buildPdfMetaSectionHtml({ title: esc(title), fields, modifier: 'expense' })
  if (cab.multiplos && cab.linhas.length > 1) {
    const tableHtml = buildPdfEquipamentosRelatorioTableHtml(
      cab.linhas,
      {
        equipNumero: labels.equipNumero,
        equipamentoId: labels.equipamentoId,
        numeroMaquina: labels.numeroMaquina,
        maquinaModelo: labels.maquinaModelo,
      },
      esc
    )
    html = html.replace('</section>', `<div class="ns-pdf-meta__equip-wrap">${tableHtml}</div></section>`)
  }
  return html
}

export function buildRelatorioServicoPdfMetaSectionHtml(options: {
  relatorio: RelatorioServicoEquipamentosHost & {
    tecnico?: string
    cliente?: string
    cidade?: string
    telefone?: string
    tipoServico?: string
    maquinaModelo?: string
    numeroMaquina?: string
  }
  title: string
  labels: RelatorioServicoPdfMetaLabels
  dataFormatada: string
  modifier?: '' | 'dark' | 'expense'
  equipamentosArmazem?: EquipamentoArmazemIdLookup[]
  equipamentosCliente?: EquipamentoClienteIdLookup[]
}): string {
  const {
    relatorio,
    title,
    labels,
    dataFormatada,
    modifier = '',
    equipamentosArmazem = [],
    equipamentosCliente = [],
  } = options
  const eq = getRelatorioCabecalhoEquipamentoDados(relatorio, equipamentosArmazem, equipamentosCliente)
  const esc = escapePdfHtml

  const fields: PdfMetaField[] = [
    { label: labels.tecnico, value: esc(relatorio.tecnico || '—') },
    { label: labels.data, value: esc(dataFormatada || '—') },
    { label: labels.cliente, value: esc(relatorio.cliente || '—') },
    { label: labels.telefone, value: esc(relatorio.telefone || '—') },
  ]

  if (!eq.multiplos) {
    if (eq.ids && eq.ids !== '—') {
      fields.push({
        label: labels.equipamentoId,
        value: esc(eq.ids),
        fullWidth: eq.ids.length > 28,
      })
    }
    if (eq.numeros && eq.numeros !== '—') {
      fields.push({
        label: labels.numeroMaquina,
        value: esc(eq.numeros),
      })
    }
    fields.push({
      label: labels.maquinaModelo,
      value: esc(eq.modelos !== '—' ? eq.modelos : relatorio.maquinaModelo || '—'),
    })
  }

  fields.push(
    { label: labels.cidade, value: esc(relatorio.cidade || '—') },
    { label: labels.tipoServico, value: esc(relatorio.tipoServico || '—') }
  )

  const metaHtml = buildPdfMetaSectionHtml({ title, fields, modifier })

  if (eq.multiplos && eq.linhas.length > 1) {
    const tableHtml = buildPdfEquipamentosRelatorioTableHtml(eq.linhas, labels, esc)
    return metaHtml.replace('</section>', `${tableHtml}</section>`)
  }

  return metaHtml
}

/** CSS do cabeçalho PDF — reutilizado em todos os modelos (exceto Ferwood). */
export const RELATORIO_SERVICO_PDF_HEADER_CSS = PDF_DOCUMENT_LAYOUT_CSS

/** Alias legado para compatibilidade com templates antigos */
export const RELATORIO_SERVICO_PDF_HEADER_CSS_LEGACY = `
.pdf-header { margin-bottom: 18px; }
`.trim()
