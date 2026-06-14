import { NextRequest, NextResponse } from 'next/server'
import { getPublicOrigin } from '../../getPublicOrigin'
import { getAppSessionFromRequest } from '../../auth/appAuth'
import { clearDemoSessionCookiesOnResponse } from '../../data/demo-context'
import { DEMO_DAYS_DEFAULT, resolveDemoDaysForRecipient } from '../../../lib/demoManagement'
import {
  applyDemoSessionCookies,
  getDemoDaysByRecipient,
  getDemoRecipientById,
} from '../recipientsStore'

export const dynamic = 'force-dynamic'

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
      return NextResponse.json({ found: false, demoDays: DEMO_DAYS_DEFAULT, nome: null, demoUsuario: null })
    }
    const recipient = getDemoRecipientById(recipientId)
    return NextResponse.json({
      found: Boolean(recipient),
      demoDays: resolveDemoDaysForRecipient(recipient),
      nome: recipient?.nome ?? null,
      demoUsuario: recipient?.demoUsuario ?? null,
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
    return NextResponse.redirect(`${origin}/demo/link-invalido`, 302)
  }

  const recipient = getDemoRecipientById(recipientId)
  if (!recipient) {
    const message = 'Demonstração não encontrada ou link expirado. Contacte quem enviou o link.'
    if (wantsJson) {
      return NextResponse.json({ ok: false, error: 'recipient_not_found', message }, { status: 404 })
    }
    return NextResponse.redirect(`${origin}/demo/link-invalido`, 302)
  }

  const demoDays = getDemoDaysByRecipient(recipientId)

  if (wantsJson) {
    const response = NextResponse.json({
      ok: true,
      recipientId,
      recipientFound: true,
      demoDays,
      demoUsuario: recipient.demoUsuario ?? null,
    })
    applyDemoSessionCookies(response, startDate, recipientId, { demoDays })
    return response
  }

  const response = NextResponse.redirect(`${origin}/`, 302)
  applyDemoSessionCookies(response, startDate, recipientId, { demoDays })
  return response
}
