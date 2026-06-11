import crypto from 'crypto'
import fs from 'fs'
import path from 'path'
import { NextRequest, NextResponse } from 'next/server'
import { DATA_DIR, ensureDataDir } from '../data/shared'

export const CAMPO_SESSION_COOKIE = 'nonato_campo_session'
const USERS_FILE = 'nonato-campo-users.json'
const SESSIONS_FILE = '_campo-auth-sessions.json'
const SESSION_DAYS = 30
const SESSION_MAX_AGE = SESSION_DAYS * 24 * 60 * 60

export type CampoPermissions = {
  home: boolean
  empresa: boolean
  servicos: boolean
  relatorios: boolean
  despesas: boolean
  clientes: boolean
  fechamento: boolean
  gestao: boolean
}

export type CampoUser = {
  id: string
  name: string
  login: string
  password: string
  role: 'gestor' | 'tecnico'
  isAdmin: boolean
  active: boolean
  permissions: CampoPermissions
  createdAt: string
  updatedAt: string
}

export type CampoPublicUser = Omit<CampoUser, 'password'>

type CampoSession = CampoPublicUser & { expiresAt: string }

type SessionsFile = { sessions: Record<string, CampoSession> }

export const CAMPO_PERMISSION_KEYS: (keyof CampoPermissions)[] = [
  'home',
  'empresa',
  'servicos',
  'relatorios',
  'despesas',
  'clientes',
  'fechamento',
  'gestao',
]

export function defaultGestorPermissions(): CampoPermissions {
  return {
    home: true,
    empresa: true,
    servicos: true,
    relatorios: true,
    despesas: true,
    clientes: true,
    fechamento: true,
    gestao: true,
  }
}

export function defaultTecnicoPermissions(): CampoPermissions {
  return {
    home: true,
    empresa: false,
    servicos: false,
    relatorios: true,
    despesas: true,
    clientes: false,
    fechamento: false,
    gestao: false,
  }
}

function normalizePermissions(input: unknown, fallback: CampoPermissions): CampoPermissions {
  const src = input && typeof input === 'object' ? (input as Record<string, unknown>) : {}
  const out = { ...fallback }
  for (const key of CAMPO_PERMISSION_KEYS) {
    if (typeof src[key] === 'boolean') out[key] = src[key]
  }
  return out
}

function normalizeLogin(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, ' ')
}

function usersFilePath(): string {
  return path.join(DATA_DIR, USERS_FILE)
}

function sessionsFilePath(): string {
  return path.join(DATA_DIR, SESSIONS_FILE)
}

