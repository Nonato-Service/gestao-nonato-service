'use client'

export type SafeT = Record<string, string | undefined>

export type { AdminInterfaceLogoDraft, AdminBibliotecaLogoDraft } from '../../modules/admin/logoDrafts'

export type { LogoRelatorio } from '../../modules/admin/logosRelatorio'

export type { User, UserPermissions } from '../../modules/admin/userTipos'

export type { UserFormState } from '../../modules/admin/userFormState'

export type { GestorItem, TecnicoItem } from '../../modules/pessoas/gestorTecnicoItem'

/** Subconjunto usado na secção administrador (compatível com o tipo em NonatoMainApp). */
export type {
  ClientePrioritario,
  ClientePrioritarioForm,
} from '../../modules/clientes/prioritarioTipos'

export type { PasswordEntry } from '../../modules/admin/passwords'
export type { PasswordFormState } from '../../modules/admin/passwordForm'

export type SyncPendingRemote = {
  revision: number
  updatedAt?: string
  summaryLines: string[]
}

export type CodeBackup = { path: string; timestamp: string; filesCount: number }
export type AutoBackup = { timestamp: number; data?: { date?: string } }

export type { SidebarGroup, SidebarButton } from '../../modules/sidebar/tipos'
