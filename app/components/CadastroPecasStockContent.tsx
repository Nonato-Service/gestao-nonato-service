'use client'

import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { AssistTextarea } from './AssistTextFields'
import { LISTA_UI_LOTE } from '../lib/listaUiLote'
import {
  isCategoriaPecaFormValid,
  isPecaBibliotecaFormValid,
  isSubcategoriaPecaFormValid,
  type CategoriaPeca,
  type PecaBiblioteca,
  type SubcategoriaPeca,
} from '../modules/biblioteca'
import {
  PECAS_STOCK_STORAGE_KEY,
  CATEGORIAS_PECAS_STOCK_STORAGE_KEY,
  SUBCATEGORIAS_PECAS_STOCK_STORAGE_KEY,
} from '../modules/biblioteca/stockKeys'
import {
  createCategoriaPecaFromForm,
  createEmptyPecaBibliotecaForm,
  createPecaBibliotecaFromForm,
  createSubcategoriaPecaFromForm,
} from '../lib/bibliotecaFromForm'
import { updatePecaBibliotecaFromForm } from '../modules/biblioteca/pecaFromForm'

type Props = {
  safeT: Record<string, string | undefined>
  activeTabId?: string
  closeTab: (id: string) => void
  voltarPaginaInicial: () => void
  logoSlot: React.ReactNode
  saveData: (key: string, data: unknown) => Promise<boolean | void>
  loadData: (key: string) => Promise<unknown>
}

type AbaStock = 'cadastro' | 'categorias'

function asArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : []
}

function tr(t: Record<string, string | undefined>, key: string, fallback: string): string {
  const v = t[key]
  return typeof v === 'string' && v.trim() ? v : fallback
}

function codigoNorm(v: string): string {
  return v.trim().toLowerCase()
}

