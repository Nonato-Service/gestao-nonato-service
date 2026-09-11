/** Validação e mapeamento puro de categoria/subcategoria da biblioteca. */

import type { CategoriaPeca, SubcategoriaPeca } from './pecaTipos'

export function isCategoriaPecaFormValid(nome: string): boolean {
  return Boolean(nome.trim())
}

export type CreateCategoriaPecaFromFormOpts = {
  id?: string
}

export function createCategoriaPecaFromForm(
  nome: string,
  opts: CreateCategoriaPecaFromFormOpts = {}
): CategoriaPeca {
  return {
    id: opts.id ?? Date.now().toString(),
    nome: nome.trim(),
  }
}

/** Insere a categoria a seguir à de referência (ou no fim). */
export function inserirCategoriaPecaAposRef(
  categorias: CategoriaPeca[],
  nova: CategoriaPeca,
  refId?: string
): CategoriaPeca[] {
  const idx = refId ? categorias.findIndex((c) => c.id === refId) : -1
  return idx >= 0
    ? [...categorias.slice(0, idx + 1), nova, ...categorias.slice(idx + 1)]
    : [...categorias, nova]
}

export function isSubcategoriaPecaFormValid(nome: string, categoriaId?: string): boolean {
  return Boolean(nome.trim() && categoriaId)
}

export type CreateSubcategoriaPecaFromFormOpts = {
  id?: string
}

export function createSubcategoriaPecaFromForm(
  nome: string,
  categoriaId: string,
  opts: CreateSubcategoriaPecaFromFormOpts = {}
): SubcategoriaPeca {
  return {
    id: opts.id ?? Date.now().toString(),
    nome: nome.trim(),
    categoriaId,
  }
}

/** Insere a subcategoria a seguir à anterior do mesmo grupo (ou no fim do grupo). */
export function inserirSubcategoriaPecaAposRef(
  subcategorias: SubcategoriaPeca[],
  nova: SubcategoriaPeca,
  prevSubId?: string
): SubcategoriaPeca[] {
  const prevIdx =
    prevSubId && subcategorias.some((s) => s.id === prevSubId && s.categoriaId === nova.categoriaId)
      ? subcategorias.findIndex((s) => s.id === prevSubId)
      : -1
  if (prevIdx >= 0) {
    return [...subcategorias.slice(0, prevIdx + 1), nova, ...subcategorias.slice(prevIdx + 1)]
  }
  let insertAt = subcategorias.length
  for (let i = subcategorias.length - 1; i >= 0; i--) {
    if (subcategorias[i].categoriaId === nova.categoriaId) {
      insertAt = i + 1
      break
    }
  }
  return [...subcategorias.slice(0, insertAt), nova, ...subcategorias.slice(insertAt)]
}
