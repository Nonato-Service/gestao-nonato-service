import { NextRequest, NextResponse } from 'next/server'
import { getAppSessionFromRequest } from '../appAuth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const user = getAppSessionFromRequest(request)
  return NextResponse.json({
    authenticated: Boolean(user),
    user: user || null,
  })
}
