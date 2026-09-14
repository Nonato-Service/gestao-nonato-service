/**
 * I/O de relógio — clientes ativos canónico em `app/modules/comprovantes/clientesAtivos`.
 */
import {
  horaAtualLocal as horaAtualLocalPure,
  isoHojeLocal as isoHojeLocalPure,
  resolverClientesAtivosComprovanteHoje as resolverClientesAtivosComprovanteHojePure,
  resolverEstadoClienteComprovanteRecibo as resolverEstadoClienteComprovanteReciboPure,
} from '../modules/comprovantes/clientesAtivos'

export type { ClienteAtivoComprovante, MotivoAssociacaoRecibo } from '../modules/comprovantes/clientesAtivos'
export {
  parseHoraMinutos,
  labelOrigemClienteComprovante,
  estadoClienteReciboRapido,
} from '../modules/comprovantes/clientesAtivos'

type ResolverHojeParams = Omit<
  Parameters<typeof resolverClientesAtivosComprovanteHojePure>[0],
  'nowMs'
>
type ResolverReciboParams = Omit<
  Parameters<typeof resolverEstadoClienteComprovanteReciboPure>[0],
  'nowMs'
>

/** Injeta Date.now() na data/hora local quando o call-site não envia. */
export function isoHojeLocal(): string {
  return isoHojeLocalPure(Date.now())
}

export function horaAtualLocal(): string {
  return horaAtualLocalPure(Date.now())
}

export function resolverClientesAtivosComprovanteHoje(params: ResolverHojeParams) {
  return resolverClientesAtivosComprovanteHojePure({ ...params, nowMs: Date.now() })
}

export function resolverEstadoClienteComprovanteRecibo(params: ResolverReciboParams) {
  return resolverEstadoClienteComprovanteReciboPure({ ...params, nowMs: Date.now() })
}
