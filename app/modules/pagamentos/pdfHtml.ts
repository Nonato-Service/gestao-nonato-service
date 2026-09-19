/** HTML de impressão de PAGAMENTOS — sem I/O. */

import { escapePdfHtml } from '../pdf/documentShell'
import { somarValorPagamentos } from './resumo'
import type { PagamentoMetodo, PagamentoSaida } from './tipos'

export type PagamentosPdfLabels = {
  title: string
  instituicao: string
  data: string
  paraQuem: string
  metodo: string
  entidade: string
  referencia: string
  iban: string
  contribuinte: string
  valor: string
  estado: string
  aPagar: string
  pago: string
  total: string
  print: string
  close: string
}

export function buildPagamentosPdfHtml(opts: {
  titulo: string
  instituicaoNome: string
  itens: PagamentoSaida[]
  labels: PagamentosPdfLabels
  formatarData: (data: string) => string
  formatarValor: (n: number) => string
  metodoLabel: (m: PagamentoMetodo) => string
}): string {
  const itens = Array.isArray(opts.itens) ? opts.itens : []
  const total = somarValorPagamentos(itens, false)
  const rows = itens
    .map((p) => {
      const extra = [
        p.entidade ? `${opts.labels.entidade}: ${p.entidade}` : '',
        p.referencia ? `${opts.labels.referencia}: ${p.referencia}` : '',
        p.iban ? `${opts.labels.iban}: ${p.iban}` : '',
        p.contribuinte ? `${opts.labels.contribuinte}: ${p.contribuinte}` : '',
      ]
        .filter(Boolean)
        .join(' · ')
      return `<tr>
        <td>${escapePdfHtml(opts.formatarData(p.dataPagamento))}</td>
        <td>${escapePdfHtml(p.paraQuem || p.empresaNome || '')}${extra ? `<div class="ns-pag-pdf-extra">${escapePdfHtml(extra)}</div>` : ''}</td>
        <td>${escapePdfHtml(opts.metodoLabel(p.metodo))}</td>
        <td>${escapePdfHtml(p.status === 'pago' ? opts.labels.pago : opts.labels.aPagar)}</td>
        <td class="ns-pag-pdf-num">${escapePdfHtml(opts.formatarValor(p.valor))}</td>
      </tr>`
    })
    .join('')

  return `<!DOCTYPE html>
<html lang="pt">
<head>
  <meta charset="utf-8" />
  <title>${escapePdfHtml(opts.titulo)}</title>
  <style>
    * { box-sizing: border-box; }
    @page { size: A4 portrait; margin: 12mm; }
    body { font-family: 'Segoe UI', Tahoma, sans-serif; margin: 0; padding: 18px 20px; color: #1a1a1a; font-size: 11pt; }
    h1 { font-size: 18px; margin: 0 0 6px; }
    h2 { font-size: 13px; margin: 0 0 14px; color: #444; font-weight: 600; }
    table { width: 100%; border-collapse: collapse; }
    th, td { border-bottom: 1px solid #ddd; padding: 8px 6px; text-align: left; vertical-align: top; }
    th { font-size: 11px; text-transform: uppercase; color: #555; }
    .ns-pag-pdf-num { text-align: right; font-weight: 700; white-space: nowrap; }
    .ns-pag-pdf-extra { font-size: 11px; color: #555; margin-top: 4px; }
    .ns-pag-pdf-total { margin-top: 14px; display: flex; justify-content: space-between; font-size: 15px; font-weight: 700; }
    .ns-pdf-no-print { margin-bottom: 16px; display: flex; gap: 8px; }
    .ns-pdf-no-print button { padding: 8px 14px; border: 0; border-radius: 6px; cursor: pointer; font-weight: 600; }
    .ns-pdf-no-print button:first-child { background: #0d7a3d; color: #fff; }
    .ns-pdf-no-print button:last-child { background: #334155; color: #fff; }
    @media print { .ns-pdf-no-print { display: none !important; } }
  </style>
</head>
<body>
  <div class="ns-pdf-no-print">
    <button type="button" onclick="window.print()">${escapePdfHtml(opts.labels.print)}</button>
    <button type="button" onclick="window.close()">${escapePdfHtml(opts.labels.close)}</button>
  </div>
  <h1>${escapePdfHtml(opts.titulo)}</h1>
  <h2>${escapePdfHtml(opts.labels.instituicao)}: ${escapePdfHtml(opts.instituicaoNome)}</h2>
  <table>
    <thead>
      <tr>
        <th>${escapePdfHtml(opts.labels.data)}</th>
        <th>${escapePdfHtml(opts.labels.paraQuem)}</th>
        <th>${escapePdfHtml(opts.labels.metodo)}</th>
        <th>${escapePdfHtml(opts.labels.estado)}</th>
        <th class="ns-pag-pdf-num">${escapePdfHtml(opts.labels.valor)}</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>
  <div class="ns-pag-pdf-total">
    <span>${escapePdfHtml(opts.labels.total)}</span>
    <span>${escapePdfHtml(opts.formatarValor(total))}</span>
  </div>
</body>
</html>`
}
