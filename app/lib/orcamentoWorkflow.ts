/**
 * @deprecated Preferir `app/modules/orcamentos` — reexport de compatibilidade.
 */
export type {
  OrcamentoWorkflowStatus,
  PedidoSeparacaoItem,
  PedidoSeparacaoRef,
  OrcamentoWorkflowOrc,
} from '../modules/orcamentos/workflow'
export {
  orcamentoAguardandoConfirmacaoCliente,
  orcamentoPedidoConfirmado,
  orcamentoMercadoriaRecebida,
  criarPedidoSeparacaoFromOrcamento,
  pedidoSeparacaoJaExiste,
  notifyEquipamentoOrcamentosChanged,
} from '../modules/orcamentos/workflow'
