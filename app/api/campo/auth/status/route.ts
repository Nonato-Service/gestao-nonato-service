import { NextRequest, NextResponse } from 'next/server'
import { getCampoSessionFromRequest } from '../../campoAuth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const user = getCampoSessionFromRequest(request)
  if (!user) {
    return NextResponse.json({ authenticated: false }, { status: 401 })
  }
  return NextResponse.json({ authenticated: true, user })
}
