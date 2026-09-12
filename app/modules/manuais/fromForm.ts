/** Validação e mapeamento puro de grupo e modelo de manuais. */

import type { ManuaisGrupo, ManuaisModelo } from './tipos'

export function newManuaisEntityId(prefix: string): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `${prefix}-${Date.now()}`
}

export function isManuaisGrupoNomeValid(nome: string): boolean {
  return Boolean(nome.trim())
}

export type CreateManuaisGrupoFromFormOpts = {
  id?: string
  idPrefix?: string
}

export function createManuaisGrupoFromForm(
  nome: string,
  familia: string,
  opts: CreateManuaisGrupoFromFormOpts = {}
): ManuaisGrupo {
  return {
    id: opts.id ?? newManuaisEntityId(opts.idPrefix ?? 'g'),
    nome: nome.trim(),
    familia,
  }
}

export function updateManuaisGrupoNomeFromForm(existing: ManuaisGrupo, nome: string): ManuaisGrupo {
  return { ...existing, nome: nome.trim() }
}

export function isManuaisModeloNomeValid(nome: string): boolean {
  return Boolean(nome.trim())
}

export type CreateManuaisModeloFromFormOpts = {
  id?: string
  idPrefix?: string
}

export function createManuaisModeloFromForm(
  nome: string,
  grupoId: string,
  opts: CreateManuaisModeloFromFormOpts = {}
): ManuaisModelo {
  return {
    id: opts.id ?? newManuaisEntityId(opts.idPrefix ?? 'm'),
    nome: nome.trim(),
    grupoId,
  }
}

export function updateManuaisModeloNomeFromForm(existing: ManuaisModelo, nome: string): ManuaisModelo {
  return { ...existing, nome: nome.trim() }
}
