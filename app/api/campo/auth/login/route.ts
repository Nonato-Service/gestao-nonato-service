import { NextRequest, NextResponse } from 'next/server'
import {
  applyCampoSessionCookie,
  createCampoSession,
  validateCampoCredentials,
} from '../../campoAuth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const login = String(body?.login ?? body?.username ?? body?.usuario ?? '')
    const password = String(body?.password ?? body?.senha ?? '')

    const user = validateCampoCredentials(login, password)
    if (!user) {
      return NextResponse.json(
        { error: 'invalid_credentials', message: 'Utilizador ou senha incorretos.' },
        { status: 401 }
      )
    }

    const session = createCampoSession(user)
    const response = NextResponse.json({
      ok: true,
      user: session.user,
      expiresAt: new Date(Date.now() + session.maxAge * 1000).toISOString(),
    })
    applyCampoSessionCookie(response, session.token, session.maxAge)
    return response
  } catch (error) {
    console.error('campo/auth/login:', error)
    return NextResponse.json({ error: 'login_failed', message: 'Erro ao iniciar sessão.' }, { status: 500 })
  }
}
