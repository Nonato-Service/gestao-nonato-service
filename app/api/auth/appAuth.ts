import crypto from 'crypto'
import fs from 'fs'
import path from 'path'
import { NextRequest, NextResponse } from 'next/server'
import { DATA_DIR, ensureDataDir } from '../data/shared'
import { ensureUserMenuPolicy } from '../../lib/sidebarMenuPermissions'
import { getDemoContext, isDemoGuestLock, rejectDemoGuestProductionAccess } from '../data/demo-context'

export const APP_SESSION_COOKIE = 'nonato_app_session'
const SESSIONS_FILE = '_app-auth-sessions.json'
/** 30 dias: a sessão não cai a cada deploy nem ao fim de uma semana de trabalho. */
const SESSION_DAYS = 30
const SESSION_MAX_AGE = SESSION_DAYS * 24 * 60 * 60
const SIGNED_COOKIE_PREFIX = 'v1.'

export type StoredUser = {
  id: string
  name: string
  email: string
  role: string
  isAdmin?: boolean
  isDemoGuest?: boolean
  demoRecipientId?: string
  linkedProfileType?: 'gestor' | 'tecnico' | ''
  linkedProfileId?: string
  permissions?: Record<string, boolean>
  menuItems?: Record<string, boolean>
  menuItemsConfigured?: boolean
}

type AppSession = StoredUser & {
  expiresAt: string
}

type SessionsFile = {
  sessions: Record<string, AppSession>
}

