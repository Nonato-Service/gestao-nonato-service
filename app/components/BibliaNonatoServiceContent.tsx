'use client'

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  BIBLIA_ANEXO_MAX_BYTES,
  BIBLIA_ANEXO_MAX_PER_MODEL,
  BIBLIA_LEGACY_CATEGORIES_KEY,
  BIBLIA_NONATO_STORAGE_KEY,
  BibliaFamilia,
  BibliaLinha,
  BibliaModelo,
  BibliaStore,
  bibliaMatchesSearch,
  bibliaUid,
  countBibliaStats,
  moveItem,
  normalizeBibliaImport,
  seedBibliaExample,
  serializeBibliaForServer,
} from './bibliaNonatoTypes'

export { BIBLIA_NONATO_STORAGE_KEY } from './bibliaNonatoTypes'

type Props = {
  saveData: (key: string, data: unknown) => Promise<void>
  loadData: (key: string) => Promise<unknown>
  safeT: Record<string, string | undefined>
  closeTab: (tabId: string) => void
  activeTabId?: string
  onHome: () => void
  isCompactLayout?: boolean
}

type ModelTab = 'software' | 'mecanica' | 'eletrica' | 'notas'

export function BibliaNonatoServiceContent({
  saveData,
  loadData,
  safeT,
  closeTab,
  activeTabId,
  onHome,
  isCompactLayout,
}: Props) {
  const tr = useCallback(
    (key: string, fallback: string, vars?: Record<string, string | number>) => {
      let s = String(safeT[key] ?? fallback)
      if (vars) {
        Object.entries(vars).forEach(([k, v]) => {
          s = s.replace(`{${k}}`, String(v))
        })
      }
      return s
    },
    [safeT]
  )

  const [store, setStore] = useState<BibliaStore>({ familias: [] })
  const [loading, setLoading] = useState(true)
  const [syncMsg, setSyncMsg] = useState('')
  const [search, setSearch] = useState('')
  const [selectedFamiliaId, setSelectedFamiliaId] = useState<string | null>(null)
  const [expandedLinhas, setExpandedLinhas] = useState<Record<string, boolean>>({})
  const [expandedModelos, setExpandedModelos] = useState<Record<string, boolean>>({})
  const [modelTabs, setModelTabs] = useState<Record<string, ModelTab>>({})
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const hydrated = useRef(false)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setLoading(true)
      try {
        let data = await loadData(BIBLIA_NONATO_STORAGE_KEY)
        if (!data) data = await loadData(BIBLIA_LEGACY_CATEGORIES_KEY)
        let parsed = normalizeBibliaImport(data)
        if (parsed.familias.length === 0) {
          parsed = seedBibliaExample()
          await saveData(BIBLIA_NONATO_STORAGE_KEY, serializeBibliaForServer(parsed))
        }
        if (!cancelled) {
          setStore(parsed)
          if (parsed.familias.length > 0) {
            setSelectedFamiliaId(parsed.familias[0].id)
          }
          setSyncMsg(tr('bibliaNonatoCarregado', 'Dados carregados.'))
        }
      } catch {
        if (!cancelled) {
          setStore(seedBibliaExample())
          setSyncMsg(tr('bibliaNonatoErroCarregar', 'Erro ao carregar — exemplo local criado.'))
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
          hydrated.current = true
        }
      }
    })()
    return () => {
      cancelled = true
    }
  }, [loadData, saveData, tr])

  const persist = useCallback(
    (next: BibliaStore) => {
      if (saveTimer.current) clearTimeout(saveTimer.current)
      saveTimer.current = setTimeout(async () => {
        try {
          await saveData(BIBLIA_NONATO_STORAGE_KEY, serializeBibliaForServer(next))
          setSyncMsg(`${tr('bibliaNonatoGuardado', 'Guardado')} · ${new Date().toLocaleTimeString('pt-PT')}`)
        } catch {
          setSyncMsg(tr('bibliaNonatoErroGuardar', 'Erro ao guardar no servidor.'))
        }
      }, 700)
    },
    [saveData, tr]
  )

  const updateStore = useCallback(
    (updater: (prev: BibliaStore) => BibliaStore) => {
      setStore((prev) => {
        const next = updater(prev)
        if (hydrated.current) persist(next)
        return next
      })
    },
    [persist]
  )

  const filteredStore = useMemo(() => bibliaMatchesSearch(store, search), [store, search])

  const selectedFamilia = useMemo(
    () => filteredStore.familias.find((f) => f.id === selectedFamiliaId) ?? null,
    [filteredStore, selectedFamiliaId]
  )

  const stats = useMemo(() => countBibliaStats(store), [store])

  const patchFamilia = (familiaId: string, patch: Partial<BibliaFamilia>) => {
    updateStore((prev) => ({
      ...prev,
      familias: prev.familias.map((f) => (f.id === familiaId ? { ...f, ...patch } : f)),
    }))
  }

  const patchLinha = (familiaId: string, linhaId: string, patch: Partial<BibliaLinha>) => {
    updateStore((prev) => ({
      ...prev,
      familias: prev.familias.map((f) =>
        f.id !== familiaId
          ? f
          : {
              ...f,
              linhas: f.linhas.map((l) => (l.id === linhaId ? { ...l, ...patch } : l)),
            }
      ),
    }))
  }

  const patchModelo = (familiaId: string, linhaId: string, modeloId: string, patch: Partial<BibliaModelo>) => {
    updateStore((prev) => ({
      ...prev,
      familias: prev.familias.map((f) =>
        f.id !== familiaId
          ? f
          : {
              ...f,
              linhas: f.linhas.map((l) =>
                l.id !== linhaId
                  ? l
                  : {
                      ...l,
                      modelos: l.modelos.map((m) => (m.id === modeloId ? { ...m, ...patch } : m)),
                    }
              ),
            }
      ),
    }))
  }

  const addFamilia = () => {
    const nome = window.prompt(tr('bibliaNonatoNomeFamiliaLabel', 'Nome da família'))?.trim()
    if (!nome) return
    const nova: BibliaFamilia = { id: bibliaUid(), nome, ordem: store.familias.length, linhas: [] }
    updateStore((prev) => ({ ...prev, familias: [...prev.familias, nova] }))
    setSelectedFamiliaId(nova.id)
  }

  const deleteFamilia = (id: string) => {
    if (!window.confirm(tr('bibliaNonatoConfirmApagarFamilia', 'Eliminar esta família e todo o conteúdo?'))) return
    updateStore((prev) => {
      const familias = prev.familias.filter((f) => f.id !== id)
      return { ...prev, familias }
    })
    if (selectedFamiliaId === id) {
      setSelectedFamiliaId(store.familias.find((f) => f.id !== id)?.id ?? null)
    }
  }

  const addLinha = (familiaId: string) => {
    const titulo = window.prompt(tr('bibliaNonatoLinhaTituloLabel', 'Marca ou grupo'))?.trim()
    if (!titulo) return
    const fam = store.familias.find((f) => f.id === familiaId)
    if (!fam) return
    const linha: BibliaLinha = { id: bibliaUid(), titulo, ordem: fam.linhas.length, modelos: [] }
    patchFamilia(familiaId, { linhas: [...fam.linhas, linha] })
    setExpandedLinhas((p) => ({ ...p, [linha.id]: true }))
  }

  const deleteLinha = (familiaId: string, linhaId: string) => {
    if (!window.confirm(tr('bibliaNonatoConfirmApagarLinha', 'Eliminar esta marca e todos os modelos?'))) return
    const fam = store.familias.find((f) => f.id === familiaId)
    if (!fam) return
    patchFamilia(familiaId, { linhas: fam.linhas.filter((l) => l.id !== linhaId) })
  }

  const addModelo = (familiaId: string, linhaId: string) => {
    const nome = window.prompt(tr('bibliaNonatoModeloNomeLabel', 'Modelo ou referência'))?.trim()
    if (!nome) return
    const fam = store.familias.find((f) => f.id === familiaId)
    const lin = fam?.linhas.find((l) => l.id === linhaId)
    if (!lin) return
    const modelo: BibliaModelo = {
      id: bibliaUid(),
      nome,
      ordem: lin.modelos.length,
      software: '',
      mecanica: '',
      eletrica: '',
      notas: '',
      anexos: [],
    }
    patchLinha(familiaId, linhaId, { modelos: [...lin.modelos, modelo] })
    setExpandedModelos((p) => ({ ...p, [modelo.id]: true }))
  }

  const deleteModelo = (familiaId: string, linhaId: string, modeloId: string) => {
    if (!window.confirm(tr('bibliaNonatoConfirmApagarModelo', 'Eliminar este modelo?'))) return
    const fam = store.familias.find((f) => f.id === familiaId)
    const lin = fam?.linhas.find((l) => l.id === linhaId)
    if (!lin) return
    patchLinha(familiaId, linhaId, { modelos: lin.modelos.filter((m) => m.id !== modeloId) })
  }

  const moveFamilia = (id: string, dir: -1 | 1) => {
    const idx = store.familias.findIndex((f) => f.id === id)
    if (idx < 0) return
    updateStore((prev) => ({ ...prev, familias: moveItem(prev.familias, idx, idx + dir) }))
  }

  const moveLinha = (familiaId: string, linhaId: string, dir: -1 | 1) => {
    const fam = store.familias.find((f) => f.id === familiaId)
    if (!fam) return
    const idx = fam.linhas.findIndex((l) => l.id === linhaId)
    if (idx < 0) return
    patchFamilia(familiaId, { linhas: moveItem(fam.linhas, idx, idx + dir) })
  }

  const moveModelo = (familiaId: string, linhaId: string, modeloId: string, dir: -1 | 1) => {
    const fam = store.familias.find((f) => f.id === familiaId)
    const lin = fam?.linhas.find((l) => l.id === linhaId)
    if (!lin) return
    const idx = lin.modelos.findIndex((m) => m.id === modeloId)
    if (idx < 0) return
    patchLinha(familiaId, linhaId, { modelos: moveItem(lin.modelos, idx, idx + dir) })
  }

  const handleAnexos = async (familiaId: string, linhaId: string, modeloId: string, files: FileList | null) => {
    if (!files?.length) return
    const fam = store.familias.find((f) => f.id === familiaId)
    const lin = fam?.linhas.find((l) => l.id === linhaId)
    const mod = lin?.modelos.find((m) => m.id === modeloId)
    if (!mod) return

    const allowed = /\.(pdf|png|jpe?g|gif|webp|doc|docx)$/i
    const nextAnexos = [...mod.anexos]
    let partial = false

    for (const file of Array.from(files)) {
      if (nextAnexos.length >= BIBLIA_ANEXO_MAX_PER_MODEL) {
        partial = true
        break
      }
      if (!allowed.test(file.name) && !file.type.match(/^(image\/|application\/pdf|application\/msword|application\/vnd\.openxmlformats)/)) {
        alert(tr('bibliaNonatoAnexoTipoNaoPermitido', 'Tipo de arquivo não permitido.'))
        continue
      }
      if (file.size > BIBLIA_ANEXO_MAX_BYTES) {
        alert(tr('bibliaNonatoAnexoLimiteFicheiro', 'Arquivo grande demais (máx. ~6 MB).'))
        continue
      }
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(String(reader.result || ''))
        reader.onerror = () => reject(new Error('read'))
        reader.readAsDataURL(file)
      }).catch(() => {
        alert(tr('bibliaNonatoAnexoErroLeitura', 'Não foi possível ler o arquivo.'))
        return null
      })
      if (!dataUrl) continue
      nextAnexos.push({
        id: bibliaUid(),
        nome: file.name.slice(0, 200),
        mime: file.type || 'application/octet-stream',
        dataUrl,
      })
    }

    if (partial) alert(tr('bibliaNonatoAnexoParcial', 'Só couberam alguns arquivos.'))
    patchModelo(familiaId, linhaId, modeloId, { anexos: nextAnexos })
  }

  const getModelTab = (modeloId: string): ModelTab => modelTabs[modeloId] || 'software'

  const tabLabel: Record<ModelTab, string> = {
    software: tr('conhecimentoSoftware', 'Software'),
    mecanica: tr('conhecimentoMecanico', 'Mecânica'),
    eletrica: tr('conhecimentoEletrico', 'Elétrica'),
    notas: tr('bibliaNonatoModeloInfoLabel', 'Notas'),
  }

  const tabField: Record<ModelTab, keyof Pick<BibliaModelo, 'software' | 'mecanica' | 'eletrica' | 'notas'>> = {
    software: 'software',
    mecanica: 'mecanica',
    eletrica: 'eletrica',
    notas: 'notas',
  }

  return (
    <div className="biblia-nonato-root tab-content-wrapper">
      <div className="biblia-nonato-header">
        <div>
          <h1 className="biblia-nonato-title">{tr('bibliaNonatoServiceTitle', 'BÍBLIA DA NONATO SERVICE')}</h1>
          <p className="biblia-nonato-subtitle">
            {tr('bibliaNonatoServiceSubtitle', 'Famílias, marcas e modelos — base técnica dos equipamentos.')}
          </p>
          <p className="biblia-nonato-stats">
            {stats.familias} {tr('bibliaNonatoFamiliasLista', 'famílias').toLowerCase()} · {stats.marcas}{' '}
            {tr('bibliaNonatoMarcasNaFamiliaTitulo', 'marcas').split(' ')[0].toLowerCase()} · {stats.modelos}{' '}
            {tr('bibliaNonatoModelosNaLinhaTitulo', 'modelos').split(' ')[0].toLowerCase()}
            {stats.anexos > 0 ? ` · ${stats.anexos} ${tr('bibliaNonatoModeloResumoAnexos', '{n} anexo(s)').replace('{n}', String(stats.anexos))}` : ''}
          </p>
        </div>
        <div className="biblia-nonato-header-actions">
          <button type="button" className="btn-primary btn--compact" onClick={onHome}>
            🏠 {tr('paginaInicial', 'Início')}
          </button>
          <button type="button" className="btn-primary btn--compact" onClick={() => closeTab(activeTabId || '')}>
            ↶ {tr('voltar', 'Voltar')}
          </button>
        </div>
      </div>

      <p className="biblia-nonato-desc">{tr('bibliaNonatoServiceDesc', '')}</p>

      <div className="biblia-nonato-toolbar">
        <input
          type="search"
          className="biblia-nonato-search input-ns"
          placeholder={tr('bibliaNonatoPesquisaPlaceholder', 'Pesquisar em todas as famílias…')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        {syncMsg ? <span className="biblia-nonato-sync">{syncMsg}</span> : null}
      </div>

      {loading ? (
        <p className="biblia-nonato-loading">{tr('bibliaNonatoCarregando', 'A carregar…')}</p>
      ) : (
        <div className={`biblia-nonato-layout${isCompactLayout ? ' biblia-nonato-layout--compact' : ''}`}>
          <aside className="biblia-nonato-sidebar">
            <div className="biblia-nonato-panel-head">
              <h2>{tr('bibliaNonatoFamiliasLista', 'FAMÍLIAS')}</h2>
              <button type="button" className="btn-primary btn--compact" onClick={addFamilia}>
                + {tr('bibliaNonatoNovaFamilia', 'Nova')}
              </button>
            </div>
            {filteredStore.familias.length === 0 ? (
              <p className="biblia-nonato-empty">{tr('bibliaNonatoSemFamilias', 'Ainda não há famílias.')}</p>
            ) : (
              <ul className="biblia-nonato-familia-list">
                {filteredStore.familias.map((fam, idx) => {
                  const nModelos = fam.linhas.reduce((a, l) => a + l.modelos.length, 0)
                  const active = fam.id === selectedFamiliaId
                  return (
                    <li key={fam.id} className={`biblia-nonato-familia-item${active ? ' is-active' : ''}`}>
                      <button type="button" className="biblia-nonato-familia-btn" onClick={() => setSelectedFamiliaId(fam.id)}>
                        <strong>{fam.nome || tr('bibliaNonatoSemNomeFamilia', '(Sem nome)')}</strong>
                        <span>
                          {tr('bibliaNonatoFamiliaListaResumo', '{m} marcas · {n} modelos', {
                            m: fam.linhas.length,
                            n: nModelos,
                          })}
                        </span>
                      </button>
                      <div className="biblia-nonato-mini-actions">
                        <button type="button" title={tr('bibliaNonatoMoverCima', 'Subir')} disabled={idx === 0} onClick={() => moveFamilia(fam.id, -1)}>
                          ▲
                        </button>
                        <button
                          type="button"
                          title={tr('bibliaNonatoMoverBaixo', 'Descer')}
                          disabled={idx === filteredStore.familias.length - 1}
                          onClick={() => moveFamilia(fam.id, 1)}
                        >
                          ▼
                        </button>
                        <button type="button" className="is-danger" title={tr('bibliaNonatoApagarFamilia', 'Eliminar')} onClick={() => deleteFamilia(fam.id)}>
                          ✕
                        </button>
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}
          </aside>

          <main className="biblia-nonato-main">
            {!selectedFamilia ? (
              <p className="biblia-nonato-empty">{tr('bibliaNonatoSemFamilias', 'Selecione ou crie uma família.')}</p>
            ) : (
              <>
                <div className="biblia-nonato-panel-head">
                  <div>
                    <h2>{selectedFamilia.nome}</h2>
                    <p className="biblia-nonato-help">{tr('bibliaNonatoFamiliaConteudoAjuda', '')}</p>
                  </div>
                  <button type="button" className="btn-primary btn--compact" onClick={() => addLinha(selectedFamilia.id)}>
                    + {tr('bibliaNonatoNovaLinha', 'Adicionar marca')}
                  </button>
                </div>

                <input
                  className="input-ns biblia-nonato-familia-name"
                  value={selectedFamilia.nome}
                  onChange={(e) => patchFamilia(selectedFamilia.id, { nome: e.target.value })}
                  placeholder={tr('bibliaNonatoNomeFamiliaPlaceholder', 'Ex.: Família das seccionadoras')}
                  aria-label={tr('bibliaNonatoNomeFamiliaLabel', 'Nome da família')}
                />

                {selectedFamilia.linhas.length === 0 ? (
                  <p className="biblia-nonato-empty">{tr('bibliaNonatoLinhaResumoDica', 'Adicione marcas nesta família.')}</p>
                ) : (
                  <div className="biblia-nonato-marcas">
                    {selectedFamilia.linhas.map((lin, liIdx) => {
                      const linOpen = expandedLinhas[lin.id] !== false
                      return (
                        <section key={lin.id} className="biblia-nonato-marca-card">
                          <header className="biblia-nonato-marca-head">
                            <button
                              type="button"
                              className="biblia-nonato-marca-toggle"
                              onClick={() => setExpandedLinhas((p) => ({ ...p, [lin.id]: !linOpen }))}
                            >
                              <span>{linOpen ? '▼' : '▶'}</span>
                              <input
                                className="input-ns biblia-nonato-marca-title"
                                value={lin.titulo}
                                onClick={(e) => e.stopPropagation()}
                                onChange={(e) => patchLinha(selectedFamilia.id, lin.id, { titulo: e.target.value })}
                                placeholder={tr('bibliaNonatoLinhaTituloPlaceholder', 'Homag · Brandt · Weeke…')}
                                aria-label={tr('bibliaNonatoMarcaBlocoLabel', 'Marca')}
                              />
                              <em>
                                {tr('bibliaNonatoLinhaResumoModelos', '{n} modelo(s)', { n: lin.modelos.length })}
                              </em>
                            </button>
                            <div className="biblia-nonato-mini-actions">
                              <button type="button" disabled={liIdx === 0} onClick={() => moveLinha(selectedFamilia.id, lin.id, -1)} title={tr('bibliaNonatoLinhaMoverCima', 'Subir')}>
                                ▲
                              </button>
                              <button
                                type="button"
                                disabled={liIdx === selectedFamilia.linhas.length - 1}
                                onClick={() => moveLinha(selectedFamilia.id, lin.id, 1)}
                                title={tr('bibliaNonatoLinhaMoverBaixo', 'Descer')}
                              >
                                ▼
                              </button>
                              <button type="button" className="is-danger" onClick={() => deleteLinha(selectedFamilia.id, lin.id)} title={tr('bibliaNonatoRemoverLinha', 'Remover')}>
                                ✕
                              </button>
                            </div>
                          </header>

                          {linOpen ? (
                            <div className="biblia-nonato-marca-body">
                              <div className="biblia-nonato-panel-head biblia-nonato-panel-head--inner">
                                <h3>{tr('bibliaNonatoModelosDentroMarca', 'MODELOS NESTA MARCA')}</h3>
                                <button type="button" className="btn-primary btn--compact" onClick={() => addModelo(selectedFamilia.id, lin.id)}>
                                  + {tr('bibliaNonatoNovoModelo', 'Adicionar modelo')}
                                </button>
                              </div>

                              {lin.modelos.length === 0 ? (
                                <p className="biblia-nonato-empty">{tr('bibliaNonatoSemNomeModeloLista', 'Sem modelos.')}</p>
                              ) : (
                                <ul className="biblia-nonato-modelo-list">
                                  {lin.modelos.map((mod, miIdx) => {
                                    const modOpen = !!expandedModelos[mod.id]
                                    const tab = getModelTab(mod.id)
                                    const field = tabField[tab]
                                    return (
                                      <li key={mod.id} className="biblia-nonato-modelo-item">
                                        <div className="biblia-nonato-modelo-head">
                                          <button
                                            type="button"
                                            className="biblia-nonato-modelo-toggle"
                                            onClick={() => setExpandedModelos((p) => ({ ...p, [mod.id]: !modOpen }))}
                                          >
                                            {modOpen ? tr('bibliaNonatoModeloRetrair', 'Retrair') : tr('bibliaNonatoModeloExpandir', 'Expandir')}
                                          </button>
                                          <input
                                            className="input-ns biblia-nonato-modelo-name"
                                            value={mod.nome}
                                            onChange={(e) => patchModelo(selectedFamilia.id, lin.id, mod.id, { nome: e.target.value })}
                                            placeholder={tr('bibliaNonatoModeloNomePlaceholder', 'Ex.: HPP 250')}
                                          />
                                          <span className="biblia-nonato-modelo-meta">
                                            {mod.anexos.length > 0
                                              ? tr('bibliaNonatoModeloResumoAnexos', '{n} anexo(s)', { n: mod.anexos.length })
                                              : tr('bibliaNonatoModeloResumoRetraido', 'Detalhes fechados')}
                                          </span>
                                          <div className="biblia-nonato-mini-actions">
                                            <button type="button" disabled={miIdx === 0} onClick={() => moveModelo(selectedFamilia.id, lin.id, mod.id, -1)}>
                                              ▲
                                            </button>
                                            <button type="button" disabled={miIdx === lin.modelos.length - 1} onClick={() => moveModelo(selectedFamilia.id, lin.id, mod.id, 1)}>
                                              ▼
                                            </button>
                                            <button type="button" className="is-danger" onClick={() => deleteModelo(selectedFamilia.id, lin.id, mod.id)}>
                                              ✕
                                            </button>
                                          </div>
                                        </div>

                                        {modOpen ? (
                                          <div className="biblia-nonato-modelo-body">
                                            <div className="biblia-nonato-tabs" role="tablist">
                                              {(Object.keys(tabLabel) as ModelTab[]).map((key) => (
                                                <button
                                                  key={key}
                                                  type="button"
                                                  role="tab"
                                                  className={`biblia-nonato-tab${tab === key ? ' is-active' : ''}`}
                                                  onClick={() => setModelTabs((p) => ({ ...p, [mod.id]: key }))}
                                                >
                                                  {tabLabel[key]}
                                                </button>
                                              ))}
                                            </div>
                                            <textarea
                                              className="biblia-nonato-textarea input-ns"
                                              rows={10}
                                              value={mod[field]}
                                              onChange={(e) => patchModelo(selectedFamilia.id, lin.id, mod.id, { [field]: e.target.value })}
                                              placeholder={tr('bibliaNonatoModeloInfoPlaceholder', 'Informações técnicas…')}
                                            />

                                            <div className="biblia-nonato-anexos">
                                              <h4>{tr('bibliaNonatoAnexosTitulo', 'Documentos e imagens')}</h4>
                                              <p className="biblia-nonato-help">{tr('bibliaNonatoAnexosAjudaModelo', '')}</p>
                                              <label className="btn-primary btn--compact biblia-nonato-file-label">
                                                + {tr('bibliaNonatoAnexosAdicionar', 'Adicionar arquivos')}
                                                <input
                                                  type="file"
                                                  hidden
                                                  multiple
                                                  accept=".pdf,.png,.jpg,.jpeg,.gif,.webp,.doc,.docx,image/*,application/pdf"
                                                  onChange={(e) => {
                                                    void handleAnexos(selectedFamilia.id, lin.id, mod.id, e.target.files)
                                                    e.target.value = ''
                                                  }}
                                                />
                                              </label>
                                              {mod.anexos.length > 0 ? (
                                                <ul className="biblia-nonato-anexo-list">
                                                  {mod.anexos.map((a) => (
                                                    <li key={a.id}>
                                                      <a href={a.dataUrl} target="_blank" rel="noreferrer">
                                                        {a.nome}
                                                      </a>
                                                      <a href={a.dataUrl} download={a.nome} className="btn-primary btn--compact">
                                                        {tr('bibliaNonatoAnexoTransferir', 'Baixar')}
                                                      </a>
                                                      <button
                                                        type="button"
                                                        className="btn-danger btn-danger--inline"
                                                        onClick={() =>
                                                          patchModelo(selectedFamilia.id, lin.id, mod.id, {
                                                            anexos: mod.anexos.filter((x) => x.id !== a.id),
                                                          })
                                                        }
                                                      >
                                                        {tr('bibliaNonatoAnexoRemover', 'Remover')}
                                                      </button>
                                                    </li>
                                                  ))}
                                                </ul>
                                              ) : null}
                                            </div>
                                          </div>
                                        ) : null}
                                      </li>
                                    )
                                  })}
                                </ul>
                              )}
                            </div>
                          ) : (
                            <p className="biblia-nonato-collapsed-hint">
                              {lin.modelos.map((m) => m.nome || tr('bibliaNonatoSemNomeModeloLista', '(Sem nome)')).join(' · ') ||
                                tr('bibliaNonatoLinhaResumoDica', 'Expandir a marca para editar modelos.')}
                            </p>
                          )}
                        </section>
                      )
                    })}
                  </div>
                )}
              </>
            )}
          </main>
        </div>
      )}
    </div>
  )
}
