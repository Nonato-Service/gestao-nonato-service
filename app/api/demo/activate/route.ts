import { NextRequest, NextResponse } from 'next/server'

const DEMO_DAYS = 15
const COOKIE_MAX_AGE = DEMO_DAYS * 24 * 60 * 60

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const startDate = new Date().toISOString()
  // Usar o mesmo host/porta do pedido para o redirect (evita NS_ERROR_CONNECTION_REFUSED)
  const redirectUrl = new URL('/', request.url)
  if (redirectUrl.hostname === '0.0.0.0') {
    redirectUrl.hostname = 'localhost'
    redirectUrl.protocol = 'http:'
  }
  const response = NextResponse.redirect(redirectUrl.toString(), 302)
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
