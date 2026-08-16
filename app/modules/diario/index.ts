/** Módulo Diário — tipos, constantes e helpers de texto/anexos (funções puras). */

export type { DiarioPedidoStatus, DiarioPedidoAnexo, DiarioPedidoItem } from './tipos'

export {
  DIARIO_PEDIDOS_DIA_STORAGE_KEY,
  DIARIO_PEDIDOS_MODAL_TOPO_RETRAIDO_KEY,
  DIARIO_PEDIDO_ANEXOS_MAX,
} from './constantes'

export { normalizeDiarioAnexos } from './normalize'
export { diarioPedidoTituloECorpo, diarioPedidoLinhasTarefas } from './texto'
