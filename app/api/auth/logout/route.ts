import { NextRequest, NextResponse } from 'next/server'
import { APP_SESSION_COOKIE, clearAppSession, clearAppSessionCookie } from '../appAuth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  const token = request.cookies.get(APP_SESSION_COOKIE)?.value
  clearAppSession(token)
  const response = NextResponse.json({ ok: true })
  clearAppSessionCookie(response)
  return response
}
