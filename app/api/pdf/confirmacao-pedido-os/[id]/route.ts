import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import { getDemoContext } from '../../../data/demo-context'
import { translationBundleKey } from '../../../../translations'
import { buildOrcamentoConfirmacaoPdfHtml } from '../../../../lib/pdfOrcamentoConfirmacao'
import { normalizePdfModelo } from '../../../../lib/pdfModelTypes'

export const dynamic = 'force-dynamic'

const TRANSLATIONS: Record<string, Record<string, string | string[]>> = {
  'pt-BR': {
    titulo: 'CONFIRMAÇÃO DE PEDIDO DA ORDEM DE SERVIÇO',
    resumoTitulo: 'Dados do documento',
    numOrcamento: 'Número do Orçamento',
    ordemServico: 'Ordem de Serviço',
    data: 'Data',
    cliente: 'Cliente',
    valorTotal: 'Valor Total',
    descricao: 'Descrição',
    rodape: 'Documento gerado em',
    badge: 'Pedido O.S.',
    instrucoesPrint: 'Use Imprimir → Guardar como PDF.',
  },
  en: {
    titulo: 'ORDER CONFIRMATION FOR SERVICE ORDER',
    resumoTitulo: 'Document details',
    numOrcamento: 'Quote Number',
    ordemServico: 'Service Order',
    data: 'Date',
    cliente: 'Customer',
    valorTotal: 'Total Amount',
    descricao: 'Description',
    rodape: 'Document generated on',
    badge: 'Service order',
    instrucoesPrint: 'Use Print → Save as PDF.',
  },
  es: {
    titulo: 'CONFIRMACIÓN DE PEDIDO DE LA ORDEN DE SERVICIO',
    resumoTitulo: 'Datos del documento',
    numOrcamento: 'Número del Presupuesto',
    ordemServico: 'Orden de Servicio',
    data: 'Fecha',
    cliente: 'Cliente',
    valorTotal: 'Valor Total',
    descricao: 'Descripción',
    rodape: 'Documento generado el',
    badge: 'Pedido O.S.',
    instrucoesPrint: 'Use Imprimir → Guardar como PDF.',
  },
  fr: {
    titulo: "CONFIRMATION DE COMMANDE DE L'ORDRE DE SERVICE",
    resumoTitulo: 'Données du document',
    numOrcamento: 'Numéro du Devis',
    ordemServico: 'Ordre de Service',
    data: 'Date',
    cliente: 'Client',
    valorTotal: 'Montant Total',
    descricao: 'Description',
    rodape: 'Document généré le',
    badge: 'Commande O.S.',
    instrucoesPrint: 'Utilisez Imprimer → Enregistrer au format PDF.',
  },
  de: {
    titulo: 'BESTÄTIGUNG DER BESTELLUNG FÜR SERVICEAUFTRAG',
    resumoTitulo: 'Dokumentdaten',
    numOrcamento: 'Angebotsnummer',
    ordemServico: 'Serviceauftrag',
    data: 'Datum',
    cliente: 'Kunde',
    valorTotal: 'Gesamtbetrag',
    descricao: 'Beschreibung',
    rodape: 'Dokument erstellt am',
    badge: 'Serviceauftrag',
    instrucoesPrint: 'Drucken → Als PDF speichern.',
  },
  it: {
    titulo: "CONFERMA ORDINE DELL'ORDINE DI SERVIZIO",
    resumoTitulo: 'Dati documento',
    numOrcamento: 'Numero Preventivo',
    ordemServico: 'Ordine di Servizio',
    data: 'Data',
    cliente: 'Cliente',
    valorTotal: 'Importo Totale',
    descricao: 'Descrizione',
    rodape: 'Documento generato il',
    badge: 'Ordine O.S.',
    instrucoesPrint: 'Usa Stampa → Salva come PDF.',
  },
}

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
    const lang = searchParams.get('lang') || 'pt-BR'
    const model = normalizePdfModelo(searchParams.get('modelo') || undefined)
    const orcamentoId = params.id

    const orcamentosPath = path.join(dataDir, 'nonato-orcamentos-avulso.json')
    if (!fs.existsSync(orcamentosPath)) {
      return new NextResponse('Orçamento não encontrado', { status: 404 })
    }

    const orcamentosData = JSON.parse(fs.readFileSync(orcamentosPath, 'utf-8'))
    const orcamento = Array.isArray(orcamentosData)
      ? orcamentosData.find((o: { id: string }) => o.id === orcamentoId)
      : null

    if (!orcamento) {
      return new NextResponse('Orçamento não encontrado', { status: 404 })
    }

    const bundle = translationBundleKey(lang)
    const labels = { ...(TRANSLATIONS[bundle] || TRANSLATIONS['pt-BR']) }
    labels.titulo = `${labels.titulo} ${orcamento.relatorioNumero || ''}`.trim()

    const html = buildOrcamentoConfirmacaoPdfHtml({
      kind: 'pedido-os',
      labels,
      orcamento: {
        numeroOrcamento: String(orcamento.numeroOrcamento ?? ''),
        relatorioNumero: orcamento.relatorioNumero,
        data: new Date(orcamento.data).toLocaleDateString('pt-BR'),
        clienteNome: orcamento.clienteNome,
        total: orcamento.total,
        descricao: orcamento.descricao,
      },
      model,
      isDemo,
      lang: bundle,
    })

    return new NextResponse(html, {
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    })
  } catch (error: unknown) {
    console.error('Erro ao gerar PDF:', error)
    return new NextResponse('Erro ao gerar documento', { status: 500 })
  }
}
