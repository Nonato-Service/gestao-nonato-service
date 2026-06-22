'use client'

import React, { useMemo, useRef, useState } from 'react'
import {
  EquipamentoManuaisRef,
  ManuaisDocumento,
  ManuaisGrupo,
  ManuaisImagem,
  ManuaisModelo,
} from '../lib/manuaisTypes'
import type { BibliaAnexo } from './bibliaNonatoTypes'
import { BIBLIA_ANEXO_MAX_BYTES, BIBLIA_ANEXO_MAX_PER_MODEL } from './bibliaNonatoTypes'
import { syncConhecimentoTecnicoLegacyStores, mergeManuaisPayloads } from '../lib/conhecimentoTecnicoMerge'
import { AssistTextarea } from './AssistTextFields'
import { saveManuaisFamiliasGruposToIdb } from '../utils/manuaisIndexedDb'
import { ProImageHoverPreview } from './ProImageHoverPreview'

let manuaisSaveDebounceTimer: ReturnType<typeof setTimeout> | null = null
let manuaisSaveAlertShownOnce = false

const MANUAIS_STORAGE_KEY = 'nonato-manuais-familias-grupos'
const DEFAULT_GRUPO_NAME = '__default__'

function getGrupoIdsForFamilia(familia: string, gruposList: ManuaisGrupo[]): string[] {
  return gruposList.filter((g) => g.familia === familia).map((g) => g.id)
}

function getModelosForFamilia(
  familia: string,
  gruposList: ManuaisGrupo[],
  modelosList: ManuaisModelo[]
): ManuaisModelo[] {
  const ids = new Set(getGrupoIdsForFamilia(familia, gruposList))
  return modelosList.filter((m) => ids.has(m.grupoId))
}

function ensureDefaultGrupoForFamilia(
  familia: string,
  gruposList: ManuaisGrupo[]
): { grupos: ManuaisGrupo[]; grupoId: string } {
  const famGrups = gruposList.filter((g) => g.familia === familia)
  const hidden = famGrups.find((g) => g.nome === DEFAULT_GRUPO_NAME)
  if (hidden) return { grupos: gruposList, grupoId: hidden.id }
  if (famGrups.length === 1) return { grupos: gruposList, grupoId: famGrups[0].id }
  const id = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `mdg-${Date.now()}`
  const novo: ManuaisGrupo = { id, nome: DEFAULT_GRUPO_NAME, familia }
  return { grupos: [...gruposList, novo], grupoId: id }
}

function familiaForModelo(modelo: ManuaisModelo, gruposList: ManuaisGrupo[]): string | null {
  return gruposList.find((g) => g.id === modelo.grupoId)?.familia ?? null
}

type SetState<T> = React.Dispatch<React.SetStateAction<T>>

function ManuaisRowActions(props: {
  onEdit: (ev: React.MouseEvent) => void
  onDelete: (ev: React.MouseEvent) => void
  editTitle: string
  deleteTitle: string
}) {
  const { onEdit, onDelete, editTitle, deleteTitle } = props
  return (
    <div className="manuais-pro__row-actions">
      <button type="button" className="manuais-pro__act" onClick={onEdit} title={editTitle} aria-label={editTitle}>
        <span aria-hidden>✎</span>
      </button>
      <button type="button" className="manuais-pro__act manuais-pro__act--danger" onClick={onDelete} title={deleteTitle} aria-label={deleteTitle}>
        <span aria-hidden>×</span>
      </button>
    </div>
  )
}

export type ManuaisInformacoesContentProps = {
  /** unified = Centro de Conhecimento (Bíblia + Manuais + equipamentos) */
  hubMode?: 'unified' | 'manuais' | 'biblia'
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
      const { documentos: _d, imagens: _i, anexos: _a, ...rest } = m || {}
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
  await syncConhecimentoTecnicoLegacyStores(payloadFull, saveData)
}

