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
import {
  getSinalPagamentoFaturaFornecedor as getSinalPagamentoFaturaFornecedorPure,
  getSinalPagamentoFaturaPecas as getSinalPagamentoFaturaPecasPure,
  type FaturaFornecedorStatusLike,
  type FaturaPecasStatusLike,
  type SinalPagamentoFaturaFornecedor,
  type SinalPagamentoFaturaPecas,
} from '../modules/financeiro/faturaStatus'
import { normalizeFechamentoFluxoFinanceiroMap as normalizeFechamentoFluxoFinanceiroMapPure } from '../modules/financeiro/fluxoNormalize'
import {
  applyFechamentoEtapaFinanceiraToMap as applyFechamentoEtapaFinanceiraToMapPure,
  ensureDefaultFluxoEntriesForBibliotecaIds as ensureDefaultFluxoEntriesForBibliotecaIdsPure,
} from '../modules/financeiro/fluxoMutations'
import type {
  FechamentoFluxoFinanceiroEtapa,
  FechamentoFluxoFinanceiroMap,
  FechamentoFluxoFinanceiroPatchOpts,
} from '../modules/financeiro/fluxoTipos'
import {
  dateFromIsoWeekString as dateFromIsoWeekStringPure,
  financeiroReferenciaDateFromFiltros as financeiroReferenciaDateFromFiltrosPure,
} from '../modules/financeiro/periodo'
import type { TipoPeriodoFinanceiro } from '../modules/financeiro/tiposOs'
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

function nowIsoStamp(): string {
  return new Date().toISOString()
}

/** Injeta Date.now() no sinal de atraso das faturas. */
export function getSinalPagamentoFaturaFornecedor(
  f: Pick<FaturaFornecedorStatusLike, 'status' | 'dataVencimento'>,
  hojeRef?: Date
): SinalPagamentoFaturaFornecedor {
  return getSinalPagamentoFaturaFornecedorPure(f, (hojeRef ?? new Date()).getTime())
}

export function getSinalPagamentoFaturaPecas(
  f: Pick<FaturaPecasStatusLike, 'status' | 'dataVencimento'>,
  hojeRef?: Date
): SinalPagamentoFaturaPecas {
  return getSinalPagamentoFaturaPecasPure(f, (hojeRef ?? new Date()).getTime())
}

export function normalizeFechamentoFluxoFinanceiroMap(
  raw: unknown,
  nowIso?: string
): FechamentoFluxoFinanceiroMap {
  return normalizeFechamentoFluxoFinanceiroMapPure(raw, nowIso ?? nowIsoStamp())
}

export function applyFechamentoEtapaFinanceiraToMap(
  prev: FechamentoFluxoFinanceiroMap,
  relatorioId: string,
  etapa: FechamentoFluxoFinanceiroEtapa,
  opts?: FechamentoFluxoFinanceiroPatchOpts
): FechamentoFluxoFinanceiroMap {
  return applyFechamentoEtapaFinanceiraToMapPure(prev, relatorioId, etapa, opts, nowIsoStamp())
}

export function ensureDefaultFluxoEntriesForBibliotecaIds(
  prev: FechamentoFluxoFinanceiroMap,
  ids: string[],
  nowIso?: string
): { next: FechamentoFluxoFinanceiroMap; changed: boolean } {
  return ensureDefaultFluxoEntriesForBibliotecaIdsPure(prev, ids, nowIso ?? nowIsoStamp())
}

export function dateFromIsoWeekString(isoWeek: string, now?: Date): Date {
  return dateFromIsoWeekStringPure(isoWeek, (now ?? new Date()).getTime())
}

export function financeiroReferenciaDateFromFiltros(
  tipo: TipoPeriodoFinanceiro,
  refMes: string,
  refAno: number,
  refSemana: string,
  now?: Date
): Date {
  return financeiroReferenciaDateFromFiltrosPure(
    tipo,
    refMes,
    refAno,
    refSemana,
    (now ?? new Date()).getTime()
  )
}
