/** Validação e mapeamento puro de empresa recebedora e pagamento de saída. */

import type { EmpresaRecebedoraFormState, PagamentoSaidaFormState } from './formState'
import { normalizarDataPagamento } from './resumo'
import type { AnexoPagamento, AnexoPagamentoPapel, EmpresaRecebedora, PagamentoSaida } from './tipos'

export function isEmpresaRecebedoraFormValid(form: Pick<EmpresaRecebedoraFormState, 'nome'>): boolean {
  return Boolean(form.nome.trim())
}

export type CreateEmpresaRecebedoraFromFormOpts = {
  id?: string
  tipo?: EmpresaRecebedora['tipo']
  criadoEm?: string
  atualizadoEm?: string
  nowMs: number
}

export function createEmpresaRecebedoraFromForm(
  form: EmpresaRecebedoraFormState,
  opts: CreateEmpresaRecebedoraFromFormOpts
): EmpresaRecebedora {
  const atualizadoEm = opts.atualizadoEm ?? new Date(opts.nowMs).toISOString()
  const contribuinte = form.contribuinte.trim() || form.nif.trim()
  return {
    id: opts.id ?? `emp-rec-${opts.nowMs}`,
    nome: form.nome.trim(),
    tipo: opts.tipo || 'outra',
    nif: form.nif.trim() || contribuinte || undefined,
    contribuinte: contribuinte || undefined,
    iban: form.iban.trim() || undefined,
    banco: form.banco.trim() || undefined,
    notas: form.notas.trim() || undefined,
    criadoEm: opts.criadoEm ?? atualizadoEm,
    atualizadoEm,
  }
}

export function updateEmpresaRecebedoraFromForm(
  existing: EmpresaRecebedora,
  form: EmpresaRecebedoraFormState,
  opts: { atualizadoEm?: string; nowMs: number }
): EmpresaRecebedora {
  return {
    ...createEmpresaRecebedoraFromForm(form, {
      id: existing.id,
      tipo: existing.tipo || 'outra',
      criadoEm: existing.criadoEm,
      atualizadoEm: opts.atualizadoEm,
      nowMs: opts.nowMs,
    }),
    apagado: existing.apagado,
  }
}

export function marcarEmpresaRecebedoraApagada(
  existing: EmpresaRecebedora,
  opts: { nowMs: number }
): EmpresaRecebedora {
  return {
    ...existing,
    apagado: true,
    atualizadoEm: new Date(opts.nowMs).toISOString(),
  }
}

export type PagamentoValidacaoErro =
  | 'pagamentosFaltaValor'
  | 'pagamentosInvalido'
  | 'pagamentosFaltaReferencia'
  | 'pagamentosFaltaEntidadeReferencia'
  | 'pagamentosFaltaTransferencia'

export function erroValidacaoPagamentoSaida(
  form: Pick<
    PagamentoSaidaFormState,
    | 'empresaId'
    | 'paraQuem'
    | 'metodo'
    | 'referencia'
    | 'entidade'
    | 'iban'
    | 'contribuinte'
    | 'valor'
    | 'dataPagamento'
  >
): PagamentoValidacaoErro | null {
  if (!form.empresaId.trim() || !form.paraQuem.trim() || !form.dataPagamento.trim()) return 'pagamentosInvalido'
  const valor = Number(String(form.valor).replace(',', '.'))
  if (!(valor > 0)) return 'pagamentosFaltaValor'
  if (form.metodo === 'referencia') {
    return form.referencia.trim() ? null : 'pagamentosFaltaReferencia'
  }
  if (form.metodo === 'entidade-referencia') {
    return form.entidade.trim() && form.referencia.trim() ? null : 'pagamentosFaltaEntidadeReferencia'
  }
  if (form.metodo === 'transferencia') {
    return form.iban.trim() && form.contribuinte.trim() ? null : 'pagamentosFaltaTransferencia'
  }
  return 'pagamentosInvalido'
}

export function isPagamentoSaidaFormValid(
  form: Pick<
    PagamentoSaidaFormState,
    | 'empresaId'
    | 'paraQuem'
    | 'metodo'
    | 'referencia'
    | 'entidade'
    | 'iban'
    | 'contribuinte'
    | 'valor'
    | 'dataPagamento'
  >
): boolean {
  return erroValidacaoPagamentoSaida(form) === null
}

