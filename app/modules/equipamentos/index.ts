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

export type { EquipamentoFormCamposObrigatorios } from './equipamentoFromForm'
export {
  isEquipamentoFormValid,
  equipamentoIdDuplicado,
  createEquipamentoFromForm,
  updateEquipamentoFromForm,
} from './equipamentoFromForm'

export type { HistoricoEquipamentoTipo, HistoricoEquipamentoFormState } from './historicoForm'
export { emptyHistoricoEquipamentoForm } from './historicoForm'
export type { CreateHistoricoEquipamentoFromFormOpts } from './historicoFromForm'
export {
  isHistoricoEquipamentoFormValid,
  createHistoricoEquipamentoFromForm,
} from './historicoFromForm'

export type { ItemInclusoFormState } from './itemInclusoForm'
export { emptyItemInclusoForm } from './itemInclusoForm'
export type { CreateItemInclusoFromFormOpts } from './itemInclusoFromForm'
export {
  isItemInclusoFormValid,
  createItemInclusoFromForm,
  updateItemInclusoFromForm,
} from './itemInclusoFromForm'
