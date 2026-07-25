'use client'

import { useMemo, useState } from 'react'
import {
  type Gestor,
  type GestorFormState,
  type Tecnico,
  type TecnicoFormState,
  type TecnicoType,
  type TipoGestor,
  type TipoGestorFormState,
  emptyGestorForm,
  emptyTecnicoForm,
  gestorToForm,
  tecnicoToForm,
} from '../../lib/pessoaTypes'
import { PessoaAvatar, PessoaPhotoField } from './PessoaPhotoField'
import './gestores-tecnicos.css'

export type GestoresTecnicosLabels = {
  gestoresTitle?: string
  gestoresTab?: string
  tecnicosTab?: string
  totalCadastrados?: string
  addGestor?: string
  addTecnico?: string
  editGestor?: string
  editTecnico?: string
  noGestores?: string
  noTecnicos?: string
  nenhumGestorFiltro?: string
  name?: string
  email?: string
  phone?: string
  address?: string
  photo?: string
  save?: string
  cancel?: string
  edit?: string
  delete?: string
  areaAtuacao?: string
  filtrarPorArea?: string
  type?: string
  internal?: string
  external?: string
  armazem?: string
  searchPlaceholder?: string
  fotoPerfil?: string
  cliqueAdicionarFoto?: string
  removePhoto?: string
  fotoHint?: string
  fillAllFields?: string
  confirmDeleteGestor?: string
  confirmDeleteTecnico?: string
  gestorSaved?: string
  gestorUpdated?: string
  recebeAvisosOS?: string
  esteGestorRecebeAvisosOS?: string
  gerenciarTiposTitulo?: string
  gerenciarTiposDesc?: string
  gerenciarTiposBtn?: string
  todosTecnicos?: string
  tecnicosInternos?: string
  tecnicosExternos?: string
  tecnicosArmazem?: string
  cadastrados?: string
  fechar?: string
  novoCadastro?: string
  editarCadastro?: string
}

type Props = {
  gestores: Gestor[]
  tecnicos: Tecnico[]
  tiposGestores: TipoGestor[]
  labels: GestoresTecnicosLabels
  activeSection: 'gestores' | 'tecnicos'
  onActiveSectionChange: (s: 'gestores' | 'tecnicos') => void
  onSaveGestor: (form: GestorFormState, editing: Gestor | null) => boolean
  onDeleteGestor: (id: string) => void
  onSaveTecnico: (form: TecnicoFormState, editing: Tecnico | null) => boolean
  onDeleteTecnico: (id: string) => void
  onSaveTipoGestor: (form: TipoGestorFormState, editing: TipoGestor | null) => boolean
  onDeleteTipoGestor: (id: string) => boolean
  defaultGestorArea?: string
}

function tipoTecnicoLabel(type: TecnicoType, labels: GestoresTecnicosLabels): string {
  if (type === 'internal') return labels.internal || 'Interno'
  if (type === 'external') return labels.external || 'Externo'
  return labels.armazem || 'Armazém'
}

function tipoTecnicoIcon(type: TecnicoType): string {
  if (type === 'internal') return '🏢'
  if (type === 'external') return '🌐'
  return '📦'
}

