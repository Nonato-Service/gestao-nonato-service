import { NextRequest, NextResponse } from 'next/server'
import {
  applyAppSessionCookie,
  createAppSession,
  resetAdminPasswordOnDisk,
} from '../appAuth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function getEmergencyKey(): string | undefined {
  return (
    process.env.NONATO_EMERGENCY_KEY?.trim() ||
    process.env.NONATO_API_SECRET?.trim() ||
    undefined
  )
}

/**
 * Redefine a senha de administrador no servidor (volume Railway).
 * Requer header X-Nonato-Emergency-Key = NONATO_EMERGENCY_KEY (ou NONATO_API_SECRET).
 */
export async function POST(request: NextRequest) {
  try {
    const expected = getEmergencyKey()
    if (!expected) {
      return NextResponse.json(
        {
          error: 'not_configured',
          message:
            'Defina NONATO_EMERGENCY_KEY ou NONATO_API_SECRET no Railway, faça redeploy e tente novamente.',
        },
        { status: 503 }
      )
    }

    const provided =
      request.headers.get('x-nonato-emergency-key')?.trim() ||
      request.headers.get('x-nonato-api-key')?.trim() ||
      request.headers.get('authorization')?.replace(/^Bearer\s+/i, '').trim()

    if (!provided || provided !== expected) {
      return NextResponse.json({ error: 'unauthorized', message: 'Chave de emergência inválida.' }, { status: 401 })
    }

    const body = await request.json().catch(() => ({}))
    const password = String(body?.password ?? body?.senha ?? '23093110').trim()
    const email = body?.email ? String(body.email) : 'nonato.service@gmail.com'

    const user = resetAdminPasswordOnDisk(password, email)
    if (!user) {
      return NextResponse.json({ error: 'invalid_password', message: 'Senha inválida (mínimo 4 caracteres).' }, { status: 400 })
    }

    const session = createAppSession(user)
    const response = NextResponse.json({
      ok: true,
      message: 'Senha de administrador redefinida no servidor.',
      user: session.user,
    })
    applyAppSessionCookie(response, session.token, session.maxAge)
    response.cookies.set('nonato_demo_guest', '', { path: '/', maxAge: 0 })
    return response
  } catch (error: any) {
    console.error('auth/emergency-reset:', error)
    return NextResponse.json({ error: 'reset_failed', message: 'Erro ao redefinir senha.' }, { status: 500 })
  }
}
