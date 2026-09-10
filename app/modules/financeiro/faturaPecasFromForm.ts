/** Validação, totais e mapeamento puro da fatura de peças do cliente. */

import type { FaturaPecasFormState } from './faturaPecasForm'
import type { FaturaPecas } from './tiposOs'

export type FaturaPecasFromFormCalculos = {
  valorSemIVA: number
  valorIVA: number
  valorTotal: number
  itensSalvos: FaturaPecas['itens']
}

export type FaturaPecasItemDigitalOpts = {
  itemDigitalId: string
  itemDigitalDescricao: string
}

/** Número da fatura + cliente. */
export function isFaturaPecasFormValid(
  form: Pick<FaturaPecasFormState, 'numeroFatura' | 'clienteId'>
): boolean {
  return Boolean(form.numeroFatura?.trim() && form.clienteId)
}

export function isFaturaPecasValorValido(valorSemIVA: number): boolean {
  return valorSemIVA > 0
}

/** Totais e linhas (item digital se não houver quantidades/preços). */
export function calcularFaturaPecasFromForm(
  form: FaturaPecasFormState,
  opts: FaturaPecasItemDigitalOpts
): FaturaPecasFromFormCalculos {
  const itensComValor = form.itens.filter(
    (i) => (i.quantidade || 0) > 0 && (i.precoUnitario || 0) > 0
  )
  const valorPorItens = itensComValor.reduce(
    (sum, item) => sum + (item.quantidade || 0) * (item.precoUnitario || 0),
    0
  )
  const manual = parseFloat(String(form.valorManualSemIVA || '').replace(',', '.')) || 0
  const valorSemIVA = valorPorItens > 0 ? valorPorItens : manual
  const valorIVA = valorSemIVA * (form.taxaIVA / 100)
  const valorTotal = valorSemIVA + valorIVA
  const itensSalvos: FaturaPecas['itens'] =
    itensComValor.length > 0
      ? itensComValor.map((item) => ({
          ...item,
          valorTotal: (item.quantidade || 0) * (item.precoUnitario || 0),
        }))
      : [
          {
            id: opts.itemDigitalId,
            descricao: opts.itemDigitalDescricao,
            quantidade: 1,
            precoUnitario: valorSemIVA,
            valorTotal: valorSemIVA,
          },
        ]
  return { valorSemIVA, valorIVA, valorTotal, itensSalvos }
}

function payloadFaturaPecasFromForm(
  form: FaturaPecasFormState,
  calc: FaturaPecasFromFormCalculos
): Omit<FaturaPecas, 'id'> {
  return {
    numeroFatura: form.numeroFatura.trim(),
    ordemServicoId: form.ordemServicoId || '',
    numeroOS: form.numeroOS || '',
    clienteId: form.clienteId,
    clienteNome: form.clienteNome,
    equipamentoId: form.equipamentoId || undefined,
    equipamentoTexto: form.equipamentoTexto || undefined,
    dataEmissao: form.dataEmissao,
    dataVencimento: form.dataVencimento || undefined,
    valorTotal: calc.valorTotal,
    valorIVA: calc.valorIVA,
    valorSemIVA: calc.valorSemIVA,
    taxaIVA: form.taxaIVA,
    status: form.status,
    itens: calc.itensSalvos,
    observacoes: form.observacoes || undefined,
    arquivoAnexo: form.arquivoAnexo || undefined,
    nomeArquivoOriginal: form.nomeArquivoOriginal || undefined,
    tipoArquivo: form.arquivoAnexo ? form.tipoArquivo || undefined : undefined,
    contaPagamentoEnviada: Boolean(form.contaPagamentoEnviada),
  }
}

/** Monta uma FaturaPecas nova a partir do form (sem I/O / alertas). */
export function createFaturaPecasFromForm(
  form: FaturaPecasFormState,
  calc: FaturaPecasFromFormCalculos,
  opts: { id: string }
): FaturaPecas {
  return {
    id: opts.id,
    ...payloadFaturaPecasFromForm(form, calc),
  }
}

/** Actualiza campos editáveis (preserva id e extras do existente). */
export function updateFaturaPecasFromForm(
  existing: FaturaPecas,
  form: FaturaPecasFormState,
  calc: FaturaPecasFromFormCalculos
): FaturaPecas {
  return {
    ...existing,
    ...payloadFaturaPecasFromForm(form, calc),
  }
}
