/** Módulo Equipamentos — relatório/serviço, pedido avulso PDF e etiquetas de armazém. */

export type { GrupoEquipamento } from './tiposGrupo'

export * from './relatorio'

export type {
  EquipamentoPedidoPdfOrigem,
  BlocoEquipamentoPedidoPdf,
} from './pedidoAvulso'
export {
  enriquecerBlocoEquipamentoPedido,
  montarCamposEquipamentoPedidoPdf,
} from './pedidoAvulso'

export type {
  ItemInclusoEtiqueta,
  EquipamentoEtiquetaLike,
  EtiquetasArmazemLabels,
} from './etiquetas'
export { getSequenciaEtiquetasArmazem, openPrintEtiquetasArmazem } from './etiquetas'
