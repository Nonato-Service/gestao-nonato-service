'use client'

import React, { useMemo } from 'react'
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
    if (window.confirm(tr('manuaisConfirmarExcluirFamilia', `Excluir a família "${familia}" e os seus grupos?`))) {
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

  return (
    <div className="manuais-centro">
      <header className="manuais-centro__header">
        <div className="manuais-centro__header-brand">
          <LogoComponent size="small" />
        </div>
        <div className="manuais-centro__header-center">
          <h1 className="manuais-centro__title">
            {tr('manuaisInformacoesTecnicasTitle', 'MANUAIS E INFORMAÇÕES TÉCNICA DOS EQUIPAMENTOS')}
          </h1>
          <p className="manuais-centro__subtitle">
            {tr('manuaisInformacoesTecnicasDesc', 'Crie famílias e grupos para organizar manuais e informações técnicas.')}
          </p>
        </div>
        <div className="manuais-centro__header-actions">
          <button
            type="button"
            className="manuais-centro__nav-btn"
            onClick={() => closeTab(activeTabId || '')}
            title={tr('voltar', 'Voltar')}
          >
            ↶
          </button>
          <button
            type="button"
            className="manuais-centro__nav-btn manuais-centro__nav-btn--home"
            onClick={voltarPaginaInicial}
            title={tr('paginaInicial', 'Página Inicial')}
          >
            🏠
          </button>
        </div>
      </header>

      <div className="manuais-centro__stats">
        <span className="manuais-centro__stat">
          {tr('manuaisFamiliasLabel', 'Famílias')}: <strong>{familias.length}</strong>
        </span>
        <span className="manuais-centro__stat">
          {tr('manuaisGruposLabel', 'Grupos')}: <strong>{grupos.length}</strong>
        </span>
        <span className="manuais-centro__stat">
          {tr('manuaisModelosLabel', 'Modelos')}: <strong>{modelos.length}</strong>
        </span>
        <span className="manuais-centro__stat">
          {tr('manuaisDocumentos', 'Documentos')}: <strong>{documentosCount}</strong>
        </span>
      </div>

      <div className="manuais-centro__board">
        {/* Coluna 1 — Famílias */}
        <section className="manuais-centro__col">
          <div className="manuais-centro__col-head">
            <h2 className="manuais-centro__col-title">{tr('manuaisFamiliasLabel', 'Famílias')}</h2>
            <div className="manuais-centro__add-row">
              <input
                type="text"
                className="manuais-centro__input"
                value={novaFamiliaManuais}
                onChange={(e) => setNovaFamiliaManuais(e.target.value)}
                placeholder={tr('manuaisNovaFamiliaPlaceholder', 'Nome da nova família...')}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAddFamilia()
                }}
              />
              <button type="button" className="btn-primary manuais-centro__add-btn" onClick={handleAddFamilia}>
                {tr('manuaisAdicionar', 'Adicionar')}
              </button>
            </div>
          </div>
          <div className="manuais-centro__col-list">
            {familiasListManuais.length === 0 ? (
              <p className="manuais-centro__hint">{tr('manuaisNenhumaFamilia', 'Nenhuma família. Crie uma acima.')}</p>
            ) : (
              familiasListManuais.map((f) => (
                <div
                  key={f}
                  className={`manuais-centro__item ${selectedFamiliaManuais === f ? 'is-selected' : ''}`}
                  onClick={() => {
                    setSelectedFamiliaManuais(f)
                    setSelectedGrupoManuais(null)
                    setSelectedModeloManuaisId(null)
                    setEditingFamiliaManuais(null)
                    setEditingGrupoManuaisId(null)
                  }}
                >
                  {editingFamiliaManuais === f ? (
                    <>
                      <input
                        type="text"
                        className="manuais-centro__inline-input"
                        value={editingFamiliaManuaisValue}
                        onChange={(e) => setEditingFamiliaManuaisValue(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSaveFamiliaEdit(f)
                          if (e.key === 'Escape') setEditingFamiliaManuais(null)
                        }}
                        autoFocus
                      />
                      <button type="button" className="manuais-centro__mini-btn" onClick={() => handleSaveFamiliaEdit(f)}>
                        ✓
                      </button>
                    </>
                  ) : (
                    <>
                      <span className="manuais-centro__item-name">{f}</span>
                      <span className="manuais-centro__item-count">
                        {grupos.filter((g) => g.familia === f).length}
                      </span>
                      <button
                        type="button"
                        className="manuais-centro__mini-btn"
                        onClick={(ev) => {
                          ev.stopPropagation()
                          setEditingFamiliaManuais(f)
                          setEditingFamiliaManuaisValue(f)
                        }}
                        title={tr('editar', 'Editar')}
                      >
                        ✎
                      </button>
                      <button
                        type="button"
                        className="btn-danger manuais-centro__mini-btn manuais-centro__mini-btn--danger"
                        onClick={(ev) => {
                          ev.stopPropagation()
                          handleDeleteFamilia(f)
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
        </section>

        {/* Coluna 2 — Grupos */}
        <section className="manuais-centro__col">
          <div className="manuais-centro__col-head">
            <h2 className="manuais-centro__col-title">
              {tr('manuaisGruposLabel', 'Grupos')}
              {selectedFamiliaManuais && (
                <span className="manuais-centro__col-subtitle"> — {selectedFamiliaManuais}</span>
              )}
            </h2>
            {selectedFamiliaManuais ? (
              <div className="manuais-centro__add-row">
                <input
                  type="text"
                  className="manuais-centro__input"
                  value={novoGrupoManuais}
                  onChange={(e) => setNovoGrupoManuais(e.target.value)}
                  placeholder={tr('manuaisNovoGrupoPlaceholder', 'Nome do novo grupo...')}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleAddGrupo()
                  }}
                />
                <button type="button" className="btn-primary manuais-centro__add-btn" onClick={handleAddGrupo}>
                  {tr('manuaisAdicionar', 'Adicionar')}
                </button>
              </div>
            ) : (
              <p className="manuais-centro__hint">{tr('manuaisSelecioneFamilia', 'Selecione uma família à esquerda para gerir grupos.')}</p>
            )}
          </div>
          <div className="manuais-centro__col-list">
            {!selectedFamiliaManuais ? (
              <p className="manuais-centro__hint">{tr('manuaisSelecioneFamilia', 'Selecione uma família à esquerda.')}</p>
            ) : gruposDaFamiliaManuais.length === 0 ? (
              <p className="manuais-centro__hint">{tr('manuaisNenhumGrupo', 'Nenhum grupo nesta família. Crie um acima.')}</p>
            ) : (
              gruposDaFamiliaManuais.map((g) => (
                <div
                  key={g.id}
                  className={`manuais-centro__item ${selectedGrupoManuais === g.id ? 'is-selected' : ''}`}
                  onClick={() => {
                    setSelectedGrupoManuais(selectedGrupoManuais === g.id ? null : g.id)
                    setSelectedModeloManuaisId(null)
                  }}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      setSelectedGrupoManuais(selectedGrupoManuais === g.id ? null : g.id)
                      setSelectedModeloManuaisId(null)
                    }
                  }}
                >
                  {editingGrupoManuaisId === g.id ? (
                    <>
                      <input
                        type="text"
                        className="manuais-centro__inline-input"
                        value={editingGrupoManuaisValue}
                        onChange={(e) => setEditingGrupoManuaisValue(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSaveGrupoEdit(g.id)
                          if (e.key === 'Escape') setEditingGrupoManuaisId(null)
                        }}
                        autoFocus
                      />
                      <button type="button" className="manuais-centro__mini-btn" onClick={() => handleSaveGrupoEdit(g.id)}>
                        ✓
                      </button>
                    </>
                  ) : (
                    <>
                      <span className="manuais-centro__item-name">{g.nome}</span>
                      <button
                        type="button"
                        className="manuais-centro__mini-btn"
                        onClick={(e) => {
                          e.stopPropagation()
                          setEditingGrupoManuaisId(g.id)
                          setEditingGrupoManuaisValue(g.nome)
                        }}
                        title={tr('editar', 'Editar')}
                      >
                        ✎
                      </button>
                      <button
                        type="button"
                        className="btn-danger manuais-centro__mini-btn manuais-centro__mini-btn--danger"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDeleteGrupo(g.id, g.nome)
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
        </section>

        {/* Coluna 3 — Modelos */}
        <section className="manuais-centro__col">
          <div className="manuais-centro__col-head">
            <h2 className="manuais-centro__col-title">{tr('manuaisModelosLabel', 'Modelos')}</h2>
            {selectedGrupoManuais ? (
              <div className="manuais-centro__add-row">
                <input
                  type="text"
                  className="manuais-centro__input"
                  value={novoModeloManuais}
                  onChange={(e) => setNovoModeloManuais(e.target.value)}
                  placeholder={tr('manuaisNovoModeloPlaceholder', 'Nome do modelo...')}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleAddModelo()
                  }}
                />
                <button type="button" className="btn-primary manuais-centro__add-btn" onClick={handleAddModelo}>
                  {tr('manuaisAdicionar', 'Adicionar')}
                </button>
              </div>
            ) : (
              <p className="manuais-centro__hint">{tr('manuaisSelecioneGrupo', 'Selecione um grupo ao lado para gerir modelos.')}</p>
            )}
          </div>
          <div className="manuais-centro__col-list">
            {!selectedGrupoManuais ? (
              <p className="manuais-centro__hint">{tr('manuaisSelecioneGrupo', 'Selecione um grupo ao lado.')}</p>
            ) : modelosDoGrupo.length === 0 ? (
              <p className="manuais-centro__hint">{tr('manuaisNenhumModelo', 'Nenhum modelo neste grupo. Crie um acima.')}</p>
            ) : (
              modelosDoGrupo.map((m) => (
                <div
                  key={m.id}
                  className={`manuais-centro__item ${selectedModeloManuaisId === m.id ? 'is-selected' : ''}`}
                  onClick={() => {
                    if (editingModeloManuaisId !== m.id) {
                      setSelectedModeloManuaisId(selectedModeloManuaisId === m.id ? null : m.id)
                    }
                  }}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && editingModeloManuaisId !== m.id) {
                      setSelectedModeloManuaisId(selectedModeloManuaisId === m.id ? null : m.id)
                    }
                  }}
                >
                  {editingModeloManuaisId === m.id ? (
                    <>
                      <input
                        type="text"
                        className="manuais-centro__inline-input"
                        value={editingModeloManuaisValue}
                        onChange={(e) => setEditingModeloManuaisValue(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSaveModeloEdit(m.id)
                          if (e.key === 'Escape') setEditingModeloManuaisId(null)
                        }}
                        autoFocus
                      />
                      <button type="button" className="manuais-centro__mini-btn" onClick={() => handleSaveModeloEdit(m.id)}>
                        ✓
                      </button>
                    </>
                  ) : (
                    <>
                      <span className="manuais-centro__item-name">{m.nome}</span>
                      <button
                        type="button"
                        className="manuais-centro__mini-btn"
                        onClick={(e) => {
                          e.stopPropagation()
                          setEditingModeloManuaisId(m.id)
                          setEditingModeloManuaisValue(m.nome)
                        }}
                        title={tr('editar', 'Editar')}
                      >
                        ✎
                      </button>
                      <button
                        type="button"
                        className="btn-danger manuais-centro__mini-btn manuais-centro__mini-btn--danger"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDeleteModelo(m.id, m.nome)
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
        </section>

        {/* Coluna 4 — Conteúdo do modelo */}
        <section className="manuais-centro__col manuais-centro__col--content">
          <div className="manuais-centro__col-head manuais-centro__col-head--content">
            <h2 className="manuais-centro__col-title manuais-centro__col-title--muted">
              {tr('manuaisConteudoModelo', 'Conteúdo do modelo')}
            </h2>
          </div>
          <div className="manuais-centro__col-list manuais-centro__col-list--content">
            {!selectedModelo ? (
              <div className="manuais-centro__empty">
                <span className="manuais-centro__empty-icon">📄</span>
                <p className="manuais-centro__empty-text">
                  {tr(
                    'manuaisSelecioneModelo',
                    'Selecione um modelo à esquerda para adicionar documentos, informações técnicas e imagens.'
                  )}
                </p>
              </div>
            ) : (
              <>
                <div className="manuais-centro__model-badge">
                  <span className="manuais-centro__model-badge-label">
                    {tr('manuaisHubSelectedModel', 'Modelo selecionado')}
                  </span>
                  <strong className="manuais-centro__model-badge-name">{selectedModelo.nome}</strong>
                </div>

                {equipamentosAssociados.length > 0 && (
                  <div className="manuais-centro__card">
                    <h3 className="manuais-centro__card-title">
                      🔗 {tr('manuaisEquipamentosAssociados', 'Equipamentos associados')}
                    </h3>
                    <div className="manuais-centro__equip-list">
                      {equipamentosAssociados.map((e) => (
                        <div key={e.id} className="manuais-centro__equip-item">
                          <span className="manuais-centro__equip-id">{e.id}</span>
                          <span>
                            {e.tipoEquipamento} · {e.modelo} · {e.marca}
                          </span>
                          {e.numeroSerie && <span className="manuais-centro__equip-serie">(Série: {e.numeroSerie})</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="manuais-centro__card">
                  <h3 className="manuais-centro__card-title">📎 {tr('manuaisDocumentos', 'Documentos')}</h3>
                  <div className="manuais-centro__doc-scroll">
                    {selectedModelDocs.length === 0 ? (
                      <p className="manuais-centro__hint">{tr('manuaisHubNoDocuments', 'Nenhum documento.')}</p>
                    ) : (
                      <div className="manuais-centro__doc-list">
                        {selectedModelDocs.map((d) => (
                          <div key={d.id} className="manuais-centro__doc-item">
                            <a
                              href={d.dados}
                              download={d.nome}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="manuais-centro__doc-link"
                              title={d.nome}
                            >
                              {d.nome}
                            </a>
                            <button
                              type="button"
                              className="manuais-centro__mini-btn manuais-centro__mini-btn--danger"
                              onClick={() => removeDocumento(selectedModelo.id, d.id)}
                              title={tr('excluir', 'Excluir')}
                            >
                              ✕
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <label className="manuais-centro__upload-btn">
                    <input
                      type="file"
                      accept=".pdf,application/pdf,image/*"
                      className="manuais-centro__file-input"
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

                <div className="manuais-centro__card">
                  <h3 className="manuais-centro__card-title">⚙ {tr('manuaisInfoTecnicas', 'Informações técnicas')}</h3>
                  <AssistTextarea
                    value={selectedModelo.infoTecnicas ?? ''}
                    onValueChange={(v) => updateModelo(selectedModelo.id, { infoTecnicas: v })}
                    placeholder={tr('manuaisInfoTecnicasPlaceholder', 'Texto livre...')}
                    rows={3}
                    style={{
                      width: '100%',
                      padding: '10px',
                      background: '#0d0d0d',
                      border: '1px solid rgba(0, 200, 83, 0.25)',
                      borderRadius: '8px',
                      color: '#fff',
                      fontSize: '0.85rem',
                      resize: 'vertical',
                      minHeight: '64px',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>

                <div className="manuais-centro__card">
                  <h3 className="manuais-centro__card-title">🔧 {tr('manuaisInfoMecanicas', 'Informações mecânicas')}</h3>
                  <AssistTextarea
                    value={selectedModelo.infoMecanicas ?? ''}
                    onValueChange={(v) => updateModelo(selectedModelo.id, { infoMecanicas: v })}
                    placeholder={tr('manuaisInfoMecanicasPlaceholder', 'Texto livre...')}
                    rows={3}
                    style={{
                      width: '100%',
                      padding: '10px',
                      background: '#0d0d0d',
                      border: '1px solid rgba(0, 200, 83, 0.25)',
                      borderRadius: '8px',
                      color: '#fff',
                      fontSize: '0.85rem',
                      resize: 'vertical',
                      minHeight: '64px',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>

                <div className="manuais-centro__card">
                  <h3 className="manuais-centro__card-title">⚡ {tr('manuaisInfoEletricas', 'Informações elétricas')}</h3>
                  <AssistTextarea
                    value={selectedModelo.infoEletricas ?? ''}
                    onValueChange={(v) => updateModelo(selectedModelo.id, { infoEletricas: v })}
                    placeholder={tr('manuaisInfoEletricasPlaceholder', 'Texto livre...')}
                    rows={3}
                    style={{
                      width: '100%',
                      padding: '10px',
                      background: '#0d0d0d',
                      border: '1px solid rgba(0, 200, 83, 0.25)',
                      borderRadius: '8px',
                      color: '#fff',
                      fontSize: '0.85rem',
                      resize: 'vertical',
                      minHeight: '64px',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>

                <div className="manuais-centro__card">
                  <h3 className="manuais-centro__card-title">🖼 {tr('manuaisImagens', 'Imagens')}</h3>
                  <div className="manuais-centro__image-grid">
                    {selectedModelImgs.map((img) => (
                      <div key={img.id} className="manuais-centro__image-item">
                        <img src={img.dados} alt={img.nome} className="manuais-centro__image" />
                        <button
                          type="button"
                          className="manuais-centro__mini-btn manuais-centro__mini-btn--danger manuais-centro__image-remove"
                          onClick={() => removeImagem(selectedModelo.id, img.id)}
                          title={tr('excluir', 'Excluir')}
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                  <label className="manuais-centro__upload-btn">
                    <input
                      type="file"
                      accept="image/*"
                      className="manuais-centro__file-input"
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
              </>
            )}
          </div>
        </section>
      </div>
    </div>
  )
}
