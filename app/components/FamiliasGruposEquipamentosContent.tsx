'use client'

import React, { useMemo, useState } from 'react'
import { GrupoEquipamento } from '../lib/equipamentosTypes'

type SetState<T> = React.Dispatch<React.SetStateAction<T>>

function FgRowActions(props: {
  onEdit: (ev: React.MouseEvent) => void
  onDelete: (ev: React.MouseEvent) => void
  editTitle: string
  deleteTitle: string
}) {
  const { onEdit, onDelete, editTitle, deleteTitle } = props
  return (
    <div className="fg-checklist-pro__row-actions">
      <button type="button" className="fg-checklist-pro__act" onClick={onEdit} title={editTitle} aria-label={editTitle}>
        <span aria-hidden>✎</span>
      </button>
      <button type="button" className="fg-checklist-pro__act fg-checklist-pro__act--danger" onClick={onDelete} title={deleteTitle} aria-label={deleteTitle}>
        <span aria-hidden>×</span>
      </button>
    </div>
  )
}

export type FamiliasGruposEquipamentosContentProps = {
  safeT: Record<string, string | undefined>
  LogoComponent: React.ComponentType<{ size?: 'small' | 'medium' | 'large' }>
  closeTab: (tabId: string) => void
  activeTabId: string | null
  voltarPaginaInicial: () => void
  saveData: (key: string, value: unknown) => void | Promise<void>
  familiasEquipamento: string[]
  setFamiliasEquipamento: SetState<string[]>
  gruposEquipamento: GrupoEquipamento[]
  setGruposEquipamento: SetState<GrupoEquipamento[]>
  novaFamiliaEquipamento: string
  setNovaFamiliaEquipamento: SetState<string>
  selectedFamiliaForGrupos: string | null
  setSelectedFamiliaForGrupos: SetState<string | null>
  editingFamiliaNome: string | null
  setEditingFamiliaNome: SetState<string | null>
  editFamiliaValue: string
  setEditFamiliaValue: SetState<string>
  novoGrupoPorFamilia: Record<string, string>
  setNovoGrupoPorFamilia: SetState<Record<string, string>>
  editingGrupoFamilia: string | null
  setEditingGrupoFamilia: SetState<string | null>
  editingGrupoNome: string | null
  setEditingGrupoNome: SetState<string | null>
  editGrupoValue: string
  setEditGrupoValue: SetState<string>
}

