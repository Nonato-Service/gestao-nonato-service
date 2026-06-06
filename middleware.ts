import { NextRequest, NextResponse } from 'next/server'

function hostsMatch(a: string, b: string): boolean {
  return a.toLowerCase() === b.toLowerCase()
}

function isSameOrigin(request: NextRequest): boolean {
  const host = request.headers.get('host') || ''
  if (!host) return false
  const origin = request.headers.get('origin')
  if (origin) {
    try {
      if (hostsMatch(new URL(origin).host, host)) return true
    } catch {
      /* ignorar */
    }
  }
  const referer = request.headers.get('referer')
  if (referer) {
    try {
      if (hostsMatch(new URL(referer).host, host)) return true
    } catch {
      /* ignorar */
    }
  }
  return false
}

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname
  const method = request.method.toUpperCase()

  if (method === 'OPTIONS' || method === 'HEAD') return NextResponse.next()

  const isDataWrite =
    path.startsWith('/api/data/') && (method === 'POST' || method === 'PUT' || method === 'PATCH' || method === 'DELETE')
  const isCodeRestore =
    path.startsWith('/api/backup-code/') &&
    (path.includes('restore') || path.includes('download')) &&
    method === 'POST'

  if (!isDataWrite && !isCodeRestore) return NextResponse.next()

  const secret = process.env.NONATO_API_SECRET?.trim()
  if (!secret) return NextResponse.next()

  const provided =
    request.headers.get('x-nonato-api-key')?.trim() ||
    request.headers.get('authorization')?.replace(/^Bearer\s+/i, '').trim()
  if (provided === secret) return NextResponse.next()

  if (isSameOrigin(request)) return NextResponse.next()

  return NextResponse.json(
    { error: 'unauthorized', message: 'Operação bloqueada — aceda pelo programa ou use NONATO_API_SECRET.' },
    { status: 401 }
  )
}

export const config = {
  matcher: ['/api/data/:path*', '/api/backup-code/:path*'],
}
