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
    titulo: 'CONFIRMAÇÃO DO ORÇAMENTO',
    resumoTitulo: 'Dados do documento',
    numOrcamento: 'Número do Orçamento',
    data: 'Data',
    cliente: 'Cliente',
    valorTotal: 'Valor Total',
    descricao: 'Descrição',
    rodape: 'Documento gerado em',
    badge: 'Orçamento',
    instrucoesPrint: 'Use Imprimir → Guardar como PDF.',
  },
  en: {
    titulo: 'QUOTE CONFIRMATION',
    resumoTitulo: 'Document details',
    numOrcamento: 'Quote Number',
    data: 'Date',
    cliente: 'Customer',
    valorTotal: 'Total Amount',
    descricao: 'Description',
    rodape: 'Document generated on',
    badge: 'Quote',
    instrucoesPrint: 'Use Print → Save as PDF.',
  },
  es: {
    titulo: 'CONFIRMACIÓN DEL PRESUPUESTO',
    resumoTitulo: 'Datos del documento',
    numOrcamento: 'Número del Presupuesto',
    data: 'Fecha',
    cliente: 'Cliente',
    valorTotal: 'Valor Total',
    descricao: 'Descripción',
    rodape: 'Documento generado el',
    badge: 'Presupuesto',
    instrucoesPrint: 'Use Imprimir → Guardar como PDF.',
  },
  fr: {
    titulo: 'CONFIRMATION DU DEVIS',
    resumoTitulo: 'Données du document',
    numOrcamento: 'Numéro du Devis',
    data: 'Date',
    cliente: 'Client',
    valorTotal: 'Montant Total',
    descricao: 'Description',
    rodape: 'Document généré le',
    badge: 'Devis',
    instrucoesPrint: 'Utilisez Imprimer → Enregistrer au format PDF.',
  },
  de: {
    titulo: 'ANGEBOTSBESTÄTIGUNG',
    resumoTitulo: 'Dokumentdaten',
    numOrcamento: 'Angebotsnummer',
    data: 'Datum',
    cliente: 'Kunde',
    valorTotal: 'Gesamtbetrag',
    descricao: 'Beschreibung',
    rodape: 'Dokument erstellt am',
    badge: 'Angebot',
    instrucoesPrint: 'Drucken → Als PDF speichern.',
  },
  it: {
    titulo: 'CONFERMA PREVENTIVO',
    resumoTitulo: 'Dati documento',
    numOrcamento: 'Numero Preventivo',
    data: 'Data',
    cliente: 'Cliente',
    valorTotal: 'Importo Totale',
    descricao: 'Descrizione',
    rodape: 'Documento generato il',
    badge: 'Preventivo',
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
    labels.titulo = `${labels.titulo} N.º ${orcamento.numeroOrcamento}`

    const html = buildOrcamentoConfirmacaoPdfHtml({
      kind: 'orcamento',
      labels,
      orcamento: {
        numeroOrcamento: String(orcamento.numeroOrcamento ?? ''),
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
