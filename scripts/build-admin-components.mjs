import fs from 'fs'
import path from 'path'

const root = 'C:/Users/W10/gestao-tecnica-nonato-service'
const ext = path.join(root, 'app/components/admin/_extracted')
const out = path.join(root, 'app/components/admin')

function read(name) {
  return fs.readFileSync(path.join(ext, name), 'utf8')
}

// adminTypes.ts
fs.writeFileSync(path.join(out, 'adminTypes.ts'), `'use client'

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
}

export type GestorItem = { id: string; name: string; area?: string }
export type TecnicoItem = { id: string; name: string; type?: string }

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

export type PasswordEntry = {
  id: string
  tecnicoName: string
  password: string
  createdAt: string
  updatedAt?: string
}

export type SyncPendingRemote = {
  revision: number
  updatedAt?: string
  summaryLines: string[]
}

export type CodeBackup = { path: string; timestamp: string; filesCount: number }
export type AutoBackup = { timestamp: number; data?: { date?: string } }

export type SidebarGroup =
  | 'gestao-tecnica' | 'parceiros-comercial' | 'documentacao-relatorios' | 'gestao-custos'
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
`)

// AdminDisclosure
fs.writeFileSync(path.join(out, 'AdminDisclosure.tsx'), `'use client'

import React from 'react'

type Props = {
  id: string
  icon: string
  title: string
  sub: string
  toneClass: string
  children: React.ReactNode
}

export function AdminDisclosure({ id, icon, title, sub, toneClass, children }: Props) {
  return (
    <details id={id} className={\`admin-disclosure \${toneClass}\`}>
      <summary>
        <span className="admin-disclosure__icon" aria-hidden>{icon}</span>
        <span className="admin-disclosure__meta">
          <span className="admin-disclosure__title">{title}</span>
          <span className="admin-disclosure__sub">{sub}</span>
        </span>
        <span className="admin-disclosure__chev" aria-hidden>▼</span>
      </summary>
      <div className="admin-disclosure__body">{children}</div>
    </details>
  )
}
`)

// AdminPanelIndex
fs.writeFileSync(path.join(out, 'AdminPanelIndex.tsx'), `'use client'

import React from 'react'
import type { SafeT } from './adminTypes'

type Props = { safeT: SafeT }

function jumpTo(id: string) {
  const el = document.getElementById(id) as HTMLDetailsElement | null
  if (el) {
    el.open = true
    el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
}

export function AdminPanelIndex({ safeT }: Props) {
  return (
${read('panel-index.txt')}
  )
}
`)

// AdminSyncSection
fs.writeFileSync(path.join(out, 'AdminSyncSection.tsx'), `'use client'

import React from 'react'
import type { SafeT, SyncPendingRemote } from './adminTypes'

export type AdminSyncSectionProps = {
  safeT: SafeT
  syncPendingRemote: SyncPendingRemote | null
  syncPushLoading: boolean
  setSyncDecisionModalOpen: (open: boolean) => void
  setLastAcceptedRevision: (rev: number) => void
  pendingFullServerReplaceKey: string
  enviarEsteAparelhoParaServidor: () => void | Promise<void>
}

export function AdminSyncSection({
  safeT,
  syncPendingRemote,
  syncPushLoading,
  setSyncDecisionModalOpen,
  setLastAcceptedRevision,
  pendingFullServerReplaceKey,
  enviarEsteAparelhoParaServidor,
}: AdminSyncSectionProps) {
  return (
${read('sync.txt')}
  )
}
`)

