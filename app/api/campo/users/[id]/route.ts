import { NextRequest, NextResponse } from 'next/server'
import { deleteCampoUser, requireCampoGestor, updateCampoUser } from '../../campoAuth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type RouteParams = { params: { id: string } }

export async function PUT(request: NextRequest, { params }: RouteParams) {
  const auth = requireCampoGestor(request)
  if (auth instanceof NextResponse) return auth

  try {
    const body = await request.json()
    const user = updateCampoUser(params.id, {
      name: body?.name,
      login: body?.login ?? body?.username,
      password: body?.password ?? body?.senha,
      role: body?.role === 'gestor' ? 'gestor' : body?.role === 'tecnico' ? 'tecnico' : undefined,
      active: body?.active,
      permissions: body?.permissions,
    })
    if (!user) {
      return NextResponse.json({ error: 'not_found', message: 'Utilizador não encontrado.' }, { status: 404 })
    }
    return NextResponse.json({ ok: true, user })
  } catch (error) {
    const code = error instanceof Error ? error.message : 'update_failed'
    const messages: Record<string, string> = {
      login_required: 'Indique o utilizador (login).',
      login_exists: 'Já existe um técnico com este login.',
      password_short: 'A senha deve ter pelo menos 4 caracteres.',
    }
    return NextResponse.json(
      { error: code, message: messages[code] || 'Não foi possível actualizar.' },
      { status: 400 }
    )
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const auth = requireCampoGestor(request)
  if (auth instanceof NextResponse) return auth

  try {
    const ok = deleteCampoUser(params.id)
    if (!ok) {
      return NextResponse.json({ error: 'not_found', message: 'Utilizador não encontrado.' }, { status: 404 })
    }
    return NextResponse.json({ ok: true })
  } catch (error) {
    const code = error instanceof Error ? error.message : 'delete_failed'
    if (code === 'last_gestor') {
      return NextResponse.json(
        { error: code, message: 'Não pode remover o último gestor activo.' },
        { status: 400 }
      )
    }
    return NextResponse.json({ error: code, message: 'Não foi possível remover.' }, { status: 400 })
  }
}