function readJsonArray(key: string): any[] {
  try {
    ensureDataDir()
    const filePath = path.join(DATA_DIR, `${key}.json`)
    if (!fs.existsSync(filePath)) return []
    const raw = fs.readFileSync(filePath, 'utf-8')
    if (!raw.trim()) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function readSessions(): SessionsFile {
  try {
    ensureDataDir()
    const filePath = path.join(DATA_DIR, SESSIONS_FILE)
    if (!fs.existsSync(filePath)) return { sessions: {} }
    const raw = fs.readFileSync(filePath, 'utf-8')
    if (!raw.trim()) return { sessions: {} }
    const parsed = JSON.parse(raw) as SessionsFile
    return parsed?.sessions && typeof parsed.sessions === 'object' ? parsed : { sessions: {} }
  } catch {
    return { sessions: {} }
  }
}

function writeSessions(data: SessionsFile): void {
  ensureDataDir()
  const filePath = path.join(DATA_DIR, SESSIONS_FILE)
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8')
}

function pruneExpiredSessions(data: SessionsFile): SessionsFile {
  const now = Date.now()
  const sessions: Record<string, AppSession> = {}
  for (const [token, session] of Object.entries(data.sessions)) {
    if (new Date(session.expiresAt).getTime() > now) sessions[token] = session
  }
  return { sessions }
}

function toPublicUser(session: AppSession): StoredUser {
  return {
    id: session.id,
    name: session.name,
    email: session.email,
    role: session.role,
    isAdmin: session.isAdmin,
    isDemoGuest: session.isDemoGuest,
    demoRecipientId: session.demoRecipientId,
    linkedProfileType: session.linkedProfileType,
    linkedProfileId: session.linkedProfileId,
    permissions: session.permissions,
    menuItems: session.menuItems,
    menuItemsConfigured: session.menuItemsConfigured,
  }
}

function toStoredUser(user: any): StoredUser {
  return ensureUserMenuPolicy({
    id: String(user.id),
    name: String(user.name || 'Utilizador'),
    email: String(user.email || ''),
    role: String(user.role || 'Utilizador'),
    isAdmin: Boolean(user.isAdmin),
    linkedProfileType: user.linkedProfileType || '',
    linkedProfileId: user.linkedProfileId || '',
    permissions: user.permissions && typeof user.permissions === 'object' ? user.permissions : {},
    menuItems:
      user.menuItems && typeof user.menuItems === 'object' && !Array.isArray(user.menuItems)
        ? user.menuItems
        : undefined,
    menuItemsConfigured: Boolean(user.menuItemsConfigured),
  })
}

function normalizeLoginText(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, ' ')
}

function gmailLocalPart(email: string): string {
  const at = email.indexOf('@')
  if (at <= 0) return email
  return email.slice(0, at).replace(/\./g, '')
}

function emailMatchesLogin(input: string, email: string): boolean {
  const a = normalizeLoginText(input)
  const b = normalizeLoginText(email)
  if (!a || !b) return false
  if (a === b) return true
  const aAt = a.indexOf('@')
  const bAt = b.indexOf('@')
  if (aAt > 0 && bAt > 0) {
    const aDomain = a.slice(aAt + 1)
    const bDomain = b.slice(bAt + 1)
    if (aDomain === bDomain && gmailLocalPart(a) === gmailLocalPart(b)) return true
  }
  if (b.includes(a) || a.includes(b.split('@')[0] || b)) return true
  return false
}

function nameMatchesLogin(input: string, name: string): boolean {
  const a = normalizeLoginText(input)
  const b = normalizeLoginText(name)
  if (!a || !b) return false
  if (a === b) return true
  if (b.includes(a) || a.includes(b)) return true
  return false
}

function findUserByLoginInput(users: any[], usuario: string): any | null {
  if (!usuario) return null
  const direct =
    users.find(
      (u) =>
        u &&
        ((u.email && emailMatchesLogin(usuario, String(u.email))) ||
          (u.name && nameMatchesLogin(usuario, String(u.name))))
    ) || null
  if (direct) return direct
  if (/admin|administrador/i.test(usuario)) {
    return (
      users.find((u) => u?.isAdmin) ||
      users.find((u) => String(u?.role || '').toLowerCase().includes('admin')) ||
      users[0] ||
      null
    )
  }
  return null
}

function findUserByPassword(users: any[], senha: string): any | null {
  const matches = users.filter((u) => u && String(u.password || '').trim() === senha)
  if (matches.length === 1) return matches[0]
  if (matches.length > 1) {
    return matches.find((u) => u.isAdmin) || matches[0]
  }
  return null
}

function adminFallbackUser(users: any[]): StoredUser {
  const admin =
    users.find((u) => u?.isAdmin) ||
    users.find((u) => String(u?.role || '').toLowerCase().includes('admin')) ||
    users[0]
  if (admin) return toStoredUser({ ...admin, isAdmin: true })
  return {
    id: 'temp-admin',
    name: 'Administrador',
    email: '',
    role: 'Administrador',
    isAdmin: true,
    permissions: {
      gestores: true,
      equipamentos: true,
      clientes: true,
      fornecedores: true,
      relatorioServico: true,
      bibliotecaPecas: true,
      agenda: true,
      desmontados: true,
      cadastroServicos: true,
      extras: true,
    },
  }
}

function writeJsonArray(key: string, value: any[]): void {
  ensureDataDir()
  const filePath = path.join(DATA_DIR, `${key}.json`)
  fs.writeFileSync(filePath, JSON.stringify(value, null, 2), 'utf-8')
}

/** Redefine senha do administrador no volume de dados (produção). */
export function resetAdminPasswordOnDisk(newPassword: string, email?: string): StoredUser | null {
  const senha = newPassword.trim()
  if (senha.length < 4) return null

  const users = readJsonArray('nonato-users')
  if (!users.length) {
    const novo = {
      id: String(Date.now()),
      name: 'NONATO SERVICE',
      email: email?.trim() || 'nonato.service@gmail.com',
      role: 'ADMIN',
      password: senha,
      isAdmin: true,
      permissions: {
        gestores: true,
        equipamentos: true,
        clientes: true,
        fornecedores: true,
        relatorioServico: true,
        bibliotecaPecas: true,
        agenda: true,
        desmontados: true,
        cadastroServicos: true,
        extras: true,
      },
    }
    writeJsonArray('nonato-users', [novo])
    return toStoredUser(novo)
  }

  const admin =
    users.find((u) => u?.isAdmin) ||
    users.find((u) => String(u?.role || '').toLowerCase().includes('admin')) ||
    users[0]
  const updated = users.map((u) =>
    u?.id === admin.id
      ? {
          ...u,
          password: senha,
          isAdmin: true,
          ...(email?.trim() ? { email: email.trim() } : {}),
        }
      : u
  )
  writeJsonArray('nonato-users', updated)

  const managed = readJsonArray('nonato-managed-passwords')
  if (managed.length) {
    writeJsonArray(
      'nonato-managed-passwords',
      managed.map((entry) =>
        entry?.tecnicoName === admin.name ? { ...entry, password: senha } : entry
      )
    )
  }

  return toStoredUser({ ...admin, password: senha, isAdmin: true, email: email?.trim() || admin.email })
}

export function validateAppCredentials(username: string, password: string): StoredUser | null {
  const usuario = username.trim()
  const senha = password.trim()
  if (!senha || !usuario) return null

  const masterPassword = process.env.NONATO_MASTER_PASSWORD?.trim()
  if (masterPassword && senha === masterPassword) {
    const users = readJsonArray('nonato-users')
    return adminFallbackUser(users)
  }

  const users = readJsonArray('nonato-users')
  const managedPasswords = readJsonArray('nonato-managed-passwords')

  if (users.length > 0) {
    const byLogin = findUserByLoginInput(users, usuario)
    if (byLogin && String(byLogin.password || '').trim() === senha) {
      return toStoredUser(byLogin)
    }

    const managedOk = managedPasswords.some((p) => p && String(p.password || '').trim() === senha)
    if (managedOk) {
      return adminFallbackUser(users)
    }

    return null
  }

  if (managedPasswords.length > 0) {
    const ok = managedPasswords.some((p) => p && String(p.password || '').trim() === senha)
    if (!ok) return null
    return adminFallbackUser([])
  }

  if (!users.length && !managedPasswords.length && senha.length >= 4) {
    return {
      id: 'bootstrap-admin',
      name: 'Administrador',
      email: '',
      role: 'Administrador',
      isAdmin: true,
      permissions: {
        gestores: true,
        equipamentos: true,
        clientes: true,
        fornecedores: true,
        relatorioServico: true,
        bibliotecaPecas: true,
        agenda: true,
        desmontados: true,
        cadastroServicos: true,
        extras: true,
      },
    }
  }

  return null
}

function sessionHmacSecret(): string {
  return (
    process.env.NONATO_SESSION_SECRET?.trim() ||
    process.env.NONATO_API_SECRET?.trim() ||
    process.env.NONATO_MASTER_PASSWORD?.trim() ||
    'nonato-session-hmac-v1'
  )
}

type SignedSessionBody = {
  id: string
  name: string
  email: string
  role: string
  isAdmin?: boolean
  isDemoGuest?: boolean
  demoRecipientId?: string
  linkedProfileType?: 'gestor' | 'tecnico' | ''
  linkedProfileId?: string
  exp: number
}

function compactUser(user: StoredUser): Omit<SignedSessionBody, 'exp'> {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    isAdmin: user.isAdmin,
    isDemoGuest: user.isDemoGuest,
    demoRecipientId: user.demoRecipientId,
    linkedProfileType: user.linkedProfileType,
    linkedProfileId: user.linkedProfileId,
  }
}

