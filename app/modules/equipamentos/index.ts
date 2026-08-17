/** Módulo Equipamentos — relatório/serviço, pedido avulso PDF, etiquetas e formulário armazém. */

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

export type {
  HistoricoEquipamento,
  ItemIncluso,
  PartEquipamento,
  Equipamento,
  EquipamentoFormState,
} from './formState'
export {
  buildPartesPadraoEquipamento,
  resizePartesEquipamento,
  createEmptyEquipamentoForm,
  equipamentoToFormState,
} from './formState'
