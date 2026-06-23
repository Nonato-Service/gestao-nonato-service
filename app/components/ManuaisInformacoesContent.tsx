'use client'

import React, { useMemo, useRef, useState } from 'react'
import {
  EquipamentoManuaisRef,
  ManuaisDocumento,
  ManuaisGrupo,
  ManuaisImagem,
  ManuaisModelo,
} from '../lib/manuaisTypes'
import type { BibliaAnexo, BibliaSecao } from './bibliaNonatoTypes'
import { BIBLIA_ANEXO_MAX_BYTES, BIBLIA_ANEXO_MAX_PER_MODEL, inferBibliaSecaoFromName, resolveBibliaSecao } from './bibliaNonatoTypes'
import { syncConhecimentoTecnicoLegacyStores, mergeManuaisPayloads } from '../lib/conhecimentoTecnicoMerge'
import { AssistTextarea } from './AssistTextFields'
import { saveManuaisFamiliasGruposToIdb } from '../utils/manuaisIndexedDb'
import { ProImageHoverPreview } from './ProImageHoverPreview'
import { ConhecimentoFileViewer, ConhecimentoFileItem } from './ConhecimentoFileViewer'

let manuaisSaveDebounceTimer: ReturnType<typeof setTimeout> | null = null
let manuaisSaveAlertShownOnce = false

const MANUAIS_STORAGE_KEY = 'nonato-manuais-familias-grupos'
const DEFAULT_GRUPO_NAME = '__default__'
const MANUAIS_FOLDER_IMPORT_MAX_BYTES = 120 * 1024 * 1024
const MANUAIS_ZIP_IMPORT_MAX_BYTES = 200 * 1024 * 1024
const MANUAIS_FOLDER_IMPORT_EXT = /\.(pdf|txt|doc|docx|png|jpe?g|gif|webp)$/i

function formatManuaisBytes(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  if (bytes >= 1024) return `${Math.round(bytes / 1024)} KB`
  return `${bytes} B`
}

function isZipArchiveFileNameOrMime(name: string, type: string): boolean {
  const n = name.trim().toLowerCase()
  if (/\.(zip|zipx)$/i.test(n)) return true
  const t = (type || '').trim().toLowerCase()
  return (
    t === 'application/zip' ||
    t === 'application/x-zip-compressed' ||
    t === 'application/x-zip' ||
    t === 'multipart/x-zip'
  )
}

async function fileHasZipMagic(file: File): Promise<boolean> {
  try {
    const head = new Uint8Array(await file.slice(0, 4).arrayBuffer())
    if (head.length < 4) return false
    if (head[0] !== 0x50 || head[1] !== 0x4b) return false
    return (
      (head[2] === 0x03 && head[3] === 0x04) ||
      (head[2] === 0x05 && head[3] === 0x06) ||
      (head[2] === 0x07 && head[3] === 0x08)
    )
  } catch {
    return false
  }
}

async function isZipArchiveFile(file: File): Promise<boolean> {
  if (isZipArchiveFileNameOrMime(file.name, file.type)) return true
  return fileHasZipMagic(file)
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result || ''))
    reader.onerror = () => reject(reader.error ?? new Error('read_failed'))
    reader.readAsDataURL(file)
  })
}

function shouldImportManualFolderFile(file: File): boolean {
  return MANUAIS_FOLDER_IMPORT_EXT.test(file.name)
}

