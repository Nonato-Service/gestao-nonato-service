'use client'

type CategoriaPecaGaleria = { id: string; nome: string }

type PecaBibliotecaGaleria = {
  id: string
  nome: string
  codigo: string
  categoriaId?: string
  imagem?: string
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
  t = {},
}: Props) {
  const categoriasOrdenadas = [...categorias].sort((a, b) =>
    (a.nome || '').localeCompare(b.nome || '', undefined, { sensitivity: 'base', numeric: true })
  )

  if (categoriaSelecionadaId) {
    const categoria = categorias.find((c) => c.id === categoriaSelecionadaId)
    const pecasCategoria = pecasCatalogo.filter((p) => p.categoriaId === categoriaSelecionadaId)

    return (
      <div className="biblioteca-galeria-categorias">
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
            {pecasCategoria.map((peca) => (
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
                    className={
                      temImagemPropria(peca.imagem) ? undefined : 'biblioteca-pecas-hub__piece-img--padrao'
                    }
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      display: 'block',
                      transition: 'transform 0.32s cubic-bezier(0.22, 1, 0.36, 1)',
                    }}
                  />
                </div>
                <h4 className="biblioteca-pecas-hub__piece-name">{peca.nome}</h4>
                <div className="biblioteca-pecas-hub__piece-meta">
                  <span className="biblioteca-pecas-hub__piece-chip biblioteca-pecas-hub__piece-chip--code">
                    <span className="biblioteca-pecas-hub__piece-chip-k">{t.codigo || 'Código'}</span>
                    <span className="biblioteca-pecas-hub__piece-chip-v">{peca.codigo || '—'}</span>
                  </span>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="biblioteca-galeria-categorias">
      <div className="biblioteca-galeria-categorias__intro">
        <h2 className="biblioteca-galeria-categorias__title">
          {t.titulo || 'Categorias'}
        </h2>
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
                    <img
                      src={srcImagem(capa)}
                      alt=""
                      className="biblioteca-galeria-categorias__card-img"
                    />
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
