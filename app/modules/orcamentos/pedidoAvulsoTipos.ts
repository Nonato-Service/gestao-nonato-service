/** Tipos canónicos do pedido de orçamento avulso. */

import type { OrcamentoWorkflowStatus } from './workflow'

export type EquipamentoClientePedido = {
  id?: string
  tipoEquipamento: string
  modelo: string
  marca: string
  numeroSerie: string
  familia?: string
  grupo?: string
}

export type ClientePedido = {
  id: string
  codigoCliente?: string
  nomeEmpresa: string
  morada?: string
  conselho?: string
  codigoPostal?: string
  pais?: string
  email?: string
  telefones?: string
  contato?: string
  numeroContribuicaoFiscal?: string
  equipamentos: EquipamentoClientePedido[]
}

export type PecaPedido = {
  id: string
  codigo: string
  nome: string
  imagem?: string
  quantidade: number
  pecaId?: string
  incluirObservacao?: boolean
  observacao?: string
}

export type EquipamentoBlocoPedido = {
  id: string
  equipamentoIdx?: number
  equipamento: EquipamentoClientePedido | null
  equipamentoManual: string
  pecas: PecaPedido[]
}

export type StatusPedidoAvulso = 'pendente' | 'cancelado' | 'concluido' | 'aprovado' | 'entregue'

export type PedidoAvulsoGuardado = {
  codigo: string
  dataGeracao: string
  clienteNomeReal: string
  clienteId?: string
  emitirComoCliente: 'cliente' | 'nonato-service'
  equipamentoTexto: string
  equipamentoChave?: string
  equipamentoNumeroSerie?: string
  pecas: PecaPedido[]
  equipamentosBlocos?: EquipamentoBlocoPedido[]
  status?: StatusPedidoAvulso
  workflowStatus?: OrcamentoWorkflowStatus
  numeroNotaFiscalEntrega?: string
  entregaConfirmadaEm?: string
  geradoEm?: string
  cotacaoRecebidaEm?: string
}

export type PedidoAvulsoHubSeed = {
  clienteId: string
  equipamentoIndex: number
  /** Token único por clique (Date.now) para reaplicar o seed mesmo no mesmo cliente/equipamento. */
  token: number
}