export function ManuaisInformacoesContent(props: ManuaisInformacoesContentProps) {
  const {
    hubMode = 'unified',
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

  const addAnexo = (modeloId: string, file: File) => {
    if (file.size > BIBLIA_ANEXO_MAX_BYTES) {
      alert(tr('bibliaAnexoGrande', 'Ficheiro demasiado grande (máx. 6 MB).'))
      return
    }
    if (manuaisSaveDebounceTimer) {
      clearTimeout(manuaisSaveDebounceTimer)
      manuaisSaveDebounceTimer = null
    }
    const reader = new FileReader()
    reader.onload = () => {
      const modelo = manuaisModelosRef.current.find((m) => m.id === modeloId)
      const anexosAtuais = Array.isArray(modelo?.anexos) ? modelo!.anexos! : []
      if (anexosAtuais.length >= BIBLIA_ANEXO_MAX_PER_MODEL) {
        alert(tr('bibliaAnexoLimite', `Limite de ${BIBLIA_ANEXO_MAX_PER_MODEL} anexos por modelo.`))
        return
      }
      const id = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `anx-${Date.now()}`
      const novo: BibliaAnexo = {
        id,
        nome: file.name,
        mime: file.type || 'application/octet-stream',
        dataUrl: reader.result as string,
      }
      let snapshot: ManuaisModelo[] = []
      setManuaisModelos((prev) => {
        snapshot = prev.map((mo) => {
          if (mo.id !== modeloId) return mo
          const anexos = Array.isArray(mo.anexos) ? mo.anexos : []
          return { ...mo, anexos: [...anexos, novo] }
        })
        manuaisModelosRef.current = snapshot
        return snapshot
      })
      void Promise.resolve().then(() => persistModelosImmediate(snapshot))
    }
    reader.readAsDataURL(file)
  }

  const removeAnexo = (modeloId: string, anexoId: string) => {
    let snapshot: ManuaisModelo[] = []
    setManuaisModelos((prev) => {
      snapshot = prev.map((mo) => {
        if (mo.id !== modeloId) return mo
        const anexos = Array.isArray(mo.anexos) ? mo.anexos : []
        return { ...mo, anexos: anexos.filter((a) => a.id !== anexoId) }
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
    if (!nome || !selectedFamiliaManuais) return
    let grupoId = selectedGrupoManuais
    let nextGrupos = grupos
    if (!grupoId) {
      const ensured = ensureDefaultGrupoForFamilia(selectedFamiliaManuais, grupos)
      nextGrupos = ensured.grupos
      grupoId = ensured.grupoId
      if (nextGrupos.length !== grupos.length) setManuaisGrupos(nextGrupos)
      setSelectedGrupoManuais(grupoId)
    }
    const novo: ManuaisModelo = {
      id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `m-${Date.now()}`,
      nome,
      grupoId,
    }
    const next = [...manuaisModelos, novo]
    setManuaisModelos(next)
    setNovoModeloManuais('')
    setSelectedModeloManuaisId(novo.id)
    persistManuaisFG(familias, nextGrupos, next)
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
  const selectedModelAnexos = Array.isArray(selectedModelo?.anexos) ? selectedModelo!.anexos : []
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

  const anexosCount = useMemo(
    () =>
      modelos.reduce((acc, m) => {
        const anexos = Array.isArray(m.anexos) ? m.anexos : []
        return acc + anexos.length
      }, 0),
    [modelos]
  )

  const marcasVisiveis = useMemo(
    () => grupos.filter((g) => g.nome !== DEFAULT_GRUPO_NAME).length,
    [grupos]
  )

  const hubTitle =
    hubMode === 'biblia'
      ? tr('bibliaNonatoServiceTitle', 'Biblia da Nonato Service')
      : hubMode === 'manuais'
        ? tr('manuaisInformacoesTecnicasTitle', 'Manuais e Informacoes Tecnicas')
        : tr('conhecimentoTecnicoHubTitle', 'Centro de Conhecimento Tecnico')

  const hubLead =
    hubMode === 'biblia'
      ? tr('bibliaNonatoServiceDesc', 'Ficha tecnica por familia, marca e modelo.')
      : hubMode === 'manuais'
        ? tr('manuaisInformacoesTecnicasDesc', 'Organize documentacao por familia e modelo de equipamento.')
        : tr(
            'conhecimentoTecnicoHubDesc',
            'Biblia, manuais, anexos e equipamentos num unico registo por modelo.'
          )

  const hubIcon = hubMode === 'biblia' ? 'B' : hubMode === 'manuais' ? 'M' : 'CT'

  const displayMarcaNome = (nome: string) => (nome === DEFAULT_GRUPO_NAME ? tr('marcaGeral', 'Geral') : nome)

  const [navSearch, setNavSearch] = useState('')
  const [expandedFamilias, setExpandedFamilias] = useState<Record<string, boolean>>({})
  const [expandedGrupos, setExpandedGrupos] = useState<Record<string, boolean>>({})
  const [mainTab, setMainTab] = useState<'ficha' | 'docs' | 'equip'>('ficha')
  const importInputRef = useRef<HTMLInputElement>(null)

  const hubEyebrow =
    hubMode === 'unified'
      ? tr('conhecimentoTecnicoHubStep', 'Centro técnico unificado')
      : tr('manuaisHubStep1', 'Centro técnico')

  const handleExportJson = () => {
    const { payloadFull } = buildManuaisPayloads(familias, grupos, modelos)
    const blob = new Blob([JSON.stringify(payloadFull, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `conhecimento-tecnico-${new Date().toISOString().slice(0, 10)}.json`
    anchor.click()
    URL.revokeObjectURL(url)
  }

  const handleImportJson = (file: File) => {
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result || '{}'))
        if (!parsed || typeof parsed !== 'object') throw new Error('invalid')
        const incoming = {
          familias: Array.isArray(parsed.familias) ? parsed.familias : [],
          grupos: Array.isArray(parsed.grupos) ? parsed.grupos : [],
          modelos: Array.isArray(parsed.modelos) ? parsed.modelos : [],
        }
        const current = {
          familias,
          grupos,
          modelos,
        }
        const merged = mergeManuaisPayloads(current, incoming)
        setManuaisFamilias(merged.familias)
        setManuaisGrupos(merged.grupos)
        setManuaisModelos(merged.modelos)
        persistManuaisFG(merged.familias, merged.grupos, merged.modelos)
      } catch {
        alert(tr('bibliaNonatoErroImport', 'Ficheiro JSON inválido ou corrompido.'))
      }
    }
    reader.readAsText(file)
  }

  const navQuery = navSearch.trim().toLowerCase()

  const filteredFamilias = useMemo(() => {
    if (!navQuery) return familiasListManuais
    return familiasListManuais.filter((familia) => {
      if (familia.toLowerCase().includes(navQuery)) return true
      return getModelosForFamilia(familia, grupos, modelos).some((m) =>
        m.nome.toLowerCase().includes(navQuery)
      )
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

  const breadcrumbFamilia =
    selectedModelo != null
      ? familiaForModelo(selectedModelo, grupos) || selectedFamiliaManuais
      : selectedFamiliaManuais

  const breadcrumb =
    selectedModelo && breadcrumbFamilia
      ? `${breadcrumbFamilia} › ${displayMarcaNome(selectedGrupo?.nome || DEFAULT_GRUPO_NAME)} › ${selectedModelo.nome}`
      : breadcrumbFamilia || tr('manuaisHubSelectModelTitle', 'Selecione um modelo')

  return (
    <div className="manuais-pro">
      <section className="manuais-pro__hero">
        <div className="manuais-pro__hero-glow" aria-hidden />
        <div className="manuais-pro__hero-top">
          <div className="manuais-pro__hero-brand">
            <span className="manuais-pro__hero-icon" aria-hidden>
              {hubIcon}
            </span>
            <div>
              <p className="manuais-pro__eyebrow">{hubEyebrow}</p>
              <h1 className="manuais-pro__title">{hubTitle}</h1>
              <p className="manuais-pro__lead">{hubLead}</p>
            </div>
          </div>
          <div className="manuais-pro__hero-actions">
            <LogoComponent size="small" />
            <button
              type="button"
              className="manuais-pro__tool-btn"
              onClick={handleExportJson}
              title={tr('conhecimentoTecnicoExportar', tr('bibliaNonatoExportar', 'Exportar JSON'))}
            >
              JSON ↓
            </button>
            <button
              type="button"
              className="manuais-pro__tool-btn"
              onClick={() => {
                const msg = tr(
                  'conhecimentoTecnicoConfirmImport',
                  tr(
                    'bibliaNonatoConfirmImport',
                    'Importar combina os dados do ficheiro com os actuais. Continuar?'
                  )
                )
                if (window.confirm(msg)) importInputRef.current?.click()
              }}
              title={tr('conhecimentoTecnicoImportar', tr('bibliaNonatoImportar', 'Importar JSON'))}
            >
              JSON ↑
            </button>
            <input
              ref={importInputRef}
              type="file"
              accept="application/json,.json"
              className="manuais-pro__file-input"
              style={{ display: 'none' }}
              onChange={(e) => {
                const f = e.target.files?.[0]
                if (f) handleImportJson(f)
                e.target.value = ''
              }}
            />
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
              title={tr('paginaInicial', 'Página Inicial')}
            >
              Início
            </button>
          </div>
        </div>
        <div className="manuais-pro__kpis">
          <div className="manuais-pro__kpi">
            <span>{tr('manuaisFamiliasLabel', 'Familias')}</span>
            <strong>{familias.length}</strong>
          </div>
          <div className="manuais-pro__kpi">
            <span>{tr('bibliaMarcasLabel', 'Marcas')}</span>
            <strong>{marcasVisiveis || grupos.length}</strong>
          </div>
          <div className="manuais-pro__kpi">
            <span>{tr('manuaisModelosLabel', 'Modelos')}</span>
            <strong>{modelos.length}</strong>
          </div>
          <div className="manuais-pro__kpi">
            <span>{tr('manuaisDocumentos', 'Documentos')}</span>
            <strong>{documentosCount}</strong>
          </div>
          <div className="manuais-pro__kpi">
            <span>{tr('bibliaAnexosLabel', 'Anexos')}</span>
            <strong>{anexosCount}</strong>
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
              placeholder={tr('manuaisHubSearchPlaceholder', 'Pesquisar familia ou modelo...')}
            />
          </div>

          <div className="manuais-pro__quick-add">
            <div className="manuais-pro__quick-add-block">
              <label className="manuais-pro__label">{tr('manuaisFamiliasLabel', 'Família')}</label>
              <div className="manuais-pro__quick-row">
                <input
                  type="text"
                  className="manuais-pro__input"
                  value={novaFamiliaManuais}
                  onChange={(e) => setNovaFamiliaManuais(e.target.value)}
                  placeholder={tr('manuaisNovaFamiliaPlaceholder', 'Nova família...')}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddFamilia()}
                />
                <button type="button" className="manuais-pro__btn manuais-pro__btn--primary" onClick={handleAddFamilia}>
                  +
                </button>
              </div>
            </div>
            <div className="manuais-pro__quick-add-block">
              <label className="manuais-pro__label">{tr('bibliaMarcaLabel', 'Marca / linha')}</label>
              <div className="manuais-pro__quick-row">
                <input
                  type="text"
                  className="manuais-pro__input"
                  value={novoGrupoManuais}
                  onChange={(e) => setNovoGrupoManuais(e.target.value)}
                  placeholder={tr('bibliaNovaMarcaPlaceholder', 'Nova marca...')}
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
                  disabled={!selectedFamiliaManuais}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddModelo()}
                />
                <button
                  type="button"
                  className="manuais-pro__btn manuais-pro__btn--primary"
                  onClick={handleAddModelo}
                  disabled={!selectedFamiliaManuais}
                >
                  +
                </button>
              </div>
            </div>
          </div>

          <div className="manuais-pro__tree">
            {filteredFamilias.length === 0 ? (
              <p className="manuais-pro__empty-hint">{tr('manuaisNenhumaFamilia', 'Nenhuma familia. Crie uma acima.')}</p>
            ) : (
              filteredFamilias.map((familia) => {
                const famGrupos = grupos
                  .filter((g) => g.familia === familia)
                  .filter((g) => {
                    if (!navQuery) return true
                    if (familia.toLowerCase().includes(navQuery)) return true
                    if (displayMarcaNome(g.nome).toLowerCase().includes(navQuery)) return true
                    return modelos
                      .filter((m) => m.grupoId === g.id)
                      .some((m) => m.nome.toLowerCase().includes(navQuery))
                  })
                  .sort((a, b) => displayMarcaNome(a.nome).localeCompare(displayMarcaNome(b.nome), undefined, { sensitivity: 'base' }))
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
                        {famExpanded ? 'v' : '>'}
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
                            OK
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
                            <span className="manuais-pro__row-meta">{getModelosForFamilia(familia, grupos, modelos).length}</span>
                          </button>
                          <ManuaisRowActions
                            onEdit={(ev) => {
                              ev.stopPropagation()
                              setEditingFamiliaManuais(familia)
                              setEditingFamiliaManuaisValue(familia)
                            }}
                            onDelete={(ev) => {
                              ev.stopPropagation()
                              handleDeleteFamilia(familia)
                            }}
                            editTitle={tr('editar', 'Editar')}
                            deleteTitle={tr('excluir', 'Excluir')}
                          />
                        </>
                      )}
                    </div>

                    {famExpanded &&
                      famGrupos.map((grupo) => {
                        const grupoModelos = modelos
                          .filter((m) => m.grupoId === grupo.id)
                          .filter(
                            (m) =>
                              !navQuery ||
                              familia.toLowerCase().includes(navQuery) ||
                              displayMarcaNome(grupo.nome).toLowerCase().includes(navQuery) ||
                              m.nome.toLowerCase().includes(navQuery)
                          )
                          .sort((a, b) => a.nome.localeCompare(b.nome, undefined, { sensitivity: 'base' }))
                        const grpExpanded = expandedGrupos[grupo.id] ?? selectedGrupoManuais === grupo.id
                        return (
                          <div key={grupo.id} className="manuais-pro__tree-block manuais-pro__tree-block--nested">
                            <div
                              className={`manuais-pro__row manuais-pro__row--grupo ${selectedGrupoManuais === grupo.id ? 'is-active' : ''}`}
                            >
                              <button
                                type="button"
                                className="manuais-pro__expand"
                                onClick={() => setExpandedGrupos((p) => ({ ...p, [grupo.id]: !grpExpanded }))}
                                aria-expanded={grpExpanded}
                              >
                                {grpExpanded ? 'v' : '>'}
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
                                    OK
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
                                      setExpandedFamilias((p) => ({ ...p, [familia]: true }))
                                      setExpandedGrupos((p) => ({ ...p, [grupo.id]: true }))
                                    }}
                                  >
                                    <span className="manuais-pro__row-name">{displayMarcaNome(grupo.nome)}</span>
                                    <span className="manuais-pro__row-meta">{grupoModelos.length}</span>
                                  </button>
                                  {grupo.nome !== DEFAULT_GRUPO_NAME && (
                                    <ManuaisRowActions
                                      onEdit={(ev) => {
                                        ev.stopPropagation()
                                        setEditingGrupoManuaisId(grupo.id)
                                        setEditingGrupoManuaisValue(grupo.nome)
                                      }}
                                      onDelete={(ev) => {
                                        ev.stopPropagation()
                                        handleDeleteGrupo(grupo.id, grupo.nome)
                                      }}
                                      editTitle={tr('editar', 'Editar')}
                                      deleteTitle={tr('excluir', 'Excluir')}
                                    />
                                  )}
                                </>
                              )}
                            </div>

                            {grpExpanded &&
                              grupoModelos.map((modelo) => (
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
                                        OK
                                      </button>
                                    </>
                                  ) : (
                                    <>
                                      <button
                                        type="button"
                                        className="manuais-pro__row-label"
                                        onClick={() => {
                                          setSelectedFamiliaManuais(familia)
                                          setSelectedGrupoManuais(modelo.grupoId)
                                          setSelectedModeloManuaisId(modelo.id)
                                          setMainTab('ficha')
                                        }}
                                      >
                                        <span className="manuais-pro__row-name">{modelo.nome}</span>
                                      </button>
                                      <ManuaisRowActions
                                        onEdit={(ev) => {
                                          ev.stopPropagation()
                                          setEditingModeloManuaisId(modelo.id)
                                          setEditingModeloManuaisValue(modelo.nome)
                                        }}
                                        onDelete={(ev) => {
                                          ev.stopPropagation()
                                          handleDeleteModelo(modelo.id, modelo.nome)
                                        }}
                                        editTitle={tr('editar', 'Editar')}
                                        deleteTitle={tr('excluir', 'Excluir')}
                                      />
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
              <p className="manuais-pro__breadcrumb-label">{tr('manuaisConteudoModelo', 'Conteúdo do modelo')}</p>
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
                  'Escolha um modelo na estrutura à esquerda para gerir ficha técnica, documentos e imagens.'
                )}
              </p>
            </div>
          ) : (
            <>
              <div className="manuais-pro__tabs" role="tablist">
                <button
                  type="button"
                  role="tab"
                  className={`manuais-pro__tab ${mainTab === 'ficha' ? 'is-active' : ''}`}
                  onClick={() => setMainTab('ficha')}
                >
                  {tr('bibliaFichaTab', 'Ficha tecnica')}
                </button>
                <button
                  type="button"
                  role="tab"
                  className={`manuais-pro__tab ${mainTab === 'docs' ? 'is-active' : ''}`}
                  onClick={() => setMainTab('docs')}
                >
                  {tr('manuaisDocumentosImagens', 'Documentos e imagens')}
                </button>
                <button
                  type="button"
                  role="tab"
                  className={`manuais-pro__tab ${mainTab === 'equip' ? 'is-active' : ''}`}
                  onClick={() => setMainTab('equip')}
                >
                  {tr('manuaisEquipamentosAssociados', 'Equipamentos')} ({equipamentosAssociados.length})
                </button>
              </div>

              {mainTab === 'equip' && (
                <div className="manuais-pro__panels">
                  {equipamentosAssociados.length === 0 ? (
                    <div className="manuais-pro__placeholder manuais-pro__placeholder--compact">
                      <p>{tr('manuaisSemEquipamentos', 'Nenhum equipamento associado a este modelo.')}</p>
                    </div>
                  ) : (
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
                            {e.numeroSerie && <small>Serie: {e.numeroSerie}</small>}
                          </div>
                        ))}
                      </div>
                    </section>
                  )}
                </div>
              )}

              {mainTab === 'docs' && (
                <div className="manuais-pro__panels">
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
                              X
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
                          <ProImageHoverPreview
                            src={img.dados}
                            alt={img.nome}
                            label={img.nome}
                            thumbClassName="manuais-pro__image-thumb"
                          />
                          <button
                            type="button"
                            className="manuais-pro__act manuais-pro__act--danger manuais-pro__image-remove"
                            onClick={() => removeImagem(selectedModelo.id, img.id)}
                            title={tr('excluir', 'Excluir')}
                            aria-label={tr('excluir', 'Excluir')}
                          >
                            <span aria-hidden>×</span>
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

                  <section className="manuais-pro__panel manuais-pro__panel--full">
                    <h3 className="manuais-pro__panel-title">{tr('bibliaAnexosLabel', 'Anexos tecnicos')}</h3>
                    {selectedModelAnexos.length === 0 ? (
                      <p className="manuais-pro__empty-hint">{tr('bibliaSemAnexos', 'Nenhum anexo.')}</p>
                    ) : (
                      <ul className="manuais-pro__doc-list">
                        {selectedModelAnexos.map((a) => (
                          <li key={a.id} className="manuais-pro__doc-item">
                            <a href={a.dataUrl} download={a.nome} target="_blank" rel="noopener noreferrer" title={a.nome}>
                              {a.nome}
                            </a>
                            <button
                              type="button"
                              className="manuais-pro__act manuais-pro__act--danger"
                              onClick={() => removeAnexo(selectedModelo.id, a.id)}
                              title={tr('excluir', 'Excluir')}
                            >
                              X
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                    <label className="manuais-pro__upload">
                      <input
                        type="file"
                        className="manuais-pro__file-input"
                        onChange={(e) => {
                          const f = e.target.files?.[0]
                          if (f) {
                            addAnexo(selectedModelo.id, f)
                            e.target.value = ''
                          }
                        }}
                      />
                      {tr('bibliaAdicionarAnexo', '+ Adicionar anexo')}
                    </label>
                  </section>
                </div>
              )}

              {mainTab === 'ficha' && (
                <div className="manuais-pro__panels">
                  <section className="manuais-pro__panel">
                    <h3 className="manuais-pro__panel-title">{tr('bibliaSoftware', 'Software / PLC')}</h3>
                    <AssistTextarea
                      value={selectedModelo.software ?? selectedModelo.infoTecnicas ?? ''}
                      onValueChange={(v) => updateModelo(selectedModelo.id, { software: v, infoTecnicas: v })}
                      placeholder={tr('bibliaSoftwarePlaceholder', 'Versoes, parametros, backups...')}
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

                  <section className="manuais-pro__panel manuais-pro__panel--wide">
                    <h3 className="manuais-pro__panel-title">{tr('bibliaNotas', 'Notas e observacoes')}</h3>
                    <AssistTextarea
                      value={selectedModelo.notas ?? ''}
                      onValueChange={(v) => updateModelo(selectedModelo.id, { notas: v })}
                      placeholder={tr('bibliaNotasPlaceholder', 'Historico, peculiares, contactos...')}
                      rows={5}
                      style={textareaStyle}
                    />
                  </section>
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  )
}