function signSessionBody(body: SignedSessionBody): string {
  const payload = Buffer.from(JSON.stringify(body), 'utf8').toString('base64url')
  const sig = crypto.createHmac('sha256', sessionHmacSecret()).update(payload).digest('base64url')
  return `${SIGNED_COOKIE_PREFIX}${payload}.${sig}`
}

function safeEqualUtf8(a: string, b: string): boolean {
  const ba = Buffer.from(a)
  const bb = Buffer.from(b)
  if (ba.length !== bb.length) return false
  return crypto.timingSafeEqual(ba, bb)
}

function readSignedSession(token: string): SignedSessionBody | null {
  if (!token.startsWith(SIGNED_COOKIE_PREFIX)) return null
  const rest = token.slice(SIGNED_COOKIE_PREFIX.length)
  const dot = rest.lastIndexOf('.')
  if (dot <= 0) return null
  const payload = rest.slice(0, dot)
  const sig = rest.slice(dot + 1)
  const expected = crypto.createHmac('sha256', sessionHmacSecret()).update(payload).digest('base64url')
  if (!safeEqualUtf8(sig, expected)) return null
  try {
    const body = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as SignedSessionBody
    if (!body?.id || typeof body.exp !== 'number') return null
    if (body.exp <= Date.now()) return null
    return body
  } catch {
    return null
  }
}

