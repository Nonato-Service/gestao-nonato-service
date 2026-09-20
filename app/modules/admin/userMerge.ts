/** União de utilizadores por id — a última gravação do Administrador ganha (pode adicionar ou retirar). */

import type { User } from './userTipos'

function asUserList(value: unknown): User[] {
  return Array.isArray(value) ? (value as User[]) : []
}

function userUpdatedMs(user: User | undefined): number {
  if (!user?.updatedAt) return 0
  const n = Date.parse(String(user.updatedAt))
  return Number.isFinite(n) ? n : 0
}

/** A escolha mais recente do Administrador prevalece — nunca repor o que ele retirou. */
export function pickRicherUser(a: User, b: User): User {
  const ta = userUpdatedMs(a)
  const tb = userUpdatedMs(b)
  if (tb !== ta) return tb > ta ? b : a
  const ca = Boolean(a.menuItemsConfigured)
  const cb = Boolean(b.menuItemsConfigured)
  if (ca !== cb) return cb ? b : a
  return a
}

export function mergeNonatoUsers(serverList: unknown, localList: unknown): User[] {
  const map = new Map<string, User>()
  for (const user of [...asUserList(serverList), ...asUserList(localList)]) {
    const id = String(user?.id || '').trim()
    if (!id) continue
    const prev = map.get(id)
    map.set(id, prev ? pickRicherUser(prev, user) : user)
  }
  return [...map.values()]
}
