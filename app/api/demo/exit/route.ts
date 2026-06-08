import { NextRequest, NextResponse } from 'next/server'
import { getPublicOrigin } from '../../getPublicOrigin'
import { COOKIE_DEMO_GUEST } from '../../data/demo-context'

const DEMO_DAYS = 15
const COOKIE_MAX_AGE = DEMO_DAYS * 24 * 60 * 60

export const dynamic = 'force-dynamic'

function clearDemoSessionCookies(response: NextResponse) {
  response.cookies.set('nonato_demo', '', { path: '/', maxAge: 0 })
  response.cookies.set('nonato_demo_start', '', { path: '/', maxAge: 0 })
  response.cookies.set('nonato_demo_recipient', '', { path: '/', maxAge: 0 })
  response.cookies.set('nonato_demo_modules', '', { path: '/', maxAge: 0 })
}

/**
 * Sair da demonstração.
 * Visitantes com link personalizado (rid) NÃO podem aceder à app real — vão para /demo/encerrado.
 * Sem rid: uso interno (ex.: abriu /demo por engano no tablet do gestor).
 */
export async function GET(request: NextRequest) {
  const origin = getPublicOrigin(request)
  const recipientCookie = request.cookies.get('nonato_demo_recipient')?.value?.trim()
  const guestLock = request.cookies.get(COOKIE_DEMO_GUEST)?.value === '1'

  if (recipientCookie || guestLock) {
    const response = NextResponse.redirect(`${origin}/demo/encerrado`, 302)
    clearDemoSessionCookies(response)
    response.cookies.set(COOKIE_DEMO_GUEST, '1', {
      path: '/',
      maxAge: COOKIE_MAX_AGE,
      sameSite: 'lax',
    })
    return response
  }

  const response = NextResponse.redirect(`${origin}/`, 302)
  clearDemoSessionCookies(response)
  response.cookies.set(COOKIE_DEMO_GUEST, '', { path: '/', maxAge: 0 })
  response.cookies.set('nonato_post_demo_wipe', '1', { path: '/', maxAge: 120, sameSite: 'lax' })
  return response
}
