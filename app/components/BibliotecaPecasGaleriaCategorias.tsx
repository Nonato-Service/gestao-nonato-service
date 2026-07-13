'use client'

import { useMemo, useState } from 'react'
import { pecaBibliotecaMatchesBusca } from '../lib/pecaCodigoBusca'
import {
  formatPrecoBibliotecaExibicao,
} from './BibliotecaPrecoOlhoToggle'

type CategoriaPecaGaleria = { id: string; nome: string }

type PecaBibliotecaGaleria = {
  id: string
  nome: string
  codigo: string
  preco?: string
  categoriaId?: string
  categoria?: string
  imagem?: string
  numeroSequenciaGrupo?: string
}

/** Limite de peças renderizadas de cada vez (performance tablet). */
const GALERIA_PECAS_POR_LOTE = 48
const GALERIA_BUSCA_MAX_RESULTADOS = 120

function parseNumeroSequenciaGaleria(val?: string | null): number {
  const n = parseInt(String(val ?? '').replace(/\D/g, ''), 10)
  return Number.isFinite(n) && n > 0 ? n : 0
}

function indiceOrdemCategoriaGaleria(categoriaId: string | undefined, categorias: CategoriaPecaGaleria[]): number {
  const catId = String(categoriaId || '').trim()
  if (!catId) return categorias.length + 1
  const idx = categorias.findIndex((c) => c.id === catId)
  return idx >= 0 ? idx : categorias.length
}

function compararPecasGaleriaPorNumero(
  a: PecaBibliotecaGaleria,
  b: PecaBibliotecaGaleria,
  categorias: CategoriaPecaGaleria[] = []
): number {
  const ca = indiceOrdemCategoriaGaleria(a.categoriaId, categorias)
  const cb = indiceOrdemCategoriaGaleria(b.categoriaId, categorias)
  if (ca !== cb) return ca - cb

  const na = parseNumeroSequenciaGaleria(a.numeroSequenciaGrupo)
  const nb = parseNumeroSequenciaGaleria(b.numeroSequenciaGrupo)
  if (na && nb && na !== nb) return na - nb
  if (na && !nb) return -1
  if (!na && nb) return 1
  return String(a.nome || a.codigo || '').localeCompare(String(b.nome || b.codigo || ''), undefined, {
    numeric: true,
  })
}

type GaleriaTranslations = {
  titulo?: string
  descricao?: string
  voltar?: string
  pecasCount?: string
  semImagem?: string
  cliqueAbrir?: string
  codigo?: string
  semPecasCategoria?: string
  buscarPorCodigo?: string
  buscarPorNome?: string
  buscaModoCodigo?: string
  buscaModoNome?: string
  buscarPlaceholder?: string
  buscarPlaceholderNome?: string
  buscaResultados?: string
  buscaResultadosNome?: string
  buscaVazio?: string
  buscaVazioNome?: string
  limparBusca?: string
  preco?: string
  buscaLimite?: string
  carregarMais?: string
}

type BuscaGaleriaModo = 'codigo' | 'nome'

type Props = {
  categorias: CategoriaPecaGaleria[]
  pecasCatalogo: PecaBibliotecaGaleria[]
  categoriaSelecionadaId: string | null
  onSelecionarCategoria: (categoriaId: string) => void
  onVoltarCategorias: () => void
  srcImagem: (imagem: string | undefined | null) => string
  temImagemPropria: (imagem: string | undefined | null) => boolean
  onThumbEnter?: (ev: React.MouseEvent, src: string, label: string) => void
  onThumbLeave?: () => void
  buscaCodigo?: string
  buscaModo?: BuscaGaleriaModo
  onBuscaModoChange?: (modo: BuscaGaleriaModo) => void
  onBuscaCodigoChange?: (value: string) => void
  modoAnexarRelatorio?: boolean
  pecaSelecionadaId?: string | null
  onSelecionarPeca?: (peca: PecaBibliotecaGaleria) => void
  onAnexarPeca?: (peca: PecaBibliotecaGaleria) => void
  labelAnexar?: string
  mostrarPrecos?: boolean
  t?: GaleriaTranslations
}

