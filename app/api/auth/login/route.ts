import { NextRequest, NextResponse } from 'next/server'
import {
  applyAppSessionCookie,
  createAppSession,
  validateAppCredentials,
} from '../appAuth'
import { clearDemoSessionCookiesOnResponse } from '../../data/demo-context'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const username = String(body?.username ?? body?.usuario ?? '')
    const password = String(body?.password ?? body?.senha ?? '')

    const user = validateAppCredentials(username, password)
    if (!user) {
      return NextResponse.json(
        { error: 'invalid_credentials', message: 'Utilizador ou senha incorretos.' },
        { status: 401 }
      )
    }

    const session = createAppSession(user)
    const response = NextResponse.json({
      ok: true,
      user: session.user,
      bootstrap: user.id === 'bootstrap-admin',
    })
    applyAppSessionCookie(response, session.token, session.maxAge)
    clearDemoSessionCookiesOnResponse(response)
    return response
  } catch (error: any) {
    console.error('auth/login:', error)
    return NextResponse.json({ error: 'login_failed', message: 'Erro ao iniciar sessão.' }, { status: 500 })
  }
}
