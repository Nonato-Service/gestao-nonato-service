'use client'

import React, { useMemo } from 'react'
import { applyPermissionPreset, type UserPermissionPresetId } from '../../lib/adminUserPermissions'
import {
  SIDEBAR_MENU_MODULES,
  buildMenuItemsFromLegacyPermissions,
  countModuleActiveItems,
  normalizeMenuItems,
  setModuleMenuItems,
  syncLegacyPermissionsFromMenuItems,
} from '../../lib/sidebarMenuPermissions'
import type { GestorItem, SafeT, TecnicoItem, User, UserFormState } from './adminTypes'

function tr(safeT: SafeT, key: string, fallback: string): string {
  return (safeT as Record<string, string | undefined>)[key] || fallback
}

export type AdminUserFormPanelProps = {
  safeT: SafeT
  editingUser: User | null
  userForm: UserFormState
  setUserForm: React.Dispatch<React.SetStateAction<UserFormState>>
  gestores: GestorItem[]
  tecnicos: TecnicoItem[]
  compact?: boolean
}

export function AdminUserFormPanel({
  safeT,
  editingUser,
  userForm,
  setUserForm,
  gestores,
  tecnicos,
  compact = false,
}: AdminUserFormPanelProps) {
  const setMenuItem = (buttonId: string, value: boolean) => {
    setUserForm((prev) => {
      const menuItems = normalizeMenuItems({ ...prev.menuItems, [buttonId]: value })
      return {
        ...prev,
        menuItems,
        menuItemsConfigured: true,
        permissions: syncLegacyPermissionsFromMenuItems(menuItems, prev.permissions),
      }
    })
  }

  const applyPreset = (preset: UserPermissionPresetId) => {
    setUserForm((prev) => {
      const permissions = applyPermissionPreset(prev.permissions, preset)
      const menuItems = normalizeMenuItems(buildMenuItemsFromLegacyPermissions(permissions))
      return { ...prev, permissions, menuItems, menuItemsConfigured: true }
    })
  }

  const activeModulesCount = useMemo(
    () => SIDEBAR_MENU_MODULES.filter((mod) => countModuleActiveItems(userForm.menuItems, mod) > 0).length,
    [userForm.menuItems]
  )

  const presets: { id: UserPermissionPresetId; labelKey: string; fallback: string }[] = [
    { id: 'technician', labelKey: 'adminUsersPresetTechnician', fallback: 'Técnico de campo' },
    { id: 'manager', labelKey: 'adminUsersPresetManager', fallback: 'Gestor operacional' },
    { id: 'full', labelKey: 'adminUsersPresetFull', fallback: 'Todos os módulos' },
    { id: 'clear', labelKey: 'adminUsersPresetClear', fallback: 'Limpar tudo' },
  ]

  return (
    <div className={`admin-users-hub__composer${compact ? ' admin-users-hub__composer--compact' : ''}`}>
      <div className="admin-users-hub__composer-grid">
        <label>
          <span>{safeT?.name || 'Nome'}</span>
          <input
            type="text"
            value={userForm.name}
            onChange={(e) => setUserForm({ ...userForm, name: e.target.value })}
          />
        </label>
        <label>
          <span>{safeT?.email || 'E-mail'}</span>
          <input
            type="email"
            value={userForm.email}
            onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
          />
        </label>
        <label>
          <span>{safeT?.role || 'Função'}</span>
          <input
            type="text"
            value={userForm.role}
            onChange={(e) => setUserForm({ ...userForm, role: e.target.value })}
          />
        </label>
        <label>
          <span>
            {safeT?.password || 'Senha'}
            {!editingUser && <em className="admin-users-hub__required">*</em>}
          </span>
          <input
            type="password"
            value={userForm.password}
            onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
            placeholder={editingUser ? tr(safeT, 'leaveEmptyToKeepPassword', 'Deixe vazio para manter a senha atual') : ''}
          />
        </label>
        <label>
          <span>{tr(safeT, 'adminUsersLinkWith', 'Vincular com')}</span>
          <select
            value={userForm.linkedProfileType}
            onChange={(e) =>
              setUserForm({
                ...userForm,
                linkedProfileType: e.target.value as 'gestor' | 'tecnico' | '',
                linkedProfileId: '',
              })
            }
          >
            <option value="">{tr(safeT, 'adminUsersNoLink', 'Sem vínculo direto')}</option>
            <option value="gestor">{safeT?.gestores || 'Gestores'}</option>
            <option value="tecnico">{safeT?.tecnicos || 'Técnicos'}</option>
          </select>
        </label>
        {userForm.linkedProfileType ? (
          <label>
            <span>
              {userForm.linkedProfileType === 'gestor'
                ? safeT?.selecionarGestor || 'Selecionar Gestor'
                : safeT?.selecionarTecnico || 'Selecionar Técnico'}
            </span>
            <select
              value={userForm.linkedProfileId}
              onChange={(e) => setUserForm({ ...userForm, linkedProfileId: e.target.value })}
            >
              <option value="">
                {userForm.linkedProfileType === 'gestor'
                  ? safeT?.selecionarGestor || 'Selecionar Gestor'
                  : safeT?.selecionarTecnico || 'Selecionar Técnico'}
              </option>
              {userForm.linkedProfileType === 'gestor'
                ? gestores.map((item) => (
                    <option key={item.id} value={item.id}>
                      {`${item.name} (${item.area || '-'})`}
                    </option>
                  ))
                : tecnicos.map((item) => (
                    <option key={item.id} value={item.id}>
                      {`${item.name} (${
                        item.type === 'internal'
                          ? safeT?.tecnicoInterno || 'Interno'
                          : item.type === 'external'
                            ? safeT?.tecnicoExterno || 'Externo'
                            : safeT?.armazem || 'Armazém'
                      })`}
                    </option>
                  ))}
            </select>
          </label>
        ) : null}
      </div>

      <div className={`admin-users-hub-admin-card${userForm.isAdmin ? ' admin-users-hub-admin-card--active' : ''}`}>
        <button
          type="button"
          className="admin-users-hub-admin-card__toggle"
          role="switch"
          aria-checked={userForm.isAdmin}
          onClick={() => setUserForm({ ...userForm, isAdmin: !userForm.isAdmin })}
        >
          <span className="admin-users-hub-admin-card__icon" aria-hidden="true">
            👑
          </span>
          <span className="admin-users-hub-admin-card__text">
            <strong>{safeT?.administradorGeral || 'Administrador Geral'}</strong>
            <small>{safeT?.administradorGeralDesc || 'Acesso total a todas as funcionalidades'}</small>
          </span>
          <span className={`admin-users-hub-switch${userForm.isAdmin ? ' admin-users-hub-switch--on' : ''}`} aria-hidden="true">
            <span />
          </span>
        </button>
      </div>

      {!userForm.isAdmin ? (
        <div className="admin-users-hub-permissions">
          <header className="admin-users-hub-permissions__head">
            <div>
              <h4>{tr(safeT, 'adminUsersPermissionsTitle', 'O que este utilizador pode usar')}</h4>
              <p>
                {tr(
                  safeT,
                  'adminUsersPermissionsSubtitleMenu',
                  'Ative cada módulo e escolha os botões que aparecem na barra lateral. Os desativados ficam ocultos.'
                )}
              </p>
            </div>
            <span className="admin-users-hub-perm-modules-summary">
              {activeModulesCount}/{SIDEBAR_MENU_MODULES.length}{' '}
              {tr(safeT, 'adminUsersModulesActive', 'módulos com acesso')}
            </span>
          </header>

          <div className="admin-users-hub-presets">
            {presets.map((preset) => (
              <button
                key={preset.id}
                type="button"
                className={`admin-users-hub-btn admin-users-hub-btn--sm admin-users-hub-btn--preset admin-users-hub-btn--preset-${preset.id}`}
                onClick={() => applyPreset(preset.id)}
              >
                {tr(safeT, preset.labelKey, preset.fallback)}
              </button>
            ))}
          </div>

          <div className="admin-users-hub-menu-modules">
            {SIDEBAR_MENU_MODULES.map((module) => {
              const activeCount = countModuleActiveItems(userForm.menuItems, module)
              const allOn = activeCount === module.items.length
              return (
                <section key={module.id} className="admin-users-hub-menu-module">
                  <header className="admin-users-hub-menu-module__head">
                    <div className="admin-users-hub-menu-module__title">
                      <span aria-hidden="true">{module.icon}</span>
                      <div>
                        <strong>{tr(safeT, module.titleKey, module.fallbackTitle)}</strong>
                        <small>{tr(safeT, module.descKey, module.fallbackDesc)}</small>
                      </div>
                    </div>
                    <div className="admin-users-hub-perm-group__actions">
                      <span className="admin-users-hub-perm-group__count">
                        {activeCount}/{module.items.length}
                      </span>
                      <button
                        type="button"
                        className="admin-users-hub-btn admin-users-hub-btn--xs admin-users-hub-btn--ghost"
                        onClick={() =>
                          setUserForm((prev) => {
                            const menuItems = normalizeMenuItems(
                              setModuleMenuItems(prev.menuItems, module, !allOn)
                            )
                            return {
                              ...prev,
                              menuItems,
                              menuItemsConfigured: true,
                              permissions: syncLegacyPermissionsFromMenuItems(menuItems, prev.permissions),
                            }
                          })
                        }
                      >
                        {allOn
                          ? tr(safeT, 'adminUsersGroupClearAll', 'Desmarcar grupo')
                          : tr(safeT, 'adminUsersGroupSelectAll', 'Marcar grupo')}
                      </button>
                    </div>
                  </header>
                  <div className="admin-users-hub-menu-module__items">
                    {module.items.map((item) => {
                      const on = Boolean(userForm.menuItems[item.buttonId])
                      return (
                        <button
                          key={item.buttonId}
                          type="button"
                          role="switch"
                          aria-checked={on}
                          className={`admin-users-hub-menu-item${on ? ' admin-users-hub-menu-item--on' : ''}`}
                          onClick={() => setMenuItem(item.buttonId, !on)}
                        >
                          <span className="admin-users-hub-menu-item__label">
                            {tr(safeT, item.labelKey, item.fallbackLabel)}
                          </span>
                          <span className={`admin-users-hub-switch admin-users-hub-switch--sm${on ? ' admin-users-hub-switch--on' : ''}`} aria-hidden="true">
                            <span />
                          </span>
                        </button>
                      )
                    })}
                  </div>
                </section>
              )
            })}
          </div>
        </div>
      ) : (
        <p className="admin-users-hub-admin-note">{tr(safeT, 'adminUsersAdminUnlocksAll', 'Como administrador, este utilizador ignora as permissões abaixo e acede a tudo.')}</p>
      )}
    </div>
  )
}
