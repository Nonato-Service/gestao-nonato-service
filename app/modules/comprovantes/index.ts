/** Módulo Comprovantes / despesas — parser OCR, clientes ativos, duplicados e folha semanal. */

export type { ComprovanteDespesa } from './tipos'

export {
  normalizarTextoOcrRecibo,
  parseTotalEurosFromReceiptText,
  parseDataReciboIso,
  parseHoraRecibo,
  extrairDescricaoRecibo,
} from './parser'

export type { ClienteAtivoComprovante, MotivoAssociacaoRecibo } from './clientesAtivos'
export {
  isoHojeLocal,
  horaAtualLocal,
  parseHoraMinutos,
  resolverClientesAtivosComprovanteHoje,
  labelOrigemClienteComprovante,
  estadoClienteReciboRapido,
  resolverEstadoClienteComprovanteRecibo,
} from './clientesAtivos'

export type { ComprovanteDespesaRef, DuplicadoComprovanteResultado } from './duplicado'
export {
  hashImagemComprovante,
  encontrarComprovanteDuplicado,
  mensagemDuplicadoComprovante,
  encontrarDuplicadoImagemComprovante,
} from './duplicado'

export type {
  ComprovanteFolhaItem,
  FolhaSemanalContadorLabels,
  FolhaSemanalContadorParams,
} from './folhaSemanalPdf'
export { buildFolhaSemanalContadorHtml, abrirFolhaSemanalContadorPdf } from './folhaSemanalPdf'
