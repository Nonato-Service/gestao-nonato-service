/**
 * Contexto do modo DEMO: dados isolados e expiração em 15 dias.
 * Usado pelas APIs para decidir qual pasta de dados usar.
 */
import path from 'path'
import { NextRequest, NextResponse } from 'next/server'
import { DATA_DIR } from './shared'

const DEMO_DAYS = 15
const COOKIE_DEMO = 'nonato_demo'
const COOKIE_DEMO_START = 'nonato_demo_start'
const COOKIE_DEMO_RECIPIENT = 'nonato_demo_recipient'
/** Marca visitantes que entraram por link personalizado — não podem aceder à app real. */
const COOKIE_DEMO_GUEST = 'nonato_demo_guest'
const COOKIE_DEMO_MODULES = 'nonato_demo_modules'

function sanitizeDemoRecipient(recipientId?: string): string {
  const safe = String(recipientId || '')
    .trim()
    .replace(/[^a-zA-Z0-9_-]/g, '')
  return safe || 'default'
}

export type DemoContext = {
  isDemo: boolean
  expired: boolean
  dataDir: string
  daysLeft?: number
}

export function getDemoContext(request: NextRequest): DemoContext {
  const demoCookie = request.cookies.get(COOKIE_DEMO)?.value
  const startCookie = request.cookies.get(COOKIE_DEMO_START)?.value
  const recipientCookie = request.cookies.get(COOKIE_DEMO_RECIPIENT)?.value

  if (!demoCookie || demoCookie !== '1' || !startCookie) {
    return { isDemo: false, expired: false, dataDir: DATA_DIR }
  }

  // Cookie pode ter sido guardado com encodeURIComponent (versões antigas); decodificar para parse correto
  let startStr = startCookie
  if (typeof startCookie === 'string' && startCookie.includes('%')) {
    try {
      startStr = decodeURIComponent(startCookie)
    } catch {
      startStr = startCookie
    }
  }
  const startDate = new Date(startStr)
  if (isNaN(startDate.getTime())) {
    return { isDemo: false, expired: false, dataDir: DATA_DIR }
  }

  const now = new Date()
  const diffMs = now.getTime() - startDate.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  const demoDataDir = path.join(DATA_DIR, 'demo', sanitizeDemoRecipient(recipientCookie))

  if (diffDays >= DEMO_DAYS) {
    return {
      isDemo: true,
      expired: true,
      dataDir: demoDataDir,
    }
  }

  const daysLeft = DEMO_DAYS - diffDays
  return {
    isDemo: true,
    expired: false,
    dataDir: demoDataDir,
    daysLeft,
  }
}

export function ensureDemoDataDir(dataDir: string): void {
  const fs = require('fs')
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true })
  }
}

export function isDemoGuestLock(request: NextRequest): boolean {
  return request.cookies.get(COOKIE_DEMO_GUEST)?.value === '1'
}

/** Apaga cookies de sessão demo na resposta HTTP. */
export function clearDemoSessionCookiesOnResponse(
  response: NextResponse,
  opts?: { keepGuestLock?: boolean }
): void {
  response.cookies.set(COOKIE_DEMO, '', { path: '/', maxAge: 0 })
  response.cookies.set(COOKIE_DEMO_START, '', { path: '/', maxAge: 0 })
  response.cookies.set(COOKIE_DEMO_RECIPIENT, '', { path: '/', maxAge: 0 })
  response.cookies.set(COOKIE_DEMO_MODULES, '', { path: '/', maxAge: 0 })
  if (!opts?.keepGuestLock) {
    response.cookies.set(COOKIE_DEMO_GUEST, '', { path: '/', maxAge: 0 })
  }
}

/** Bloqueia APIs de dados de produção para quem entrou por link personalizado e saiu da demo. */
export function rejectDemoGuestProductionAccess(request: NextRequest): NextResponse | null {
  const { isDemo } = getDemoContext(request)
  if (!isDemo && isDemoGuestLock(request)) {
    return NextResponse.json(
      {
        error: 'demo_guest_locked',
        message: 'Acesso à aplicação real não permitido nesta demonstração.',
      },
      { status: 403 }
    )
  }
  return null
}

export { COOKIE_DEMO, COOKIE_DEMO_START, COOKIE_DEMO_RECIPIENT, COOKIE_DEMO_GUEST, DEMO_DAYS }