export function FamiliasGruposEquipamentosContent(props: FamiliasGruposEquipamentosContentProps) {
  const {
    safeT,
    LogoComponent,
    closeTab,
    activeTabId,
    voltarPaginaInicial,
    saveData,
    familiasEquipamento,
    setFamiliasEquipamento,
    gruposEquipamento,
    setGruposEquipamento,
    novaFamiliaEquipamento,
    setNovaFamiliaEquipamento,
    selectedFamiliaForGrupos,
    setSelectedFamiliaForGrupos,
    editingFamiliaNome,
    setEditingFamiliaNome,
    editFamiliaValue,
    setEditFamiliaValue,
    novoGrupoPorFamilia,
    setNovoGrupoPorFamilia,
    editingGrupoFamilia,
    setEditingGrupoFamilia,
    editingGrupoNome,
    setEditingGrupoNome,
    editGrupoValue,
    setEditGrupoValue,
  } = props

  const [navSearch, setNavSearch] = useState('')
  const tr = (key: string, fallback: string) => safeT[key] || fallback
  const navQuery = navSearch.trim().toLowerCase()

  const familiasList = useMemo(
    () => [...familiasEquipamento].sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' })),
    [familiasEquipamento]
  )

  const filteredFamilias = useMemo(() => {
    if (!navQuery) return familiasList
    return familiasList.filter((familia) => {
      if (familia.toLowerCase().includes(navQuery)) return true
      return gruposEquipamento.some(
        (g) => g.familia === familia && g.nome.toLowerCase().includes(navQuery)
      )
    })
  }, [familiasList, navQuery, gruposEquipamento])

  const gruposDestaFamilia = useMemo(() => {
    if (!selectedFamiliaForGrupos) return [] as GrupoEquipamento[]
    return gruposEquipamento
      .filter((g) => g.familia === selectedFamiliaForGrupos)
      .sort((a, b) => a.nome.localeCompare(b.nome, undefined, { sensitivity: 'base' }))
  }, [gruposEquipamento, selectedFamiliaForGrupos])

  const persistEquipamentoFg = (familias: string[], grupos: GrupoEquipamento[]) => {
    saveData('nonato-familias-grupos-equipamento', { familias, grupos })
  }

  const handleAddFamilia = () => {
    const nome = novaFamiliaEquipamento.trim()
    if (!nome || familiasList.includes(nome)) return
    const next = [...familiasEquipamento, nome].sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }))
    setFamiliasEquipamento(next)
    setNovaFamiliaEquipamento('')
    setSelectedFamiliaForGrupos(nome)
    persistEquipamentoFg(next, gruposEquipamento)
  }

  const handleSaveFamiliaEdit = (oldNome: string) => {
    const nome = editFamiliaValue.trim()
    if (!nome || (nome !== oldNome && familiasList.includes(nome))) return
    const nextFam = familiasEquipamento.map((x) => (x === oldNome ? nome : x)).sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }))
    const nextGr = gruposEquipamento.map((g) => (g.familia === oldNome ? { ...g, familia: nome } : g))
    setFamiliasEquipamento(nextFam)
    setGruposEquipamento(nextGr)
    if (selectedFamiliaForGrupos === oldNome) setSelectedFamiliaForGrupos(nome)
    persistEquipamentoFg(nextFam, nextGr)
    setEditingFamiliaNome(null)
  }

  const handleDeleteFamilia = (familia: string) => {
    if (!window.confirm(tr('manuaisConfirmarExcluirFamilia', `Excluir a familia "${familia}"?`))) return
    const nextFam = familiasEquipamento.filter((x) => x !== familia)
    setFamiliasEquipamento(nextFam)
    if (selectedFamiliaForGrupos === familia) setSelectedFamiliaForGrupos(null)
    setEditingFamiliaNome(null)
    persistEquipamentoFg(nextFam, gruposEquipamento)
  }

  const handleAddGrupo = () => {
    if (!selectedFamiliaForGrupos) return
    const nomeFamilia = selectedFamiliaForGrupos
    const nome = (novoGrupoPorFamilia[nomeFamilia] ?? '').trim()
    if (!nome || gruposDestaFamilia.some((g) => g.nome === nome)) return
    const next = [...gruposEquipamento, { numeroGrupo: '', nome, familia: nomeFamilia, numerosGrupo: [] }]
    setGruposEquipamento(next)
    setNovoGrupoPorFamilia((prev) => ({ ...prev, [nomeFamilia]: '' }))
    persistEquipamentoFg(familiasEquipamento, next)
  }

  const breadcrumb = selectedFamiliaForGrupos || tr('selecioneFamiliaEsquerda', 'Selecione uma familia')

  return (
    <div className="fg-checklist-pro">
      <section className="fg-checklist-pro__hero">
        <div className="fg-checklist-pro__hero-glow" aria-hidden />
        <div className="fg-checklist-pro__hero-top">
          <div className="fg-checklist-pro__hero-brand">
            <span className="fg-checklist-pro__hero-icon" aria-hidden>
              EQ
            </span>
            <div>
              <p className="fg-checklist-pro__eyebrow">{tr('equipamentosSubtitle', 'Gestao industrial')}</p>
              <h1 className="fg-checklist-pro__title">
                {tr('familiasGruposEquipamentosTitle', 'Cadastro de Familias e Grupos para os Equipamentos')}
              </h1>
              <p className="fg-checklist-pro__lead">
                {(safeT as Record<string, string>).familiasGruposEquipamentosHubCardDesc ||
                  tr('familiasGruposDesc', 'Organize familias e grupos usados no cadastro de equipamentos.')}
              </p>
            </div>
          </div>
          <div className="fg-checklist-pro__hero-actions">
            <LogoComponent size="small" />
            <button type="button" className="fg-checklist-pro__tool-btn" onClick={() => closeTab(activeTabId || '')} title={tr('voltar', 'Voltar')}>
              &larr;
            </button>
            <button type="button" className="fg-checklist-pro__tool-btn fg-checklist-pro__tool-btn--accent" onClick={voltarPaginaInicial} title={tr('paginaInicial', 'Pagina Inicial')}>
              Home
            </button>
          </div>
        </div>
        <div className="fg-checklist-pro__kpis fg-checklist-pro__kpis--compact">
          <div className="fg-checklist-pro__kpi">
            <span>{tr('familia', 'Familias')}</span>
            <strong>{familiasList.length}</strong>
          </div>
          <div className="fg-checklist-pro__kpi">
            <span>{tr('grupos', 'Grupos')}</span>
            <strong>{gruposEquipamento.length}</strong>
          </div>
        </div>
      </section>

      <div className="fg-checklist-pro__layout">
        <aside className="fg-checklist-pro__sidebar">
          <div className="fg-checklist-pro__sidebar-head">
            <h2 className="fg-checklist-pro__sidebar-title">{tr('estrutura', 'Estrutura')}</h2>
            <input
              type="search"
              className="fg-checklist-pro__search"
              value={navSearch}
              onChange={(e) => setNavSearch(e.target.value)}
              placeholder={tr('pesquisarFamiliaGrupo', 'Pesquisar familia ou grupo...')}
            />
          </div>

          <div className="fg-checklist-pro__quick-add">
            <label className="fg-checklist-pro__label">{tr('novaFamilia', 'Nova familia')}</label>
            <div className="fg-checklist-pro__quick-row">
              <input
                type="text"
                className="fg-checklist-pro__input"
                value={novaFamiliaEquipamento}
                onChange={(e) => setNovaFamiliaEquipamento(e.target.value)}
                placeholder={tr('novaFamilia', 'Nome da nova familia...')}
                onKeyDown={(e) => e.key === 'Enter' && handleAddFamilia()}
              />
              <button type="button" className="fg-checklist-pro__btn fg-checklist-pro__btn--primary" onClick={handleAddFamilia}>
                +
              </button>
            </div>
          </div>

          <div className="fg-checklist-pro__tree">
            {filteredFamilias.length === 0 ? (
              <p className="fg-checklist-pro__empty-hint">{tr('nenhumaFamilia', 'Nenhuma familia. Crie uma acima.')}</p>
            ) : (
              filteredFamilias.map((familia) => {
                const gruposCount = gruposEquipamento.filter((g) => g.familia === familia).length
                const isActive = selectedFamiliaForGrupos === familia
                return (
                  <div key={familia} className="fg-checklist-pro__tree-block">
                    <div className={`fg-checklist-pro__row fg-checklist-pro__row--familia ${isActive ? 'is-active' : ''}`}>
                      {editingFamiliaNome === familia ? (
                        <>
                          <input
                            className="fg-checklist-pro__inline-input"
                            value={editFamiliaValue}
                            onChange={(e) => setEditFamiliaValue(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleSaveFamiliaEdit(familia)
                              if (e.key === 'Escape') setEditingFamiliaNome(null)
                            }}
                            autoFocus
                          />
                          <button type="button" className="fg-checklist-pro__act" onClick={() => handleSaveFamiliaEdit(familia)}>
                            OK
                          </button>
                        </>
                      ) : (
                        <>
                          <button type="button" className="fg-checklist-pro__row-label" onClick={() => setSelectedFamiliaForGrupos(familia)}>
                            <span className="fg-checklist-pro__row-name">{familia}</span>
                            <span className="fg-checklist-pro__row-meta">{gruposCount}</span>
                          </button>
                          <FgRowActions
                            onEdit={(ev) => {
                              ev.stopPropagation()
                              setEditingFamiliaNome(familia)
                              setEditFamiliaValue(familia)
                            }}
                            onDelete={(ev) => {
                              ev.stopPropagation()
                              handleDeleteFamilia(familia)
                            }}
                            editTitle={tr('edit', 'Editar')}
                            deleteTitle={tr('delete', 'Excluir')}
                          />
                        </>
                      )}
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </aside>

        <main className="fg-checklist-pro__main">
          <header className="fg-checklist-pro__main-head">
            <div>
              <p className="fg-checklist-pro__breadcrumb-label">{tr('gruposPorFamilia', 'Grupos da familia')}</p>
              <p className="fg-checklist-pro__breadcrumb">{breadcrumb}</p>
            </div>
          </header>

          {!selectedFamiliaForGrupos ? (
            <div className="fg-checklist-pro__placeholder">
              <div className="fg-checklist-pro__placeholder-icon">EQ</div>
              <h3>{tr('gruposPorFamilia', 'Grupos da familia')}</h3>
              <p>
                {familiasList.length === 0
                  ? tr('cadastreFamiliaPrimeiro', 'Adicione uma familia na estrutura a esquerda.')
                  : tr('selecioneFamiliaEsquerda', 'Selecione uma familia para ver e gerir os grupos.')}
              </p>
            </div>
          ) : (
            <div className="fg-checklist-pro__panels">
              <section className="fg-checklist-pro__panel fg-checklist-pro__panel--full">
                <h3 className="fg-checklist-pro__panel-title">{tr('addGrupo', 'Adicionar grupo')}</h3>
                <div className="fg-checklist-pro__form-grid fg-checklist-pro__form-grid--single">
                  <div className="fg-checklist-pro__field fg-checklist-pro__field--grow">
                    <label>{tr('nomeDoGrupo', 'Nome do grupo')}</label>
                    <input
                      type="text"
                      className="fg-checklist-pro__input"
                      value={novoGrupoPorFamilia[selectedFamiliaForGrupos] ?? ''}
                      onChange={(e) => setNovoGrupoPorFamilia((prev) => ({ ...prev, [selectedFamiliaForGrupos]: e.target.value }))}
                      placeholder={tr('novoGrupoNestaFamilia', 'Nome do novo grupo...')}
                      onKeyDown={(e) => e.key === 'Enter' && handleAddGrupo()}
                    />
                  </div>
                  <button type="button" className="fg-checklist-pro__btn-add" onClick={handleAddGrupo}>
                    + {tr('addGrupo', 'Adicionar grupo')}
                  </button>
                </div>
              </section>

              <section className="fg-checklist-pro__panel fg-checklist-pro__panel--full">
                <h3 className="fg-checklist-pro__panel-title">
                  {tr('gruposDe', 'Grupos de')} {selectedFamiliaForGrupos}
                  <span className="fg-checklist-pro__panel-count">{gruposDestaFamilia.length}</span>
                </h3>
                {gruposDestaFamilia.length === 0 ? (
                  <p className="fg-checklist-pro__empty-hint">{tr('nenhumGrupoNestaFamilia', 'Nenhum grupo. Use o formulario acima.')}</p>
                ) : (
                  <div className="fg-checklist-pro__grupo-list">
                    {gruposDestaFamilia.map((g, idx) => {
                      const isEditing =
                        editingGrupoFamilia === selectedFamiliaForGrupos && editingGrupoNome === g.nome
                      return (
                        <div key={`${g.familia}-${g.nome}-${idx}`} className="fg-checklist-pro__grupo-card fg-checklist-pro__grupo-card--equip">
                          <span className="fg-checklist-pro__grupo-index">{idx + 1}</span>
                          {isEditing ? (
                            <div className="fg-checklist-pro__grupo-edit fg-checklist-pro__grupo-edit--full">
                              <input
                                className="fg-checklist-pro__input"
                                value={editGrupoValue}
                                onChange={(e) => setEditGrupoValue(e.target.value)}
                                autoFocus
                              />
                              <button
                                type="button"
                                className="fg-checklist-pro__act"
                                onClick={() => {
                                  const nome = editGrupoValue.trim()
                                  if (!nome || gruposDestaFamilia.some((x) => x.nome === nome && x.nome !== g.nome)) return
                                  const next = gruposEquipamento.map((gr) =>
                                    gr.familia === selectedFamiliaForGrupos && gr.nome === g.nome ? { ...gr, nome } : gr
                                  )
                                  setGruposEquipamento(next)
                                  persistEquipamentoFg(familiasEquipamento, next)
                                  setEditingGrupoFamilia(null)
                                  setEditingGrupoNome(null)
                                }}
                              >
                                OK
                              </button>
                              <button
                                type="button"
                                className="fg-checklist-pro__act fg-checklist-pro__act--muted"
                                onClick={() => {
                                  setEditingGrupoFamilia(null)
                                  setEditingGrupoNome(null)
                                  setEditGrupoValue('')
                                }}
                              >
                                {tr('cancel', 'Cancelar')}
                              </button>
                            </div>
                          ) : (
                            <>
                              <div className="fg-checklist-pro__grupo-info">
                                <strong>{g.nome}</strong>
                                {g.numeroGrupo && <small>{g.numeroGrupo}</small>}
                              </div>
                              <FgRowActions
                                onEdit={(ev) => {
                                  ev.stopPropagation()
                                  setEditingGrupoFamilia(selectedFamiliaForGrupos)
                                  setEditingGrupoNome(g.nome)
                                  setEditGrupoValue(g.nome)
                                }}
                                onDelete={(ev) => {
                                  ev.stopPropagation()
                                  const next = gruposEquipamento.filter(
                                    (gr) => !(gr.familia === selectedFamiliaForGrupos && gr.nome === g.nome)
                                  )
                                  setGruposEquipamento(next)
                                  persistEquipamentoFg(familiasEquipamento, next)
                                  if (editingGrupoFamilia === selectedFamiliaForGrupos && editingGrupoNome === g.nome) {
                                    setEditingGrupoFamilia(null)
                                    setEditingGrupoNome(null)
                                  }
                                }}
                                editTitle={tr('edit', 'Editar')}
                                deleteTitle={tr('delete', 'Excluir')}
                              />
                            </>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </section>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
