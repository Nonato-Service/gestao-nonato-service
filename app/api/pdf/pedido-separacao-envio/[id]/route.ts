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
    titulo: 'PEDIDO DE SEPARAÇÃO E ENVIO AO CLIENTE',
    resumoTitulo: 'Dados do envio',
    numOrcamento: 'Número do Orçamento',
    data: 'Data',
    cliente: 'Cliente',
    endereco: 'Endereço',
    telefone: 'Telefone',
    valorTotal: 'Valor Total',
    descricao: 'Descrição',
    instrucoes: 'INSTRUÇÕES DE SEPARAÇÃO E ENVIO',
    instrucoesLista: [
      '1. Verificar itens do orçamento',
      '2. Separar peças/equipamentos conforme especificado',
      '3. Embalar adequadamente',
      '4. Preparar documentação de envio',
      '5. Encaminhar para expedição',
    ],
    rodape: 'Documento gerado em',
    badge: 'Separação',
    instrucoesPrint: 'Use Imprimir → Guardar como PDF.',
  },
  en: {
    titulo: 'SEPARATION AND SHIPPING REQUEST TO CUSTOMER',
    resumoTitulo: 'Shipping details',
    numOrcamento: 'Quote Number',
    data: 'Date',
    cliente: 'Customer',
    endereco: 'Address',
    telefone: 'Phone',
    valorTotal: 'Total Amount',
    descricao: 'Description',
    instrucoes: 'SEPARATION AND SHIPPING INSTRUCTIONS',
    instrucoesLista: [
      '1. Check quote items',
      '2. Separate parts/equipment as specified',
      '3. Package appropriately',
      '4. Prepare shipping documentation',
      '5. Forward to shipping',
    ],
    rodape: 'Document generated on',
    badge: 'Shipping',
    instrucoesPrint: 'Use Print → Save as PDF.',
  },
  es: {
    titulo: 'SOLICITUD DE SEPARACIÓN Y ENVÍO AL CLIENTE',
    resumoTitulo: 'Datos del envío',
    numOrcamento: 'Número del Presupuesto',
    data: 'Fecha',
    cliente: 'Cliente',
    endereco: 'Dirección',
    telefone: 'Teléfono',
    valorTotal: 'Valor Total',
    descricao: 'Descripción',
    instrucoes: 'INSTRUCCIONES DE SEPARACIÓN Y ENVÍO',
    instrucoesLista: [
      '1. Verificar artículos del presupuesto',
      '2. Separar piezas/equipos según especificado',
      '3. Embalar adecuadamente',
      '4. Preparar documentación de envío',
      '5. Enviar a expedición',
    ],
    rodape: 'Documento generado el',
    badge: 'Envío',
    instrucoesPrint: 'Use Imprimir → Guardar como PDF.',
  },
  fr: {
    titulo: "DEMANDE DE SÉPARATION ET D'EXPÉDITION AU CLIENT",
    resumoTitulo: "Données d'expédition",
    numOrcamento: 'Numéro du Devis',
    data: 'Date',
    cliente: 'Client',
    endereco: 'Adresse',
    telefone: 'Téléphone',
    valorTotal: 'Montant Total',
    descricao: 'Description',
    instrucoes: "INSTRUCTIONS DE SÉPARATION ET D'EXPÉDITION",
    instrucoesLista: [
      "1. Vérifier les articles du devis",
      "2. Séparer les pièces/équipements selon les spécifications",
      '3. Emballer correctement',
      "4. Préparer la documentation d'expédition",
      "5. Transmettre à l'expédition",
    ],
    rodape: 'Document généré le',
    badge: 'Expédition',
    instrucoesPrint: 'Utilisez Imprimer → Enregistrer au format PDF.',
  },
  de: {
    titulo: 'ANFRAGE FÜR TRENNUNG UND VERSAND AN DEN KUNDEN',
    resumoTitulo: 'Versanddaten',
    numOrcamento: 'Angebotsnummer',
    data: 'Datum',
    cliente: 'Kunde',
    endereco: 'Adresse',
    telefone: 'Telefon',
    valorTotal: 'Gesamtbetrag',
    descricao: 'Beschreibung',
    instrucoes: 'ANWEISUNGEN FÜR TRENNUNG UND VERSAND',
    instrucoesLista: [
      '1. Angebotsposten überprüfen',
      '2. Teile/Ausrüstung wie angegeben trennen',
      '3. Angemessen verpacken',
      '4. Versanddokumentation vorbereiten',
      '5. An Versand weiterleiten',
    ],
    rodape: 'Dokument erstellt am',
    badge: 'Versand',
    instrucoesPrint: 'Drucken → Als PDF speichern.',
  },
  it: {
    titulo: 'RICHIESTA DI SEPARAZIONE E SPEDIZIONE AL CLIENTE',
    resumoTitulo: 'Dati spedizione',
    numOrcamento: 'Numero Preventivo',
    data: 'Data',
    cliente: 'Cliente',
    endereco: 'Indirizzo',
    telefone: 'Telefono',
    valorTotal: 'Importo Totale',
    descricao: 'Descrizione',
    instrucoes: 'ISTRUZIONI DI SEPARAZIONE E SPEDIZIONE',
    instrucoesLista: [
      '1. Verificare gli articoli del preventivo',
      '2. Separare parti/attrezzature come specificato',
      '3. Imballare adeguatamente',
      '4. Preparare la documentazione di spedizione',
      '5. Inoltrare alla spedizione',
    ],
    rodape: 'Documento generato il',
    badge: 'Spedizione',
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

    const html = buildOrcamentoConfirmacaoPdfHtml({
      kind: 'separacao-envio',
      labels,
      orcamento: {
        numeroOrcamento: String(orcamento.numeroOrcamento ?? ''),
        data: new Date(orcamento.data).toLocaleDateString('pt-BR'),
        clienteNome: orcamento.clienteNome,
        total: orcamento.total,
        descricao: orcamento.descricao,
        dadosCliente: orcamento.dadosCliente,
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
