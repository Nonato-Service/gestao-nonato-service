import {
  buildPedidoOrcamentoFromRelatorio as buildPedidoOrcamentoFromRelatorioPure,
  type BuildPedidoOrcamentoFromRelatorioOpts,
} from '../modules/orcamentos/pedidoRelatorio'
import type { PedidoOrcamento, RelatorioParaPedidoOrcamento } from '../modules/orcamentos/pedidoRelatorioTipos'

/** Injeta Date.now() no id e na data de geração quando o call-site não envia. */
export function buildPedidoOrcamentoFromRelatorio(
  rel: RelatorioParaPedidoOrcamento,
  opts: BuildPedidoOrcamentoFromRelatorioOpts
): PedidoOrcamento {
  return buildPedidoOrcamentoFromRelatorioPure(rel, { ...opts, nowMs: Date.now() })
}
