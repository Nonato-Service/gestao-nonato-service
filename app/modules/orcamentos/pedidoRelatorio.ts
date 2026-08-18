/** Construtor puro de PedidoOrcamento a partir de relatório de serviço. */

import type {
  PedidoOrcamento,
  PedidoOrcamentoEmitirComo,
  RelatorioParaPedidoOrcamento,
} from './pedidoRelatorioTipos'

export type BuildPedidoOrcamentoFromRelatorioOpts = {
  codigo: string
  emitirComoCliente?: PedidoOrcamentoEmitirComo
  id?: string
  dataGeracao?: string
}

/** Monta o objecto do pedido (sem I/O / alertas / persistência). */
export function buildPedidoOrcamentoFromRelatorio(
  rel: RelatorioParaPedidoOrcamento,
  opts: BuildPedidoOrcamentoFromRelatorioOpts
): PedidoOrcamento {
  return {
    id: opts.id ?? Date.now().toString(),
    codigo: opts.codigo,
    numeroRelatorio: rel.numero,
    cliente: rel.cliente,
    clienteId: rel.clienteId,
    equipamentoId: rel.equipamentoId,
    relatorioId: rel.id,
    maquinaModelo: rel.maquinaModelo,
    numeroMaquina: rel.numeroMaquina,
    data: rel.data,
    dataGeracao: opts.dataGeracao ?? new Date().toISOString(),
    pecas: rel.pecasSubstituicao ?? [],
    status: 'pendente',
    emitirComoCliente: opts.emitirComoCliente ?? 'cliente',
  }
}

/** Há peças de substituição suficientes para gerar pedido. */
export function relatorioTemPecasParaPedidoOrcamento(
  rel: Pick<RelatorioParaPedidoOrcamento, 'pecasSubstituicao'>
): boolean {
  return Array.isArray(rel.pecasSubstituicao) && rel.pecasSubstituicao.length > 0
}
