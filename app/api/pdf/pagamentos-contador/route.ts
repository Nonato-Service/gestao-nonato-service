import { NextRequest, NextResponse } from 'next/server'

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
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
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
  } = body

  const L: PdfLabels = { ...DEFAULT_LABELS, ...labelsPartial }

  const dataGeracao = new Date().toLocaleDateString(locale, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

  const style = `
    * { box-sizing: border-box; }
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 20px; color: #1a1a1a; line-height: 1.45; font-size: 10.5pt; }
    .header { background: linear-gradient(135deg, #000 0%, #1a2a1a 50%, #0d1a0d 100%); border-bottom: 3px solid #00ff00; padding: 20px 24px; text-align: center; }
    .header h1 { margin: 0; font-size: 20pt; font-weight: 700; color: #00ff00; letter-spacing: 1.5px; }
    .header .subtitle { margin: 6px 0 0 0; font-size: 10pt; color: rgba(255,255,255,0.9); }
    .info-block { background: #f5f5f5; padding: 14px 18px; border-radius: 8px; margin: 16px 0; border-left: 4px solid #00ff00; }
    .info-block p { margin: 4px 0; }
    .info-block strong { color: #006600; }
    .totais-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin: 16px 0; }
    .totais-card { padding: 12px 14px; border-radius: 8px; border: 1px solid #ccc; background: #fafafa; }
    .totais-card strong { display: block; font-size: 14pt; margin-top: 4px; }
    .totais-card--pago strong { color: #15803d; }
    .totais-card--pend strong { color: #a16207; }
    h2 { font-size: 12pt; color: #1a5a1a; margin: 22px 0 10px; border-bottom: 1px solid #ccc; padding-bottom: 4px; }
    table { width: 100%; border-collapse: collapse; margin: 10px 0 18px; font-size: 9.5pt; }
    th, td { border: 1px solid #ccc; padding: 8px 10px; text-align: left; vertical-align: top; }
    th { background: #e8f5e8; color: #1a5a1a; font-weight: 600; }
    .total-row { background: #e8f5e8; font-weight: bold; }
    .status-pago { color: #15803d; font-weight: 600; }
    .status-pend { color: #a16207; font-weight: 600; }
    .anexos { font-size: 8.5pt; color: #555; margin-top: 2px; }
    .nota { margin-top: 20px; padding: 12px 14px; background: #fffbeb; border: 1px solid #fcd34d; border-radius: 6px; font-size: 9pt; color: #713f12; }
    .footer { margin-top: 28px; text-align: center; font-size: 9pt; color: #666; padding: 12px; border-top: 1px solid #ddd; }
    @media print {
      body { padding: 12px; }
      .header { break-after: avoid; }
      table { page-break-inside: auto; }
      tr { page-break-inside: avoid; page-break-after: auto; }
    }
  `

  const resumoRows = resumoPorEntidade
    .map(
      r => `<tr>
        <td>${esc(r.nome)}</td>
        <td>${esc(r.categoriaLabel)}</td>
        <td>${r.quantidade}</td>
        <td>${r.totalPago.toFixed(2)} €</td>
        <td>${r.totalPendente.toFixed(2)} €</td>
        <td>${(r.totalPago + r.totalPendente).toFixed(2)} €</td>
      </tr>`
    )
    .join('')

  const detalheRows = pagamentos
    .map(p => {
      const anexos =
        p.anexosNomes.length > 0
          ? `<div class="anexos">📎 ${p.anexosNomes.map(n => esc(n)).join(' · ')}</div>`
          : ''
      const statusLabel = p.status === 'pago' ? L.estadoPago : L.estadoPendente
      return `<tr>
        <td>${fmtData(p.dataPagamento, locale)}</td>
        <td>${esc(p.entidadeNome)}<br/><span style="font-size:8.5pt;color:#666">${esc(p.categoriaLabel)}</span></td>
        <td>${esc(p.periodoReferencia || '—')}</td>
        <td>${esc(p.numeroDocumento || '—')}</td>
        <td class="${p.status === 'pago' ? 'status-pago' : 'status-pend'}">${esc(statusLabel)}</td>
        <td>${p.valor.toFixed(2)} €</td>
        <td>${esc(p.descricao || '—')}${anexos}</td>
      </tr>`
    })
    .join('')

  const html = `<!DOCTYPE html>
<html lang="${esc(htmlLang)}">
<head>
  <meta charset="UTF-8">
  <title>${esc(tituloRelatorio)} — PDF</title>
  <style>${style}</style>
</head>
<body>
  <header class="header">
    <h1>${esc(tituloRelatorio)}</h1>
    <p class="subtitle">${esc(L.subtitulo)}</p>
  </header>

  <div class="info-block">
    ${periodo ? `<p><strong>${esc(L.periodoAno)}</strong> ${esc(periodo)}</p>` : ''}
    ${filtrosDescricao ? `<p><strong>${esc(L.filtros)}:</strong> ${esc(filtrosDescricao)}</p>` : ''}
    <p><strong>${esc(L.registos)}:</strong> ${pagamentos.length}</p>
    <p><strong>${esc(L.geradoEm)}:</strong> ${esc(dataGeracao)}</p>
  </div>

  <div class="totais-grid">
    <div class="totais-card totais-card--pago"><span>${esc(L.totalPago)}</span><strong>${totalPago.toFixed(2)} €</strong></div>
    <div class="totais-card totais-card--pend"><span>${esc(L.totalPendente)}</span><strong>${totalPendente.toFixed(2)} €</strong></div>
    <div class="totais-card"><span>${esc(L.totalGeral)}</span><strong>${totalGeral.toFixed(2)} €</strong></div>
  </div>

  <h2>${esc(L.resumoEntidade)}</h2>
  <table>
    <thead>
      <tr>
        <th>${esc(L.colEntidade)}</th>
        <th>${esc(L.colTipo)}</th>
        <th>${esc(L.colQtd)}</th>
        <th>${esc(L.colPagoEur)}</th>
        <th>${esc(L.colPendenteEur)}</th>
        <th>${esc(L.colTotal)}</th>
      </tr>
    </thead>
    <tbody>
      ${resumoRows || `<tr><td colspan="6">${esc(L.nenhumResumo)}</td></tr>`}
    </tbody>
  </table>

  <h2>${esc(L.detalhe)}</h2>
  <table>
    <thead>
      <tr>
        <th>${esc(L.colData)}</th>
        <th>${esc(L.colEntidade)}</th>
        <th>${esc(L.colPeriodo)}</th>
        <th>${esc(L.colDoc)}</th>
        <th>${esc(L.colEstado)}</th>
        <th>${esc(L.colValor)}</th>
        <th>${esc(L.colDescricao)}</th>
      </tr>
    </thead>
    <tbody>
      ${detalheRows || `<tr><td colspan="7">${esc(L.nenhumDetalhe)}</td></tr>`}
      <tr class="total-row">
        <td colspan="5">${esc(L.totalFiltro)}</td>
        <td>${totalGeral.toFixed(2)} €</td>
        <td></td>
      </tr>
    </tbody>
  </table>

  <div class="nota">${esc(notaRodape)}</div>

  <div class="footer">
    <p>${esc(L.docGerado)} ${esc(dataGeracao)} — NONATO SERVICE</p>
    <p style="font-size: 8pt; margin-top: 6px;">${esc(L.instrucoesPrint)}</p>
  </div>
</body>
</html>`

  return html
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
