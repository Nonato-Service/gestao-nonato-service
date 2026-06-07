'use client'

import React from 'react'
import { GestaoDemosContent } from '../GestaoDemosContent'
import { AdminBackupSection, type AdminBackupSectionProps } from './AdminBackupSection'
import { AdminClientePrioritarioSection, type AdminClientePrioritarioSectionProps } from './AdminClientePrioritarioSection'
import { AdminConfigGeralSection, type AdminConfigGeralSectionProps } from './AdminConfigGeralSection'
import { AdminDisclosure } from './AdminDisclosure'
import { AdminPanelIndex } from './AdminPanelIndex'
import { AdminPasswordsSection, type AdminPasswordsSectionProps } from './AdminPasswordsSection'
import { AdminSidebarOrganizer, type AdminSidebarOrganizerProps } from './AdminSidebarOrganizer'
import { AdminSyncSection, type AdminSyncSectionProps } from './AdminSyncSection'
import { AdminUsersSection, type AdminUsersSectionProps } from './AdminUsersSection'
import type { SafeT } from './adminTypes'

export type AdministradorContentProps = {
  variant: 'full' | 'compact'
  safeT: SafeT
  showHero?: boolean
  LogoComponent?: React.ComponentType<{ size?: 'small' | 'medium' | 'large' }>
  closeTab?: (tabId: string) => void
  activeTabId?: string | null
  voltarPaginaInicial?: () => void
  onClose?: () => void
  saveData?: (key: string, value: unknown, saveToLocalStorage?: boolean, awaitServer?: boolean) => Promise<boolean>
  loadData?: (key: string) => Promise<unknown>
  onOpenDemosFullTab?: () => void
  sync: AdminSyncSectionProps
  geral: Omit<AdminConfigGeralSectionProps, 'variant' | 'safeT'>
  users: Omit<AdminUsersSectionProps, 'variant' | 'safeT'>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  clientePrioritario: any
  sidebar: Omit<AdminSidebarOrganizerProps, 'safeT'>
  passwords: Omit<AdminPasswordsSectionProps, 'safeT'>
  backup: Omit<AdminBackupSectionProps, 'variant' | 'safeT'>
}

