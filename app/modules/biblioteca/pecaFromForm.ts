/** Validação e mapeamento puro da peça da biblioteca. */

import type { PecaBiblioteca } from './pecaTipos'

export function isPecaBibliotecaFormValid(form: Pick<PecaBiblioteca, 'nome' | 'codigo'>): boolean {
  return Boolean((form.nome || '').trim() && (form.codigo || '').trim())
}

export type CreatePecaBibliotecaFromFormOpts = {
  id?: string
  numeroSequenciaGrupo?: string
  dataCriacao?: string
}

export function createPecaBibliotecaFromForm(
  form: PecaBiblioteca,
  opts: CreatePecaBibliotecaFromFormOpts = {}
): PecaBiblioteca {
  return {
    ...form,
    nome: (form.nome || '').trim(),
    codigo: (form.codigo || '').trim(),
    id: opts.id ?? Date.now().toString() + Math.random().toString(36).substr(2, 9),
    numeroSequenciaGrupo: opts.numeroSequenciaGrupo,
    dataCriacao: opts.dataCriacao ?? new Date().toISOString(),
    importacaoPendente: false,
  }
}

export function updatePecaBibliotecaFromForm(
  existing: PecaBiblioteca,
  form: PecaBiblioteca,
  opts: Pick<CreatePecaBibliotecaFromFormOpts, 'numeroSequenciaGrupo'> = {}
): PecaBiblioteca {
  return {
    ...form,
    nome: (form.nome || '').trim(),
    codigo: (form.codigo || '').trim(),
    id: existing.id,
    numeroSequenciaGrupo: opts.numeroSequenciaGrupo,
    dataCriacao: existing.dataCriacao,
    importacaoPendente: false,
  }
}
