/**
 * Folha semanal de comprovantes com imagens — impressão / guardar como PDF para o contabilista.
 * Gera HTML no browser (evita enviar imagens base64 ao servidor).
 */

import {
  PDF_DOCUMENT_LAYOUT_CSS,
  buildPdfDocumentFooterHtml,
  buildPdfDocumentHeaderHtml,
  buildPdfMetaSectionHtml,
  escapePdfHtml,
} from './pdfDocumentLayout'

export type ComprovanteFolhaItem = {
  id: string
  tipo: 'cliente' | 'pessoal'
  cliente: string
  data: string
  mesCompetencia?: string
  valorTotal: number
  descricao?: string
  imagemBase64?: string
}

export type FolhaSemanalContadorLabels = {
  periodo: string
  totalGeral: string
  despesasClientes: string
  despesasNonato: string
  dataRecibo: string
  mesArquivo: string
  cliente: string
  valor: string
  descricao: string
  semImagem: string
  instrucoes: string
  resumoTitulo: string
  anexosTitulo: string
  quantidade: string
  tipo: string
  reciboNum: string
}

export type FolhaSemanalContadorParams = {
  semana: string
  comprovantes: ComprovanteFolhaItem[]
  labelNonato: string
  titulo: string
  labels: FolhaSemanalContadorLabels
  totalGeral: number
  totalClientes: number
  totalNonato: number
  totalPorCliente: Record<string, number>
}

function clienteOuNonato(c: ComprovanteFolhaItem, labelNonato: string): string {
  return c.tipo === 'pessoal' ? labelNonato : c.cliente || '—'
}

function safeImageSrc(src: string | undefined): string {
  const s = String(src || '').trim()
  if (!s.startsWith('data:image/')) return ''
  return s
}