function renderPecaCard(
  peca: PecaBibliotecaGaleria,
  opts: {
    srcImagem: (imagem: string | undefined | null) => string
    temImagemPropria: (imagem: string | undefined | null) => boolean
    onThumbEnter?: (ev: React.MouseEvent, src: string, label: string) => void
    onThumbLeave?: () => void
    codigoLabel: string
    modoAnexarRelatorio?: boolean
    selecionada?: boolean
    onSelecionar?: () => void
    onAnexar?: () => void
    labelAnexar?: string
    mostrarPrecos?: boolean
    precoLabel?: string
  }
) {
  const {
    srcImagem,
    temImagemPropria,
    onThumbEnter,
    onThumbLeave,
    codigoLabel,
    modoAnexarRelatorio = false,
    selecionada = false,
    onSelecionar,
    onAnexar,
    labelAnexar = 'Anexar ao relatório',
    mostrarPrecos = false,
    precoLabel = 'Preço',
  } = opts
  return (
    <article
      key={peca.id}
      className={[
        'biblioteca-pecas-hub__piece-card',
        modoAnexarRelatorio && 'biblioteca-pecas-hub__piece-card--pickable',
        selecionada && 'biblioteca-pecas-hub__piece-card--selected',
      ]
        .filter(Boolean)
        .join(' ')}
      onClick={() => {
        if (modoAnexarRelatorio) onSelecionar?.()
      }}
    >
      <div
        className="biblioteca-pecas-hub__piece-thumb"
        onMouseEnter={(ev) => {
          if (!temImagemPropria(peca.imagem) || !onThumbEnter) return
          onThumbEnter(ev, String(peca.imagem).trim(), peca.nome)
          const img = ev.currentTarget.querySelector('img')
          if (img instanceof HTMLImageElement) img.style.transform = 'scale(1.08)'
        }}
        onMouseLeave={(ev) => {
          onThumbLeave?.()
          const img = ev.currentTarget.querySelector('img')
          if (img instanceof HTMLImageElement) img.style.transform = 'scale(1)'
        }}
      >
        <img
          src={srcImagem(peca.imagem)}
          alt={peca.nome}
          loading="lazy"
          decoding="async"
          className={temImagemPropria(peca.imagem) ? undefined : 'biblioteca-pecas-hub__piece-img--padrao'}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            display: 'block',
            transition: 'transform 0.32s cubic-bezier(0.22, 1, 0.36, 1)',
          }}
        />
      </div>
      <h4 className="biblioteca-pecas-hub__piece-name">
        {peca.numeroSequenciaGrupo ? (
          <span
            className="biblioteca-pecas-numero-circulo biblioteca-pecas-numero-circulo--sm"
            style={{ marginRight: '8px', verticalAlign: 'middle' }}
            title={peca.numeroSequenciaGrupo}
            aria-label={peca.numeroSequenciaGrupo}
          >
            {peca.numeroSequenciaGrupo}
          </span>
        ) : null}
        {peca.nome}
      </h4>
      <div className="biblioteca-pecas-hub__piece-meta">
        <span className="biblioteca-pecas-hub__piece-chip biblioteca-pecas-hub__piece-chip--code">
          <span className="biblioteca-pecas-hub__piece-chip-k">{codigoLabel}</span>
          <span className="biblioteca-pecas-hub__piece-chip-v">{peca.codigo || '—'}</span>
        </span>
        {String(peca.preco ?? '').trim() ? (
          <span
            className={`biblioteca-pecas-hub__piece-chip biblioteca-pecas-hub__piece-chip--price${mostrarPrecos ? '' : ' biblioteca-pecas-hub__piece-chip--price-hidden'}`}
          >
            <span className="biblioteca-pecas-hub__piece-chip-k">{precoLabel}</span>
            <span className="biblioteca-pecas-hub__piece-chip-v">
              {formatPrecoBibliotecaExibicao(peca.preco, mostrarPrecos)}
            </span>
          </span>
        ) : null}
      </div>
      {modoAnexarRelatorio ? (
        <div className="biblioteca-galeria-categorias__anexar-wrap">
          <button type="button" className="btn-primary biblioteca-galeria-categorias__anexar-btn" onClick={onAnexar}>
            {labelAnexar}
          </button>
        </div>
      ) : null}
    </article>
  )
}

