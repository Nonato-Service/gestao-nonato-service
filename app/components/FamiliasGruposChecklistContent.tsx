'use client'

import React, { useMemo, useState } from 'react'
import { GrupoChecklist, ItemTrabalhoCriacao, ParenteChecklist } from '../lib/checklistTypes'
import { ProImageHoverPreview } from './ProImageHoverPreview'

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
      <button
        type="button"
        className="fg-checklist-pro__act"
        onClick={onEdit}
        title={editTitle}
        aria-label={editTitle}
      >
        <span aria-hidden>✎</span>
      </button>
      <button
        type="button"
        className="fg-checklist-pro__act fg-checklist-pro__act--danger"
        onClick={onDelete}
        title={deleteTitle}
        aria-label={deleteTitle}
      >
        <span aria-hidden>×</span>
      </button>
    </div>
  )
}

export type CriacaoChecklistItemForm = {
  tipo: string
  descricaoTrabalho: string
  necessitaPecas: boolean
  origemPecas?: 'biblioteca' | 'equipamentos-pdf' | 'codigo-manual'
  codigoPeca: string
  pecasManuais: Array<{ codigo: string; quantia: number }>
}

export type FamiliasGruposChecklistContentProps = {
  safeT: Record<string, string | undefined>
  LogoComponent: React.ComponentType<{ size?: 'small' | 'medium' | 'large' }>
  closeTab: (tabId: string) => void
  activeTabId: string | null
  voltarPaginaInicial: () => void
  saveData: (key: string, value: unknown) => void | Promise<void>
  familiasChecklist: string[]
  setFamiliasChecklist: SetState<string[]>
  gruposChecklist: GrupoChecklist[]
  setGruposChecklist: SetState<GrupoChecklist[]>
  parentesChecklist: ParenteChecklist[]
  setParentesChecklist: SetState<ParenteChecklist[]>
  novaFamiliaEquipamento: string
  setNovaFamiliaEquipamento: SetState<string>
  selectedFamiliaForGrupos: string | null
  setSelectedFamiliaForGrupos: SetState<string | null>
  familiaExpandidaChecklist: string | null
  setFamiliaExpandidaChecklist: SetState<string | null>
  editingFamiliaNome: string | null
  setEditingFamiliaNome: SetState<string | null>
  editFamiliaValue: string
  setEditFamiliaValue: SetState<string>
  novoParenteNomePorFamilia: Record<string, string>
  setNovoParenteNomePorFamilia: SetState<Record<string, string>>
  editingParenteId: string | null
  setEditingParenteId: SetState<string | null>
  editParenteNome: string
  setEditParenteNome: SetState<string>
  selectedParenteIdForPainelGrupos: string
  setSelectedParenteIdForPainelGrupos: SetState<string>
  selectedParenteIdForNovoGrupo: string
  setSelectedParenteIdForNovoGrupo: SetState<string>
  novoGrupoPorFamilia: Record<string, string>
  setNovoGrupoPorFamilia: SetState<Record<string, string>>
  novoNumeroGrupoPorFamilia: Record<string, string>
  setNovoNumeroGrupoPorFamilia: SetState<Record<string, string>>
  editingGrupoFamilia: string | null
  setEditingGrupoFamilia: SetState<string | null>
  editingGrupoNome: string | null
  setEditingGrupoNome: SetState<string | null>
  editGrupoValue: string
  setEditGrupoValue: SetState<string>
  editGrupoNumeroValue: string
  setEditGrupoNumeroValue: SetState<string>
  selectedFamiliaCriacaoChecklist: string
  setSelectedFamiliaCriacaoChecklist: SetState<string>
  selectedParenteIdCriacaoChecklist: string
  setSelectedParenteIdCriacaoChecklist: SetState<string>
  criacaoChecklistGrupoIdAddingItem: string | null
  setCriacaoChecklistGrupoIdAddingItem: SetState<string | null>
  criacaoChecklistEditingItemId: string | null
  setCriacaoChecklistEditingItemId: SetState<string | null>
  criacaoChecklistItemForm: CriacaoChecklistItemForm
  setCriacaoChecklistItemForm: SetState<CriacaoChecklistItemForm>
}

