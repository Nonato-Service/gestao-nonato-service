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
