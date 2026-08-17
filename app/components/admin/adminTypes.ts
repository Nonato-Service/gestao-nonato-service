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

export type LogoRelatorio = {
  id: string
  name: string
  data: string
  type: 'image' | 'video'
}

export type User = {
  id: string
  name: string
  email: string
  role: string
  linkedProfileType?: 'gestor' | 'tecnico' | ''
  linkedProfileId?: string
  password?: string
  isAdmin?: boolean
  permissions?: Record<string, boolean | undefined>
  /** Itens do menu visíveis (botão da sidebar → on/off). Sobrepõe permissões legadas quando definido. */
  menuItems?: Record<string, boolean>
  /** Quando true, só aparecem itens explicitamente activos em menuItems. */
  menuItemsConfigured?: boolean
}

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

/** Subconjunto usado na secção administrador (compatível com o tipo em page.tsx). */
export type ClientePrioritario = {
  id: string
  nomeEmpresa: string
  morada: string
  localidade: string
  conselho: string
  pais: string
  codigoPostal: string
  freguesia: string
  numeroContribuicaoFiscal: string
  telefones: string
  email: string
  contato: string
  photo?: string
  equipamentos?: unknown[]
  relatorios?: Record<string, unknown[]>
}

export type ClientePrioritarioForm = {
  nomeEmpresa: string
  morada: string
  localidade: string
  conselho: string
  pais: string
  codigoPostal: string
  freguesia: string
  numeroContribuicaoFiscal: string
  telefones: string
  email: string
  contato: string
  photo: string
}

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
