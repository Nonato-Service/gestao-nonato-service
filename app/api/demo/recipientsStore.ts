import fs from 'fs'
import path from 'path'
import { NextResponse } from 'next/server'
import { DATA_DIR, ensureDataDir } from '../data/shared'
import { DEMO_VISITOR_USER, clampDemoDays, DEMO_DAYS_DEFAULT, resolveDemoDaysForRecipient, normalizeDemoModulesForSession, type DemoRecipientRecord } from '../../lib/demoManagement'
import type { StoredUser } from '../auth/appAuth'

export const RECIPIENTS_FILE = 'nonato-demo-link-recipients.json'

function encodeDemoModules(value: Record<string, string> | undefined): string {
  if (!value || typeof value !== 'object') return ''
  return Buffer.from(JSON.stringify(value), 'utf-8').toString('base64url')
}

export function readDemoRecipientsList(): DemoRecipientRecord[] {
  try {
    ensureDataDir()
    const filePath = path.join(DATA_DIR, RECIPIENTS_FILE)
    if (!fs.existsSync(filePath)) return []
    const raw = fs.readFileSync(filePath, 'utf-8')
    if (!raw.trim()) return []
    const list = JSON.parse(raw)
    return Array.isArray(list) ? (list as DemoRecipientRecord[]) : []
  } catch (error) {
    console.error('Erro ao carregar destinatários da demo:', error)
    return []
  }
}

export function getDemoRecipientById(recipientId: string): DemoRecipientRecord | undefined {
  return readDemoRecipientsList().find((item) => item && item.id === recipientId)
}

export function getDemoModulesByRecipient(recipientId: string): Record<string, string> | undefined {
  const recipient = getDemoRecipientById(recipientId)
  if (!recipient?.demoModules || typeof recipient.demoModules !== 'object') return undefined
  return normalizeDemoModulesForSession(recipient.demoModules) as Record<string, string>
}

export function getDemoDaysByRecipient(recipientId: string): number {
  return resolveDemoDaysForRecipient(getDemoRecipientById(recipientId))
}

export function isDemoRecipientExpired(recipient: DemoRecipientRecord): boolean {
  if (recipient.dataExpiracao) {
    return new Date(recipient.dataExpiracao).getTime() <= Date.now()
  }
  if (!recipient.firstAccessAt) return false
  const demoDays = resolveDemoDaysForRecipient(recipient)
  const startMs = new Date(recipient.firstAccessAt).getTime()
  const endMs = startMs + demoDays * 24 * 60 * 60 * 1000
  return Date.now() >= endMs
}

export function validateDemoRecipientCredentials(
  username: string,
  password: string
): DemoRecipientRecord | null {
  const user = username.trim().toLowerCase()
  const pass = password.trim()
  if (!user || !pass) return null

  const found = readDemoRecipientsList().find(
    (item) =>
      item?.demoUsuario &&
      item.demoSenha &&
      item.demoUsuario.trim().toLowerCase() === user &&
      item.demoSenha === pass
  )
  if (!found) return null
  if (isDemoRecipientExpired(found)) return null
  return found
}

export function demoRecipientToStoredUser(recipient: DemoRecipientRecord): StoredUser {
  return {
    id: `demo-recipient-${recipient.id}`,
    name: recipient.nome?.trim() || 'Gestor Demo',
    email: recipient.email?.trim() || '',
    role: 'Gestor (Demonstração)',
    isAdmin: false,
    isDemoGuest: true,
    demoRecipientId: recipient.id,
    permissions: { ...DEMO_VISITOR_USER.permissions },
  }
}

export function markDemoRecipientAccess(recipientId: string, accessDateIso: string) {
  try {
    ensureDataDir()
    const filePath = path.join(DATA_DIR, RECIPIENTS_FILE)
    if (!fs.existsSync(filePath)) return
    const raw = fs.readFileSync(filePath, 'utf-8')
    if (!raw.trim()) return
    const list = JSON.parse(raw)
    if (!Array.isArray(list)) return
    const updated = list.map((item: DemoRecipientRecord) => {
      if (!item || item.id !== recipientId) return item
      const demoDays = resolveDemoDaysForRecipient(item)
      const baseDate = item.firstAccessAt || accessDateIso
      const expirationDate = new Date(new Date(baseDate).getTime() + demoDays * 24 * 60 * 60 * 1000).toISOString()
      return {
        ...item,
        firstAccessAt: item.firstAccessAt || accessDateIso,
        lastAccessAt: accessDateIso,
        activationCount: Number(item.activationCount || 0) + 1,
        dataExpiracao: expirationDate,
        demoDays,
      }
    })
    fs.writeFileSync(filePath, JSON.stringify(updated, null, 2), 'utf-8')
  } catch (error) {
    console.error('Erro ao marcar acesso da demo:', error)
  }
}

export function applyDemoSessionCookies(
  response: NextResponse,
  startDate: string,
  recipientId: string,
  opts?: { demoDays?: number; markAccess?: boolean }
) {
  const demoDays = clampDemoDays(opts?.demoDays ?? DEMO_DAYS_DEFAULT)
  const cookieMaxAge = demoDays * 24 * 60 * 60

  response.cookies.set('nonato_demo', '1', {
    path: '/',
    maxAge: cookieMaxAge,
    sameSite: 'lax',
  })
  response.cookies.set('nonato_demo_start', startDate, {
    path: '/',
    maxAge: cookieMaxAge,
    sameSite: 'lax',
  })
  response.cookies.set('nonato_demo_days', String(demoDays), {
    path: '/',
    maxAge: cookieMaxAge,
    sameSite: 'lax',
  })

  const demoModules = getDemoModulesByRecipient(recipientId)
  response.cookies.set('nonato_demo_recipient', recipientId, {
    path: '/',
    maxAge: cookieMaxAge,
    sameSite: 'lax',
  })
  if (demoModules) {
    response.cookies.set('nonato_demo_modules', encodeDemoModules(demoModules), {
      path: '/',
      maxAge: cookieMaxAge,
      sameSite: 'lax',
    })
  }
  response.cookies.set('nonato_demo_guest', '1', {
    path: '/',
    maxAge: cookieMaxAge,
    sameSite: 'lax',
  })
  if (opts?.markAccess !== false) {
    markDemoRecipientAccess(recipientId, startDate)
  }
}