export function pagamentoPodeSerPago(p: Pick<PagamentoSaida, 'metodo' | 'referencia' | 'entidade' | 'iban' | 'contribuinte' | 'valor'>): boolean {
  if (!(p.valor > 0)) return false
  if (p.metodo === 'referencia') return Boolean((p.referencia || '').trim())
  if (p.metodo === 'entidade-referencia') {
    return Boolean((p.entidade || '').trim() && (p.referencia || '').trim())
  }
  if (p.metodo === 'transferencia') {
    return Boolean((p.iban || '').trim() && (p.contribuinte || '').trim())
  }
  return false
}

export type CreatePagamentoSaidaFromFormOpts = {
  empresaNome: string
  id?: string
  criadoEm?: string
  atualizadoEm?: string
  nowMs: number
}

export function createPagamentoSaidaFromForm(
  form: PagamentoSaidaFormState,
  opts: CreatePagamentoSaidaFromFormOpts
): PagamentoSaida {
  const now = opts.atualizadoEm ?? new Date(opts.nowMs).toISOString()
  const valor = Math.round(Number(String(form.valor).replace(',', '.')) * 100) / 100
  const anexosBrutos = Array.isArray(form.anexos) ? [...form.anexos] : []
  const anexos = form.status === 'pago' ? arquivarAnexosAPagarComoPagos(anexosBrutos) : anexosBrutos
  return {
    id: opts.id ?? `pag-sai-${opts.nowMs}`,
    empresaId: form.empresaId.trim(),
    empresaNome: opts.empresaNome.trim(),
    paraQuem: form.paraQuem.trim(),
    metodo: form.metodo,
    referencia: form.referencia.trim() || undefined,
    entidade: form.entidade.trim() || undefined,
    iban: form.iban.trim() || undefined,
    banco: form.banco.trim() || undefined,
    contribuinte: form.contribuinte.trim() || undefined,
    valor,
    dataPagamento: normalizarDataPagamento(form.dataPagamento) || form.dataPagamento.trim(),
    descricao: form.descricao.trim() || undefined,
    status: form.status || 'pendente',
    anexos,
    criadoEm: opts.criadoEm ?? now,
    atualizadoEm: now,
  }
}

export function updatePagamentoSaidaFromForm(
  existing: PagamentoSaida,
  form: PagamentoSaidaFormState,
  opts: { empresaNome: string; atualizadoEm?: string; nowMs: number }
): PagamentoSaida {
  return createPagamentoSaidaFromForm(form, {
    empresaNome: opts.empresaNome,
    id: existing.id,
    criadoEm: existing.criadoEm,
    atualizadoEm: opts.atualizadoEm,
    nowMs: opts.nowMs,
  })
}

export function isAnexoPagamentoFormValid(form: Pick<AnexoPagamento, 'nome' | 'base64'>): boolean {
  return Boolean(form.nome && form.base64)
}

export type CreateAnexoPagamentoFromFormOpts = {
  id?: string
  criadoEm?: string
  nowMs: number
  random: () => number
}

export function createAnexoPagamentoFromForm(
  form: Pick<AnexoPagamento, 'nome' | 'mime' | 'base64' | 'papel'>,
  opts: CreateAnexoPagamentoFromFormOpts
): AnexoPagamento {
  return {
    id: opts.id ?? `pag-anx-${opts.nowMs}-${opts.random().toString(36).slice(2, 7)}`,
    nome: form.nome,
    mime: form.mime,
    base64: form.base64,
    papel: form.papel,
    criadoEm: opts.criadoEm ?? new Date(opts.nowMs).toISOString(),
  }
}

/** Passa os documentos «a pagar» para o sítio do pagamento já pago, sem os apagar. */
export function arquivarAnexosAPagarComoPagos(
  anexos: AnexoPagamento[],
  papelPago: AnexoPagamentoPapel = 'pago'
): AnexoPagamento[] {
  return (Array.isArray(anexos) ? anexos : []).map((a) =>
    a.papel === 'a-pagar' ? { ...a, papel: papelPago } : a
  )
}

export function marcarPagamentoSaidaComoPago(
  existing: PagamentoSaida,
  opts: { atualizadoEm?: string; nowMs: number }
): PagamentoSaida {
  return {
    ...existing,
    status: 'pago',
    anexos: arquivarAnexosAPagarComoPagos(existing.anexos || []),
    atualizadoEm: opts.atualizadoEm ?? new Date(opts.nowMs).toISOString(),
  }
}

export function normalizePagamentoSaida(raw: PagamentoSaida): PagamentoSaida {
  return {
    ...raw,
    status: raw.status === 'pago' ? 'pago' : 'pendente',
    dataPagamento: normalizarDataPagamento(raw.dataPagamento) || raw.dataPagamento || '',
    anexos: Array.isArray(raw.anexos) ? raw.anexos : [],
  }
}
