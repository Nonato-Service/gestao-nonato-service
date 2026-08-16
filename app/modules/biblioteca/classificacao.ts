/** Classificação automática/manual de peças da Biblioteca (funções puras). */

import type { CategoriaPecaLike, PecaBibliotecaLike, SubcategoriaPecaLike } from './tipos'

export type RegraClassificacaoPeca = {
  id: string
  palavras: string[]
  categoriaId: string
  categoria: string
  subcategoriaId?: string
  subcategoria?: string
  createdAt: string
}

export type DestinoClassificacaoResolvido = {
  categoriaId: string
  categoria: string
  subcategoriaId: string
  subcategoria: string
}

/** Separa palavras-chave por vírgula, ponto-e-vírgula ou nova linha. */
export function parsePalavrasClassificacao(texto: string): string[] {
  return String(texto || '')
    .split(/[\n,;]+/)
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean)
}

/**
 * Resolve grupo/subgrupo de destino a partir dos IDs do painel de lote.
 * Se só houver subgrupo, infere a categoria pelo `categoriaId` da subcategoria.
 */
export function resolverDestinoClassificacaoLote(
  classificacaoLoteCategoriaId: string,
  classificacaoLoteSubcategoriaId: string,
  categorias: CategoriaPecaLike[],
  subcategorias: SubcategoriaPecaLike[]
): DestinoClassificacaoResolvido | null {
  const categoriaIdFinal =
    classificacaoLoteCategoriaId ||
    subcategorias.find((sub) => sub.id === classificacaoLoteSubcategoriaId)?.categoriaId ||
    ''

  const categoriaSelecionada = categorias.find((cat) => cat.id === categoriaIdFinal)
  const subcategoriaSelecionada = subcategorias.find(
    (sub) => sub.id === classificacaoLoteSubcategoriaId && sub.categoriaId === categoriaIdFinal
  )

  if (!categoriaSelecionada && !subcategoriaSelecionada) return null

  return {
    categoriaId: categoriaSelecionada?.id || '',
    categoria: categoriaSelecionada?.nome || '',
    subcategoriaId: subcategoriaSelecionada?.id || '',
    subcategoria: subcategoriaSelecionada?.nome || '',
  }
}

function textoBasePecaClassificacao(peca: PecaBibliotecaLike): string {
  return `${peca.nome} ${peca.codigo} ${peca.descricao || ''}`.toLowerCase()
}

/**
 * Aplica campos de categoria/subcategoria numa peça.
 * Se o grupo mudar, limpa `numeroSequenciaGrupo` e actualiza `dataAtualizacao`.
 */
export function aplicarClassificacaoCamposNaPeca<T extends PecaBibliotecaLike>(
  peca: T,
  destino: DestinoClassificacaoResolvido,
  agora = new Date().toISOString()
): { peca: T; alterou: boolean } {
  const proximaPeca: T = {
    ...peca,
    categoriaId: destino.categoriaId,
    categoria: destino.categoria,
    subcategoriaId: destino.subcategoriaId,
    subcategoria: destino.subcategoria,
  }

  if (
    proximaPeca.categoriaId === (peca.categoriaId || '') &&
    proximaPeca.subcategoriaId === (peca.subcategoriaId || '')
  ) {
    return { peca, alterou: false }
  }

  const categoriaMudou = proximaPeca.categoriaId !== (peca.categoriaId || '')
  const next = categoriaMudou
    ? { ...proximaPeca, numeroSequenciaGrupo: '', dataAtualizacao: agora }
    : { ...proximaPeca, dataAtualizacao: agora }
  return { peca: next, alterou: true }
}

/** Aplica regras salvas a uma lista (opcionalmente só peças sem grupo). */
export function aplicarRegrasClassificacaoEmLista<T extends PecaBibliotecaLike>(
  lista: T[],
  regras: RegraClassificacaoPeca[],
  somenteSemGrupo = true
): { lista: T[]; alteradas: number } {
  if (regras.length === 0) return { lista, alteradas: 0 }

  let alteradas = 0
  const updated = lista.map((peca) => {
    if (somenteSemGrupo && peca.categoriaId) return peca

    const textoBase = textoBasePecaClassificacao(peca)
    const regra = regras.find((item) =>
      item.palavras.some((palavra) => textoBase.includes(palavra.toLowerCase()))
    )

    if (!regra) return peca

    const destino: DestinoClassificacaoResolvido = {
      categoriaId: regra.categoriaId,
      categoria: regra.categoria,
      subcategoriaId: regra.subcategoriaId || '',
      subcategoria: regra.subcategoria || '',
    }

    const { peca: next, alterou } = aplicarClassificacaoCamposNaPeca(peca, destino)
    if (alterou) alteradas++
    return next
  })

  return { lista: updated, alteradas }
}

/** Classificação manual em lote por IDs seleccionados. */
export function aplicarClassificacaoManualEmLista<T extends PecaBibliotecaLike>(
  lista: T[],
  ids: string[],
  destino: DestinoClassificacaoResolvido,
  somenteSemGrupo = true
): { lista: T[]; alteradas: number } {
  let alteradas = 0
  const idSet = new Set(ids)
  const updated = lista.map((peca) => {
    if (!idSet.has(peca.id)) return peca
    if (somenteSemGrupo && peca.categoriaId) return peca

    const { peca: next, alterou } = aplicarClassificacaoCamposNaPeca(peca, destino)
    if (alterou) alteradas++
    return next
  })

  return { lista: updated, alteradas }
}

/** Classificação em lote filtrando por palavras-chave no nome/código/descrição. */
export function aplicarClassificacaoPorPalavrasEmLista<T extends PecaBibliotecaLike>(
  lista: T[],
  ids: string[],
  palavras: string[],
  destino: DestinoClassificacaoResolvido,
  somenteSemGrupo = true
): { lista: T[]; alteradas: number } {
  let alteradas = 0
  const idSet = new Set(ids)
  const updated = lista.map((peca) => {
    if (!idSet.has(peca.id)) return peca
    if (somenteSemGrupo && peca.categoriaId) return peca

    const textoBase = textoBasePecaClassificacao(peca)
    const combina = palavras.some((palavra) => textoBase.includes(palavra))
    if (!combina) return peca

    const { peca: next, alterou } = aplicarClassificacaoCamposNaPeca(peca, destino)
    if (alterou) alteradas++
    return next
  })

  return { lista: updated, alteradas }
}

/** Cria uma regra de classificação automática (palavras → destino). */
export function criarRegraClassificacaoPeca(
  palavras: string[],
  destino: DestinoClassificacaoResolvido,
  createdAt = new Date().toISOString(),
  id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
): RegraClassificacaoPeca {
  return {
    id,
    palavras,
    categoriaId: destino.categoriaId,
    categoria: destino.categoria,
    subcategoriaId: destino.subcategoriaId || '',
    subcategoria: destino.subcategoria || '',
    createdAt,
  }
}

export function renomearRegraClassificacaoCategoria(
  regras: RegraClassificacaoPeca[],
  categoriaId: string,
  novoNome: string
): RegraClassificacaoPeca[] {
  return regras.map((r) => (r.categoriaId === categoriaId ? { ...r, categoria: novoNome } : r))
}

export function renomearRegraClassificacaoSubcategoria(
  regras: RegraClassificacaoPeca[],
  subcategoriaId: string,
  novoNome: string
): RegraClassificacaoPeca[] {
  return regras.map((r) =>
    r.subcategoriaId === subcategoriaId ? { ...r, subcategoria: novoNome } : r
  )
}
