import { NextRequest, NextResponse } from 'next/server'
import { getDemoContext, hasRealAppSession, isDemoGuestLock } from '../../data/demo-context'
import { normalizeDemoModulesForSession } from '../../../lib/demoManagement'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function decodeDemoModules(raw: string | null | undefined): Record<string, string> {
  if (!raw) return {}
  try {
    const decoded = Buffer.from(raw, 'base64url').toString('utf-8')
    const parsed = JSON.parse(decoded)
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

export async function GET(request: NextRequest) {
  try {
    const productionMode = hasRealAppSession(request)
    const { isDemo, expired, daysLeft } = getDemoContext(request)
    const recipientId = request.cookies.get('nonato_demo_recipient')?.value ?? null
    const demoModules = decodeDemoModules(request.cookies.get('nonato_demo_modules')?.value)
    const guestLock = isDemoGuestLock(request)
    return NextResponse.json({
      isDemo: productionMode ? false : isDemo,
      expired: productionMode ? false : expired,
      daysLeft: productionMode ? null : (daysLeft ?? null),
      recipientId: productionMode ? null : recipientId,
      demoModules: productionMode ? {} : normalizeDemoModulesForSession(demoModules),
      guestLock: productionMode ? false : guestLock,
      productionMode,
    })
  } catch (error: any) {
    console.error('Erro demo/status:', error)
    const msg = process.env.NODE_ENV === 'development' ? error.message : 'Erro'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
