'use client'

import React from 'react'
import type { SafeT } from './adminTypes'

type Props = { safeT: SafeT }

export function AdminPanelIndex({ safeT }: Props) {
  return (
            <div className="admin-panels-overview">
              <p className="admin-panels-overview__title">{safeT?.adminPanelIndexTitle || 'Áreas do administrador'}</p>
              <p className="admin-panels-overview__lead">
                {safeT?.adminPanelIndexLead ||
                  'Todas as secções estão fechadas por defeito. Use os atalhos abaixo ou o título de cada bloco para expandir só o que precisa.'}
              </p>
              <div className="admin-panels-grid">
                <button
                  type="button"
                  className="admin-panel-jump"
                  onClick={() => {
                    const el = document.getElementById('admin-detail-sync') as HTMLDetailsElement | null
                    if (el) {
                      el.open = true
                      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
                    }
                  }}
                >
                  <span className="admin-panel-jump__k">01</span>
                  <span className="admin-panel-jump__t">{(safeT as any)?.syncAdminSectionTitle || 'Sincronização'}</span>
                  <span className="admin-panel-jump__d">{safeT?.syncAdminJumpHint || 'Servidor e outros aparelhos'}</span>
                </button>
                <button
                  type="button"
                  className="admin-panel-jump"
                  onClick={() => {
                    const el = document.getElementById('admin-detail-demos') as HTMLDetailsElement | null
                    if (el) {
                      el.open = true
                      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
                    }
                  }}
                >
                  <span className="admin-panel-jump__k">02</span>
                  <span className="admin-panel-jump__t">{safeT?.adminJumpDemosTitle || 'Demonstrações'}</span>
                  <span className="admin-panel-jump__d">{safeT?.adminJumpDemosDesc || 'Links, destinatários e prazos'}</span>
                </button>
                <button
                  type="button"
                  className="admin-panel-jump"
                  onClick={() => {
                    const el = document.getElementById('admin-detail-geral') as HTMLDetailsElement | null
                    if (el) {
                      el.open = true
                      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
                    }
                  }}
                >
                  <span className="admin-panel-jump__k">03</span>
                  <span className="admin-panel-jump__t">{safeT?.configuracoesGerais || 'Configurações gerais'}</span>
                  <span className="admin-panel-jump__d">{safeT?.adminJumpGeralDesc || 'Relatórios, logos e PDFs'}</span>
                </button>
                <button
                  type="button"
                  className="admin-panel-jump"
                  onClick={() => {
                    const el = document.getElementById('admin-detail-users') as HTMLDetailsElement | null
                    if (el) {
                      el.open = true
                      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
                    }
                  }}
                >
                  <span className="admin-panel-jump__k">04</span>
                  <span className="admin-panel-jump__t">{safeT?.userManagement || 'Utilizadores'}</span>
                  <span className="admin-panel-jump__d">{safeT?.adminJumpUsersDesc || 'Contas e permissões'}</span>
                </button>
                <button
                  type="button"
                  className="admin-panel-jump"
                  onClick={() => {
                    const el = document.getElementById('admin-detail-prioritario') as HTMLDetailsElement | null
                    if (el) {
                      el.open = true
                      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
                    }
                  }}
                >
                  <span className="admin-panel-jump__k">05</span>
                  <span className="admin-panel-jump__t">{safeT?.clientePrioritarioTitle || 'Cliente prioritário'}</span>
                  <span className="admin-panel-jump__d">{safeT?.adminJumpClienteDesc || 'Dados em destaque no sistema'}</span>
                </button>
                <button
                  type="button"
                  className="admin-panel-jump"
                  onClick={() => {
                    const el = document.getElementById('admin-detail-sidebar') as HTMLDetailsElement | null
                    if (el) {
                      el.open = true
                      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
                    }
                  }}
                >
                  <span className="admin-panel-jump__k">06</span>
                  <span className="admin-panel-jump__t">{safeT?.adminJumpSidebarTitle || 'Menu lateral'}</span>
                  <span className="admin-panel-jump__d">{safeT?.adminJumpSidebarDesc || 'Ordem e botões da barra'}</span>
                </button>
                <button
                  type="button"
                  className="admin-panel-jump"
                  onClick={() => {
                    window.open('/papel-timbrado', '_blank', 'noopener,noreferrer')
                  }}
                >
                  <span className="admin-panel-jump__k">07</span>
                  <span className="admin-panel-jump__t">{(safeT as any)?.adminJumpPapelTimbradoTitle || 'Papel timbrado'}</span>
                  <span className="admin-panel-jump__d">{(safeT as any)?.adminJumpPapelTimbradoDesc || 'Modelo A4 com logo e contactos'}</span>
                </button>
                <button
                  type="button"
                  className="admin-panel-jump"
                  onClick={() => {
                    const el = document.getElementById('admin-detail-passwords') as HTMLDetailsElement | null
                    if (el) {
                      el.open = true
                      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
                    }
                  }}
                >
                  <span className="admin-panel-jump__k">08</span>
                  <span className="admin-panel-jump__t">{safeT?.passwordManagerTitle || 'Gestor de senhas'}</span>
                  <span className="admin-panel-jump__d">{safeT?.adminJumpPasswordsDesc || 'Senhas de técnicos / checklist'}</span>
                </button>
                <button
                  type="button"
                  className="admin-panel-jump"
                  onClick={() => {
                    const el = document.getElementById('admin-backup-seguranca') as HTMLDetailsElement | null
                    if (el) {
                      el.open = true
                      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
                    }
                  }}
                >
                  <span className="admin-panel-jump__k">09</span>
                  <span className="admin-panel-jump__t">{safeT?.backupRestore || 'Backup e segurança'}</span>
                  <span className="admin-panel-jump__d">{safeT?.adminJumpBackupDesc || 'Código, ZIP e restauração'}</span>
                </button>
              </div>
            </div>
  )
}
