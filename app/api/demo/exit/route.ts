import { NextRequest, NextResponse } from 'next/server'
import { getPublicOrigin } from '../../getPublicOrigin'
import { getAppSessionFromRequest } from '../../auth/appAuth'
import { clearDemoSessionCookiesOnResponse, COOKIE_DEMO_GUEST } from '../../data/demo-context'

const DEMO_DAYS = 15
const COOKIE_MAX_AGE = DEMO_DAYS * 24 * 60 * 60

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const origin = getPublicOrigin(request)
  const recipientCookie = request.cookies.get('nonato_demo_recipient')?.value?.trim()
  const guestLock = request.cookies.get(COOKIE_DEMO_GUEST)?.value === '1'
  const ownerSession = getAppSessionFromRequest(request)

  // Dono autenticado: sair da demo e voltar ao programa normal
  if (ownerSession) {
    const response = NextResponse.redirect(`${origin}/`, 302)
    clearDemoSessionCookiesOnResponse(response)
    return response
  }

  if (recipientCookie || guestLock) {
    const response = NextResponse.redirect(`${origin}/demo/encerrado`, 302)
    clearDemoSessionCookiesOnResponse(response, { keepGuestLock: true })
    response.cookies.set(COOKIE_DEMO_GUEST, '1', {
      path: '/',
      maxAge: COOKIE_MAX_AGE,
      sameSite: 'lax',
    })
    return response
  }

  const response = NextResponse.redirect(`${origin}/`, 302)
  clearDemoSessionCookiesOnResponse(response)
  response.cookies.set('nonato_post_demo_wipe', '1', { path: '/', maxAge: 120, sameSite: 'lax' })
  return response
}