export function GestoresTecnicosPanel({
  gestores,
  tecnicos,
  tiposGestores,
  labels: L,
  activeSection,
  onActiveSectionChange,
  onSaveGestor,
  onDeleteGestor,
  onSaveTecnico,
  onDeleteTecnico,
  onSaveTipoGestor,
  onDeleteTipoGestor,
  defaultGestorArea = 'assistencia-tecnica',
}: Props) {
  const [busca, setBusca] = useState('')
  const [filtroArea, setFiltroArea] = useState('todas')
  const [filtroTecnico, setFiltroTecnico] = useState<'todos' | TecnicoType>('todos')

  const [gestorFormOpen, setGestorFormOpen] = useState(false)
  const [editingGestor, setEditingGestor] = useState<Gestor | null>(null)
  const [gestorForm, setGestorForm] = useState<GestorFormState>(() => emptyGestorForm(defaultGestorArea))

  const [tecnicoFormOpen, setTecnicoFormOpen] = useState(false)
  const [editingTecnico, setEditingTecnico] = useState<Tecnico | null>(null)
  const [tecnicoForm, setTecnicoForm] = useState<TecnicoFormState>(() => emptyTecnicoForm('internal'))

  const [tiposOpen, setTiposOpen] = useState(false)
  const [editingTipo, setEditingTipo] = useState<TipoGestor | null>(null)
  const [tipoForm, setTipoForm] = useState<TipoGestorFormState>({
    id: '',
    nome: '',
    cor: '#00c853',
    icone: '👤',
    ordem: tiposGestores.length + 1,
  })

  const q = busca.trim().toLowerCase()

  const gestoresFiltrados = useMemo(() => {
    return gestores.filter((g) => {
      if (filtroArea !== 'todas' && g.area !== filtroArea) return false
      if (!q) return true
      return (
        g.name.toLowerCase().includes(q) ||
        g.email.toLowerCase().includes(q) ||
        g.phone.toLowerCase().includes(q)
      )
    })
  }, [gestores, filtroArea, q])

  const tecnicosFiltrados = useMemo(() => {
    return tecnicos.filter((t) => {
      if (filtroTecnico !== 'todos' && t.type !== filtroTecnico) return false
      if (!q) return true
      return (
        t.name.toLowerCase().includes(q) ||
        t.email.toLowerCase().includes(q) ||
        t.phone.toLowerCase().includes(q)
      )
    })
  }, [tecnicos, filtroTecnico, q])

  const tiposOrdenados = useMemo(
    () => [...tiposGestores].sort((a, b) => a.ordem - b.ordem),
    [tiposGestores]
  )

  const openAddGestor = () => {
    setEditingGestor(null)
    setGestorForm(emptyGestorForm(tiposOrdenados[0]?.id || defaultGestorArea))
    setGestorFormOpen(true)
  }

  const openEditGestor = (g: Gestor) => {
    setEditingGestor(g)
    setGestorForm(gestorToForm(g))
    setGestorFormOpen(true)
  }

  const openAddTecnico = () => {
    setEditingTecnico(null)
    const type: TecnicoType =
      filtroTecnico === 'external' ? 'external' : filtroTecnico === 'armazem' ? 'armazem' : 'internal'
    setTecnicoForm(emptyTecnicoForm(type))
    setTecnicoFormOpen(true)
  }

  const openEditTecnico = (t: Tecnico) => {
    setEditingTecnico(t)
    setTecnicoForm(tecnicoToForm(t))
    setTecnicoFormOpen(true)
  }

  const closeGestorForm = () => {
    setGestorFormOpen(false)
    setEditingGestor(null)
  }

  const closeTecnicoForm = () => {
    setTecnicoFormOpen(false)
    setEditingTecnico(null)
  }

  const submitGestor = () => {
    if (onSaveGestor(gestorForm, editingGestor)) closeGestorForm()
  }

  const submitTecnico = () => {
    if (onSaveTecnico(tecnicoForm, editingTecnico)) closeTecnicoForm()
  }

  const renderTipoBadge = (areaId: string) => {
    const tipo = tiposGestores.find((t) => t.id === areaId)
    if (!tipo) {
      return <span className="gt-badge gt-badge--muted">⚠ {areaId}</span>
    }
    return (
      <span className="gt-badge" style={{ borderColor: tipo.cor, color: tipo.cor, background: `${tipo.cor}22` }}>
        {tipo.icone} {tipo.nome}
      </span>
    )
  }

  return (
    <div className="gt-panel">
      <header className="gt-panel__hero">
        <div className="gt-panel__hero-text">
          <h2 className="gt-panel__title">{L.gestoresTitle || 'Gestores e Técnicos'}</h2>
          <p className="gt-panel__meta">
            {gestores.length + tecnicos.length} {L.totalCadastrados || 'cadastrado(s)'}
          </p>
        </div>
        <div className="gt-panel__tabs" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={activeSection === 'gestores'}
            className={`gt-panel__tab${activeSection === 'gestores' ? ' gt-panel__tab--active' : ''}`}
            onClick={() => onActiveSectionChange('gestores')}
          >
            👔 {L.gestoresTab || 'Gestores'} <span className="gt-panel__tab-count">{gestores.length}</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeSection === 'tecnicos'}
            className={`gt-panel__tab${activeSection === 'tecnicos' ? ' gt-panel__tab--active' : ''}`}
            onClick={() => onActiveSectionChange('tecnicos')}
          >
            🔧 {L.tecnicosTab || 'Técnicos'} <span className="gt-panel__tab-count">{tecnicos.length}</span>
          </button>
        </div>
      </header>

      <div className="gt-toolbar">
        <input
          type="search"
          className="gt-toolbar__search"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder={L.searchPlaceholder || 'Buscar por nome, e-mail ou telefone…'}
          autoComplete="off"
        />
        {activeSection === 'gestores' ? (
          <>
            <select
              className="gt-toolbar__select"
              value={filtroArea}
              onChange={(e) => setFiltroArea(e.target.value)}
              aria-label={L.filtrarPorArea || 'Filtrar por área'}
            >
              <option value="todas">{L.filtrarPorArea || 'Todas as áreas'}</option>
              {tiposOrdenados.map((tipo) => (
                <option key={tipo.id} value={tipo.id}>
                  {tipo.icone} {tipo.nome}
                </option>
              ))}
            </select>
            <button type="button" className="gt-btn gt-btn--ghost" onClick={() => setTiposOpen(true)}>
              ⚙ {L.gerenciarTiposBtn || 'Áreas de atuação'}
            </button>
            <button type="button" className="gt-btn gt-btn--primary" onClick={openAddGestor}>
              + {L.addGestor || 'Novo gestor'}
            </button>
          </>
        ) : (
          <>
            <div className="gt-toolbar__pills" role="group">
              {(
                [
                  ['todos', L.todosTecnicos || 'Todos'],
                  ['internal', L.tecnicosInternos || 'Internos'],
                  ['external', L.tecnicosExternos || 'Externos'],
                  ['armazem', L.tecnicosArmazem || 'Armazém'],
                ] as const
              ).map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  className={`gt-pill${filtroTecnico === key ? ' gt-pill--active' : ''}`}
                  onClick={() => setFiltroTecnico(key)}
                >
                  {label}
                </button>
              ))}
            </div>
            <button type="button" className="gt-btn gt-btn--primary" onClick={openAddTecnico}>
              + {L.addTecnico || 'Novo técnico'}
            </button>
          </>
        )}
      </div>

      {activeSection === 'gestores' ? (
        gestoresFiltrados.length === 0 ? (
          <p className="gt-empty">{q || filtroArea !== 'todas' ? L.nenhumGestorFiltro : L.noGestores}</p>
        ) : (
          <div className="gt-grid">
            {gestoresFiltrados.map((gestor) => {
              const tipo = tiposGestores.find((t) => t.id === gestor.area)
              return (
                <article key={gestor.id} className="gt-card">
                  <div className="gt-card__head">
                    <PessoaAvatar name={gestor.name} photo={gestor.photo} size="card" accent={tipo?.cor} />
                    <div className="gt-card__head-text">
                      <h3 className="gt-card__name">{gestor.name}</h3>
                      {renderTipoBadge(gestor.area)}
                    </div>
                  </div>
                  <ul className="gt-card__meta">
                    <li>✉ {gestor.email}</li>
                    <li>📞 {gestor.phone}</li>
                    {gestor.address ? <li>📍 {gestor.address}</li> : null}
                  </ul>
                  {gestor.area === 'industrial' ? (
                    <p className="gt-card__note">📩 {L.recebeAvisosOS}</p>
                  ) : null}
                  <div className="gt-card__actions">
                    <button type="button" className="gt-btn gt-btn--ghost gt-btn--sm" onClick={() => openEditGestor(gestor)}>
                      {L.edit || 'Editar'}
                    </button>
                    <button
                      type="button"
                      className="gt-btn gt-btn--danger gt-btn--sm"
                      onClick={() => {
                        if (window.confirm(L.confirmDeleteGestor || 'Excluir este gestor?')) onDeleteGestor(gestor.id)
                      }}
                    >
                      {L.delete || 'Excluir'}
                    </button>
                  </div>
                </article>
              )
            })}
          </div>
        )
      ) : tecnicosFiltrados.length === 0 ? (
        <p className="gt-empty">{L.noTecnicos}</p>
      ) : (
        <div className="gt-grid">
          {tecnicosFiltrados.map((tecnico) => (
            <article key={tecnico.id} className="gt-card">
              <div className="gt-card__head">
                <PessoaAvatar
                  name={tecnico.name}
                  photo={tecnico.photo}
                  size="card"
                  accent={tecnico.type === 'internal' ? '#00c853' : tecnico.type === 'external' ? '#f59e0b' : '#6366f1'}
                />
                <div className="gt-card__head-text">
                  <h3 className="gt-card__name">{tecnico.name}</h3>
                  <span className={`gt-badge gt-badge--${tecnico.type}`}>
                    {tipoTecnicoIcon(tecnico.type)} {tipoTecnicoLabel(tecnico.type, L)}
                  </span>
                </div>
              </div>
              <ul className="gt-card__meta">
                <li>✉ {tecnico.email}</li>
                <li>📞 {tecnico.phone}</li>
                {tecnico.address ? <li>📍 {tecnico.address}</li> : null}
              </ul>
              <div className="gt-card__actions">
                <button type="button" className="gt-btn gt-btn--ghost gt-btn--sm" onClick={() => openEditTecnico(tecnico)}>
                  {L.edit || 'Editar'}
                </button>
                <button
                  type="button"
                  className="gt-btn gt-btn--danger gt-btn--sm"
                  onClick={() => {
                    if (window.confirm(L.confirmDeleteTecnico || 'Excluir este técnico?')) onDeleteTecnico(tecnico.id)
                  }}
                >
                  {L.delete || 'Excluir'}
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      {gestorFormOpen ? (
        <div className="gt-drawer-overlay" onClick={closeGestorForm}>
          <div className="gt-drawer" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
            <header className="gt-drawer__header">
              <h3>{editingGestor ? L.editGestor || L.editarCadastro : L.addGestor || L.novoCadastro}</h3>
              <button type="button" className="gt-drawer__close" onClick={closeGestorForm} aria-label={L.fechar || 'Fechar'}>
                ×
              </button>
            </header>
            <div className="gt-drawer__body">
              <PessoaPhotoField
                photo={gestorForm.photo}
                name={gestorForm.name}
                variant="gestor"
                onPhotoChange={(photo) => setGestorForm((f) => ({ ...f, photo }))}
                onRemovePhoto={() => setGestorForm((f) => ({ ...f, photo: '' }))}
                labels={{
                  title: L.fotoPerfil || L.photo,
                  add: L.cliqueAdicionarFoto,
                  remove: L.removePhoto,
                  hint: L.fotoHint,
                }}
              />
              <div className="gt-form-grid">
                <label className="gt-field">
                  <span>{L.name} *</span>
                  <input
                    className="gt-input"
                    value={gestorForm.name}
                    onChange={(e) => setGestorForm((f) => ({ ...f, name: e.target.value }))}
                  />
                </label>
                <label className="gt-field">
                  <span>{L.email} *</span>
                  <input
                    className="gt-input"
                    type="email"
                    value={gestorForm.email}
                    onChange={(e) => setGestorForm((f) => ({ ...f, email: e.target.value }))}
                  />
                </label>
                <label className="gt-field">
                  <span>{L.phone} *</span>
                  <input
                    className="gt-input"
                    value={gestorForm.phone}
                    onChange={(e) => setGestorForm((f) => ({ ...f, phone: e.target.value }))}
                  />
                </label>
                <label className="gt-field gt-field--full">
                  <span>{L.address}</span>
                  <input
                    className="gt-input"
                    value={gestorForm.address}
                    onChange={(e) => setGestorForm((f) => ({ ...f, address: e.target.value }))}
                  />
                </label>
                <label className="gt-field gt-field--full">
                  <span>{L.areaAtuacao} *</span>
                  <select
                    className="gt-input gt-select"
                    value={gestorForm.area}
                    onChange={(e) => setGestorForm((f) => ({ ...f, area: e.target.value }))}
                  >
                    {tiposOrdenados.map((tipo) => (
                      <option key={tipo.id} value={tipo.id}>
                        {tipo.icone} {tipo.nome}
                      </option>
                    ))}
                  </select>
                </label>
                {gestorForm.area === 'industrial' ? (
                  <p className="gt-field-note gt-field--full">📩 {L.esteGestorRecebeAvisosOS}</p>
                ) : null}
              </div>
            </div>
            <footer className="gt-drawer__footer">
              <button type="button" className="gt-btn gt-btn--ghost" onClick={closeGestorForm}>
                {L.cancel}
              </button>
              <button type="button" className="gt-btn gt-btn--primary" onClick={submitGestor}>
                {L.save}
              </button>
            </footer>
          </div>
        </div>
      ) : null}

      {tecnicoFormOpen ? (
        <div className="gt-drawer-overlay" onClick={closeTecnicoForm}>
          <div className="gt-drawer" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
            <header className="gt-drawer__header">
              <h3>{editingTecnico ? L.editTecnico || L.editarCadastro : L.addTecnico || L.novoCadastro}</h3>
              <button type="button" className="gt-drawer__close" onClick={closeTecnicoForm} aria-label={L.fechar || 'Fechar'}>
                ×
              </button>
            </header>
            <div className="gt-drawer__body">
              <PessoaPhotoField
                photo={tecnicoForm.photo}
                name={tecnicoForm.name}
                variant="tecnico"
                onPhotoChange={(photo) => setTecnicoForm((f) => ({ ...f, photo }))}
                onRemovePhoto={() => setTecnicoForm((f) => ({ ...f, photo: '' }))}
                labels={{
                  title: L.fotoPerfil || L.photo,
                  add: L.cliqueAdicionarFoto,
                  remove: L.removePhoto,
                  hint: L.fotoHint,
                }}
              />
              <div className="gt-form-grid">
                <label className="gt-field">
                  <span>{L.name} *</span>
                  <input
                    className="gt-input"
                    value={tecnicoForm.name}
                    onChange={(e) => setTecnicoForm((f) => ({ ...f, name: e.target.value }))}
                  />
                </label>
                <label className="gt-field">
                  <span>{L.email} *</span>
                  <input
                    className="gt-input"
                    type="email"
                    value={tecnicoForm.email}
                    onChange={(e) => setTecnicoForm((f) => ({ ...f, email: e.target.value }))}
                  />
                </label>
                <label className="gt-field">
                  <span>{L.phone} *</span>
                  <input
                    className="gt-input"
                    value={tecnicoForm.phone}
                    onChange={(e) => setTecnicoForm((f) => ({ ...f, phone: e.target.value }))}
                  />
                </label>
                <label className="gt-field gt-field--full">
                  <span>{L.address}</span>
                  <input
                    className="gt-input"
                    value={tecnicoForm.address}
                    onChange={(e) => setTecnicoForm((f) => ({ ...f, address: e.target.value }))}
                  />
                </label>
                <label className="gt-field gt-field--full">
                  <span>{L.type} *</span>
                  <select
                    className="gt-input gt-select"
                    value={tecnicoForm.type}
                    onChange={(e) =>
                      setTecnicoForm((f) => ({ ...f, type: e.target.value as TecnicoType }))
                    }
                  >
                    <option value="internal">{tipoTecnicoIcon('internal')} {L.internal}</option>
                    <option value="external">{tipoTecnicoIcon('external')} {L.external}</option>
                    <option value="armazem">{tipoTecnicoIcon('armazem')} {L.armazem}</option>
                  </select>
                </label>
              </div>
            </div>
            <footer className="gt-drawer__footer">
              <button type="button" className="gt-btn gt-btn--ghost" onClick={closeTecnicoForm}>
                {L.cancel}
              </button>
              <button type="button" className="gt-btn gt-btn--primary" onClick={submitTecnico}>
                {L.save}
              </button>
            </footer>
          </div>
        </div>
      ) : null}

      {tiposOpen ? (
        <div className="gt-drawer-overlay" onClick={() => setTiposOpen(false)}>
          <div className="gt-drawer gt-drawer--wide" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
            <header className="gt-drawer__header">
              <div>
                <h3>{L.gerenciarTiposTitulo || 'Áreas de atuação'}</h3>
                <p className="gt-drawer__subtitle">{L.gerenciarTiposDesc}</p>
              </div>
              <button type="button" className="gt-drawer__close" onClick={() => setTiposOpen(false)}>
                ×
              </button>
            </header>
            <div className="gt-drawer__body">
              <div className="gt-tipos-form">
                <label className="gt-field">
                  <span>ID</span>
                  <input
                    className="gt-input"
                    value={tipoForm.id}
                    onChange={(e) => setTipoForm((f) => ({ ...f, id: e.target.value }))}
                    disabled={Boolean(editingTipo)}
                  />
                </label>
                <label className="gt-field">
                  <span>Nome</span>
                  <input
                    className="gt-input"
                    value={tipoForm.nome}
                    onChange={(e) => setTipoForm((f) => ({ ...f, nome: e.target.value }))}
                  />
                </label>
                <label className="gt-field">
                  <span>Ícone</span>
                  <input
                    className="gt-input"
                    value={tipoForm.icone}
                    onChange={(e) => setTipoForm((f) => ({ ...f, icone: e.target.value }))}
                  />
                </label>
                <label className="gt-field">
                  <span>Cor</span>
                  <input
                    className="gt-input"
                    type="color"
                    value={tipoForm.cor}
                    onChange={(e) => setTipoForm((f) => ({ ...f, cor: e.target.value }))}
                  />
                </label>
                <button
                  type="button"
                  className="gt-btn gt-btn--primary"
                  onClick={() => {
                    if (onSaveTipoGestor(tipoForm, editingTipo)) {
                      setEditingTipo(null)
                      setTipoForm({
                        id: '',
                        nome: '',
                        cor: '#00c853',
                        icone: '👤',
                        ordem: tiposGestores.length + 1,
                      })
                    }
                  }}
                >
                  {L.save}
                </button>
              </div>
              <ul className="gt-tipos-list">
                {tiposOrdenados.map((tipo) => (
                  <li key={tipo.id} className="gt-tipos-list__item">
                    <span className="gt-badge" style={{ borderColor: tipo.cor, color: tipo.cor }}>
                      {tipo.icone} {tipo.nome}
                    </span>
                    <span className="gt-tipos-list__id">{tipo.id}</span>
                    <div className="gt-tipos-list__actions">
                      <button
                        type="button"
                        className="gt-btn gt-btn--ghost gt-btn--sm"
                        onClick={() => {
                          setEditingTipo(tipo)
                          setTipoForm({ ...tipo })
                        }}
                      >
                        {L.edit}
                      </button>
                      <button
                        type="button"
                        className="gt-btn gt-btn--danger gt-btn--sm"
                        onClick={() => onDeleteTipoGestor(tipo.id)}
                      >
                        {L.delete}
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