// AdminConfigGeralSection
fs.writeFileSync(path.join(out, 'AdminConfigGeralSection.tsx'), `'use client'

import React from 'react'
import { NonatoBrandLogo } from '../NonatoBrandLogo'
import type { AdminBibliotecaLogoDraft, AdminInterfaceLogoDraft, LogoRelatorio, SafeT } from './adminTypes'

export type AdminConfigGeralSectionProps = {
  variant?: 'full' | 'compact'
  safeT: SafeT
  preverProximoNumeroRelatorio: (dataReferenciaIso?: string) => string
  logoUrl: string | null
  logoType: 'image' | 'video' | null
  logoUrlDashboard: string | null
  logoTypeDashboard: 'image' | 'video' | null
  adminSidebarLogoDraft: AdminInterfaceLogoDraft | null
  adminDashboardLogoDraft: AdminInterfaceLogoDraft | null
  adminLogoSavingSidebar: boolean
  adminLogoSavingDashboard: boolean
  handleFileChangeSidebarLogo: (e: React.ChangeEvent<HTMLInputElement>) => void
  handleFileChangeDashboardLogo: (e: React.ChangeEvent<HTMLInputElement>) => void
  commitAdminSidebarLogoDraft: () => void | Promise<void>
  discardAdminSidebarLogoDraft: () => void
  commitAdminDashboardLogoDraft: () => void | Promise<void>
  discardAdminDashboardLogoDraft: () => void
  handleRemoveSidebarLogo: () => void
  handleRemoveDashboardLogo: () => void
  pdfLogosModoUnificado?: boolean
  setPdfLogosModoUnificado?: (v: boolean) => void
  logosRelatorios?: LogoRelatorio[]
  adminBibliotecaLogoDraft?: AdminBibliotecaLogoDraft | null
  adminBibliotecaLogoSaving?: boolean
  logoRelatorioSelecionadoId?: string
  logoFechamentoSelecionadoId?: string
  logoOrcamentoSelecionadoId?: string
  logoProtocoloServicoSelecionadoId?: string
  incluirLogoNosRelatorios?: boolean
  incluirLogoFechamentosDespesas?: boolean
  setIncluirLogoNosRelatorios?: (v: boolean) => void
  setIncluirLogoFechamentosDespesas?: (v: boolean) => void
  setLogosRelatorios?: React.Dispatch<React.SetStateAction<LogoRelatorio[]>>
  setLogoRelatorioSelecionadoId?: (v: string) => void
  setLogoFechamentoSelecionadoId?: (v: string) => void
  setLogoOrcamentoSelecionadoId?: (v: string) => void
  setLogoProtocoloServicoSelecionadoId?: (v: string) => void
  saveData?: (key: string, value: unknown, saveToLocalStorage?: boolean, awaitServer?: boolean) => Promise<boolean>
  administradorPreviewPdfLogo?: (selectedId: string) => string | null
  aplicarLogoUnificadoTodosPdfs?: (logoId: string) => void
  administradorAddBibliotecaLogo?: (e: React.ChangeEvent<HTMLInputElement>) => void
  commitAdminBibliotecaLogoDraft?: () => void | Promise<void>
  discardAdminBibliotecaLogoDraft?: () => void
}

export function AdminConfigGeralSection({
  variant = 'full',
  safeT,
  preverProximoNumeroRelatorio,
  logoUrl,
  logoType,
  logoUrlDashboard,
  logoTypeDashboard,
  adminSidebarLogoDraft,
  adminDashboardLogoDraft,
  adminLogoSavingSidebar,
  adminLogoSavingDashboard,
  handleFileChangeSidebarLogo,
  handleFileChangeDashboardLogo,
  commitAdminSidebarLogoDraft,
  discardAdminSidebarLogoDraft,
  commitAdminDashboardLogoDraft,
  discardAdminDashboardLogoDraft,
  handleRemoveSidebarLogo,
  handleRemoveDashboardLogo,
  pdfLogosModoUnificado,
  setPdfLogosModoUnificado,
  logosRelatorios = [],
  adminBibliotecaLogoDraft,
  adminBibliotecaLogoSaving,
  logoRelatorioSelecionadoId = '',
  logoFechamentoSelecionadoId = '',
  logoOrcamentoSelecionadoId = '',
  logoProtocoloServicoSelecionadoId = '',
  incluirLogoNosRelatorios,
  incluirLogoFechamentosDespesas,
  setIncluirLogoNosRelatorios,
  setIncluirLogoFechamentosDespesas,
  setLogosRelatorios,
  setLogoRelatorioSelecionadoId,
  setLogoFechamentoSelecionadoId,
  setLogoOrcamentoSelecionadoId,
  setLogoProtocoloServicoSelecionadoId,
  saveData,
  administradorPreviewPdfLogo,
  aplicarLogoUnificadoTodosPdfs,
  administradorAddBibliotecaLogo,
  commitAdminBibliotecaLogoDraft,
  discardAdminBibliotecaLogoDraft,
}: AdminConfigGeralSectionProps) {
  if (variant === 'compact') {
    return (
${read('geral-compact.txt')}
    )
  }
  return (
${read('geral-full.txt')}
  )
}
`)

