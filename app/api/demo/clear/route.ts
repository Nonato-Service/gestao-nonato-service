import { NextRequest, NextResponse } from 'next/server'
import { clearDemoSessionCookiesOnResponse } from '../../data/demo-context'

export const dynamic = 'force-dynamic'

/** Remove cookies de demo neste browser (útil se ficou preso em modo demonstração). */
export async function GET(_request: NextRequest) {
  const response = NextResponse.json({ ok: true, cleared: true })
  clearDemoSessionCookiesOnResponse(response)
  return response
}
