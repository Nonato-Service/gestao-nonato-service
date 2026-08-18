/** Criação / actualização pura de User a partir do formulário admin. */

import type { UserFormState } from '../../components/admin/adminTypes'
import type { User, UserPermissions } from './userTipos'

export type UserFromFormMenuOpts = {
  menuItems: Record<string, boolean>
  menuItemsConfigured: boolean
  /** Permissões já sincronizadas com o menu (call-site aplica syncLegacy…). */
  permissions?: UserPermissions
  id?: string
}

/** Monta um User novo a partir do form (sem I/O / alertas / ensureUserMenuPolicy). */
export function createUserFromForm(
  form: UserFormState,
  opts: UserFromFormMenuOpts
): User {
  return {
    id: opts.id ?? Date.now().toString(),
    name: form.name,
    email: form.email,
    role: form.role,
    linkedProfileType: form.linkedProfileType || '',
    linkedProfileId: form.linkedProfileId || '',
    password: form.password,
    isAdmin: form.isAdmin,
    permissions: opts.permissions ?? form.permissions,
    menuItems: opts.menuItems,
    menuItemsConfigured: opts.menuItemsConfigured,
  }
}

/** Actualiza campos editáveis do User a partir do form (preserva id e extras). */
export function updateUserFromForm(
  existing: User,
  form: UserFormState,
  opts: Omit<UserFromFormMenuOpts, 'id'>
): User {
  return {
    ...existing,
    name: form.name,
    email: form.email,
    role: form.role,
    linkedProfileType: form.linkedProfileType || '',
    linkedProfileId: form.linkedProfileId || '',
    password: form.password || existing.password,
    isAdmin: form.isAdmin,
    permissions: opts.permissions ?? form.permissions,
    menuItems: opts.menuItems,
    menuItemsConfigured: opts.menuItemsConfigured,
  }
}
