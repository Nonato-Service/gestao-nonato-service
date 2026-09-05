'use client'

import React from 'react'
import type { SafeT } from './adminTypes'

type Props = { safeT: SafeT }

type AdminAreaCard = {
  num: string
  icon: string
  tone: string
  titleKey: string
  titleFallback: string
  descKey: string
  descFallback: string
  onActivate: () => void
}

function tr(safeT: SafeT, key: string, fallback: string): string {
  return (safeT as Record<string, string | undefined>)[key] || fallback
}

function openAdminSection(id: string) {
  const el = document.getElementById(id) as HTMLDetailsElement | null
  if (el) {
    el.open = true
    el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
}

export function AdminPanelIndex({ safeT }: Props) {
  const cards: AdminAreaCard[] = [
    {
      num: '01',
      icon: '✓',
      tone: 'emerald',
      titleKey: 'confiancaTitle',
      titleFallback: 'Checklist de confiança',
      descKey: 'confiancaSub',
      descFallback: 'Após cada actualização: 8 passos (~10 min)',
      onActivate: () => openAdminSection('admin-detail-confianca'),
    },
    {
      num: '02',
      icon: '↔',
      tone: 'sky',
      titleKey: 'adminJumpSyncTitle',
      titleFallback: 'Sincronização entre aparelhos',
      descKey: 'syncAdminJumpHint',
      descFallback: 'Servidor e outros aparelhos',
      onActivate: () => openAdminSection('admin-detail-sync'),
    },
    {
      num: '03',
      icon: '▶',
      tone: 'violet',
      titleKey: 'adminJumpDemosTitle',
      titleFallback: 'Demonstrações',
      descKey: 'adminJumpDemosDesc',
      descFallback: 'Links, destinatários e prazos',
      onActivate: () => openAdminSection('admin-detail-demos'),
    },
    {
      num: '04',
      icon: '⚙',
      tone: 'slate',
      titleKey: 'adminJumpGeralTitle',
      titleFallback: 'Configurações gerais',
      descKey: 'adminJumpGeralDesc',
      descFallback: 'Relatórios, logos e PDFs',
      onActivate: () => openAdminSection('admin-detail-geral'),
    },
    {
      num: '05',
      icon: '👤',
      tone: 'indigo',
      titleKey: 'adminJumpUsersTitle',
      titleFallback: 'Gestão de utilizadores',
      descKey: 'adminJumpUsersDesc',
      descFallback: 'Contas, módulos e permissões',
      onActivate: () => openAdminSection('admin-detail-users'),
    },
    {
      num: '06',
      icon: '★',
      tone: 'amber',
      titleKey: 'adminJumpClienteTitle',
      titleFallback: 'Cliente prioritário',
      descKey: 'adminJumpClienteDesc',
      descFallback: 'Empresa em destaque — formulários e fluxos',
      onActivate: () => openAdminSection('admin-detail-prioritario'),
    },
    {
      num: '07',
      icon: '☰',
      tone: 'teal',
      titleKey: 'adminJumpSidebarTitle',
      titleFallback: 'Menu lateral',
      descKey: 'adminJumpSidebarDesc',
      descFallback: 'Arraste botões entre áreas e posições',
      onActivate: () => openAdminSection('admin-detail-sidebar'),
    },
    {
      num: '08',
      icon: '📄',
      tone: 'rose',
      titleKey: 'adminJumpPapelTimbradoTitle',
      titleFallback: 'Papel timbrado',
      descKey: 'adminJumpPapelTimbradoDesc',
      descFallback: 'Modelo A4 com logo e contactos',
      onActivate: () => window.open('/papel-timbrado', '_blank', 'noopener,noreferrer'),
    },
    {
      num: '09',
      icon: '🔐',
      tone: 'orange',
      titleKey: 'adminJumpPasswordsTitle',
      titleFallback: 'Gestor de senhas',
      descKey: 'adminJumpPasswordsDesc',
      descFallback: 'Cofre de credenciais — checklist e técnicos',
      onActivate: () => openAdminSection('admin-detail-passwords'),
    },
    {
      num: '10',
      icon: '🧩',
      tone: 'emerald',
      titleKey: 'adminJumpPecasBackupTitle',
      titleFallback: 'Backup das peças',
      descKey: 'adminJumpPecasBackupDesc',
      descFallback: 'JSON só da biblioteca — códigos, preços e imagens',
      onActivate: () => openAdminSection('admin-detail-pecas-backup'),
    },
    {
      num: '11',
      icon: '💾',
      tone: 'emerald',
      titleKey: 'adminJumpBackupTitle',
      titleFallback: 'Backup e segurança',
      descKey: 'adminJumpBackupDesc',
      descFallback: '5 últimos de cada tipo + restauro individual',
      onActivate: () => openAdminSection('admin-backup-seguranca'),
    },
  ]

  return (
    <div className="admin-panels-overview">
      <div className="admin-panels-overview__head">
        <div>
          <p className="admin-panels-overview__eyebrow">{tr(safeT, 'adminPanelIndexEyebrow', 'Painel administrativo')}</p>
          <p className="admin-panels-overview__title">{tr(safeT, 'adminPanelIndexTitle', 'Áreas do administrador')}</p>
          <p className="admin-panels-overview__lead">
            {tr(
              safeT,
              'adminPanelIndexLead',
              'Todas as secções começam fechadas para manter o ecrã limpo. Use os atalhos abaixo ou clique no título de cada bloco para expandir apenas o que precisa.'
            )}
          </p>
        </div>
        <span className="admin-panels-overview__badge" aria-label={`${cards.length} áreas`}>
          {cards.length}
        </span>
      </div>

      <div className="admin-panels-grid">
        {cards.map((card) => (
          <button
            key={card.num}
            type="button"
            className={`admin-panel-jump admin-panel-jump--${card.tone}`}
            onClick={card.onActivate}
          >
            <span className="admin-panel-jump__icon" aria-hidden="true">
              {card.icon}
            </span>
            <span className="admin-panel-jump__body">
              <span className="admin-panel-jump__meta">
                <span className="admin-panel-jump__k">{card.num}</span>
              </span>
              <span className="admin-panel-jump__t">{tr(safeT, card.titleKey, card.titleFallback)}</span>
              <span className="admin-panel-jump__d">{tr(safeT, card.descKey, card.descFallback)}</span>
            </span>
            <span className="admin-panel-jump__arrow" aria-hidden="true">
              →
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}