export function AdministradorContent({
  variant,
  safeT,
  showHero = true,
  LogoComponent,
  closeTab,
  activeTabId,
  voltarPaginaInicial,
  onClose,
  saveData,
  loadData,
  onOpenDemosFullTab,
  sync,
  geral,
  users,
  clientePrioritario,
  sidebar,
  passwords,
  backup,
}: AdministradorContentProps) {
  if (variant === 'compact') {
    return (
      <>
        <h2 className="admin-modal-title">{safeT?.administrador || 'ADMINISTRADOR'}</h2>

        <GestaoDemosContent
          variant="compact"
          saveData={saveData}
          loadData={loadData}
          onOpenFullTab={onOpenDemosFullTab}
        />

        <AdminConfigGeralSection variant="compact" safeT={safeT} {...geral} />
        <AdminUsersSection variant="compact" safeT={safeT} {...users} />
        <AdminSidebarOrganizer safeT={safeT} {...sidebar} />
        <AdminBackupSection variant="compact" safeT={safeT} {...backup} />

        <button
          className="btn-primary"
          onClick={onClose}
          style={{ width: '100%', padding: '12px', marginTop: '20px' }}
        >
          {safeT?.close || 'Fechar'}
        </button>
      </>
    )
  }

  return (
    <div className="admin-shell">
      {showHero && LogoComponent && closeTab && voltarPaginaInicial ? (
        <div className="admin-hero">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
              <LogoComponent size="small" />
            </div>
            <div style={{ textAlign: 'center', flex: 1 }}>
              <h1 className="admin-hero-title">{safeT?.administrador || 'ADMINISTRADOR'}</h1>
              <p className="admin-hero-sub">{safeT?.configuracoesSistema || 'Configurações do Sistema'}</p>
            </div>
            <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
              <button
                onClick={() => closeTab(activeTabId || '')}
                style={{
                  padding: '6px 8px',
                  fontSize: '16px',
                  backgroundColor: 'transparent',
                  border: '1px solid rgba(0, 255, 0, 0.3)',
                  borderRadius: '4px',
                  color: '#00ff00',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '32px',
                  height: '32px',
                }}
                title={safeT?.voltar || 'Voltar'}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(0, 255, 0, 0.1)'
                  e.currentTarget.style.borderColor = 'rgba(0, 255, 0, 0.5)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent'
                  e.currentTarget.style.borderColor = 'rgba(0, 255, 0, 0.3)'
                }}
              >
                ↶
              </button>
              <button
                onClick={voltarPaginaInicial}
                style={{
                  padding: '6px 8px',
                  fontSize: '16px',
                  backgroundColor: 'transparent',
                  border: '1px solid rgba(0, 150, 255, 0.3)',
                  borderRadius: '4px',
                  color: '#66b3ff',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '32px',
                  height: '32px',
                }}
                title={safeT?.paginaInicial || 'Página Inicial'}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(0, 150, 255, 0.1)'
                  e.currentTarget.style.borderColor = 'rgba(0, 150, 255, 0.5)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent'
                  e.currentTarget.style.borderColor = 'rgba(0, 150, 255, 0.3)'
                }}
              >
                🏠
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <AdminPanelIndex safeT={safeT} />

      <AdminDisclosure
        id="admin-detail-sync"
        icon="⟳"
        title={(safeT as Record<string, string | undefined>)?.syncAdminSectionTitle || 'Sincronização entre aparelhos'}
        sub={
          (safeT as Record<string, string | undefined>)?.syncAdminSectionHintNew ||
          (safeT as Record<string, string | undefined>)?.syncAdminSectionHint ||
          'Aviso automático com resumo quando o servidor foi atualizado noutro aparelho.'
        }
        toneClass="admin-disclosure--sync"
      >
        <AdminSyncSection {...sync} safeT={safeT} />
      </AdminDisclosure>

      <AdminDisclosure
        id="admin-detail-demos"
        icon="📤"
        title={safeT?.adminDemosSummaryTitle || 'Gestão de envio de demonstrações'}
        sub={safeT?.adminDemosSummarySub || 'Destinatários, pacotes de módulos e cópia de links com identificação.'}
        toneClass="admin-disclosure--cyan"
      >
        <GestaoDemosContent
          variant="embedded"
          saveData={saveData}
          loadData={loadData}
          onOpenFullTab={onOpenDemosFullTab}
        />
      </AdminDisclosure>

      <AdminDisclosure
        id="admin-detail-geral"
        icon="⚙️"
        title={safeT?.configuracoesGerais || 'Configurações gerais'}
        sub={safeT?.adminGeralSummarySub || 'Contador de relatórios, logos na interface, identidade da marca e logos nos PDFs.'}
        toneClass="admin-disclosure--violet"
      >
        <AdminConfigGeralSection variant="full" safeT={safeT} {...geral} />
      </AdminDisclosure>

      <AdminDisclosure
        id="admin-detail-users"
        icon="👤"
        title={safeT?.userManagement || 'Gestão de utilizadores'}
        sub={safeT?.adminUsersSummarySub || 'Contas, permissões e vínculo com gestores ou técnicos.'}
        toneClass="admin-disclosure--violet"
      >
        <AdminUsersSection variant="full" safeT={safeT} {...users} />
      </AdminDisclosure>

      <AdminDisclosure
        id="admin-detail-prioritario"
        icon="★"
        title={safeT?.clientePrioritarioTitle || 'Cliente prioritário'}
        sub={safeT?.adminClientePriorSummarySub || 'Empresa em destaque e dados para formulários e fluxos internos.'}
        toneClass="admin-disclosure--amber"
      >
        <AdminClientePrioritarioSection {...clientePrioritario} safeT={safeT} />
      </AdminDisclosure>

      <AdminDisclosure
        id="admin-detail-sidebar"
        icon="☰"
        title={safeT?.adminJumpSidebarTitle || 'Menu lateral'}
        sub={safeT?.adminJumpSidebarDesc || 'Ordem dos botões, grupos e nomes apresentados na barra.'}
        toneClass="admin-disclosure--emerald"
      >
        <AdminSidebarOrganizer safeT={safeT} {...sidebar} />
      </AdminDisclosure>

      <AdminDisclosure
        id="admin-detail-passwords"
        icon="🔒"
        title={safeT?.passwordManagerTitle || 'Gestor de senhas'}
        sub={safeT?.adminPasswordsSummarySub || 'Senhas para checklist e acesso de técnicos.'}
        toneClass="admin-disclosure--violet"
      >
        <AdminPasswordsSection safeT={safeT} {...passwords} />
      </AdminDisclosure>

      <AdminDisclosure
        id="admin-backup-seguranca"
        icon="🛡"
        title={safeT?.backupRestore || 'Backup e segurança'}
        sub={safeT?.adminBackupSummarySub || 'Cópias de dados, exportação do código em ZIP e restauração controlada.'}
        toneClass="admin-disclosure--emerald"
      >
        <AdminBackupSection variant="full" safeT={safeT} {...backup} />
      </AdminDisclosure>
    </div>
  )
}
