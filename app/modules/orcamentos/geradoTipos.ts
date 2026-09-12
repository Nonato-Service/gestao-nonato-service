/** Tipo do orçamento gerado na lista/browse (mais rico que OrcamentoGeradoRef). */

import type { OrcamentoWorkflowStatus } from './workflow'

export type OrcamentoGeradoItem = {
  id: string
  numeroOrcamento: string
  data: string
  validade?: string
  descricao?: string
  observacoes?: string
  tipo?: string
  status?: 'pendente' | 'cancelado' | 'concluido' | 'aprovado' | 'entregue'
  workflowStatus?: OrcamentoWorkflowStatus
  clienteId?: string
  clienteNome?: string
  relatorioId?: string
  relatorioNumero?: string
  equipamentoChave?: string
  equipamentoNumeroSerie?: string
  dadosCliente?: { nomeEmpresa?: string }
  numeroNotaFiscalEntrega?: string
  entregaConfirmadaEm?: string
  geradoEm?: string
  dataCriacao: string
  total?: number
}

export type OrcamentoGeradoClienteRef = { id: string; nomeEmpresa: string }

export function resolverNomeClienteOrcamentoGerado(
  orc: OrcamentoGeradoItem,
  clientes: OrcamentoGeradoClienteRef[]
): string {
  const nome = String(orc.clienteNome ?? '').trim()
  if (nome) return nome
  if (orc.clienteId) {
    const c = clientes.find((x) => x.id === orc.clienteId)
    if (c?.nomeEmpresa) return c.nomeEmpresa
  }
  const dados = String(orc.dadosCliente?.nomeEmpresa ?? '').trim()
  if (dados) return dados
  return ''
}
