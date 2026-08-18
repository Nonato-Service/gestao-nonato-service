/** Tipos do pedido de orçamento gerado a partir de relatório de serviço. */

export type PedidoOrcamentoStatus =
  | 'pendente'
  | 'enviado'
  | 'recebido'
  | 'aprovado'
  | 'rejeitado'

export type PedidoOrcamentoEmitirComo = 'cliente' | 'nonato-service'

/** Peça no pedido (mesma forma de PecaSubstituicao do relatório). */
export type PecaPedidoOrcamento = {
  id: string
  imagem?: string
  descricao: string
  codigo: string
  quantidade: string
}

export type PedidoOrcamento = {
  id: string
  codigo?: string
  numeroRelatorio: string
  cliente: string
  clienteId?: string
  equipamentoId?: string
  maquinaModelo: string
  numeroMaquina: string
  data: string
  dataGeracao: string
  pecas: PecaPedidoOrcamento[]
  status: PedidoOrcamentoStatus
  emitirComoCliente?: PedidoOrcamentoEmitirComo
  relatorioId?: string
  observacoes?: string
}

/** Subconjunto do relatório necessário para construir o pedido. */
export type RelatorioParaPedidoOrcamento = {
  id: string
  numero: string
  cliente: string
  clienteId?: string
  equipamentoId?: string
  maquinaModelo: string
  numeroMaquina: string
  data: string
  pecasSubstituicao?: PecaPedidoOrcamento[]
}
