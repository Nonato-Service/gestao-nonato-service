/**
 * PDFs de confirmação / pedido ligados a orçamentos avulsos.
 */
import {
  buildPdfHtmlDocument,
  buildPdfHeaderForDoc,
  buildPdfMetaFieldsHtml,
  buildPdfNoticeHtml,
  buildPdfInstructionsBoxHtml,
  escapePdfHtml,
  wrapPdfTableHtml,
} from './pdfDocumentShell'
import { buildPdfDocumentFooterHtml } from './pdfDocumentLayout'
import { normalizePdfModelo } from './pdfModelTypes'

export type OrcamentoConfirmacaoKind = 'orcamento' | 'pedido-os' | 'separacao-envio'

export type OrcamentoConfirmacaoLabels = Record<string, string | string[]>

export type OrcamentoConfirmacaoData = {
  numeroOrcamento: string
  relatorioNumero?: string
  data: string
  clienteNome?: string
  total?: number
  descricao?: string
  dadosCliente?: {
    morada?: string
    conselho?: string
    localidade?: string
    codigoPostal?: string
    telefone?: string
  }
}

function esc(s: string | undefined | null): string {
  return escapePdfHtml(String(s ?? ''))
}

function metaTableRows(
  labels: OrcamentoConfirmacaoLabels,
  orc: OrcamentoConfirmacaoData,
  kind: OrcamentoConfirmacaoKind
): string {
  const rows: string[] = []
  const push = (labelKey: string, value: string) => {
    rows.push(`<tr><th scope="row">${esc(String(labels[labelKey] ?? labelKey))}</th><td>${value || '—'}</td></tr>`)
  }

  push('numOrcamento', esc(orc.numeroOrcamento))
  if (kind === 'pedido-os') {
    push('ordemServico', esc(orc.relatorioNumero || 'N/A'))
  }
  push('data', esc(orc.data))
  push('cliente', esc(orc.clienteNome || 'N/A'))
  if (kind === 'separacao-envio') {
    const dc = orc.dadosCliente || {}
    const endereco = [dc.morada, dc.conselho || dc.localidade, dc.codigoPostal].filter(Boolean).join(', ')
    if (endereco) push('endereco', esc(endereco))
    if (dc.telefone) push('telefone', esc(dc.telefone))
  }
  push('valorTotal', `€ ${(orc.total ?? 0).toFixed(2)}`)
  if (orc.descricao) {
    rows.push(
      `<tr><th scope="row">${esc(String(labels.descricao ?? 'Descrição'))}</th><td colspan="3">${esc(orc.descricao)}</td></tr>`
    )
  }

  return rows.join('')
}

export function buildOrcamentoConfirmacaoPdfHtml(options: {
  kind: OrcamentoConfirmacaoKind
  labels: OrcamentoConfirmacaoLabels
  orcamento: OrcamentoConfirmacaoData
  model?: string
  isDemo?: boolean
  lang?: string
}): string {
  const { kind, labels, orcamento, isDemo = false, lang = 'pt-BR' } = options
  const model = normalizePdfModelo(options.model)
  const titulo = String(labels.titulo ?? 'Documento')
  const dataGeracao = new Date().toLocaleString(lang.startsWith('pt') ? 'pt-PT' : lang)
  const docRef = String(orcamento.numeroOrcamento || '').trim() || String(Date.now()).slice(-6)

  const headerHtml = buildPdfHeaderForDoc({
    title: titulo,
    subtitle: 'NONATO SERVICE',
    reportNumber: docRef,
    badgeLabel: String(labels.badge ?? 'Documento'),
    model,
    docTheme: 'service',
  })

  const metaHtml = buildPdfMetaFieldsHtml(
    String(labels.resumoTitulo ?? 'Dados do documento'),
    [
      { label: String(labels.numOrcamento ?? 'Orçamento'), value: esc(orcamento.numeroOrcamento) },
      ...(kind === 'pedido-os'
        ? [{ label: String(labels.ordemServico ?? 'O.S.'), value: esc(orcamento.relatorioNumero || 'N/A') }]
        : []),
      { label: String(labels.data ?? 'Data'), value: esc(orcamento.data) },
      { label: String(labels.cliente ?? 'Cliente'), value: esc(orcamento.clienteNome || 'N/A') },
      { label: String(labels.valorTotal ?? 'Total'), value: `€ ${(orcamento.total ?? 0).toFixed(2)}` },
    ]
  )

  const tableHtml = wrapPdfTableHtml(
    `<tbody>${metaTableRows(labels, orcamento, kind)}</tbody>`,
    'billing'
  )

  let extraBody = ''
  if (kind === 'separacao-envio' && Array.isArray(labels.instrucoesLista)) {
    extraBody = buildPdfInstructionsBoxHtml(
      String(labels.instrucoes ?? 'Instruções'),
      labels.instrucoesLista as string[]
    )
  }

  const footerHtml = buildPdfDocumentFooterHtml(
    `${String(labels.rodape ?? 'Documento gerado em')} ${dataGeracao} — NONATO SERVICE${isDemo ? ' — DEMO' : ''}. ${String(labels.instrucoesPrint ?? 'Use Imprimir → Guardar como PDF.')}`
  )

  const bodyHtml = `${tableHtml}${extraBody}${buildPdfNoticeHtml(
    String(
      labels.nota ??
        'Documento oficial para arquivo, envio ao cliente ou uso interno. Verifique os dados antes de imprimir.'
    ),
    'info'
  )}`

  return buildPdfHtmlDocument({
    title: titulo,
    lang,
    model,
    docTheme: 'billing',
    headerHtml,
    metaHtml,
    bodyHtml,
    footerHtml,
  })
}
