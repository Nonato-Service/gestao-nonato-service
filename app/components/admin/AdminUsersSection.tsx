'use client'

import React, { useMemo, useState } from 'react'
import {
  USER_PERMISSION_KEYS,
  countActivePermissions,
  getActivePermissionKeys,
} from '../../lib/adminUserPermissions'
import { AdminUserFormPanel } from './AdminUserFormPanel'
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

function tr(safeT: SafeT, key: string, fallback: string): string {
  return (safeT as Record<string, string | undefined>)[key] || fallback
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

function permissionLabel(safeT: SafeT, key: string): string {
  const cap = key.charAt(0).toUpperCase() + key.slice(1)
  return tr(safeT, `permission${cap}`, key)
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
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'all' | 'admins' | 'standard'>('all')
  const [sortBy, setSortBy] = useState<'name' | 'role'>('name')
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)

  const stats = useMemo(() => {
    const admins = users.filter((u) => u.isAdmin).length
    const linked = users.filter((u) => u.linkedProfileType && u.linkedProfileId).length
    return { total: users.length, admins, linked }
  }, [users])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    let list = [...users]
    if (filter === 'admins') list = list.filter((u) => u.isAdmin)
    if (filter === 'standard') list = list.filter((u) => !u.isAdmin)
    if (q) {
      list = list.filter(
        (u) =>
          u.name.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q) ||
          u.role.toLowerCase().includes(q)
      )
    }
    list.sort((a, b) => {
      if (sortBy === 'role') return a.role.localeCompare(b.role, undefined, { sensitivity: 'base' })
      return a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })
    })
    return list
  }, [users, search, filter, sortBy])

  const cancelForm = () => {
    setShowUserForm(false)
    setEditingUser(null)
    setUserForm(createEmptyUserForm())
  }

  if (variant === 'compact') {
    return (
      <div className="admin-section">
        <div className="admin-users-hub__compact-head">
          <h3 className="admin-section-title">{safeT?.userManagement || 'GESTÃO DE USUÁRIOS'}</h3>
          <button type="button" className="admin-users-hub-btn admin-users-hub-btn--primary admin-users-hub-btn--sm" onClick={handleAddUser}>
            {safeT?.addUser || 'Adicionar Usuário'}
          </button>
        </div>
        {users.length === 0 ? (
          <p className="admin-users-hub__compact-empty">{safeT?.noUsers || 'Nenhum usuário cadastrado'}</p>
        ) : (
          <div className="admin-users-hub__compact-list">
            {users.map((user) => (
              <div key={user.id} className="admin-users-hub-card admin-users-hub-card--compact">
                <div className="admin-users-hub-card__main">
                  <div className="admin-users-hub-card__avatar" aria-hidden="true">
                    {initials(user.name)}
                  </div>
                  <div className="admin-users-hub-card__info">
                    <h5>{user.name}</h5>
                    <span>
                      {user.email} · {user.role}
                    </span>
                  </div>
                </div>
                <div className="admin-users-hub-card__actions">
                  <button type="button" className="admin-users-hub-btn admin-users-hub-btn--sm admin-users-hub-btn--secondary" onClick={() => handleEditUser(user)}>
                    {safeT?.edit || 'Editar'}
                  </button>
                  <button type="button" className="admin-users-hub-btn admin-users-hub-btn--sm admin-users-hub-btn--danger-outline" onClick={() => handleDeleteUser(user.id)}>
                    {safeT?.delete || 'Excluir'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <section className="admin-users-hub">
      <header className="admin-users-hub__hero">
        <div className="admin-users-hub__hero-glow" aria-hidden="true" />
        <div className="admin-users-hub__hero-content">
          <div className="admin-users-hub__hero-icon" aria-hidden="true">
            👥
          </div>
          <div>
            <h3 className="admin-users-hub__hero-title">{tr(safeT, 'adminUsersHubTitle', 'Centro de Utilizadores')}</h3>
            <p className="admin-users-hub__hero-desc">
              {tr(
                safeT,
                'adminUsersHubDesc',
                'Defina contas, escolha módulos visíveis e vincule gestores ou técnicos — tudo num painel claro e rápido.'
              )}
            </p>
          </div>
        </div>
        <ol className="admin-users-hub__steps">
          <li>{tr(safeT, 'adminUsersStep1', '1. Crie ou edite a conta')}</li>
          <li>{tr(safeT, 'adminUsersStep2', '2. Selecione o que pode usar')}</li>
          <li>{tr(safeT, 'adminUsersStep3', '3. Vincule perfil se necessário')}</li>
        </ol>
      </header>

      <div className="admin-users-hub__stats">
        <div className="admin-users-hub__stat">
          <span>{tr(safeT, 'adminUsersKpiTotal', 'Utilizadores')}</span>
          <strong>{stats.total}</strong>
        </div>
        <div className="admin-users-hub__stat">
          <span>{tr(safeT, 'adminUsersKpiAdmins', 'Administradores')}</span>
          <strong>{stats.admins}</strong>
        </div>
        <div className="admin-users-hub__stat admin-users-hub__stat--note">
          <span>{tr(safeT, 'adminUsersKpiLinked', 'Com vínculo')}</span>
          <strong>{stats.linked}</strong>
        </div>
      </div>

      <div className="admin-users-hub__toolbar">
        <label className="admin-users-hub__search">
          <span aria-hidden="true">🔍</span>
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={tr(safeT, 'adminUsersSearchPlaceholder', 'Pesquisar nome, e-mail ou função…')}
          />
        </label>
        <div className="admin-users-hub__toolbar-actions">
          <div className="admin-users-hub__filters" role="tablist" aria-label={tr(safeT, 'adminUsersFilterLabel', 'Filtrar')}>
            {(
              [
                ['all', 'adminUsersFilterAll', 'Todos'],
                ['admins', 'adminUsersFilterAdmins', 'Admins'],
                ['standard', 'adminUsersFilterStandard', 'Com permissões'],
              ] as const
            ).map(([id, key, fb]) => (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={filter === id}
                className={`admin-users-hub-filter${filter === id ? ' admin-users-hub-filter--active' : ''}`}
                onClick={() => setFilter(id)}
              >
                {tr(safeT, key, fb)}
              </button>
            ))}
          </div>
          <label className="admin-users-hub__sort">
            <span>{tr(safeT, 'adminUsersSortLabel', 'Ordenar')}</span>
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value as 'name' | 'role')}>
              <option value="name">{tr(safeT, 'adminUsersSortName', 'Nome A–Z')}</option>
              <option value="role">{tr(safeT, 'adminUsersSortRole', 'Função A–Z')}</option>
            </select>
          </label>
          <button
            type="button"
            className={`admin-users-hub-btn admin-users-hub-btn--primary${showUserForm && !editingUser ? ' admin-users-hub-btn--active' : ''}`}
            onClick={handleAddUser}
          >
            + {tr(safeT, 'adminUsersNewUser', 'Novo utilizador')}
          </button>
        </div>
      </div>

      {showUserForm ? (
        <div className="admin-users-hub__editor">
          <header className="admin-users-hub__editor-head">
            <h4>{editingUser ? safeT?.editUser || 'Editar Utilizador' : safeT?.addUser || 'Adicionar Utilizador'}</h4>
            <button type="button" className="admin-users-hub-btn admin-users-hub-btn--ghost admin-users-hub-btn--sm" onClick={cancelForm}>
              {safeT?.cancel || 'Cancelar'}
            </button>
          </header>
          <AdminUserFormPanel
            safeT={safeT}
            editingUser={editingUser}
            userForm={userForm}
            setUserForm={setUserForm}
            gestores={gestores}
            tecnicos={tecnicos}
          />
          <div className="admin-users-hub__editor-actions">
            <button type="button" className="admin-users-hub-btn admin-users-hub-btn--ghost" onClick={cancelForm}>
              {safeT?.cancel || 'Cancelar'}
            </button>
            <button type="button" className="admin-users-hub-btn admin-users-hub-btn--primary" onClick={handleSaveUser}>
              {safeT?.save || 'Salvar'}
            </button>
          </div>
        </div>
      ) : null}

      <div className="admin-users-hub__list">
        {users.length === 0 ? (
          <div className="admin-users-hub__empty">
            <span aria-hidden="true">👤</span>
            <p>{safeT?.noUsers || 'Nenhum usuário cadastrado'}</p>
            <button type="button" className="admin-users-hub-btn admin-users-hub-btn--primary" onClick={handleAddUser}>
              {safeT?.addUser || 'Adicionar Usuário'}
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="admin-users-hub__empty">
            <span aria-hidden="true">🔎</span>
            <p>{tr(safeT, 'adminUsersEmptyFiltered', 'Nenhum resultado para esta pesquisa ou filtro.')}</p>
          </div>
        ) : (
          filtered.map((user) => {
            const activeKeys = getActivePermissionKeys(user.permissions, user.isAdmin)
            const activeCount = countActivePermissions(user.permissions, user.isAdmin)
            const visibleChips = activeKeys.slice(0, 5)
            const extraCount = activeKeys.length - visibleChips.length
            const isConfirming = confirmDeleteId === user.id

            return (
              <article
                key={user.id}
                className={`admin-users-hub-card${editingUser?.id === user.id ? ' admin-users-hub-card--editing' : ''}`}
              >
                <div className="admin-users-hub-card__main">
                  <div className="admin-users-hub-card__avatar" aria-hidden="true">
                    {initials(user.name)}
                  </div>
                  <div className="admin-users-hub-card__info">
                    <div className="admin-users-hub-card__title-row">
                      <h5>{user.name}</h5>
                      {user.isAdmin ? (
                        <span className="admin-users-hub-badge admin-users-hub-badge--admin">
                          {tr(safeT, 'adminUsersAdminBadge', 'Admin')}
                        </span>
                      ) : (
                        <span className="admin-users-hub-badge admin-users-hub-badge--modules">
                          {activeCount}/{USER_PERMISSION_KEYS.length}{' '}
                          {tr(safeT, 'adminUsersModulesLabel', 'módulos')}
                        </span>
                      )}
                    </div>
                    <span className="admin-users-hub-card__meta">
                      {user.email} · {user.role}
                    </span>
                    {user.linkedProfileType && user.linkedProfileId ? (
                      <span className="admin-users-hub-card__link">
                        {tr(safeT, 'adminUsersLinkedProfile', 'Vínculo')}:{' '}
                        {user.linkedProfileType === 'gestor' ? safeT?.gestores || 'Gestor' : safeT?.tecnicos || 'Técnico'}
                      </span>
                    ) : null}
                    <div className="admin-users-hub-card__chips" aria-label={safeT?.permissions || 'Permissões'}>
                      {user.isAdmin ? (
                        <span className="admin-users-hub-chip admin-users-hub-chip--gold">
                          {tr(safeT, 'adminUsersFullAccessChip', 'Acesso total')}
                        </span>
                      ) : activeKeys.length === 0 ? (
                        <span className="admin-users-hub-chip admin-users-hub-chip--muted">
                          {tr(safeT, 'adminUsersNoModulesChip', 'Sem módulos ativos')}
                        </span>
                      ) : (
                        <>
                          {visibleChips.map((key) => (
                            <span key={key} className="admin-users-hub-chip">
                              {permissionLabel(safeT, key)}
                            </span>
                          ))}
                          {extraCount > 0 ? (
                            <span className="admin-users-hub-chip admin-users-hub-chip--more">+{extraCount}</span>
                          ) : null}
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <div className="admin-users-hub-card__actions">
                  <button type="button" className="admin-users-hub-btn admin-users-hub-btn--sm admin-users-hub-btn--secondary" onClick={() => handleEditUser(user)}>
                    {safeT?.edit || 'Editar'}
                  </button>
                  {isConfirming ? (
                    <>
                      <button
                        type="button"
                        className="admin-users-hub-btn admin-users-hub-btn--sm admin-users-hub-btn--danger"
                        onClick={() => {
                          handleDeleteUser(user.id)
                          setConfirmDeleteId(null)
                        }}
                      >
                        {tr(safeT, 'adminUsersConfirmDelete', 'Sim, eliminar')}
                      </button>
                      <button
                        type="button"
                        className="admin-users-hub-btn admin-users-hub-btn--sm admin-users-hub-btn--ghost"
                        onClick={() => setConfirmDeleteId(null)}
                      >
                        {safeT?.cancel || 'Cancelar'}
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      className="admin-users-hub-btn admin-users-hub-btn--sm admin-users-hub-btn--danger-outline"
                      onClick={() => setConfirmDeleteId(user.id)}
                    >
                      {safeT?.delete || 'Excluir'}
                    </button>
                  )}
                </div>
              </article>
            )
          })
        )}
      </div>
    </section>
  )
}
