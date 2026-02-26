import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

/**
 * Busca o conteúdo de uma URL no servidor (evita CORS no browser).
 * POST body: { url: string }
 * Retorna: { ok: true, data: string, contentType?: string } ou { ok: false, error: string }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const url = typeof body?.url === 'string' ? body.url.trim() : ''

    if (!url) {
      return NextResponse.json({ ok: false, error: 'URL não informada.' }, { status: 400 })
    }

    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      return NextResponse.json({ ok: false, error: 'URL deve começar com http:// ou https://' }, { status: 400 })
    }

    // Timeout compatível com Node 16 (AbortSignal.timeout só existe a partir do Node 17)
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 20000)

    const response = await fetch(url, {
      method: 'GET',
      redirect: 'follow',
      headers: {
        'Accept': 'application/json, text/csv, text/plain, text/html; q=0.9, application/xml; q=0.8, */*; q=0.7',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      },
      signal: controller.signal
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      return NextResponse.json(
        { ok: false, error: `Erro ao acessar a URL: ${response.status} ${response.statusText}` },
        { status: 502 }
      )
    }

    const contentType = response.headers.get('content-type') || ''
    const text = await response.text()

    // Se o site devolveu HTML (ex.: página de login ou loja com dados em JavaScript), avisar
    if (contentType.includes('text/html') && text.trim().toLowerCase().startsWith('<!')) {
      return NextResponse.json({
        ok: false,
        error: 'Esta URL devolve uma página web (HTML), não um ficheiro de dados. Sites como a loja Homag carregam as peças por JavaScript. Use a opção "Carregar ficheiro CSV/JSON" com uma exportação que tenha guardado, ou uma URL que aponte diretamente para um ficheiro .json ou .csv.'
      }, { status: 400 })
    }

    return NextResponse.json({
      ok: true,
      data: text,
      contentType
    })
  } catch (err: any) {
    const message = (err?.message || String(err)).toLowerCase()
    const isAbort = err?.name === 'AbortError' || message.includes('aborted')
    if (message.includes('timeout') || isAbort) {
      return NextResponse.json({ ok: false, error: 'Tempo esgotado ao acessar a URL. Tente novamente ou use outra URL.' }, { status: 504 })
    }
    if (message.includes('fetch failed') || message.includes('econnrefused') || message.includes('enotfound') || message.includes('network')) {
      return NextResponse.json({
        ok: false,
        error: 'Não foi possível aceder à URL. Verifique o endereço, a ligação à internet, ou se o site permite acesso (alguns bloqueiam pedidos de servidores).'
      }, { status: 502 })
    }
    if (message.includes('certificate') || message.includes('ssl') || message.includes('unable to verify')) {
      return NextResponse.json({ ok: false, error: 'Erro de certificado SSL ao aceder à URL. O site pode não ser acessível a partir do servidor.' }, { status: 502 })
    }
    return NextResponse.json(
      { ok: false, error: err?.message || 'Erro ao buscar a URL. Tente novamente ou use um ficheiro JSON/CSV acessível.' },
      { status: 500 }
    )
  }
}
