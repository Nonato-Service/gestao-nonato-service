'use client'

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
  setDragOverIndex: React.Dispatch<React.SetStateAction<number | null>>
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
  setDragOverIndex,
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
      <div className="admin-section admin-section--ui sidebar-organizer-shell">
        <div className="sidebar-organizer-hero">
          <div>
            <h3 className="admin-section-title sidebar-organizer-title">
              {safeT?.buttonOrganizer || 'ORGANIZAÇÃO DA INTERFACE'}
            </h3>
            <p className="sidebar-organizer-subtitle">
              {(safeT as any)?.organizeButtonsFreeGroupDesc ||
                'Pode mover qualquer botão para qualquer grupo. Ex.: um botão da Gestão Técnica pode passar para Gestão Industrial. Use o menu ao lado de cada botão para escolher o grupo.'}
            </p>
          </div>
          <div className="sidebar-organizer-actions">
            <button
              className="btn-primary"
              onClick={handleRestoreSidebarOrganizerDefaults}
              style={{ padding: '10px 16px', fontSize: '12px' }}
            >
              {(safeT as any)?.sidebarOrganizerRestore || 'Restaurar padrão'}
            </button>
            <button
              className="btn-primary"
              onClick={() => setShowSidebarButtonOrganizer(!showSidebarButtonOrganizer)}
              style={{ padding: '10px 16px', fontSize: '12px' }}
            >
              {showSidebarButtonOrganizer
                ? ((safeT as any)?.hideSidebarOrganizer || 'Ocultar Organizador')
                : ((safeT as any)?.organizeSidebarButtons || 'Abrir Organizador Moderno')}
            </button>
            <button
              className="btn-primary"
              onClick={() => setShowButtonForm(true)}
              style={{ padding: '10px 16px', fontSize: '12px' }}
            >
              {safeT?.addButton || 'Adicionar Botão'}
            </button>
          </div>
        </div>

        <div className="sidebar-organizer-summary">
          <div className="sidebar-organizer-stat">
            <span className="sidebar-organizer-stat-value">{normalizedButtons.filter((button) => !isSidebarButtonLocked(button)).length}</span>
            <span className="sidebar-organizer-stat-label">Botões organizáveis</span>
          </div>
          <div className="sidebar-organizer-stat">
            <span className="sidebar-organizer-stat-value">{SIDEBAR_GROUPS.length}</span>
            <span className="sidebar-organizer-stat-label">Áreas da barra lateral</span>
          </div>
          <div className="sidebar-organizer-stat">
            <span className="sidebar-organizer-stat-value">{coreButtons.length}</span>
            <span className="sidebar-organizer-stat-label">Botões principais protegidos</span>
          </div>
        </div>

        {coreButtons.length > 0 && (
          <div className="sidebar-organizer-core-strip">
            <span className="sidebar-organizer-core-label">{safeT?.mainButton || 'Botão Principal'}:</span>
            {coreButtons.map((button) => (
              <span key={button.id} className="sidebar-organizer-core-chip">
                {getButtonName(button)}
              </span>
            ))}
          </div>
        )}

        {showSidebarButtonOrganizer && (
          <>
            <p className="sidebar-organizer-hint">
              {safeT?.dragToReorder ||
                'Arraste os botões para reorganizá-los'}
              {' '}
              Use também os controlos do card para mover dentro da coluna ou enviar para outra área.
            </p>

            <div className="sidebar-organizer-toolbar">
              <input
                type="text"
                value={sidebarOrganizerSearch}
                onChange={(e) => setSidebarOrganizerSearch(e.target.value)}
                className="sidebar-organizer-search"
                placeholder={(safeT as any)?.sidebarOrganizerSearchPlaceholder || 'Buscar botão por nome...'}
              />
            </div>

            <div className="sidebar-organizer-board">
              {SIDEBAR_GROUPS.map((group) => {
                const groupButtons = getButtonsByGroup(group).filter((button) => {
                  if (!searchTerm) return true
                  const name = getButtonName(button).toLowerCase()
                  return name.includes(searchTerm)
                })
                return (
                  <div
                    key={group}
                    className="sidebar-organizer-column"
                    onDragOver={(e) => {
                      e.preventDefault()
                      setDragOverIndex(groupButtons.length)
                    }}
                    onDrop={(e) => handleDropWithGroup(e, groupButtons.length, group)}
                  >
                    <div className="sidebar-organizer-column-head">
                      <div>
                        <h4>{getSidebarGroupLabel(group)}</h4>
                        <p>{groupButtons.length} botão{groupButtons.length === 1 ? '' : 'ões'}</p>
                      </div>
                      <span className="sidebar-organizer-column-badge">{groupButtons.length}</span>
                    </div>

                    <div className="sidebar-organizer-column-body">
                      {groupButtons.length === 0 ? (
                        <div className="sidebar-organizer-empty">
                          {safeT?.noButtonsInGroup || 'Nenhum botão neste grupo'}
                        </div>
                      ) : (
                        groupButtons.map((button, index) => {
                          const currentGroup = button.group || getDefaultSidebarGroup(button.id)
                          const currentGroupIndex = SIDEBAR_GROUPS.indexOf(currentGroup)
                          return (
                            <div
                              key={button.id}
                              className={`sidebar-organizer-card${draggedButton === button.id ? ' is-dragging' : ''}${dragOverIndex === index ? ' is-drop-target' : ''}`}
                              draggable
                              onDragStart={() => handleDragStart(button.id)}
                              onDragOver={(e) => handleDragOver(e, index)}
                              onDragLeave={handleDragLeave}
                              onDrop={(e) => handleDropWithGroup(e, index, group)}
                              onDragEnd={handleDragEnd}
                            >
                              <div className="sidebar-organizer-card-main">
                                <div className="sidebar-organizer-card-topline">
                                  <span className="sidebar-organizer-card-grip">::</span>
                                  <span className="sidebar-organizer-card-name" title={getButtonName(button)}>
                                    {getButtonName(button)}
                                  </span>
                                </div>
                                <div className="sidebar-organizer-card-meta">
                                  <span>{getSidebarGroupLabel(currentGroup)}</span>
                                  {SIDEBAR_PINNED_IDS.has(button.id) && (
                                    <span>Fixo recomendado</span>
                                  )}
                                </div>
                              </div>

                              <div className="sidebar-organizer-card-controls">
                                <select
                                  value={currentGroup}
                                  onChange={(e) => handleMoveButtonToGroup(button.id, e.target.value as SidebarGroup)}
                                  className="sidebar-organizer-select"
                                >
                                  {SIDEBAR_GROUPS.map((groupOption) => (
                                    <option key={groupOption} value={groupOption}>
                                      {getSidebarGroupLabel(groupOption)}
                                    </option>
                                  ))}
                                </select>

                                <div className="sidebar-organizer-card-actions-row">
                                  <button
                                    type="button"
                                    className="sidebar-organizer-mini-btn"
                                    onClick={() => handleMoveButton(button.id, 'up')}
                                    disabled={index === 0}
                                    title={safeT?.moveUp || 'Mover para Cima'}
                                  >
                                    ↑
                                  </button>
                                  <button
                                    type="button"
                                    className="sidebar-organizer-mini-btn"
                                    onClick={() => handleMoveButton(button.id, 'down')}
                                    disabled={index === groupButtons.length - 1}
                                    title={safeT?.moveDown || 'Mover para Baixo'}
                                  >
                                    ↓
                                  </button>
                                  <button
                                    type="button"
                                    className="sidebar-organizer-mini-btn"
                                    onClick={() => handleMoveButtonAcrossGroups(button.id, 'left')}
                                    disabled={currentGroupIndex <= 0}
                                    title="Mover para a área anterior"
                                  >
                                    ←
                                  </button>
                                  <button
                                    type="button"
                                    className="sidebar-organizer-mini-btn"
                                    onClick={() => handleMoveButtonAcrossGroups(button.id, 'right')}
                                    disabled={currentGroupIndex >= SIDEBAR_GROUPS.length - 1}
                                    title="Mover para a próxima área"
                                  >
                                    →
                                  </button>
                                  <button
                                    type="button"
                                    className="btn-primary"
                                    onClick={() => {
                                      setEditingButton(button)
                                      setButtonForm({ name: button.name, action: button.action })
                                      setShowButtonForm(true)
                                    }}
                                    style={{ padding: '8px 12px', fontSize: '11px', whiteSpace: 'nowrap' }}
                                  >
                                    {safeT?.edit || 'Editar'}
                                  </button>
                                  <button
                                    type="button"
                                    className="btn-danger"
                                    onClick={() => handleDeleteButton(button.id)}
                                    style={{ padding: '8px 12px', fontSize: '11px', whiteSpace: 'nowrap' }}
                                  >
                                    {safeT?.delete || 'Excluir'}
                                  </button>
                                </div>
                              </div>
                            </div>
                          )
                        })
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        )}
      </div>
  )
}
