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

const MANUAIS_STORAGE_KEY = 'nonato-manuais-familias-grupos'

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

function buildManuaisPayloads(
  familiasSnapshot: string[],
  gruposSnapshot: ManuaisGrupo[],
  modelosSnapshot: ManuaisModelo[]
) {
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

async function persistManuaisToStorage(
  familiasSnapshot: string[],
  gruposSnapshot: ManuaisGrupo[],
  modelosSnapshot: ManuaisModelo[],
  saveData: ManuaisInformacoesContentProps['saveData']
) {
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

  const tr = (key: string, fallback: string) => safeT[key] || fallback

  const familias = Array.isArray(manuaisFamilias) ? manuaisFamilias : []
  const grupos = Array.isArray(manuaisGrupos) ? manuaisGrupos : []
  const modelos = Array.isArray(manuaisModelos) ? manuaisModelos : []

  const persistManuaisFG = (
    familiasSnapshot: string[],
    gruposSnapshot: ManuaisGrupo[],
    modelosSnapshot: ManuaisModelo[]
  ) => {
    manuaisFamiliasRef.current = familiasSnapshot
    manuaisGruposRef.current = gruposSnapshot
    manuaisModelosRef.current = modelosSnapshot
    void persistManuaisToStorage(familiasSnapshot, gruposSnapshot, modelosSnapshot, saveData).catch((err) => {
      console.error('Erro ao guardar manuais:', err)
    })
  }

  const runSaveManuaisModelos = async (modelosSnapshot: ManuaisModelo[]) => {
    try {
      await persistManuaisToStorage(manuaisFamiliasRef.current, manuaisGruposRef.current, modelosSnapshot, saveData)
      manuaisSaveAlertShownOnce = false
    } catch (err) {
      console.error('Erro ao guardar manuais:', err)
      if (!manuaisSaveAlertShownOnce) {
        manuaisSaveAlertShownOnce = true
        alert(
          tr(
            'manuaisErroAoGuardar',
            'Nao foi possivel guardar. O navegador pode estar sem espaco; tente um PDF mais pequeno ou exporte um backup.'
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
      void runSaveManuaisModelos(manuaisModelosRef.current)
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
    if (window.confirm(tr('manuaisConfirmarExcluirFamilia', `Excluir a famÃ­lia "${familia}" e os seus grupos?`))) {
      const nextF = familias.filter((x) => x !== familia)
      const nextG = grupos.filter((g) => g.familia !== familia)
      setManuaisFamilias(nextF)
      setManuaisGrupos(nextG)
      if (selectedFamiliaManuais === familia) {
        setSelectedFamiliaManuais(nextF[0] || null)
        setSelectedGrupoManuais(null)
        setSelectedModeloManuaisId(null)
      }
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
      setSelectedGrupoManuais(novo.id)
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
      if (selectedGrupoManuais === groupId) {
        setSelectedGrupoManuais(null)
        setSelectedModeloManuaisId(null)
      }
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
      setSelectedModeloManuaisId(novo.id)
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

  const familiasListManuais = useMemo(
    () => [...familias].sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' })),
    [familias]
  )

  const gruposDaFamiliaManuais = useMemo(() => {
    if (!selectedFamiliaManuais) return []
    return grupos
      .filter((g) => g.familia === selectedFamiliaManuais)
      .sort((a, b) => a.nome.localeCompare(b.nome, undefined, { sensitivity: 'base' }))
  }, [grupos, selectedFamiliaManuais])

  const modelosDoGrupo = useMemo(() => {
    if (!selectedGrupoManuais) return []
    return modelos
      .filter((m) => m.grupoId === selectedGrupoManuais)
      .sort((a, b) => a.nome.localeCompare(b.nome, undefined, { sensitivity: 'base' }))
  }, [modelos, selectedGrupoManuais])

  const selectedModelo = useMemo(
    () => modelos.find((mo) => mo.id === selectedModeloManuaisId) || null,
    [modelos, selectedModeloManuaisId]
  )

  const selectedGrupo = useMemo(
    () => grupos.find((gr) => gr.id === selectedGrupoManuais) || null,
    [grupos, selectedGrupoManuais]
  )

  const selectedModelDocs = Array.isArray(selectedModelo?.documentos) ? selectedModelo!.documentos : []
  const selectedModelImgs = Array.isArray(selectedModelo?.imagens) ? selectedModelo!.imagens : []
  const equipamentosAssociados = selectedModelo
    ? equipamentos.filter((e) => e.modeloManuaisId === selectedModelo.id && e.status !== 'baixado')
    : []

  const documentosCount = useMemo(
    () =>
      modelos.reduce((acc, m) => {
        const docs = Array.isArray(m.documentos) ? m.documentos : []
        return acc + docs.length
      }, 0),
    [modelos]
  )

  const [navSearch, setNavSearch] = useState('')
  const [expandedFamilias, setExpandedFamilias] = useState<Record<string, boolean>>({})
  const [expandedGrupos, setExpandedGrupos] = useState<Record<string, boolean>>({})

  const navQuery = navSearch.trim().toLowerCase()

  const filteredFamilias = useMemo(() => {
    if (!navQuery) return familiasListManuais
    return familiasListManuais.filter((familia) => {
      if (familia.toLowerCase().includes(navQuery)) return true
      const famGroups = grupos.filter((g) => g.familia === familia)
      return famGroups.some((g) => {
        if (g.nome.toLowerCase().includes(navQuery)) return true
        return modelos.some(
          (m) => m.grupoId === g.id && m.nome.toLowerCase().includes(navQuery)
        )
      })
    })
  }, [familiasListManuais, grupos, modelos, navQuery])

  const textareaStyle: React.CSSProperties = {
    width: '100%',
    padding: '12px 14px',
    background: 'rgba(8, 12, 18, 0.85)',
    border: '1px solid rgba(56, 189, 248, 0.22)',
    borderRadius: '10px',
    color: '#f1f5f9',
    fontSize: '0.88rem',
    resize: 'vertical',
    minHeight: '88px',
    boxSizing: 'border-box',
    lineHeight: 1.5,
  }

  const breadcrumb =
    selectedModelo && selectedGrupo && selectedFamiliaManuais
      ? `${selectedFamiliaManuais} › ${selectedGrupo.nome} › ${selectedModelo.nome}`
      : selectedGrupo && selectedFamiliaManuais
        ? `${selectedFamiliaManuais} › ${selectedGrupo.nome}`
        : selectedFamiliaManuais || tr('manuaisHubSelectModelTitle', 'Selecione um modelo')

  return (
    <div className="manuais-pro">
      <section className="manuais-pro__hero">
        <div className="manuais-pro__hero-glow" aria-hidden />
        <div className="manuais-pro__hero-top">
          <div className="manuais-pro__hero-brand">
            <span className="manuais-pro__hero-icon" aria-hidden>
              M
            </span>
            <div>
              <p className="manuais-pro__eyebrow">{tr('manuaisHubStep1', 'Centro tÃ©cnico')}</p>
              <h1 className="manuais-pro__title">
                {tr('manuaisInformacoesTecnicasTitle', 'Manuais e InformaÃ§Ãµes TÃ©cnicas')}
              </h1>
              <p className="manuais-pro__lead">
                {tr(
                  'manuaisInformacoesTecnicasDesc',
                  'Organize documentaÃ§Ã£o por famÃ­lia, grupo e modelo de equipamento.'
                )}
              </p>
            </div>
          </div>
          <div className="manuais-pro__hero-actions">
            <LogoComponent size="small" />
            <button
              type="button"
              className="manuais-pro__tool-btn"
              onClick={() => closeTab(activeTabId || '')}
              title={tr('voltar', 'Voltar')}
            >
              &larr;
            </button>
            <button
              type="button"
              className="manuais-pro__tool-btn manuais-pro__tool-btn--accent"
              onClick={voltarPaginaInicial}
              title={tr('paginaInicial', 'PÃ¡gina Inicial')}
            >
              ðŸ 
            </button>
          </div>
        </div>
        <div className="manuais-pro__kpis">
          <div className="manuais-pro__kpi">
            <span>{tr('manuaisFamiliasLabel', 'FamÃ­lias')}</span>
            <strong>{familias.length}</strong>
          </div>
          <div className="manuais-pro__kpi">
            <span>{tr('manuaisGruposLabel', 'Grupos')}</span>
            <strong>{grupos.length}</strong>
          </div>
          <div className="manuais-pro__kpi">
            <span>{tr('manuaisModelosLabel', 'Modelos')}</span>
            <strong>{modelos.length}</strong>
          </div>
          <div className="manuais-pro__kpi">
            <span>{tr('manuaisDocumentos', 'Documentos')}</span>
            <strong>{documentosCount}</strong>
          </div>
        </div>
      </section>

      <div className="manuais-pro__layout">
        <aside className="manuais-pro__sidebar">
          <div className="manuais-pro__sidebar-head">
            <h2 className="manuais-pro__sidebar-title">{tr('manuaisHubSearchPlaceholder', 'Estrutura')}</h2>
            <input
              type="search"
              className="manuais-pro__search"
              value={navSearch}
              onChange={(e) => setNavSearch(e.target.value)}
              placeholder={tr('manuaisHubSearchPlaceholder', 'Pesquisar famÃ­lia, grupo ou modelo...')}
            />
          </div>

          <div className="manuais-pro__quick-add">
            <div className="manuais-pro__quick-add-block">
              <label className="manuais-pro__label">{tr('manuaisFamiliasLabel', 'FamÃ­lia')}</label>
              <div className="manuais-pro__quick-row">
                <input
                  type="text"
                  className="manuais-pro__input"
                  value={novaFamiliaManuais}
                  onChange={(e) => setNovaFamiliaManuais(e.target.value)}
                  placeholder={tr('manuaisNovaFamiliaPlaceholder', 'Nova famÃ­lia...')}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddFamilia()}
                />
                <button type="button" className="manuais-pro__btn manuais-pro__btn--primary" onClick={handleAddFamilia}>
                  +
                </button>
              </div>
            </div>
            <div className="manuais-pro__quick-add-block">
              <label className="manuais-pro__label">{tr('manuaisGruposLabel', 'Grupo')}</label>
              <div className="manuais-pro__quick-row">
                <input
                  type="text"
                  className="manuais-pro__input"
                  value={novoGrupoManuais}
                  onChange={(e) => setNovoGrupoManuais(e.target.value)}
                  placeholder={tr('manuaisNovoGrupoPlaceholder', 'Novo grupo...')}
                  disabled={!selectedFamiliaManuais}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddGrupo()}
                />
                <button
                  type="button"
                  className="manuais-pro__btn manuais-pro__btn--primary"
                  onClick={handleAddGrupo}
                  disabled={!selectedFamiliaManuais}
                >
                  +
                </button>
              </div>
            </div>
            <div className="manuais-pro__quick-add-block">
              <label className="manuais-pro__label">{tr('manuaisModelosLabel', 'Modelo')}</label>
              <div className="manuais-pro__quick-row">
                <input
                  type="text"
                  className="manuais-pro__input"
                  value={novoModeloManuais}
                  onChange={(e) => setNovoModeloManuais(e.target.value)}
                  placeholder={tr('manuaisNovoModeloPlaceholder', 'Novo modelo...')}
                  disabled={!selectedGrupoManuais}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddModelo()}
                />
                <button
                  type="button"
                  className="manuais-pro__btn manuais-pro__btn--primary"
                  onClick={handleAddModelo}
                  disabled={!selectedGrupoManuais}
                >
                  +
                </button>
              </div>
            </div>
          </div>

          <div className="manuais-pro__tree">
            {filteredFamilias.length === 0 ? (
              <p className="manuais-pro__empty-hint">{tr('manuaisNenhumaFamilia', 'Nenhuma famÃ­lia. Crie uma acima.')}</p>
            ) : (
              filteredFamilias.map((familia) => {
                const familiaGrupos = grupos
                  .filter((g) => g.familia === familia)
                  .filter(
                    (g) =>
                      !navQuery ||
                      familia.toLowerCase().includes(navQuery) ||
                      g.nome.toLowerCase().includes(navQuery) ||
                      modelos.some(
                        (m) => m.grupoId === g.id && m.nome.toLowerCase().includes(navQuery)
                      )
                  )
                  .sort((a, b) => a.nome.localeCompare(b.nome, undefined, { sensitivity: 'base' }))
                const famExpanded = expandedFamilias[familia] ?? selectedFamiliaManuais === familia
                return (
                  <div key={familia} className="manuais-pro__tree-block">
                    <div
                      className={`manuais-pro__row manuais-pro__row--familia ${selectedFamiliaManuais === familia ? 'is-active' : ''}`}
                    >
                      <button
                        type="button"
                        className="manuais-pro__expand"
                        onClick={() => setExpandedFamilias((p) => ({ ...p, [familia]: !famExpanded }))}
                        aria-expanded={famExpanded}
                      >
                        {famExpanded ? 'â–¾' : 'â–¸'}
                      </button>
                      {editingFamiliaManuais === familia ? (
                        <>
                          <input
                            className="manuais-pro__inline-input"
                            value={editingFamiliaManuaisValue}
                            onChange={(e) => setEditingFamiliaManuaisValue(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleSaveFamiliaEdit(familia)
                              if (e.key === 'Escape') setEditingFamiliaManuais(null)
                            }}
                            autoFocus
                          />
                          <button type="button" className="manuais-pro__act" onClick={() => handleSaveFamiliaEdit(familia)}>
                            âœ“
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            type="button"
                            className="manuais-pro__row-label"
                            onClick={() => {
                              setSelectedFamiliaManuais(familia)
                              setSelectedGrupoManuais(null)
                              setSelectedModeloManuaisId(null)
                              setExpandedFamilias((p) => ({ ...p, [familia]: true }))
                            }}
                          >
                            <span className="manuais-pro__row-name">{familia}</span>
                            <span className="manuais-pro__row-meta">{familiaGrupos.length}</span>
                          </button>
                          <div className="manuais-pro__row-actions">
                            <button
                              type="button"
                              className="manuais-pro__act"
                              onClick={() => {
                                setEditingFamiliaManuais(familia)
                                setEditingFamiliaManuaisValue(familia)
                              }}
                              title={tr('editar', 'Editar')}
                            >
                              âœŽ
                            </button>
                            <button
                              type="button"
                              className="manuais-pro__act manuais-pro__act--danger"
                              onClick={() => handleDeleteFamilia(familia)}
                              title={tr('excluir', 'Excluir')}
                            >
                              âœ•
                            </button>
                          </div>
                        </>
                      )}
                    </div>

                    {famExpanded &&
                      familiaGrupos.map((grupo) => {
                        const groupModels = modelos
                          .filter((m) => m.grupoId === grupo.id)
                          .filter((m) => !navQuery || m.nome.toLowerCase().includes(navQuery) || grupo.nome.toLowerCase().includes(navQuery) || familia.toLowerCase().includes(navQuery))
                          .sort((a, b) => a.nome.localeCompare(b.nome, undefined, { sensitivity: 'base' }))
                        const grpExpanded = expandedGrupos[grupo.id] ?? selectedGrupoManuais === grupo.id
                        return (
                          <div key={grupo.id} className="manuais-pro__tree-nested">
                            <div
                              className={`manuais-pro__row manuais-pro__row--grupo ${selectedGrupoManuais === grupo.id ? 'is-active' : ''}`}
                            >
                              <button
                                type="button"
                                className="manuais-pro__expand"
                                onClick={() => setExpandedGrupos((p) => ({ ...p, [grupo.id]: !grpExpanded }))}
                                aria-expanded={grpExpanded}
                              >
                                {grpExpanded ? 'â–¾' : 'â–¸'}
                              </button>
                              {editingGrupoManuaisId === grupo.id ? (
                                <>
                                  <input
                                    className="manuais-pro__inline-input"
                                    value={editingGrupoManuaisValue}
                                    onChange={(e) => setEditingGrupoManuaisValue(e.target.value)}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') handleSaveGrupoEdit(grupo.id)
                                      if (e.key === 'Escape') setEditingGrupoManuaisId(null)
                                    }}
                                    autoFocus
                                  />
                                  <button type="button" className="manuais-pro__act" onClick={() => handleSaveGrupoEdit(grupo.id)}>
                                    âœ“
                                  </button>
                                </>
                              ) : (
                                <>
                                  <button
                                    type="button"
                                    className="manuais-pro__row-label"
                                    onClick={() => {
                                      setSelectedFamiliaManuais(familia)
                                      setSelectedGrupoManuais(grupo.id)
                                      setSelectedModeloManuaisId(null)
                                      setExpandedGrupos((p) => ({ ...p, [grupo.id]: true }))
                                    }}
                                  >
                                    <span className="manuais-pro__row-name">{grupo.nome}</span>
                                    <span className="manuais-pro__row-meta">{groupModels.length}</span>
                                  </button>
                                  <div className="manuais-pro__row-actions">
                                    <button
                                      type="button"
                                      className="manuais-pro__act"
                                      onClick={() => {
                                        setEditingGrupoManuaisId(grupo.id)
                                        setEditingGrupoManuaisValue(grupo.nome)
                                      }}
                                      title={tr('editar', 'Editar')}
                                    >
                                      âœŽ
                                    </button>
                                    <button
                                      type="button"
                                      className="manuais-pro__act manuais-pro__act--danger"
                                      onClick={() => handleDeleteGrupo(grupo.id, grupo.nome)}
                                      title={tr('excluir', 'Excluir')}
                                    >
                                      âœ•
                                    </button>
                                  </div>
                                </>
                              )}
                            </div>

                            {grpExpanded &&
                              groupModels.map((modelo) => (
                                <div
                                  key={modelo.id}
                                  className={`manuais-pro__row manuais-pro__row--modelo ${selectedModeloManuaisId === modelo.id ? 'is-active' : ''}`}
                                >
                                  {editingModeloManuaisId === modelo.id ? (
                                    <>
                                      <input
                                        className="manuais-pro__inline-input"
                                        value={editingModeloManuaisValue}
                                        onChange={(e) => setEditingModeloManuaisValue(e.target.value)}
                                        onKeyDown={(e) => {
                                          if (e.key === 'Enter') handleSaveModeloEdit(modelo.id)
                                          if (e.key === 'Escape') setEditingModeloManuaisId(null)
                                        }}
                                        autoFocus
                                      />
                                      <button type="button" className="manuais-pro__act" onClick={() => handleSaveModeloEdit(modelo.id)}>
                                        âœ“
                                      </button>
                                    </>
                                  ) : (
                                    <>
                                      <button
                                        type="button"
                                        className="manuais-pro__row-label"
                                        onClick={() => {
                                          setSelectedFamiliaManuais(familia)
                                          setSelectedGrupoManuais(grupo.id)
                                          setSelectedModeloManuaisId(modelo.id)
                                        }}
                                      >
                                        <span className="manuais-pro__row-name">{modelo.nome}</span>
                                      </button>
                                      <div className="manuais-pro__row-actions">
                                        <button
                                          type="button"
                                          className="manuais-pro__act"
                                          onClick={() => {
                                            setEditingModeloManuaisId(modelo.id)
                                            setEditingModeloManuaisValue(modelo.nome)
                                          }}
                                          title={tr('editar', 'Editar')}
                                        >
                                          âœŽ
                                        </button>
                                        <button
                                          type="button"
                                          className="manuais-pro__act manuais-pro__act--danger"
                                          onClick={() => handleDeleteModelo(modelo.id, modelo.nome)}
                                          title={tr('excluir', 'Excluir')}
                                        >
                                          âœ•
                                        </button>
                                      </div>
                                    </>
                                  )}
                                </div>
                              ))}
                          </div>
                        )
                      })}
                  </div>
                )
              })
            )}
          </div>
        </aside>

        <main className="manuais-pro__main">
          <header className="manuais-pro__main-head">
            <div>
              <p className="manuais-pro__breadcrumb-label">{tr('manuaisConteudoModelo', 'ConteÃºdo do modelo')}</p>
              <p className="manuais-pro__breadcrumb">{breadcrumb}</p>
            </div>
          </header>

          {!selectedModelo ? (
            <div className="manuais-pro__placeholder">
              <div className="manuais-pro__placeholder-icon">DOC</div>
              <h3>{tr('manuaisHubSelectModelTitle', 'Selecione um modelo')}</h3>
              <p>
                {tr(
                  'manuaisSelecioneModelo',
                  'Escolha um modelo na estrutura Ã  esquerda para gerir documentos, textos tÃ©cnicos e imagens.'
                )}
              </p>
            </div>
          ) : (
            <div className="manuais-pro__panels">
              {equipamentosAssociados.length > 0 && (
                <section className="manuais-pro__panel manuais-pro__panel--full">
                  <h3 className="manuais-pro__panel-title">
                    {tr('manuaisEquipamentosAssociados', 'Equipamentos associados')}
                  </h3>
                  <div className="manuais-pro__equip-grid">
                    {equipamentosAssociados.map((e) => (
                      <div key={e.id} className="manuais-pro__equip-card">
                        <strong>{e.id}</strong>
                        <span>
                          {e.tipoEquipamento} · {e.modelo} · {e.marca}
                        </span>
                        {e.numeroSerie && <small>SÃ©rie: {e.numeroSerie}</small>}
                      </div>
                    ))}
                  </div>
                </section>
              )}

              <section className="manuais-pro__panel">
                <h3 className="manuais-pro__panel-title">{tr('manuaisDocumentos', 'Documentos')}</h3>
                {selectedModelDocs.length === 0 ? (
                  <p className="manuais-pro__empty-hint">{tr('manuaisHubNoDocuments', 'Nenhum documento.')}</p>
                ) : (
                  <ul className="manuais-pro__doc-list">
                    {selectedModelDocs.map((d) => (
                      <li key={d.id} className="manuais-pro__doc-item">
                        <a href={d.dados} download={d.nome} target="_blank" rel="noopener noreferrer" title={d.nome}>
                          {d.nome}
                        </a>
                        <button
                          type="button"
                          className="manuais-pro__act manuais-pro__act--danger"
                          onClick={() => removeDocumento(selectedModelo.id, d.id)}
                          title={tr('excluir', 'Excluir')}
                        >
                          âœ•
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
                <label className="manuais-pro__upload">
                  <input
                    type="file"
                    accept=".pdf,application/pdf,image/*"
                    className="manuais-pro__file-input"
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
              </section>

              <section className="manuais-pro__panel">
                <h3 className="manuais-pro__panel-title">{tr('manuaisImagens', 'Imagens')}</h3>
                <div className="manuais-pro__image-grid">
                  {selectedModelImgs.map((img) => (
                    <div key={img.id} className="manuais-pro__image-wrap">
                      <img src={img.dados} alt={img.nome} />
                      <button
                        type="button"
                        className="manuais-pro__act manuais-pro__act--danger manuais-pro__image-remove"
                        onClick={() => removeImagem(selectedModelo.id, img.id)}
                        title={tr('excluir', 'Excluir')}
                      >
                        âœ•
                      </button>
                    </div>
                  ))}
                </div>
                <label className="manuais-pro__upload">
                  <input
                    type="file"
                    accept="image/*"
                    className="manuais-pro__file-input"
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
              </section>

              <section className="manuais-pro__panel manuais-pro__panel--wide">
                <h3 className="manuais-pro__panel-title">{tr('manuaisInfoTecnicas', 'Informacoes tecnicas')}</h3>
                <AssistTextarea
                  value={selectedModelo.infoTecnicas ?? ''}
                  onValueChange={(v) => updateModelo(selectedModelo.id, { infoTecnicas: v })}
                  placeholder={tr('manuaisInfoTecnicasPlaceholder', 'Texto livre...')}
                  rows={4}
                  style={textareaStyle}
                />
              </section>

              <section className="manuais-pro__panel">
                <h3 className="manuais-pro__panel-title">{tr('manuaisInfoMecanicas', 'Informacoes mecanicas')}</h3>
                <AssistTextarea
                  value={selectedModelo.infoMecanicas ?? ''}
                  onValueChange={(v) => updateModelo(selectedModelo.id, { infoMecanicas: v })}
                  placeholder={tr('manuaisInfoMecanicasPlaceholder', 'Texto livre...')}
                  rows={4}
                  style={textareaStyle}
                />
              </section>

              <section className="manuais-pro__panel">
                <h3 className="manuais-pro__panel-title">{tr('manuaisInfoEletricas', 'Informacoes eletricas')}</h3>
                <AssistTextarea
                  value={selectedModelo.infoEletricas ?? ''}
                  onValueChange={(v) => updateModelo(selectedModelo.id, { infoEletricas: v })}
                  placeholder={tr('manuaisInfoEletricasPlaceholder', 'Texto livre...')}
                  rows={4}
                  style={textareaStyle}
                />
              </section>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
