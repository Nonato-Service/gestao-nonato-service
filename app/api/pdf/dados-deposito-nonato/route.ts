import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import { getDemoContext } from '../../data/demo-context'
import {
  buildPdfDataCardSectionHtml,
  buildPdfHeaderForDoc,
  buildPdfHtmlDocument,
  buildPdfNoticeHtml,
  escapePdfHtml,
} from '../../../lib/pdfDocumentShell'
import { buildPdfDocumentFooterHtml } from '../../../lib/pdfDocumentLayout'
import { normalizePdfModelo } from '../../../lib/pdfModelTypes'

export const dynamic = 'force-dynamic'

type FichaCadastral = {
  nomeEmpresa?: string
  nif?: string
  nib?: string
  iban?: string
  swift?: string
  nomeBanco?: string
  telefone?: string
  email?: string
  morada?: string
  logo?: string
  pdfModelo?: string
}

function val(s: string | undefined): string {
  const t = String(s ?? '').trim()
  return t ? escapePdfHtml(t) : '—'
}

function buildDepositoHtml(data: FichaCadastral, isDemo: boolean): string {
  const model = normalizePdfModelo(data.pdfModelo)
  const titulo = 'Dados para depósito / transferência de pagamento'
  const subtitulo = 'Utilize os dados abaixo para efetuar o pagamento à Nonato Service.'
  const docRef = String(Date.now()).slice(-6)
  const dataGeracao = new Date().toLocaleString('pt-PT')

  const headerHtml = buildPdfHeaderForDoc({
    logo: data.logo,
    title: titulo,
    subtitle: subtitulo,
    reportNumber: docRef,
    badgeLabel: 'Ficha',
    model,
    docTheme: 'cadastro',
  })

  const bodyHtml = [
    buildPdfDataCardSectionHtml('Dados bancários', [
      { label: 'Banco', value: val(data.nomeBanco), hideIfEmpty: true },
      { label: 'NIB (conta nacional)', value: val(data.nib), highlight: true, hideIfEmpty: true },
      { label: 'IBAN (transferências internacionais)', value: val(data.iban), highlight: true, hideIfEmpty: true },
      { label: 'Código SWIFT / BIC', value: val(data.swift), highlight: true, hideIfEmpty: true },
      { label: 'NIF (titular da conta)', value: val(data.nif), hideIfEmpty: true },
    ]),
    buildPdfDataCardSectionHtml('Contacto', [
      { label: 'Morada', value: val(data.morada), hideIfEmpty: true },
      { label: 'Telefone', value: val(data.telefone), hideIfEmpty: true },
      { label: 'E-mail', value: val(data.email), hideIfEmpty: true },
    ]),
    buildPdfNoticeHtml(
      'Utilize exatamente os dados acima para efetuar o depósito ou transferência do seu pagamento. Em caso de dúvida, contacte-nos pelo telefone ou e-mail indicados.',
      'success'
    ),
  ].join('')

  const footerHtml = buildPdfDocumentFooterHtml(
    `Documento gerado em ${dataGeracao}${isDemo ? ' — Modo demonstração' : ''}.`
  )

  return buildPdfHtmlDocument({
    title: `${titulo} - ${val(data.nomeEmpresa) !== '—' ? val(data.nomeEmpresa) : 'Nonato Service'}`,
    lang: 'pt-PT',
    model,
    docTheme: 'cadastro',
    headerHtml,
    bodyHtml,
    footerHtml,
  })
}

export async function POST(request: NextRequest) {
  try {
    const { isDemo, expired } = getDemoContext(request)
    if (isDemo && expired) {
      return new NextResponse('Demonstração expirada.', { status: 403 })
    }
    let body: unknown
    try {
      body = await request.json()
    } catch {
      return new NextResponse('JSON inválido.', { status: 400 })
    }
    if (body === null || typeof body !== 'object' || Array.isArray(body)) {
      return new NextResponse('Corpo inválido.', { status: 400 })
    }
    const data = body as FichaCadastral
    const html = buildDepositoHtml(data, isDemo)
    return new NextResponse(html, {
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    })
  } catch (error: unknown) {
    console.error('Erro ao gerar PDF dados depósito (POST):', error)
    return new NextResponse('Erro ao gerar documento.', { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { isDemo, expired, dataDir } = getDemoContext(request)
    if (isDemo && expired) {
      return new NextResponse('Demonstração expirada.', { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const pdfModelo = searchParams.get('modelo') || undefined

    const filePath = path.join(dataDir, 'nonato-ficha-cadastral.json')
    let data: FichaCadastral = {}

    if (fs.existsSync(filePath)) {
      try {
        const raw = fs.readFileSync(filePath, 'utf-8')
        if (raw && raw.trim()) data = JSON.parse(raw) as FichaCadastral
      } catch {
        /* manter vazio */
      }
    }

    if (pdfModelo) data.pdfModelo = pdfModelo
    const html = buildDepositoHtml(data, isDemo)

    return new NextResponse(html, {
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    })
  } catch (error: unknown) {
    console.error('Erro ao gerar PDF dados depósito:', error)
    return new NextResponse('Erro ao gerar documento.', { status: 500 })
  }
}