function formatDataPt(iso: string): string {
  const d = new Date(String(iso).slice(0, 10) + 'T12:00:00')
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

export function buildFolhaSemanalContadorHtml(params: FolhaSemanalContadorParams): string {
  const {
    semana,
    comprovantes,
    labelNonato,
    titulo,
    labels,
    totalGeral,
    totalClientes,
    totalNonato,
    totalPorCliente,
  } = params

  const esc = escapePdfHtml
  const dataGeracao = new Date().toLocaleDateString('pt-PT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
  const docRef = String(Date.now()).slice(-6)
  const ordenados = [...comprovantes].sort((a, b) => {
    const da = String(a.data || '').slice(0, 10)
    const db = String(b.data || '').slice(0, 10)
    if (da !== db) return da.localeCompare(db)
    return String(a.id).localeCompare(String(b.id))
  })
  const comImagens = ordenados.filter((c) => safeImageSrc(c.imagemBase64)).length

  const headerHtml = buildPdfDocumentHeaderHtml({
    logoContent: 'NONATO SERVICE',
    title: esc(titulo),
    reportNumber: docRef,
    subtitle: `${labels.periodo}: ${esc(semana)}`,
    badgeLabel: 'Folha n.º',
    theme: 'expense',
    variant: 'detailed',
  })

  const metaHtml = buildPdfMetaSectionHtml({
    title: labels.resumoTitulo,
    modifier: 'expense',
    fields: [
      { label: labels.periodo, value: esc(semana) },
      { label: labels.quantidade, value: String(ordenados.length) },
      { label: labels.anexosTitulo, value: `${comImagens} / ${ordenados.length}` },
      { label: labels.totalGeral, value: `€ ${totalGeral.toFixed(2)}` },
      { label: labels.despesasClientes, value: `€ ${totalClientes.toFixed(2)}` },
      { label: labels.despesasNonato, value: `€ ${totalNonato.toFixed(2)}` },
    ],
  })

  const totalPorClienteEntries = Object.entries(totalPorCliente).sort((a, b) => b[1] - a[1])

  const resumoTable = `
    <div class="comp-pdf-table-wrap">
      <table class="comp-pdf-table">
        <thead><tr><th>${esc(labels.cliente)}</th><th>${esc(labels.valor)} (€)</th></tr></thead>
        <tbody>
          ${totalPorClienteEntries
            .map(([nome, tot]) => `<tr><td>${esc(nome)}</td><td class="num">${tot.toFixed(2)}</td></tr>`)
            .join('')}
          <tr class="total-row"><td>${esc(labels.totalGeral)}</td><td class="num">${totalGeral.toFixed(2)}</td></tr>
        </tbody>
      </table>
    </div>`

  const detalheTable = `
    <h2 class="comp-pdf-section">${esc(labels.resumoTitulo)} — ${esc(labels.tipo)}</h2>
    <div class="comp-pdf-table-wrap">
      <table class="comp-pdf-table">
        <thead>
          <tr>
            <th>${esc(labels.dataRecibo)}</th>
            <th>${esc(labels.mesArquivo)}</th>
            <th>${esc(labels.cliente)}</th>
            <th>${esc(labels.valor)} (€)</th>
            <th>${esc(labels.descricao)}</th>
          </tr>
        </thead>
        <tbody>
          ${ordenados
            .map((c) => {
              const mesArq = esc((c.mesCompetencia || '').trim() || '—')
              return `<tr>
                <td>${esc(formatDataPt(c.data))}</td>
                <td>${mesArq}</td>
                <td>${esc(clienteOuNonato(c, labelNonato))}</td>
                <td class="num">${c.valorTotal.toFixed(2)}</td>
                <td>${esc(c.descricao || '')}</td>
              </tr>`
            })
            .join('')}
        </tbody>
      </table>
    </div>`

  const anexosHtml = ordenados
    .map((c, idx) => {
      const imgSrc = safeImageSrc(c.imagemBase64)
      const num = idx + 1
      const tituloRecibo = `${labels.reciboNum} ${num}/${ordenados.length}`
      const meta = `
        <div class="comp-pdf-receipt-meta">
          <div><strong>${esc(labels.dataRecibo)}:</strong> ${esc(formatDataPt(c.data))}</div>
          <div><strong>${esc(labels.cliente)}:</strong> ${esc(clienteOuNonato(c, labelNonato))}</div>
          <div><strong>${esc(labels.valor)}:</strong> ${c.valorTotal.toFixed(2)} €</div>
          ${c.descricao ? `<div><strong>${esc(labels.descricao)}:</strong> ${esc(c.descricao)}</div>` : ''}
        </div>`
      const imgBlock = imgSrc
        ? `<img class="comp-pdf-receipt-img" src="${imgSrc}" alt="${esc(tituloRecibo)}" />`
        : `<p class="comp-pdf-receipt-noimg">${esc(labels.semImagem)}</p>`
      return `
        <section class="comp-pdf-receipt-page">
          <h2 class="comp-pdf-section">${esc(tituloRecibo)}</h2>
          ${meta}
          ${imgBlock}
        </section>`
    })
    .join('')

  const footerHtml = buildPdfDocumentFooterHtml(
    `${labels.instrucoes} — ${dataGeracao} — NONATO SERVICE`
  )

  const style = `
    ${PDF_DOCUMENT_LAYOUT_CSS}
    @page { size: A4 portrait; margin: 10mm; }
    * { box-sizing: border-box; }
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      margin: 0;
      padding: 16px 18px 24px;
      color: #1a1a1a;
      line-height: 1.45;
      font-size: 10pt;
      background: #fff;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .comp-pdf-section {
      font-size: 11pt;
      color: #0d7a3d;
      margin: 20px 0 10px;
      padding-bottom: 4px;
      border-bottom: 2px solid #0d7a3d;
    }
    .comp-pdf-table-wrap { margin: 0 0 16px; border: 1px solid #dbeafe; border-radius: 4px; overflow: hidden; }
    .comp-pdf-table { width: 100%; border-collapse: collapse; margin: 0; font-size: 9pt; }
    .comp-pdf-table th, .comp-pdf-table td { border: 1px solid #e2e8f0; padding: 7px 8px; text-align: left; vertical-align: top; }
    .comp-pdf-table th { background: #0d7a3d; color: #fff; font-weight: 600; font-size: 8pt; text-transform: uppercase; }
    .comp-pdf-table tbody tr:nth-child(even) td { background: #f8fafc; }
    .comp-pdf-table .num { text-align: right; white-space: nowrap; }
    .comp-pdf-table .total-row td { background: #e8f5e9 !important; font-weight: 700; color: #0d7a3d; }
    .comp-pdf-receipt-page {
      page-break-before: always;
      break-before: page;
      margin-top: 8px;
    }
    .comp-pdf-receipt-meta {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
      gap: 6px 16px;
      margin-bottom: 12px;
      padding: 10px 12px;
      background: #f0fdf4;
      border: 1px solid #bbf7d0;
      border-radius: 6px;
      font-size: 9.5pt;
    }
    .comp-pdf-receipt-img {
      display: block;
      max-width: 100%;
      max-height: 240mm;
      width: auto;
      height: auto;
      margin: 0 auto;
      border: 1px solid #cbd5e1;
      border-radius: 4px;
    }
    .comp-pdf-receipt-noimg {
      padding: 24px;
      text-align: center;
      color: #64748b;
      background: #f8fafc;
      border: 1px dashed #cbd5e1;
      border-radius: 6px;
    }
    @media print {
      .comp-pdf-receipt-page { page-break-before: always; }
      .comp-pdf-receipt-img { max-height: 250mm; }
    }
  `

  return `<!DOCTYPE html>
<html lang="pt-PT">
<head>
  <meta charset="UTF-8">
  <title>${esc(titulo)} — ${esc(semana)}</title>
  <style>${style}</style>
</head>
<body>
  ${headerHtml}
  ${metaHtml}
  ${resumoTable}
  ${detalheTable}
  <h2 class="comp-pdf-section">${esc(labels.anexosTitulo)}</h2>
  ${anexosHtml}
  ${footerHtml}
</body>
</html>`
}

/** Abre janela de impressão com a folha semanal (Ctrl+P → Guardar como PDF). */
export function abrirFolhaSemanalContadorPdf(html: string): boolean {
  const w = window.open('', '_blank')
  if (!w) return false
  w.document.write(html)
  w.document.close()
  return true
}
