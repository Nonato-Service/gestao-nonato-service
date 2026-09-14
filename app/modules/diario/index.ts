/** Módulo Diário — tipos, constantes, helpers de texto/anexos, lembrete e compressão de imagem. */

export type { DiarioPedidoStatus, DiarioPedidoAnexo, DiarioPedidoItem } from './tipos'

export {
  DIARIO_PEDIDOS_DIA_STORAGE_KEY,
  DIARIO_PEDIDOS_MODAL_TOPO_RETRAIDO_KEY,
  DIARIO_PEDIDO_ANEXOS_MAX,
} from './constantes'

export { normalizeDiarioAnexos } from './normalize'
export { diarioPedidoTituloECorpo, diarioPedidoLinhasTarefas } from './texto'
export {
  COMPRESS_IMAGE_MAX_W,
  COMPRESS_IMAGE_MAX_H,
  COMPRESS_IMAGE_QUALITY_START,
  COMPRESS_IMAGE_QUALITY_MIN,
  COMPRESS_IMAGE_QUALITY_STEP,
  COMPRESS_IMAGE_MAX_DATA_URL_LEN,
} from './compressImage'
export type { CreateDiarioPedidoFromFormOpts, UpdateDiarioPedidoFromFormOpts } from './fromForm'
export {
  isDiarioPedidoConteudoValid,
  buildDiarioPedidoTexto,
  cloneDiarioPedidoAnexos,
  createDiarioPedidoFromForm,
  updateDiarioPedidoFromForm,
} from './fromForm'

export type { DiarioLembreteFields, DiarioLembreteIntervaloMin, DiarioLembretePatch } from './lembrete'
export {
  DIARIO_LEMBRETE_INTERVALOS_MIN,
  DIARIO_LEMBRETE_INTERVALO_KEYS,
  DIARIO_LEMBRETE_CUSTOM_KEY,
  scheduleProximoLembrete,
  normalizeDiarioItemLembrete,
  applyDiarioLembretePatch,
  formatDiarioLembreteIntervalo,
  isDiarioLembreteDue,
  advanceDiarioLembreteAfterFire,
  clearDiarioLembreteOnConcluido,
  clampDiarioLembreteMinutos,
  diarioLembreteSelectKey,
} from './lembrete'
