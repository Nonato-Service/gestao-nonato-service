import { NextRequest, NextResponse } from 'next/server'
import {
  PDF_DOCUMENT_LAYOUT_CSS,
  buildPdfDocumentFooterHtml,
  buildPdfDocumentHeaderHtml,
  buildPdfMetaSectionHtml,
  escapePdfHtml,
} from '../../../lib/pdfDocumentLayout'

export const dynamic = 'force-dynamic'

type ComprovantePayload = {
  id: string
  tipo: 'cliente' | 'pessoal'
  cliente: string
  data: string
  mesCompetencia?: string
  valorUnitario: number
  quantidade: number
  valorTotal: number
  descricao?: string
}

type Body = {
  comprovantes: ComprovantePayload[]
  totalGeral: number
  totalPorCliente: Record<string, number>
  modelo: 1 | 2 | 3 | 4 | 5
  tecnicoNome?: string
  periodo?: string
  labelPessoal?: string
  tituloRelatorio?: string
}

function getClienteOuPessoal(c: ComprovantePayload, labelPessoal: string): string {
  return c.tipo === 'pessoal' ? labelPessoal : (c.cliente || '—')
}

function buildHtml(body: Body): string {
  const {
    comprovantes,
    totalGeral,
    totalPorCliente,
    modelo,
    tecnicoNome,
    periodo = '',
    labelPessoal = 'Despesas Pessoais',
    tituloRelatorio = 'REGISTRO DE DESPESAS PAGAS COM O CARTÃO PARA DECLARAÇÃO DE IRS',
  } = body

  const esc = escapePdfHtml
  const dataGeracao = new Date().toLocaleDateString('pt-PT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
  const totalPorClienteEntries = Object.entries(totalPorCliente).sort((a, b) => b[1] - a[1])
  const docRef = String(Date.now()).slice(-6)

  const headerHtml = buildPdfDocumentHeaderHtml({
    logoContent: 'NONATO SERVICE',
    title: esc(tituloRelatorio),
    reportNumber: docRef,
    subtitle: 'Relatório para impressão / guardar como PDF',
    badgeLabel: 'Relatório',
    theme: 'expense',
    variant: 'detailed',
  })

  const metaFields = [
    { label: 'Total geral', value: `€ ${totalGeral.toFixed(2)}` },
    ...(periodo ? [{ label: 'Período', value: esc(periodo) }] : []),
    ...(tecnicoNome ? [{ label: 'Técnico', value: esc(tecnicoNome) }] : []),
    { label: 'Modelo', value: String(modelo) },
  ]

  const metaHtml = buildPdfMetaSectionHtml({
    title: 'Resumo do documento',
    modifier: 'expense',
    fields: metaFields,
  })

  let mainContent = ''

  if (modelo === 1) {
    mainContent = `
      <div class="comp-pdf-table-wrap">
        <table class="comp-pdf-table">
          <thead><tr><th>Cliente / Beneficiário</th><th>Total (€)</th></tr></thead>
          <tbody>
            ${totalPorClienteEntries.map(([nome, tot]) => `<tr><td>${esc(nome)}</td><td class="num">${tot.toFixed(2)}</td></tr>`).join('')}
            <tr class="total-row"><td>Total geral</td><td class="num">${totalGeral.toFixed(2)} €</td></tr>
          </tbody>
        </table>
      </div>`
  } else if (modelo === 2) {
    mainContent = `
      <div class="comp-pdf-table-wrap">
        <table class="comp-pdf-table">
          <thead><tr><th>Data (recibo)</th><th>Mês arquivo</th><th>Cliente / Beneficiário</th><th>Valor (€)</th><th>Descrição</th></tr></thead>
          <tbody>
            ${comprovantes
              .map((c) => {
                const mesArq = esc((c.mesCompetencia || '').trim() || '—')
                return `<tr><td>${esc(String(c.data))}</td><td>${mesArq}</td><td>${esc(getClienteOuPessoal(c, labelPessoal))}</td><td class="num">${c.valorTotal.toFixed(2)}</td><td>${esc(c.descricao || '')}</td></tr>`
              })
              .join('')}
            <tr class="total-row"><td colspan="3">Total</td><td class="num">${totalGeral.toFixed(2)} €</td><td></td></tr>
          </tbody>
        </table>
      </div>`
  } else if (modelo === 3) {
    mainContent = `
      <div class="comp-pdf-table-wrap">
        <table class="comp-pdf-table">
          <thead><tr><th>Cliente / Beneficiário</th><th>Total (€)</th></tr></thead>
          <tbody>
            ${totalPorClienteEntries.map(([nome, tot]) => `<tr><td>${esc(nome)}</td><td class="num">${tot.toFixed(2)}</td></tr>`).join('')}
            <tr class="total-row"><td>Total</td><td class="num">${totalGeral.toFixed(2)} €</td></tr>
          </tbody>
        </table>
      </div>`
  } else if (modelo === 4) {
    mainContent = `
      <div class="comp-pdf-table-wrap">
        <table class="comp-pdf-table">
          <thead><tr><th>Cliente / Beneficiário</th><th>Total (€)</th></tr></thead>
          <tbody>
            ${totalPorClienteEntries.map(([nome, tot]) => `<tr><td>${esc(nome)}</td><td class="num">${tot.toFixed(2)}</td></tr>`).join('')}
            <tr class="total-row"><td>Total geral</td><td class="num">${totalGeral.toFixed(2)} €</td></tr>
          </tbody>
        </table>
      </div>
      <p class="comp-pdf-note">Fim do relatório.</p>`
  } else {
    mainContent = `
      <div class="comp-pdf-table-wrap">
        <table class="comp-pdf-table">
          <tbody>
            ${totalPorClienteEntries.map(([nome, tot]) => `<tr><td>${esc(nome)}</td><td class="num">${tot.toFixed(2)} €</td></tr>`).join('')}
          </tbody>
        </table>
      </div>`
  }

  const footerHtml = buildPdfDocumentFooterHtml(
    `Documento gerado em ${dataGeracao} — NONATO SERVICE · Use Ctrl+P (ou Cmd+P) para imprimir ou guardar como PDF.`
  )

  const style = `
    ${PDF_DOCUMENT_LAYOUT_CSS}
    @page { size: A4 portrait; margin: 12mm; }
    * { box-sizing: border-box; }
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      margin: 0;
      padding: 18px 20px 24px;
      color: #1a1a1a;
      line-height: 1.5;
      font-size: 10pt;
      background: #fff;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .comp-pdf-table-wrap { margin: 0 0 16px; border: 1px solid #dbeafe; border-radius: 4px; overflow: hidden; }
    .comp-pdf-table { width: 100%; border-collapse: collapse; margin: 0; font-size: 9.5pt; }
    .comp-pdf-table th, .comp-pdf-table td { border: 1px solid #e2e8f0; padding: 9px 10px; text-align: left; vertical-align: top; }
    .comp-pdf-table th { background: #0d7a3d; color: #fff; font-weight: 600; font-size: 8.5pt; text-transform: uppercase; letter-spacing: 0.04em; }
    .comp-pdf-table tbody tr:nth-child(even) td { background: #f8fafc; }
    .comp-pdf-table .num { text-align: right; white-space: nowrap; }
    .comp-pdf-table .total-row td { background: #e8f5e9 !important; font-weight: 700; color: #0d7a3d; }
    .comp-pdf-note { margin-top: 12px; font-size: 8.5pt; color: #64748b; }
  `

  return `<!DOCTYPE html>
<html lang="pt-PT">
<head>
  <meta charset="UTF-8">
  <title>${esc(tituloRelatorio)} - PDF</title>
  <style>${style}</style>
</head>
<body>
  ${headerHtml}
  ${metaHtml}
  ${mainContent}
  ${footerHtml}
</body>
</html>`
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as Body
    if (!body.comprovantes || !Array.isArray(body.comprovantes) || typeof body.totalGeral !== 'number') {
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
    console.error('Erro ao gerar PDF comprovantes:', e)
    return new NextResponse(JSON.stringify({ error: 'Erro ao gerar documento' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
