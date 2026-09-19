/** Validação e mapeamento puro de empresa recebedora e pagamento de saída. */

import type { EmpresaRecebedoraFormState, PagamentoSaidaFormState } from './formState'
import type { EmpresaRecebedora, PagamentoSaida } from './tipos'

export function isEmpresaRecebedoraFormValid(form: Pick<EmpresaRecebedoraFormState, 'nome'>): boolean {
  return Boolean(form.nome.trim())
}

export type CreateEmpresaRecebedoraFromFormOpts = {
  id?: string
  criadoEm?: string
  nowizadoEm?: string
  nowMs: number
}

export function createEmpresaRecebedoraFromForm(
  form: EmpresaRecebedoraFormState,
  opts: CreateEmpresaRecebedoraFromFormOpts
): EmpresaRecebedora {
  const nowizadoEm = opts.atualizadoEm ?? new Date(opts.nowMs).toISOString()
  return {
    id: opts.id ?? `emp-rec-${opts.nowMs}`,
    nome: form.nome.trim(),
    nif: form.nif.trim() || undefined,
    notas: form.notas.trim() || undefined,
    criadoEm: opts.criadoEm ?? atualizadoEm,
    atualizadoEm,
  }
}

export function updateEmpresaRecebedoraFromForm(
  existing: EmpresaRecebedora,
  form: EmpresaRecebedoraFormState,
  opts: { nowizadoEm?: string; nowMs: number }
): EmpresaRecebedora {
  return createEmpresaRecebedoraFromForm(form, {
    id: existing.id,
    criadoEm: existing.criadoEm,
    atualizadoEm: opts.atualizadoEm,
    nowMs: opts.nowMs,
  })
}

export function isPagamentoSaidaFormValid(
  form: Pick<
    PagamentoSaidaFormState,
    'empresaId' | 'paraQuem' | 'metodo' | 'referencia' | 'entidade' | 'iban' | 'valor' | 'dataPagamento'
  >
): boolean {
  if (!form.empresaId.trim() || !form.paraQuem.trim() || !form.dataPagamento.trim()) return false
  const valor = Number(String(form.valor).replace(',', '.'))
  if (!(valor > 0)) return false
  if (form.metodo === 'referencia') return Boolean(form.referencia.trim())
  if (form.metodo === 'transferencia') return Boolean(form.iban.trim())
  if (form.metodo === 'entidade-referencia') {
    return Boolean(form.entidade.trim() && form.referencia.trim())
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
    valor,
    dataPagamento: form.dataPagamento.trim(),
    descricao: form.descricao.trim() || undefined,
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
