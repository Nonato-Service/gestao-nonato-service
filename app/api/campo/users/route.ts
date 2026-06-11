import { NextRequest, NextResponse } from 'next/server'
import {
  CAMPO_PERMISSION_KEYS,
  createCampoUser,
  listCampoUsers,
  requireCampoGestor,
} from '../campoAuth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const auth = requireCampoGestor(request)
  if (auth instanceof NextResponse) return auth

  return NextResponse.json({
    ok: true,
    users: listCampoUsers(),
    permissionKeys: CAMPO_PERMISSION_KEYS,
  })
}

export async function POST(request: NextRequest) {
  const auth = requireCampoGestor(request)
  if (auth instanceof NextResponse) return auth

  try {
    const body = await request.json()
    const user = createCampoUser({
      name: String(body?.name ?? ''),
      login: String(body?.login ?? body?.username ?? ''),
      password: String(body?.password ?? body?.senha ?? ''),
      role: body?.role === 'gestor' ? 'gestor' : 'tecnico',
      permissions: body?.permissions,
    })
    return NextResponse.json({ ok: true, user })
  } catch (error) {
    const code = error instanceof Error ? error.message : 'create_failed'
    const messages: Record<string, string> = {
      login_required: 'Indique o utilizador (login).',
      login_exists: 'Já existe um técnico com este login.',
      password_short: 'A senha deve ter pelo menos 4 caracteres.',
    }
    return NextResponse.json(
      { error: code, message: messages[code] || 'Não foi possível criar o utilizador.' },
      { status: 400 }
    )
  }
}
