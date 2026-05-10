import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import { getDemoContext } from '../../data/demo-context'

export const dynamic = 'force-dynamic'

type DadosFaturaNonato = {
  nomeEmpresa?: string
  nif?: string
  morada?: string
  telefone?: string
  email?: string
  logo?: string
}

function escapeHtml(s: string | undefined): string {
  if (s == null || s === '') return '—'
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function buildFaturaHtml(data: DadosFaturaNonato, isDemo: boolean): string {
  const nomeEmpresa = escapeHtml(data.nomeEmpresa)
  const nif = escapeHtml(data.nif)
  const morada = escapeHtml(data.morada)
  const telefone = escapeHtml(data.telefone)
  const email = escapeHtml(data.email)
  const logo = data.logo && data.logo.startsWith('data:') ? data.logo : ''

  const titulo = 'Dados para emissão de fatura à Nonato Service'
  const subtitulo =
    'Documento mínimo para o seu cliente emitir fatura com os dados fiscais da empresa prestadora. Não inclui dados bancários.'
  const rodape = `Documento gerado em ${new Date().toLocaleString('pt-PT')}${isDemo ? ' — Modo demonstração' : ''}.`

  return `
<!DOCTYPE html>
<html lang="pt-PT">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${titulo}</title>
  <style>
    @media print {
      body { margin: 0; padding: 16px; }
      .no-print { display: none !important; }
    }
    * { box-sizing: border-box; }
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      margin: 0;
      padding: 24px;
      color: #1a1a1a;
      background: #fff;
      line-height: 1.5;
      max-width: 640px;
      margin-left: auto;
      margin-right: auto;
    }
    .no-print {
      margin-bottom: 20px;
      display: flex;
      gap: 10px;
      align-items: center;
    }
    .no-print button {
      padding: 10px 20px;
      font-size: 14px;
      background: #1565c0;
      color: #fff;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      font-weight: 600;
    }
    .no-print button:hover { background: #0d47a1; }
    .no-print .secondary {
      background: #333;
    }
    .no-print .secondary:hover { background: #555; }
    .header {
      text-align: center;
      margin-bottom: 28px;
      padding-bottom: 20px;
      border-bottom: 2px solid #1565c0;
    }
    .header img {
      max-width: 180px;
      max-height: 80px;
      object-fit: contain;
      margin-bottom: 12px;
    }
    .header h1 {
      margin: 0 0 6px 0;
      font-size: 22px;
      color: #1565c0;
      font-weight: 700;
    }
    .header p {
      margin: 0;
      font-size: 14px;
      color: #555;
    }
    .section-title {
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #666;
      margin-bottom: 10px;
      font-weight: 600;
    }
    .card {
      background: #f8f9fa;
      border: 1px solid #e0e0e0;
      border-radius: 10px;
      padding: 18px 20px;
    }
    .row {
      margin-bottom: 14px;
    }
    .row:last-child { margin-bottom: 0; }
    .field-label {
      font-size: 11px;
      color: #666;
      text-transform: uppercase;
      letter-spacing: 0.03em;
      margin-bottom: 4px;
    }
    .field-value {
      font-size: 15px;
      font-weight: 600;
      color: #1a1a1a;
      word-break: break-word;
    }
    .notice {
      background: #e3f2fd;
      border-left: 4px solid #1565c0;
      padding: 14px 16px;
      margin-top: 24px;
      font-size: 13px;
      color: #0d47a1;
      border-radius: 0 8px 8px 0;
    }
    .footer {
      margin-top: 32px;
      padding-top: 16px;
      border-top: 1px solid #eee;
      text-align: center;
      font-size: 11px;
      color: #888;
    }
  </style>
</head>
<body>
  <div class="no-print">
    <button type="button" onclick="window.print()">Imprimir / Guardar como PDF</button>
    <button type="button" class="secondary" onclick="window.close()">Fechar</button>
  </div>

  <div class="header">
    ${logo ? `<img src="${logo}" alt="Logo" />` : ''}
    <h1>${nomeEmpresa !== '—' ? nomeEmpresa : 'Nonato Service'}</h1>
    <p>${subtitulo}</p>
  </div>

  <div class="section-title">Identificação fiscal e contacto</div>
  <div class="card">
    <div class="row">
      <div class="field-label">Nome / denominação social</div>
      <div class="field-value">${nomeEmpresa}</div>
    </div>
    <div class="row">
      <div class="field-label">NIF (contribuinte)</div>
      <div class="field-value">${nif}</div>
    </div>
    ${morada !== '—' ? `
    <div class="row">
      <div class="field-label">Morada</div>
      <div class="field-value">${morada}</div>
    </div>` : ''}
    ${telefone !== '—' ? `
    <div class="row">
      <div class="field-label">Telefone</div>
      <div class="field-value">${telefone}</div>
    </div>` : ''}
    ${email !== '—' ? `
    <div class="row">
      <div class="field-label">E-mail</div>
      <div class="field-value">${email}</div>
    </div>` : ''}
  </div>

  <div class="notice">
    Este documento destina-se apenas à identificação da empresa para faturação. Não contém NIB, IBAN nem outros dados bancários.
  </div>

  <div class="footer">
    ${rodape}
  </div>
</body>
</html>
  `.trim()
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
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
      },
    })
  } catch (error: unknown) {
    console.error('Erro ao gerar PDF dados fatura (POST):', error)
    return new NextResponse('Erro ao gerar documento.', { status: 500 })
  }
}

export async function GET(_request: NextRequest) {
  try {
    const { isDemo, expired, dataDir } = getDemoContext(_request)
    if (isDemo && expired) {
      return new NextResponse('Demonstração expirada.', { status: 403 })
    }

    const filePath = path.join(dataDir, 'nonato-ficha-cadastral.json')
    let full: Record<string, unknown> = {}

    if (fs.existsSync(filePath)) {
      try {
        const raw = fs.readFileSync(filePath, 'utf-8')
        if (raw && raw.trim()) full = JSON.parse(raw) as Record<string, unknown>
      } catch {
        // manter vazio
      }
    }

    const data: DadosFaturaNonato = {
      nomeEmpresa: typeof full.nomeEmpresa === 'string' ? full.nomeEmpresa : undefined,
      nif: typeof full.nif === 'string' ? full.nif : undefined,
      morada: typeof full.morada === 'string' ? full.morada : undefined,
      telefone: typeof full.telefone === 'string' ? full.telefone : undefined,
      email: typeof full.email === 'string' ? full.email : undefined,
      logo: typeof full.logo === 'string' ? full.logo : undefined,
    }

    const html = buildFaturaHtml(data, isDemo)

    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
      },
    })
  } catch (error: unknown) {
    console.error('Erro ao gerar PDF dados fatura:', error)
    return new NextResponse('Erro ao gerar documento.', { status: 500 })
  }
}