function readUsers(): CampoUser[] {
  try {
    ensureDataDir()
    const filePath = usersFilePath()
    if (!fs.existsSync(filePath)) return []
    const raw = fs.readFileSync(filePath, 'utf-8')
    if (!raw.trim()) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function writeUsers(users: CampoUser[]): void {
  ensureDataDir()
  fs.writeFileSync(usersFilePath(), JSON.stringify(users, null, 2), 'utf-8')
}

function readSessions(): SessionsFile {
  try {
    ensureDataDir()
    const filePath = sessionsFilePath()
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
  fs.writeFileSync(sessionsFilePath(), JSON.stringify(data, null, 2), 'utf-8')
}

function pruneExpiredSessions(data: SessionsFile): SessionsFile {
  const now = Date.now()
  const sessions: Record<string, CampoSession> = {}
  for (const [token, session] of Object.entries(data.sessions)) {
    if (new Date(session.expiresAt).getTime() > now) sessions[token] = session
  }
  return { sessions }
}

export function toPublicUser(user: CampoUser): CampoPublicUser {
  const { password: _password, ...rest } = user
  return rest
}

function toStoredUser(raw: Partial<CampoUser>): CampoUser {
  const role: CampoUser['role'] = raw.role === 'gestor' ? 'gestor' : 'tecnico'
  const isAdmin = Boolean(raw.isAdmin || role === 'gestor')
  const fallback = isAdmin ? defaultGestorPermissions() : defaultTecnicoPermissions()
  const now = new Date().toISOString()
  return {
    id: String(raw.id || Date.now()),
    name: String(raw.name || 'Utilizador').trim() || 'Utilizador',
    login: normalizeLogin(String(raw.login || raw.name || 'user')),
    password: String(raw.password || '').trim(),
    role,
    isAdmin,
    active: raw.active !== false,
    permissions: normalizePermissions(raw.permissions, fallback),
    createdAt: String(raw.createdAt || now),
    updatedAt: String(raw.updatedAt || now),
  }
}

function bootstrapGestorIfNeeded(): CampoUser | null {
  const users = readUsers()
  if (users.length) return null

  const login = normalizeLogin(process.env.CAMPO_GESTOR_LOGIN || 'gestor')
  const password =
    process.env.CAMPO_GESTOR_PASSWORD?.trim() ||
    process.env.NONATO_MASTER_PASSWORD?.trim() ||
    ''

  if (!password || password.length < 4) return null

  const now = new Date().toISOString()
  const gestor: CampoUser = {
    id: String(Date.now()),
    name: 'Gestor',
    login,
    password,
    role: 'gestor',
    isAdmin: true,
    active: true,
    permissions: defaultGestorPermissions(),
    createdAt: now,
    updatedAt: now,
  }
  writeUsers([gestor])
  return gestor
}

export function validateCampoCredentials(loginInput: string, passwordInput: string): CampoPublicUser | null {
  bootstrapGestorIfNeeded()

  const login = normalizeLogin(loginInput)
  const password = passwordInput.trim()
  if (!login || !password) return null

  const masterPassword = process.env.NONATO_MASTER_PASSWORD?.trim()
  if (masterPassword && password === masterPassword) {
    const users = readUsers()
    const gestor =
      users.find((u) => u.isAdmin && u.active !== false) ||
      users.find((u) => u.role === 'gestor' && u.active !== false) ||
      users[0]
    if (gestor) return toPublicUser(gestor)
  }

  const users = readUsers()
  const user = users.find((u) => u.active !== false && normalizeLogin(u.login) === login)
  if (!user) return null
  if (String(user.password || '').trim() !== password) return null
  return toPublicUser(user)
}

export function createCampoSession(user: CampoPublicUser): { token: string; user: CampoPublicUser; maxAge: number } {
  const token = crypto.randomBytes(32).toString('base64url')
  const expiresAt = new Date(Date.now() + SESSION_MAX_AGE * 1000).toISOString()
  const store = pruneExpiredSessions(readSessions())
  store.sessions[token] = { ...user, expiresAt }
  writeSessions(store)
  return { token, user, maxAge: SESSION_MAX_AGE }
}

export function clearCampoSession(token: string | null | undefined): void {
  if (!token) return
  const store = pruneExpiredSessions(readSessions())
  if (store.sessions[token]) {
    delete store.sessions[token]
    writeSessions(store)
  }
}

export function getCampoSessionFromRequest(request: NextRequest): CampoPublicUser | null {
  const token = request.cookies.get(CAMPO_SESSION_COOKIE)?.value
  if (!token) return null
  const store = pruneExpiredSessions(readSessions())
  const session = store.sessions[token]
  if (!session) return null
  if (new Date(session.expiresAt).getTime() <= Date.now()) {
    delete store.sessions[token]
    writeSessions(store)
    return null
  }
  if (session.active === false) return null
  return session
}

export function applyCampoSessionCookie(response: NextResponse, token: string, maxAge: number): void {
  const secure =
    process.env.NODE_ENV === 'production' ||
    process.env.VERCEL === '1' ||
    Boolean(process.env.RAILWAY_PUBLIC_DOMAIN)
  response.cookies.set(CAMPO_SESSION_COOKIE, token, {
    path: '/',
    maxAge,
    sameSite: 'lax',
    httpOnly: true,
    secure,
  })
}

export function clearCampoSessionCookie(response: NextResponse): void {
  response.cookies.set(CAMPO_SESSION_COOKIE, '', { path: '/', maxAge: 0 })
}

export function requireCampoSession(request: NextRequest): CampoPublicUser | NextResponse {
  const user = getCampoSessionFromRequest(request)
  if (!user) {
    return NextResponse.json(
      { error: 'auth_required', message: 'Inicie sessão no Nonato Campo.' },
      { status: 401 }
    )
  }
  return user
}

export function requireCampoGestor(request: NextRequest): CampoPublicUser | NextResponse {
  const result = requireCampoSession(request)
  if (result instanceof NextResponse) return result
  if (!result.isAdmin && !result.permissions?.gestao) {
    return NextResponse.json(
      { error: 'forbidden', message: 'Apenas o gestor pode executar esta acção.' },
      { status: 403 }
    )
  }
  return result
}

export function listCampoUsers(): CampoPublicUser[] {
  bootstrapGestorIfNeeded()
  return readUsers().filter((u) => u.active !== false).map(toPublicUser)
}

export function createCampoUser(input: {
  name: string
  login: string
  password: string
  role?: 'gestor' | 'tecnico'
  permissions?: Partial<CampoPermissions>
}): CampoPublicUser {
  const users = readUsers()
  const login = normalizeLogin(input.login)
  if (!login) throw new Error('login_required')
  if (users.some((u) => normalizeLogin(u.login) === login)) throw new Error('login_exists')

  const password = String(input.password || '').trim()
  if (password.length < 4) throw new Error('password_short')

  const role: CampoUser['role'] = input.role === 'gestor' ? 'gestor' : 'tecnico'
  const isAdmin = role === 'gestor'
  const now = new Date().toISOString()
  const user = toStoredUser({
    id: String(Date.now()) + '-' + crypto.randomBytes(3).toString('hex'),
    name: String(input.name || '').trim() || login,
    login,
    password,
    role,
    isAdmin,
    active: true,
    permissions: normalizePermissions(
      input.permissions,
      isAdmin ? defaultGestorPermissions() : defaultTecnicoPermissions()
    ),
    createdAt: now,
    updatedAt: now,
  })

  users.push(user)
  writeUsers(users)
  return toPublicUser(user)
}

export function updateCampoUser(
  id: string,
  input: {
    name?: string
    login?: string
    password?: string
    role?: 'gestor' | 'tecnico'
    active?: boolean
    permissions?: Partial<CampoPermissions>
  }
): CampoPublicUser | null {
  const users = readUsers()
  const idx = users.findIndex((u) => u.id === id)
  if (idx < 0) return null

  const current = users[idx]
  const nextLogin = input.login != null ? normalizeLogin(input.login) : current.login
  if (!nextLogin) throw new Error('login_required')
  if (users.some((u, i) => i !== idx && normalizeLogin(u.login) === nextLogin)) throw new Error('login_exists')

  const role: CampoUser['role'] =
    input.role === 'gestor' ? 'gestor' : input.role === 'tecnico' ? 'tecnico' : current.role
  const isAdmin = role === 'gestor'
  const fallback = isAdmin ? defaultGestorPermissions() : defaultTecnicoPermissions()

  const updated: CampoUser = {
    ...current,
    name: input.name != null ? String(input.name).trim() || nextLogin : current.name,
    login: nextLogin,
    password:
      input.password != null && String(input.password).trim()
        ? String(input.password).trim()
        : current.password,
    role,
    isAdmin,
    active: input.active !== undefined ? Boolean(input.active) : current.active,
    permissions:
      input.permissions != null
        ? normalizePermissions(input.permissions, fallback)
        : normalizePermissions(current.permissions, fallback),
    updatedAt: new Date().toISOString(),
  }

  if (updated.password.length < 4) throw new Error('password_short')

  users[idx] = updated
  writeUsers(users)
  return toPublicUser(updated)
}

export function deleteCampoUser(id: string): boolean {
  const users = readUsers()
  const activeGestores = users.filter((u) => u.active !== false && (u.isAdmin || u.role === 'gestor'))
  const target = users.find((u) => u.id === id)
  if (!target) return false
  if ((target.isAdmin || target.role === 'gestor') && activeGestores.length <= 1) {
    throw new Error('last_gestor')
  }
  const next = users.map((u) => (u.id === id ? { ...u, active: false, updatedAt: new Date().toISOString() } : u))
  writeUsers(next)
  return true
}
