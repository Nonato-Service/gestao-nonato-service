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

function GrupoTitulo(props: {
  numero?: string
  nome: string
  numeroTitle?: string
  className?: string
  layout?: 'inline' | 'stacked'
}) {
  const { numero, nome, numeroTitle, className, layout = 'inline' } = props
  const num = numero?.trim()
  return (
    <div
      className={`fg-checklist-pro__grupo-titulo${
        layout === 'stacked' ? ' fg-checklist-pro__grupo-titulo--stacked' : ''
      }${className ? ` ${className}` : ''}`}
    >
      {num ? (
        <span className="fg-checklist-pro__grupo-num-badge" title={numeroTitle}>
          {num}
        </span>
      ) : null}
      <strong className="fg-checklist-pro__grupo-nome">{nome}</strong>
    </div>
  )
}

function PanelHead(props: { step?: string; title: string; desc?: string; count?: number }) {
  const { step, title, desc, count } = props
  return (
    <header className="fg-checklist-pro__panel-head">
      {step ? (
        <span className="fg-checklist-pro__panel-step" aria-hidden>
          {step}
        </span>
      ) : null}
      <div className="fg-checklist-pro__panel-head-body">
        <h3 className="fg-checklist-pro__panel-title">
          {title}
          {count != null ? <span className="fg-checklist-pro__panel-count">{count}</span> : null}
        </h3>
        {desc ? <p className="fg-checklist-pro__panel-desc">{desc}</p> : null}
      </div>
    </header>
  )
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
  const [workTab, setWorkTab] = useState<'add' | 'groups' | 'services'>('groups')
  const [servicosScope, setServicosScope] = useState<'parente' | 'familia'>('parente')
  const [servicosGrupoFilterId, setServicosGrupoFilterId] = useState<string | null>(null)
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
      .sort(sortGrupoChecklist)
  }, [gruposChecklist, selectedFamiliaForGrupos, selectedParenteIdForPainelGrupos])

  const servicosParenteSelecionado = useMemo(
    () => gruposDestaFamilia.reduce((acc, g) => acc + (g.itensTrabalho?.length || 0), 0),
    [gruposDestaFamilia]
  )

  const sortGrupoChecklist = (a: GrupoChecklist, b: GrupoChecklist) => {
    const na = (a.numeroGrupo ?? '').trim() || a.nomeGrupo
    const nb = (b.numeroGrupo ?? '').trim() || b.nomeGrupo
    const cmp = na.localeCompare(nb, undefined, { sensitivity: 'base' })
    return cmp !== 0 ? cmp : a.nomeGrupo.localeCompare(b.nomeGrupo, undefined, { sensitivity: 'base' })
  }

  const parentesDestaFamiliaSelecionada = useMemo(
    () =>
      selectedFamiliaForGrupos
        ? parentesChecklist
            .filter((p) => p.familia === selectedFamiliaForGrupos)
            .sort((a, b) => a.nome.localeCompare(b.nome, undefined, { sensitivity: 'base' }))
        : [],
    [parentesChecklist, selectedFamiliaForGrupos]
  )

  const gruposTodaFamilia = useMemo(() => {
    if (!selectedFamiliaForGrupos) return [] as GrupoChecklist[]
    const lista = gruposChecklist.filter((g) => g.familia === selectedFamiliaForGrupos)
    return [...lista].sort((a, b) => {
      const pa = parentesChecklist.find((p) => p.id === a.parenteId)?.nome ?? ''
      const pb = parentesChecklist.find((p) => p.id === b.parenteId)?.nome ?? ''
      const cmpP = pa.localeCompare(pb, undefined, { sensitivity: 'base' })
      if (cmpP !== 0) return cmpP
      const na = (a.numeroGrupo ?? '').trim() || a.nomeGrupo
      const nb = (b.numeroGrupo ?? '').trim() || b.nomeGrupo
      const cmp = na.localeCompare(nb, undefined, { sensitivity: 'base' })
      return cmp !== 0 ? cmp : a.nomeGrupo.localeCompare(b.nomeGrupo, undefined, { sensitivity: 'base' })
    })
  }, [gruposChecklist, selectedFamiliaForGrupos, parentesChecklist])

  const gruposBaseServicos = servicosScope === 'familia' ? gruposTodaFamilia : gruposDestaFamilia

  const gruposParaServicos = useMemo(() => {
    if (!servicosGrupoFilterId) return gruposBaseServicos
    return gruposBaseServicos.filter((g) => g.id === servicosGrupoFilterId)
  }, [gruposBaseServicos, servicosGrupoFilterId])

  const servicosTodaFamilia = useMemo(
    () => gruposTodaFamilia.reduce((acc, g) => acc + (g.itensTrabalho?.length || 0), 0),
    [gruposTodaFamilia]
  )

  const servicosVisiveisCount = useMemo(
    () => gruposParaServicos.reduce((acc, g) => acc + (g.itensTrabalho?.length || 0), 0),
    [gruposParaServicos]
  )

  const servicosTabCount = servicosScope === 'familia' ? servicosTodaFamilia : servicosParenteSelecionado

  const parenteNomeById = (parenteId?: string) =>
    parenteId ? parentesChecklist.find((p) => p.id === parenteId)?.nome ?? '' : ''

  const openServicosView = (opts?: { scope?: 'parente' | 'familia'; grupoId?: string | null }) => {
    if (opts?.scope) setServicosScope(opts.scope)
    if (opts?.grupoId !== undefined) setServicosGrupoFilterId(opts.grupoId)
    else if (opts?.scope) setServicosGrupoFilterId(null)
    setWorkTab('services')
  }

  const grupoOptionLabel = (g: GrupoChecklist) => {
    const base = `${g.numeroGrupo ? `${g.numeroGrupo} — ` : ''}${g.nomeGrupo}`
    if (servicosScope !== 'familia') return base
    const pn = parenteNomeById(g.parenteId)
    return pn ? `${base} (${pn})` : base
  }

  const selectParente = (familia: string, parenteId: string) => {
    setSelectedFamiliaForGrupos(familia)
    setSelectedParenteIdForPainelGrupos(parenteId)
    setSelectedParenteIdForNovoGrupo(parenteId)
    setSelectedFamiliaCriacaoChecklist(familia)
    setSelectedParenteIdCriacaoChecklist(parenteId)
    setFamiliaExpandidaChecklist(familia)
    setWorkTab('groups')
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
    setWorkTab('groups')
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

  const renderServicoGrupoBlock = (gr: GrupoChecklist) => {
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
      <article key={gr.id} className="fg-ck-shell__serv-block">
        <header className="fg-ck-shell__serv-head">
          <GrupoTitulo
            numero={gr.numeroGrupo}
            nome={gr.nomeGrupo}
            numeroTitle={tr('numeroGrupo', 'Numero do grupo')}
            className="fg-ck-shell__grupo-titulo"
          />
          <span className="fg-ck-shell__pill">
            {itens.length} {tr('servicos', 'servicos')}
          </span>
          <button
            type="button"
            className="fg-ck-shell__btn fg-ck-shell__btn--sm"
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
          <div className="fg-ck-shell__serv-grid">
            {itens.map((item) => (
              <div key={item.id} className="fg-ck-shell__serv-card">
                <span className="fg-ck-shell__serv-type">{item.tipo}</span>
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
          <div className="fg-ck-shell__serv-form">
            <input
              type="text"
              className="fg-ck-shell__input"
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
  }

  const progressStep =
    !selectedFamiliaForGrupos ? 1 : !selectedParenteIdForPainelGrupos ? 2 : workTab === 'services' ? 4 : 3

  const progressSteps = [
    { n: 1, label: tr('familia', 'Familia') },
    { n: 2, label: tr('parente', 'Parente') },
    { n: 3, label: tr('grupos', 'Grupos') },
    { n: 4, label: tr('servicos', 'Servicos') },
  ]

  return (
    <div className="fg-checklist-pro fg-checklist-pro--reforma">
      <header className="fg-ck-shell__topbar">
        <div className="fg-ck-shell__topbar-main">
          <p className="fg-ck-shell__eyebrow">{tr('checklistHubStep1', 'Gestao de checklist')}</p>
          <h1 className="fg-ck-shell__title">{tr('familiasGruposTitle', 'Cadastro de Familias e Grupos para Checklist')}</h1>
          <p className="fg-ck-shell__subtitle">
            {tr('familiasGruposDesc', 'Organize familias, parentes (modelos) e grupos de checklist de forma clara.')}
          </p>
        </div>
        <div className="fg-ck-shell__topbar-kpis">
          <div className="fg-ck-shell__kpi">
            <span>{tr('familia', 'Familias')}</span>
            <strong>{familiasList.length}</strong>
          </div>
          <div className="fg-ck-shell__kpi">
            <span>{tr('parente', 'Parentes')}</span>
            <strong>{parentesCount}</strong>
          </div>
          <div className="fg-ck-shell__kpi">
            <span>{tr('grupos', 'Grupos')}</span>
            <strong>{gruposCount}</strong>
          </div>
          <div className="fg-ck-shell__kpi">
            <span>{tr('servicos', 'Servicos')}</span>
            <strong>{servicosCount}</strong>
          </div>
        </div>
        <div className="fg-ck-shell__topbar-actions">
          <LogoComponent size="small" />
          <button type="button" className="fg-ck-shell__tool-btn" onClick={() => closeTab(activeTabId || '')} title={tr('voltar', 'Voltar')}>
            &larr; {tr('voltar', 'Voltar')}
          </button>
          <button type="button" className="fg-ck-shell__tool-btn fg-ck-shell__tool-btn--accent" onClick={voltarPaginaInicial} title={tr('paginaInicial', 'Pagina Inicial')}>
            {tr('paginaInicial', 'Pagina Inicial')}
          </button>
        </div>
      </header>

      <nav className="fg-ck-shell__progress" aria-label={tr('fgChecklistFluxoAria', 'Fluxo de cadastro')}>
        {progressSteps.map((s, i) => (
          <React.Fragment key={s.n}>
            <div
              className={`fg-ck-shell__progress-step${
                progressStep === s.n ? ' is-current' : progressStep > s.n ? ' is-done' : ''
              }`}
            >
              <span className="fg-ck-shell__progress-num">{s.n}</span>
              <span className="fg-ck-shell__progress-label">{s.label}</span>
            </div>
            {i < progressSteps.length - 1 ? <span className="fg-ck-shell__progress-line" aria-hidden /> : null}
          </React.Fragment>
        ))}
      </nav>

      <div className="fg-ck-shell__workspace">
        <aside className="fg-ck-shell__nav">
          <div className="fg-ck-shell__nav-head">
            <span className="fg-ck-shell__nav-badge">1–2</span>
            <h2 className="fg-ck-shell__nav-title">{tr('estrutura', 'Estrutura')}</h2>
            <p className="fg-ck-shell__nav-hint">
              {tr('fgChecklistSidebarHint', 'Familia → parente (modelo). Selecione um parente para gerir grupos a direita.')}
            </p>
            <input
              type="search"
              className="fg-ck-shell__search"
              value={navSearch}
              onChange={(e) => setNavSearch(e.target.value)}
              placeholder={tr('pesquisarFamiliaParente', 'Pesquisar familia, parente ou grupo...')}
            />
          </div>

          <div className="fg-ck-shell__nav-add">
            <label className="fg-ck-shell__field-label">{tr('novaFamilia', 'Nova familia')}</label>
            <div className="fg-ck-shell__field-row">
              <input
                type="text"
                className="fg-ck-shell__input"
                value={novaFamiliaEquipamento}
                onChange={(e) => setNovaFamiliaEquipamento(e.target.value)}
                placeholder={tr('novaFamilia', 'Nome da nova familia...')}
                onKeyDown={(e) => e.key === 'Enter' && handleAddFamilia()}
              />
              <button
                type="button"
                className="fg-ck-shell__btn fg-ck-shell__btn--icon"
                onClick={handleAddFamilia}
                title={tr('add', 'Adicionar')}
                aria-label={tr('add', 'Adicionar')}
              >
                +
              </button>
            </div>
          </div>

          <div className="fg-ck-shell__tree">
            {filteredFamilias.length === 0 ? (
              <p className="fg-ck-shell__empty-tree">{tr('nenhumaFamilia', 'Nenhuma familia. Crie uma acima.')}</p>
            ) : (
              filteredFamilias.map((familia) => {
                const parentesDestaFamilia = parentesChecklist.filter((p) => p.familia === familia)
                const gruposCountFam = gruposChecklist.filter((g) => g.familia === familia).length
                const famExpanded = familiaExpandidaChecklist === familia || selectedFamiliaForGrupos === familia
                const isFamActive = selectedFamiliaForGrupos === familia
                return (
                  <div key={familia} className="fg-ck-shell__fam-block">
                    <div className={`fg-ck-shell__fam-card fg-checklist-pro__row fg-checklist-pro__row--familia ${isFamActive ? 'is-active' : ''}`}>
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
                      <div className="fg-ck-shell__parent-list fg-checklist-pro__tree-nested">
                        {parentesDestaFamilia.map((p) => {
                          const isParenteActive = selectedParenteIdForPainelGrupos === p.id && selectedFamiliaForGrupos === familia
                          const gruposParente = gruposChecklist.filter((g) => g.parenteId === p.id).length
                          return (
                            <div key={p.id} className={`fg-ck-shell__parent-card fg-checklist-pro__row fg-checklist-pro__row--parente ${isParenteActive ? 'is-active' : ''}`}>
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
                        <div className="fg-ck-shell__field-row fg-ck-shell__field-row--nested">
                          <input
                            type="text"
                            className="fg-ck-shell__input"
                            value={novoParenteNomePorFamilia[familia] ?? ''}
                            onChange={(e) => setNovoParenteNomePorFamilia((prev) => ({ ...prev, [familia]: e.target.value }))}
                            placeholder={tr('nomeDoParente', 'Nome do parente...')}
                            onKeyDown={(e) => e.key === 'Enter' && handleAddParente(familia)}
                          />
                          <button
                            type="button"
                            className="fg-ck-shell__btn fg-ck-shell__btn--icon"
                            onClick={() => handleAddParente(familia)}
                            title={tr('add', 'Adicionar')}
                            aria-label={tr('add', 'Adicionar')}
                          >
                            +
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

        <section className="fg-ck-shell__panel">
          {!selectedFamiliaForGrupos || !selectedParenteIdForPainelGrupos ? (
            <div className="fg-ck-shell__empty">
              <div className="fg-ck-shell__empty-icon">3–4</div>
              <h2>{tr('gruposPorFamilia', 'Grupos e servicos')}</h2>
              <p>
                {familiasList.length === 0
                  ? tr('cadastreFamiliaPrimeiro', 'Adicione uma familia na estrutura a esquerda.')
                  : tr('selecioneFamiliaEsquerda', 'Selecione uma familia e um parente para gerir grupos e servicos.')}
              </p>
              <div className="fg-ck-shell__empty-steps">
                {progressSteps.map((s) => (
                  <div key={s.n} className={`fg-ck-shell__empty-step${progressStep >= s.n ? ' is-active' : ''}`}>
                    <span className="fg-ck-shell__empty-step-num">{s.n}</span>
                    <span>{s.label}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <>
              <header className="fg-ck-shell__panel-head">
                <div>
                  <p className="fg-ck-shell__panel-label">{tr('gruposPorFamilia', 'Area de trabalho')}</p>
                  <h2 className="fg-ck-shell__panel-title">{breadcrumb}</h2>
                </div>
                <div className="fg-ck-shell__panel-stats">
                  <span><strong>{gruposDestaFamilia.length}</strong> {tr('grupos', 'grupos')}</span>
                  <span><strong>{servicosParenteSelecionado}</strong> {tr('servicos', 'servicos')}</span>
                </div>
              </header>

              <nav className="fg-ck-shell__tabs" role="tablist" aria-label={tr('fgChecklistSecNavAria', 'Secoes de trabalho')}>
                <button
                  type="button"
                  role="tab"
                  id="fg-ck-tab-add"
                  aria-selected={workTab === 'add'}
                  aria-controls="fg-ck-add"
                  className={`fg-ck-shell__tab${workTab === 'add' ? ' is-active' : ''}`}
                  onClick={() => setWorkTab('add')}
                >
                  {tr('addGrupo', 'Adicionar grupo')}
                </button>
                <button
                  type="button"
                  role="tab"
                  id="fg-ck-tab-list"
                  aria-selected={workTab === 'groups'}
                  aria-controls="fg-ck-list"
                  className={`fg-ck-shell__tab${workTab === 'groups' ? ' is-active' : ''}`}
                  onClick={() => setWorkTab('groups')}
                >
                  {tr('grupos', 'Grupos')} ({gruposDestaFamilia.length})
                </button>
                <button
                  type="button"
                  role="tab"
                  id="fg-ck-tab-serv"
                  aria-selected={workTab === 'services'}
                  aria-controls="fg-ck-serv"
                  className={`fg-ck-shell__tab${workTab === 'services' ? ' is-active' : ''}`}
                  onClick={() => setWorkTab('services')}
                >
                  {tr('servicos', 'Servicos')} ({servicosTabCount})
                </button>
              </nav>

            <div className="fg-ck-shell__body">
              {workTab === 'add' ? (
              <section
                id="fg-ck-add"
                role="tabpanel"
                aria-labelledby="fg-ck-tab-add"
                className="fg-ck-shell__section fg-ck-shell__section--form"
              >
                <PanelHead
                  title={tr('addGrupo', 'Adicionar grupo')}
                  desc={tr('fgChecklistAddGrupoDesc', 'Indique o numero (codigo) e o nome do grupo. Ambos aparecem destacados na lista.')}
                />
                <div className="fg-ck-shell__form">
                  <div className="fg-ck-shell__form-field fg-ck-shell__form-field--num">
                    <label className="fg-ck-shell__field-label">{tr('numeroGrupo', 'Numero do grupo')}</label>
                    <input
                      type="text"
                      className="fg-ck-shell__input"
                      value={novoNumeroGrupoPorFamilia[selectedFamiliaForGrupos] ?? ''}
                      onChange={(e) =>
                        setNovoNumeroGrupoPorFamilia((prev) => ({ ...prev, [selectedFamiliaForGrupos]: e.target.value }))
                      }
                      placeholder={tr('numeroGrupoPlaceholder', 'Numero...')}
                      onKeyDown={(e) => e.key === 'Enter' && handleAddGrupo()}
                    />
                  </div>
                  <div className="fg-ck-shell__form-field fg-ck-shell__form-field--grow">
                    <label className="fg-ck-shell__field-label">{tr('nomeDoGrupo', 'Nome do grupo')}</label>
                    <input
                      type="text"
                      className="fg-ck-shell__input"
                      value={novoGrupoPorFamilia[selectedFamiliaForGrupos] ?? ''}
                      onChange={(e) => setNovoGrupoPorFamilia((prev) => ({ ...prev, [selectedFamiliaForGrupos]: e.target.value }))}
                      placeholder={tr('novoGrupoNestaFamilia', 'Nome do novo grupo...')}
                      onKeyDown={(e) => e.key === 'Enter' && handleAddGrupo()}
                    />
                  </div>
                  <button type="button" className="fg-ck-shell__btn fg-ck-shell__btn--primary" onClick={handleAddGrupo}>
                    + {tr('addGrupo', 'Adicionar grupo')}
                  </button>
                </div>
              </section>
              ) : null}

              {workTab === 'groups' ? (
              <section
                id="fg-ck-list"
                role="tabpanel"
                aria-labelledby="fg-ck-tab-list"
                className="fg-ck-shell__section"
              >
                <PanelHead
                  title={`${tr('gruposDe', 'Grupos de')} ${selectedParente?.nome ?? ''}`}
                  desc={tr('fgChecklistListaGruposDesc', 'Lista de grupos do parente selecionado — número, nome, imagem e quantidade de serviços.')}
                  count={gruposDestaFamilia.length}
                />
                {gruposDestaFamilia.length === 0 ? (
                  <p className="fg-ck-shell__hint">{tr('nenhumGrupoNestaFamilia', 'Nenhum grupo. Use o formulario acima.')}</p>
                ) : (
                  <div className="fg-ck-shell__grupo-list">
                    {gruposDestaFamilia.map((g, idx) => {
                      const isEditing = editingGrupoFamilia === selectedFamiliaForGrupos && editingGrupoNome === g.nomeGrupo
                      const servicosGrupo = g.itensTrabalho?.length || 0
                      return (
                        <article key={g.id} className="fg-ck-shell__grupo-row">
                          <span className="fg-ck-shell__grupo-ordem" title={tr('ordem', 'Ordem')}>
                            {idx + 1}
                          </span>
                          <label className="fg-ck-shell__grupo-thumb" title={tr('adicionarImagem', 'Imagem')}>
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
                            <div className="fg-ck-shell__grupo-edit">
                              <input
                                className="fg-ck-shell__input fg-ck-shell__input--num"
                                value={editGrupoNumeroValue}
                                onChange={(e) => setEditGrupoNumeroValue(e.target.value)}
                                placeholder={tr('numeroGrupoShort', 'Nº')}
                              />
                              <input
                                className="fg-ck-shell__input"
                                value={editGrupoValue}
                                onChange={(e) => setEditGrupoValue(e.target.value)}
                                placeholder={tr('nomeDoGrupo', 'Nome do grupo')}
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
                              <GrupoTitulo
                                numero={g.numeroGrupo}
                                nome={g.nomeGrupo}
                                numeroTitle={tr('numeroGrupo', 'Numero do grupo')}
                                className="fg-ck-shell__grupo-titulo"
                              />
                              <span className="fg-ck-shell__pill">
                                {servicosGrupo} {tr('servicos', 'servicos')}
                              </span>
                              <button
                                type="button"
                                className="fg-ck-shell__btn fg-ck-shell__btn--sm fg-ck-shell__btn--ghost"
                                onClick={() => openServicosView({ scope: 'parente', grupoId: g.id })}
                              >
                                {tr('fgChecklistVerServicosGrupo', 'Servicos')}
                              </button>
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
                        </article>
                      )
                    })}
                  </div>
                )}
              </section>
              ) : null}

              {workTab === 'services' ? (
              <section
                id="fg-ck-serv"
                role="tabpanel"
                aria-labelledby="fg-ck-tab-serv"
                className="fg-ck-shell__section fg-ck-shell__section--services"
              >
                <PanelHead
                  title={tr('criacaoChecklistPorGrupos', 'Servicos por grupo')}
                  desc={
                    servicosScope === 'familia'
                      ? tr('fgChecklistServicosPorFamiliaDesc', 'Servicos de todos os grupos e parentes desta familia.')
                      : servicosGrupoFilterId
                        ? tr('fgChecklistServicosGrupoUnicoDesc', 'Servicos do grupo selecionado.')
                        : tr('fgChecklistServicosDesc', 'Adicione servicos a cada grupo do parente selecionado.')
                  }
                  count={servicosVisiveisCount}
                />

                <div className="fg-ck-shell__serv-toolbar">
                  <div className="fg-ck-shell__serv-scope" role="group" aria-label={tr('fgChecklistServicosScopeAria', 'Ver servicos por')}>
                    <button
                      type="button"
                      className={`fg-ck-shell__scope-btn${servicosScope === 'parente' ? ' is-active' : ''}`}
                      onClick={() => {
                        setServicosScope('parente')
                        setServicosGrupoFilterId(null)
                      }}
                    >
                      {tr('fgChecklistServicosScopeParente', 'Parente actual')}
                    </button>
                    <button
                      type="button"
                      className={`fg-ck-shell__scope-btn${servicosScope === 'familia' ? ' is-active' : ''}`}
                      onClick={() => {
                        setServicosScope('familia')
                        setServicosGrupoFilterId(null)
                      }}
                    >
                      {tr('fgChecklistServicosScopeFamilia', 'Toda a familia')}
                    </button>
                  </div>

                  {gruposBaseServicos.length > 0 ? (
                    <label className="fg-ck-shell__serv-filter">
                      <span className="fg-ck-shell__field-label">{tr('fgChecklistServicosFilterGrupo', 'Grupo')}</span>
                      <select
                        className="fg-ck-shell__select"
                        value={servicosGrupoFilterId ?? ''}
                        onChange={(e) => setServicosGrupoFilterId(e.target.value || null)}
                      >
                        <option value="">{tr('fgChecklistServicosTodosGrupos', 'Todos os grupos')}</option>
                        {gruposBaseServicos.map((g) => (
                          <option key={g.id} value={g.id}>
                            {grupoOptionLabel(g)}
                          </option>
                        ))}
                      </select>
                    </label>
                  ) : null}
                </div>

                {gruposBaseServicos.length === 0 ? (
                  <p className="fg-ck-shell__hint">
                    {servicosScope === 'familia'
                      ? tr('nenhumGrupoNestaFamilia', 'Nenhum grupo nesta familia.')
                      : tr('nenhumGrupoNesteParente', 'Cadastre grupos acima primeiro.')}
                  </p>
                ) : gruposParaServicos.length === 0 ? (
                  <p className="fg-ck-shell__hint">{tr('fgChecklistServicosGrupoNaoEncontrado', 'Grupo nao encontrado neste ambito.')}</p>
                ) : (
                  <div className="fg-ck-shell__serv-list">
                    {servicosScope === 'familia' && !servicosGrupoFilterId
                      ? parentesDestaFamiliaSelecionada.map((parente) => {
                          const gruposParente = gruposParaServicos.filter((g) => g.parenteId === parente.id)
                          if (gruposParente.length === 0) return null
                          return (
                            <div key={parente.id} className="fg-ck-shell__serv-parente-block">
                              <header className="fg-ck-shell__serv-parente-head">
                                <span className="fg-ck-shell__serv-parente-label">{tr('parente', 'Parente')}</span>
                                <strong>{parente.nome}</strong>
                                <span className="fg-ck-shell__pill">
                                  {gruposParente.length} {tr('grupos', 'grupos')}
                                </span>
                              </header>
                              {gruposParente.map((gr) => renderServicoGrupoBlock(gr))}
                            </div>
                          )
                        })
                      : gruposParaServicos.map((gr) => renderServicoGrupoBlock(gr))}
                  </div>
                )}
              </section>
              ) : null}
            </div>
            </>
          )}
        </section>
      </div>
    </div>
  )
}
