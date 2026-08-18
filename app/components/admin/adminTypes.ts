'use client'

export type SafeT = Record<string, string | undefined>

export type AdminInterfaceLogoDraft = {
  previewUrl: string
  isVideo: boolean
  imageDataUrl?: string
}

export type AdminBibliotecaLogoDraft = {
  previewUrl: string
  dataUrl: string
  fileName: string
}

export type { LogoRelatorio } from '../../modules/admin/logosRelatorio'

export type { User, UserPermissions } from '../../modules/admin/userTipos'

export type UserFormState = {
  name: string
  email: string
  role: string
  linkedProfileType: 'gestor' | 'tecnico' | ''
  linkedProfileId: string
  password: string
  isAdmin: boolean
  permissions: {
    gestores: boolean
    equipamentos: boolean
    clientes: boolean
    fornecedores: boolean
    relatorioServico: boolean
    bibliotecaPecas: boolean
    agenda: boolean
    desmontados: boolean
    cadastroServicos: boolean
    extras: boolean
  }
  menuItems: Record<string, boolean>
  menuItemsConfigured: boolean
}

export type GestorItem = { id: string; name: string; area?: string }
export type TecnicoItem = { id: string; name: string; type?: 'internal' | 'external' | string }

/** Subconjunto usado na secção administrador (compatível com o tipo em NonatoMainApp). */
export type {
  ClientePrioritario,
  ClientePrioritarioForm,
} from '../../modules/clientes/prioritarioTipos'

export type { PasswordEntry } from '../../modules/admin/passwords'

export type SyncPendingRemote = {
  revision: number
  updatedAt?: string
  summaryLines: string[]
}

export type CodeBackup = { path: string; timestamp: string; filesCount: number }
export type AutoBackup = { timestamp: number; data?: { date?: string } }

export type SidebarGroup =
  | 'gestao-tecnica' | 'parceiros-comercial' | 'documentacao-relatorios' | 'pecas-biblioteca' | 'gestao-custos'
  | 'gestao-industrial' | 'gestao-financeira' | 'checklist-group' | 'comunicacao-interna'
  | 'manuais-informacoes-tecnicas' | 'biblia-nonato-service' | 'almoxarifado-armazem'
  | 'empresa-institucional' | 'outros'

export type SidebarButton = {
  id: string
  name: string
  action: string
  order: number
  translationKey?: string
  group?: SidebarGroup
  customName?: boolean
}
