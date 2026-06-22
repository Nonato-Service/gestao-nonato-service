import type { User, UserFormState } from '../components/admin/adminTypes'

export type UserPermissionKey = keyof UserFormState['permissions']

export type UserPermissionGroupId =
  | 'gestao'
  | 'parceiros'
  | 'documentacao'
  | 'pecas'
  | 'agenda'
  | 'servicos'
  | 'extras'

export type UserPermissionMeta = {
  key: UserPermissionKey
  icon: string
  accent: string
  labelKey: string
  hintKey: string
}

export type UserPermissionGroup = {
  id: UserPermissionGroupId
  icon: string
  titleKey: string
  descKey: string
  permissions: UserPermissionMeta[]
}

export const USER_PERMISSION_GROUPS: UserPermissionGroup[] = [
  {
    id: 'gestao',
    icon: '🛠️',
    titleKey: 'adminUsersGroupGestao',
    descKey: 'adminUsersGroupGestaoDesc',
    permissions: [
      { key: 'gestores', icon: '👔', accent: 'violet', labelKey: 'permissionGestores', hintKey: 'adminUsersPermHintGestores' },
      { key: 'equipamentos', icon: '⚙️', accent: 'cyan', labelKey: 'permissionEquipamentos', hintKey: 'adminUsersPermHintEquipamentos' },
      { key: 'desmontados', icon: '🔩', accent: 'slate', labelKey: 'permissionDesmontados', hintKey: 'adminUsersPermHintDesmontados' },
    ],
  },
  {
    id: 'parceiros',
    icon: '🤝',
    titleKey: 'adminUsersGroupParceiros',
    descKey: 'adminUsersGroupParceirosDesc',
    permissions: [
      { key: 'clientes', icon: '🏢', accent: 'blue', labelKey: 'permissionClientes', hintKey: 'adminUsersPermHintClientes' },
      { key: 'fornecedores', icon: '📦', accent: 'amber', labelKey: 'permissionFornecedores', hintKey: 'adminUsersPermHintFornecedores' },
    ],
  },
  {
    id: 'documentacao',
    icon: '📋',
    titleKey: 'adminUsersGroupDocumentacao',
    descKey: 'adminUsersGroupDocumentacaoDesc',
    permissions: [
      { key: 'relatorioServico', icon: '📄', accent: 'green', labelKey: 'permissionRelatorioServico', hintKey: 'adminUsersPermHintRelatorioServico' },
    ],
  },
  {
    id: 'pecas',
    icon: '📚',
    titleKey: 'adminUsersGroupPecas',
    descKey: 'adminUsersGroupPecasDesc',
    permissions: [
      { key: 'bibliotecaPecas', icon: '🔧', accent: 'teal', labelKey: 'permissionBibliotecaPecas', hintKey: 'adminUsersPermHintBibliotecaPecas' },
    ],
  },
  {
    id: 'agenda',
    icon: '📅',
    titleKey: 'adminUsersGroupAgenda',
    descKey: 'adminUsersGroupAgendaDesc',
    permissions: [
      { key: 'agenda', icon: '🗓️', accent: 'indigo', labelKey: 'permissionAgenda', hintKey: 'adminUsersPermHintAgenda' },
    ],
  },
  {
    id: 'servicos',
    icon: '💶',
    titleKey: 'adminUsersGroupServicos',
    descKey: 'adminUsersGroupServicosDesc',
    permissions: [
      { key: 'cadastroServicos', icon: '💼', accent: 'rose', labelKey: 'permissionCadastroServicos', hintKey: 'adminUsersPermHintCadastroServicos' },
    ],
  },
  {
    id: 'extras',
    icon: '✨',
    titleKey: 'adminUsersGroupExtras',
    descKey: 'adminUsersGroupExtrasDesc',
    permissions: [
      { key: 'extras', icon: '🧩', accent: 'orange', labelKey: 'permissionExtras', hintKey: 'adminUsersPermHintExtras' },
    ],
  },
]

export const USER_PERMISSION_KEYS: UserPermissionKey[] = USER_PERMISSION_GROUPS.flatMap((g) =>
  g.permissions.map((p) => p.key)
)

export type UserPermissionPresetId = 'technician' | 'manager' | 'full' | 'clear'

export const USER_PERMISSION_PRESETS: Record<
  UserPermissionPresetId,
  Partial<Record<UserPermissionKey, boolean>>
> = {
  technician: {
    relatorioServico: true,
    agenda: true,
    bibliotecaPecas: true,
    equipamentos: true,
  },
  manager: {
    gestores: true,
    equipamentos: true,
    clientes: true,
    fornecedores: true,
    relatorioServico: true,
    bibliotecaPecas: true,
    agenda: true,
    cadastroServicos: true,
    desmontados: true,
  },
  full: Object.fromEntries(USER_PERMISSION_KEYS.map((k) => [k, true])) as Record<UserPermissionKey, boolean>,
  clear: Object.fromEntries(USER_PERMISSION_KEYS.map((k) => [k, false])) as Record<UserPermissionKey, boolean>,
}

export function countActivePermissions(
  permissions: UserFormState['permissions'] | User['permissions'] | undefined,
  isAdmin?: boolean
): number {
  if (isAdmin) return USER_PERMISSION_KEYS.length
  if (!permissions) return 0
  return USER_PERMISSION_KEYS.filter((key) => Boolean(permissions[key])).length
}

export function getActivePermissionKeys(
  permissions: UserFormState['permissions'] | User['permissions'] | undefined,
  isAdmin?: boolean
): UserPermissionKey[] {
  if (isAdmin) return [...USER_PERMISSION_KEYS]
  if (!permissions) return []
  return USER_PERMISSION_KEYS.filter((key) => Boolean(permissions[key]))
}

export function applyPermissionPreset(
  current: UserFormState['permissions'],
  preset: UserPermissionPresetId
): UserFormState['permissions'] {
  const patch = USER_PERMISSION_PRESETS[preset]
  return { ...current, ...patch }
}

export function setGroupPermissions(
  current: UserFormState['permissions'],
  group: UserPermissionGroup,
  enabled: boolean
): UserFormState['permissions'] {
  const next = { ...current }
  group.permissions.forEach((p) => {
    next[p.key] = enabled
  })
  return next
}