export function BibliotecaPecasGaleriaCategorias({
  categorias,
  pecasCatalogo,
  categoriaSelecionadaId,
  onSelecionarCategoria,
  onVoltarCategorias,
  srcImagem,
  temImagemPropria,
  onThumbEnter,
  onThumbLeave,
  buscaCodigo = '',
  buscaModo = 'codigo',
  onBuscaModoChange,
  onBuscaCodigoChange,
  modoAnexarRelatorio = false,
  pecaSelecionadaId = null,
  onSelecionarPeca,
  onAnexarPeca,
  labelAnexar,
  mostrarPrecos = false,
  t = {},
}: Props) {
  const [limiteCategoria, setLimiteCategoria] = useState(GALERIA_PECAS_POR_LOTE)

  const categoriasOrdenadas = useMemo(
    () =>
      [...categorias].sort((a, b) =>
        (a.nome || '').localeCompare(b.nome || '', undefined, { sensitivity: 'base', numeric: true })
      ),
    [categorias]
  )

  const indiceCategorias = useMemo(() => {
    const porCat = new Map<string, PecaBibliotecaGaleria[]>()
    let semCat = 0
    for (const p of pecasCatalogo) {
      const cid = String(p.categoriaId || '').trim()
      if (!cid) {
        semCat++
        continue
      }
      if (!porCat.has(cid)) porCat.set(cid, [])
      porCat.get(cid)!.push(p)
    }
    const meta = new Map<string, { total: number; capa?: string }>()
    for (const cat of categoriasOrdenadas) {
      const lista = porCat.get(cat.id) || []
      let capa: string | undefined
      for (const p of lista) {
        if (temImagemPropria(p.imagem)) {
          capa = String(p.imagem).trim()
          break
        }
      }
      meta.set(cat.id, { total: lista.length, capa })
    }
    return { meta, semCat, porCat }
  }, [pecasCatalogo, categoriasOrdenadas, temImagemPropria])

  const codigoLabel = t.codigo || 'Código'
  const cardOptsFor = (peca: PecaBibliotecaGaleria) => ({
    srcImagem,
    temImagemPropria,
    onThumbEnter,
    onThumbLeave,
    codigoLabel,
    modoAnexarRelatorio,
    selecionada: modoAnexarRelatorio && pecaSelecionadaId === peca.id,
    onSelecionar: () => onSelecionarPeca?.(peca),
    onAnexar: () => onAnexarPeca?.(peca),
    labelAnexar: labelAnexar || 'Anexar ao relatório',
    mostrarPrecos,
    precoLabel: t.preco || 'Preço',
  })
  const q = buscaCodigo.trim().toLowerCase()
  const emBusca = q.length > 0

  const resultadosBuscaCompletos = useMemo(() => {
    if (!emBusca) return []
    return [...pecasCatalogo]
      .filter((peca) => {
        if (buscaModo === 'nome') {
          return String(peca.nome ?? '')
            .trim()
            .toLowerCase()
            .includes(q)
        }
        return pecaBibliotecaMatchesBusca(peca, buscaCodigo)
      })
      .sort((a, b) => compararPecasGaleriaPorNumero(a, b, categorias))
  }, [pecasCatalogo, buscaModo, q, categorias, emBusca])

  const pecasCategoriaSelecionada = useMemo(() => {
    if (!categoriaSelecionadaId) return []
    const lista = indiceCategorias.porCat.get(categoriaSelecionadaId) || []
    return [...lista].sort((a, b) => compararPecasGaleriaPorNumero(a, b, categorias))
  }, [categoriaSelecionadaId, indiceCategorias.porCat, categorias])

  const barraBusca =
    onBuscaCodigoChange != null ? (
      <div className="biblioteca-busca-codigo biblioteca-galeria-categorias__search-wrap" role="search">
        {onBuscaModoChange ? (
          <div className="biblioteca-busca-codigo__modo" role="group" aria-label="Tipo de busca">
            <button
              type="button"
              className={`biblioteca-busca-codigo__modo-btn${buscaModo === 'codigo' ? ' biblioteca-busca-codigo__modo-btn--active' : ''}`}
              onClick={() => onBuscaModoChange('codigo')}
            >
              {t.buscaModoCodigo || 'Código'}
            </button>
            <button
              type="button"
              className={`biblioteca-busca-codigo__modo-btn${buscaModo === 'nome' ? ' biblioteca-busca-codigo__modo-btn--active' : ''}`}
              onClick={() => onBuscaModoChange('nome')}
            >
              {t.buscaModoNome || 'Nome'}
            </button>
          </div>
        ) : null}
        <label htmlFor="biblioteca-galeria-busca-codigo" className="biblioteca-busca-codigo__label">
          {buscaModo === 'nome'
            ? t.buscarPorNome || 'Buscar por nome'
            : t.buscarPorCodigo || 'Buscar peça por código'}
        </label>
        <div className="biblioteca-busca-codigo__row">
          <input
            id="biblioteca-galeria-busca-codigo"
            type="search"
            className="biblioteca-busca-codigo__input"
            value={buscaCodigo === 'null' || buscaCodigo === 'undefined' ? '' : buscaCodigo}
            onChange={(e) => onBuscaCodigoChange(e.target.value)}
            placeholder={
              buscaModo === 'nome'
                ? t.buscarPlaceholderNome || 'Ex: suction cup, cilindro…'
                : t.buscarPlaceholder || 'Ex: 700030001'
            }
            autoComplete="off"
            enterKeyHint="search"
          />
          {emBusca ? (
            <button
              type="button"
              className="biblioteca-btn--orange biblioteca-busca-codigo__clear"
              onClick={() => onBuscaCodigoChange('')}
            >
              {t.limparBusca || 'Limpar'}
            </button>
          ) : null}
        </div>
      </div>
    ) : null

  const botaoCarregarMais = (total: number, limite: number, onMais: () => void) =>
    total > limite ? (
      <button
        type="button"
        className="biblioteca-btn--green"
        onClick={onMais}
        style={{ marginTop: 14, minHeight: 44, width: '100%', padding: '10px 16px' }}
      >
        {(t.carregarMais || 'Mostrar mais ({restantes} restantes)').replace(
          '{restantes}',
          String(total - limite)
        )}
      </button>
    ) : null

  if (emBusca) {
    const resultados = resultadosBuscaCompletos.slice(0, GALERIA_BUSCA_MAX_RESULTADOS)
    const truncado = resultadosBuscaCompletos.length > GALERIA_BUSCA_MAX_RESULTADOS

    return (
      <div className="biblioteca-galeria-categorias">
        {barraBusca}
        <p className="biblioteca-galeria-categorias__lead biblioteca-galeria-categorias__search-results">
          {String(
            buscaModo === 'nome'
              ? t.buscaResultadosNome || '{count} peça(s) encontrada(s) para o nome «{termo}»'
              : t.buscaResultados || '{count} peça(s) encontrada(s) para «{codigo}»'
          )
            .replace('{count}', String(resultadosBuscaCompletos.length))
            .replace('{termo}', buscaCodigo.trim())
            .replace('{codigo}', buscaCodigo.trim())}
          {truncado
            ? ` · ${(t.buscaLimite || 'A mostrar {max} — refine a busca').replace('{max}', String(GALERIA_BUSCA_MAX_RESULTADOS))}`
            : ''}
        </p>
        {resultados.length === 0 ? (
          <p className="biblioteca-galeria-categorias__empty">
            {buscaModo === 'nome'
              ? t.buscaVazioNome || 'Nenhuma peça com esse nome.'
              : t.buscaVazio || 'Nenhuma peça com esse código.'}
          </p>
        ) : (
          <div className="biblioteca-pecas-hub__piece-grid biblioteca-galeria-categorias__grid-pecas">
            {resultados.map((peca) => renderPecaCard(peca, cardOptsFor(peca)))}
          </div>
        )}
      </div>
    )
  }

  if (categoriaSelecionadaId) {
    const pecasCategoria = pecasCategoriaSelecionada
    const categoria = categorias.find((c) => c.id === categoriaSelecionadaId)
    const visiveis = pecasCategoria.slice(0, limiteCategoria)

    return (
      <div className="biblioteca-galeria-categorias">
        {barraBusca}
        <div className="biblioteca-galeria-categorias__head">
          <button type="button" className="biblioteca-btn--ghost" onClick={() => { onVoltarCategorias(); setLimiteCategoria(GALERIA_PECAS_POR_LOTE) }}>
            ← {t.voltar || 'Voltar às categorias'}
          </button>
          <div>
            <h2 className="biblioteca-galeria-categorias__title">{categoria?.nome || '—'}</h2>
            <p className="biblioteca-galeria-categorias__lead">
              {(t.pecasCount || '{count} peça(s)').replace('{count}', String(pecasCategoria.length))}
            </p>
          </div>
        </div>
        {pecasCategoria.length === 0 ? (
          <p className="biblioteca-galeria-categorias__empty">
            {t.semPecasCategoria || 'Nenhuma peça nesta categoria.'}
          </p>
        ) : (
          <>
            <div className="biblioteca-pecas-hub__piece-grid biblioteca-galeria-categorias__grid-pecas">
              {visiveis.map((peca) => renderPecaCard(peca, cardOptsFor(peca)))}
            </div>
            {botaoCarregarMais(pecasCategoria.length, limiteCategoria, () =>
              setLimiteCategoria((n) => n + GALERIA_PECAS_POR_LOTE)
            )}
          </>
        )}
      </div>
    )
  }

  return (
    <div className="biblioteca-galeria-categorias">
      {barraBusca}
      <div className="biblioteca-galeria-categorias__intro">
        <h2 className="biblioteca-galeria-categorias__title">{t.titulo || 'Categorias'}</h2>
        <p className="biblioteca-galeria-categorias__lead">
          {t.descricao || t.cliqueAbrir || 'Toque numa categoria para ver as peças.'}
        </p>
      </div>
      {categoriasOrdenadas.length === 0 ? (
        <p className="biblioteca-galeria-categorias__empty">
          {t.semPecasCategoria || 'Nenhuma categoria cadastrada.'}
        </p>
      ) : (
        <div className="biblioteca-galeria-categorias__grid">
          {categoriasOrdenadas.map((cat) => {
            const info = indiceCategorias.meta.get(cat.id)
            const total = info?.total ?? 0
            const capa = info?.capa
            return (
              <button
                key={cat.id}
                type="button"
                className="biblioteca-galeria-categorias__card"
                onClick={() => {
                  setLimiteCategoria(GALERIA_PECAS_POR_LOTE)
                  onSelecionarCategoria(cat.id)
                }}
              >
                <div className="biblioteca-galeria-categorias__card-media">
                  {capa ? (
                    <img
                      src={srcImagem(capa)}
                      alt=""
                      loading="lazy"
                      decoding="async"
                      className="biblioteca-galeria-categorias__card-img"
                    />
                  ) : (
                    <div className="biblioteca-galeria-categorias__card-placeholder">
                      <span>{t.semImagem || 'Sem foto'}</span>
                    </div>
                  )}
                </div>
                <div className="biblioteca-galeria-categorias__card-footer">
                  <span className="biblioteca-galeria-categorias__card-name">{cat.nome}</span>
                  <span className="biblioteca-galeria-categorias__card-count">
                    {(t.pecasCount || '{count} peça(s)').replace('{count}', String(total))}
                  </span>
                </div>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
