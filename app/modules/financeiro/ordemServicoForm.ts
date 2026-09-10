/** Estado vazio e mapeamento OrdemServico → formulário. */

import type { OrdemServico } from './tiposOs'

export type OrdemServicoStatus = OrdemServico['status']

export type OrdemServicoFormState = {
  numeroOS: string
  clienteId: string
  clienteNome: string
  dataAbertura: string
  status: OrdemServicoStatus
  valorServico: number
  valorPecas: number
  taxaIVA: number
  observacoes: string
  tecnicoResponsavel: string
  equipamentoId: string
}

export function emptyOrdemServicoFormState(): OrdemServicoFormState {
  return {
    numeroOS: '',
    clienteId: '',
    clienteNome: '',
    dataAbertura: new Date().toISOString().split('T')[0],
    status: 'aberta',
    valorServico: 0,
    valorPecas: 0,
    taxaIVA: 23,
    observacoes: '',
    tecnicoResponsavel: '',
    equipamentoId: '',
  }
}

/** Após gravar: taxa guardada; na edição: taxa a partir dos valores (legado sem taxaIVA). */
export function ordemServicoToFormState(
  os: OrdemServico,
  opts?: { taxaFromValores?: boolean }
): OrdemServicoFormState {
  const taxaFromValores = opts?.taxaFromValores === true
  return {
    numeroOS: os.numeroOS,
    clienteId: os.clienteId,
    clienteNome: os.clienteNome,
    dataAbertura: taxaFromValores ? os.dataAbertura.split('T')[0] : os.dataAbertura,
    status: os.status,
    valorServico: os.valorServico,
    valorPecas: os.valorPecas,
    taxaIVA: taxaFromValores ? (os.valorIVA / os.valorSemIVA) * 100 || 23 : os.taxaIVA ?? 0,
    observacoes: os.observacoes || '',
    tecnicoResponsavel: os.tecnicoResponsavel || '',
    equipamentoId: os.equipamentoId || '',
  }
}