// AdminUsersSection
fs.writeFileSync(path.join(out, 'AdminUsersSection.tsx'), `'use client'

import React from 'react'
import type { GestorItem, SafeT, TecnicoItem, User, UserFormState } from './adminTypes'

export type AdminUsersSectionProps = {
  variant?: 'full' | 'compact'
  safeT: SafeT
  users: User[]
  showUserForm: boolean
  editingUser: User | null
  userForm: UserFormState
  setUserForm: React.Dispatch<React.SetStateAction<UserFormState>>
  gestores: GestorItem[]
  tecnicos: TecnicoItem[]
  handleAddUser: () => void
  handleEditUser: (user: User) => void
  handleDeleteUser: (id: string) => void
  handleSaveUser: () => void
  setShowUserForm: (v: boolean) => void
  setEditingUser: (v: User | null) => void
  createEmptyUserForm: () => UserFormState
}

export function AdminUsersSection({
  variant = 'full',
  safeT,
  users,
  showUserForm,
  editingUser,
  userForm,
  setUserForm,
  gestores,
  tecnicos,
  handleAddUser,
  handleEditUser,
  handleDeleteUser,
  handleSaveUser,
  setShowUserForm,
  setEditingUser,
  createEmptyUserForm,
}: AdminUsersSectionProps) {
  if (variant === 'compact') {
    return (
${read('users-compact.txt')}
    )
  }
  return (
${read('users-full.txt')}
  )
}
`)

// AdminClientePrioritarioSection
fs.writeFileSync(path.join(out, 'AdminClientePrioritarioSection.tsx'), `'use client'

import React from 'react'
import type { ClientePrioritario, ClientePrioritarioForm, SafeT } from './adminTypes'

export type AdminClientePrioritarioSectionProps = {
  safeT: SafeT
  clientePrioritario: ClientePrioritario | null
  showClientePrioritarioForm: boolean
  editingClientePrioritario: boolean
  clientePrioritarioForm: ClientePrioritarioForm
  setClientePrioritarioForm: React.Dispatch<React.SetStateAction<ClientePrioritarioForm>>
  handleAddClientePrioritario: () => void
  handleEditClientePrioritario: () => void
  handleDeleteClientePrioritario: () => void
  handleSaveClientePrioritario: () => void
  handleClientePrioritarioPhotoChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  handleRemoveClientePrioritarioPhoto: () => void
  setShowClientePrioritarioForm: (v: boolean) => void
  setEditingClientePrioritario: (v: boolean) => void
  emptyClientePrioritarioForm: () => ClientePrioritarioForm
}

export function AdminClientePrioritarioSection({
  safeT,
  clientePrioritario,
  showClientePrioritarioForm,
  editingClientePrioritario,
  clientePrioritarioForm,
  setClientePrioritarioForm,
  handleAddClientePrioritario,
  handleEditClientePrioritario,
  handleDeleteClientePrioritario,
  handleSaveClientePrioritario,
  handleClientePrioritarioPhotoChange,
  handleRemoveClientePrioritarioPhoto,
  setShowClientePrioritarioForm,
  setEditingClientePrioritario,
  emptyClientePrioritarioForm,
}: AdminClientePrioritarioSectionProps) {
  return (
${read('prioritario.txt')}
  )
}
`)

