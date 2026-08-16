/**
 * @deprecated Preferir `app/modules/comprovantes` — reexport de compatibilidade.
 */
export type { ClienteAtivoComprovante, MotivoAssociacaoRecibo } from '../modules/comprovantes/clientesAtivos'
export {
  isoHojeLocal,
  horaAtualLocal,
  parseHoraMinutos,
  resolverClientesAtivosComprovanteHoje,
  labelOrigemClienteComprovante,
  estadoClienteReciboRapido,
  resolverEstadoClienteComprovanteRecibo,
} from '../modules/comprovantes/clientesAtivos'
