/**
 * I/O de relógio — fromForm canónico em `app/modules/orcamentos/pedidoAvulsoFromForm`.
 */
import {
  createPecaPedidoFromForm as createPecaPedidoFromFormPure,
  createPedidoAvulsoFromForm as createPedidoAvulsoFromFormPure,
  type CreatePecaPedidoFromFormOpts,
  type CreatePedidoAvulsoFromFormOpts,
} from '../modules/orcamentos/pedidoAvulsoFromForm'
import type { PecaPedido, PedidoAvulsoGuardado } from '../modules/orcamentos/pedidoAvulsoTipos'

/** Injeta Date.now() no id da peça quando o call-site não envia um. */
export function createPecaPedidoFromForm(
  form: Omit<PecaPedido, 'id'> & { id?: string },
  opts: Omit<CreatePecaPedidoFromFormOpts, 'nowMs'> = {}
): PecaPedido {
  return createPecaPedidoFromFormPure(form, { ...opts, nowMs: Date.now() })
}

/** Injeta Date.now() em dataGeracao/geradoEm quando o call-site não envia. */
export function createPedidoAvulsoFromForm(
  form: Omit<PedidoAvulsoGuardado, 'dataGeracao' | 'geradoEm' | 'status'> & {
    dataGeracao?: string
    geradoEm?: string
    status?: PedidoAvulsoGuardado['status']
  },
  opts: Omit<CreatePedidoAvulsoFromFormOpts, 'nowMs'> = {}
): PedidoAvulsoGuardado {
  return createPedidoAvulsoFromFormPure(form, { ...opts, nowMs: Date.now() })
}
