import { NextRequest, NextResponse } from 'next/server'
import {
  buildPdfHeaderForDoc,
  buildPdfHtmlDocument,
  buildPdfMetaFieldsHtml,
  buildPdfNoticeHtml,
  buildPdfSectionTitleHtml,
  buildPdfSummaryCardsHtml,
  escapePdfHtml,
  wrapPdfTableHtml,
} from '../../../lib/pdfDocumentShell'
import { buildPdfDocumentFooterHtml } from '../../../lib/pdfDocumentLayout'
import { normalizePdfModelo } from '../../../lib/pdfModelTypes'

export const dynamic = 'force-dynamic'

type PagamentoPayload = {
  id: string
  entidadeId: string
  entidadeNome: string
  categoriaLabel: string
  dataPagamento: string
  valor: number
  periodoReferencia: string
  numeroDocumento?: string
  descricao?: string
  status: 'pago' | 'pendente'
  anexosNomes: string[]
}

type ResumoEntidade = {
  nome: string
  categoriaLabel: string
  totalPago: number
  totalPendente: number
  quantidade: number
}

type PdfLabels = {
  subtitulo: string
  periodoAno: string
  filtros: string
  registos: string
  geradoEm: string
  totalPago: string
  totalPendente: string
  totalGeral: string
  resumoEntidade: string
  detalhe: string
  colEntidade: string
  colTipo: string
  colQtd: string
  colPagoEur: string
  colPendenteEur: string
  colTotal: string
  colData: string
  colPeriodo: string
  colDoc: string
  colEstado: string
  colValor: string
  colDescricao: string
  nenhumResumo: string
  nenhumDetalhe: string
  totalFiltro: string
  docGerado: string
  instrucoesPrint: string
  estadoPago: string
  estadoPendente: string
}

type Body = {
  pagamentos: PagamentoPayload[]
  totalPago: number
  totalPendente: number
  totalGeral: number
  resumoPorEntidade: ResumoEntidade[]
  periodo?: string
  filtrosDescricao?: string
  tituloRelatorio?: string
  notaRodape?: string
  locale?: string
  htmlLang?: string
  labels?: Partial<PdfLabels>
  pdfModelo?: string
}

const DEFAULT_LABELS: PdfLabels = {
  subtitulo: 'NONATO SERVICE — Relatório para o contabilista',
  periodoAno: 'Período / ano:',
  filtros: 'Filtros',
  registos: 'Registos incluídos',
  geradoEm: 'Gerado em',
  totalPago: 'Total pago',
  totalPendente: 'Total pendente',
  totalGeral: 'Total geral',
  resumoEntidade: 'Resumo por entidade',
  detalhe: 'Detalhe dos pagamentos',
  colEntidade: 'Entidade',
  colTipo: 'Tipo',
  colQtd: 'Qtd.',
  colPagoEur: 'Pago (€)',
  colPendenteEur: 'Pendente (€)',
  colTotal: 'Total (€)',
  colData: 'Data',
  colPeriodo: 'Período / ref.',
  colDoc: 'N.º doc.',
  colEstado: 'Estado',
  colValor: 'Valor',
  colDescricao: 'Descrição / anexos',
  nenhumResumo: 'Nenhum pagamento no filtro selecionado.',
  nenhumDetalhe: 'Nenhum pagamento.',
  totalFiltro: 'Total (filtro atual)',
  docGerado: 'Documento gerado em',
  instrucoesPrint: 'Use Ctrl+P (ou Cmd+P) para imprimir ou guardar como PDF.',
  estadoPago: 'Pago',
  estadoPendente: 'Pendente',
}

function esc(s: string): string {
  return escapePdfHtml(String(s ?? ''))
}

function fmtData(iso: string, locale: string): string {
  if (!iso) return '—'
  try {
    return new Date(iso + 'T12:00:00').toLocaleDateString(locale)
  } catch {
    return iso
  }
}

