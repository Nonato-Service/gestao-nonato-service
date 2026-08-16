import { PECA_BIBLIOTECA_LOGO_PADRAO_SRC } from './imagemStats'
import type { CategoriaPecaLike, PecaBibliotecaLike, SubcategoriaPecaLike } from './tipos'

/** Só conta como pendente valores explicitamente verdadeiros. */
export function ehImportacaoPendenteStrict(peca: Pick<PecaBibliotecaLike, 'importacaoPendente'>): boolean {
  const v = peca.importacaoPendente as unknown
  return v === true || v === 'true' || v === 1 || v === '1'
}

export function sanitizarPecaBibliotecaImportacaoFlag<T extends PecaBibliotecaLike>(
  peca: T,
  imagemPadraoSrc: string = PECA_BIBLIOTECA_LOGO_PADRAO_SRC
): T {
  const img = typeof peca.imagem === 'string' ? peca.imagem.trim() : ''
  const imagem = img === imagemPadraoSrc ? '' : peca.imagem
  return { ...peca, imagem, importacaoPendente: ehImportacaoPendenteStrict(peca) }
}

/** Categoria/subcategoria válidas para o próximo cadastro em sequência. */
export function normalizarUltimaSelecaoBiblioteca(
  form: Pick<PecaBibliotecaLike, 'categoriaId' | 'subcategoriaId' | 'categoria' | 'subcategoria'>,
  categorias: CategoriaPecaLike[],
  subcategorias: SubcategoriaPecaLike[]
): { categoriaId: string; subcategoriaId: string } {
  let catId =
    form.categoriaId && categorias.some((c) => c.id === form.categoriaId) ? form.categoriaId : ''

  if (!catId && form.categoria?.trim()) {
    const alvo = form.categoria.trim().toLowerCase()
    const porNome = categorias.find((c) => (c.nome || '').trim().toLowerCase() === alvo)
    if (porNome) catId = porNome.id
  }

  let subId = ''
  if (catId && form.subcategoriaId) {
    const s = subcategorias.find((x) => x.id === form.subcategoriaId && x.categoriaId === catId)
    if (s) subId = s.id
  }

  if (!subId && catId && form.subcategoria?.trim()) {
    const alvo = form.subcategoria.trim().toLowerCase()
    const porNomeSub = subcategorias.find(
      (x) => x.categoriaId === catId && (x.nome || '').trim().toLowerCase() === alvo
    )
    if (porNomeSub) subId = porNomeSub.id
  }

  return { categoriaId: catId, subcategoriaId: subId }
}

export function preencherPecaBibliotecaComUltimaCategoriaSeVazio<T extends PecaBibliotecaLike>(
  peca: T,
  ultimoCatId: string,
  ultimoSubId: string,
  categorias: CategoriaPecaLike[],
  subcategorias: SubcategoriaPecaLike[]
): T {
  const idValido = peca.categoriaId && categorias.some((c) => c.id === peca.categoriaId)
  if (idValido) return peca
  if (!ultimoCatId || !categorias.some((c) => c.id === ultimoCatId)) return peca
  const cat = categorias.find((c) => c.id === ultimoCatId)!
  let subId = ''
  let subNome = ''
  if (ultimoSubId && subcategorias.some((s) => s.id === ultimoSubId && s.categoriaId === ultimoCatId)) {
    subId = ultimoSubId
    subNome = subcategorias.find((s) => s.id === ultimoSubId)?.nome || ''
  }
  return {
    ...peca,
    categoriaId: ultimoCatId,
    categoria: cat.nome || peca.categoria || '',
    subcategoriaId: subId,
    subcategoria: subNome,
  }
}

export function resolverIdEdicaoPecaBiblioteca(
  form: PecaBibliotecaLike,
  editing: PecaBibliotecaLike | null,
  todas: PecaBibliotecaLike[]
): string | null {
  if (editing?.id) return editing.id
  const fid = (form.id || '').trim()
  if (fid && todas.some((p) => p.id === fid)) return fid
  const cod = (form.codigo || '').trim().toLowerCase()
  const nome = (form.nome || '').trim().toLowerCase()
  if (cod) {
    const pendentes = todas.filter((p) => ehImportacaoPendenteStrict(p))
    const porCodigo = pendentes.filter((p) => (p.codigo || '').trim().toLowerCase() === cod)
    if (porCodigo.length === 1) return porCodigo[0].id
    if (porCodigo.length > 1 && nome) {
      const porNome = porCodigo.filter((p) => (p.nome || '').trim().toLowerCase() === nome)
      if (porNome.length === 1) return porNome[0].id
    }
  }
  return null
}
