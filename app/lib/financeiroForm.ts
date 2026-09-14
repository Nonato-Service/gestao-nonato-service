/**
 * I/O de relógio — forms vazios canónicos em `app/modules/financeiro`.
 */
import { emptyOrdemServicoFormState as emptyOrdemServicoFormStatePure } from '../modules/financeiro/ordemServicoForm'
import {
  emptyFaturaPecasFormState as emptyFaturaPecasFormStatePure,
  faturaPecasToFormState as faturaPecasToFormStatePure,
} from '../modules/financeiro/faturaPecasForm'
import {
  calcularClientesDevedores as calcularClientesDevedoresPure,
  type CalcularClientesDevedoresInput,
} from '../modules/financeiro/calcularDevedores'
import { buildRelatorioFinanceiroPeriodo as buildRelatorioFinanceiroPeriodoPure } from '../modules/financeiro/buildPeriodo'
import type { FaturaPecas, BuildFinanceiroPeriodoInput, RelatorioFinanceiro } from '../modules/financeiro/tiposOs'
import type { ClienteDevedor } from '../modules/financeiro/tipos'
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

/** Injeta new Date() no cálculo de devedores e no relatório de período. */
export function calcularClientesDevedores(
  input: Omit<CalcularClientesDevedoresInput, 'agora'> & { agora?: Date }
): ClienteDevedor[] {
  return calcularClientesDevedoresPure({ ...input, agora: input.agora ?? new Date() })
}

export function buildRelatorioFinanceiroPeriodo(
  input: BuildFinanceiroPeriodoInput
): RelatorioFinanceiro {
  return buildRelatorioFinanceiroPeriodoPure({ ...input, agora: input.agora ?? new Date() })
}
