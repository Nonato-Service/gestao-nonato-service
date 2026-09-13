/**
 * I/O de relógio/aleatório — fromForm canónico em `app/modules/pagamentos-contador/fromForm`.
 */
import {
  createAnexoContadorFromForm as createAnexoContadorFromFormPure,
  createEntidadeContadorFromForm as createEntidadeContadorFromFormPure,
  createPagamentoContadorFromForm as createPagamentoContadorFromFormPure,
  updatePagamentoContadorFromForm as updatePagamentoContadorFromFormPure,
  type CreateAnexoContadorFromFormOpts,
  type CreateEntidadeContadorFromFormOpts,
  type CreatePagamentoContadorFromFormOpts,
  type UpdatePagamentoContadorFromFormOpts,
} from '../modules/pagamentos-contador/fromForm'
import type { EntidadeContadorFormState, PagamentoContadorFormState } from '../modules/pagamentos-contador/formState'
import type { AnexoContador, EntidadeContador, PagamentoContador } from '../modules/pagamentos-contador/tipos'

/** Injeta Date.now() (e Math.random no anexo) quando o call-site não envia. */
export function createEntidadeContadorFromForm(
  form: EntidadeContadorFormState,
  opts: Omit<CreateEntidadeContadorFromFormOpts, 'nowMs'> = {}
): EntidadeContador {
  return createEntidadeContadorFromFormPure(form, { ...opts, nowMs: Date.now() })
}

export function createPagamentoContadorFromForm(
  form: PagamentoContadorFormState,
  opts: Omit<CreatePagamentoContadorFromFormOpts, 'nowMs'>
): PagamentoContador {
  return createPagamentoContadorFromFormPure(form, { ...opts, nowMs: Date.now() })
}

export function updatePagamentoContadorFromForm(
  existing: PagamentoContador,
  form: PagamentoContadorFormState,
  opts: Omit<UpdatePagamentoContadorFromFormOpts, 'nowMs'>
): PagamentoContador {
  return updatePagamentoContadorFromFormPure(existing, form, { ...opts, nowMs: Date.now() })
}

export function createAnexoContadorFromForm(
  form: Pick<AnexoContador, 'nome' | 'mime' | 'base64'>,
  opts: Omit<CreateAnexoContadorFromFormOpts, 'nowMs' | 'random'> = {}
): AnexoContador {
  return createAnexoContadorFromFormPure(form, { ...opts, nowMs: Date.now(), random: Math.random })
}
