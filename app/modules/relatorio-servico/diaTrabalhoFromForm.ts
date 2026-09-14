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
  nowMs: number
  random: () => number
}

export function resolveDiaTrabalhoData(
  form: Pick<DiaTrabalho, 'data'>,
  today?: string
): string {
  return form.data || today || ''
}

export function isDiaTrabalhoFormValid(form: Pick<DiaTrabalho, 'data'>): boolean {
  return Boolean(resolveDiaTrabalhoData(form, '_'))
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
  opts: DiaTrabalhoFromFormOpts
): DiaTrabalho {
  const today = opts.today ?? new Date(opts.nowMs).toISOString().split('T')[0]
  const dataParaUsar = resolveDiaTrabalhoData(form, today)
  const km = applyKmPadrao(form, opts.kmPadrao)
  const maxChars = opts.descricaoMaxChars ?? 5000
  return atualizarCalculosDia({
    ...form,
    data: diaTrabalhoDataChaveOrdenacao(dataParaUsar),
    id: opts.id ?? opts.nowMs.toString() + opts.random().toString(36).substr(2, 9),
    kmIda: km.kmIda,
    kmRetorno: km.kmRetorno,
    descricaoTrabalho: String(form.descricaoTrabalho ?? '').slice(0, maxChars),
  })
}

export function updateDiaTrabalhoFromForm(
  existing: DiaTrabalho,
  form: DiaTrabalho,
  opts: Omit<DiaTrabalhoFromFormOpts, 'id'>
): DiaTrabalho {
  return { ...createDiaTrabalhoFromForm(form, opts), id: existing.id }
}

export function emptyDiaTrabalhoFormWithKmPadrao(
  kmPadrao: DiaTrabalhoKmPadrao = {},
  opts: { nowMs: number }
): DiaTrabalho {
  return atualizarCalculosDia({
    ...createEmptyDiaTrabalhoForm(opts),
    kmIda: kmPadrao.kmIda || '',
    kmRetorno: kmPadrao.kmRetorno || '',
  })
}
