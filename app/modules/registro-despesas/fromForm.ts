/** Validação e mapeamento puro de cartão, linha e documento de despesas. */

import type { CartaoEmpresaDespesasFormState, DespesaRegistroFormState } from './formState'
import type { CartaoEmpresaDespesas, DespesaDocumento, DespesaRegistro } from './tipos'

export function normalizeCartaoEmpresaUltimos4(raw: string): string {
  return raw.replace(/\D/g, '').slice(-4)
}

export function isCartaoEmpresaApelidoValid(apelido: string): boolean {
  return Boolean(apelido.trim())
}

export function isCartaoEmpresaUltimos4Valid(ultimos4: string): boolean {
  return normalizeCartaoEmpresaUltimos4(ultimos4).length === 4
}

export function isCartaoEmpresaDespesasFormValid(
  form: Pick<CartaoEmpresaDespesasFormState, 'apelido' | 'ultimos4'>
): boolean {
  return isCartaoEmpresaApelidoValid(form.apelido) && isCartaoEmpresaUltimos4Valid(form.ultimos4)
}

export type CreateCartaoEmpresaDespesasFromFormOpts = {
  id?: string
  criadoEm?: string
  nowMs: number
}

export function createCartaoEmpresaDespesasFromForm(
  form: CartaoEmpresaDespesasFormState,
  opts: CreateCartaoEmpresaDespesasFromFormOpts
): CartaoEmpresaDespesas {
  return {
    id: opts.id ?? `card-${opts.nowMs}`,
    apelido: form.apelido.trim(),
    ultimos4: normalizeCartaoEmpresaUltimos4(form.ultimos4),
    criadoEm: opts.criadoEm ?? new Date(opts.nowMs).toISOString(),
  }
}

export function isDespesaRegistroTipoValid(
  form: Pick<DespesaRegistroFormState, 'tipoId'>,
  tiposCadastrados: readonly { id: string }[]
): boolean {
  if (tiposCadastrados.length === 0) return true
  return tiposCadastrados.some((t) => t.id === form.tipoId)
}

export type CreateDespesaRegistroFromFormOpts = {
  id?: string
  tipoNomeFallback?: string
  cartaoRotulo?: string
  nowMs: number
}

export function createDespesaRegistroFromForm(
  form: Pick<
    DespesaRegistroFormState,
    'tipoId' | 'tipoNome' | 'valor' | 'descricao' | 'codigoBarras' | 'fotos' | 'data' | 'cartaoId'
  >,
  opts: CreateDespesaRegistroFromFormOpts
): DespesaRegistro {
  const cid = form.cartaoId?.trim()
  const nova: DespesaRegistro = {
    id: opts.id ?? `d-${opts.nowMs}`,
    tipoId: form.tipoId || '',
    tipoNome: form.tipoNome || opts.tipoNomeFallback || 'Outros',
    valor: form.valor ?? 0,
    descricao: form.descricao || '',
    codigoBarras: form.codigoBarras,
    fotos: form.fotos || [],
    data: form.data || new Date(opts.nowMs).toISOString().split('T')[0],
  }
  if (cid) {
    nova.cartaoId = cid
    nova.cartaoRotulo = opts.cartaoRotulo || cid
  }
  return nova
}

export function isDespesaDocumentoClienteValid(form: Pick<DespesaDocumento, 'clienteId' | 'clienteNome'>): boolean {
  return Boolean(form.clienteId && form.clienteNome)
}

export type CreateDespesaDocumentoFromFormOpts = {
  id?: string
  data?: string
  dataCriacao?: string
  despesas?: DespesaRegistro[]
  nowMs: number
}

export function createDespesaDocumentoFromForm(
  form: Pick<DespesaDocumento, 'clienteId' | 'clienteNome'> & {
    relatorioId?: string
    relatorioNumero?: string
  },
  opts: CreateDespesaDocumentoFromFormOpts
): DespesaDocumento {
  return {
    id: opts.id ?? `doc-${opts.nowMs}`,
    clienteId: form.clienteId,
    clienteNome: form.clienteNome,
    relatorioId: form.relatorioId,
    relatorioNumero: form.relatorioNumero,
    data: opts.data ?? new Date(opts.nowMs).toISOString().split('T')[0],
    despesas: opts.despesas ?? [],
    dataCriacao: opts.dataCriacao ?? new Date(opts.nowMs).toISOString(),
  }
}
