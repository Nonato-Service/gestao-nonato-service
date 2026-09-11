/** Validação e mapeamento puro da entrada de conhecimento técnico. */

import type { ConhecimentoTecnicoEntry } from './tipos'

export type ConhecimentoTecnicoFormPayload = {
  tecnicoId: string
  equipamentoTipoId: string
  equipamentoTipoNome: string
}

export function isConhecimentoTecnicoFormValid(
  form: Pick<ConhecimentoTecnicoFormPayload, 'tecnicoId' | 'equipamentoTipoId'>
): boolean {
  return Boolean(form.tecnicoId && form.equipamentoTipoId)
}

export type CreateConhecimentoTecnicoFromFormOpts = {
  id?: string
}

export function createConhecimentoTecnicoFromForm(
  form: ConhecimentoTecnicoFormPayload,
  opts: CreateConhecimentoTecnicoFromFormOpts = {}
): ConhecimentoTecnicoEntry {
  return {
    id: opts.id ?? `ct-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    tecnicoId: form.tecnicoId,
    equipamentoTipoId: form.equipamentoTipoId,
    equipamentoTipoNome: form.equipamentoTipoNome,
    mecanico: 0,
    eletrico: 0,
    software: 0,
    programacao: 0,
  }
}
