import { NextRequest, NextResponse } from 'next/server'

/** Segredo opcional — quando definido, bloqueia acessos externos às APIs sensíveis. */
export function getApiSecret(): string | undefined {
  const s = process.env.NONATO_API_SECRET?.trim()
  return s || undefined
}

function hostsMatch(a: string, b: string): boolean {
  return a.toLowerCase() === b.toLowerCase()
}

/** Permite pedidos do mesmo site (browser) ou com chave correcta. */
export function assertApiAuthorized(request: NextRequest, opts?: { requireSecret?: boolean }): NextResponse | null {
  const secret = getApiSecret()
  const host = request.headers.get('host') || ''

  if (secret) {
    const provided =
      request.headers.get('x-nonato-api-key')?.trim() ||
      request.headers.get('authorization')?.replace(/^Bearer\s+/i, '').trim()
    if (provided && provided === secret) return null
  }

  if (opts?.requireSecret && secret) {
    return NextResponse.json(
      { error: 'unauthorized', message: 'Chave de API obrigatória para esta operação.' },
      { status: 401 }
    )
  }

  const origin = request.headers.get('origin')
  if (origin && host) {
    try {
      if (hostsMatch(new URL(origin).host, host)) return null
    } catch {
      /* ignorar */
    }
  }

  const referer = request.headers.get('referer')
  if (referer && host) {
    try {
      if (hostsMatch(new URL(referer).host, host)) return null
    } catch {
      /* ignorar */
    }
  }

  if (secret) {
    return NextResponse.json(
      { error: 'unauthorized', message: 'Acesso não autorizado. Use o programa ou configure NONATO_API_SECRET.' },
      { status: 401 }
    )
  }

  return null
}
