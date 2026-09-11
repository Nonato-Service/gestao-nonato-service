/** Validação e mapeamento puro do grupo de tarifa / cadastro de serviços. */

import type { ServicoCadastroGrupo } from './grupos'

export function isServicoCadastroGrupoNomeValid(nome: string): boolean {
  return Boolean(nome.trim())
}

export function proximaOrdemServicoCadastroGrupo(grupos: { ordem: number }[]): number {
  return grupos.length ? Math.max(...grupos.map((g) => g.ordem)) + 1 : 0
}

export type CreateServicoCadastroGrupoFromFormOpts = {
  id?: string
  ordem?: number
  grupos?: { ordem: number }[]
}

export function createServicoCadastroGrupoFromForm(
  nome: string,
  opts: CreateServicoCadastroGrupoFromFormOpts = {}
): ServicoCadastroGrupo {
  return {
    id: opts.id ?? Date.now().toString() + Math.random().toString(36).slice(2, 10),
    nome: nome.trim(),
    ordem: opts.ordem ?? (opts.grupos ? proximaOrdemServicoCadastroGrupo(opts.grupos) : 0),
  }
}

export function updateServicoCadastroGrupoNomeFromForm(
  existing: ServicoCadastroGrupo,
  nome: string
): ServicoCadastroGrupo {
  return { ...existing, nome: nome.trim() }
}
