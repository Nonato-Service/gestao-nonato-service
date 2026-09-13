/**
 * I/O de relógio/aleatório — ids canónicos em `app/modules/orcamentos/pedidoAvulsoForm`.
 */
import {
  emptyEquipamentoBlocoPedido as emptyEquipamentoBlocoPedidoPure,
  newPedidoAvulsoEntityId as newPedidoAvulsoEntityIdPure,
} from '../modules/orcamentos/pedidoAvulsoForm'
import type { EquipamentoBlocoPedido } from '../modules/orcamentos/pedidoAvulsoTipos'

/** Injeta Date.now() e Math.random() no id da entidade. */
export function newPedidoAvulsoEntityId(prefix: string): string {
  return newPedidoAvulsoEntityIdPure(prefix, Date.now(), Math.random)
}

/** Injeta Date.now() e Math.random() no bloco vazio quando o call-site não envia id. */
export function emptyEquipamentoBlocoPedido(opts: { id?: string } = {}): EquipamentoBlocoPedido {
  return emptyEquipamentoBlocoPedidoPure({ ...opts, nowMs: Date.now(), random: Math.random })
}