// AdminPasswordsSection
fs.writeFileSync(path.join(out, 'AdminPasswordsSection.tsx'), `'use client'

import React from 'react'
import type { PasswordEntry, SafeT } from './adminTypes'

export type AdminPasswordsSectionProps = {
  safeT: SafeT
  t: Record<string, string | undefined>
  selectedLanguage: string
  localeDatetimeGeneral: (lang: string) => string
  managedPasswords: PasswordEntry[]
  showPasswordForm: boolean
  passwordForm: { tecnicoName: string; password: string }
  visiblePasswords: Set<string>
  setShowPasswordForm: React.Dispatch<React.SetStateAction<boolean>>
  setPasswordForm: React.Dispatch<React.SetStateAction<{ tecnicoName: string; password: string }>>
  setVisiblePasswords: React.Dispatch<React.SetStateAction<Set<string>>>
  setManagedPasswords: React.Dispatch<React.SetStateAction<PasswordEntry[]>>
  generatePassword: (length?: number) => string
  handleSavePassword: () => void
  saveData: (key: string, value: unknown, saveToLocalStorage?: boolean, awaitServer?: boolean) => Promise<boolean>
}

export function AdminPasswordsSection(props: AdminPasswordsSectionProps) {
  const {
    safeT, t, selectedLanguage, localeDatetimeGeneral,
    managedPasswords, showPasswordForm, passwordForm, visiblePasswords,
    setShowPasswordForm, setPasswordForm, setVisiblePasswords, setManagedPasswords,
    generatePassword, handleSavePassword, saveData,
  } = props
  return (
${read('passwords.txt')}
  )
}
`)

// AdminBackupSection
fs.writeFileSync(path.join(out, 'AdminBackupSection.tsx'), `'use client'

import React from 'react'
import type { AutoBackup, CodeBackup, SafeT } from './adminTypes'

export type AdminBackupSectionProps = {
  variant?: 'full' | 'compact'
  safeT: SafeT
  isDemoMode: boolean
  selectedLanguage: string
  localeDatetimeGeneral: (lang: string) => string
  autoBackupEnabled: boolean
  autoBackupInterval: number
  setAutoBackupEnabled: (v: boolean) => void
  setAutoBackupInterval: (v: number) => void
  codeBackups: CodeBackup[]
  codeBackupsFolder: string
  loadingBackups: boolean
  restoringFromZip: boolean
  restoreFromZipInputRef: React.RefObject<HTMLInputElement | null>
  saveData: (key: string, value: unknown, saveToLocalStorage?: boolean, awaitServer?: boolean) => Promise<boolean>
  handleCreateBackup: () => void
  handleRestoreBackup: (e: React.ChangeEvent<HTMLInputElement>) => void
  handleBackupCodigo: () => void
  handleDownloadBackupZip: () => void
  handleRestoreCodigo: (path: string) => void
  handleRestoreFromZip: (e: React.ChangeEvent<HTMLInputElement>) => void
  loadCodeBackups: () => void
  getAutoBackups: () => AutoBackup[]
  restoreAutoBackup: (b: AutoBackup) => void | Promise<void>
}

export function AdminBackupSection({
  variant = 'full',
  safeT,
  isDemoMode,
  selectedLanguage,
  localeDatetimeGeneral,
  autoBackupEnabled,
  autoBackupInterval,
  setAutoBackupEnabled,
  setAutoBackupInterval,
  codeBackups,
  codeBackupsFolder,
  loadingBackups,
  restoringFromZip,
  restoreFromZipInputRef,
  saveData,
  handleCreateBackup,
  handleRestoreBackup,
  handleBackupCodigo,
  handleDownloadBackupZip,
  handleRestoreCodigo,
  handleRestoreFromZip,
  loadCodeBackups,
  getAutoBackups,
  restoreAutoBackup,
}: AdminBackupSectionProps) {
  if (variant === 'compact') {
    return (
${read('backup-compact.txt')}
    )
  }
  return (
${read('backup-full.txt')}
  )
}
`)

