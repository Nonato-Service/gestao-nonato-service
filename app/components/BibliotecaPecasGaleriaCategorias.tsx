'use client'

type CategoriaPecaGaleria = { id: string; nome: string }

type PecaBibliotecaGaleria = {
  id: string
  nome: string
  codigo: string
  categoriaId?: string
  categoria?: string
  imagem?: string
  numeroSequenciaGrupo?: string
}

function parseNumeroSequenciaGaleria(val?: string | null): number {
  const n = parseInt(String(val ?? '').replace(/\D/g, ''), 10)
  return Number.isFinite(n) && n > 0 ? n : 0
}

function compararPecasGaleriaPorNumero(a: PecaBibliotecaGaleria, b: PecaBibliotecaGaleria): number {
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
  buscaHint?: string
  buscarPlaceholder?: string
  buscaResultados?: string
  buscaVazio?: string
  limparBusca?: string
}

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
  onBuscaCodigoChange?: (value: string) => void
  t?: GaleriaTranslations
}

function primeiraImagemCategoria(
  categoriaId: string,
  pecas: PecaBibliotecaGaleria[],
  temImagemPropria: (imagem: string | undefined | null) => boolean
): string | undefined {
  for (const p of pecas) {
    if (p.categoriaId === categoriaId && temImagemPropria(p.imagem)) {
      return String(p.imagem).trim()
    }
  }
  return undefined
}

function renderPecaCard(
  peca: PecaBibliotecaGaleria,
  opts: {
    srcImagem: (imagem: string | undefined | null) => string
    temImagemPropria: (imagem: string | undefined | null) => boolean
    onThumbEnter?: (ev: React.MouseEvent, src: string, label: string) => void
    onThumbLeave?: () => void
    codigoLabel: string
  }
) {
  const { srcImagem, temImagemPropria, onThumbEnter, onThumbLeave, codigoLabel } = opts
  return (
    <article key={peca.id} className="biblioteca-pecas-hub__piece-card">
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
      </div>
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
  onBuscaCodigoChange,
  t = {},
}: Props) {
  const categoriasOrdenadas = [...categorias].sort((a, b) =>
    (a.nome || '').localeCompare(b.nome || '', undefined, { sensitivity: 'base', numeric: true })
  )
  const codigoLabel = t.codigo || 'Código'
  const cardOpts = { srcImagem, temImagemPropria, onThumbEnter, onThumbLeave, codigoLabel }
  const q = buscaCodigo.trim().toLowerCase()
  const emBusca = q.length > 0

  const barraBusca =
    onBuscaCodigoChange != null ? (
      <div className="biblioteca-busca-codigo biblioteca-galeria-categorias__search-wrap" role="search">
        <label htmlFor="biblioteca-galeria-busca-codigo" className="biblioteca-busca-codigo__label">
          {t.buscarPorCodigo || 'Buscar peça por código'}
        </label>
        <div className="biblioteca-busca-codigo__row">
          <input
            id="biblioteca-galeria-busca-codigo"
            type="search"
            className="biblioteca-busca-codigo__input"
            value={buscaCodigo}
            onChange={(e) => onBuscaCodigoChange(e.target.value)}
            placeholder={t.buscarPlaceholder || 'Ex: 700030001 ou FO-123'}
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

  if (emBusca) {
    const resultados = [...pecasCatalogo]
      .filter((peca) =>
        String(peca.codigo ?? '')
          .trim()
          .toLowerCase()
          .includes(q)
      )
      .sort(compararPecasGaleriaPorNumero)

    return (
      <div className="biblioteca-galeria-categorias">
        {barraBusca}
        <p className="biblioteca-galeria-categorias__lead biblioteca-galeria-categorias__search-results">
          {String(t.buscaResultados || '{count} peça(s) encontrada(s) para «{codigo}»')
            .replace('{count}', String(resultados.length))
            .replace('{codigo}', buscaCodigo.trim())}
        </p>
        {resultados.length === 0 ? (
          <p className="biblioteca-galeria-categorias__empty">
            {t.buscaVazio || 'Nenhuma peça com este código no catálogo.'}
          </p>
        ) : (
          <div className="biblioteca-pecas-hub__piece-grid biblioteca-galeria-categorias__grid-pecas">
            {resultados.map((peca) => renderPecaCard(peca, cardOpts))}
          </div>
        )}
      </div>
    )
  }

  if (categoriaSelecionadaId) {
    const categoria = categorias.find((c) => c.id === categoriaSelecionadaId)
    const pecasCategoria = pecasCatalogo
      .filter((p) => p.categoriaId === categoriaSelecionadaId)
      .sort(compararPecasGaleriaPorNumero)

    return (
      <div className="biblioteca-galeria-categorias">
        {barraBusca}
        <div className="biblioteca-galeria-categorias__head">
          <button type="button" className="biblioteca-btn--ghost" onClick={onVoltarCategorias}>
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
          <div className="biblioteca-pecas-hub__piece-grid biblioteca-galeria-categorias__grid-pecas">
            {pecasCategoria.map((peca) => renderPecaCard(peca, cardOpts))}
          </div>
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
          {t.descricao ||
            'Escolha uma categoria para ver todas as imagens das peças. A capa usa automaticamente a primeira foto disponível.'}
        </p>
      </div>

      {categoriasOrdenadas.length === 0 ? (
        <p className="biblioteca-galeria-categorias__empty">
          {t.semPecasCategoria || 'Nenhuma categoria cadastrada.'}
        </p>
      ) : (
        <div className="biblioteca-galeria-categorias__grid">
          {categoriasOrdenadas.map((cat) => {
            const capa = primeiraImagemCategoria(cat.id, pecasCatalogo, temImagemPropria)
            const total = pecasCatalogo.filter((p) => p.categoriaId === cat.id).length
            return (
              <button
                key={cat.id}
                type="button"
                className="biblioteca-galeria-categorias__card"
                onClick={() => onSelecionarCategoria(cat.id)}
                title={t.cliqueAbrir || 'Ver todas as peças desta categoria'}
              >
                <div className="biblioteca-galeria-categorias__card-media">
                  {capa ? (
                    <img src={srcImagem(capa)} alt="" className="biblioteca-galeria-categorias__card-img" />
                  ) : (
                    <div className="biblioteca-galeria-categorias__card-placeholder">
                      <span>{(cat.nome || '?').slice(0, 2).toUpperCase()}</span>
                      <small>{t.semImagem || 'Sem foto'}</small>
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
