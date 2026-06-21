import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import { getDemoContext } from '../../../data/demo-context'
import { translationBundleKey } from '../../../../translations'
import {
  PDF_DOCUMENT_LAYOUT_CSS,
  buildPdfDocumentFooterHtml,
  buildPdfDocumentHeaderHtml,
  buildPdfMetaSectionHtml,
  escapePdfHtml,
} from '../../../../lib/pdfDocumentLayout'

export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { isDemo, expired, dataDir } = getDemoContext(request)
    if (isDemo && expired) {
      return new NextResponse('Demonstração expirada.', { status: 403 })
    }
    const { searchParams } = new URL(request.url)
    const langRaw = searchParams.get('lang') || 'pt-BR'
    const lang = translationBundleKey(langRaw)
    const docId = params.id

    const filePath = path.join(dataDir, 'nonato-despesas-documentos.json')
    if (!fs.existsSync(filePath)) {
      return new NextResponse('Documento não encontrado', { status: 404 })
    }

    const content = fs.readFileSync(filePath, 'utf-8')
    const documentos = JSON.parse(content || '[]')
    const doc = Array.isArray(documentos) ? documentos.find((d: any) => d.id === docId) : null

    if (!doc) {
      return new NextResponse('Documento não encontrado', { status: 404 })
    }

    const t: Record<string, Record<string, string>> = {
      'pt-BR': {
        titulo: 'REGISTRO DE DESPESAS',
        subtitulo: 'Documento para envio',
        cliente: 'Cliente',
        relatorio: 'Relatório de Serviço',
        data: 'Data',
        tipo: 'Tipo',
        cartao: 'Cartão',
        semCartao: 'Não especificado',
        valor: 'Valor',
        descricao: 'Descrição',
        codigoBarras: 'Código de Barras',
        comprovantes: 'Comprovantes',
        total: 'Total',
        totalPorCartao: 'Conferência por cartão (soma das linhas)',
        rodape: 'Documento gerado em',
        nonato: 'NONATO SERVICE',
        badge: 'Documento',
      },
      es: {
        titulo: 'REGISTRO DE GASTOS PAGADOS CON TARJETA PARA DECLARACIÓN DEL IRPF',
        subtitulo: 'Documento para envío / IRPF',
        cliente: 'Cliente',
        relatorio: 'Informe de servicio',
        data: 'Fecha',
        tipo: 'Tipo',
        cartao: 'Tarjeta',
        semCartao: 'No especificado',
        valor: 'Importe',
        descricao: 'Descripción',
        codigoBarras: 'Código de barras',
        comprovantes: 'Justificantes',
        total: 'Total',
        totalPorCartao: 'Totales por tarjeta',
        rodape: 'Documento generado el',
        nonato: 'NONATO SERVICE',
        badge: 'Documento',
      },
      fr: {
        titulo: 'REGISTRE DES DÉPENSES',
        subtitulo: "Document d'envoi",
        cliente: 'Client',
        relatorio: 'Rapport de service',
        data: 'Date',
        tipo: 'Type',
        cartao: 'Carte',
        semCartao: 'Non spécifié',
        valor: 'Montant',
        descricao: 'Description',
        codigoBarras: 'Code-barres',
        comprovantes: 'Justificatifs',
        total: 'Total',
        totalPorCartao: 'Totaux par carte',
        rodape: 'Document généré le',
        nonato: 'NONATO SERVICE',
        badge: 'Document',
      },
      it: {
        titulo: 'REGISTRO SPESE',
        subtitulo: 'Documento per invio',
        cliente: 'Cliente',
        relatorio: 'Rapporto di servizio',
        data: 'Data',
        tipo: 'Tipo',
        cartao: 'Carta',
        semCartao: 'Non specificato',
        valor: 'Importo',
        descricao: 'Descrizione',
        codigoBarras: 'Codice a barre',
        comprovantes: 'Giustificativi',
        total: 'Totale',
        totalPorCartao: 'Totali per carta',
        rodape: 'Documento generato il',
        nonato: 'NONATO SERVICE',
        badge: 'Documento',
      },
      de: {
        titulo: 'KARTENZAHLUNGEN FÜR DIE STEUERERKLÄRUNG (AUSGABEN)',
        subtitulo: 'Dokument zur Übergabe / Steuer',
        cliente: 'Kunde',
        relatorio: 'Servicebericht',
        data: 'Datum',
        tipo: 'Typ',
        cartao: 'Karte',
        semCartao: 'Nicht angegeben',
        valor: 'Betrag',
        descricao: 'Beschreibung',
        codigoBarras: 'Barcode',
        comprovantes: 'Belege',
        total: 'Gesamt',
        totalPorCartao: 'Summen pro Karte',
        rodape: 'Dokument erstellt am',
        nonato: 'NONATO SERVICE',
        badge: 'Dokument',
      },
      en: {
        titulo: 'EXPENSE RECORD',
        subtitulo: 'Document for submission',
        cliente: 'Customer',
        relatorio: 'Service Report',
        data: 'Date',
        tipo: 'Type',
        cartao: 'Card',
        semCartao: 'Not specified',
        valor: 'Amount',
        descricao: 'Description',
        codigoBarras: 'Barcode',
        comprovantes: 'Attachments',
        total: 'Total',
        totalPorCartao: 'Totals per card (line sum check)',
        rodape: 'Document generated on',
        nonato: 'NONATO SERVICE',
        badge: 'Document',
      },
    }
    const labels = t[lang] || t['pt-BR']

    const esc = escapePdfHtml

    const totalGeral = (doc.despesas || []).reduce((s: number, d: any) => s + (d.valor || 0), 0)
    const totaisPorCartao: Record<string, number> = {}
    for (const d of doc.despesas || []) {
      const rot = String(d.cartaoRotulo || '').trim() || labels.semCartao
      totaisPorCartao[rot] = (totaisPorCartao[rot] || 0) + (Number(d.valor) || 0)
    }
    const dataFormatada = new Date().toLocaleString('pt-BR')
    const docData = new Date(doc.data || doc.dataCriacao).toLocaleDateString('pt-BR')
    const docRef = String(doc.id || '').slice(-8).toUpperCase()

    const despesasHtml = (doc.despesas || []).map((d: any, i: number) => {
      const fotosHtml = (d.fotos || []).map((f: string) =>
        `<img src="${f}" alt="Comprovante" class="desp-pdf-thumb" />`
      ).join('')
      const cartaoCell = esc(String(d.cartaoRotulo || '').trim()) || '—'
      return `
        <tr>
          <td>${i + 1}</td>
          <td>${esc(d.tipoNome || '-')}</td>
          <td class="nowrap">${cartaoCell}</td>
          <td class="num">€ ${(d.valor || 0).toFixed(2)}</td>
          <td>${esc(d.descricao || '-')}</td>
          <td>${esc(d.codigoBarras || '-')}</td>
        </tr>
        ${d.fotos?.length ? `
        <tr class="desp-pdf-attach-row">
          <td colspan="6">
            <strong>${labels.comprovantes}:</strong>
            <div class="desp-pdf-attach-grid">${fotosHtml}</div>
          </td>
        </tr>
        ` : ''}`
    }).join('')

    const totaisCartaoHtml = Object.entries(totaisPorCartao)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(
        ([rotulo, tot]) => `
      <tr>
        <th scope="row">${esc(rotulo)}</th>
        <td class="num">€ ${tot.toFixed(2)}</td>
      </tr>`
      )
      .join('')

    const headerHtml = buildPdfDocumentHeaderHtml({
      logoContent: labels.nonato,
      title: labels.titulo,
      reportNumber: docRef,
      subtitle: `${labels.subtitulo} · ${labels.nonato}`,
      badgeLabel: labels.badge,
      theme: 'expense',
      variant: 'detailed',
    })

    const metaHtml = buildPdfMetaSectionHtml({
      title: labels.subtitulo,
      modifier: 'expense',
      fields: [
        { label: labels.cliente, value: esc(doc.clienteNome || '—') },
        { label: labels.data, value: esc(docData) },
        ...(doc.relatorioNumero
          ? [{ label: labels.relatorio, value: esc(doc.relatorioNumero), fullWidth: String(doc.relatorioNumero).length > 36 }]
          : []),
        { label: labels.total, value: `€ ${totalGeral.toFixed(2)}` },
      ],
    })

    const footerHtml = buildPdfDocumentFooterHtml(
      `${labels.rodape} ${dataFormatada} — ${labels.nonato}${isDemo ? ' — DEMO' : ''}`
    )

    const html = `<!DOCTYPE html>
<html lang="${langRaw}">
<head>
  <meta charset="UTF-8">
  <title>${labels.titulo} - ${esc(doc.clienteNome || '')}</title>
  <style>
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
    .desp-pdf-table-wrap { margin: 0 0 18px; border: 1px solid #dbeafe; border-radius: 4px; overflow: hidden; }
    table.desp-pdf-table { width: 100%; border-collapse: collapse; margin: 0; font-size: 9.5pt; }
    .desp-pdf-table th, .desp-pdf-table td { border: 1px solid #e2e8f0; padding: 9px 10px; text-align: left; vertical-align: top; }
    .desp-pdf-table th { background: #0d7a3d; color: #fff; font-weight: 600; font-size: 8.5pt; text-transform: uppercase; letter-spacing: 0.04em; }
    .desp-pdf-table tbody tr:nth-child(even):not(.desp-pdf-attach-row) td { background: #f8fafc; }
    .desp-pdf-table .num, .desp-pdf-table .nowrap { white-space: nowrap; }
    .desp-pdf-table .num { text-align: right; }
    .desp-pdf-table .total-row td { background: #e8f5e9 !important; font-weight: 700; color: #0d7a3d; }
    .desp-pdf-attach-row td { background: #fafafa !important; padding: 12px 14px !important; }
    .desp-pdf-attach-grid { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 8px; }
    .desp-pdf-thumb { max-width: 180px; max-height: 180px; border: 1px solid #ddd; border-radius: 4px; object-fit: contain; background: #fff; }
    .desp-pdf-card { margin-top: 8px; }
    .desp-pdf-card table { width: 100%; max-width: 420px; border-collapse: collapse; font-size: 9.5pt; }
    .desp-pdf-card th, .desp-pdf-card td { border: 1px solid #c8e6c9; padding: 8px 10px; text-align: left; }
    .desp-pdf-card th { background: #f1f8e9; color: #2e7d32; font-size: 8pt; text-transform: uppercase; }
    .desp-pdf-card td.num { text-align: right; font-weight: 600; }
  </style>
</head>
<body>
  ${headerHtml}
  ${metaHtml}

  <div class="desp-pdf-table-wrap">
    <table class="desp-pdf-table">
      <thead>
        <tr>
          <th>#</th>
          <th>${labels.tipo}</th>
          <th>${labels.cartao}</th>
          <th>${labels.valor}</th>
          <th>${labels.descricao}</th>
          <th>${labels.codigoBarras}</th>
        </tr>
      </thead>
      <tbody>
        ${despesasHtml}
        <tr class="total-row">
          <td colspan="3">${labels.total}</td>
          <td class="num">€ ${totalGeral.toFixed(2)}</td>
          <td colspan="2"></td>
        </tr>
      </tbody>
    </table>
  </div>

  <section class="ns-pdf-meta ns-pdf-meta--expense desp-pdf-card">
    <h2 class="ns-pdf-meta__title">${labels.totalPorCartao}</h2>
    <table role="presentation">
      <tbody>${totaisCartaoHtml}</tbody>
    </table>
  </section>

  ${footerHtml}
</body>
</html>`

    return new NextResponse(html, {
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    })
  } catch (error: any) {
    console.error('Erro ao gerar PDF despesas:', error)
    return new NextResponse('Erro ao gerar documento', { status: 500 })
  }
}
