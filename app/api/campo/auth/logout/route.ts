import { NextRequest, NextResponse } from 'next/server'
import { clearCampoSession, clearCampoSessionCookie } from '../../campoAuth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  const token = request.cookies.get('nonato_campo_session')?.value
  clearCampoSession(token)
  const response = NextResponse.json({ ok: true })
  clearCampoSessionCookie(response)
  return response
}
