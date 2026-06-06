'use client'

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { NonatoBrandLogo } from './NonatoBrandLogo'
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
type Selection = { familiaId: string; linhaId?: string; modeloId?: string } | null

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
      if (vars) Object.entries(vars).forEach(([k, v]) => { s = s.replace(`{${k}}`, String(v)) })
      return s
    },
    [safeT]
  )

  const [store, setStore] = useState<BibliaStore>({ familias: [] })
  const [loading, setLoading] = useState(true)
  const [syncState, setSyncState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [search, setSearch] = useState('')
  const [selection, setSelection] = useState<Selection>(null)
  const [marcaFilter, setMarcaFilter] = useState<string | 'all'>('all')
  const [activeTab, setActiveTab] = useState<ModelTab>('software')
  const [novaFamilia, setNovaFamilia] = useState('')
  const [novaMarca, setNovaMarca] = useState('')
  const [novoModelo, setNovoModelo] = useState('')
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const hydrated = useRef(false)
  const importRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setLoading(true)
      try {
        let data = await loadData(BIBLIA_NONATO_STORAGE_KEY)
        if (!data) data = await loadData(BIBLIA_LEGACY_CATEGORIES_KEY)
        const parsed = normalizeBibliaImport(data)
        if (!cancelled) {
          setStore(parsed)
          if (parsed.familias.length > 0) {
            const f = parsed.familias[0]
            const lin = f.linhas[0]
            const mod = lin?.modelos[0]
            if (mod && lin) setSelection({ familiaId: f.id, linhaId: lin.id, modeloId: mod.id })
            else setSelection({ familiaId: f.id })
          }
        }
      } catch {
        if (!cancelled) setStore({ familias: [] })
      } finally {
        if (!cancelled) {
          setLoading(false)
          hydrated.current = true
        }
      }
    })()
    return () => { cancelled = true }
  }, [loadData])

  const persist = useCallback(
    (next: BibliaStore) => {
      if (saveTimer.current) clearTimeout(saveTimer.current)
      setSyncState('saving')
      saveTimer.current = setTimeout(async () => {
        try {
          await saveData(BIBLIA_NONATO_STORAGE_KEY, serializeBibliaForServer(next))
          setSyncState('saved')
        } catch {
          setSyncState('error')
        }
      }, 550)
    },
    [saveData]
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

  const filtered = useMemo(() => bibliaMatchesSearch(store, search), [store, search])
  const stats = useMemo(() => countBibliaStats(store), [store])

  const selectedFamilia = useMemo(
    () => (selection ? store.familias.find((f) => f.id === selection.familiaId) : null),
    [store, selection]
  )

  const selectedLinha = useMemo(
    () => selectedFamilia?.linhas.find((l) => l.id === selection?.linhaId) ?? null,
    [selectedFamilia, selection]
  )

  const selectedModelo = useMemo(
    () => selectedLinha?.modelos.find((m) => m.id === selection?.modeloId) ?? null,
    [selectedLinha, selection]
  )

  const catalogRows = useMemo(() => {
    if (!selectedFamilia) return []
    const fam = filtered.familias.find((f) => f.id === selectedFamilia.id) ?? selectedFamilia
    const rows: { linha: BibliaLinha; modelo: BibliaModelo }[] = []
    fam.linhas.forEach((lin) => {
      if (marcaFilter !== 'all' && lin.id !== marcaFilter) return
      lin.modelos.forEach((mod) => rows.push({ linha: lin, modelo: mod }))
    })
    return rows
  }, [selectedFamilia, filtered, marcaFilter])

  const patchModelo = useCallback(
    (familiaId: string, linhaId: string, modeloId: string, patch: Partial<BibliaModelo>) => {
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
                    : { ...l, modelos: l.modelos.map((m) => (m.id === modeloId ? { ...m, ...patch } : m)) }
                ),
              }
        ),
      }))
    },
    [updateStore]
  )

  const createFamilia = () => {
    const nome = novaFamilia.trim()
    if (!nome) return
    const fam: BibliaFamilia = { id: bibliaUid(), nome, ordem: store.familias.length, linhas: [] }
    updateStore((prev) => ({ ...prev, familias: [...prev.familias, fam] }))
    setSelection({ familiaId: fam.id })
    setNovaFamilia('')
    setMarcaFilter('all')
  }

  const createMarca = () => {
    if (!selectedFamilia) return
    const titulo = novaMarca.trim()
    if (!titulo) return
    const lin: BibliaLinha = { id: bibliaUid(), titulo, ordem: selectedFamilia.linhas.length, modelos: [] }
    updateStore((prev) => ({
      ...prev,
      familias: prev.familias.map((f) =>
        f.id === selectedFamilia.id ? { ...f, linhas: [...f.linhas, lin] } : f
      ),
    }))
    setMarcaFilter(lin.id)
    setNovaMarca('')
  }

  const createModelo = () => {
    if (!selectedFamilia || !selectedLinha && marcaFilter === 'all') return
    const linhaId = marcaFilter !== 'all' ? marcaFilter : selectedFamilia.linhas[0]?.id
    if (!linhaId) return
    const nome = novoModelo.trim()
    if (!nome) return
    const mod: BibliaModelo = {
      id: bibliaUid(),
      nome,
      ordem: 0,
      software: '',
      mecanica: '',
      eletrica: '',
      notas: '',
      anexos: [],
    }
    updateStore((prev) => ({
      ...prev,
      familias: prev.familias.map((f) => {
        if (f.id !== selectedFamilia.id) return f
        return {
          ...f,
          linhas: f.linhas.map((l) => {
            if (l.id !== linhaId) return l
            return { ...l, modelos: [...l.modelos, { ...mod, ordem: l.modelos.length }] }
          }),
        }
      }),
    }))
    setSelection({ familiaId: selectedFamilia.id, linhaId, modeloId: mod.id })
    setNovoModelo('')
  }

  const deleteFamilia = (id: string) => {
    if (!window.confirm(tr('bibliaNonatoConfirmApagarFamilia', 'Eliminar esta família e todo o conteúdo?'))) return
    updateStore((prev) => ({ ...prev, familias: prev.familias.filter((f) => f.id !== id) }))
    if (selection?.familiaId === id) setSelection(null)
  }

  const deleteModelo = (familiaId: string, linhaId: string, modeloId: string) => {
    if (!window.confirm(tr('bibliaNonatoConfirmApagarModelo', 'Eliminar este modelo?'))) return
    updateStore((prev) => ({
      ...prev,
      familias: prev.familias.map((f) =>
        f.id !== familiaId
          ? f
          : {
              ...f,
              linhas: f.linhas.map((l) =>
                l.id !== linhaId ? l : { ...l, modelos: l.modelos.filter((m) => m.id !== modeloId) }
              ),
            }
      ),
    }))
    if (selection?.modeloId === modeloId) setSelection({ familiaId, linhaId })
  }

  const handleAnexos = async (files: FileList | null) => {
    if (!files?.length || !selection?.linhaId || !selection.modeloId || !selectedModelo) return
    const allowed = /\.(pdf|png|jpe?g|gif|webp|doc|docx)$/i
    const next = [...selectedModelo.anexos]
    for (const file of Array.from(files)) {
      if (next.length >= BIBLIA_ANEXO_MAX_PER_MODEL) break
      if (file.size > BIBLIA_ANEXO_MAX_BYTES) {
        alert(tr('bibliaNonatoAnexoLimiteFicheiro', 'Arquivo grande demais (máx. ~6 MB).'))
        continue
      }
      if (!allowed.test(file.name) && !file.type.match(/^(image\/|application\/pdf|application\/msword|application\/vnd\.openxmlformats)/)) {
        alert(tr('bibliaNonatoAnexoTipoNaoPermitido', 'Tipo não permitido.'))
        continue
      }
      const dataUrl = await new Promise<string | null>((resolve) => {
        const r = new FileReader()
        r.onload = () => resolve(String(r.result || ''))
        r.onerror = () => resolve(null)
        r.readAsDataURL(file)
      })
      if (!dataUrl) continue
      next.push({ id: bibliaUid(), nome: file.name.slice(0, 200), mime: file.type || 'application/octet-stream', dataUrl })
    }
    patchModelo(selection.familiaId, selection.linhaId, selection.modeloId, { anexos: next })
  }

  const exportJson = () => {
    const blob = new Blob([JSON.stringify(serializeBibliaForServer(store), null, 2)], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `biblia-nonato-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(a.href)
  }

  const importJson = (file: File) => {
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const parsed = normalizeBibliaImport(JSON.parse(String(reader.result)))
        if (!window.confirm(tr('bibliaNonatoConfirmImport', 'Importar substitui todos os dados actuais. Continuar?'))) return
        updateStore(() => parsed)
        setSelection(null)
      } catch {
        alert(tr('bibliaNonatoErroImport', 'Ficheiro inválido.'))
      }
    }
    reader.readAsText(file)
  }

  const modelPreview = (m: BibliaModelo) => {
    const t = [m.software, m.mecanica, m.eletrica, m.notas].find((x) => x.trim())
    return t ? t.trim().slice(0, 72) + (t.length > 72 ? '…' : '') : '—'
  }

  const tabDefs: { id: ModelTab; label: string; field: keyof Pick<BibliaModelo, 'software' | 'mecanica' | 'eletrica' | 'notas'>; ph: string }[] = [
    { id: 'software', label: tr('conhecimentoSoftware', 'Software'), field: 'software', ph: 'Versões, parâmetros, backups, redes…' },
    { id: 'mecanica', label: tr('conhecimentoMecanico', 'Mecânica'), field: 'mecanica', ph: 'Calibração, peças, manutenção…' },
    { id: 'eletrica', label: tr('conhecimentoEletrico', 'Elétrica'), field: 'eletrica', ph: 'Esquemas, fusíveis, motores, I/O…' },
    { id: 'notas', label: tr('bibliaNonatoModeloInfoLabel', 'Notas'), field: 'notas', ph: 'Observações gerais, contactos, fornecedores…' },
  ]

  const syncLabel =
    syncState === 'saving'
      ? tr('bibliaNonatoGuardando', 'A guardar…')
      : syncState === 'saved'
        ? tr('bibliaNonatoGuardado', 'Sincronizado')
        : syncState === 'error'
          ? tr('bibliaNonatoErroGuardar', 'Erro ao guardar')
          : ''

  return (
    <div className="tab-content-wrapper tab-glass-root biblia-hub">
      <div className="biblia-hub__hero-ring">
        <div className="tab-glass-hero tab-glass-hero--compact">
          <div className="tab-glass-hero-top">
            <NonatoBrandLogo variant="informacao" className="biblia-hub__logo" alt="" width={48} height={48} />
            <div className="tab-glass-hero-heading">
              <h1 className="tab-glass-hero-title">{tr('bibliaNonatoServiceTitle', 'BÍBLIA DA NONATO SERVICE')}</h1>
              <p className="tab-glass-hero-meta">
                {tr('bibliaNonatoServiceSubtitle', 'Base técnica interna — famílias, marcas e modelos de equipamentos.')}
              </p>
            </div>
            <div className="tab-glass-hero-actions biblia-hub__hero-actions">
              <span className={`biblia-hub__sync biblia-hub__sync--${syncState}`} aria-live="polite">{syncLabel}</span>
              <button type="button" className="biblioteca-pecas-hub__icon-btn biblioteca-pecas-hub__icon-btn--back" onClick={() => closeTab(activeTabId || '')} title={tr('voltar', 'Voltar')}>↶</button>
              <button type="button" className="biblioteca-pecas-hub__icon-btn biblioteca-pecas-hub__icon-btn--home" onClick={onHome} title={tr('paginaInicial', 'Início')}>🏠</button>
            </div>
          </div>
        </div>
      </div>

      <div className="biblia-hub__stats-panel">
        <p className="biblioteca-pecas-hub__eyebrow">{tr('bibliaNonatoPainelResumo', 'Resumo da base técnica')}</p>
        <p className="biblioteca-pecas-hub__lead">{tr('bibliaNonatoServiceDesc', '')}</p>
        <div className="biblioteca-pecas-hub__kpi-grid">
          {[
            { label: tr('bibliaNonatoFamiliasLista', 'Famílias'), value: stats.familias },
            { label: tr('bibliaNonatoMarcasNaFamiliaTitulo', 'Marcas').split(' ')[0], value: stats.marcas },
            { label: tr('bibliaNonatoModelosNaLinhaTitulo', 'Modelos').split(' ')[0], value: stats.modelos },
            { label: tr('bibliaNonatoAnexosTitulo', 'Anexos'), value: stats.anexos },
          ].map((k) => (
            <div key={k.label} className="biblia-hub__kpi biblioteca-pecas-hub__kpi">
              <div className="biblioteca-pecas-hub__kpi-label">{k.label}</div>
              <div className="biblioteca-pecas-hub__kpi-value">{k.value}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="biblia-hub__toolbar">
        <input
          type="search"
          className="input-ns biblia-hub__search"
          placeholder={tr('bibliaNonatoPesquisaPlaceholder', 'Pesquisar família, marca ou modelo…')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button type="button" className="btn-primary btn--compact" onClick={exportJson}>{tr('bibliaNonatoExportar', 'Exportar')}</button>
        <button type="button" className="btn-primary btn--compact" onClick={() => importRef.current?.click()}>{tr('bibliaNonatoImportar', 'Importar')}</button>
        <input ref={importRef} type="file" accept="application/json,.json" hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) importJson(f); e.target.value = '' }} />
      </div>

      {loading ? (
        <p className="biblia-hub__loading">{tr('bibliaNonatoCarregando', 'A carregar…')}</p>
      ) : (
        <div className={`biblia-hub__workspace${isCompactLayout ? ' biblia-hub__workspace--stack' : ''}`}>
          {/* Coluna 1 — Famílias */}
          <aside className="biblia-hub__pane biblia-hub__pane--nav">
            <div className="biblia-hub__pane-head">
              <h2>{tr('bibliaNonatoFamiliasLista', 'FAMÍLIAS')}</h2>
            </div>
            <div className="biblia-hub__add-row">
              <input
                className="input-ns"
                placeholder={tr('bibliaNonatoNomeFamiliaPlaceholder', 'Nova família…')}
                value={novaFamilia}
                onChange={(e) => setNovaFamilia(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && createFamilia()}
              />
              <button type="button" className="btn-primary btn--compact" onClick={createFamilia}>+</button>
            </div>
            <ul className="biblia-hub__nav-list">
              {filtered.familias.length === 0 ? (
                <li className="biblia-hub__empty">{tr('bibliaNonatoSemFamilias', 'Sem famílias.')}</li>
              ) : (
                filtered.familias.map((fam, idx) => {
                  const active = selection?.familiaId === fam.id
                  const nMod = fam.linhas.reduce((a, l) => a + l.modelos.length, 0)
                  return (
                    <li key={fam.id}>
                      <button
                        type="button"
                        className={`biblia-hub__nav-item${active ? ' is-active' : ''}`}
                        onClick={() => {
                          setSelection({
                            familiaId: fam.id,
                            linhaId: fam.linhas[0]?.id,
                            modeloId: fam.linhas[0]?.modelos[0]?.id,
                          })
                          setMarcaFilter('all')
                        }}
                      >
                        <span className="biblia-hub__nav-title">{fam.nome || tr('bibliaNonatoSemNomeFamilia', '(Sem nome)')}</span>
                        <span className="biblia-hub__nav-meta">{fam.linhas.length} · {nMod}</span>
                      </button>
                      <div className="biblia-hub__nav-actions">
                        <button type="button" disabled={idx === 0} onClick={() => updateStore((p) => ({ ...p, familias: moveItem(p.familias, idx, idx - 1) }))}>▲</button>
                        <button type="button" disabled={idx === filtered.familias.length - 1} onClick={() => updateStore((p) => ({ ...p, familias: moveItem(p.familias, idx, idx + 1) }))}>▼</button>
                        <button type="button" className="is-del" onClick={() => deleteFamilia(fam.id)}>✕</button>
                      </div>
                    </li>
                  )
                })
              )}
            </ul>
          </aside>

          {/* Coluna 2 — Catálogo */}
          <section className="biblia-hub__pane biblia-hub__pane--catalog">
            {!selectedFamilia ? (
              <div className="biblia-hub__placeholder">
                <p>{tr('bibliaNonatoSelecioneFamilia', 'Selecione ou crie uma família à esquerda.')}</p>
              </div>
            ) : (
              <>
                <div className="biblia-hub__pane-head">
                  <input
                    className="input-ns biblia-hub__familia-name"
                    value={selectedFamilia.nome}
                    onChange={(e) =>
                      updateStore((prev) => ({
                        ...prev,
                        familias: prev.familias.map((f) => (f.id === selectedFamilia.id ? { ...f, nome: e.target.value } : f)),
                      }))
                    }
                    aria-label={tr('bibliaNonatoNomeFamiliaLabel', 'Nome da família')}
                  />
                </div>

                <div className="biblia-hub__marca-bar">
                  <button type="button" className={`biblia-hub__marca-chip${marcaFilter === 'all' ? ' is-active' : ''}`} onClick={() => setMarcaFilter('all')}>
                    {tr('bibliaNonatoTodasMarcas', 'Todas')}
                  </button>
                  {selectedFamilia.linhas.map((lin) => (
                    <button
                      key={lin.id}
                      type="button"
                      className={`biblia-hub__marca-chip${marcaFilter === lin.id ? ' is-active' : ''}`}
                      onClick={() => setMarcaFilter(lin.id)}
                    >
                      {lin.titulo || tr('bibliaNonatoSemMarcaLista', '(Sem marca)')}
                      <em>{lin.modelos.length}</em>
                    </button>
                  ))}
                </div>

                <div className="biblia-hub__add-row">
                  <input
                    className="input-ns"
                    placeholder={tr('bibliaNonatoLinhaTituloPlaceholder', 'Nova marca…')}
                    value={novaMarca}
                    onChange={(e) => setNovaMarca(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && createMarca()}
                  />
                  <button type="button" className="btn-primary btn--compact" onClick={createMarca}>+ {tr('bibliaNonatoNovaLinha', 'Marca')}</button>
                </div>

                <div className="biblia-hub__table-wrap">
                  <table className="biblia-hub__table">
                    <thead>
                      <tr>
                        <th>{tr('bibliaNonatoMarcaBlocoLabel', 'Marca')}</th>
                        <th>{tr('bibliaNonatoModeloNomeLabel', 'Modelo')}</th>
                        <th>{tr('bibliaNonatoColunaResumo', 'Resumo')}</th>
                        <th>{tr('bibliaNonatoAnexosTitulo', 'Anexos')}</th>
                        <th />
                      </tr>
                    </thead>
                    <tbody>
                      {catalogRows.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="biblia-hub__empty-cell">{tr('bibliaNonatoSemModelosTabela', 'Nenhum modelo nesta família.')}</td>
                        </tr>
                      ) : (
                        catalogRows.map(({ linha, modelo }) => {
                          const active = selection?.modeloId === modelo.id
                          return (
                            <tr key={modelo.id} className={active ? 'is-active' : ''}>
                              <td>{linha.titulo || '—'}</td>
                              <td><strong>{modelo.nome || '—'}</strong></td>
                              <td className="biblia-hub__cell-muted">{modelPreview(modelo)}</td>
                              <td>{modelo.anexos.length || '—'}</td>
                              <td className="biblia-hub__cell-actions">
                                <button
                                  type="button"
                                  className="btn-primary btn--compact"
                                  onClick={() => {
                                    setSelection({ familiaId: selectedFamilia.id, linhaId: linha.id, modeloId: modelo.id })
                                    setActiveTab('software')
                                  }}
                                >
                                  {tr('bibliaNonatoAbrirFicha', 'Abrir')}
                                </button>
                                <button type="button" className="btn-danger btn-danger--inline" onClick={() => deleteModelo(selectedFamilia.id, linha.id, modelo.id)}>✕</button>
                              </td>
                            </tr>
                          )
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="biblia-hub__add-row biblia-hub__add-row--model">
                  <input
                    className="input-ns"
                    placeholder={tr('bibliaNonatoModeloNomePlaceholder', 'Novo modelo…')}
                    value={novoModelo}
                    onChange={(e) => setNovoModelo(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && createModelo()}
                    disabled={selectedFamilia.linhas.length === 0}
                  />
                  <button type="button" className="btn-primary btn--compact" onClick={createModelo} disabled={selectedFamilia.linhas.length === 0}>
                    + {tr('bibliaNonatoNovoModelo', 'Modelo')}
                  </button>
                </div>
              </>
            )}
          </section>

          {/* Coluna 3 — Ficha técnica */}
          <section className="biblia-hub__pane biblia-hub__pane--ficha">
            {!selectedModelo || !selection?.modeloId || !selection.linhaId ? (
              <div className="biblia-hub__placeholder">
                <p>{tr('bibliaNonatoSelecioneModelo', 'Selecione um modelo na tabela para editar a ficha técnica.')}</p>
              </div>
            ) : (
              <>
                <div className="biblia-hub__breadcrumb">
                  {selectedFamilia?.nome} › {selectedLinha?.titulo} ›
                </div>
                <input
                  className="input-ns biblia-hub__model-title"
                  value={selectedModelo.nome}
                  onChange={(e) => patchModelo(selection.familiaId, selection.linhaId, selection.modeloId, { nome: e.target.value })}
                  aria-label={tr('bibliaNonatoModeloNomeLabel', 'Modelo')}
                />

                <div className="biblia-hub__tabs" role="tablist">
                  {tabDefs.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      role="tab"
                      className={`biblia-hub__tab${activeTab === t.id ? ' is-active' : ''}`}
                      onClick={() => setActiveTab(t.id)}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>

                {tabDefs.map((t) =>
                  activeTab === t.id ? (
                    <textarea
                      key={t.id}
                      className="input-ns biblia-hub__editor"
                      rows={14}
                      value={selectedModelo[t.field]}
                      placeholder={t.ph}
                      onChange={(e) => patchModelo(selection.familiaId, selection.linhaId, selection.modeloId, { [t.field]: e.target.value })}
                    />
                  ) : null
                )}

                <div className="biblia-hub__anexos">
                  <div className="biblia-hub__pane-head">
                    <h3>{tr('bibliaNonatoAnexosTitulo', 'Documentos e imagens')}</h3>
                    <label className="btn-primary btn--compact biblia-hub__file-btn">
                      + {tr('bibliaNonatoAnexosAdicionar', 'Anexar')}
                      <input type="file" hidden multiple accept=".pdf,.png,.jpg,.jpeg,.gif,.webp,.doc,.docx,image/*,application/pdf" onChange={(e) => { void handleAnexos(e.target.files); e.target.value = '' }} />
                    </label>
                  </div>
                  <p className="biblia-hub__anexos-hint">{tr('bibliaNonatoAnexosAjudaModelo', '')}</p>
                  {selectedModelo.anexos.length === 0 ? (
                    <p className="biblia-hub__empty">{tr('bibliaNonatoSemAnexos', 'Sem anexos.')}</p>
                  ) : (
                    <ul className="biblia-hub__anexo-grid">
                      {selectedModelo.anexos.map((a) => (
                        <li key={a.id} className="biblia-hub__anexo-card">
                          <span className="biblia-hub__anexo-name" title={a.nome}>{a.nome}</span>
                          <div className="biblia-hub__anexo-actions">
                            <a href={a.dataUrl} target="_blank" rel="noreferrer" className="btn-primary btn--compact">{tr('bibliaNonatoAnexoAbrir', 'Abrir')}</a>
                            <a href={a.dataUrl} download={a.nome} className="btn-primary btn--compact">{tr('bibliaNonatoAnexoTransferir', 'Baixar')}</a>
                            <button
                              type="button"
                              className="btn-danger btn-danger--inline"
                              onClick={() =>
                                patchModelo(selection.familiaId, selection.linhaId, selection.modeloId, {
                                  anexos: selectedModelo.anexos.filter((x) => x.id !== a.id),
                                })
                              }
                            >
                              {tr('bibliaNonatoAnexoRemover', 'Remover')}
                            </button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </>
            )}
          </section>
        </div>
      )}
    </div>
  )
}
