'use client'

import React from 'react'
import {
  USER_PERMISSION_GROUPS,
  applyPermissionPreset,
  setGroupPermissions,
  type UserPermissionPresetId,
} from '../../lib/adminUserPermissions'
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
  const setPermission = (key: keyof UserFormState['permissions'], value: boolean) => {
    setUserForm((prev) => ({
      ...prev,
      permissions: { ...prev.permissions, [key]: value },
    }))
  }

  const applyPreset = (preset: UserPermissionPresetId) => {
    setUserForm((prev) => ({
      ...prev,
      permissions: applyPermissionPreset(prev.permissions, preset),
    }))
  }

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
              <p>{tr(safeT, 'adminUsersPermissionsSubtitle', 'Ative os módulos visíveis na barra lateral e nos fluxos do sistema.')}</p>
            </div>
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

          <div className="admin-users-hub-perm-groups">
            {USER_PERMISSION_GROUPS.map((group) => {
              const groupKeys = group.permissions.map((p) => p.key)
              const activeCount = groupKeys.filter((k) => userForm.permissions[k]).length
              const allOn = activeCount === groupKeys.length
              return (
                <section key={group.id} className="admin-users-hub-perm-group">
                  <header className="admin-users-hub-perm-group__head">
                    <div className="admin-users-hub-perm-group__title">
                      <span aria-hidden="true">{group.icon}</span>
                      <div>
                        <strong>{tr(safeT, group.titleKey, group.id)}</strong>
                        <small>{tr(safeT, group.descKey, '')}</small>
                      </div>
                    </div>
                    <div className="admin-users-hub-perm-group__actions">
                      <span className="admin-users-hub-perm-group__count">
                        {activeCount}/{groupKeys.length}
                      </span>
                      <button
                        type="button"
                        className="admin-users-hub-btn admin-users-hub-btn--xs admin-users-hub-btn--ghost"
                        onClick={() =>
                          setUserForm((prev) => ({
                            ...prev,
                            permissions: setGroupPermissions(prev.permissions, group, !allOn),
                          }))
                        }
                      >
                        {allOn
                          ? tr(safeT, 'adminUsersGroupClearAll', 'Desmarcar grupo')
                          : tr(safeT, 'adminUsersGroupSelectAll', 'Marcar grupo')}
                      </button>
                    </div>
                  </header>
                  <div className="admin-users-hub-perm-grid">
                    {group.permissions.map((perm) => {
                      const on = userForm.permissions[perm.key]
                      return (
                        <button
                          key={perm.key}
                          type="button"
                          role="switch"
                          aria-checked={on}
                          className={`admin-users-hub-perm-card admin-users-hub-perm-card--${perm.accent}${on ? ' admin-users-hub-perm-card--on' : ''}`}
                          onClick={() => setPermission(perm.key, !on)}
                        >
                          <span className="admin-users-hub-perm-card__icon" aria-hidden="true">
                            {perm.icon}
                          </span>
                          <span className="admin-users-hub-perm-card__body">
                            <strong>{tr(safeT, perm.labelKey, perm.key)}</strong>
                            <small>{tr(safeT, perm.hintKey, '')}</small>
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
