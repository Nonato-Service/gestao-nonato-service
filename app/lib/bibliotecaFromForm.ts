/**
 * I/O de relógio/aleatório — fromForm canónico em `app/modules/biblioteca`.
 */
import {
  createPecaBibliotecaFromForm as createPecaBibliotecaFromFormPure,
  type CreatePecaBibliotecaFromFormOpts,
} from '../modules/biblioteca/pecaFromForm'
import {
  createCategoriaPecaFromForm as createCategoriaPecaFromFormPure,
  createSubcategoriaPecaFromForm as createSubcategoriaPecaFromFormPure,
  type CreateCategoriaPecaFromFormOpts,
  type CreateSubcategoriaPecaFromFormOpts,
} from '../modules/biblioteca/categoriaFromForm'
import type { CategoriaPeca, PecaBiblioteca, SubcategoriaPeca } from '../modules/biblioteca/pecaTipos'
import {
  createEmptyPecaBibliotecaForm as createEmptyPecaBibliotecaFormPure,
  type EmptyPecaBibliotecaFormOpts,
} from '../modules/biblioteca/pecaForm'
import {
  aplicarClassificacaoManualEmLista as aplicarClassificacaoManualEmListaPure,
  aplicarClassificacaoPorPalavrasEmLista as aplicarClassificacaoPorPalavrasEmListaPure,
  aplicarRegrasClassificacaoEmLista as aplicarRegrasClassificacaoEmListaPure,
  criarRegraClassificacaoPeca as criarRegraClassificacaoPecaPure,
  type DestinoClassificacaoResolvido,
  type RegraClassificacaoPeca,
} from '../modules/biblioteca/classificacao'
import type { PecaBibliotecaLike } from '../modules/biblioteca/tipos'

/** Injeta Date.now() e Math.random() no id/data quando o call-site não envia. */
export function createPecaBibliotecaFromForm(
  form: PecaBiblioteca,
  opts: Omit<CreatePecaBibliotecaFromFormOpts, 'nowMs' | 'random'> = {}
): PecaBiblioteca {
  return createPecaBibliotecaFromFormPure(form, { ...opts, nowMs: Date.now(), random: Math.random })
}

export function createCategoriaPecaFromForm(
  nome: string,
  opts: Omit<CreateCategoriaPecaFromFormOpts, 'nowMs'> = {}
): CategoriaPeca {
  return createCategoriaPecaFromFormPure(nome, { ...opts, nowMs: Date.now() })
}

export function createSubcategoriaPecaFromForm(
  nome: string,
  categoriaId: string,
  opts: Omit<CreateSubcategoriaPecaFromFormOpts, 'nowMs'> = {}
): SubcategoriaPeca {
  return createSubcategoriaPecaFromFormPure(nome, categoriaId, { ...opts, nowMs: Date.now() })
}

/** Injeta Date.now() em dataAtualizacao das peças classificadas. */
export function aplicarRegrasClassificacaoEmLista<T extends PecaBibliotecaLike>(
  lista: T[],
  regras: RegraClassificacaoPeca[],
  somenteSemGrupo = true
): { lista: T[]; alteradas: number } {
  return aplicarRegrasClassificacaoEmListaPure(
    lista,
    regras,
    somenteSemGrupo,
    new Date().toISOString()
  )
}

export function aplicarClassificacaoManualEmLista<T extends PecaBibliotecaLike>(
  lista: T[],
  ids: string[],
  destino: DestinoClassificacaoResolvido,
  somenteSemGrupo = true
): { lista: T[]; alteradas: number } {
  return aplicarClassificacaoManualEmListaPure(
    lista,
    ids,
    destino,
    somenteSemGrupo,
    new Date().toISOString()
  )
}

export function aplicarClassificacaoPorPalavrasEmLista<T extends PecaBibliotecaLike>(
  lista: T[],
  ids: string[],
  palavras: string[],
  destino: DestinoClassificacaoResolvido,
  somenteSemGrupo = true
): { lista: T[]; alteradas: number } {
  return aplicarClassificacaoPorPalavrasEmListaPure(
    lista,
    ids,
    palavras,
    destino,
    somenteSemGrupo,
    new Date().toISOString()
  )
}

export function criarRegraClassificacaoPeca(
  palavras: string[],
  destino: DestinoClassificacaoResolvido
): RegraClassificacaoPeca {
  return criarRegraClassificacaoPecaPure(palavras, destino, {
    nowMs: Date.now(),
    random: Math.random,
  })
}

export function createEmptyPecaBibliotecaForm(
  opts: Omit<EmptyPecaBibliotecaFormOpts, 'nowMs'> = {}
): PecaBiblioteca {
  return createEmptyPecaBibliotecaFormPure({ ...opts, nowMs: Date.now() })
}

