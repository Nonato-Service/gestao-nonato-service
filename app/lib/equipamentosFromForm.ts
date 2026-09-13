/**
 * I/O de relógio — fromForm canónico em `app/modules/equipamentos`.
 */
import {
  createHistoricoEquipamentoFromForm as createHistoricoEquipamentoFromFormPure,
  type CreateHistoricoEquipamentoFromFormOpts,
} from '../modules/equipamentos/historicoFromForm'
import {
  createItemInclusoFromForm as createItemInclusoFromFormPure,
  type CreateItemInclusoFromFormOpts,
} from '../modules/equipamentos/itemInclusoFromForm'
import type { HistoricoEquipamento, ItemIncluso } from '../modules/equipamentos/formState'
import type { HistoricoEquipamentoFormState } from '../modules/equipamentos/historicoForm'
import type { ItemInclusoFormState } from '../modules/equipamentos/itemInclusoForm'

/** Injeta Date.now() no id/data quando o call-site não envia. */
export function createHistoricoEquipamentoFromForm(
  form: HistoricoEquipamentoFormState,
  opts: Omit<CreateHistoricoEquipamentoFromFormOpts, 'nowMs'> = {}
): HistoricoEquipamento {
  return createHistoricoEquipamentoFromFormPure(form, { ...opts, nowMs: Date.now() })
}

export function createItemInclusoFromForm(
  form: Pick<ItemInclusoFormState, 'nome'> & { imagem?: string },
  opts: Omit<CreateItemInclusoFromFormOpts, 'nowMs'> = {}
): ItemIncluso {
  return createItemInclusoFromFormPure(form, { ...opts, nowMs: Date.now() })
}
