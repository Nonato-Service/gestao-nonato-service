import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import { getPublicOrigin } from '../../getPublicOrigin'
import { DATA_DIR, ensureDataDir } from '../../data/shared'
import { getAppSessionFromRequest } from '../../auth/appAuth'
import { clearDemoSessionCookiesOnResponse } from '../../data/demo-context'
import { clampDemoDays, DEMO_DAYS_DEFAULT, resolveDemoDaysForRecipient } from '../../../lib/demoManagement'

const RECIPIENTS_FILE = 'nonato-demo-link-recipients.json'

export const dynamic = 'force-dynamic'

function encodeDemoModules(value: Record<string, string> | undefined): string {
  if (!value || typeof value !== 'object') return ''
  return Buffer.from(JSON.stringify(value), 'utf-8').toString('base64url')
}

function readRecipientsList(): any[] {
  try {
    ensureDataDir()
    const filePath = path.join(DATA_DIR, RECIPIENTS_FILE)
    if (!fs.existsSync(filePath)) return []
    const raw = fs.readFileSync(filePath, 'utf-8')
    if (!raw.trim()) return []
    const list = JSON.parse(raw)
    return Array.isArray(list) ? list : []
  } catch (error) {
    console.error('Erro ao carregar destinatários da demo:', error)
    return []
  }
}

function getDemoRecipientById(recipientId: string) {
  return readRecipientsList().find((item: any) => item && item.id === recipientId)
}

function getDemoModulesByRecipient(recipientId: string): Record<string, string> | undefined {
  const recipient = getDemoRecipientById(recipientId)
  return recipient?.demoModules && typeof recipient.demoModules === 'object' ? recipient.demoModules : undefined
}

function getDemoDaysByRecipient(recipientId: string): number {
  return resolveDemoDaysForRecipient(getDemoRecipientById(recipientId))
}

function markDemoRecipientAccess(recipientId: string, accessDateIso: string) {
  try {
    ensureDataDir()
    const filePath = path.join(DATA_DIR, RECIPIENTS_FILE)
    if (!fs.existsSync(filePath)) return
    const raw = fs.readFileSync(filePath, 'utf-8')
    if (!raw.trim()) return
    const list = JSON.parse(raw)
    if (!Array.isArray(list)) return
    const updated = list.map((item: any) => {
      if (!item || item.id !== recipientId) return item
      const demoDays = resolveDemoDaysForRecipient(item)
      const baseDate = item.firstAccessAt || accessDateIso
      const expirationDate = new Date(new Date(baseDate).getTime() + demoDays * 24 * 60 * 60 * 1000).toISOString()
      return {
        ...item,
        firstAccessAt: item.firstAccessAt || accessDateIso,
        lastAccessAt: accessDateIso,
        activationCount: Number(item.activationCount || 0) + 1,
        dataExpiracao: expirationDate,
        demoDays,
      }
    })
    fs.writeFileSync(filePath, JSON.stringify(updated, null, 2), 'utf-8')
  } catch (error) {
    console.error('Erro ao marcar acesso da demo:', error)
  }
}

function applyDemoSessionCookies(
  response: NextResponse,
  startDate: string,
  recipientId: string,
  opts?: { demoDays?: number }
) {
  const demoDays = clampDemoDays(opts?.demoDays ?? DEMO_DAYS_DEFAULT)
  const cookieMaxAge = demoDays * 24 * 60 * 60

  response.cookies.set('nonato_demo', '1', {
    path: '/',
    maxAge: cookieMaxAge,
    sameSite: 'lax',
  })
  response.cookies.set('nonato_demo_start', startDate, {
    path: '/',
    maxAge: cookieMaxAge,
    sameSite: 'lax',
  })
  response.cookies.set('nonato_demo_days', String(demoDays), {
    path: '/',
    maxAge: cookieMaxAge,
    sameSite: 'lax',
  })

  const demoModules = getDemoModulesByRecipient(recipientId)
  response.cookies.set('nonato_demo_recipient', recipientId, {
    path: '/',
    maxAge: cookieMaxAge,
    sameSite: 'lax',
  })
  if (demoModules) {
    response.cookies.set('nonato_demo_modules', encodeDemoModules(demoModules), {
      path: '/',
      maxAge: cookieMaxAge,
      sameSite: 'lax',
    })
  }
  response.cookies.set('nonato_demo_guest', '1', {
    path: '/',
    maxAge: cookieMaxAge,
    sameSite: 'lax',
  })
  markDemoRecipientAccess(recipientId, startDate)
}

function ownerBlockedResponse(origin: string, wantsJson: boolean): NextResponse {
  const message =
    'Está com sessão do programa principal. Para testar uma demo, use janela anónima ou outro browser — não abra links de clientes aqui.'
  if (wantsJson) {
    const response = NextResponse.json({ ok: false, error: 'owner_session', message }, { status: 403 })
    clearDemoSessionCookiesOnResponse(response)
    return response
  }
  const response = NextResponse.redirect(`${origin}/`, 302)
  clearDemoSessionCookiesOnResponse(response)
  return response
}

export async function GET(request: NextRequest) {
  const startDate = new Date().toISOString()
  const origin = getPublicOrigin(request)
  const recipientId = request.nextUrl.searchParams.get('rid')?.trim()
  const preview = request.nextUrl.searchParams.get('preview') === '1'
  const wantsJson = request.headers.get('accept')?.includes('application/json') || preview
  const isOwnerSession = Boolean(getAppSessionFromRequest(request))

  if (preview) {
    if (!recipientId) {
      return NextResponse.json({ found: false, demoDays: DEMO_DAYS_DEFAULT, nome: null })
    }
    const recipient = getDemoRecipientById(recipientId)
    return NextResponse.json({
      found: Boolean(recipient),
      demoDays: resolveDemoDaysForRecipient(recipient),
      nome: recipient?.nome ?? null,
    })
  }

  if (isOwnerSession) {
    return ownerBlockedResponse(origin, wantsJson)
  }

  if (!recipientId) {
    const message = 'Link inválido. Peça ao fornecedor um link personalizado (com código do destinatário).'
    if (wantsJson) {
      return NextResponse.json({ ok: false, error: 'rid_required', message }, { status: 400 })
    }
    const response = NextResponse.redirect(`${origin}/demo/link-invalido`, 302)
    return response
  }

  const recipient = getDemoRecipientById(recipientId)
  if (!recipient) {
    const message = 'Demonstração não encontrada ou link expirado. Contacte quem enviou o link.'
    if (wantsJson) {
      return NextResponse.json({ ok: false, error: 'recipient_not_found', message }, { status: 404 })
    }
    const response = NextResponse.redirect(`${origin}/demo/link-invalido`, 302)
    return response
  }

  const demoDays = getDemoDaysByRecipient(recipientId)

  if (wantsJson) {
    const response = NextResponse.json({
      ok: true,
      recipientId,
      recipientFound: true,
      demoDays,
    })
    applyDemoSessionCookies(response, startDate, recipientId, { demoDays })
    return response
  }

  const response = NextResponse.redirect(`${origin}/`, 302)
  applyDemoSessionCookies(response, startDate, recipientId, { demoDays })
  return response
}
