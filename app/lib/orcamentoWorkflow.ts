/**
 * Re-export + relógio — fonte canónica em `app/modules/orcamentos/workflow`.
 */
import {
  criarPedidoSeparacaoFromOrcamento as criarPedidoSeparacaoFromOrcamentoPure,
  type OrcamentoWorkflowOrc,
} from '../modules/orcamentos/workflow'

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
  pedidoSeparacaoJaExiste,
  notifyEquipamentoOrcamentosChanged,
} from '../modules/orcamentos/workflow'

/** Injeta Date.now() nos ids e na data de criação do pedido de separação. */
export function criarPedidoSeparacaoFromOrcamento(
  orc: OrcamentoWorkflowOrc,
  pecasBiblioteca?: Array<{ id: string; codigo?: string; imagem?: string }>
) {
  return criarPedidoSeparacaoFromOrcamentoPure(orc, pecasBiblioteca, Date.now())
}
