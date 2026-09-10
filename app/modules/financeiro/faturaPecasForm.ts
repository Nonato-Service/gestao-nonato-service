/** Estado vazio e mapeamento FaturaPecas → formulário (fatura do cliente). */

import type { FaturaPecas } from './tiposOs'

export type FaturaPecasItemForm = {
  id: string
  descricao: string
  quantidade: number
  precoUnitario: number
  codigoPeca?: string
}

export type FaturaPecasFormState = {
  numeroFatura: string
  ordemServicoId: string
  numeroOS: string
  clienteId: string
  clienteNome: string
  equipamentoId: string
  equipamentoTexto: string
  dataEmissao: string
  dataVencimento: string
  taxaIVA: number
  status: 'pendente' | 'paga' | 'vencida' | 'cancelada'
  observacoes: string
  arquivoAnexo: string
  nomeArquivoOriginal: string
  tipoArquivo: string
  contaPagamentoEnviada: boolean
  valorManualSemIVA: string
  itens: FaturaPecasItemForm[]
}

export function emptyFaturaPecasFormState(): FaturaPecasFormState {
  return {
    numeroFatura: '',
    ordemServicoId: '',
    numeroOS: '',
    clienteId: '',
    clienteNome: '',
    equipamentoId: '',
    equipamentoTexto: '',
    dataEmissao: new Date().toISOString().split('T')[0],
    dataVencimento: '',
    taxaIVA: 23,
    status: 'pendente',
    observacoes: '',
    arquivoAnexo: '',
    nomeArquivoOriginal: '',
    tipoArquivo: '',
    contaPagamentoEnviada: false,
    valorManualSemIVA: '',
    itens: [],
  }
}

export function faturaPecasToFormState(
  fatura: FaturaPecas,
  opts?: { valorManualSemIVA?: string }
): FaturaPecasFormState {
  return {
    numeroFatura: fatura.numeroFatura,
    ordemServicoId: fatura.ordemServicoId || '',
    numeroOS: fatura.numeroOS || '',
    clienteId: fatura.clienteId,
    clienteNome: fatura.clienteNome,
    equipamentoId: fatura.equipamentoId || '',
    equipamentoTexto: fatura.equipamentoTexto || '',
    dataEmissao:
      (fatura.dataEmissao && String(fatura.dataEmissao).slice(0, 10)) ||
      new Date().toISOString().split('T')[0],
    dataVencimento: fatura.dataVencimento ? String(fatura.dataVencimento).slice(0, 10) : '',
    taxaIVA: fatura.taxaIVA,
    status: fatura.status,
    observacoes: fatura.observacoes || '',
    arquivoAnexo: fatura.arquivoAnexo || '',
    nomeArquivoOriginal: fatura.nomeArquivoOriginal || '',
    tipoArquivo: fatura.tipoArquivo || '',
    contaPagamentoEnviada: Boolean(fatura.contaPagamentoEnviada),
    valorManualSemIVA:
      opts?.valorManualSemIVA !== undefined
        ? opts.valorManualSemIVA
        : fatura.valorSemIVA
          ? String(fatura.valorSemIVA)
          : '',
    itens: (fatura.itens || []).map((i) => ({
      id: i.id,
      descricao: i.descricao,
      quantidade: i.quantidade,
      precoUnitario: i.precoUnitario,
      codigoPeca: i.codigoPeca,
    })),
  }
}
