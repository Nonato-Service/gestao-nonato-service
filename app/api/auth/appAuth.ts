import crypto from 'crypto'
import fs from 'fs'
import path from 'path'
import { NextRequest, NextResponse } from 'next/server'
import { DATA_DIR, ensureDataDir } from '../data/shared'
import { getDemoContext, isDemoGuestLock, rejectDemoGuestProductionAccess } from '../data/demo-context'

export const APP_SESSION_COOKIE = 'nonato_app_session'
const SESSIONS_FILE = '_app-auth-sessions.json'
const SESSION_DAYS = 7
const SESSION_MAX_AGE = SESSION_DAYS * 24 * 60 * 60

type StoredUser = {
  id: string
  name: string
  email: string
  role: string
  isAdmin?: boolean
  linkedProfileType?: 'gestor' | 'tecnico' | ''
  linkedProfileId?: string
  permissions?: Record<string, boolean>
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
    linkedProfileType: session.linkedProfileType,
    linkedProfileId: session.linkedProfileId,
    permissions: session.permissions,
  }
}

export function validateAppCredentials(username: string, password: string): StoredUser | null {
  const usuario = username.trim()
  const senha = password.trim()
  if (!senha) return null

  const users = readJsonArray('nonato-users')
  const managedPasswords = readJsonArray('nonato-managed-passwords')

  if (users.length > 0) {
    let user =
      users.find(
        (u) =>
          u &&
          ((u.email && String(u.email).toLowerCase() === usuario.toLowerCase()) ||
            (u.name && String(u.name).toLowerCase() === usuario.toLowerCase()))
      ) || null
    if (!user && (usuario === '' || /admin|administrador/i.test(usuario))) {
      user = users.find((u) => u?.role && String(u.role).toLowerCase() === 'administrador') || users[0] || null
    }
    if (user && String(user.password || '').trim() === senha) {
      return {
        id: String(user.id),
        name: String(user.name || 'Utilizador'),
        email: String(user.email || ''),
        role: String(user.role || 'Utilizador'),
        isAdmin: Boolean(user.isAdmin),
        linkedProfileType: user.linkedProfileType || '',
        linkedProfileId: user.linkedProfileId || '',
        permissions: user.permissions && typeof user.permissions === 'object' ? user.permissions : {},
      }
    }
    return null
  }

  if (managedPasswords.length > 0) {
    const ok = managedPasswords.some((p) => p && String(p.password || '').trim() === senha)
    if (!ok) return null
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

  // Primeira instalação: ainda sem utilizadores nem senhas no Gestor de Senhas.
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

export function createAppSession(user: StoredUser): { token: string; user: StoredUser; maxAge: number } {
  const token = crypto.randomBytes(32).toString('base64url')
  const expiresAt = new Date(Date.now() + SESSION_MAX_AGE * 1000).toISOString()
  const store = pruneExpiredSessions(readSessions())
  store.sessions[token] = { ...user, expiresAt }
  writeSessions(store)
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
  response.cookies.set(APP_SESSION_COOKIE, token, {
    path: '/',
    maxAge,
    sameSite: 'lax',
    httpOnly: true,
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
