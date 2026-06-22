'use client'

import React, { useMemo, useState } from 'react'
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
  handleSavePassword: () => boolean
  saveData: (key: string, value: unknown, saveToLocalStorage?: boolean, awaitServer?: boolean) => Promise<boolean>
}

function tr(safeT: SafeT, key: string, fallback: string): string {
  return (safeT as Record<string, string | undefined>)[key] || fallback
}

function passwordStrengthScore(pwd: string): number {
  if (!pwd) return 0
  let score = 0
  if (pwd.length >= 8) score += 1
  if (pwd.length >= 12) score += 1
  if (/[a-z]/.test(pwd) && /[A-Z]/.test(pwd)) score += 1
  if (/\d/.test(pwd)) score += 1
  if (/[^A-Za-z0-9]/.test(pwd)) score += 1
  return Math.min(score, 5)
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

export function AdminPasswordsSection(props: AdminPasswordsSectionProps) {
  const {
    safeT,
    t,
    selectedLanguage,
    localeDatetimeGeneral,
    managedPasswords,
    showPasswordForm,
    passwordForm,
    visiblePasswords,
    setShowPasswordForm,
    setPasswordForm,
    setVisiblePasswords,
    setManagedPasswords,
    generatePassword,
    handleSavePassword,
    saveData,
  } = props

  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState<'date' | 'name'>('date')
  const [copyId, setCopyId] = useState<string | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [saveFlash, setSaveFlash] = useState(false)

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    let list = [...managedPasswords]
    if (q) {
      list = list.filter((e) => e.tecnicoName.toLowerCase().includes(q) || e.password.toLowerCase().includes(q))
    }
    list.sort((a, b) => {
      if (sortBy === 'name') return a.tecnicoName.localeCompare(b.tecnicoName, undefined, { sensitivity: 'base' })
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    })
    return list
  }, [managedPasswords, search, sortBy])

  const strength = passwordStrengthScore(passwordForm.password)
  const strengthLabel =
    strength <= 2
      ? tr(safeT, 'adminPasswordsStrengthWeak', 'Fraca')
      : strength <= 3
        ? tr(safeT, 'adminPasswordsStrengthMedium', 'Média')
        : tr(safeT, 'adminPasswordsStrengthStrong', 'Forte')

  const allVisible = filtered.length > 0 && filtered.every((e) => visiblePasswords.has(e.id))

  const toggleVisible = (id: string) => {
    const next = new Set(visiblePasswords)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setVisiblePasswords(next)
  }

  const toggleAllVisible = () => {
    if (allVisible) {
      const next = new Set(visiblePasswords)
      filtered.forEach((e) => next.delete(e.id))
      setVisiblePasswords(next)
      return
    }
    const next = new Set(visiblePasswords)
    filtered.forEach((e) => next.add(e.id))
    setVisiblePasswords(next)
  }

  const copyPassword = async (entry: PasswordEntry) => {
    try {
      await navigator.clipboard.writeText(entry.password)
      setCopyId(entry.id)
      window.setTimeout(() => setCopyId((cur) => (cur === entry.id ? null : cur)), 2000)
    } catch {
      alert(t.passwordCopied || tr(safeT, 'passwordCopied', 'Senha copiada!'))
    }
  }

  const deleteEntry = (id: string) => {
    const updated = managedPasswords.filter((p) => p.id !== id)
    setManagedPasswords(updated)
    void saveData('nonato-managed-passwords', updated)
    const nextVisible = new Set(visiblePasswords)
    nextVisible.delete(id)
    setVisiblePasswords(nextVisible)
    setConfirmDeleteId(null)
  }

  const onSave = () => {
    if (!handleSavePassword()) return
    setShowPasswordForm(false)
    setSaveFlash(true)
    window.setTimeout(() => setSaveFlash(false), 2500)
  }

  return (
    <section className="admin-passwords-hub">
      <header className="admin-passwords-hub__hero">
        <div className="admin-passwords-hub__hero-glow" aria-hidden="true" />
        <div className="admin-passwords-hub__hero-content">
          <div className="admin-passwords-hub__hero-icon" aria-hidden="true">
            🔐
          </div>
          <div>
            <h3 className="admin-passwords-hub__hero-title">
              {tr(safeT, 'adminPasswordsHubTitle', 'Cofre de Senhas')}
            </h3>
            <p className="admin-passwords-hub__hero-desc">
              {tr(
                safeT,
                'adminPasswordsHubDesc',
                'Área exclusiva do administrador: gere, guarde e partilhe credenciais de técnicos para checklist e acesso em campo.'
              )}
            </p>
          </div>
        </div>
        <ol className="admin-passwords-hub__steps">
          <li>{tr(safeT, 'adminPasswordsStep1', '1. Crie ou importe ao registar utilizador')}</li>
          <li>{tr(safeT, 'adminPasswordsStep2', '2. Pesquise e copie com segurança')}</li>
          <li>{tr(safeT, 'adminPasswordsStep3', '3. Entregue ao técnico em canal privado')}</li>
        </ol>
      </header>

      <div className="admin-passwords-hub__stats">
        <div className="admin-passwords-hub__stat">
          <span>{tr(safeT, 'adminPasswordsKpiTotal', 'Registos')}</span>
          <strong>{managedPasswords.length}</strong>
        </div>
        <div className="admin-passwords-hub__stat">
          <span>{tr(safeT, 'adminPasswordsKpiFiltered', 'Visíveis agora')}</span>
          <strong>{filtered.length}</strong>
        </div>
        <div className="admin-passwords-hub__stat admin-passwords-hub__stat--note">
          <span>{tr(safeT, 'adminPasswordsSecurityNote', 'Acesso')}</span>
          <strong>{tr(safeT, 'adminPasswordsAdminOnly', 'Só administrador')}</strong>
        </div>
      </div>

      <div className="admin-passwords-hub__toolbar">
        <label className="admin-passwords-hub__search">
          <span aria-hidden="true">🔍</span>
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={tr(safeT, 'adminPasswordsSearchPlaceholder', 'Pesquisar técnico ou senha…')}
          />
        </label>
        <div className="admin-passwords-hub__toolbar-actions">
          <label className="admin-passwords-hub__sort">
            <span>{tr(safeT, 'adminPasswordsSortLabel', 'Ordenar')}</span>
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value as 'date' | 'name')}>
              <option value="date">{tr(safeT, 'adminPasswordsSortDate', 'Mais recentes')}</option>
              <option value="name">{tr(safeT, 'adminPasswordsSortName', 'Nome A–Z')}</option>
            </select>
          </label>
          {filtered.length > 0 ? (
            <button type="button" className="admin-passwords-hub-btn admin-passwords-hub-btn--ghost" onClick={toggleAllVisible}>
              {allVisible
                ? tr(safeT, 'adminPasswordsHideAll', 'Ocultar todas')
                : tr(safeT, 'adminPasswordsRevealAll', 'Mostrar todas')}
            </button>
          ) : null}
          <button
            type="button"
            className={`admin-passwords-hub-btn admin-passwords-hub-btn--primary${showPasswordForm ? ' admin-passwords-hub-btn--active' : ''}`}
            onClick={() => setShowPasswordForm(!showPasswordForm)}
          >
            {showPasswordForm ? tr(safeT, 'cancel', 'Cancelar') : tr(safeT, 'addPassword', '+ Nova senha')}
          </button>
        </div>
      </div>

      {saveFlash ? (
        <p className="admin-passwords-hub__flash" role="status">
          {tr(safeT, 'passwordSaved', 'Senha guardada com sucesso!')}
        </p>
      ) : null}

      {showPasswordForm ? (
        <div className="admin-passwords-hub__composer">
          <h4>{tr(safeT, 'createPassword', 'Criar nova senha')}</h4>
          <p className="admin-passwords-hub__composer-hint">
            {tr(
              safeT,
              'passwordManagerDescription',
              'As senhas dos técnicos são guardadas aqui automaticamente ao criar utilizadores.'
            )}
          </p>
          <div className="admin-passwords-hub__composer-grid">
            <label>
              <span>{tr(safeT, 'tecnicoName', 'Nome do técnico')} *</span>
              <input
                type="text"
                value={passwordForm.tecnicoName}
                onChange={(e) => setPasswordForm({ ...passwordForm, tecnicoName: e.target.value })}
                placeholder={tr(safeT, 'tecnicoNamePlaceholder', 'Digite o nome do técnico')}
                autoComplete="off"
              />
            </label>
            <label>
              <span>{tr(safeT, 'password', 'Senha')} *</span>
              <div className="admin-passwords-hub__password-row">
                <input
                  type="text"
                  value={passwordForm.password}
                  onChange={(e) => setPasswordForm({ ...passwordForm, password: e.target.value })}
                  placeholder={tr(safeT, 'passwordPlaceholder', 'Digite ou gere uma senha segura')}
                  autoComplete="new-password"
                  spellCheck={false}
                />
                <button
                  type="button"
                  className="admin-passwords-hub-btn admin-passwords-hub-btn--secondary"
                  onClick={() => setPasswordForm({ ...passwordForm, password: generatePassword(16) })}
                >
                  {tr(safeT, 'generatePassword', 'Gerar')}
                </button>
              </div>
            </label>
          </div>
          {passwordForm.password ? (
            <div className="admin-passwords-hub__strength">
              <div className="admin-passwords-hub__strength-bar" aria-hidden="true">
                <span style={{ width: `${(strength / 5) * 100}%` }} data-level={strength <= 2 ? 'weak' : strength <= 3 ? 'mid' : 'strong'} />
              </div>
              <span>
                {tr(safeT, 'adminPasswordsStrengthLabel', 'Força')}: {strengthLabel}
              </span>
            </div>
          ) : null}
          <p className="admin-passwords-hub__composer-tip">
            {tr(safeT, 'generatePasswordHint', 'Use «Gerar» para uma senha aleatória com letras, números e símbolos.')}
          </p>
          <div className="admin-passwords-hub__composer-actions">
            <button
              type="button"
              className="admin-passwords-hub-btn admin-passwords-hub-btn--ghost"
              onClick={() => {
                setShowPasswordForm(false)
                setPasswordForm({ tecnicoName: '', password: '' })
              }}
            >
              {tr(safeT, 'cancel', 'Cancelar')}
            </button>
            <button type="button" className="admin-passwords-hub-btn admin-passwords-hub-btn--primary" onClick={onSave}>
              {tr(safeT, 'save', 'Guardar')}
            </button>
          </div>
        </div>
      ) : null}

      <div className="admin-passwords-hub__list">
        {managedPasswords.length === 0 && !showPasswordForm ? (
          <div className="admin-passwords-hub__empty">
            <span aria-hidden="true">🗝️</span>
            <p>{tr(safeT, 'noPasswordsManaged', 'Nenhuma senha gerida ainda.')}</p>
            <button type="button" className="admin-passwords-hub-btn admin-passwords-hub-btn--primary" onClick={() => setShowPasswordForm(true)}>
              {tr(safeT, 'addPassword', '+ Adicionar senha')}
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="admin-passwords-hub__empty">
            <p>{tr(safeT, 'adminPasswordsEmptyFiltered', 'Nenhum resultado para esta pesquisa.')}</p>
          </div>
        ) : (
          filtered.map((entry) => {
            const visible = visiblePasswords.has(entry.id)
            const copied = copyId === entry.id
            const confirming = confirmDeleteId === entry.id
            return (
              <article key={entry.id} className="admin-passwords-hub-card">
                <div className="admin-passwords-hub-card__main">
                  <div className="admin-passwords-hub-card__avatar" aria-hidden="true">
                    {initials(entry.tecnicoName)}
                  </div>
                  <div className="admin-passwords-hub-card__info">
                    <h5>{entry.tecnicoName}</h5>
                    <time dateTime={entry.createdAt}>
                      {tr(safeT, 'createdAt', 'Criado em:')}{' '}
                      {new Date(entry.createdAt).toLocaleString(localeDatetimeGeneral(selectedLanguage))}
                    </time>
                    <div className="admin-passwords-hub-card__secret">
                      {visible ? (
                        <code>{entry.password}</code>
                      ) : (
                        <span className="admin-passwords-hub-card__masked">••••••••••••</span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="admin-passwords-hub-card__actions">
                  <button
                    type="button"
                    className="admin-passwords-hub-btn admin-passwords-hub-btn--sm"
                    onClick={() => toggleVisible(entry.id)}
                    aria-pressed={visible}
                  >
                    {visible ? tr(safeT, 'hidePassword', 'Ocultar') : tr(safeT, 'showPassword', 'Mostrar')}
                  </button>
                  <button
                    type="button"
                    className={`admin-passwords-hub-btn admin-passwords-hub-btn--sm${copied ? ' admin-passwords-hub-btn--success' : ''}`}
                    onClick={() => void copyPassword(entry)}
                  >
                    {copied ? tr(safeT, 'adminPasswordsCopied', 'Copiado!') : tr(safeT, 'copyPassword', 'Copiar')}
                  </button>
                  {confirming ? (
                    <>
                      <button
                        type="button"
                        className="admin-passwords-hub-btn admin-passwords-hub-btn--sm admin-passwords-hub-btn--danger"
                        onClick={() => deleteEntry(entry.id)}
                      >
                        {tr(safeT, 'adminPasswordsConfirmDelete', 'Sim, eliminar')}
                      </button>
                      <button
                        type="button"
                        className="admin-passwords-hub-btn admin-passwords-hub-btn--sm admin-passwords-hub-btn--ghost"
                        onClick={() => setConfirmDeleteId(null)}
                      >
                        {tr(safeT, 'cancel', 'Cancelar')}
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      className="admin-passwords-hub-btn admin-passwords-hub-btn--sm admin-passwords-hub-btn--danger-outline"
                      onClick={() => setConfirmDeleteId(entry.id)}
                    >
                      {tr(safeT, 'deletePassword', 'Eliminar')}
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
