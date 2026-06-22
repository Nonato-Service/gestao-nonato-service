'use client'

import React, { useMemo, useState } from 'react'
import {
  EquipamentoManuaisRef,
  ManuaisDocumento,
  ManuaisGrupo,
  ManuaisImagem,
  ManuaisModelo,
} from '../lib/manuaisTypes'
import { AssistTextarea } from './AssistTextFields'
import { saveManuaisFamiliasGruposToIdb } from '../utils/manuaisIndexedDb'

let manuaisSaveDebounceTimer: ReturnType<typeof setTimeout> | null = null
let manuaisSaveAlertShownOnce = false

type SetState<T> = React.Dispatch<React.SetStateAction<T>>

export type ManuaisInformacoesContentProps = {
  safeT: Record<string, string | undefined>
  LogoComponent: React.ComponentType<{ size?: 'small' | 'medium' | 'large' }>
  closeTab: (tabId: string) => void
  activeTabId: string | null
  voltarPaginaInicial: () => void
  manuaisFamilias: string[]
  setManuaisFamilias: SetState<string[]>
  manuaisGrupos: ManuaisGrupo[]
  setManuaisGrupos: SetState<ManuaisGrupo[]>
  manuaisModelos: ManuaisModelo[]
  setManuaisModelos: SetState<ManuaisModelo[]>
  novaFamiliaManuais: string
  setNovaFamiliaManuais: SetState<string>
  novoGrupoManuais: string
  setNovoGrupoManuais: SetState<string>
  novoModeloManuais: string
  setNovoModeloManuais: SetState<string>
  selectedFamiliaManuais: string | null
  setSelectedFamiliaManuais: SetState<string | null>
  selectedGrupoManuais: string | null
  setSelectedGrupoManuais: SetState<string | null>
  selectedModeloManuaisId: string | null
  setSelectedModeloManuaisId: SetState<string | null>
  editingFamiliaManuais: string | null
  setEditingFamiliaManuais: SetState<string | null>
  editingFamiliaManuaisValue: string
  setEditingFamiliaManuaisValue: SetState<string>
  editingGrupoManuaisId: string | null
  setEditingGrupoManuaisId: SetState<string | null>
  editingGrupoManuaisValue: string
  setEditingGrupoManuaisValue: SetState<string>
  editingModeloManuaisId: string | null
  setEditingModeloManuaisId: SetState<string | null>
  editingModeloManuaisValue: string
  setEditingModeloManuaisValue: SetState<string>
  manuaisFamiliasRef: React.MutableRefObject<string[]>
  manuaisGruposRef: React.MutableRefObject<ManuaisGrupo[]>
  manuaisModelosRef: React.MutableRefObject<ManuaisModelo[]>
  equipamentos: EquipamentoManuaisRef[]
  saveData: (
    key: string,
    value: unknown,
    saveToLocalStorage?: boolean,
    awaitServer?: boolean
  ) => Promise<boolean>
}

type DetailTab = 'docs' | 'tech' | 'mech' | 'elec' | 'images'

