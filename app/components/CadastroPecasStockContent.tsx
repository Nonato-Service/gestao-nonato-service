'use client'

import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { AssistTextarea } from './AssistTextFields'
import { LISTA_UI_LOTE } from '../lib/listaUiLote'
import {
  isCategoriaPecaFormValid,
  isPecaBibliotecaFormValid,
  isSubcategoriaPecaFormValid,
  pecaBibliotecaSrcCapaDisplay,
  pecaBibliotecaTemCapaOuFotoVisivel,
  type CategoriaPeca,
  type PecaBiblioteca,
  type SubcategoriaPeca,
} from '../modules/biblioteca'
import { BibliotecaPecasGaleriaCategorias } from './BibliotecaPecasGaleriaCategorias'
import { BibliotecaPrecoOlhoToggle } from './BibliotecaPrecoOlhoToggle'
import {
  PECAS_STOCK_STORAGE_KEY,
  CATEGORIAS_PECAS_STOCK_STORAGE_KEY,
  SUBCATEGORIAS_PECAS_STOCK_STORAGE_KEY,
} from '../modules/biblioteca/stockKeys'
import { mergeArraysByIdDeferServerLocal } from '../lib/mergeArraysById'
import { compressImageDataUrlIfNeeded, compressImageFileToJpegDataUrl } from '../lib/diarioCompressImage'
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

