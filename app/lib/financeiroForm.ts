/**
 * I/O de relógio — forms vazios canónicos em `app/modules/financeiro`.
 */
import { emptyOrdemServicoFormState as emptyOrdemServicoFormStatePure } from '../modules/financeiro/ordemServicoForm'
import {
  emptyFaturaPecasFormState as emptyFaturaPecasFormStatePure,
  faturaPecasToFormState as faturaPecasToFormStatePure,
} from '../modules/financeiro/faturaPecasForm'
import type { FaturaPecas } from '../modules/financeiro/tiposOs'
import type { OrdemServicoFormState } from '../modules/financeiro/ordemServicoForm'
import type { FaturaPecasFormState } from '../modules/financeiro/faturaPecasForm'

/** Injeta Date.now() nas datas iniciais quando o call-site não envia. */
export function emptyOrdemServicoFormState(): OrdemServicoFormState {
  return emptyOrdemServicoFormStatePure({ nowMs: Date.now() })
}

export function emptyFaturaPecasFormState(): FaturaPecasFormState {
  return emptyFaturaPecasFormStatePure({ nowMs: Date.now() })
}

export function faturaPecasToFormState(
  fatura: FaturaPecas,
  opts: { valorManualSemIVA?: string } = {}
): FaturaPecasFormState {
  return faturaPecasToFormStatePure(fatura, { ...opts, nowMs: Date.now() })
}
