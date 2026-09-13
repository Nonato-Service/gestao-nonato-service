/**
 * Re-export + I/O — fonte canónica em `app/modules/orcamentos/workflow`.
 */
import {
  criarPedidoSeparacaoFromOrcamento as criarPedidoSeparacaoFromOrcamentoPure,
  EQUIPAMENTO_ORCAMENTOS_CHANGED_EVENT,
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
  EQUIPAMENTO_ORCAMENTOS_CHANGED_EVENT,
} from '../modules/orcamentos/workflow'

/** Injeta Date.now() nos ids e na data de criação do pedido de separação. */
export function criarPedidoSeparacaoFromOrcamento(
  orc: OrcamentoWorkflowOrc,
  pecasBiblioteca?: Array<{ id: string; codigo?: string; imagem?: string }>
) {
  return criarPedidoSeparacaoFromOrcamentoPure(orc, pecasBiblioteca, Date.now())
}

/** Dispara actualização nos painéis de equipamento do cliente (mesmo separador). */
export function notifyEquipamentoOrcamentosChanged(): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(EQUIPAMENTO_ORCAMENTOS_CHANGED_EVENT))
  }
}
