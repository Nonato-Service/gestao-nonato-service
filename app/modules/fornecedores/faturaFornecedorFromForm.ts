/** Validação e mapeamento puro da fatura associada a um fornecedor. */

import type { FaturaFornecedor, FaturaFornecedorFormState } from './tipos'

export type FaturaFornecedorFromFormOpts = {
  valor: number
  clienteNome: string
}

function camposFaturaFornecedorFromForm(
  form: FaturaFornecedorFormState,
  opts: FaturaFornecedorFromFormOpts
): Omit<FaturaFornecedor, 'id'> {
  return {
    numeroFatura: form.numeroFatura,
    mes: form.mes,
    valor: opts.valor,
    clienteId: form.clienteId,
    clienteNome: opts.clienteNome,
    entidadeOrigem: form.entidadeOrigem,
    dataVencimento: form.dataVencimento || undefined,
    status: form.status,
    observacoes: form.observacoes || undefined,
  }
}

/** Campos obrigatórios + valor numérico finito (parse feito no call-site). */
export function isFaturaFornecedorFormValid(
  form: Pick<FaturaFornecedorFormState, 'numeroFatura' | 'mes' | 'clienteId' | 'valorText'>,
  valor: number
): boolean {
  return Boolean(
    form.numeroFatura &&
      form.mes &&
      form.clienteId &&
      String(form.valorText).trim() &&
      Number.isFinite(valor)
  )
}

export function isFaturaFornecedorValorPositivo(valor: number): boolean {
  return valor > 0
}

/** Monta uma FaturaFornecedor nova a partir do form (sem I/O / alertas). */
export function createFaturaFornecedorFromForm(
  form: FaturaFornecedorFormState,
  opts: FaturaFornecedorFromFormOpts & { id: string }
): FaturaFornecedor {
  return {
    id: opts.id,
    ...camposFaturaFornecedorFromForm(form, opts),
  }
}

/** Actualiza campos editáveis (preserva id e extras do existente). */
export function updateFaturaFornecedorFromForm(
  existing: FaturaFornecedor,
  form: FaturaFornecedorFormState,
  opts: FaturaFornecedorFromFormOpts
): FaturaFornecedor {
  return {
    ...existing,
    ...camposFaturaFornecedorFromForm(form, opts),
  }
}