function buildHtml(body: Body): string {
  const {
    pagamentos,
    totalPago,
    totalPendente,
    totalGeral,
    resumoPorEntidade,
    periodo = '',
    filtrosDescricao = '',
    tituloRelatorio = 'PAGAMENTOS AO CONTADOR',
    notaRodape = 'Relatório para entrega ao contabilista. Os documentos originais (PDF/fotos) estão anexados no sistema por cada linha indicada.',
    locale = 'pt-PT',
    htmlLang = 'pt-PT',
    labels: labelsPartial = {},
    pdfModelo,
  } = body

  const model = normalizePdfModelo(pdfModelo)
  const L: PdfLabels = { ...DEFAULT_LABELS, ...labelsPartial }

  const dataGeracao = new Date().toLocaleDateString(locale, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

  const docRef = String(Date.now()).slice(-6)

  const headerHtml = buildPdfHeaderForDoc({
    title: tituloRelatorio,
    subtitle: L.subtitulo,
    reportNumber: docRef,
    badgeLabel: 'Relatório',
    model,
    docTheme: 'expense',
  })

  const metaFields = [
    ...(periodo ? [{ label: L.periodoAno, value: esc(periodo) }] : []),
    ...(filtrosDescricao ? [{ label: L.filtros, value: esc(filtrosDescricao), fullWidth: true as const }] : []),
    { label: L.registos, value: String(pagamentos.length) },
    { label: L.geradoEm, value: esc(dataGeracao) },
  ]

  const metaHtml = buildPdfMetaFieldsHtml('Resumo do relatório', metaFields, 'expense')

  const resumoRows = resumoPorEntidade
    .map(
      (r) => `<tr>
        <td>${esc(r.nome)}</td>
        <td>${esc(r.categoriaLabel)}</td>
        <td class="num">${r.quantidade}</td>
        <td class="num">${r.totalPago.toFixed(2)} €</td>
        <td class="num">${r.totalPendente.toFixed(2)} €</td>
        <td class="num">${(r.totalPago + r.totalPendente).toFixed(2)} €</td>
      </tr>`
    )
    .join('')

  const detalheRows = pagamentos
    .map((p) => {
      const anexos =
        p.anexosNomes.length > 0
          ? `<div class="anexos">📎 ${p.anexosNomes.map((n) => esc(n)).join(' · ')}</div>`
          : ''
      const statusLabel = p.status === 'pago' ? L.estadoPago : L.estadoPendente
      return `<tr>
        <td class="nowrap">${fmtData(p.dataPagamento, locale)}</td>
        <td>${esc(p.entidadeNome)}<br/><span style="font-size:8.5pt;color:#64748b">${esc(p.categoriaLabel)}</span></td>
        <td>${esc(p.periodoReferencia || '—')}</td>
        <td>${esc(p.numeroDocumento || '—')}</td>
        <td class="${p.status === 'pago' ? 'status-pago' : 'status-pend'}">${esc(statusLabel)}</td>
        <td class="num">${p.valor.toFixed(2)} €</td>
        <td>${esc(p.descricao || '—')}${anexos}</td>
      </tr>`
    })
    .join('')

  const bodyHtml = [
    buildPdfSummaryCardsHtml([
      { label: L.totalPago, value: `${totalPago.toFixed(2)} €`, modifier: 'pago' },
      { label: L.totalPendente, value: `${totalPendente.toFixed(2)} €`, modifier: 'pendente' },
      { label: L.totalGeral, value: `${totalGeral.toFixed(2)} €`, modifier: 'total' },
    ]),
    buildPdfSectionTitleHtml(L.resumoEntidade),
    wrapPdfTableHtml(
      `<thead><tr>
        <th>${esc(L.colEntidade)}</th><th>${esc(L.colTipo)}</th><th>${esc(L.colQtd)}</th>
        <th>${esc(L.colPagoEur)}</th><th>${esc(L.colPendenteEur)}</th><th>${esc(L.colTotal)}</th>
      </tr></thead><tbody>
        ${resumoRows || `<tr><td colspan="6">${esc(L.nenhumResumo)}</td></tr>`}
      </tbody>`,
      'expense'
    ),
    buildPdfSectionTitleHtml(L.detalhe),
    wrapPdfTableHtml(
      `<thead><tr>
        <th>${esc(L.colData)}</th><th>${esc(L.colEntidade)}</th><th>${esc(L.colPeriodo)}</th>
        <th>${esc(L.colDoc)}</th><th>${esc(L.colEstado)}</th><th>${esc(L.colValor)}</th><th>${esc(L.colDescricao)}</th>
      </tr></thead><tbody>
        ${detalheRows || `<tr><td colspan="7">${esc(L.nenhumDetalhe)}</td></tr>`}
        <tr class="total-row"><td colspan="5">${esc(L.totalFiltro)}</td><td class="num">${totalGeral.toFixed(2)} €</td><td></td></tr>
      </tbody>`,
      'expense'
    ),
    buildPdfNoticeHtml(notaRodape, 'warning'),
  ].join('')

  const footerHtml = buildPdfDocumentFooterHtml(
    `${esc(L.docGerado)} ${esc(dataGeracao)} — NONATO SERVICE · ${esc(L.instrucoesPrint)}`
  )

  return buildPdfHtmlDocument({
    title: `${tituloRelatorio} — PDF`,
    lang: htmlLang,
    model,
    docTheme: 'expense',
    headerHtml,
    metaHtml,
    bodyHtml,
    footerHtml,
  })
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as Body
    if (!body.pagamentos || !Array.isArray(body.pagamentos)) {
      return new NextResponse(JSON.stringify({ error: 'Dados inválidos' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }
    const html = buildHtml(body)
    return new NextResponse(html, {
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    })
  } catch (e) {
    console.error('Erro ao gerar PDF pagamentos contador:', e)
    return new NextResponse(JSON.stringify({ error: 'Erro ao gerar documento' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
