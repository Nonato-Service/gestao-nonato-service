/**
 * I/O de relógio/aleatório — fromForm canónico em `app/modules/diario/fromForm`.
 */
import {
  createDiarioPedidoFromForm as createDiarioPedidoFromFormPure,
  updateDiarioPedidoFromForm as updateDiarioPedidoFromFormPure,
  type CreateDiarioPedidoFromFormOpts,
  type UpdateDiarioPedidoFromFormOpts,
} from '../modules/diario/fromForm'
import type { DiarioPedidoAnexo, DiarioPedidoItem } from '../modules/diario/tipos'

/** Injeta Date.now() e Math.random() no id e nas datas quando o call-site não envia. */
export function createDiarioPedidoFromForm(
  form: { texto: string; anexos?: DiarioPedidoAnexo[] },
  opts: Omit<CreateDiarioPedidoFromFormOpts, 'nowMs' | 'random'> = {}
): DiarioPedidoItem {
  return createDiarioPedidoFromFormPure(form, { ...opts, nowMs: Date.now(), random: Math.random })
}

export function updateDiarioPedidoFromForm(
  existing: DiarioPedidoItem,
  form: { texto: string; anexos?: DiarioPedidoAnexo[]; clienteCadastroId?: string },
  opts: Omit<UpdateDiarioPedidoFromFormOpts, 'nowMs'> = {}
): DiarioPedidoItem {
  return updateDiarioPedidoFromFormPure(existing, form, { ...opts, nowMs: Date.now() })
}
