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

type DadosFaturaNonato = {
  nomeEmpresa?: string
  nif?: string
  morada?: string
  telefone?: string
  email?: string
  logo?: string
  pdfModelo?: string
}

function val(s: string | undefined): string {
  const t = String(s ?? '').trim()
  return t ? escapePdfHtml(t) : '—'
}

function buildFaturaHtml(data: DadosFaturaNonato, isDemo: boolean): string {
  const model = normalizePdfModelo(data.pdfModelo)
  const titulo = 'Dados para emissão de fatura à Nonato Service'
  const subtitulo =
    'Documento mínimo para o seu cliente emitir fatura com os dados fiscais da empresa prestadora. Não inclui dados bancários.'
  const docRef = String(Date.now()).slice(-6)
  const dataGeracao = new Date().toLocaleString('pt-PT')

  const headerHtml = buildPdfHeaderForDoc({
    logo: data.logo,
    title: titulo,
    subtitle: subtitulo,
    reportNumber: docRef,
    badgeLabel: 'Ficha fiscal',
    model,
    docTheme: 'billing',
  })

  const bodyHtml = [
    buildPdfDataCardSectionHtml('Identificação fiscal e contacto', [
      { label: 'Nome / denominação social', value: val(data.nomeEmpresa) },
      { label: 'NIF (contribuinte)', value: val(data.nif) },
      { label: 'Morada', value: val(data.morada), hideIfEmpty: true },
      { label: 'Telefone', value: val(data.telefone), hideIfEmpty: true },
      { label: 'E-mail', value: val(data.email), hideIfEmpty: true },
    ]),
    buildPdfNoticeHtml(
      'Este documento destina-se apenas à identificação da empresa para faturação. Não contém NIB, IBAN nem outros dados bancários.',
      'info'
    ),
  ].join('')

  const footerHtml = buildPdfDocumentFooterHtml(
    `Documento gerado em ${dataGeracao}${isDemo ? ' — Modo demonstração' : ''}.`
  )

  return buildPdfHtmlDocument({
    title: titulo,
    lang: 'pt-PT',
    model,
    docTheme: 'billing',
    headerHtml,
    bodyHtml,
    footerHtml,
  })
}

function pickFaturaPayload(body: unknown): DadosFaturaNonato {
  if (body === null || typeof body !== 'object' || Array.isArray(body)) return {}
  const o = body as Record<string, unknown>
  return {
    nomeEmpresa: typeof o.nomeEmpresa === 'string' ? o.nomeEmpresa : undefined,
    nif: typeof o.nif === 'string' ? o.nif : undefined,
    morada: typeof o.morada === 'string' ? o.morada : undefined,
    telefone: typeof o.telefone === 'string' ? o.telefone : undefined,
    email: typeof o.email === 'string' ? o.email : undefined,
    logo: typeof o.logo === 'string' ? o.logo : undefined,
    pdfModelo: typeof o.pdfModelo === 'string' ? o.pdfModelo : undefined,
  }
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
    const data = pickFaturaPayload(body)
    const html = buildFaturaHtml(data, isDemo)
    return new NextResponse(html, {
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    })
  } catch (error: unknown) {
    console.error('Erro ao gerar PDF dados fatura (POST):', error)
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
    let full: Record<string, unknown> = {}

    if (fs.existsSync(filePath)) {
      try {
        const raw = fs.readFileSync(filePath, 'utf-8')
        if (raw && raw.trim()) full = JSON.parse(raw) as Record<string, unknown>
      } catch {
        /* manter vazio */
      }
    }

    const data: DadosFaturaNonato = {
      nomeEmpresa: typeof full.nomeEmpresa === 'string' ? full.nomeEmpresa : undefined,
      nif: typeof full.nif === 'string' ? full.nif : undefined,
      morada: typeof full.morada === 'string' ? full.morada : undefined,
      telefone: typeof full.telefone === 'string' ? full.telefone : undefined,
      email: typeof full.email === 'string' ? full.email : undefined,
      logo: typeof full.logo === 'string' ? full.logo : undefined,
      pdfModelo,
    }

    const html = buildFaturaHtml(data, isDemo)

    return new NextResponse(html, {
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    })
  } catch (error: unknown) {
    console.error('Erro ao gerar PDF dados fatura:', error)
    return new NextResponse('Erro ao gerar documento.', { status: 500 })
  }
}
