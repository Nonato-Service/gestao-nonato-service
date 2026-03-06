import { NextRequest, NextResponse } from 'next/server'
import { getDemoContext } from '../../data/demo-context'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { isDemo, expired, daysLeft } = getDemoContext(request)
    return NextResponse.json({
      isDemo,
      expired,
      daysLeft: daysLeft ?? null,
    })
  } catch (error: any) {
    console.error('Erro demo/status:', error)
    const msg = process.env.NODE_ENV === 'development' ? error.message : 'Erro'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