function hydrateSignedUser(body: SignedSessionBody): StoredUser {
  const fallback = toStoredUser({
    id: body.id,
    name: body.name,
    email: body.email,
    role: body.role,
    isAdmin: body.isAdmin,
    isDemoGuest: body.isDemoGuest,
    demoRecipientId: body.demoRecipientId,
    linkedProfileType: body.linkedProfileType,
    linkedProfileId: body.linkedProfileId,
  })
  if (body.isDemoGuest) return fallback
  const users = readJsonArray('nonato-users')
  const found = users.find((u) => u && String(u.id) === String(body.id))
  return found ? toStoredUser(found) : fallback
}

export function createAppSession(user: StoredUser): { token: string; user: StoredUser; maxAge: number } {
  const exp = Date.now() + SESSION_MAX_AGE * 1000
  const token = signSessionBody({ ...compactUser(user), exp })
  return { token, user, maxAge: SESSION_MAX_AGE }
}

export function clearAppSession(token: string | null | undefined): void {
  if (!token) return
  const store = pruneExpiredSessions(readSessions())
  if (store.sessions[token]) {
    delete store.sessions[token]
    writeSessions(store)
  }
}

export function getAppSessionFromRequest(request: NextRequest): StoredUser | null {
  const token = request.cookies.get(APP_SESSION_COOKIE)?.value
  if (!token) return null
  const signed = readSignedSession(token)
  if (signed) return hydrateSignedUser(signed)
  const store = pruneExpiredSessions(readSessions())
  const session = store.sessions[token]
  if (!session) return null
  if (new Date(session.expiresAt).getTime() <= Date.now()) {
    delete store.sessions[token]
    writeSessions(store)
    return null
  }
  return toPublicUser(session)
}

export function applyAppSessionCookie(response: NextResponse, token: string, maxAge: number): void {
  const secure =
    process.env.NODE_ENV === 'production' ||
    process.env.VERCEL === '1' ||
    Boolean(process.env.RAILWAY_PUBLIC_DOMAIN)
  response.cookies.set(APP_SESSION_COOKIE, token, {
    path: '/',
    maxAge,
    sameSite: 'lax',
    httpOnly: true,
    secure,
  })
}

export function clearAppSessionCookie(response: NextResponse): void {
  response.cookies.set(APP_SESSION_COOKIE, '', { path: '/', maxAge: 0 })
}

/** Bloqueia APIs de produção sem sessão autenticada (modo demo continua isolado). */
export function rejectUnauthenticatedProductionAccess(request: NextRequest): NextResponse | null {
  const guestDenied = rejectDemoGuestProductionAccess(request)
  if (guestDenied) return guestDenied

  const { isDemo, expired } = getDemoContext(request)
  if (isDemo && !expired) return null
  if (isDemoGuestLock(request)) {
    return NextResponse.json(
      {
        error: 'demo_guest_locked',
        message: 'Acesso à aplicação real não permitido nesta demonstração.',
      },
      { status: 403 }
    )
  }

  if (!getAppSessionFromRequest(request)) {
    return NextResponse.json(
      {
        error: 'auth_required',
        message: 'Inicie sessão com utilizador e senha para aceder aos dados.',
      },
      { status: 401 }
    )
  }
  return null
}
