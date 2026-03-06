import { NextRequest, NextResponse } from 'next/server'

const DEMO_DAYS = 15
const COOKIE_MAX_AGE = DEMO_DAYS * 24 * 60 * 60

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const startDate = new Date().toISOString()
  const host = request.headers.get('x-forwarded-host') || request.headers.get('host') || request.nextUrl.host
  let origin = request.nextUrl.origin
  if (host && host.includes('0.0.0.0')) {
    const port = request.nextUrl.port || (request.nextUrl.protocol === 'https:' ? '443' : '80')
    origin = `http://localhost:${port}`
  } else if (origin.includes('0.0.0.0')) {
    origin = origin.replace('0.0.0.0', 'localhost')
    if (origin.startsWith('https:')) origin = 'http' + origin.slice(5)
  }
  const response = NextResponse.redirect(origin + '/', 302)
  response.cookies.set('nonato_demo', '1', {
    path: '/',
    maxAge: COOKIE_MAX_AGE,
    sameSite: 'lax',
  })
  // Valor em ISO (ex: 2026-03-02T12:00:00.000Z) é seguro para cookie; evitar encode para parse correto no servidor
  response.cookies.set('nonato_demo_start', startDate, {
    path: '/',
    maxAge: COOKIE_MAX_AGE,
    sameSite: 'lax',
  })
  return response
}
