/** Formulário de utilizadores (admin) — estado vazio e mapeamento User → form. */

import type { UserFormState } from '../../components/admin/adminTypes'
import {
  buildMenuItemsFromLegacyPermissions,
  normalizeMenuItemsWithLegacyFallback,
} from '../../lib/sidebarMenuPermissions'

export type { UserFormState }

/** Subconjunto de User necessário para popular o formulário. */
export type UserForForm = {
  name: string
  email: string
  role: string
  linkedProfileType?: 'gestor' | 'tecnico' | ''
  linkedProfileId?: string
  password?: string
  isAdmin?: boolean
  permissions?: {
    gestores?: boolean
    equipamentos?: boolean
    clientes?: boolean
    fornecedores?: boolean
    relatorioServico?: boolean
    bibliotecaPecas?: boolean
    agenda?: boolean
    desmontados?: boolean
    cadastroServicos?: boolean
    extras?: boolean
  }
  menuItems?: Record<string, boolean>
  menuItemsConfigured?: boolean
}

const PERMS_FALSE = {
  gestores: false,
  equipamentos: false,
  clientes: false,
  fornecedores: false,
  relatorioServico: false,
  bibliotecaPecas: false,
  agenda: false,
  desmontados: false,
  cadastroServicos: false,
  extras: false,
} as const

export function createEmptyUserForm(): UserFormState {
  return {
    name: '',
    email: '',
    role: '',
    linkedProfileType: '',
    linkedProfileId: '',
    password: '',
    isAdmin: false,
    permissions: { ...PERMS_FALSE },
    menuItems: buildMenuItemsFromLegacyPermissions({ ...PERMS_FALSE }),
    menuItemsConfigured: false,
  }
}

export function userToFormState(user: UserForForm, passwordField?: string): UserFormState {
  const permissions = {
    gestores: Boolean(user.permissions?.gestores),
    equipamentos: Boolean(user.permissions?.equipamentos),
    clientes: Boolean(user.permissions?.clientes),
    fornecedores: Boolean(user.permissions?.fornecedores),
    relatorioServico: Boolean(user.permissions?.relatorioServico),
    bibliotecaPecas: Boolean(user.permissions?.bibliotecaPecas),
    agenda: Boolean(user.permissions?.agenda),
    desmontados: Boolean(user.permissions?.desmontados),
    cadastroServicos: Boolean(user.permissions?.cadastroServicos),
    extras: Boolean(user.permissions?.extras),
  }
  return {
    name: user.name,
    email: user.email,
    role: user.role,
    linkedProfileType: user.linkedProfileType || '',
    linkedProfileId: user.linkedProfileId || '',
    password: passwordField !== undefined ? passwordField : user.password || '',
    isAdmin: user.isAdmin ?? false,
    permissions,
    menuItems: user.menuItemsConfigured
      ? normalizeMenuItemsWithLegacyFallback(user.menuItems, permissions)
      : buildMenuItemsFromLegacyPermissions(permissions, user.menuItems),
    menuItemsConfigured: Boolean(user.menuItemsConfigured),
  }
}
