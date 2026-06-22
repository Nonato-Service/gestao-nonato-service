'use client'

import React, { useMemo, useState } from 'react'
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

function tr(safeT: SafeT, key: string, fallback: string): string {
  return (safeT as Record<string, string | undefined>)[key] || fallback
}

type DropTarget = { group: SidebarGroup; index: number }

export function AdminSidebarOrganizer({
  safeT,
  sidebarButtons,
  sidebarGroups,
  sidebarPinnedIds,
  sidebarOrganizerSearch,
  setSidebarOrganizerSearch,
  draggedButton,
  normalizeSidebarButtons,
  isSidebarButtonLocked,
  getDefaultSidebarGroup,
  getButtonName,
  getSidebarGroupLabel,
  getButtonsByGroup,
  handleRestoreSidebarOrganizerDefaults,
  handleDragStart,
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
  const [dropTarget, setDropTarget] = useState<DropTarget | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [expandedMoveId, setExpandedMoveId] = useState<string | null>(null)

  const SIDEBAR_GROUPS = sidebarGroups
  const SIDEBAR_PINNED_IDS = sidebarPinnedIds
  const normalizedButtons = normalizeSidebarButtons(sidebarButtons)
  const coreButtons = normalizedButtons.filter((button) => isSidebarButtonLocked(button))
  const searchTerm = sidebarOrganizerSearch.trim().toLowerCase()
  const isDragging = Boolean(draggedButton)

  const movableCount = useMemo(
    () => normalizedButtons.filter((button) => !isSidebarButtonLocked(button)).length,
    [normalizedButtons, isSidebarButtonLocked]
  )

  const clearDrop = () => setDropTarget(null)

  const onDragEndLocal = () => {
    clearDrop()
    handleDragEnd()
  }

  const renderDropSlot = (group: SidebarGroup, index: number, label?: string) => {
    const active = dropTarget?.group === group && dropTarget.index === index
    return (
      <div
        key={`drop-${group}-${index}`}
        className={`admin-sidebar-hub-drop${active ? ' admin-sidebar-hub-drop--active' : ''}${isDragging ? ' admin-sidebar-hub-drop--visible' : ''}`}
        onDragOver={(e) => {
          e.preventDefault()
          e.stopPropagation()
          setDropTarget({ group, index })
        }}
        onDragLeave={(e) => {
          if (e.currentTarget.contains(e.relatedTarget as Node)) return
          if (dropTarget?.group === group && dropTarget.index === index) clearDrop()
        }}
        onDrop={(e) => {
          e.preventDefault()
          e.stopPropagation()
          handleDropWithGroup(e, index, group)
          clearDrop()
        }}
      >
        <span>{label || tr(safeT, 'adminSidebarHubDropHere', 'Soltar aqui')}</span>
      </div>
    )
  }

  return (
    <section className="admin-sidebar-hub">
      <header className="admin-sidebar-hub__hero">
        <div className="admin-sidebar-hub__hero-glow" aria-hidden="true" />
        <div className="admin-sidebar-hub__hero-content">
          <div className="admin-sidebar-hub__hero-icon" aria-hidden="true">
            ☰
          </div>
          <div>
            <h3 className="admin-sidebar-hub__hero-title">
              {tr(safeT, 'adminSidebarHubTitle', 'Organizador do Menu Lateral')}
            </h3>
            <p className="admin-sidebar-hub__hero-desc">
              {tr(
                safeT,
                'adminSidebarHubDesc',
                'Arraste cada botão para qualquer área e posição. Use as setas para ajustes finos — a barra lateral atualiza ao guardar.'
              )}
            </p>
          </div>
        </div>
        <ol className="admin-sidebar-hub__steps">
          <li>{tr(safeT, 'adminSidebarHubStep1', '1. Arraste para a posição desejada')}</li>
          <li>{tr(safeT, 'adminSidebarHubStep2', '2. ↑ ↓ mudam a ordem na coluna')}</li>
          <li>{tr(safeT, 'adminSidebarHubStep3', '3. ← → ou arraste entre áreas')}</li>
        </ol>
      </header>

      <div className="admin-sidebar-hub__stats">
        <div className="admin-sidebar-hub__stat">
          <span>{tr(safeT, 'adminSidebarHubKpiMovable', 'Botões móveis')}</span>
          <strong>{movableCount}</strong>
        </div>
        <div className="admin-sidebar-hub__stat">
          <span>{tr(safeT, 'adminSidebarHubKpiAreas', 'Áreas')}</span>
          <strong>{SIDEBAR_GROUPS.length}</strong>
        </div>
        <div className="admin-sidebar-hub__stat admin-sidebar-hub__stat--note">
          <span>{tr(safeT, 'adminSidebarHubKpiProtected', 'Protegidos')}</span>
          <strong>{coreButtons.length}</strong>
        </div>
      </div>

      <div className="admin-sidebar-hub__legend">
        <div className="admin-sidebar-hub__legend-item">
          <span aria-hidden="true">⠿</span>
          <p>{tr(safeT, 'adminSidebarHubLegendDrag', 'Arraste pelo ícone ou solte nas linhas verdes')}</p>
        </div>
        <div className="admin-sidebar-hub__legend-item">
          <span aria-hidden="true">↑↓</span>
          <p>{tr(safeT, 'adminSidebarHubLegendVertical', 'Setas verticais: sobe ou desce na mesma área')}</p>
        </div>
        <div className="admin-sidebar-hub__legend-item">
          <span aria-hidden="true">←→</span>
          <p>{tr(safeT, 'adminSidebarHubLegendHorizontal', 'Setas horizontais: envia para a área ao lado')}</p>
        </div>
      </div>

      {coreButtons.length > 0 ? (
        <div className="admin-sidebar-hub__core">
          <span>{safeT?.mainButton || 'Botão Principal'}</span>
          {coreButtons.map((button) => (
            <span key={button.id} className="admin-sidebar-hub__core-chip">
              {getButtonName(button)}
            </span>
          ))}
        </div>
      ) : null}

      <div className="admin-sidebar-hub__toolbar">
        <label className="admin-sidebar-hub__search">
          <span aria-hidden="true">🔍</span>
          <input
            type="search"
            value={sidebarOrganizerSearch}
            onChange={(e) => setSidebarOrganizerSearch(e.target.value)}
            placeholder={tr(safeT, 'sidebarOrganizerSearchPlaceholder', 'Pesquisar botão por nome…')}
          />
        </label>
        <div className="admin-sidebar-hub__toolbar-actions">
          <button type="button" className="admin-sidebar-hub-btn admin-sidebar-hub-btn--ghost" onClick={handleRestoreSidebarOrganizerDefaults}>
            {tr(safeT, 'sidebarOrganizerRestore', 'Restaurar padrão')}
          </button>
          <button type="button" className="admin-sidebar-hub-btn admin-sidebar-hub-btn--primary" onClick={() => setShowButtonForm(true)}>
            + {safeT?.addButton || 'Adicionar Botão'}
          </button>
        </div>
      </div>

      <div className={`admin-sidebar-hub-board${isDragging ? ' admin-sidebar-hub-board--dragging' : ''}`}>
        {SIDEBAR_GROUPS.map((group) => {
          const groupButtons = getButtonsByGroup(group).filter((button) => {
            if (!searchTerm) return true
            return getButtonName(button).toLowerCase().includes(searchTerm)
          })
          const isColumnTarget = isDragging && dropTarget?.group === group

          return (
            <article
              key={group}
              className={`admin-sidebar-hub-column${isColumnTarget ? ' admin-sidebar-hub-column--target' : ''}`}
              onDragOver={(e) => {
                e.preventDefault()
                if (groupButtons.length === 0) setDropTarget({ group, index: 0 })
              }}
            >
              <header className="admin-sidebar-hub-column__head">
                <div>
                  <h4>{getSidebarGroupLabel(group)}</h4>
                  <p>
                    {groupButtons.length}{' '}
                    {groupButtons.length === 1
                      ? tr(safeT, 'adminSidebarHubButtonSingular', 'botão')
                      : tr(safeT, 'adminSidebarHubButtonPlural', 'botões')}
                  </p>
                </div>
                <span className="admin-sidebar-hub-column__badge">{groupButtons.length}</span>
              </header>

              <div className="admin-sidebar-hub-column__body">
                {groupButtons.length === 0 ? (
                  <>
                    {renderDropSlot(group, 0, tr(safeT, 'adminSidebarHubEmptyColumn', 'Área vazia — solte aqui'))}
                    <div className="admin-sidebar-hub-empty">{safeT?.noButtonsInGroup || 'Nenhum botão neste grupo'}</div>
                  </>
                ) : (
                  <>
                    {renderDropSlot(group, 0)}
                    {groupButtons.map((button, index) => {
                      const currentGroup = button.group || getDefaultSidebarGroup(button.id)
                      const currentGroupIndex = SIDEBAR_GROUPS.indexOf(currentGroup)
                      const isConfirming = confirmDeleteId === button.id
                      const showMoveMenu = expandedMoveId === button.id

                      return (
                        <React.Fragment key={button.id}>
                          <div
                            className={`admin-sidebar-hub-card${draggedButton === button.id ? ' admin-sidebar-hub-card--dragging' : ''}`}
                            draggable
                            onDragStart={() => handleDragStart(button.id)}
                            onDragEnd={onDragEndLocal}
                          >
                            <div className="admin-sidebar-hub-card__main">
                              <span className="admin-sidebar-hub-card__grip" aria-hidden="true" title={safeT?.dragToReorder || 'Arraste'}>
                                ⠿
                              </span>
                              <div className="admin-sidebar-hub-card__text">
                                <strong title={getButtonName(button)}>{getButtonName(button)}</strong>
                                <small>{button.action}</small>
                                <div className="admin-sidebar-hub-card__tags">
                                  <span>{getSidebarGroupLabel(currentGroup)}</span>
                                  {SIDEBAR_PINNED_IDS.has(button.id) ? (
                                    <span className="admin-sidebar-hub-card__tag-pinned">
                                      {tr(safeT, 'adminSidebarHubPinned', 'Fixo')}
                                    </span>
                                  ) : null}
                                </div>
                              </div>
                            </div>

                            <div className="admin-sidebar-hub-card__controls">
                              <div className="admin-sidebar-hub-movepad" aria-label={tr(safeT, 'adminSidebarHubMovePad', 'Mover botão')}>
                                <button
                                  type="button"
                                  className="admin-sidebar-hub-movepad__btn"
                                  onClick={() => handleMoveButton(button.id, 'up')}
                                  disabled={index === 0}
                                  title={safeT?.moveUp || 'Subir'}
                                >
                                  ↑
                                </button>
                                <div className="admin-sidebar-hub-movepad__middle">
                                  <button
                                    type="button"
                                    className="admin-sidebar-hub-movepad__btn"
                                    onClick={() => handleMoveButtonAcrossGroups(button.id, 'left')}
                                    disabled={currentGroupIndex <= 0}
                                    title={tr(safeT, 'adminSidebarHubMoveLeft', 'Área anterior')}
                                  >
                                    ←
                                  </button>
                                  <button
                                    type="button"
                                    className="admin-sidebar-hub-movepad__btn admin-sidebar-hub-movepad__btn--center"
                                    onClick={() => setExpandedMoveId(showMoveMenu ? null : button.id)}
                                    title={tr(safeT, 'adminSidebarHubSendTo', 'Enviar para área')}
                                  >
                                    ◫
                                  </button>
                                  <button
                                    type="button"
                                    className="admin-sidebar-hub-movepad__btn"
                                    onClick={() => handleMoveButtonAcrossGroups(button.id, 'right')}
                                    disabled={currentGroupIndex >= SIDEBAR_GROUPS.length - 1}
                                    title={tr(safeT, 'adminSidebarHubMoveRight', 'Próxima área')}
                                  >
                                    →
                                  </button>
                                </div>
                                <button
                                  type="button"
                                  className="admin-sidebar-hub-movepad__btn"
                                  onClick={() => handleMoveButton(button.id, 'down')}
                                  disabled={index === groupButtons.length - 1}
                                  title={safeT?.moveDown || 'Descer'}
                                >
                                  ↓
                                </button>
                              </div>

                              {showMoveMenu ? (
                                <label className="admin-sidebar-hub-send">
                                  <span>{tr(safeT, 'adminSidebarHubSendTo', 'Enviar para')}</span>
                                  <select
                                    value={currentGroup}
                                    onChange={(e) => {
                                      handleMoveButtonToGroup(button.id, e.target.value as SidebarGroup)
                                      setExpandedMoveId(null)
                                    }}
                                  >
                                    {SIDEBAR_GROUPS.map((groupOption) => (
                                      <option key={groupOption} value={groupOption}>
                                        {getSidebarGroupLabel(groupOption)}
                                      </option>
                                    ))}
                                  </select>
                                </label>
                              ) : null}

                              <div className="admin-sidebar-hub-card__actions">
                                <button
                                  type="button"
                                  className="admin-sidebar-hub-btn admin-sidebar-hub-btn--xs admin-sidebar-hub-btn--ghost"
                                  onClick={() => {
                                    setEditingButton(button)
                                    setButtonForm({ name: button.name, action: button.action })
                                    setShowButtonForm(true)
                                  }}
                                >
                                  {safeT?.edit || 'Editar'}
                                </button>
                                {isConfirming ? (
                                  <>
                                    <button
                                      type="button"
                                      className="admin-sidebar-hub-btn admin-sidebar-hub-btn--xs admin-sidebar-hub-btn--danger"
                                      onClick={() => {
                                        handleDeleteButton(button.id)
                                        setConfirmDeleteId(null)
                                      }}
                                    >
                                      {tr(safeT, 'adminSidebarHubConfirmDelete', 'Sim')}
                                    </button>
                                    <button
                                      type="button"
                                      className="admin-sidebar-hub-btn admin-sidebar-hub-btn--xs admin-sidebar-hub-btn--ghost"
                                      onClick={() => setConfirmDeleteId(null)}
                                    >
                                      {safeT?.cancel || 'Não'}
                                    </button>
                                  </>
                                ) : (
                                  <button
                                    type="button"
                                    className="admin-sidebar-hub-btn admin-sidebar-hub-btn--xs admin-sidebar-hub-btn--danger-outline"
                                    onClick={() => setConfirmDeleteId(button.id)}
                                  >
                                    {safeT?.delete || 'Excluir'}
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                          {renderDropSlot(group, index + 1)}
                        </React.Fragment>
                      )
                    })}
                  </>
                )}
              </div>
            </article>
          )
        })}
      </div>
    </section>
  )
}
