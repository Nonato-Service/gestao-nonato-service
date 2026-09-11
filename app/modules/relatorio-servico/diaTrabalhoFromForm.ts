/** Validação e mapeamento puro do dia de trabalho. */

import { atualizarCalculosDia } from './calculos'
import { createEmptyDiaTrabalhoForm } from './diaTrabalhoForm'
import { diaTrabalhoDataChaveOrdenacao } from './dias'
import { normalizeKmForPersist } from './km'
import type { DiaTrabalho } from './tipos'

export type DiaTrabalhoKmPadrao = {
  kmIda?: string
  kmRetorno?: string
}

export type DiaTrabalhoFromFormOpts = {
  id?: string
  kmPadrao?: DiaTrabalhoKmPadrao
  descricaoMaxChars?: number
  today?: string
}

export function resolveDiaTrabalhoData(
  form: Pick<DiaTrabalho, 'data'>,
  today = new Date().toISOString().split('T')[0]
): string {
  return form.data || today
}

export function isDiaTrabalhoFormValid(form: Pick<DiaTrabalho, 'data'>): boolean {
  return Boolean(resolveDiaTrabalhoData(form))
}

function applyKmPadrao(
  form: Pick<DiaTrabalho, 'kmIda' | 'kmRetorno'>,
  padrao: DiaTrabalhoKmPadrao = {}
): { kmIda: string; kmRetorno: string } {
  let kmIda = normalizeKmForPersist(form.kmIda)
  let kmRetorno = normalizeKmForPersist(form.kmRetorno)
  if (!kmIda && padrao.kmIda) kmIda = padrao.kmIda
  if (!kmRetorno && padrao.kmRetorno) kmRetorno = padrao.kmRetorno
  return { kmIda, kmRetorno }
}

export function createDiaTrabalhoFromForm(
  form: DiaTrabalho,
  opts: DiaTrabalhoFromFormOpts = {}
): DiaTrabalho {
  const dataParaUsar = resolveDiaTrabalhoData(form, opts.today)
  const km = applyKmPadrao(form, opts.kmPadrao)
  const maxChars = opts.descricaoMaxChars ?? 5000
  return atualizarCalculosDia({
    ...form,
    data: diaTrabalhoDataChaveOrdenacao(dataParaUsar),
    id: opts.id ?? Date.now().toString() + Math.random().toString(36).substr(2, 9),
    kmIda: km.kmIda,
    kmRetorno: km.kmRetorno,
    descricaoTrabalho: String(form.descricaoTrabalho ?? '').slice(0, maxChars),
  })
}

export function updateDiaTrabalhoFromForm(
  existing: DiaTrabalho,
  form: DiaTrabalho,
  opts: Omit<DiaTrabalhoFromFormOpts, 'id'> = {}
): DiaTrabalho {
  return { ...createDiaTrabalhoFromForm(form, opts), id: existing.id }
}

export function emptyDiaTrabalhoFormWithKmPadrao(kmPadrao: DiaTrabalhoKmPadrao = {}): DiaTrabalho {
  return atualizarCalculosDia({
    ...createEmptyDiaTrabalhoForm(),
    kmIda: kmPadrao.kmIda || '',
    kmRetorno: kmPadrao.kmRetorno || '',
  })
}
