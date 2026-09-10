/** Validação, totais e mapeamento puro da ordem de serviço. */

import type { OrdemServicoFormState } from './ordemServicoForm'
import type { OrdemServico } from './tiposOs'

export type OrdemServicoFromFormTotais = {
  valorSemIVA: number
  valorIVA: number
  valorTotal: number
}

/** Número da OS + cliente. */
export function isOrdemServicoFormValid(
  form: Pick<OrdemServicoFormState, 'numeroOS' | 'clienteId'>
): boolean {
  return Boolean(form.numeroOS && form.clienteId)
}

export function calcularTotaisOrdemServico(
  form: Pick<OrdemServicoFormState, 'valorServico' | 'valorPecas' | 'taxaIVA'>
): OrdemServicoFromFormTotais {
  const valorSemIVA = form.valorServico + form.valorPecas
  const valorIVA = valorSemIVA * (form.taxaIVA / 100)
  const valorTotal = valorSemIVA + valorIVA
  return { valorSemIVA, valorIVA, valorTotal }
}

function camposOrdemServicoFromForm(
  form: OrdemServicoFormState,
  totais: OrdemServicoFromFormTotais
): Omit<OrdemServico, 'id' | 'faturasPecas' | 'taxaIVA' | 'dataFechamento'> {
  return {
    numeroOS: form.numeroOS,
    clienteId: form.clienteId,
    clienteNome: form.clienteNome,
    dataAbertura: form.dataAbertura,
    status: form.status,
    valorServico: form.valorServico,
    valorPecas: form.valorPecas,
    valorTotal: totais.valorTotal,
    valorIVA: totais.valorIVA,
    valorSemIVA: totais.valorSemIVA,
    observacoes: form.observacoes,
    tecnicoResponsavel: form.tecnicoResponsavel,
    equipamentoId: form.equipamentoId,
  }
}

/** OS nova (sem taxaIVA no payload — comportamento legado; faturasPecas vazio). */
export function createOrdemServicoFromForm(
  form: OrdemServicoFormState,
  totais: OrdemServicoFromFormTotais,
  opts: { id: string }
): OrdemServico {
  return {
    id: opts.id,
    ...camposOrdemServicoFromForm(form, totais),
    faturasPecas: [],
  }
}

/** Actualiza campos editáveis (preserva id, faturasPecas; grava taxaIVA). */
export function updateOrdemServicoFromForm(
  existing: OrdemServico,
  form: OrdemServicoFormState,
  totais: OrdemServicoFromFormTotais
): OrdemServico {
  return {
    ...existing,
    ...camposOrdemServicoFromForm(form, totais),
    taxaIVA: form.taxaIVA,
  }
}