function manualFolderDisplayName(file: File): string {
  const rel = (file as File & { webkitRelativePath?: string }).webkitRelativePath?.trim()
  if (rel) {
    const parts = rel.split(/[/\\]/)
    return parts.length > 1 ? parts.slice(1).join('/') : rel
  }
  return file.name
}

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

  const [navSearch, setNavSearch] = useState('')
  const [expandedFamilias, setExpandedFamilias] = useState<Record<string, boolean>>({})
  const [expandedGrupos, setExpandedGrupos] = useState<Record<string, boolean>>({})
  const [mainTab, setMainTab] = useState<'ficha' | 'docs' | 'equip'>('ficha')
  const [bibliaSecaoTab, setBibliaSecaoTab] = useState<BibliaSecao>('software')
  const [manuaisImportProgress, setManuaisImportProgress] = useState<{ current: number; total: number } | null>(
    null
  )
  const manuaisFolderInputRef = useRef<HTMLInputElement>(null)
  const manuaisZipInputRef = useRef<HTMLInputElement>(null)
  const importInputRef = useRef<HTMLInputElement>(null)

  const uploadSecao = (): BibliaSecao | undefined => (hubMode === 'biblia' ? bibliaSecaoTab : undefined)

  const bibliaSecaoTabs: { id: BibliaSecao; labelKey: string; fallback: string }[] = [
    { id: 'software', labelKey: 'bibliaSoftware', fallback: 'Software / PLC' },
    { id: 'mecanica', labelKey: 'manuaisInfoMecanicas', fallback: 'Mecânica' },
    { id: 'eletrica', labelKey: 'manuaisInfoEletricas', fallback: 'Elétrica' },
    { id: 'notas', labelKey: 'bibliaNotas', fallback: 'Notas' },
  ]

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
    if (isZipArchiveFileNameOrMime(file.name, file.type)) {
      void addDocumentoZip(modeloId, file)
      return
    }
    void fileHasZipMagic(file).then((isZip) => {
      if (isZip) {
        void addDocumentoZip(modeloId, file)
        return
      }
      if (manuaisSaveDebounceTimer) {
        clearTimeout(manuaisSaveDebounceTimer)
        manuaisSaveDebounceTimer = null
      }
      const reader = new FileReader()
      reader.onload = () => {
        const id = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `doc-${Date.now()}`
        const novo: ManuaisDocumento = {
          id,
          nome: file.name,
          tipo: file.type || (file.name.toLowerCase().endsWith('.pdf') ? 'application/pdf' : 'application/octet-stream'),
          dados: reader.result as string,
          ...(uploadSecao() ? { secao: uploadSecao() } : {}),
        }
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
    })
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

  const appendDocumentosToModelo = async (modeloId: string, novos: ManuaisDocumento[]) => {
    if (novos.length === 0) return
    if (manuaisSaveDebounceTimer) {
      clearTimeout(manuaisSaveDebounceTimer)
      manuaisSaveDebounceTimer = null
    }
    let snapshot: ManuaisModelo[] = []
    setManuaisModelos((prev) => {
      snapshot = prev.map((mo) => {
        if (mo.id !== modeloId) return mo
        const docs = Array.isArray(mo.documentos) ? mo.documentos : []
        return { ...mo, documentos: [...docs, ...novos] }
      })
      manuaisModelosRef.current = snapshot
      return snapshot
    })
    await persistModelosImmediate(snapshot)
  }

  const addDocumentosFromFolder = async (modeloId: string, fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return
    const files = Array.from(fileList).filter(shouldImportManualFolderFile)
    if (files.length === 0) {
      window.alert(
        tr(
          'manuaisImportacaoSemFicheiros',
          'Nenhum PDF ou documento compatível encontrado na pasta (PDF, TXT, Word, imagens).'
        )
      )
      return
    }
    const totalBytes = files.reduce((sum, f) => sum + f.size, 0)
    if (totalBytes > MANUAIS_FOLDER_IMPORT_MAX_BYTES) {
      window.alert(
        tr(
          'manuaisImportacaoMuitoGrande',
          `Pacote demasiado grande (máx. ${formatManuaisBytes(MANUAIS_FOLDER_IMPORT_MAX_BYTES)}). Compacte a pasta inteira em ZIP e use «Importar pacote ZIP».`
        )
      )
      return
    }
    const confirmMsg = tr(
      'manuaisConfirmarImportPasta',
      `Importar ${files.length} ficheiro(s) (${formatManuaisBytes(totalBytes)}) para este modelo?`
    )
      .replace(/\{n\}/g, String(files.length))
      .replace(/\{size\}/g, formatManuaisBytes(totalBytes))
    if (!window.confirm(confirmMsg)) return

    setManuaisImportProgress({ current: 0, total: files.length })
    const novos: ManuaisDocumento[] = []
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        const dados = await readFileAsDataUrl(file)
        const rel = (file as File & { webkitRelativePath?: string }).webkitRelativePath?.trim()
        const id =
          typeof crypto !== 'undefined' && crypto.randomUUID
            ? crypto.randomUUID()
            : `doc-${Date.now()}-${i}`
        novos.push({
          id,
          nome: manualFolderDisplayName(file),
          tipo:
            file.type ||
            (/\.pdf$/i.test(file.name) ? 'application/pdf' : 'application/octet-stream'),
          dados,
          caminhoRelativo: rel || undefined,
          secao: uploadSecao() || inferBibliaSecaoFromName(rel || file.name) || undefined,
        })
        setManuaisImportProgress({ current: i + 1, total: files.length })
      }
      await appendDocumentosToModelo(modeloId, novos)
      window.alert(
        tr('manuaisImportacaoOk', `Importados ${novos.length} ficheiro(s).`).replace(/\{n\}/g, String(novos.length))
      )
    } catch (err) {
      console.error('Importação de pasta de manuais:', err)
      window.alert(tr('manuaisErroAoGuardar', 'Não foi possível guardar. O navegador pode estar sem espaço.'))
    } finally {
      setManuaisImportProgress(null)
    }
  }

  const addDocumentoZip = async (modeloId: string, file: File) => {
    const zipOk = await isZipArchiveFile(file)
    if (!zipOk) {
      window.alert(
        `${tr('manuaisImportacaoZipInvalido', 'Selecione um ficheiro .zip com a pasta do manual.')}\n\n«${file.name}»\n\n${tr(
          'manuaisImportacaoZipInvalidoHint',
          'Se for .rar ou .7z, compacte de novo como .zip no Windows (clique direito → Enviar para → Pasta comprimida).'
        )}`
      )
      return
    }
    if (file.size > MANUAIS_ZIP_IMPORT_MAX_BYTES) {
      window.alert(
        tr(
          'manuaisImportacaoZipGrande',
          `ZIP demasiado grande (máx. ${formatManuaisBytes(MANUAIS_ZIP_IMPORT_MAX_BYTES)}).`
        )
      )
      return
    }
    if (
      !window.confirm(
        tr(
          'manuaisConfirmarImportZip',
          `Guardar o pacote «${file.name}» (${formatManuaisBytes(file.size)}) neste modelo? Pode descarregar depois e extrair no PC (ex.: Start.exe HOMAG).`
        )
          .replace(/\{nome\}/g, file.name)
          .replace(/\{size\}/g, formatManuaisBytes(file.size))
      )
    ) {
      return
    }
    setManuaisImportProgress({ current: 0, total: 1 })
    try {
      const dados = await readFileAsDataUrl(file)
      const id = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `zip-${Date.now()}`
      await appendDocumentosToModelo(modeloId, [
        {
          id,
          nome: /\.(zip|zipx)$/i.test(file.name.trim()) ? file.name : `${file.name.replace(/\.+$/, '')}.zip`,
          tipo: 'application/zip',
          dados,
        },
      ])
      window.alert(tr('manuaisImportacaoZipOk', 'Pacote ZIP guardado. Use Descarregar para extrair no computador.'))
    } catch (err) {
      console.error('Importação ZIP de manuais:', err)
      window.alert(tr('manuaisErroAoGuardar', 'Não foi possível guardar. O navegador pode estar sem espaço.'))
    } finally {
      setManuaisImportProgress(null)
    }
  }

  const addImagem = (modeloId: string, file: File) => {
    if (manuaisSaveDebounceTimer) {
      clearTimeout(manuaisSaveDebounceTimer)
      manuaisSaveDebounceTimer = null
    }
    const reader = new FileReader()
    reader.onload = () => {
      const id = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `img-${Date.now()}`
      const novo: ManuaisImagem = {
        id,
        nome: file.name,
        dados: reader.result as string,
        ...(uploadSecao() ? { secao: uploadSecao() } : {}),
      }
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
        mime: file.type || (/\.pdf$/i.test(file.name) ? 'application/pdf' : 'application/octet-stream'),
        dataUrl: reader.result as string,
        ...(uploadSecao() ? { secao: uploadSecao() } : {}),
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

  const filterByBibliaSecao = <T extends { secao?: BibliaSecao; nome?: string }>(items: T[]): T[] => {
    if (hubMode !== 'biblia') return items
    return items.filter((item) => resolveBibliaSecao(item) === bibliaSecaoTab)
  }

  const visibleModelDocs = filterByBibliaSecao(selectedModelDocs)
  const visibleModelImgs = filterByBibliaSecao(selectedModelImgs)
  const visibleModelAnexos = filterByBibliaSecao(selectedModelAnexos)
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
              <span>{tr('bibliaNonatoExportarBtn', 'Exportar')}</span>
              <span aria-hidden="true">↓</span>
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
              <span>{tr('bibliaNonatoImportarBtn', 'Importar')}</span>
              <span aria-hidden="true">↑</span>
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
              className="manuais-pro__tool-btn manuais-pro__tool-btn--icon"
              onClick={() => closeTab(activeTabId || '')}
              title={tr('voltar', 'Voltar')}
              aria-label={tr('voltar', 'Voltar')}
            >
              &larr;
            </button>
            <button
              type="button"
              className="manuais-pro__tool-btn manuais-pro__tool-btn--accent"
              onClick={voltarPaginaInicial}
              title={tr('paginaInicial', 'Página Inicial')}
            >
              {tr('paginaInicial', 'Início')}
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
          ) : hubMode === 'biblia' ? (
            <>
              <div className="manuais-pro__tabs" role="tablist">
                {bibliaSecaoTabs.map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    role="tab"
                    className={`manuais-pro__tab ${bibliaSecaoTab === tab.id ? 'is-active' : ''}`}
                    onClick={() => setBibliaSecaoTab(tab.id)}
                  >
                    {tr(tab.labelKey, tab.fallback)}
                  </button>
                ))}
              </div>

              <div className="manuais-pro__panels">
                <section className="manuais-pro__panel manuais-pro__panel--full">
                  <h3 className="manuais-pro__panel-title">
                    {tr(
                      bibliaSecaoTabs.find((t) => t.id === bibliaSecaoTab)?.labelKey || 'bibliaSoftware',
                      bibliaSecaoTabs.find((t) => t.id === bibliaSecaoTab)?.fallback || 'Software / PLC'
                    )}
                  </h3>
                  <AssistTextarea
                    value={
                      bibliaSecaoTab === 'software'
                        ? selectedModelo.software ?? selectedModelo.infoTecnicas ?? ''
                        : bibliaSecaoTab === 'mecanica'
                          ? selectedModelo.infoMecanicas ?? ''
                          : bibliaSecaoTab === 'eletrica'
                            ? selectedModelo.infoEletricas ?? ''
                            : selectedModelo.notas ?? ''
                    }
                    onValueChange={(v) => {
                      if (bibliaSecaoTab === 'software') {
                        updateModelo(selectedModelo.id, { software: v, infoTecnicas: v })
                      } else if (bibliaSecaoTab === 'mecanica') {
                        updateModelo(selectedModelo.id, { infoMecanicas: v })
                      } else if (bibliaSecaoTab === 'eletrica') {
                        updateModelo(selectedModelo.id, { infoEletricas: v })
                      } else {
                        updateModelo(selectedModelo.id, { notas: v })
                      }
                    }}
                    placeholder={
                      bibliaSecaoTab === 'software'
                        ? tr('bibliaSoftwarePlaceholder', 'Versões, parâmetros, backups…')
                        : bibliaSecaoTab === 'mecanica'
                          ? tr('manuaisInfoMecanicasPlaceholder', 'Calibração, peças, manutenção…')
                          : bibliaSecaoTab === 'eletrica'
                            ? tr('manuaisInfoEletricasPlaceholder', 'Esquemas, fusíveis, motores, IO…')
                            : tr('bibliaNotasPlaceholder', 'Histórico, peculiaridades, contactos…')
                    }
                    rows={6}
                    style={textareaStyle}
                  />
                </section>

                <section className="manuais-pro__panel manuais-pro__panel--full">
                  <h3 className="manuais-pro__panel-title">{tr('manuaisDocumentos', 'Documentos')}</h3>
                  <p className="manuais-pro__panel-hint">
                    {tr(
                      'bibliaSecaoFicheirosHint',
                      'PDFs e ficheiros desta secção. Ao mudar de aba (Software, Mecânica, Elétrica, Notas) vê só os ficheiros dessa secção.'
                    )}
                  </p>
                  <ConhecimentoFileViewer
                    items={visibleModelDocs.map(
                      (d): ConhecimentoFileItem => ({
                        id: d.id,
                        nome: d.caminhoRelativo || d.nome,
                        dataUrl: d.dados,
                        tipo: d.tipo,
                      })
                    )}
                    onRemove={(docId) => removeDocumento(selectedModelo.id, docId)}
                    tr={tr}
                    emptyHint={tr('manuaisHubNoDocuments', 'Nenhum documento nesta secção.')}
                    uploadLabel={tr('manuaisAdicionarDocumento', '+ Adicionar documento(s)')}
                    accept=".pdf,application/pdf,.doc,.docx,image/*,.txt,.md,.csv,.json"
                    onUpload={(files) => files.forEach((f) => addDocumento(selectedModelo.id, f))}
                  />
                </section>

                <section className="manuais-pro__panel">
                  <h3 className="manuais-pro__panel-title">{tr('manuaisImagens', 'Imagens')}</h3>
                  <p className="manuais-pro__panel-hint">
                    {tr('bibliaSecaoImagensHint', 'Fotos e esquemas desta secção. Use «+ Adicionar imagem(ns)».')}
                  </p>
                  <div className="manuais-pro__image-grid">
                    {visibleModelImgs.map((img) => (
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
                      multiple
                      className="manuais-pro__file-input"
                      onChange={(e) => {
                        const list = e.target.files ? Array.from(e.target.files) : []
                        list.forEach((f) => addImagem(selectedModelo.id, f))
                        e.target.value = ''
                      }}
                    />
                    {tr('manuaisAdicionarImagem', '+ Adicionar imagem(ns)')}
                  </label>
                </section>

                <section className="manuais-pro__panel manuais-pro__panel--full">
                  <h3 className="manuais-pro__panel-title">{tr('bibliaAnexosLabel', 'Anexos técnicos')}</h3>
                  <p className="manuais-pro__panel-hint">
                    {tr(
                      'bibliaNonatoAnexosAjuda',
                      'PDF, Word (.doc/.docx) ou imagens desta secção. Pode seleccionar vários ficheiros de uma vez.'
                    )}
                  </p>
                  <ConhecimentoFileViewer
                    items={visibleModelAnexos.map(
                      (a): ConhecimentoFileItem => ({
                        id: a.id,
                        nome: a.nome,
                        dataUrl: a.dataUrl,
                        mime: a.mime,
                      })
                    )}
                    onRemove={(anexoId) => removeAnexo(selectedModelo.id, anexoId)}
                    tr={tr}
                    emptyHint={tr('bibliaSemAnexos', 'Nenhum anexo nesta secção.')}
                    uploadLabel={tr('bibliaAdicionarAnexo', '+ Adicionar anexo(s)')}
                    accept=".pdf,.png,.jpg,.jpeg,.gif,.webp,.doc,.docx,.txt,.md,.csv,.json"
                    onUpload={(files) => files.forEach((f) => addAnexo(selectedModelo.id, f))}
                  />
                </section>
              </div>
            </>
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
                  <section className="manuais-pro__panel manuais-pro__panel--full">
                    <h3 className="manuais-pro__panel-title">{tr('manuaisDocumentos', 'Documentos')}</h3>
                    <p className="manuais-pro__panel-hint">
                      {tr(
                        'bibliaDocumentosHint',
                        'Visualize PDFs e ficheiros no ecrã. Pode seleccionar vários PDFs de uma vez em «+ Adicionar documento(s)».'
                      )}
                    </p>
                    <p className="manuais-pro__panel-hint">
                      {tr(
                        'manuaisPacotePastaHint',
                        'Manuais HOMAG / CD com vários ficheiros: compacte a pasta em ZIP (recomendado, ~80 MB) ou importe a pasta — entram PDF, TXT, Word e imagens. O Start.exe só funciona no PC após descarregar o ZIP.'
                      )}
                    </p>
                    {manuaisImportProgress ? (
                      <p className="manuais-pro__import-progress" role="status">
                        {tr('manuaisImportandoProgress', `A importar ${manuaisImportProgress.current}/${manuaisImportProgress.total}…`)
                          .replace(/\{n\}/g, String(manuaisImportProgress.current))
                          .replace(/\{total\}/g, String(manuaisImportProgress.total))}
                      </p>
                    ) : null}
                    <div className="manuais-pro__bulk-upload">
                      <label className="manuais-pro__upload">
                        <input
                          ref={manuaisFolderInputRef}
                          type="file"
                          className="manuais-pro__file-input"
                          multiple
                          /* @ts-expect-error webkitdirectory não está nos tipos React */
                          webkitdirectory=""
                          directory=""
                          onChange={(e) => {
                            const list = e.target.files
                            void addDocumentosFromFolder(selectedModelo.id, list)
                            e.target.value = ''
                          }}
                        />
                        {tr('manuaisImportarPasta', '+ Importar pasta (PDFs…)')}
                      </label>
                      <label className="manuais-pro__upload">
                        <input
                          ref={manuaisZipInputRef}
                          type="file"
                          className="manuais-pro__file-input"
                          onChange={(e) => {
                            const f = e.target.files?.[0]
                            if (f) {
                              void addDocumentoZip(selectedModelo.id, f)
                              e.target.value = ''
                            }
                          }}
                        />
                        {tr('manuaisImportarZip', '+ Importar pacote ZIP')}
                      </label>
                    </div>
                    <ConhecimentoFileViewer
                      items={selectedModelDocs.map(
                        (d): ConhecimentoFileItem => ({
                          id: d.id,
                          nome: d.caminhoRelativo || d.nome,
                          dataUrl: d.dados,
                          tipo: d.tipo,
                        })
                      )}
                      onRemove={(docId) => removeDocumento(selectedModelo.id, docId)}
                      tr={tr}
                      emptyHint={tr('manuaisHubNoDocuments', 'Nenhum documento.')}
                      uploadLabel={tr('manuaisAdicionarDocumento', '+ Adicionar documento')}
                      accept=".pdf,application/pdf,.doc,.docx,image/*,.txt,.md,.csv,.json,.zip,application/zip,application/x-zip-compressed"
                      onUpload={(files) => files.forEach((f) => addDocumento(selectedModelo.id, f))}
                    />
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
                    <h3 className="manuais-pro__panel-title">{tr('bibliaAnexosLabel', 'Anexos técnicos')}</h3>
                    <p className="manuais-pro__panel-hint">
                      {tr(
                        'bibliaNonatoAnexosAjuda',
                        'PDF, Word (.doc/.docx) ou imagens. Pode seleccionar vários ficheiros de uma vez.'
                      )}
                    </p>
                    <ConhecimentoFileViewer
                      items={selectedModelAnexos.map(
                        (a): ConhecimentoFileItem => ({
                          id: a.id,
                          nome: a.nome,
                          dataUrl: a.dataUrl,
                          mime: a.mime,
                        })
                      )}
                      onRemove={(anexoId) => removeAnexo(selectedModelo.id, anexoId)}
                      tr={tr}
                      emptyHint={tr('bibliaSemAnexos', 'Nenhum anexo.')}
                      uploadLabel={tr('bibliaAdicionarAnexo', '+ Adicionar anexo')}
                      accept=".pdf,.png,.jpg,.jpeg,.gif,.webp,.doc,.docx,.txt,.md,.csv,.json"
                      onUpload={(files) => files.forEach((f) => addAnexo(selectedModelo.id, f))}
                    />
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