export function CadastroPecasStockContent({
  safeT,
  logoSlot,
  saveData,
  loadData,
}: Props) {
  const [aba, setAba] = useState<AbaStock>('cadastro')
  const [pecas, setPecas] = useState<PecaBiblioteca[]>([])
  const [categorias, setCategorias] = useState<CategoriaPeca[]>([])
  const [subcategorias, setSubcategorias] = useState<SubcategoriaPeca[]>([])
  const [busca, setBusca] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<PecaBiblioteca | null>(null)
  const [form, setForm] = useState<PecaBiblioteca>(() => createEmptyPecaBibliotecaForm({}))
  const [qtdTexto, setQtdTexto] = useState('')
  const [erro, setErro] = useState('')
  const [novaCat, setNovaCat] = useState('')
  const [novaSub, setNovaSub] = useState('')
  const [catSubId, setCatSubId] = useState('')
  const [listaLimite, setListaLimite] = useState(LISTA_UI_LOTE)

  const persistPecas = useCallback(
    async (next: PecaBiblioteca[]) => {
      setPecas(next)
      await saveData(PECAS_STOCK_STORAGE_KEY, next)
    },
    [saveData]
  )
  const persistCategorias = useCallback(
    async (next: CategoriaPeca[]) => {
      setCategorias(next)
      await saveData(CATEGORIAS_PECAS_STOCK_STORAGE_KEY, next)
    },
    [saveData]
  )
  const persistSubs = useCallback(
    async (next: SubcategoriaPeca[]) => {
      setSubcategorias(next)
      await saveData(SUBCATEGORIAS_PECAS_STOCK_STORAGE_KEY, next)
    },
    [saveData]
  )

  useEffect(() => {
    let alive = true
    ;(async () => {
      const [p, c, s] = await Promise.all([
        loadData(PECAS_STOCK_STORAGE_KEY),
        loadData(CATEGORIAS_PECAS_STOCK_STORAGE_KEY),
        loadData(SUBCATEGORIAS_PECAS_STOCK_STORAGE_KEY),
      ])
      if (!alive) return
      setPecas(asArray<PecaBiblioteca>(p))
      setCategorias(asArray<CategoriaPeca>(c))
      setSubcategorias(asArray<SubcategoriaPeca>(s))
    })()
    return () => {
      alive = false
    }
  }, [loadData])

  const filtradas = useMemo(() => {
    const q = busca.trim().toLowerCase()
    if (!q) return pecas
    return pecas.filter((p) => {
      const cat = categorias.find((c) => c.id === p.categoriaId)?.nome || p.categoria || ''
      const sub = subcategorias.find((s) => s.id === p.subcategoriaId)?.nome || p.subcategoria || ''
      return [p.nome, p.codigo, p.descricao, cat, sub].some((x) => String(x || '').toLowerCase().includes(q))
    })
  }, [pecas, busca, categorias, subcategorias])

  const visiveis = filtradas.slice(0, listaLimite)

  const subsDaCat = useMemo(
    () => subcategorias.filter((s) => s.categoriaId === (form.categoriaId || '')),
    [subcategorias, form.categoriaId]
  )

  const abrirNova = () => {
    setEditing(null)
    setErro('')
    setForm(createEmptyPecaBibliotecaForm({}))
    setQtdTexto('')
    setShowForm(true)
  }

  const abrirEditar = (peca: PecaBiblioteca) => {
    setEditing(peca)
    setErro('')
    setForm({ ...peca })
    setQtdTexto(peca.quantidade != null && Number.isFinite(Number(peca.quantidade)) ? String(peca.quantidade) : '')
    setShowForm(true)
    setAba('cadastro')
  }

  const fecharForm = () => {
    setShowForm(false)
    setEditing(null)
    setErro('')
    setForm(createEmptyPecaBibliotecaForm({}))
    setQtdTexto('')
  }

  const guardar = async () => {
    if (!isPecaBibliotecaFormValid(form)) {
      setErro(tr(safeT, 'cadastroPecasStockNomeObrigatorio', 'Indique o nome e o código da peça.'))
      return
    }
    const codigo = codigoNorm(form.codigo)
    const duplicado = pecas.some(
      (p) => codigoNorm(p.codigo) === codigo && (!editing || p.id !== editing.id)
    )
    if (duplicado) {
      setErro(tr(safeT, 'cadastroPecasStockDuplicado', 'Já existe uma peça com este código neste stock.'))
      return
    }
    const cat = categorias.find((c) => c.id === form.categoriaId)
    const sub = subcategorias.find((s) => s.id === form.subcategoriaId && s.categoriaId === form.categoriaId)
    const qtd = qtdTexto.trim() === '' ? undefined : Number(qtdTexto.replace(',', '.'))
    const payload: PecaBiblioteca = {
      ...form,
      categoria: cat?.nome || '',
      categoriaId: cat?.id || '',
      subcategoria: sub?.nome || '',
      subcategoriaId: sub?.id || '',
      quantidade: Number.isFinite(qtd as number) ? (qtd as number) : undefined,
    }
    if (editing) {
      const actualizada = updatePecaBibliotecaFromForm(editing, payload)
      await persistPecas(pecas.map((p) => (p.id === editing.id ? actualizada : p)))
    } else {
      await persistPecas([...pecas, createPecaBibliotecaFromForm(payload)])
    }
    fecharForm()
  }

  const apagar = async (peca: PecaBiblioteca) => {
    const ok = window.confirm(
      `${tr(safeT, 'cadastroPecasStockApagar', 'Apagar')} «${peca.nome || peca.codigo}»?`
    )
    if (!ok) return
    await persistPecas(pecas.filter((p) => p.id !== peca.id))
    if (editing?.id === peca.id) fecharForm()
  }

  const addCategoria = async () => {
    if (!isCategoriaPecaFormValid(novaCat)) return
    const nova = createCategoriaPecaFromForm(novaCat)
    await persistCategorias([...categorias, nova])
    setNovaCat('')
    setCatSubId(nova.id)
  }

  const addSub = async () => {
    if (!isSubcategoriaPecaFormValid(novaSub, catSubId)) return
    const nova = createSubcategoriaPecaFromForm(novaSub, catSubId)
    await persistSubs([...subcategorias, nova])
    setNovaSub('')
  }

  const apagarCategoria = async (id: string) => {
    const ok = window.confirm(tr(safeT, 'cadastroPecasStockApagar', 'Apagar'))
    if (!ok) return
    await persistCategorias(categorias.filter((c) => c.id !== id))
    await persistSubs(subcategorias.filter((s) => s.categoriaId !== id))
    await persistPecas(
      pecas.map((p) =>
        p.categoriaId === id ? { ...p, categoriaId: '', categoria: '', subcategoriaId: '', subcategoria: '' } : p
      )
    )
  }

  const onFoto = (file?: File) => {
    if (!file || !file.type.startsWith('image/')) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      const result = ev.target?.result
      if (typeof result === 'string') setForm((prev) => ({ ...prev, imagem: result }))
    }
    reader.readAsDataURL(file)
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '10px 12px',
    background: '#1a1a1a',
    color: '#fff',
    border: '1px solid rgba(0, 200, 83, 0.35)',
    borderRadius: 8,
    fontSize: 14,
    boxSizing: 'border-box',
  }
  const tabClass = (id: AbaStock) =>
    'cadastro-valores-v2__tab' + (aba === id ? ' cadastro-valores-v2__tab--active' : '')

  return (
    <div className="tab-content-wrapper tab-glass-root tab-glass-root--wide ns-ui-v2 cadastro-valores-v2">
      <div className="cadastro-valores-v2__hero">
        <div className="cadastro-valores-v2__hero-row">
          <div style={{ display: 'flex', gap: 15, alignItems: 'center' }}>{logoSlot}</div>
          <div style={{ flex: 1, textAlign: 'center' }}>
            <h1 className="cadastro-valores-v2__hero-title">
              {tr(safeT, 'cadastroPecasStockTitle', 'CADASTRO DE PEÇAS EXISTENTES NO MEU STOCK')}
            </h1>
            <p className="cadastro-valores-v2__hero-meta">
              {pecas.length} {tr(safeT, 'quantidadePecas', 'peça(s)')} · {categorias.length}{' '}
              {tr(safeT, 'cadastroPecasStockCategorias', 'Categorias')}
            </p>
            <p className="cadastro-valores-v2__hero-meta" style={{ marginTop: 6 }}>
              {tr(
                safeT,
                'cadastroPecasStockHint',
                'Só cadastro manual das peças que tem em stock. Sem importação. A biblioteca continua no outro botão.'
              )}
            </p>
          </div>
        </div>
      </div>

      <div className="tab-nav-desktop cadastro-valores-v2__tabs">
        <button type="button" className={tabClass('cadastro')} onClick={() => setAba('cadastro')}>
          {tr(safeT, 'cadastroPecas', 'Cadastro de Peças')}
        </button>
        <button type="button" className={tabClass('categorias')} onClick={() => setAba('categorias')}>
          {tr(safeT, 'cadastroPecasStockCategorias', 'Categorias')}
        </button>
      </div>

      {aba === 'cadastro' ? (
        <>
          <div className="cadastro-valores-v2__grupos-bar-head" style={{ display: 'flex', gap: 12, marginBottom: 14, flexWrap: 'wrap', alignItems: 'center' }}>
            <button type="button" className="btn-primary" onClick={abrirNova}>
              {tr(safeT, 'novaPecaBiblioteca', 'Nova Peça')}
            </button>
            <input
              type="search"
              value={busca}
              onChange={(e) => {
                setBusca(e.target.value)
                setListaLimite(LISTA_UI_LOTE)
              }}
              placeholder={tr(safeT, 'cadastroPecasStockBusca', 'Procurar peça, código ou categoria')}
              style={{ ...inputStyle, maxWidth: 360 }}
            />
          </div>

          {showForm ? (
            <div className="biblioteca-pecas-form" style={{ marginBottom: 20, padding: 18, background: '#2a2a2a', border: '1px solid #00ff00', borderRadius: 12 }}>
              <h3 style={{ margin: '0 0 14px', color: '#00ff00' }}>
                {editing
                  ? tr(safeT, 'editPecaBiblioteca', 'Editar Peça')
                  : tr(safeT, 'novaPecaBiblioteca', 'Nova Peça')}
              </h3>
              {erro ? <p style={{ color: '#ff6b6b', margin: '0 0 12px' }}>{erro}</p> : null}

              <div className="biblioteca-pecas-form__field" style={{ marginBottom: 12 }}>
                <label className="biblioteca-pecas-form__label">{tr(safeT, 'imagemPecaBiblioteca', 'Imagem')}</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => onFoto(e.target.files?.[0])}
                  style={{ display: 'block', margin: '8px 0', color: '#ccc' }}
                />
                {form.imagem ? (
                  <div>
                    <img src={form.imagem} alt="" style={{ maxHeight: 120, borderRadius: 8, display: 'block', marginBottom: 8 }} />
                    <button type="button" className="btn-danger" onClick={() => setForm((p) => ({ ...p, imagem: '' }))}>
                      {tr(safeT, 'removeEquipamentoPhoto', 'Remover Imagem')}
                    </button>
                  </div>
                ) : null}
              </div>

              <div className="biblioteca-pecas-form__field" style={{ marginBottom: 12 }}>
                <label className="biblioteca-pecas-form__label">
                  {tr(safeT, 'nomePecaBiblioteca', 'Nome')} *
                </label>
                <input
                  style={inputStyle}
                  value={form.nome}
                  onChange={(e) => setForm((p) => ({ ...p, nome: e.target.value }))}
                />
              </div>
              <div className="biblioteca-pecas-form__field" style={{ marginBottom: 12 }}>
                <label className="biblioteca-pecas-form__label">
                  {tr(safeT, 'codigoPecaBiblioteca', 'Código')} *
                </label>
                <input
                  style={inputStyle}
                  value={form.codigo}
                  onChange={(e) => setForm((p) => ({ ...p, codigo: e.target.value }))}
                />
              </div>
              <div className="biblioteca-pecas-form__field" style={{ marginBottom: 12 }}>
                <label className="biblioteca-pecas-form__label">
                  {tr(safeT, 'cadastroPecasStockQtd', 'Quantidade em stock')}
                </label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  style={inputStyle}
                  value={qtdTexto}
                  onChange={(e) => setQtdTexto(e.target.value)}
                />
              </div>
              <div className="biblioteca-pecas-form__field" style={{ marginBottom: 12 }}>
                <label className="biblioteca-pecas-form__label">{tr(safeT, 'precoPecaBiblioteca', 'Preço (€)')}</label>
                <input
                  type="number"
                  step="0.01"
                  style={inputStyle}
                  value={form.preco || ''}
                  onChange={(e) => setForm((p) => ({ ...p, preco: e.target.value }))}
                />
              </div>
              <div className="biblioteca-pecas-form__field" style={{ marginBottom: 12 }}>
                <label className="biblioteca-pecas-form__label">{tr(safeT, 'descricaoPecaBiblioteca', 'Descrição')}</label>
                <AssistTextarea
                  className="biblioteca-pecas-form__textarea"
                  value={form.descricao ?? ''}
                  onValueChange={(v) => setForm((p) => ({ ...p, descricao: v }))}
                  rows={4}
                  style={{ ...inputStyle, minHeight: 90, resize: 'vertical' }}
                />
              </div>
              <div className="biblioteca-pecas-form__field" style={{ marginBottom: 12 }}>
                <label className="biblioteca-pecas-form__label">{tr(safeT, 'cadastroPecasStockCategorias', 'Categorias')}</label>
                <select
                  style={inputStyle}
                  value={form.categoriaId || ''}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, categoriaId: e.target.value, subcategoriaId: '', subcategoria: '' }))
                  }
                >
                  <option value="">{tr(safeT, 'cadastroPecasStockCategorias', 'Categorias')}</option>
                  {categorias.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nome}
                    </option>
                  ))}
                </select>
              </div>
              {form.categoriaId ? (
                <div className="biblioteca-pecas-form__field" style={{ marginBottom: 12 }}>
                  <label className="biblioteca-pecas-form__label">
                    {tr(safeT, 'cadastroPecasStockNovaSub', 'Subcategoria')}
                  </label>
                  <select
                    style={inputStyle}
                    value={form.subcategoriaId || ''}
                    onChange={(e) => setForm((p) => ({ ...p, subcategoriaId: e.target.value }))}
                  >
                    <option value="">—</option>
                    {subsDaCat.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.nome}
                      </option>
                    ))}
                  </select>
                </div>
              ) : null}

              <div className="cadastro-valores-v2__form-actions" style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <button type="button" className="btn-primary" onClick={() => void guardar()}>
                  {tr(safeT, 'cadastroPecasStockGuardar', 'Guardar peça')}
                </button>
                <button type="button" className="btn-primary" onClick={fecharForm}>
                  {tr(safeT, 'cancel', 'Cancelar')}
                </button>
              </div>
            </div>
          ) : null}

          {visiveis.length === 0 ? (
            <p style={{ color: '#888' }}>
              {tr(safeT, 'cadastroPecasStockVazio', 'Ainda não há peças neste stock.')}
            </p>
          ) : (
            <div style={{ display: 'grid', gap: 10 }}>
              {visiveis.map((peca) => {
                const cat = categorias.find((c) => c.id === peca.categoriaId)?.nome || peca.categoria || ''
                return (
                  <div
                    key={peca.id}
                    style={{
                      background: '#2a2a2a',
                      border: '1px solid #00ff00',
                      borderRadius: 10,
                      padding: 12,
                      display: 'flex',
                      gap: 12,
                      alignItems: 'center',
                    }}
                  >
                    {peca.imagem ? (
                      <img src={peca.imagem} alt="" style={{ width: 56, height: 56, objectFit: 'cover', borderRadius: 8 }} />
                    ) : (
                      <div
                        style={{
                          width: 56,
                          height: 56,
                          borderRadius: 8,
                          background: '#1a1a1a',
                          border: '1px solid #444',
                        }}
                      />
                    )}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ color: '#fff', fontWeight: 700 }}>{peca.nome}</div>
                      <div style={{ color: '#9f9', fontSize: 13 }}>{peca.codigo}</div>
                      <div style={{ color: '#aaa', fontSize: 12 }}>
                        {cat}
                        {peca.quantidade != null ? ` · ${tr(safeT, 'cadastroPecasStockQtd', 'Qtd.')}: ${peca.quantidade}` : ''}
                      </div>
                    </div>
                    <div className="cadastro-valores-v2__form-actions" style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                      <button type="button" className="btn-primary cadastro-valores-v2__btn-sm" onClick={() => abrirEditar(peca)}>
                        {tr(safeT, 'cadastroPecasStockEditar', 'Editar')}
                      </button>
                      <button type="button" className="btn-danger cadastro-valores-v2__btn-sm" onClick={() => void apagar(peca)}>
                        {tr(safeT, 'cadastroPecasStockApagar', 'Apagar')}
                      </button>
                    </div>
                  </div>
                )
              })}
              {filtradas.length > visiveis.length ? (
                <button type="button" className="btn-primary" onClick={() => setListaLimite((n) => n + LISTA_UI_LOTE)}>
                  {tr(safeT, 'mostrarMais', 'Mostrar mais')} ({filtradas.length - visiveis.length})
                </button>
              ) : null}
            </div>
          )}
        </>
      ) : (
        <div style={{ display: 'grid', gap: 18 }}>
          <div style={{ background: '#2a2a2a', border: '1px solid #00ff00', borderRadius: 12, padding: 16 }}>
            <h3 style={{ margin: '0 0 10px', color: '#00ff00' }}>
              {tr(safeT, 'cadastroPecasStockNovaCategoria', 'Nova categoria')}
            </h3>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <input style={{ ...inputStyle, maxWidth: 320 }} value={novaCat} onChange={(e) => setNovaCat(e.target.value)} />
              <button type="button" className="btn-primary" onClick={() => void addCategoria()}>
                {tr(safeT, 'cadastroPecasStockNovaCategoria', 'Nova categoria')}
              </button>
            </div>
            <div style={{ marginTop: 12, display: 'grid', gap: 8 }}>
              {categorias.map((c) => (
                <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', gap: 8, color: '#fff' }}>
                  <span>{c.nome}</span>
                  <button type="button" className="btn-danger cadastro-valores-v2__btn-sm" onClick={() => void apagarCategoria(c.id)}>
                    {tr(safeT, 'cadastroPecasStockApagar', 'Apagar')}
                  </button>
                </div>
              ))}
            </div>
          </div>
          <div style={{ background: '#2a2a2a', border: '1px solid #00ff00', borderRadius: 12, padding: 16 }}>
            <h3 style={{ margin: '0 0 10px', color: '#00ff00' }}>
              {tr(safeT, 'cadastroPecasStockNovaSub', 'Nova subcategoria')}
            </h3>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <select style={{ ...inputStyle, maxWidth: 220 }} value={catSubId} onChange={(e) => setCatSubId(e.target.value)}>
                <option value="">{tr(safeT, 'cadastroPecasStockCategorias', 'Categorias')}</option>
                {categorias.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nome}
                  </option>
                ))}
              </select>
              <input style={{ ...inputStyle, maxWidth: 280 }} value={novaSub} onChange={(e) => setNovaSub(e.target.value)} />
              <button type="button" className="btn-primary" onClick={() => void addSub()}>
                {tr(safeT, 'cadastroPecasStockNovaSub', 'Nova subcategoria')}
              </button>
            </div>
            <div style={{ marginTop: 12, display: 'grid', gap: 8 }}>
              {subcategorias.map((s) => (
                <div key={s.id} style={{ color: '#ccc', fontSize: 13 }}>
                  {categorias.find((c) => c.id === s.categoriaId)?.nome || '—'} → {s.nome}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
