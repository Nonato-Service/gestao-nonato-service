/**
 * Contexto do modo DEMO: dados isolados e expiração configurável por link.
 * Usado pelas APIs para decidir qual pasta de dados usar.
 */
import path from 'path'
import { NextRequest, NextResponse } from 'next/server'
import { clampDemoDays, DEMO_DAYS_DEFAULT } from '../../lib/demoManagement'
import { DATA_DIR } from './shared'

const COOKIE_DEMO = 'nonato_demo'
const COOKIE_DEMO_START = 'nonato_demo_start'
const COOKIE_DEMO_RECIPIENT = 'nonato_demo_recipient'
/** Marca visitantes que entraram por link personalizado — não podem aceder à app real. */
const COOKIE_DEMO_GUEST = 'nonato_demo_guest'
const COOKIE_DEMO_MODULES = 'nonato_demo_modules'
const COOKIE_DEMO_DAYS = 'nonato_demo_days'

export function hasRealAppSession(request: NextRequest): boolean {
  try {
    const { getAppSessionFromRequest } = require('../auth/appAuth') as typeof import('../auth/appAuth')
    const user = getAppSessionFromRequest(request)
    return Boolean(user && user.id !== 'demo-visitor')
  } catch {
    return false
  }
}

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
  // Dono / gestor autenticado: programa principal — ignorar cookies de demo antigos
  if (hasRealAppSession(request)) {
    return { isDemo: false, expired: false, dataDir: DATA_DIR }
  }

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
  const demoDaysLimit = clampDemoDays(request.cookies.get(COOKIE_DEMO_DAYS)?.value ?? DEMO_DAYS_DEFAULT)

  const demoDataDir = path.join(DATA_DIR, 'demo', sanitizeDemoRecipient(recipientCookie))

  if (diffDays >= demoDaysLimit) {
    return {
      isDemo: true,
      expired: true,
      dataDir: demoDataDir,
    }
  }

  const daysLeft = demoDaysLimit - diffDays
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
  if (hasRealAppSession(request)) return false
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
  response.cookies.set(COOKIE_DEMO_DAYS, '', { path: '/', maxAge: 0 })
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

export {
  COOKIE_DEMO,
  COOKIE_DEMO_START,
  COOKIE_DEMO_RECIPIENT,
  COOKIE_DEMO_GUEST,
  COOKIE_DEMO_DAYS,
  DEMO_DAYS_DEFAULT as DEMO_DAYS,
}
