/** Validação e mapeamento puro de entidade, pagamento e anexo do contabilista. */

import type { EntidadeContadorFormState, PagamentoContadorFormState } from './formState'
import type { AnexoContador, EntidadeContador, PagamentoContador } from './tipos'

export function isEntidadeContadorFormValid(form: Pick<EntidadeContadorFormState, 'nome'>): boolean {
  return Boolean(form.nome.trim())
}

export type CreateEntidadeContadorFromFormOpts = {
  id?: string
  criadoEm?: string
  ativo?: boolean
}

export function createEntidadeContadorFromForm(
  form: EntidadeContadorFormState,
  opts: CreateEntidadeContadorFromFormOpts = {}
): EntidadeContador {
  return {
    id: opts.id ?? `ent-${Date.now()}`,
    nome: form.nome.trim(),
    categoria: form.categoria,
    nif: form.nif.trim() || undefined,
    contacto: form.contacto.trim() || undefined,
    notas: form.notas.trim() || undefined,
    ativo: opts.ativo ?? true,
    criadoEm: opts.criadoEm ?? new Date().toISOString(),
  }
}

export function isPagamentoContadorFormValid(
  form: Pick<PagamentoContadorFormState, 'entidadeId' | 'dataPagamento' | 'valor'>
): boolean {
  return Boolean(form.entidadeId && form.dataPagamento && form.valor > 0)
}

export type CreatePagamentoContadorFromFormOpts = {
  entidadeNome: string
  id?: string
  criadoEm?: string
  atualizadoEm?: string
}

export function createPagamentoContadorFromForm(
  form: PagamentoContadorFormState,
  opts: CreatePagamentoContadorFromFormOpts
): PagamentoContador {
  const now = opts.atualizadoEm ?? new Date().toISOString()
  return {
    id: opts.id ?? `pag-${Date.now()}`,
    entidadeId: form.entidadeId,
    entidadeNome: opts.entidadeNome,
    dataPagamento: form.dataPagamento,
    valor: Math.round(form.valor * 100) / 100,
    periodoReferencia: form.periodoReferencia.trim(),
    numeroDocumento: form.numeroDocumento?.trim() || undefined,
    descricao: form.descricao?.trim() || undefined,
    status: form.status,
    anexos: form.anexos,
    criadoEm: opts.criadoEm ?? now,
    atualizadoEm: now,
  }
}

export type UpdatePagamentoContadorFromFormOpts = {
  entidadeNome: string
  atualizadoEm?: string
}

export function updatePagamentoContadorFromForm(
  existing: PagamentoContador,
  form: PagamentoContadorFormState,
  opts: UpdatePagamentoContadorFromFormOpts
): PagamentoContador {
  return createPagamentoContadorFromForm(form, {
    entidadeNome: opts.entidadeNome,
    id: existing.id,
    criadoEm: existing.criadoEm,
    atualizadoEm: opts.atualizadoEm,
  })
}

export function isAnexoContadorFormValid(form: Pick<AnexoContador, 'nome' | 'base64'>): boolean {
  return Boolean(form.nome && form.base64)
}

export type CreateAnexoContadorFromFormOpts = {
  id?: string
  criadoEm?: string
}

export function createAnexoContadorFromForm(
  form: Pick<AnexoContador, 'nome' | 'mime' | 'base64'>,
  opts: CreateAnexoContadorFromFormOpts = {}
): AnexoContador {
  return {
    id: opts.id ?? `anx-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    nome: form.nome,
    mime: form.mime,
    base64: form.base64,
    criadoEm: opts.criadoEm ?? new Date().toISOString(),
  }
}
