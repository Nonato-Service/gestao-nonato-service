import fs from 'fs'
import path from 'path'

const root = path.resolve('C:/Users/W10/gestao-tecnica-nonato-service')
const pagePath = path.join(root, 'app/page.tsx')
const outDir = path.join(root, 'app/components/admin')
const lines = fs.readFileSync(pagePath, 'utf8').split(/\r?\n/)

function slice(start, end) {
  return lines.slice(start - 1, end).join('\n')
}

// adminTypes.ts
fs.writeFileSync(path.join(outDir, 'adminTypes.ts'), `'use client'

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

export type ClientePrioritarioForm = Omit<ClientePrioritario, 'id' | 'equipamentos' | 'relatorios'>

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

export type CodeBackup = {
  path: string
  timestamp: string
  filesCount: number
}

export type AutoBackup = {
  timestamp: number
  data?: { date?: string }
}

export type SidebarGroup =
  | 'gestao-tecnica'
  | 'parceiros-comercial'
  | 'documentacao-relatorios'
  | 'gestao-custos'
  | 'gestao-industrial'
  | 'gestao-financeira'
  | 'checklist-group'
  | 'comunicacao-interna'
  | 'manuais-informacoes-tecnicas'
  | 'biblia-nonato-service'
  | 'almoxarifado-armazem'
  | 'empresa-institucional'
  | 'outros'

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
fs.writeFileSync(path.join(outDir, 'AdminDisclosure.tsx'), `'use client'

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

// AdminPanelIndex - extract from lines 26756-26895
const panelIndexBody = slice(26756, 26895)
fs.writeFileSync(path.join(outDir, 'AdminPanelIndex.tsx'), `'use client'

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
${panelIndexBody.split('\n').map(l => '    ' + l).join('\n')}
  )
}
`)

// AdminSyncSection - lines 26911-27013 (inner body)
const syncBody = slice(26911, 27013)
fs.writeFileSync(path.join(outDir, 'AdminSyncSection.tsx'), `'use client'

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
${syncBody.split('\n').map(l => '    ' + l).join('\n')}
  )
}
`)

// AdminConfigGeralSection - full: 27050-27679, need variant support
const geralFullBody = slice(27050, 27679)
// compact modal geral: 69924-70114
const geralCompactBody = slice(69924, 70114)

fs.writeFileSync(path.join(outDir, 'AdminConfigGeralSection.tsx'), `'use client'

import React from 'react'
import { NonatoBrandLogo } from '../NonatoBrandLogo'
import type { AdminBibliotecaLogoDraft, AdminInterfaceLogoDraft, LogoRelatorio, SafeT } from './adminTypes'

export type AdminConfigGeralSectionProps = {
  variant?: 'full' | 'compact'
  safeT: SafeT
  preverProximoNumeroRelatorio: (dataReferenciaIso?: string) => string
  // logos interface
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
  // pdf logos (full only)
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
  setLogosRelatorios?: (v: LogoRelatorio[]) => void
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

export function AdminConfigGeralSection(props: AdminConfigGeralSectionProps) {
  const { variant = 'full', safeT } = props
  if (variant === 'compact') {
    return (
${geralCompactBody.split('\n').map(l => '      ' + l.replace(/safeT/g, 'safeT').replace(/adminSidebarLogoDraft/g, 'props.adminSidebarLogoDraft').replace(/logoUrl/g, 'props.logoUrl').replace(/logoType/g, 'props.logoType').replace(/handleFileChangeSidebarLogo/g, 'props.handleFileChangeSidebarLogo').replace(/commitAdminSidebarLogoDraft/g, 'props.commitAdminSidebarLogoDraft').replace(/discardAdminSidebarLogoDraft/g, 'props.discardAdminSidebarLogoDraft').replace(/adminLogoSavingSidebar/g, 'props.adminLogoSavingSidebar').replace(/handleRemoveSidebarLogo/g, 'props.handleRemoveSidebarLogo').replace(/adminDashboardLogoDraft/g, 'props.adminDashboardLogoDraft').replace(/logoUrlDashboard/g, 'props.logoUrlDashboard').replace(/logoTypeDashboard/g, 'props.logoTypeDashboard').replace(/handleFileChangeDashboardLogo/g, 'props.handleFileChangeDashboardLogo').replace(/commitAdminDashboardLogoDraft/g, 'props.commitAdminDashboardLogoDraft').replace(/discardAdminDashboardLogoDraft/g, 'props.discardAdminDashboardLogoDraft').replace(/adminLogoSavingDashboard/g, 'props.adminLogoSavingDashboard').replace(/handleRemoveDashboardLogo/g, 'props.handleRemoveDashboardLogo')).join('\n')}
    )
  }

  const {
    preverProximoNumeroRelatorio,
    logoUrl, logoType, logoUrlDashboard, logoTypeDashboard,
    adminSidebarLogoDraft, adminDashboardLogoDraft,
    adminLogoSavingSidebar, adminLogoSavingDashboard,
    handleFileChangeSidebarLogo, handleFileChangeDashboardLogo,
    commitAdminSidebarLogoDraft, discardAdminSidebarLogoDraft,
    commitAdminDashboardLogoDraft, discardAdminDashboardLogoDraft,
    handleRemoveSidebarLogo, handleRemoveDashboardLogo,
    pdfLogosModoUnificado, setPdfLogosModoUnificado,
    logosRelatorios = [], adminBibliotecaLogoDraft, adminBibliotecaLogoSaving,
    logoRelatorioSelecionadoId = '', logoFechamentoSelecionadoId = '',
    logoOrcamentoSelecionadoId = '', logoProtocoloServicoSelecionadoId = '',
    incluirLogoNosRelatorios, incluirLogoFechamentosDespesas,
    setIncluirLogoNosRelatorios, setIncluirLogoFechamentosDespesas,
    setLogosRelatorios, setLogoRelatorioSelecionadoId,
    setLogoFechamentoSelecionadoId, setLogoOrcamentoSelecionadoId,
    setLogoProtocoloServicoSelecionadoId, saveData,
    administradorPreviewPdfLogo, aplicarLogoUnificadoTodosPdfs,
    administradorAddBibliotecaLogo, commitAdminBibliotecaLogoDraft,
    discardAdminBibliotecaLogoDraft,
  } = props

  return (
${geralFullBody.split('\n').map(l => '    ' + l).join('\n')}
  )
}
`)

console.log('Created base files. Manual sections still needed.')
