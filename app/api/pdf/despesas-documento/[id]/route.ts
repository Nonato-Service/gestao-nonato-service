import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import { getDemoContext } from '../../../data/demo-context'
import { translationBundleKey } from '../../../../translations'

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
        nonato: 'NONATO SERVICE'
      },
      'es': {
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
        nonato: 'NONATO SERVICE'
      },
      'fr': {
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
        nonato: 'NONATO SERVICE'
      },
      'it': {
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
        nonato: 'NONATO SERVICE'
      },
      'de': {
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
        nonato: 'NONATO SERVICE'
      },
      'en': {
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
        nonato: 'NONATO SERVICE'
      }
    }
    const labels = t[lang] || t['pt-BR']

    const esc = (s: string) =>
      String(s || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')

    const totalGeral = (doc.despesas || []).reduce((s: number, d: any) => s + (d.valor || 0), 0)
    const totaisPorCartao: Record<string, number> = {}
    for (const d of doc.despesas || []) {
      const rot = String(d.cartaoRotulo || '').trim() || labels.semCartao
      totaisPorCartao[rot] = (totaisPorCartao[rot] || 0) + (Number(d.valor) || 0)
    }
    const dataFormatada = new Date().toLocaleString('pt-BR')

    const despesasHtml = (doc.despesas || []).map((d: any, i: number) => {
      const fotosHtml = (d.fotos || []).map((f: string) =>
        `<img src="${f}" alt="Comprovante" style="max-width: 100%; max-height: 200px; margin: 4px; border: 1px solid #ddd; border-radius: 4px;" />`
      ).join('')
      const cartaoCell = esc(String(d.cartaoRotulo || '').trim()) || '—'
      return `
        <tr>
          <td>${i + 1}</td>
          <td>${d.tipoNome || '-'}</td>
          <td style="font-size:9pt;white-space:nowrap;">${cartaoCell}</td>
          <td>€ ${(d.valor || 0).toFixed(2)}</td>
          <td>${(d.descricao || '').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</td>
          <td>${d.codigoBarras || '-'}</td>
        </tr>
        ${d.fotos?.length ? `
        <tr>
          <td colspan="6" style="padding: 12px; background: #f9f9f9;">
            <strong>${labels.comprovantes}:</strong><br/>
            <div style="margin-top: 8px; display: flex; flex-wrap: wrap; gap: 8px;">${fotosHtml}</div>
          </td>
        </tr>
        ` : ''}
      `
    }).join('')

    const totaisCartaoHtml = Object.entries(totaisPorCartao)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(
        ([rotulo, tot]) => `
      <tr>
        <td style="padding:8px 12px;border:1px solid #ccc;">${esc(rotulo)}</td>
        <td style="padding:8px 12px;border:1px solid #ccc;font-weight:600;">€ ${tot.toFixed(2)}</td>
      </tr>`
      )
      .join('')

    const html = `<!DOCTYPE html>
<html lang="${langRaw}">
<head>
  <meta charset="UTF-8">
  <title>${labels.titulo} - ${doc.clienteNome}</title>
  <style>
    * { box-sizing: border-box; }
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 20px; color: #1a1a1a; line-height: 1.5; font-size: 11pt; }
    .header { background: linear-gradient(135deg, #000 0%, #1a2a1a 50%, #0d1a0d 100%); border-bottom: 3px solid #00ff00; padding: 20px 24px; text-align: center; }
    .header h1 { margin: 0; font-size: 22pt; font-weight: 700; color: #00ff00; letter-spacing: 2px; }
    .header .subtitle { margin: 6px 0 0 0; font-size: 11pt; color: rgba(255,255,255,0.9); }
    .info-block { background: #f5f5f5; padding: 16px 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #00ff00; }
    .info-block strong { color: #006600; }
    table { width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 10pt; }
    th, td { border: 1px solid #ccc; padding: 10px 12px; text-align: left; }
    th { background: #e8f5e8; color: #1a5a1a; font-weight: 600; }
    .total-row { background: #e8f5e8; font-weight: bold; font-size: 12pt; }
    .footer { margin-top: 30px; text-align: center; font-size: 9pt; color: #666; padding: 12px; border-top: 1px solid #ddd; }
    @media print { .header { position: fixed; top: 0; left: 0; right: 0; } body { padding-top: 100px; } }
  </style>
</head>
<body>
  <header class="header">
    <h1>${labels.titulo}</h1>
    <p class="subtitle">${labels.subtitulo} — ${labels.nonato}</p>
  </header>

  <div class="info-block">
    <p><strong>${labels.cliente}:</strong> ${doc.clienteNome}</p>
    ${doc.relatorioNumero ? `<p><strong>${labels.relatorio}:</strong> ${doc.relatorioNumero}</p>` : ''}
    <p><strong>${labels.data}:</strong> ${new Date(doc.data || doc.dataCriacao).toLocaleDateString('pt-BR')}</p>
  </div>

  <table>
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
        <td>€ ${totalGeral.toFixed(2)}</td>
        <td colspan="2"></td>
      </tr>
    </tbody>
  </table>

  <div class="info-block" style="margin-top:16px;">
    <p style="margin:0 0 8px;font-weight:700;color:#006600;">${labels.totalPorCartao}</p>
    <table style="margin:0;max-width:520px;">
      <tbody>${totaisCartaoHtml}</tbody>
    </table>
  </div>

  <div class="footer">
    <p>${labels.rodape} ${dataFormatada} — ${labels.nonato}${isDemo ? ' — DEMO' : ''}</p>
  </div>
</body>
</html>`

    return new NextResponse(html, {
      headers: { 'Content-Type': 'text/html; charset=utf-8' }
    })
  } catch (error: any) {
    console.error('Erro ao gerar PDF despesas:', error)
    return new NextResponse('Erro ao gerar documento', { status: 500 })
  }
}
