/** Validação e mapeamento puro do checklist gravado (rascunho local). */

import type { GrupoChecklist } from './tipos'

export type ChecklistSalvoStatus = 'salvo' | 'gerado' | 'concluido'

export type ChecklistSalvoGrupo<G = GrupoChecklist> = {
  grupoId: string
  grupo: G
  manutencoesSelecionadas: string[]
}

export type ChecklistSalvo<E = { id: string }> = {
  id: string
  tipo: 'checklist-gerado'
  equipamentoId: string
  equipamento: E
  data: string
  tecnicoResponsavel: string
  tecnicoNome: string
  grupos: ChecklistSalvoGrupo[]
  manutencoesSelecionadas: string[]
  dataCriacao: string
  status: ChecklistSalvoStatus
}

export function isChecklistSalvoFormValid(
  equipamento: unknown,
  tecnicoResponsavel: unknown,
  gruposSelecionados: { length: number }
): boolean {
  return Boolean(equipamento && tecnicoResponsavel && gruposSelecionados.length > 0)
}

export function mapChecklistSalvoGrupos<G extends { id: string }>(
  grupos: G[],
  manutencoesSelecionadas: Iterable<string>
): ChecklistSalvoGrupo<G>[] {
  const keys = Array.from(manutencoesSelecionadas)
  return grupos.map((g) => ({
    grupoId: g.id,
    grupo: g,
    manutencoesSelecionadas: keys
      .filter((key) => key.startsWith(`${g.id}-`))
      .map((key) => key.split('-')[1]),
  }))
}

export type CreateChecklistSalvoFromFormInput<E extends { id: string }> = {
  equipamento: E
  data: string
  tecnicoResponsavel: string
  tecnicoNome: string
  gruposSelecionados: GrupoChecklist[]
  manutencoesSelecionadas: Iterable<string>
  id?: string
  dataCriacao?: string
  status?: ChecklistSalvoStatus
}

export function createChecklistSalvoFromForm<E extends { id: string }>(
  input: CreateChecklistSalvoFromFormInput<E>
): ChecklistSalvo<E> {
  return {
    id: input.id ?? `checklist-${Date.now()}`,
    tipo: 'checklist-gerado',
    equipamentoId: input.equipamento.id,
    equipamento: input.equipamento,
    data: input.data,
    tecnicoResponsavel: input.tecnicoResponsavel,
    tecnicoNome: input.tecnicoNome,
    grupos: mapChecklistSalvoGrupos(input.gruposSelecionados, input.manutencoesSelecionadas),
    manutencoesSelecionadas: Array.from(input.manutencoesSelecionadas),
    dataCriacao: input.dataCriacao ?? new Date().toISOString(),
    status: input.status ?? 'salvo',
  }
}