type AbaStock = 'cadastro' | 'biblioteca' | 'categorias'

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
  const [galeriaCategoriaId, setGaleriaCategoriaId] = useState<string | null>(null)
  const [buscaGaleria, setBuscaGaleria] = useState('')
  const [mostrarPrecos, setMostrarPrecos] = useState(false)

  const persistPecas = useCallback(
    async (next: PecaBiblioteca[]) => {
      const fromLoad = asArray<PecaBiblioteca>(await loadData(PECAS_STOCK_STORAGE_KEY))
      const merged =
        next.length < pecas.length
          ? next
          : mergeArraysByIdDeferServerLocal<PecaBiblioteca>(next, fromLoad)
      setPecas(merged)
      const ok = await saveData(PECAS_STOCK_STORAGE_KEY, merged, true, true)
      if (!ok) {
        setErro(
          tr(safeT, 'cadastroPecasStockFalhaServidor', 'Não gravou no servidor. Volte a guardar com internet.')
        )
      }
      return ok
    },
    [saveData, loadData, pecas.length, safeT]
  )
  const persistCategorias = useCallback(
    async (next: CategoriaPeca[]) => {
      const fromLoad = asArray<CategoriaPeca>(await loadData(CATEGORIAS_PECAS_STOCK_STORAGE_KEY))
      const merged =
        next.length < categorias.length
          ? next
          : mergeArraysByIdDeferServerLocal<CategoriaPeca>(next, fromLoad)
      setCategorias(merged)
      await saveData(CATEGORIAS_PECAS_STOCK_STORAGE_KEY, merged, true, true)
    },
    [saveData, loadData, categorias.length]
  )
  const persistSubs = useCallback(
    async (next: SubcategoriaPeca[]) => {
      const fromLoad = asArray<SubcategoriaPeca>(await loadData(SUBCATEGORIAS_PECAS_STOCK_STORAGE_KEY))
      const merged =
        next.length < subcategorias.length
          ? next
          : mergeArraysByIdDeferServerLocal<SubcategoriaPeca>(next, fromLoad)
      setSubcategorias(merged)
      await saveData(SUBCATEGORIAS_PECAS_STOCK_STORAGE_KEY, merged, true, true)
    },
    [saveData, loadData, subcategorias.length]
  )

  useEffect(() => {
    let alive = true
    let seq = 0
    let pushing = false
    let lastPushed = 0
    const carregar = async () => {
      const ticket = ++seq
      const [p, c, s] = await Promise.all([
        loadData(PECAS_STOCK_STORAGE_KEY),
        loadData(CATEGORIAS_PECAS_STOCK_STORAGE_KEY),
        loadData(SUBCATEGORIAS_PECAS_STOCK_STORAGE_KEY),
      ])
      if (!alive || ticket !== seq) return
      const incoming = asArray<PecaBiblioteca>(p)
      let merged: PecaBiblioteca[] = incoming
      setPecas((prev) => {
        merged = mergeArraysByIdDeferServerLocal<PecaBiblioteca>(incoming, prev)
        return merged
      })
      let fotosReduzidas = false
      const leves: PecaBiblioteca[] = []
      for (const peca of merged) {
        const img = String(peca.imagem || '')
        if (img.length > 960_000) {
          try {
            const nextImg = await compressImageDataUrlIfNeeded(img)
            if (nextImg !== img) {
              fotosReduzidas = true
              leves.push({ ...peca, imagem: nextImg })
              continue
            }
          } catch {
            /* mantém a foto original */
          }
        }
        leves.push(peca)
      }
      if (!alive || ticket !== seq) return
      if (fotosReduzidas) {
        merged = leves
        setPecas(leves)
      }
      setCategorias(asArray<CategoriaPeca>(c))
      setSubcategorias(asArray<SubcategoriaPeca>(s))
      if ((merged.length > lastPushed || fotosReduzidas) && !pushing) {
        lastPushed = merged.length
        pushing = true
        try {
          const ok = await saveData(PECAS_STOCK_STORAGE_KEY, merged, true, true)
          if (!ok) {
            lastPushed = 0
            setErro(
              tr(
                safeT,
                'cadastroPecasStockFalhaServidor',
                'Não gravou no servidor. Volte a guardar com internet.'
              )
            )
          }
        } finally {
          pushing = false
        }
      }
    }
    void carregar()
    const onLocal = (ev: Event) => {
      if (pushing) return
      const key = (ev as CustomEvent<{ key?: string }>).detail?.key
      if (
        key === PECAS_STOCK_STORAGE_KEY ||
        key === CATEGORIAS_PECAS_STOCK_STORAGE_KEY ||
        key === SUBCATEGORIAS_PECAS_STOCK_STORAGE_KEY
      ) {
        void carregar()
      }
    }
    const onShow = () => {
      if (document.visibilityState === 'visible') void carregar()
    }
    window.addEventListener('nonato-data-local-changed', onLocal)
    window.addEventListener('focus', onShow)
    document.addEventListener('visibilitychange', onShow)
    const poll = window.setInterval(() => {
      void carregar()
    }, 20000)
    return () => {
      alive = false
      window.clearInterval(poll)
      window.removeEventListener('nonato-data-local-changed', onLocal)
      window.removeEventListener('focus', onShow)
      document.removeEventListener('visibilitychange', onShow)
    }
  }, [loadData, saveData])

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
      const ok = await persistPecas(pecas.map((p) => (p.id === editing.id ? actualizada : p)))
      if (!ok) return
    } else {
      const ok = await persistPecas([...pecas, createPecaBibliotecaFromForm(payload)])
      if (!ok) return
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
    void compressImageFileToJpegDataUrl(file)
      .then((result) => setForm((prev) => ({ ...prev, imagem: result })))
      .catch(() => {})
  }

  const tabClass = (id: AbaStock) =>
    id === 'categorias'
      ? `biblioteca-hub-tab biblioteca-hub-tab--purple${aba === id ? ' biblioteca-hub-tab--active' : ''}`
      : `biblioteca-hub-tab${aba === id ? ' biblioteca-hub-tab--active' : ''}`

  const pecasComFoto = pecas.filter((p) => Boolean(String(p.imagem || '').trim())).length
  const pecasSemFoto = pecas.length - pecasComFoto

  return (
    <div className="tab-content-wrapper tab-glass-root biblioteca-pecas-hub ns-ui-v2" style={{ overflow: 'visible' }}>
      <div className="biblioteca-pecas-hub__hero-ring">
        <div className="tab-glass-hero tab-glass-hero--compact biblioteca-pecas-hub__hero">
          <div className="biblioteca-pecas-hub__hero-top">
            <div className="biblioteca-pecas-hub__hero-brand">
              <div className="biblioteca-pecas-hub__hero-logo" aria-hidden="true">
                {logoSlot}
              </div>
              <div className="biblioteca-pecas-hub__hero-head">
                <p className="biblioteca-pecas-hub__eyebrow biblioteca-pecas-hub__hero-eyebrow">
                  {tr(safeT, 'cadastroPecasStockDesc', 'Peças existentes no meu stock')}
                </p>
                <h1 className="biblioteca-pecas-hub__hero-title">
                  {tr(safeT, 'cadastroPecasStockTitle', 'CADASTRO DE PEÇAS EXISTENTES NO MEU STOCK')}
                </h1>
                <p className="biblioteca-pecas-hub__hero-tagline">
                  {tr(
                    safeT,
                    'cadastroPecasStockHint',
                    'Só cadastro manual das peças que tem em stock. A biblioteca continua no outro botão.'
                  )}
                </p>
              </div>
            </div>
            <div className="biblioteca-pecas-hub__hero-actions">
              <button
                type="button"
                className="biblioteca-btn--green"
                onClick={() => {
                  setAba('cadastro')
                  abrirNova()
                }}
              >
                {tr(safeT, 'novaPecaBiblioteca', 'Nova Peça')}
              </button>
              <button
                type="button"
                className="biblioteca-btn--purple"
                onClick={() => setAba('categorias')}
              >
                {tr(safeT, 'gerenciarCategorias', 'Gerenciar Categorias')}
              </button>
            </div>
          </div>

          <div
            className="biblioteca-pecas-hub__hero-kpis"
            aria-label={tr(safeT, 'bibliotecaVisaoGeral', 'Visão geral')}
          >
            <div className="biblioteca-pecas-hub__kpi-card biblioteca-pecas-hub__kpi-card--pecas">
              <span className="biblioteca-pecas-hub__kpi-label">
                {tr(safeT, 'quantidadePecas', 'Peças no catálogo')}
              </span>
              <span className="biblioteca-pecas-hub__kpi-value">{pecas.length}</span>
            </div>
            <div className="biblioteca-pecas-hub__kpi-card biblioteca-pecas-hub__kpi-card--cats">
              <span className="biblioteca-pecas-hub__kpi-label">
                {tr(safeT, 'quantidadeCategorias', 'Categorias')}
              </span>
              <span className="biblioteca-pecas-hub__kpi-value">{categorias.length}</span>
            </div>
            <div
              className={`biblioteca-pecas-hub__kpi-card biblioteca-pecas-hub__kpi-card--foto${pecasSemFoto > 0 ? ' biblioteca-pecas-hub__kpi-card--warn' : ''}`}
            >
              <span className="biblioteca-pecas-hub__kpi-label">
                {pecasSemFoto > 0
                  ? tr(safeT, 'bibliotecaHeroKpiSemFoto', 'Sem foto')
                  : tr(safeT, 'bibliotecaHeroKpiComFoto', 'Com foto')}
              </span>
              <span className="biblioteca-pecas-hub__kpi-value">
                {pecasSemFoto > 0 ? pecasSemFoto : pecasComFoto}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="biblioteca-hub-nav biblioteca-hub-nav--v2">
        <div
          role="tablist"
          className="biblioteca-hub-tablist biblioteca-hub-tablist--primary"
          aria-label={tr(safeT, 'cadastroPecasStockTitle', 'Cadastro de peças do stock')}
        >
          <button
            type="button"
            role="tab"
            className={tabClass('cadastro')}
            aria-selected={aba === 'cadastro'}
            title={tr(safeT, 'cadastroPecas', 'Cadastro de Peças')}
            onClick={() => setAba('cadastro')}
          >
            <span className="biblioteca-hub-tab__inner">
              <span className="biblioteca-hub-tab__icon" aria-hidden>
                📝
              </span>
              <span className="biblioteca-hub-tab__label">{tr(safeT, 'cadastroPecas', 'Cadastro de Peças')}</span>
            </span>
          </button>
          <button
            type="button"
            role="tab"
            className={tabClass('biblioteca')}
            aria-selected={aba === 'biblioteca'}
            title={tr(safeT, 'bibliotecaPecas', 'Biblioteca')}
            onClick={() => {
              setGaleriaCategoriaId(null)
              setAba('biblioteca')
            }}
          >
            <span className="biblioteca-hub-tab__inner">
              <span className="biblioteca-hub-tab__icon" aria-hidden>
                📚
              </span>
              <span className="biblioteca-hub-tab__label">{tr(safeT, 'bibliotecaPecas', 'Biblioteca')}</span>
            </span>
          </button>
          <button
            type="button"
            role="tab"
            className={tabClass('categorias')}
            aria-selected={aba === 'categorias'}
            title={tr(safeT, 'cadastroPecasStockCategorias', 'Categorias')}
            onClick={() => setAba('categorias')}
          >
            <span className="biblioteca-hub-tab__inner">
              <span className="biblioteca-hub-tab__icon" aria-hidden>
                📁
              </span>
              <span className="biblioteca-hub-tab__label">
                {tr(safeT, 'cadastroPecasStockCategorias', 'Categorias')}
              </span>
            </span>
          </button>
        </div>
      </div>

      {aba === 'cadastro' ? (
        <>
          <p
            style={{
              margin: '0 0 16px',
              fontSize: '13px',
              color: 'rgba(190, 255, 210, 0.95)',
              lineHeight: 1.55,
            }}
          >
            {tr(
              safeT,
              'bibliotecaCadastroSomenteHint',
              'Cadastre ou edite peças aqui. Consulte o catálogo visual na aba Biblioteca.'
            )}
          </p>

          <button type="button" className="btn-primary" onClick={abrirNova} style={{ marginBottom: 20 }}>
            {tr(safeT, 'novaPecaBiblioteca', 'Nova Peça')}
          </button>

          <div className="biblioteca-pecas-form__field ns-stock-busca" style={{ maxWidth: 420, marginBottom: 18 }}>
            <label className="ns-stock-busca-label" htmlFor="stock-pecas-busca">
              {tr(safeT, 'cadastroPecasStockBusca', 'Procurar peça, código ou categoria')}
            </label>
            <input
              id="stock-pecas-busca"
              type="search"
              className="biblioteca-pecas-form__input"
              value={busca}
              onChange={(e) => {
                setBusca(e.target.value)
                setListaLimite(LISTA_UI_LOTE)
              }}
              placeholder={tr(safeT, 'cadastroPecasStockBuscaPh', 'Nome, código ou categoria')}
            />
          </div>

          {showForm ? (
            <div className="biblioteca-pecas-form">
              <h3 className="biblioteca-pecas-form__title">
                {editing
                  ? tr(safeT, 'editPecaBiblioteca', 'Editar Peça')
                  : tr(safeT, 'novaPecaBiblioteca', 'Nova Peça')}
              </h3>
              {erro ? (
                <p style={{ color: '#ff9a9a', margin: '0 0 12px', fontSize: 13 }}>{erro}</p>
              ) : null}

              <label
                className="file-upload-label biblioteca-pecas-form__label"
                htmlFor="peca-stock-image-upload"
                style={{ marginBottom: 10 }}
              >
                {tr(safeT, 'imagemPecaBiblioteca', 'Imagem da Peça')}
              </label>
              <input
                id="peca-stock-image-upload"
                type="file"
                accept="image/*"
                onChange={(e) => onFoto(e.target.files?.[0])}
                style={{ display: 'none' }}
              />
              <button
                type="button"
                className="btn-primary"
                onClick={() => document.getElementById('peca-stock-image-upload')?.click()}
                style={{ marginBottom: 10, padding: '8px 15px', fontSize: 13 }}
              >
                {tr(safeT, 'selectPhoto', 'Selecionar Foto')}
              </button>
              {form.imagem ? (
                <div className="biblioteca-pecas-form__preview-wrap">
                  <div className="biblioteca-pecas-form__preview-frame">
                    <img
                      src={form.imagem}
                      alt={tr(safeT, 'imagemPecaBiblioteca', 'Imagem da Peça')}
                      style={{ width: '100%', maxHeight: 200, objectFit: 'cover', display: 'block' }}
                    />
                  </div>
                  <button
                    type="button"
                    className="btn-danger"
                    onClick={() => setForm((p) => ({ ...p, imagem: '' }))}
                    style={{ display: 'block', margin: 'auto', padding: '5px 10px', fontSize: 12 }}
                  >
                    {tr(safeT, 'removeEquipamentoPhoto', 'Remover Imagem')}
                  </button>
                </div>
              ) : null}

              <div className="biblioteca-pecas-form__field">
                <label className="biblioteca-pecas-form__label">
                  {tr(safeT, 'nomePecaBiblioteca', 'Nome')}{' '}
                  <span className="biblioteca-pecas-form__required">*</span>
                </label>
                <input
                  type="text"
                  className="biblioteca-pecas-form__input"
                  placeholder={tr(safeT, 'nomePecaBiblioteca', 'Nome')}
                  value={form.nome}
                  onChange={(e) => setForm((p) => ({ ...p, nome: e.target.value }))}
                />
              </div>
              <div className="biblioteca-pecas-form__field">
                <label className="biblioteca-pecas-form__label">
                  {tr(safeT, 'codigoPecaBiblioteca', 'Código')}{' '}
                  <span className="biblioteca-pecas-form__required">*</span>
                </label>
                <input
                  type="text"
                  className="biblioteca-pecas-form__input"
                  placeholder={tr(safeT, 'codigoPecaBiblioteca', 'Código')}
                  value={form.codigo}
                  onChange={(e) => setForm((p) => ({ ...p, codigo: e.target.value }))}
                />
              </div>
              <div className="biblioteca-pecas-form__field">
                <label className="biblioteca-pecas-form__label">
                  {tr(safeT, 'cadastroPecasStockQtd', 'Quantidade em stock')}
                </label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  className="biblioteca-pecas-form__input"
                  value={qtdTexto}
                  onChange={(e) => setQtdTexto(e.target.value)}
                />
              </div>
              <div className="biblioteca-pecas-form__field">
                <label className="biblioteca-pecas-form__label">
                  {tr(safeT, 'precoPecaBiblioteca', 'Preço (€)')}
                </label>
                <input
                  type="number"
                  step="0.01"
                  className="biblioteca-pecas-form__input"
                  placeholder={tr(safeT, 'precoPecaBiblioteca', 'Preço (€)')}
                  value={form.preco || ''}
                  onChange={(e) => setForm((p) => ({ ...p, preco: e.target.value }))}
                />
              </div>
              <div className="biblioteca-pecas-form__field">
                <label className="biblioteca-pecas-form__label">
                  {tr(safeT, 'descricaoPecaBiblioteca', 'Descrição')}
                </label>
                <AssistTextarea
                  className="biblioteca-pecas-form__textarea"
                  placeholder={tr(safeT, 'descricaoPecaBiblioteca', 'Descrição')}
                  value={form.descricao ?? ''}
                  onValueChange={(v) => setForm((p) => ({ ...p, descricao: v }))}
                  rows={4}
                  style={{ resize: 'vertical' }}
                />
              </div>
              <div className="biblioteca-pecas-form__field">
                <label className="biblioteca-pecas-form__label">
                  {tr(safeT, 'categoriaPecaBiblioteca', 'Grupo')}
                </label>
                <select
                  className="biblioteca-pecas-form__input"
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
                <div className="biblioteca-pecas-form__field">
                  <label className="biblioteca-pecas-form__label">
                    {tr(safeT, 'subcategoriaPecaBiblioteca', 'Subcategoria')}
                  </label>
                  <select
                    className="biblioteca-pecas-form__input"
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

              <div className="biblioteca-pecas-form__actions">
                <button
                  type="button"
                  className="btn-primary biblioteca-pecas-form__save-btn"
                  onClick={() => void guardar()}
                >
                  {tr(safeT, 'save', 'Salvar')}
                </button>
                <button type="button" className="btn-secondary" onClick={fecharForm}>
                  {tr(safeT, 'cancel', 'Cancelar')}
                </button>
              </div>
            </div>
          ) : null}

          {visiveis.length === 0 ? (
            <p className="biblioteca-pecas-hub__grupos-empty">
              {tr(safeT, 'cadastroPecasStockVazio', 'Ainda não há peças neste stock.')}
            </p>
          ) : (
            <div className="biblioteca-pecas-hub__catalog-table-wrap ns-stock-catalog-wrap">
              <table className="biblioteca-pecas-hub__catalog-table ns-stock-catalog-table">
                <thead>
                  <tr>
                    <th className="biblioteca-pecas-hub__catalog-th biblioteca-pecas-hub__catalog-th--thumb">
                      {tr(safeT, 'fotoColunaBiblioteca', 'Foto')}
                    </th>
                    <th className="biblioteca-pecas-hub__catalog-th">{tr(safeT, 'nome', 'Nome')}</th>
                    <th className="biblioteca-pecas-hub__catalog-th">
                      {tr(safeT, 'codigoPecaBiblioteca', 'Código')}
                    </th>
                    <th className="biblioteca-pecas-hub__catalog-th">
                      {tr(safeT, 'categoriaPecaBiblioteca', 'Grupo')}
                    </th>
                    <th className="biblioteca-pecas-hub__catalog-th ns-stock-th-qtd">
                      {tr(safeT, 'cadastroPecasStockQtdCol', 'Qtd.')}
                    </th>
                    <th className="biblioteca-pecas-hub__catalog-th biblioteca-pecas-hub__catalog-th--right">
                      {tr(safeT, 'preco', 'Preço')}
                    </th>
                    <th className="biblioteca-pecas-hub__catalog-th biblioteca-pecas-hub__catalog-th--actions" />
                  </tr>
                </thead>
                <tbody>
                  {visiveis.map((peca, idx) => {
                    const cat = categorias.find((c) => c.id === peca.categoriaId)?.nome || peca.categoria || ''
                    const temFoto = Boolean(String(peca.imagem || '').trim())
                    return (
                      <tr
                        key={peca.id}
                        className={`biblioteca-pecas-hub__catalog-row${idx % 2 === 0 ? ' biblioteca-pecas-hub__catalog-row--a' : ' biblioteca-pecas-hub__catalog-row--b'}`}
                      >
                        <td className="biblioteca-pecas-hub__catalog-td biblioteca-pecas-hub__catalog-td--thumb">
                          {temFoto ? (
                            <img
                              src={peca.imagem}
                              alt=""
                              className="biblioteca-pecas-hub__catalog-img"
                            />
                          ) : (
                            <span className="biblioteca-pecas-hub__catalog-img biblioteca-pecas-hub__catalog-img--padrao" />
                          )}
                        </td>
                        <td className="biblioteca-pecas-hub__catalog-td biblioteca-pecas-hub__catalog-td--name">
                          {peca.nome}
                        </td>
                        <td className="biblioteca-pecas-hub__catalog-td ns-stock-meta">
                          <span className="ns-stock-meta-k">{tr(safeT, 'codigoPecaBiblioteca', 'Código')}</span>
                          <span>{peca.codigo || '—'}</span>
                        </td>
                        <td className="biblioteca-pecas-hub__catalog-td ns-stock-meta">
                          <span className="ns-stock-meta-k">{tr(safeT, 'categoriaPecaBiblioteca', 'Grupo')}</span>
                          <span>{cat || '—'}</span>
                        </td>
                        <td className="biblioteca-pecas-hub__catalog-td ns-stock-meta">
                          <span className="ns-stock-meta-k">{tr(safeT, 'cadastroPecasStockQtdCol', 'Qtd.')}</span>
                          <span>{peca.quantidade != null ? peca.quantidade : '—'}</span>
                        </td>
                        <td className="biblioteca-pecas-hub__catalog-td biblioteca-pecas-hub__catalog-td--price ns-stock-meta">
                          <span className="ns-stock-meta-k">{tr(safeT, 'preco', 'Preço')}</span>
                          <span className="ns-stock-meta-preco">{peca.preco || '—'}</span>
                        </td>
                        <td className="biblioteca-pecas-hub__catalog-td biblioteca-pecas-hub__catalog-td--actions">
                          <div className="biblioteca-pecas-hub__catalog-actions">
                            <button
                              type="button"
                              className="btn-primary biblioteca-pecas-hub__catalog-btn"
                              onClick={() => abrirEditar(peca)}
                            >
                              {tr(safeT, 'cadastroPecasStockEditar', 'Editar')}
                            </button>
                            <button
                              type="button"
                              className="btn-danger biblioteca-pecas-hub__catalog-btn"
                              onClick={() => void apagar(peca)}
                            >
                              {tr(safeT, 'cadastroPecasStockApagar', 'Apagar')}
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
              {filtradas.length > visiveis.length ? (
                <button
                  type="button"
                  className="btn-primary"
                  style={{ margin: 12 }}
                  onClick={() => setListaLimite((n) => n + LISTA_UI_LOTE)}
                >
                  {tr(safeT, 'mostrarMais', 'Mostrar mais')} ({filtradas.length - visiveis.length})
                </button>
              ) : null}
            </div>
          )}
        </>
      ) : aba === 'biblioteca' ? (
        <>
          <p
            style={{
              margin: '0 0 16px',
              fontSize: '13px',
              color: 'rgba(190, 255, 210, 0.95)',
              lineHeight: 1.55,
            }}
          >
            {tr(
              safeT,
              'cadastroPecasStockBibliotecaHint',
              'Vista só por categoria (consulta). Para gravar ou editar peças, use a aba Cadastro de Peças.'
            )}
          </p>
          <div className="biblioteca-preco-olho-bar" role="region" aria-label={tr(safeT, 'preco', 'Preço')}>
            <BibliotecaPrecoOlhoToggle
              ativo={mostrarPrecos}
              onToggle={() => setMostrarPrecos((v) => !v)}
              labelMostrar={tr(safeT, 'bibliotecaVerPrecos', 'Ver preços')}
              labelOcultar={tr(safeT, 'bibliotecaOcultarPrecos', 'Ocultar preços')}
            />
            <span className="biblioteca-preco-olho-bar__hint">
              {tr(
                safeT,
                'bibliotecaPrecoOlhoHintCurto',
                'Clique no olho para mostrar ou ocultar preços (€). Só peças com preço guardado.'
              )}
            </span>
          </div>
          <BibliotecaPecasGaleriaCategorias
            categorias={categorias}
            pecasCatalogo={pecas}
            categoriaSelecionadaId={galeriaCategoriaId}
            onSelecionarCategoria={setGaleriaCategoriaId}
            onVoltarCategorias={() => setGaleriaCategoriaId(null)}
            srcImagem={(input) => pecaBibliotecaSrcCapaDisplay(input)}
            temImagemPropria={pecaBibliotecaTemCapaOuFotoVisivel}
            buscaCodigo={buscaGaleria}
            onBuscaCodigoChange={(value) => {
              setBuscaGaleria(value)
              if (value.trim()) setGaleriaCategoriaId(null)
            }}
            mostrarPrecos={mostrarPrecos}
            t={{
              titulo: tr(safeT, 'bibliotecaGaleriaCategoriasTitulo', 'Categorias'),
              descricao: tr(
                safeT,
                'bibliotecaGaleriaCategoriasDesc',
                'Escolha uma categoria para ver todas as imagens das peças.'
              ),
              voltar: tr(safeT, 'bibliotecaGaleriaVoltarCategorias', 'Voltar às categorias'),
              pecasCount: tr(safeT, 'bibliotecaGaleriaPecasNaCategoria', '{n} peça(s)'),
              semImagem: tr(safeT, 'bibliotecaGaleriaSemImagemCategoria', 'Sem imagem'),
              cliqueAbrir: tr(safeT, 'bibliotecaGaleriaCliqueCategoria', 'Abrir categoria'),
              codigo: tr(safeT, 'codigoPecaBiblioteca', 'Código'),
              semPecasCategoria: tr(safeT, 'bibliotecaGaleriaSemPecasCategoria', 'Nenhuma peça nesta categoria.'),
              buscarCodigoOuNome: tr(safeT, 'bibliotecaBuscarCodigoOuNome', 'Buscar por código ou nome'),
              buscarPorCodigo: tr(safeT, 'bibliotecaGaleriaBuscaTitulo', 'Buscar por código'),
              buscarPorNome: tr(safeT, 'bibliotecaBuscarPorNome', 'Buscar por nome'),
              buscaModoCodigo: tr(safeT, 'bibliotecaBuscaModoCodigo', 'Código'),
              buscaModoNome: tr(safeT, 'bibliotecaBuscaModoNome', 'Nome'),
              buscarPlaceholderNome: tr(safeT, 'bibliotecaBuscaNomePlaceholder', 'Nome da peça…'),
              buscaHint: tr(safeT, 'bibliotecaGaleriaBuscaHint', 'Procure por código ou nome.'),
              buscarPlaceholderCodigoOuNome: tr(
                safeT,
                'bibliotecaBuscaCodigoOuNomePlaceholder',
                'Código ou nome da peça…'
              ),
              buscarPlaceholder: tr(safeT, 'codigoPecaBibliotecaPlaceholder', 'Código'),
              buscaResultados: tr(safeT, 'bibliotecaBuscaCodigoResultados', '{n} resultado(s)'),
              buscaResultadosNome: tr(safeT, 'bibliotecaBuscaResultadosNome', '{n} resultado(s)'),
              buscaVazio: tr(safeT, 'bibliotecaBuscaCodigoVazio', 'Nenhuma peça encontrada.'),
              buscaVazioNome: tr(safeT, 'bibliotecaBuscaVazioNome', 'Nenhuma peça encontrada.'),
              buscaLimite: tr(safeT, 'bibliotecaBuscaLimite', 'A mostrar os primeiros resultados.'),
              carregarMais: tr(safeT, 'bibliotecaCarregarMais', 'Mostrar mais ({restantes} restantes)'),
              limparBusca: tr(safeT, 'limparFiltros', 'Limpar busca'),
              preco: tr(safeT, 'preco', 'Preço'),
            }}
          />
        </>
      ) : (
        <div className="biblioteca-pecas-hub__grupos-panel">
          <div className="biblioteca-pecas-hub__grupos-header">
            <div>
              <h3 className="biblioteca-pecas-hub__grupos-title">
                {tr(safeT, 'gerenciarCategorias', 'Gerenciar Categorias e Subcategorias')}
              </h3>
              <p className="biblioteca-pecas-hub__grupos-meta">
                {categorias.length} {tr(safeT, 'quantidadeCategorias', 'Categorias')} · {subcategorias.length}{' '}
                {tr(safeT, 'quantidadeSubcategorias', 'Subcategorias')}
              </p>
            </div>
          </div>

          <div className="biblioteca-pecas-hub__grupo-card">
            <h4 className="biblioteca-pecas-form__title">
              {tr(safeT, 'cadastroPecasStockNovaCategoria', 'Nova categoria')}
            </h4>
            <div className="biblioteca-pecas-form__field" style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <input
                className="biblioteca-pecas-form__input"
                style={{ maxWidth: 320 }}
                value={novaCat}
                onChange={(e) => setNovaCat(e.target.value)}
                placeholder={tr(safeT, 'nomeCategoria', 'Nome da categoria')}
              />
              <button type="button" className="btn-primary" onClick={() => void addCategoria()}>
                + {tr(safeT, 'novaCategoria', 'Nova Categoria')}
              </button>
            </div>
            {categorias.length === 0 ? (
              <div className="biblioteca-pecas-hub__grupos-empty">
                {tr(safeT, 'nenhumaCategoria', 'Nenhuma categoria cadastrada.')}
              </div>
            ) : (
              <div className="biblioteca-pecas-hub__grupo-list">
                {categorias.map((c, idx) => (
                  <div
                    key={c.id}
                    className={`biblioteca-pecas-hub__grupo-card${idx % 2 === 0 ? ' biblioteca-pecas-hub__grupo-card--a' : ' biblioteca-pecas-hub__grupo-card--b'}`}
                    style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'center' }}
                  >
                    <span>{c.nome}</span>
                    <button type="button" className="btn-danger" onClick={() => void apagarCategoria(c.id)}>
                      {tr(safeT, 'cadastroPecasStockApagar', 'Apagar')}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="biblioteca-pecas-hub__grupo-card" style={{ marginTop: 16 }}>
            <h4 className="biblioteca-pecas-form__title">
              {tr(safeT, 'cadastroPecasStockNovaSub', 'Nova subcategoria')}
            </h4>
            <div className="biblioteca-pecas-form__field" style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <select
                className="biblioteca-pecas-form__input"
                style={{ maxWidth: 220 }}
                value={catSubId}
                onChange={(e) => setCatSubId(e.target.value)}
              >
                <option value="">{tr(safeT, 'cadastroPecasStockCategorias', 'Categorias')}</option>
                {categorias.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nome}
                  </option>
                ))}
              </select>
              <input
                className="biblioteca-pecas-form__input"
                style={{ maxWidth: 280 }}
                value={novaSub}
                onChange={(e) => setNovaSub(e.target.value)}
                placeholder={tr(safeT, 'nomeSubcategoria', 'Nome da subcategoria')}
              />
              <button type="button" className="btn-primary" onClick={() => void addSub()}>
                + {tr(safeT, 'novaSubcategoria', 'Nova subcategoria')}
              </button>
            </div>
            <div className="biblioteca-pecas-hub__grupo-list" style={{ marginTop: 12 }}>
              {subcategorias.map((s) => (
                <div key={s.id} className="biblioteca-pecas-hub__grupos-meta">
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