export function ManuaisInformacoesContent(props: ManuaisInformacoesContentProps) {
  const {
    safeT,
    LogoComponent,
    closeTab,
    activeTabId,
    voltarPaginaInicial,
    manuaisFamilias,
    setManuaisFamilias,
    manuaisGrupos,
    setManuaisGrupos,
    manuaisModelos,
    setManuaisModelos,
    novaFamiliaManuais,
    setNovaFamiliaManuais,
    novoGrupoManuais,
    setNovoGrupoManuais,
    novoModeloManuais,
    setNovoModeloManuais,
    selectedFamiliaManuais,
    setSelectedFamiliaManuais,
    selectedGrupoManuais,
    setSelectedGrupoManuais,
    selectedModeloManuaisId,
    setSelectedModeloManuaisId,
    editingFamiliaManuais,
    setEditingFamiliaManuais,
    editingFamiliaManuaisValue,
    setEditingFamiliaManuaisValue,
    editingGrupoManuaisId,
    setEditingGrupoManuaisId,
    editingGrupoManuaisValue,
    setEditingGrupoManuaisValue,
    editingModeloManuaisId,
    setEditingModeloManuaisId,
    editingModeloManuaisValue,
    setEditingModeloManuaisValue,
    manuaisFamiliasRef,
    manuaisGruposRef,
    manuaisModelosRef,
    equipamentos,
    saveData,
  } = props

  const [treeSearch, setTreeSearch] = useState('')
  const [detailTab, setDetailTab] = useState<DetailTab>('docs')
  const [expandedFamilias, setExpandedFamilias] = useState<Record<string, boolean>>({})
  const [expandedGrupos, setExpandedGrupos] = useState<Record<string, boolean>>({})

  const tr = (key: string, fallback: string) => safeT[key] || fallback

  const familias = Array.isArray(manuaisFamilias) ? manuaisFamilias : []
  const grupos = Array.isArray(manuaisGrupos) ? manuaisGrupos : []
  const modelos = Array.isArray(manuaisModelos) ? manuaisModelos : []

  const MANUAIS_STORAGE_KEY = 'nonato-manuais-familias-grupos'

  const buildManuaisPayloads = (
    familiasSnapshot: string[],
    gruposSnapshot: ManuaisGrupo[],
    modelosSnapshot: ManuaisModelo[]
  ) => {
    const payloadFull = { familias: familiasSnapshot, grupos: gruposSnapshot, modelos: modelosSnapshot }
    const payloadLite = {
      familias: familiasSnapshot,
      grupos: gruposSnapshot,
      modelos: modelosSnapshot.map((m: ManuaisModelo) => {
        const { documentos: _d, imagens: _i, ...rest } = m || {}
        return rest
      }),
    }
    return { payloadFull, payloadLite }
  }

  /** IndexedDB = dados completos; localStorage = versão leve; servidor = payload completo. */
  const persistManuaisToStorage = async (
    familiasSnapshot: string[],
    gruposSnapshot: ManuaisGrupo[],
    modelosSnapshot: ManuaisModelo[]
  ) => {
    const { payloadFull, payloadLite } = buildManuaisPayloads(familiasSnapshot, gruposSnapshot, modelosSnapshot)
    await saveManuaisFamiliasGruposToIdb(payloadFull)
    try {
      localStorage.setItem(MANUAIS_STORAGE_KEY, JSON.stringify(payloadLite))
    } catch {
      try {
        localStorage.setItem(`${MANUAIS_STORAGE_KEY}--idb`, '1')
      } catch {
        /* ignorar */
      }
    }
    await saveData(MANUAIS_STORAGE_KEY, payloadFull, false)
  }

  const persistManuaisFG = (familiasSnapshot: string[], gruposSnapshot: ManuaisGrupo[], modelosSnapshot: ManuaisModelo[]) => {
    void persistManuaisToStorage(familiasSnapshot, gruposSnapshot, modelosSnapshot).catch((err) => {
      console.error('Erro ao guardar manuais (famílias/grupos):', err)
    })
  }

  const selectedModelo = useMemo(
    () => modelos.find((mo) => mo.id === selectedModeloManuaisId) || null,
    [modelos, selectedModeloManuaisId]
  )
  const selectedGrupo = useMemo(
    () => grupos.find((gr) => gr.id === selectedGrupoManuais) || null,
    [grupos, selectedGrupoManuais]
  )

  const modelosByGrupo = useMemo(() => {
    const map = new Map<string, ManuaisModelo[]>()
    for (const modelo of modelos) {
      const current = map.get(modelo.grupoId) || []
      current.push(modelo)
      map.set(modelo.grupoId, current)
    }
    for (const [k, arr] of map) {
      map.set(k, [...arr].sort((a, b) => a.nome.localeCompare(b.nome, undefined, { sensitivity: 'base' })))
    }
    return map
  }, [modelos])

  const gruposByFamilia = useMemo(() => {
    const map = new Map<string, ManuaisGrupo[]>()
    for (const grupo of grupos) {
      const current = map.get(grupo.familia) || []
      current.push(grupo)
      map.set(grupo.familia, current)
    }
    for (const [k, arr] of map) {
      map.set(k, [...arr].sort((a, b) => a.nome.localeCompare(b.nome, undefined, { sensitivity: 'base' })))
    }
    return map
  }, [grupos])

  const documentosCount = useMemo(
    () =>
      modelos.reduce((acc, m) => {
        const docs = Array.isArray(m.documentos) ? m.documentos : []
        return acc + docs.length
      }, 0),
    [modelos]
  )

  const familiasListManuais = useMemo(
    () => [...familias].sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' })),
    [familias]
  )

  const filteredTree = useMemo(() => {
    const q = treeSearch.trim().toLowerCase()
    if (!q) return familiasListManuais
    return familiasListManuais.filter((familia) => {
      if (familia.toLowerCase().includes(q)) return true
      const famGroups = gruposByFamilia.get(familia) || []
      return famGroups.some((g) => {
        if (g.nome.toLowerCase().includes(q)) return true
        const groupModels = modelosByGrupo.get(g.id) || []
        return groupModels.some((m) => m.nome.toLowerCase().includes(q))
      })
    })
  }, [familiasListManuais, gruposByFamilia, modelosByGrupo, treeSearch])

  const runSaveManuaisModelos = async (modelosSnapshot: ManuaisModelo[]) => {
    try {
      await persistManuaisToStorage(manuaisFamiliasRef.current, manuaisGruposRef.current, modelosSnapshot)
      manuaisSaveAlertShownOnce = false
    } catch (err) {
      console.error('Erro ao guardar manuais:', err)
      if (!manuaisSaveAlertShownOnce) {
        manuaisSaveAlertShownOnce = true
        alert(
          tr(
            'manuaisErroAoGuardar',
            'Não foi possível guardar. O navegador pode estar sem espaço; tente um PDF mais pequeno ou exporte um backup.'
          )
        )
      }
    }
  }

  const persistModelosImmediate = (modelosSnapshot: ManuaisModelo[]) => {
    if (manuaisSaveDebounceTimer) {
      clearTimeout(manuaisSaveDebounceTimer)
      manuaisSaveDebounceTimer = null
    }
    manuaisModelosRef.current = modelosSnapshot
    void runSaveManuaisModelos(modelosSnapshot)
  }

  const persistModelosDebounced = () => {
    if (manuaisSaveDebounceTimer) clearTimeout(manuaisSaveDebounceTimer)
    manuaisSaveDebounceTimer = setTimeout(() => {
      manuaisSaveDebounceTimer = null
      const latest = manuaisModelosRef.current
      void runSaveManuaisModelos(latest)
    }, 500)
  }

  const updateModelo = (modeloId: string, updates: Partial<ManuaisModelo>) => {
    setManuaisModelos((prev) => {
      const next = prev.map((mo) => (mo.id === modeloId ? { ...mo, ...updates } : mo))
      manuaisModelosRef.current = next
      return next
    })
    persistModelosDebounced()
  }

  const addDocumento = (modeloId: string, file: File) => {
    if (manuaisSaveDebounceTimer) {
      clearTimeout(manuaisSaveDebounceTimer)
      manuaisSaveDebounceTimer = null
    }
    const reader = new FileReader()
    reader.onload = () => {
      const id = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `doc-${Date.now()}`
      const novo: ManuaisDocumento = { id, nome: file.name, tipo: file.type, dados: reader.result as string }
      let snapshot: ManuaisModelo[] = []
      setManuaisModelos((prev) => {
        snapshot = prev.map((mo) => {
          if (mo.id !== modeloId) return mo
          const docs = Array.isArray(mo.documentos) ? mo.documentos : []
          if (docs.some((d) => d.id === id)) return mo
          return { ...mo, documentos: [...docs, novo] }
        })
        manuaisModelosRef.current = snapshot
        return snapshot
      })
      void Promise.resolve().then(() => persistModelosImmediate(snapshot))
    }
    reader.readAsDataURL(file)
  }

  const removeDocumento = (modeloId: string, docId: string) => {
    let snapshot: ManuaisModelo[] = []
    setManuaisModelos((prev) => {
      snapshot = prev.map((mo) => {
        if (mo.id !== modeloId) return mo
        const docs = Array.isArray(mo.documentos) ? mo.documentos : []
        return { ...mo, documentos: docs.filter((d) => d.id !== docId) }
      })
      manuaisModelosRef.current = snapshot
      return snapshot
    })
    void Promise.resolve().then(() => persistModelosImmediate(snapshot))
  }

  const addImagem = (modeloId: string, file: File) => {
    if (manuaisSaveDebounceTimer) {
      clearTimeout(manuaisSaveDebounceTimer)
      manuaisSaveDebounceTimer = null
    }
    const reader = new FileReader()
    reader.onload = () => {
      const id = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `img-${Date.now()}`
      const novo: ManuaisImagem = { id, nome: file.name, dados: reader.result as string }
      let snapshot: ManuaisModelo[] = []
      setManuaisModelos((prev) => {
        snapshot = prev.map((mo) => {
          if (mo.id !== modeloId) return mo
          const imgs = Array.isArray(mo.imagens) ? mo.imagens : []
          if (imgs.some((i) => i.id === id)) return mo
          return { ...mo, imagens: [...imgs, novo] }
        })
        manuaisModelosRef.current = snapshot
        return snapshot
      })
      void Promise.resolve().then(() => persistModelosImmediate(snapshot))
    }
    reader.readAsDataURL(file)
  }

  const removeImagem = (modeloId: string, imgId: string) => {
    let snapshot: ManuaisModelo[] = []
    setManuaisModelos((prev) => {
      snapshot = prev.map((mo) => {
        if (mo.id !== modeloId) return mo
        const imgs = Array.isArray(mo.imagens) ? mo.imagens : []
        return { ...mo, imagens: imgs.filter((i) => i.id !== imgId) }
      })
      manuaisModelosRef.current = snapshot
      return snapshot
    })
    void Promise.resolve().then(() => persistModelosImmediate(snapshot))
  }

  const handleAddFamilia = () => {
    const nome = novaFamiliaManuais.trim()
    if (nome && !familias.includes(nome)) {
      const next = [...familias, nome].sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }))
      setManuaisFamilias(next)
      setNovaFamiliaManuais('')
      setSelectedFamiliaManuais(nome)
      setSelectedGrupoManuais(null)
      setSelectedModeloManuaisId(null)
      setExpandedFamilias((prev) => ({ ...prev, [nome]: true }))
      persistManuaisFG(next, grupos, manuaisModelosRef.current)
    }
  }

  const handleSaveFamiliaEdit = (oldNome: string) => {
    const nome = editingFamiliaManuaisValue.trim()
    if (nome && nome !== oldNome) {
      const nextF = familias.map((x) => (x === oldNome ? nome : x)).sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }))
      const nextG = grupos.map((g) => (g.familia === oldNome ? { ...g, familia: nome } : g))
      setManuaisFamilias(nextF)
      setManuaisGrupos(nextG)
      setSelectedFamiliaManuais(nome)
      setEditingFamiliaManuais(null)
      persistManuaisFG(nextF, nextG, manuaisModelosRef.current)
    }
  }

  const handleDeleteFamilia = (familia: string) => {
    if (window.confirm(tr('manuaisConfirmarExcluirFamilia', `Excluir a família "${familia}" e os seus grupos?`))) {
      const nextF = familias.filter((x) => x !== familia)
      const nextG = grupos.filter((g) => g.familia !== familia)
      setManuaisFamilias(nextF)
      setManuaisGrupos(nextG)
      if (selectedFamiliaManuais === familia) setSelectedFamiliaManuais(nextF[0] || null)
      if (selectedFamiliaManuais === familia) setSelectedGrupoManuais(null)
      persistManuaisFG(nextF, nextG, manuaisModelosRef.current)
    }
  }

  const handleAddGrupo = () => {
    const nome = novoGrupoManuais.trim()
    if (nome && selectedFamiliaManuais) {
      const novo: ManuaisGrupo = {
        id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `g-${Date.now()}`,
        nome,
        familia: selectedFamiliaManuais,
      }
      const next = [...grupos, novo]
      setManuaisGrupos(next)
      setNovoGrupoManuais('')
      setExpandedFamilias((prev) => ({ ...prev, [selectedFamiliaManuais]: true }))
      setExpandedGrupos((prev) => ({ ...prev, [novo.id]: true }))
      persistManuaisFG(familias, next, manuaisModelosRef.current)
    }
  }

  const handleSaveGrupoEdit = (groupId: string) => {
    const nome = editingGrupoManuaisValue.trim()
    if (nome) {
      const next = manuaisGrupos.map((gr) => (gr.id === groupId ? { ...gr, nome } : gr))
      setManuaisGrupos(next)
      setEditingGrupoManuaisId(null)
      persistManuaisFG(familias, next, manuaisModelosRef.current)
    }
  }

  const handleDeleteGrupo = (groupId: string, groupNome: string) => {
    if (window.confirm(tr('manuaisConfirmarExcluirGrupo', `Excluir o grupo "${groupNome}"?`))) {
      const nextGr = manuaisGrupos.filter((gr) => gr.id !== groupId)
      const nextMo = manuaisModelos.filter((m) => m.grupoId !== groupId)
      setManuaisGrupos(nextGr)
      setManuaisModelos(nextMo)
      setEditingGrupoManuaisId(null)
      if (selectedGrupoManuais === groupId) setSelectedGrupoManuais(null)
      if (selectedGrupoManuais === groupId) setSelectedModeloManuaisId(null)
      persistManuaisFG(familias, nextGr, nextMo)
    }
  }

  const handleAddModelo = () => {
    const nome = novoModeloManuais.trim()
    if (nome && selectedGrupoManuais) {
      const novo: ManuaisModelo = {
        id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `m-${Date.now()}`,
        nome,
        grupoId: selectedGrupoManuais,
      }
      const next = [...manuaisModelos, novo]
      setManuaisModelos(next)
      setNovoModeloManuais('')
      setExpandedGrupos((prev) => ({ ...prev, [selectedGrupoManuais]: true }))
      persistManuaisFG(familias, grupos, next)
    }
  }

  const handleSaveModeloEdit = (modeloId: string) => {
    const nome = editingModeloManuaisValue.trim()
    if (nome) {
      const next = manuaisModelos.map((mo) => (mo.id === modeloId ? { ...mo, nome } : mo))
      setManuaisModelos(next)
      setEditingModeloManuaisId(null)
      persistManuaisFG(familias, grupos, next)
    }
  }

  const handleDeleteModelo = (modeloId: string, nome: string) => {
    if (window.confirm(tr('manuaisConfirmarExcluirModelo', `Excluir o modelo "${nome}"?`))) {
      const next = manuaisModelos.filter((mo) => mo.id !== modeloId)
      setManuaisModelos(next)
      setEditingModeloManuaisId(null)
      if (selectedModeloManuaisId === modeloId) setSelectedModeloManuaisId(null)
      persistManuaisFG(familias, grupos, next)
    }
  }

  const selectedModelDocs = Array.isArray(selectedModelo?.documentos) ? selectedModelo.documentos : []
  const selectedModelImgs = Array.isArray(selectedModelo?.imagens) ? selectedModelo.imagens : []
  const equipamentosAssociados = selectedModelo
    ? equipamentos.filter((e) => e.modeloManuaisId === selectedModelo.id && e.status !== 'baixado')
    : []

  return (
    <div className="manuais-hub-page">
      <section className="manuais-hub__hero">
        <div className="manuais-hub__hero-top">
          <div className="manuais-hub__brand">
            <LogoComponent size="small" />
          </div>
          <div className="manuais-hub__hero-center">
            <h1 className="manuais-hub__title">{tr('manuaisInformacoesTecnicasTitle', 'MANUAIS E INFORMAÇÕES TÉCNICA DOS EQUIPAMENTOS')}</h1>
            <p className="manuais-hub__description">
              {tr('manuaisInformacoesTecnicasDesc', 'Crie famílias e grupos para organizar manuais e informações técnicas.')}
            </p>
          </div>
          <div className="manuais-hub__actions">
            <button
              type="button"
              className="manuais-hub__icon-btn"
              onClick={() => closeTab(activeTabId || '')}
              title={tr('voltar', 'Voltar')}
            >
              ↶
            </button>
            <button
              type="button"
              className="manuais-hub__icon-btn manuais-hub__icon-btn--home"
              onClick={voltarPaginaInicial}
              title={tr('paginaInicial', 'Página Inicial')}
            >
              🏠
            </button>
          </div>
        </div>

        <div className="manuais-hub__hero-info">
          <div className="manuais-hub__steps">
            <span className="manuais-hub__step">{tr('manuaisHubStep1', '1) Crie famílias')}</span>
            <span className="manuais-hub__step">{tr('manuaisHubStep2', '2) Organize grupos e modelos')}</span>
            <span className="manuais-hub__step">{tr('manuaisHubStep3', '3) Adicione documentação técnica')}</span>
          </div>
          <div className="manuais-hub__kpis">
            <div className="manuais-hub__kpi">
              <span className="manuais-hub__kpi-label">{tr('manuaisFamiliasLabel', 'Famílias')}</span>
              <strong className="manuais-hub__kpi-value">{familias.length}</strong>
            </div>
            <div className="manuais-hub__kpi">
              <span className="manuais-hub__kpi-label">{tr('manuaisGruposLabel', 'Grupos')}</span>
              <strong className="manuais-hub__kpi-value">{grupos.length}</strong>
            </div>
            <div className="manuais-hub__kpi">
              <span className="manuais-hub__kpi-label">{tr('manuaisModelosLabel', 'Modelos')}</span>
              <strong className="manuais-hub__kpi-value">{modelos.length}</strong>
            </div>
            <div className="manuais-hub__kpi">
              <span className="manuais-hub__kpi-label">{tr('manuaisDocumentos', 'Documentos')}</span>
              <strong className="manuais-hub__kpi-value">{documentosCount}</strong>
            </div>
          </div>
        </div>
      </section>

      <section className="manuais-hub__workspace">
        <aside className="manuais-hub__tree">
          <div className="manuais-hub__tree-tools">
            <input
              type="text"
              className="manuais-hub__input"
              value={treeSearch}
              onChange={(e) => setTreeSearch(e.target.value)}
              placeholder={tr('manuaisHubSearchPlaceholder', 'Pesquisar família, grupo ou modelo...')}
            />

            <div className="manuais-hub__toolbar">
              <div className="manuais-hub__toolbar-row">
                <input
                  type="text"
                  className="manuais-hub__input"
                  value={novaFamiliaManuais}
                  onChange={(e) => setNovaFamiliaManuais(e.target.value)}
                  placeholder={tr('manuaisNovaFamiliaPlaceholder', 'Nome da nova família...')}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleAddFamilia()
                  }}
                />
                <button type="button" className="btn-primary manuais-hub__toolbar-btn" onClick={handleAddFamilia}>
                  {tr('manuaisAdicionar', 'Adicionar')}
                </button>
              </div>

              <div className="manuais-hub__toolbar-row">
                <input
                  type="text"
                  className="manuais-hub__input"
                  value={novoGrupoManuais}
                  onChange={(e) => setNovoGrupoManuais(e.target.value)}
                  placeholder={tr('manuaisNovoGrupoPlaceholder', 'Nome do novo grupo...')}
                  disabled={!selectedFamiliaManuais}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleAddGrupo()
                  }}
                />
                <button
                  type="button"
                  className="btn-primary manuais-hub__toolbar-btn"
                  onClick={handleAddGrupo}
                  disabled={!selectedFamiliaManuais}
                >
                  {tr('manuaisAdicionar', 'Adicionar')}
                </button>
              </div>

              <div className="manuais-hub__toolbar-row">
                <input
                  type="text"
                  className="manuais-hub__input"
                  value={novoModeloManuais}
                  onChange={(e) => setNovoModeloManuais(e.target.value)}
                  placeholder={tr('manuaisNovoModeloPlaceholder', 'Nome do modelo...')}
                  disabled={!selectedGrupoManuais}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleAddModelo()
                  }}
                />
                <button
                  type="button"
                  className="btn-primary manuais-hub__toolbar-btn"
                  onClick={handleAddModelo}
                  disabled={!selectedGrupoManuais}
                >
                  {tr('manuaisAdicionar', 'Adicionar')}
                </button>
              </div>
            </div>
          </div>

          <div className="manuais-hub__tree-list">
            {filteredTree.length === 0 ? (
              <p className="manuais-hub__empty-text">{tr('manuaisNenhumaFamilia', 'Nenhuma família. Crie uma acima.')}</p>
            ) : (
              filteredTree.map((familia) => {
                const familiaGrupos = gruposByFamilia.get(familia) || []
                const isFamilyExpanded = expandedFamilias[familia] ?? true
                return (
                  <div key={familia} className="manuais-hub__node manuais-hub__node--familia">
                    <div
                      className={`manuais-hub__node-row ${selectedFamiliaManuais === familia ? 'is-selected' : ''}`}
                      onClick={() => {
                        setSelectedFamiliaManuais(familia)
                        setSelectedGrupoManuais(null)
                        setSelectedModeloManuaisId(null)
                        setEditingFamiliaManuais(null)
                        setEditingGrupoManuaisId(null)
                      }}
                    >
                      <button
                        type="button"
                        className="manuais-hub__caret-btn"
                        onClick={(ev) => {
                          ev.stopPropagation()
                          setExpandedFamilias((prev) => ({ ...prev, [familia]: !isFamilyExpanded }))
                        }}
                      >
                        {isFamilyExpanded ? '▾' : '▸'}
                      </button>

                      {editingFamiliaManuais === familia ? (
                        <>
                          <input
                            type="text"
                            className="manuais-hub__inline-input"
                            value={editingFamiliaManuaisValue}
                            onChange={(e) => setEditingFamiliaManuaisValue(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleSaveFamiliaEdit(familia)
                              if (e.key === 'Escape') setEditingFamiliaManuais(null)
                            }}
                            autoFocus
                          />
                          <button
                            type="button"
                            className="manuais-hub__mini-btn"
                            onClick={(ev) => {
                              ev.stopPropagation()
                              handleSaveFamiliaEdit(familia)
                            }}
                          >
                            ✓
                          </button>
                        </>
                      ) : (
                        <>
                          <span className="manuais-hub__node-name">{familia}</span>
                          <span className="manuais-hub__node-count">{familiaGrupos.length}</span>
                          <button
                            type="button"
                            className="manuais-hub__mini-btn"
                            onClick={(ev) => {
                              ev.stopPropagation()
                              setEditingFamiliaManuais(familia)
                              setEditingFamiliaManuaisValue(familia)
                            }}
                            title={tr('editar', 'Editar')}
                          >
                            ✎
                          </button>
                          <button
                            type="button"
                            className="btn-danger manuais-hub__mini-btn manuais-hub__mini-btn--danger"
                            onClick={(ev) => {
                              ev.stopPropagation()
                              handleDeleteFamilia(familia)
                            }}
                            title={tr('excluir', 'Excluir')}
                          >
                            ✕
                          </button>
                        </>
                      )}
                    </div>

                    {isFamilyExpanded && (
                      <div className="manuais-hub__children">
                        {familiaGrupos.length === 0 ? (
                          <p className="manuais-hub__empty-text">{tr('manuaisNenhumGrupo', 'Nenhum grupo nesta família. Crie um acima.')}</p>
                        ) : (
                          familiaGrupos.map((grupo) => {
                            const groupModels = modelosByGrupo.get(grupo.id) || []
                            const isGroupExpanded = expandedGrupos[grupo.id] ?? true
                            return (
                              <div key={grupo.id} className="manuais-hub__node manuais-hub__node--grupo">
                                <div
                                  className={`manuais-hub__node-row ${selectedGrupoManuais === grupo.id ? 'is-selected' : ''}`}
                                  onClick={() => {
                                    setSelectedFamiliaManuais(familia)
                                    setSelectedGrupoManuais(grupo.id)
                                    setSelectedModeloManuaisId(null)
                                  }}
                                >
                                  <button
                                    type="button"
                                    className="manuais-hub__caret-btn"
                                    onClick={(ev) => {
                                      ev.stopPropagation()
                                      setExpandedGrupos((prev) => ({ ...prev, [grupo.id]: !isGroupExpanded }))
                                    }}
                                  >
                                    {isGroupExpanded ? '▾' : '▸'}
                                  </button>

                                  {editingGrupoManuaisId === grupo.id ? (
                                    <>
                                      <input
                                        type="text"
                                        className="manuais-hub__inline-input"
                                        value={editingGrupoManuaisValue}
                                        onChange={(e) => setEditingGrupoManuaisValue(e.target.value)}
                                        onKeyDown={(e) => {
                                          if (e.key === 'Enter') handleSaveGrupoEdit(grupo.id)
                                          if (e.key === 'Escape') setEditingGrupoManuaisId(null)
                                        }}
                                        autoFocus
                                      />
                                      <button
                                        type="button"
                                        className="manuais-hub__mini-btn"
                                        onClick={(ev) => {
                                          ev.stopPropagation()
                                          handleSaveGrupoEdit(grupo.id)
                                        }}
                                      >
                                        ✓
                                      </button>
                                    </>
                                  ) : (
                                    <>
                                      <span className="manuais-hub__node-name">{grupo.nome}</span>
                                      <span className="manuais-hub__node-count">{groupModels.length}</span>
                                      <button
                                        type="button"
                                        className="manuais-hub__mini-btn"
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          setEditingGrupoManuaisId(grupo.id)
                                          setEditingGrupoManuaisValue(grupo.nome)
                                        }}
                                        title={tr('editar', 'Editar')}
                                      >
                                        ✎
                                      </button>
                                      <button
                                        type="button"
                                        className="btn-danger manuais-hub__mini-btn manuais-hub__mini-btn--danger"
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          handleDeleteGrupo(grupo.id, grupo.nome)
                                        }}
                                        title={tr('excluir', 'Excluir')}
                                      >
                                        ✕
                                      </button>
                                    </>
                                  )}
                                </div>

                                {isGroupExpanded && (
                                  <div className="manuais-hub__children">
                                    {groupModels.length === 0 ? (
                                      <p className="manuais-hub__empty-text">
                                        {tr('manuaisNenhumModelo', 'Nenhum modelo neste grupo. Crie um acima.')}
                                      </p>
                                    ) : (
                                      groupModels.map((modelo) => (
                                        <div
                                          key={modelo.id}
                                          className={`manuais-hub__node-row manuais-hub__node-row--modelo ${
                                            selectedModeloManuaisId === modelo.id ? 'is-selected' : ''
                                          }`}
                                          onClick={() => {
                                            if (editingModeloManuaisId !== modelo.id) {
                                              setSelectedFamiliaManuais(familia)
                                              setSelectedGrupoManuais(grupo.id)
                                              setSelectedModeloManuaisId(selectedModeloManuaisId === modelo.id ? null : modelo.id)
                                            }
                                          }}
                                          onKeyDown={(e) => {
                                            if (e.key === 'Enter' && editingModeloManuaisId !== modelo.id) {
                                              setSelectedModeloManuaisId(selectedModeloManuaisId === modelo.id ? null : modelo.id)
                                            }
                                          }}
                                          role="button"
                                          tabIndex={0}
                                        >
                                          {editingModeloManuaisId === modelo.id ? (
                                            <>
                                              <input
                                                type="text"
                                                className="manuais-hub__inline-input"
                                                value={editingModeloManuaisValue}
                                                onChange={(e) => setEditingModeloManuaisValue(e.target.value)}
                                                onKeyDown={(e) => {
                                                  if (e.key === 'Enter') handleSaveModeloEdit(modelo.id)
                                                  if (e.key === 'Escape') setEditingModeloManuaisId(null)
                                                }}
                                                autoFocus
                                              />
                                              <button
                                                type="button"
                                                className="manuais-hub__mini-btn"
                                                onClick={(e) => {
                                                  e.stopPropagation()
                                                  handleSaveModeloEdit(modelo.id)
                                                }}
                                              >
                                                ✓
                                              </button>
                                            </>
                                          ) : (
                                            <>
                                              <span className="manuais-hub__node-name">{modelo.nome}</span>
                                              <button
                                                type="button"
                                                className="manuais-hub__mini-btn"
                                                onClick={(e) => {
                                                  e.stopPropagation()
                                                  setEditingModeloManuaisId(modelo.id)
                                                  setEditingModeloManuaisValue(modelo.nome)
                                                }}
                                                title={tr('editar', 'Editar')}
                                              >
                                                ✎
                                              </button>
                                              <button
                                                type="button"
                                                className="btn-danger manuais-hub__mini-btn manuais-hub__mini-btn--danger"
                                                onClick={(e) => {
                                                  e.stopPropagation()
                                                  handleDeleteModelo(modelo.id, modelo.nome)
                                                }}
                                                title={tr('excluir', 'Excluir')}
                                              >
                                                ✕
                                              </button>
                                            </>
                                          )}
                                        </div>
                                      ))
                                    )}
                                  </div>
                                )}
                              </div>
                            )
                          })
                        )}
                      </div>
                    )}
                  </div>
                )
              })
            )}
          </div>
        </aside>

        <section className="manuais-hub__detail">
          <header className="manuais-hub__detail-header">
            <div className="manuais-hub__breadcrumb">
              <span>{selectedFamiliaManuais || tr('manuaisFamiliasLabel', 'Famílias')}</span>
              <span>/</span>
              <span>{selectedGrupo?.nome || tr('manuaisGruposLabel', 'Grupos')}</span>
              <span>/</span>
              <span>{selectedModelo?.nome || tr('manuaisModelosLabel', 'Modelos')}</span>
            </div>
          </header>

          {!selectedModelo ? (
            <div className="manuais-hub__empty-state">
              <span className="manuais-hub__empty-icon">📄</span>
              <p className="manuais-hub__empty-title">{tr('manuaisHubSelectModelTitle', 'Selecione um modelo')}</p>
              <p className="manuais-hub__empty-text">
                {tr(
                  'manuaisSelecioneModelo',
                  'Selecione um modelo à esquerda para adicionar documentos, informações técnicas e imagens.'
                )}
              </p>
            </div>
          ) : (
            <div className="manuais-hub__detail-body">
              <div className="manuais-hub__selected-model">
                <span className="manuais-hub__selected-label">{tr('manuaisHubSelectedModel', 'Modelo selecionado')}</span>
                <strong className="manuais-hub__selected-name">{selectedModelo.nome}</strong>
              </div>

              {equipamentosAssociados.length > 0 && (
                <div className="manuais-hub__card">
                  <div className="manuais-hub__card-title">
                    🔗 {tr('manuaisEquipamentosAssociados', 'Equipamentos associados')}
                  </div>
                  <div className="manuais-hub__equip-list">
                    {equipamentosAssociados.map((e) => (
                      <div key={e.id} className="manuais-hub__equip-item">
                        <span className="manuais-hub__equip-id">{e.id}</span>
                        <span>
                          {e.tipoEquipamento} · {e.modelo} · {e.marca}
                        </span>
                        {e.numeroSerie && <span className="manuais-hub__equip-serie">(Série: {e.numeroSerie})</span>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="manuais-hub__tabs">
                <button
                  type="button"
                  className={`manuais-hub__tab ${detailTab === 'docs' ? 'is-active' : ''}`}
                  onClick={() => setDetailTab('docs')}
                >
                  {tr('manuaisDocumentos', 'Documentos')}
                </button>
                <button
                  type="button"
                  className={`manuais-hub__tab ${detailTab === 'tech' ? 'is-active' : ''}`}
                  onClick={() => setDetailTab('tech')}
                >
                  {tr('manuaisInfoTecnicas', 'Informações técnicas')}
                </button>
                <button
                  type="button"
                  className={`manuais-hub__tab ${detailTab === 'mech' ? 'is-active' : ''}`}
                  onClick={() => setDetailTab('mech')}
                >
                  {tr('manuaisInfoMecanicas', 'Informações mecânicas')}
                </button>
                <button
                  type="button"
                  className={`manuais-hub__tab ${detailTab === 'elec' ? 'is-active' : ''}`}
                  onClick={() => setDetailTab('elec')}
                >
                  {tr('manuaisInfoEletricas', 'Informações elétricas')}
                </button>
                <button
                  type="button"
                  className={`manuais-hub__tab ${detailTab === 'images' ? 'is-active' : ''}`}
                  onClick={() => setDetailTab('images')}
                >
                  {tr('manuaisImagens', 'Imagens')}
                </button>
              </div>

              <div className="manuais-hub__tab-content">
                {detailTab === 'docs' && (
                  <div className="manuais-hub__card">
                    <div className="manuais-hub__card-title">📎 {tr('manuaisDocumentos', 'Documentos')}</div>
                    <div className="manuais-hub__doc-list">
                      {selectedModelDocs.length === 0 ? (
                        <p className="manuais-hub__empty-text">{tr('manuaisHubNoDocuments', 'Nenhum documento.')}</p>
                      ) : (
                        selectedModelDocs.map((d) => (
                          <div key={d.id} className="manuais-hub__doc-item">
                            <a
                              href={d.dados}
                              download={d.nome}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="manuais-hub__doc-link"
                              title={d.nome}
                            >
                              {d.nome}
                            </a>
                            <button
                              type="button"
                              className="manuais-hub__mini-btn manuais-hub__mini-btn--danger"
                              onClick={() => removeDocumento(selectedModelo.id, d.id)}
                              title={tr('excluir', 'Excluir')}
                            >
                              ✕
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                    <label className="manuais-hub__upload-btn">
                      <input
                        type="file"
                        accept=".pdf,application/pdf,image/*"
                        className="manuais-hub__file-input"
                        onChange={(e) => {
                          const f = e.target.files?.[0]
                          if (f) {
                            addDocumento(selectedModelo.id, f)
                            e.target.value = ''
                          }
                        }}
                      />
                      {tr('manuaisAdicionarDocumento', '+ Adicionar documento')}
                    </label>
                  </div>
                )}

                {detailTab === 'tech' && (
                  <div className="manuais-hub__card">
                    <div className="manuais-hub__card-title">⚙ {tr('manuaisInfoTecnicas', 'Informações técnicas')}</div>
                    <AssistTextarea
                      value={selectedModelo.infoTecnicas ?? ''}
                      onValueChange={(v) => updateModelo(selectedModelo.id, { infoTecnicas: v })}
                      placeholder={tr('manuaisInfoTecnicasPlaceholder', 'Texto livre...')}
                      rows={4}
                      className="manuais-hub__textarea"
                    />
                  </div>
                )}

                {detailTab === 'mech' && (
                  <div className="manuais-hub__card">
                    <div className="manuais-hub__card-title">🔧 {tr('manuaisInfoMecanicas', 'Informações mecânicas')}</div>
                    <AssistTextarea
                      value={selectedModelo.infoMecanicas ?? ''}
                      onValueChange={(v) => updateModelo(selectedModelo.id, { infoMecanicas: v })}
                      placeholder={tr('manuaisInfoMecanicasPlaceholder', 'Texto livre...')}
                      rows={4}
                      className="manuais-hub__textarea"
                    />
                  </div>
                )}

                {detailTab === 'elec' && (
                  <div className="manuais-hub__card">
                    <div className="manuais-hub__card-title">⚡ {tr('manuaisInfoEletricas', 'Informações elétricas')}</div>
                    <AssistTextarea
                      value={selectedModelo.infoEletricas ?? ''}
                      onValueChange={(v) => updateModelo(selectedModelo.id, { infoEletricas: v })}
                      placeholder={tr('manuaisInfoEletricasPlaceholder', 'Texto livre...')}
                      rows={4}
                      className="manuais-hub__textarea"
                    />
                  </div>
                )}

                {detailTab === 'images' && (
                  <div className="manuais-hub__card">
                    <div className="manuais-hub__card-title">🖼 {tr('manuaisImagens', 'Imagens')}</div>
                    <div className="manuais-hub__image-grid">
                      {selectedModelImgs.map((img) => (
                        <div key={img.id} className="manuais-hub__image-item">
                          <img src={img.dados} alt={img.nome} className="manuais-hub__image" />
                          <button
                            type="button"
                            className="manuais-hub__mini-btn manuais-hub__mini-btn--danger manuais-hub__image-remove"
                            onClick={() => removeImagem(selectedModelo.id, img.id)}
                            title={tr('excluir', 'Excluir')}
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                    <label className="manuais-hub__upload-btn">
                      <input
                        type="file"
                        accept="image/*"
                        className="manuais-hub__file-input"
                        onChange={(e) => {
                          const f = e.target.files?.[0]
                          if (f) {
                            addImagem(selectedModelo.id, f)
                            e.target.value = ''
                          }
                        }}
                      />
                      {tr('manuaisAdicionarImagem', '+ Adicionar imagem')}
                    </label>
                  </div>
                )}
              </div>
            </div>
          )}
        </section>
      </section>
    </div>
  )
}