// AdminSidebarOrganizer
fs.writeFileSync(path.join(out, 'AdminSidebarOrganizer.tsx'), `'use client'

import React from 'react'
import type { SafeT, SidebarButton, SidebarGroup } from './adminTypes'

export type AdminSidebarOrganizerProps = {
  safeT: SafeT
  sidebarButtons: SidebarButton[]
  sidebarGroups: SidebarGroup[]
  sidebarPinnedIds: ReadonlySet<string>
  sidebarOrganizerSearch: string
  setSidebarOrganizerSearch: (v: string) => void
  showSidebarButtonOrganizer: boolean
  setShowSidebarButtonOrganizer: React.Dispatch<React.SetStateAction<boolean>>
  draggedButton: string | null
  dragOverIndex: number | null
  normalizeSidebarButtons: (buttons: SidebarButton[]) => SidebarButton[]
  isSidebarButtonLocked: (button: SidebarButton) => boolean
  getDefaultSidebarGroup: (buttonId: string) => SidebarGroup
  getButtonName: (button: SidebarButton) => string
  getSidebarGroupLabel: (group: SidebarGroup) => string
  getButtonsByGroup: (group: SidebarGroup) => SidebarButton[]
  handleRestoreSidebarOrganizerDefaults: () => void
  handleDragStart: (id: string) => void
  handleDragOver: (e: React.DragEvent, index: number) => void
  handleDragLeave: () => void
  handleDropWithGroup: (e: React.DragEvent, dropIndex: number, targetGroup: SidebarGroup) => void
  handleDragEnd: () => void
  handleMoveButtonToGroup: (buttonId: string, group: SidebarGroup) => void
  handleMoveButton: (buttonId: string, direction: 'up' | 'down') => void
  handleMoveButtonAcrossGroups: (buttonId: string, direction: 'left' | 'right') => void
  handleDeleteButton: (buttonId: string) => void
  setEditingButton: (button: SidebarButton | null) => void
  setButtonForm: (form: { name: string; action: string }) => void
  setShowButtonForm: (v: boolean) => void
}

export function AdminSidebarOrganizer({
  safeT,
  sidebarButtons,
  sidebarGroups,
  sidebarPinnedIds,
  sidebarOrganizerSearch,
  setSidebarOrganizerSearch,
  showSidebarButtonOrganizer,
  setShowSidebarButtonOrganizer,
  draggedButton,
  dragOverIndex,
  normalizeSidebarButtons,
  isSidebarButtonLocked,
  getDefaultSidebarGroup,
  getButtonName,
  getSidebarGroupLabel,
  getButtonsByGroup,
  handleRestoreSidebarOrganizerDefaults,
  handleDragStart,
  handleDragOver,
  handleDragLeave,
  handleDropWithGroup,
  handleDragEnd,
  handleMoveButtonToGroup,
  handleMoveButton,
  handleMoveButtonAcrossGroups,
  handleDeleteButton,
  setEditingButton,
  setButtonForm,
  setShowButtonForm,
}: AdminSidebarOrganizerProps) {
  const SIDEBAR_GROUPS = sidebarGroups
  const SIDEBAR_PINNED_IDS = sidebarPinnedIds
  const normalizedButtons = normalizeSidebarButtons(sidebarButtons)
  const coreButtons = normalizedButtons.filter((button) => isSidebarButtonLocked(button))
  const searchTerm = sidebarOrganizerSearch.trim().toLowerCase()

  return (
${read('sidebar.txt')}
  )
}
`)

console.log('Built admin section components')
