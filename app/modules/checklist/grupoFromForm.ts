/** Validação e mapeamento puro do grupo de checklist. */

import type { GrupoChecklistFormState } from './grupoForm'
import type { GrupoChecklist } from './tipos'

export function resolveGrupoChecklistFamilia(
  form: Pick<GrupoChecklistFormState, 'familia'>,
  novaFamilia: string
): string {
  if (form.familia === 'nova') return novaFamilia.trim() || form.familia
  return form.familia.trim()
}

export function grupoChecklistFormMissing(
  form: Pick<GrupoChecklistFormState, 'numeroGrupo' | 'nomeGrupo' | 'familia'>,
  novaFamilia: string
): 'campos' | 'familia' | null {
  if (!form.numeroGrupo.trim() || !form.nomeGrupo.trim()) return 'campos'
  const familia = resolveGrupoChecklistFamilia(form, novaFamilia)
  if (!familia || familia === 'nova') return 'familia'
  return null
}

export function isGrupoChecklistFormValid(
  form: Pick<GrupoChecklistFormState, 'numeroGrupo' | 'nomeGrupo' | 'familia'>,
  novaFamilia: string
): boolean {
  return grupoChecklistFormMissing(form, novaFamilia) === null
}

export function createGrupoChecklistFromForm(
  form: GrupoChecklistFormState,
  novaFamilia: string,
  opts?: { id?: string; dataCriacao?: string; manutencoes?: GrupoChecklist['manutencoes'] }
): GrupoChecklist {
  return {
    id: opts?.id ?? Date.now().toString(),
    numeroGrupo: form.numeroGrupo.trim(),
    nomeGrupo: form.nomeGrupo.trim(),
    familia: resolveGrupoChecklistFamilia(form, novaFamilia),
    tipo: form.tipo,
    imagem: form.imagem || undefined,
    trabalhosASeremExecutados: form.trabalhosASeremExecutados?.trim() || undefined,
    manutencoes: opts?.manutencoes ?? [],
    dataCriacao: opts?.dataCriacao ?? new Date().toISOString(),
  }
}

export function updateGrupoChecklistFromForm(
  existing: GrupoChecklist,
  form: GrupoChecklistFormState,
  novaFamilia: string
): GrupoChecklist {
  const next = createGrupoChecklistFromForm(form, novaFamilia, {
    id: existing.id,
    dataCriacao: existing.dataCriacao,
    manutencoes: existing.manutencoes,
  })
  return {
    ...existing,
    ...next,
    manutencoes: existing.manutencoes,
  }
}