export function FamiliasGruposChecklistContent(props: FamiliasGruposChecklistContentProps) {
  const {
    safeT,
    LogoComponent,
    closeTab,
    activeTabId,
    voltarPaginaInicial,
    saveData,
    familiasChecklist,
    setFamiliasChecklist,
    gruposChecklist,
    setGruposChecklist,
    parentesChecklist,
    setParentesChecklist,
    novaFamiliaEquipamento,
    setNovaFamiliaEquipamento,
    selectedFamiliaForGrupos,
    setSelectedFamiliaForGrupos,
    familiaExpandidaChecklist,
    setFamiliaExpandidaChecklist,
    editingFamiliaNome,
    setEditingFamiliaNome,
    editFamiliaValue,
    setEditFamiliaValue,
    novoParenteNomePorFamilia,
    setNovoParenteNomePorFamilia,
    editingParenteId,
    setEditingParenteId,
    editParenteNome,
    setEditParenteNome,
    selectedParenteIdForPainelGrupos,
    setSelectedParenteIdForPainelGrupos,
    selectedParenteIdForNovoGrupo,
    setSelectedParenteIdForNovoGrupo,
    novoGrupoPorFamilia,
    setNovoGrupoPorFamilia,
    novoNumeroGrupoPorFamilia,
    setNovoNumeroGrupoPorFamilia,
    editingGrupoFamilia,
    setEditingGrupoFamilia,
    editingGrupoNome,
    setEditingGrupoNome,
    editGrupoValue,
    setEditGrupoValue,
    editGrupoNumeroValue,
    setEditGrupoNumeroValue,
    selectedFamiliaCriacaoChecklist,
    setSelectedFamiliaCriacaoChecklist,
    selectedParenteIdCriacaoChecklist,
    setSelectedParenteIdCriacaoChecklist,
    criacaoChecklistGrupoIdAddingItem,
    setCriacaoChecklistGrupoIdAddingItem,
    criacaoChecklistEditingItemId,
    setCriacaoChecklistEditingItemId,
    criacaoChecklistItemForm,
    setCriacaoChecklistItemForm,
  } = props

  const [navSearch, setNavSearch] = useState('')
  const tr = (key: string, fallback: string) => safeT[key] || fallback
  const navQuery = navSearch.trim().toLowerCase()

  const familiasList = useMemo(
    () =>
      Array.from(
        new Set([...familiasChecklist, ...gruposChecklist.map((g) => g.familia).filter((f) => f && f.trim())])
      ).sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' })),
    [familiasChecklist, gruposChecklist]
  )

  const filteredFamilias = useMemo(() => {
    if (!navQuery) return familiasList
    return familiasList.filter((familia) => {
      if (familia.toLowerCase().includes(navQuery)) return true
      const parentes = parentesChecklist.filter((p) => p.familia === familia)
      if (parentes.some((p) => p.nome.toLowerCase().includes(navQuery))) return true
      return gruposChecklist.some(
        (g) => g.familia === familia && (g.nomeGrupo.toLowerCase().includes(navQuery) || (g.numeroGrupo || '').toLowerCase().includes(navQuery))
      )
    })
  }, [familiasList, navQuery, parentesChecklist, gruposChecklist])

  const parentesCount = parentesChecklist.length
  const gruposCount = gruposChecklist.length
  const servicosCount = gruposChecklist.reduce((acc, g) => acc + (g.itensTrabalho?.length || 0), 0)

  const selectedParente = selectedParenteIdForPainelGrupos
    ? parentesChecklist.find((p) => p.id === selectedParenteIdForPainelGrupos) || null
    : null

  const gruposDestaFamilia = useMemo(() => {
    if (!selectedFamiliaForGrupos || !selectedParenteIdForPainelGrupos) return [] as GrupoChecklist[]
    return gruposChecklist
      .filter((g) => g.familia === selectedFamiliaForGrupos && g.parenteId === selectedParenteIdForPainelGrupos)
      .sort((a, b) => {
        const na = (a.numeroGrupo ?? '').trim() || a.nomeGrupo
        const nb = (b.numeroGrupo ?? '').trim() || b.nomeGrupo
        const cmp = na.localeCompare(nb, undefined, { sensitivity: 'base' })
        return cmp !== 0 ? cmp : a.nomeGrupo.localeCompare(b.nomeGrupo, undefined, { sensitivity: 'base' })
      })
  }, [gruposChecklist, selectedFamiliaForGrupos, selectedParenteIdForPainelGrupos])

  const selectParente = (familia: string, parenteId: string) => {
    setSelectedFamiliaForGrupos(familia)
    setSelectedParenteIdForPainelGrupos(parenteId)
    setSelectedParenteIdForNovoGrupo(parenteId)
    setSelectedFamiliaCriacaoChecklist(familia)
    setSelectedParenteIdCriacaoChecklist(parenteId)
    setFamiliaExpandidaChecklist(familia)
  }

  const handleAddFamilia = () => {
    const nome = novaFamiliaEquipamento.trim()
    if (!nome || familiasList.includes(nome)) return
    const next = [...familiasChecklist, nome].sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }))
    setFamiliasChecklist(next)
    setNovaFamiliaEquipamento('')
    setSelectedFamiliaForGrupos(nome)
    setFamiliaExpandidaChecklist(nome)
    saveData('nonato-familias-checklist', next)
  }

  const handleSaveFamiliaEdit = (oldNome: string) => {
    const nome = editFamiliaValue.trim()
    if (!nome || (nome !== oldNome && familiasList.includes(nome))) return
    if (familiasChecklist.includes(oldNome)) {
      const nextFam = familiasChecklist.map((x) => (x === oldNome ? nome : x)).sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }))
      setFamiliasChecklist(nextFam)
      saveData('nonato-familias-checklist', nextFam)
    }
    const nextGr = gruposChecklist.map((g) => (g.familia === oldNome ? { ...g, familia: nome } : g))
    const nextParentes = parentesChecklist.map((p) => (p.familia === oldNome ? { ...p, familia: nome } : p))
    setGruposChecklist(nextGr)
    setParentesChecklist(nextParentes)
    if (selectedFamiliaForGrupos === oldNome) setSelectedFamiliaForGrupos(nome)
    if (familiaExpandidaChecklist === oldNome) setFamiliaExpandidaChecklist(nome)
    if (selectedFamiliaCriacaoChecklist === oldNome) setSelectedFamiliaCriacaoChecklist(nome)
    saveData('nonato-grupos-checklist', nextGr)
    saveData('nonato-parentes-checklist', nextParentes)
    setEditingFamiliaNome(null)
  }

  const handleDeleteFamilia = (familia: string) => {
    if (!window.confirm(tr('manuaisConfirmarExcluirFamilia', `Excluir a familia "${familia}" e todos os parentes/grupos?`))) return
    const nextFam = familiasChecklist.filter((x) => x !== familia)
    const nextGr = gruposChecklist.filter((g) => g.familia !== familia)
    const nextParentes = parentesChecklist.filter((p) => p.familia !== familia)
    setFamiliasChecklist(nextFam)
    setGruposChecklist(nextGr)
    setParentesChecklist(nextParentes)
    if (selectedFamiliaForGrupos === familia) {
      setSelectedFamiliaForGrupos(null)
      setSelectedParenteIdForPainelGrupos('')
    }
    if (familiaExpandidaChecklist === familia) setFamiliaExpandidaChecklist(null)
    if (selectedFamiliaCriacaoChecklist === familia) {
      setSelectedFamiliaCriacaoChecklist('')
      setSelectedParenteIdCriacaoChecklist('')
    }
    setEditingFamiliaNome(null)
    saveData('nonato-familias-checklist', nextFam)
    saveData('nonato-grupos-checklist', nextGr)
    saveData('nonato-parentes-checklist', nextParentes)
  }

  const handleAddParente = (familia: string) => {
    const nome = (novoParenteNomePorFamilia[familia] ?? '').trim()
    const parentesDestaFamilia = parentesChecklist.filter((p) => p.familia === familia)
    if (!nome || parentesDestaFamilia.some((x) => x.nome === nome)) return
    const novo: ParenteChecklist = { id: Date.now().toString(), nome, familia, imagem: undefined }
    const next = [...parentesChecklist, novo]
    setParentesChecklist(next)
    setNovoParenteNomePorFamilia((prev) => ({ ...prev, [familia]: '' }))
    selectParente(familia, novo.id)
    saveData('nonato-parentes-checklist', next)
  }

  const handleAddGrupo = () => {
    if (!selectedFamiliaForGrupos || !selectedParenteIdForNovoGrupo) return
    const nomeFamilia = selectedFamiliaForGrupos
    const valorNovoNome = (novoGrupoPorFamilia[nomeFamilia] ?? '').trim()
    const valorNovoNumero = (novoNumeroGrupoPorFamilia[nomeFamilia] ?? '').trim()
    if (!valorNovoNome || gruposDestaFamilia.some((g) => g.nomeGrupo === valorNovoNome)) return
    const next = [
      ...gruposChecklist,
      {
        id: Date.now().toString(),
        numeroGrupo: valorNovoNumero,
        nomeGrupo: valorNovoNome,
        familia: nomeFamilia,
        parenteId: selectedParenteIdForNovoGrupo,
        tipo: 'basico' as const,
        imagem: undefined,
        manutencoes: [],
        dataCriacao: new Date().toISOString(),
      },
    ]
    setGruposChecklist(next)
    setNovoNumeroGrupoPorFamilia((prev) => ({ ...prev, [nomeFamilia]: '' }))
    setNovoGrupoPorFamilia((prev) => ({ ...prev, [nomeFamilia]: '' }))
    saveData('nonato-grupos-checklist', next)
  }

  const breadcrumb =
    selectedFamiliaForGrupos && selectedParente
      ? `${selectedFamiliaForGrupos} › ${selectedParente.nome}`
      : selectedFamiliaForGrupos || tr('selecioneFamiliaEsquerda', 'Selecione uma familia e um parente')

  const defaultItemForm = (): CriacaoChecklistItemForm => ({
    tipo: 'Manutencao',
    descricaoTrabalho: '',
    necessitaPecas: false,
    codigoPeca: '',
    pecasManuais: [],
  })

  return (
    <div className="fg-checklist-pro">
      <section className="fg-checklist-pro__hero">
        <div className="fg-checklist-pro__hero-glow" aria-hidden />
        <div className="fg-checklist-pro__hero-top">
          <div className="fg-checklist-pro__hero-brand">
            <span className="fg-checklist-pro__hero-icon" aria-hidden>
              CK
            </span>
            <div>
              <p className="fg-checklist-pro__eyebrow">{tr('checklistHubStep1', 'Gestao de checklist')}</p>
              <h1 className="fg-checklist-pro__title">{tr('familiasGruposTitle', 'Cadastro de Familias e Grupos para Checklist')}</h1>
              <p className="fg-checklist-pro__lead">
                {tr('familiasGruposDesc', 'Organize familias, parentes (modelos) e grupos de checklist de forma clara.')}
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
        <div className="fg-checklist-pro__kpis">
          <div className="fg-checklist-pro__kpi">
            <span>{tr('familia', 'Familias')}</span>
            <strong>{familiasList.length}</strong>
          </div>
          <div className="fg-checklist-pro__kpi">
            <span>{tr('parente', 'Parentes')}</span>
            <strong>{parentesCount}</strong>
          </div>
          <div className="fg-checklist-pro__kpi">
            <span>{tr('grupos', 'Grupos')}</span>
            <strong>{gruposCount}</strong>
          </div>
          <div className="fg-checklist-pro__kpi">
            <span>{tr('servicos', 'Servicos')}</span>
            <strong>{servicosCount}</strong>
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
              placeholder={tr('pesquisarFamiliaParente', 'Pesquisar familia, parente ou grupo...')}
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
              <button
                type="button"
                className="fg-checklist-pro__btn fg-checklist-pro__btn--primary"
                onClick={handleAddFamilia}
                title={tr('add', 'Adicionar')}
                aria-label={tr('add', 'Adicionar')}
              >
                <span aria-hidden>+</span>
              </button>
            </div>
          </div>

          <div className="fg-checklist-pro__tree">
            {filteredFamilias.length === 0 ? (
              <p className="fg-checklist-pro__empty-hint">{tr('nenhumaFamilia', 'Nenhuma familia. Crie uma acima.')}</p>
            ) : (
              filteredFamilias.map((familia) => {
                const parentesDestaFamilia = parentesChecklist.filter((p) => p.familia === familia)
                const gruposCountFam = gruposChecklist.filter((g) => g.familia === familia).length
                const famExpanded = familiaExpandidaChecklist === familia || selectedFamiliaForGrupos === familia
                const isFamActive = selectedFamiliaForGrupos === familia
                return (
                  <div key={familia} className="fg-checklist-pro__tree-block">
                    <div className={`fg-checklist-pro__row fg-checklist-pro__row--familia ${isFamActive ? 'is-active' : ''}`}>
                      <button
                        type="button"
                        className="fg-checklist-pro__expand"
                        onClick={() => setFamiliaExpandidaChecklist((prev) => (prev === familia ? null : familia))}
                        aria-expanded={famExpanded}
                      >
                        {famExpanded ? '▾' : '▸'}
                      </button>
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
                          <button
                            type="button"
                            className="fg-checklist-pro__row-label"
                            onClick={() => {
                              setSelectedFamiliaForGrupos(familia)
                              setFamiliaExpandidaChecklist(familia)
                              setSelectedParenteIdForPainelGrupos('')
                            }}
                          >
                            <span className="fg-checklist-pro__row-name">{familia}</span>
                            <span className="fg-checklist-pro__row-meta">{parentesDestaFamilia.length}P · {gruposCountFam}G</span>
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

                    {famExpanded && (
                      <div className="fg-checklist-pro__tree-nested">
                        {parentesDestaFamilia.map((p) => {
                          const isParenteActive = selectedParenteIdForPainelGrupos === p.id && selectedFamiliaForGrupos === familia
                          const gruposParente = gruposChecklist.filter((g) => g.parenteId === p.id).length
                          return (
                            <div key={p.id} className={`fg-checklist-pro__row fg-checklist-pro__row--parente ${isParenteActive ? 'is-active' : ''}`}>
                              {editingParenteId === p.id ? (
                                <>
                                  <input
                                    className="fg-checklist-pro__inline-input"
                                    value={editParenteNome}
                                    onChange={(e) => setEditParenteNome(e.target.value)}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') {
                                        const nome = editParenteNome.trim()
                                        if (nome) {
                                          const next = parentesChecklist.map((x) => (x.id === p.id ? { ...x, nome } : x))
                                          setParentesChecklist(next)
                                          saveData('nonato-parentes-checklist', next)
                                          setEditingParenteId(null)
                                        }
                                      }
                                      if (e.key === 'Escape') setEditingParenteId(null)
                                    }}
                                    autoFocus
                                  />
                                  <button
                                    type="button"
                                    className="fg-checklist-pro__act"
                                    onClick={() => {
                                      const nome = editParenteNome.trim()
                                      if (nome) {
                                        const next = parentesChecklist.map((x) => (x.id === p.id ? { ...x, nome } : x))
                                        setParentesChecklist(next)
                                        saveData('nonato-parentes-checklist', next)
                                        setEditingParenteId(null)
                                      }
                                    }}
                                  >
                                    OK
                                  </button>
                                </>
                              ) : (
                                <>
                                  <button type="button" className="fg-checklist-pro__row-label" onClick={() => selectParente(familia, p.id)}>
                                    <ProImageHoverPreview
                                      src={p.imagem}
                                      alt={p.nome}
                                      label={`${familia} › ${p.nome}`}
                                      thumbClassName="fg-checklist-pro__thumb"
                                    >
                                      {p.nome.charAt(0)}
                                    </ProImageHoverPreview>
                                    <span className="fg-checklist-pro__row-name">{p.nome}</span>
                                    <span className="fg-checklist-pro__row-meta">{gruposParente}</span>
                                  </button>
                                  <div className="fg-checklist-pro__row-tools">
                                    <label
                                      className="fg-checklist-pro__act fg-checklist-pro__act--img"
                                      title={tr('adicionarImagem', 'Imagem')}
                                      aria-label={tr('adicionarImagem', 'Imagem')}
                                    >
                                      <input
                                        type="file"
                                        accept="image/*"
                                        onChange={(ev) => {
                                          const file = ev.target.files?.[0]
                                          if (file) {
                                            const r = new FileReader()
                                            r.onload = () => {
                                              const next = parentesChecklist.map((x) =>
                                                x.id === p.id ? { ...x, imagem: r.result as string } : x
                                              )
                                              setParentesChecklist(next)
                                              saveData('nonato-parentes-checklist', next)
                                            }
                                            r.readAsDataURL(file)
                                          }
                                          ev.target.value = ''
                                        }}
                                      />
                                      <span aria-hidden>Img</span>
                                    </label>
                                    <FgRowActions
                                      onEdit={(ev) => {
                                        ev.stopPropagation()
                                        setEditingParenteId(p.id)
                                        setEditParenteNome(p.nome)
                                      }}
                                      onDelete={(ev) => {
                                        ev.stopPropagation()
                                        const next = parentesChecklist.filter((x) => x.id !== p.id)
                                        setParentesChecklist(next)
                                        saveData('nonato-parentes-checklist', next)
                                        if (selectedParenteIdForPainelGrupos === p.id) setSelectedParenteIdForPainelGrupos('')
                                      }}
                                      editTitle={tr('edit', 'Editar')}
                                      deleteTitle={tr('delete', 'Excluir')}
                                    />
                                  </div>
                                </>
                              )}
                            </div>
                          )
                        })}
                        <div className="fg-checklist-pro__quick-row fg-checklist-pro__quick-row--nested">
                          <input
                            type="text"
                            className="fg-checklist-pro__input"
                            value={novoParenteNomePorFamilia[familia] ?? ''}
                            onChange={(e) => setNovoParenteNomePorFamilia((prev) => ({ ...prev, [familia]: e.target.value }))}
                            placeholder={tr('nomeDoParente', 'Nome do parente...')}
                            onKeyDown={(e) => e.key === 'Enter' && handleAddParente(familia)}
                          />
                          <button
                            type="button"
                            className="fg-checklist-pro__btn fg-checklist-pro__btn--primary"
                            onClick={() => handleAddParente(familia)}
                            title={tr('add', 'Adicionar')}
                            aria-label={tr('add', 'Adicionar')}
                          >
                            <span aria-hidden>+</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })
            )}
          </div>
        </aside>

        <main className="fg-checklist-pro__main">
          <header className="fg-checklist-pro__main-head">
            <div>
              <p className="fg-checklist-pro__breadcrumb-label">{tr('gruposPorFamilia', 'Grupos do parente')}</p>
              <p className="fg-checklist-pro__breadcrumb">{breadcrumb}</p>
            </div>
          </header>

          {!selectedFamiliaForGrupos || !selectedParenteIdForPainelGrupos ? (
            <div className="fg-checklist-pro__placeholder">
              <div className="fg-checklist-pro__placeholder-icon">CK</div>
              <h3>{tr('gruposPorFamilia', 'Grupos da familia')}</h3>
              <p>
                {familiasList.length === 0
                  ? tr('cadastreFamiliaPrimeiro', 'Adicione uma familia na estrutura a esquerda.')
                  : tr('selecioneFamiliaEsquerda', 'Selecione uma familia e um parente para gerir grupos e servicos.')}
              </p>
            </div>
          ) : (
            <div className="fg-checklist-pro__panels">
              <section className="fg-checklist-pro__panel fg-checklist-pro__panel--full">
                <h3 className="fg-checklist-pro__panel-title">{tr('addGrupo', 'Adicionar grupo')}</h3>
                <div className="fg-checklist-pro__form-grid">
                  <div className="fg-checklist-pro__field">
                    <label>{tr('numeroGrupo', 'Numero do grupo')}</label>
                    <input
                      type="text"
                      className="fg-checklist-pro__input"
                      value={novoNumeroGrupoPorFamilia[selectedFamiliaForGrupos] ?? ''}
                      onChange={(e) =>
                        setNovoNumeroGrupoPorFamilia((prev) => ({ ...prev, [selectedFamiliaForGrupos]: e.target.value }))
                      }
                      placeholder={tr('numeroGrupoPlaceholder', 'Numero...')}
                      onKeyDown={(e) => e.key === 'Enter' && handleAddGrupo()}
                    />
                  </div>
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
                  {tr('gruposDe', 'Grupos de')} {selectedParente?.nome}
                  <span className="fg-checklist-pro__panel-count">{gruposDestaFamilia.length}</span>
                </h3>
                {gruposDestaFamilia.length === 0 ? (
                  <p className="fg-checklist-pro__empty-hint">{tr('nenhumGrupoNestaFamilia', 'Nenhum grupo. Use o formulario acima.')}</p>
                ) : (
                  <div className="fg-checklist-pro__grupo-list">
                    {gruposDestaFamilia.map((g, idx) => {
                      const isEditing = editingGrupoFamilia === selectedFamiliaForGrupos && editingGrupoNome === g.nomeGrupo
                      return (
                        <div key={g.id} className="fg-checklist-pro__grupo-card">
                          <span className="fg-checklist-pro__grupo-index">{idx + 1}</span>
                          <label className="fg-checklist-pro__grupo-img">
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(ev) => {
                                const file = ev.target.files?.[0]
                                if (file) {
                                  const r = new FileReader()
                                  r.onload = () => {
                                    const next = gruposChecklist.map((x) => (x.id === g.id ? { ...x, imagem: r.result as string } : x))
                                    setGruposChecklist(next)
                                    saveData('nonato-grupos-checklist', next)
                                  }
                                  r.readAsDataURL(file)
                                }
                                ev.target.value = ''
                              }}
                            />
                            <ProImageHoverPreview
                              src={g.imagem}
                              alt={g.nomeGrupo}
                              label={`${g.numeroGrupo ? `${g.numeroGrupo} — ` : ''}${g.nomeGrupo}`}
                              thumbClassName="fg-pro-preview__thumb fg-pro-preview__thumb--fill"
                            >
                              {(g.numeroGrupo || g.nomeGrupo || '?').charAt(0)}
                            </ProImageHoverPreview>
                          </label>
                          {isEditing ? (
                            <div className="fg-checklist-pro__grupo-edit">
                              <input
                                className="fg-checklist-pro__input"
                                value={editGrupoNumeroValue}
                                onChange={(e) => setEditGrupoNumeroValue(e.target.value)}
                                placeholder={tr('numeroGrupo', 'Numero')}
                              />
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
                                  if (!nome || gruposDestaFamilia.some((x) => x.nomeGrupo === nome && x.id !== g.id)) return
                                  const next = gruposChecklist.map((gr) =>
                                    gr.id === g.id ? { ...gr, numeroGrupo: editGrupoNumeroValue.trim(), nomeGrupo: nome } : gr
                                  )
                                  setGruposChecklist(next)
                                  saveData('nonato-grupos-checklist', next)
                                  setEditingGrupoFamilia(null)
                                  setEditingGrupoNome(null)
                                }}
                              >
                                OK
                              </button>
                            </div>
                          ) : (
                            <>
                              <div className="fg-checklist-pro__grupo-info">
                                <div className="fg-checklist-pro__grupo-titulo">
                                  {g.numeroGrupo?.trim() ? (
                                    <span className="fg-checklist-pro__grupo-num-badge" title={tr('numeroGrupo', 'Numero do grupo')}>
                                      {g.numeroGrupo.trim()}
                                    </span>
                                  ) : null}
                                  <strong className="fg-checklist-pro__grupo-nome">{g.nomeGrupo}</strong>
                                </div>
                                <small>{(g.itensTrabalho?.length || 0)} {tr('servicos', 'servicos')}</small>
                              </div>
                              <FgRowActions
                                onEdit={(ev) => {
                                  ev.stopPropagation()
                                  setEditingGrupoFamilia(selectedFamiliaForGrupos)
                                  setEditingGrupoNome(g.nomeGrupo)
                                  setEditGrupoValue(g.nomeGrupo)
                                  setEditGrupoNumeroValue((g.numeroGrupo ?? '').trim())
                                }}
                                onDelete={(ev) => {
                                  ev.stopPropagation()
                                  const next = gruposChecklist.filter((gr) => gr.id !== g.id)
                                  setGruposChecklist(next)
                                  saveData('nonato-grupos-checklist', next)
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

              <section className="fg-checklist-pro__panel fg-checklist-pro__panel--full fg-checklist-pro__panel--services">
                <h3 className="fg-checklist-pro__panel-title">{tr('criacaoChecklistPorGrupos', 'Servicos por grupo')}</h3>
                <p className="fg-checklist-pro__panel-desc">
                  {(safeT as Record<string, string>).criacaoChecklistPorGruposDesc ||
                    'Adicione servicos a cada grupo do parente selecionado.'}
                </p>
                {gruposDestaFamilia.length === 0 ? (
                  <p className="fg-checklist-pro__empty-hint">{tr('nenhumGrupoNesteParente', 'Cadastre grupos acima primeiro.')}</p>
                ) : (
                  <div className="fg-checklist-pro__servicos-stack">
                    {gruposDestaFamilia.map((gr) => {
                      const itens = gr.itensTrabalho || []
                      const isAdding = criacaoChecklistGrupoIdAddingItem === gr.id
                      const showForm =
                        isAdding || (criacaoChecklistEditingItemId && itens.some((i) => i.id === criacaoChecklistEditingItemId))
                      const cancelForm = () => {
                        setCriacaoChecklistGrupoIdAddingItem(null)
                        setCriacaoChecklistEditingItemId(null)
                        setCriacaoChecklistItemForm(defaultItemForm())
                      }
                      const saveItemTrabalho = () => {
                        const tipo = criacaoChecklistItemForm.tipo.trim() || tr('outro', 'Outro')
                        const descricaoTrabalho = criacaoChecklistItemForm.descricaoTrabalho.trim()
                        if (!descricaoTrabalho) return
                        const novoItem: ItemTrabalhoCriacao = {
                          id: criacaoChecklistEditingItemId || Date.now().toString(),
                          tipo,
                          descricaoTrabalho,
                          necessitaPecas: criacaoChecklistItemForm.necessitaPecas,
                          origemPecas: criacaoChecklistItemForm.necessitaPecas ? criacaoChecklistItemForm.origemPecas : undefined,
                          codigoPeca:
                            criacaoChecklistItemForm.necessitaPecas && criacaoChecklistItemForm.codigoPeca?.trim()
                              ? criacaoChecklistItemForm.codigoPeca.trim()
                              : undefined,
                          pecasManuais:
                            criacaoChecklistItemForm.necessitaPecas && criacaoChecklistItemForm.origemPecas === 'codigo-manual'
                              ? criacaoChecklistItemForm.pecasManuais.filter((p) => p.codigo.trim())
                              : undefined,
                          dataCriacao: new Date().toISOString(),
                        }
                        const nextGrupos = gruposChecklist.map((gItem) => {
                          if (gItem.id !== gr.id) return gItem
                          const lista = [...(gItem.itensTrabalho || [])]
                          const idx = lista.findIndex((i) => i.id === criacaoChecklistEditingItemId)
                          if (idx >= 0) lista[idx] = novoItem
                          else lista.push(novoItem)
                          return { ...gItem, itensTrabalho: lista }
                        })
                        setGruposChecklist(nextGrupos)
                        saveData('nonato-grupos-checklist', nextGrupos)
                        cancelForm()
                      }
                      return (
                        <article key={gr.id} className="fg-checklist-pro__servico-block">
                          <header className="fg-checklist-pro__servico-head">
                            <div className="fg-checklist-pro__grupo-titulo fg-checklist-pro__grupo-titulo--servico">
                              {gr.numeroGrupo?.trim() ? (
                                <span className="fg-checklist-pro__grupo-num-badge" title={tr('numeroGrupo', 'Numero do grupo')}>
                                  {gr.numeroGrupo.trim()}
                                </span>
                              ) : null}
                              <strong className="fg-checklist-pro__grupo-nome">{gr.nomeGrupo}</strong>
                            </div>
                            <button
                              type="button"
                              className="fg-checklist-pro__btn-add fg-checklist-pro__btn-add--sm"
                              onClick={() => {
                                if (isAdding) cancelForm()
                                else {
                                  setCriacaoChecklistGrupoIdAddingItem(gr.id)
                                  setCriacaoChecklistEditingItemId(null)
                                  setCriacaoChecklistItemForm(defaultItemForm())
                                }
                              }}
                            >
                              {tr('adicionarServicos', 'Adicionar servico')}
                            </button>
                          </header>
                          {itens.length > 0 && (
                            <div className="fg-checklist-pro__servico-grid">
                              {itens.map((item) => (
                                <div key={item.id} className="fg-checklist-pro__servico-card">
                                  <span className="fg-checklist-pro__servico-type">{item.tipo}</span>
                                  <p>{item.descricaoTrabalho}</p>
                                  <div className="fg-checklist-pro__servico-actions">
                                    <button
                                      type="button"
                                      className="fg-checklist-pro__act"
                                      title={tr('edit', 'Editar')}
                                      aria-label={tr('edit', 'Editar')}
                                      onClick={() => {
                                        setCriacaoChecklistEditingItemId(item.id)
                                        setCriacaoChecklistGrupoIdAddingItem(null)
                                        setCriacaoChecklistItemForm({
                                          tipo: item.tipo,
                                          descricaoTrabalho: item.descricaoTrabalho,
                                          necessitaPecas: item.necessitaPecas,
                                          origemPecas: item.origemPecas,
                                          codigoPeca: item.codigoPeca || '',
                                          pecasManuais: item.pecasManuais?.length ? item.pecasManuais : [{ codigo: '', quantia: 1 }],
                                        })
                                      }}
                                    >
                                      <span aria-hidden>✎</span>
                                    </button>
                                    <button
                                      type="button"
                                      className="fg-checklist-pro__act fg-checklist-pro__act--danger"
                                      title={tr('delete', 'Excluir')}
                                      aria-label={tr('delete', 'Excluir')}
                                      onClick={() => {
                                        const nextGrupos = gruposChecklist.map((gItem) => {
                                          if (gItem.id !== gr.id) return gItem
                                          return { ...gItem, itensTrabalho: (gItem.itensTrabalho || []).filter((i) => i.id !== item.id) }
                                        })
                                        setGruposChecklist(nextGrupos)
                                        saveData('nonato-grupos-checklist', nextGrupos)
                                        if (criacaoChecklistEditingItemId === item.id) cancelForm()
                                      }}
                                    >
                                      <span aria-hidden>×</span>
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                          {showForm && (
                            <div className="fg-checklist-pro__servico-form">
                              <input
                                type="text"
                                className="fg-checklist-pro__input"
                                value={criacaoChecklistItemForm.descricaoTrabalho}
                                onChange={(e) => setCriacaoChecklistItemForm((f) => ({ ...f, descricaoTrabalho: e.target.value }))}
                                placeholder={tr('qualTrabalho', 'Descricao do servico...')}
                                onKeyDown={(e) => e.key === 'Enter' && saveItemTrabalho()}
                              />
                              <button type="button" className="fg-checklist-pro__act" onClick={saveItemTrabalho}>
                                {criacaoChecklistEditingItemId ? tr('save', 'Salvar') : tr('add', 'Adicionar')}
                              </button>
                              <button type="button" className="fg-checklist-pro__act fg-checklist-pro__act--muted" onClick={cancelForm}>
                                {tr('cancel', 'Cancelar')}
                              </button>
                            </div>
                          )}
                        </article>
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
