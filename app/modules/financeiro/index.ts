/** Módulo Financeiro — devedores, flags, UI de fluxo, período/IVA, mutações de fluxo (funções puras). */

export type {
  ClienteDevedor,
  ClienteDevedorFaturaPendente,
  FaturaPecasDevedorLike,
  RelatorioParaDevedorLike,
  FechamentoItemDevedorLike,
  FechamentoIvaDevedorLike,
  ClienteCadastroDevedorFlags,
} from './tipos'

export type {
  OrdemServico,
  FaturaPecas,
  IVAControle,
  RelatorioFinanceiro,
  TipoPeriodoFinanceiro,
  RelatorioServicoLike,
  BuildFinanceiroPeriodoInput,
} from './tiposOs'

export type { ClienteDevedorLike } from './devedorFlags'
export { isClienteMarcadoDevedor, relatorioFluxoFinanceiroNaoPago } from './devedorFlags'

export type { CalcularClientesDevedoresInput } from './calcularDevedores'
export {
  calcularClientesDevedores,
  aplicarFlagsDevedorNosClientes,
  hashFlagsClientesDevedores,
  refreshDevedoresListaSegura,
} from './calcularDevedores'

export type {
  ContabilidadeConfig,
  FechamentoFluxoFinanceiroEtapa,
  FechamentoFluxoFinanceiroModo,
  FechamentoFluxoFinanceiroPagamento,
  FechamentoSituacaoFatura,
  FechamentoFluxoFinanceiroEntry,
  FechamentoFluxoFinanceiroMap,
  FechamentoFluxoFinanceiroPatchOpts,
} from './fluxoTipos'

export {
  FECHAMENTO_FLUXO_FINANCEIRO_KEY,
  CONTABILIDADE_CONFIG_KEY,
  defaultContabilidadeConfig,
  defaultFluxoEntryParaBiblioteca,
} from './fluxoTipos'

export {
  applyFechamentoEtapaFinanceiraToMap,
  situacaoFaturaToEtapaOpts,
  removeFechamentoFluxoIdsFromMap,
  ensureDefaultFluxoEntriesForBibliotecaIds,
  relatorioServicoFluxoFinanceiroPendente,
} from './fluxoMutations'

export type {
  FechamentoFluxoFinanceiroEntryLike,
  FechamentoFluxoFase,
  EstadoCobrancaFinanceiraVisual,
  EstadoCobrancaFinanceiraGrupoExibicao,
} from './fluxoUi'

export {
  getFechamentoFluxoFase,
  fechamentoFluxoEhSemFatura,
  fechamentoFluxoFasePisca,
  getEstadoCobrancaFinanceiraVisual,
  classNameFechamentoFluxoBar,
  classNameFinanceiroDespesasBibCardPorEstado,
  classNameFinanceiroDespesasBibGrupoPorEstado,
  getEstadoCobrancaFinanceiraGrupo,
  ORDEM_ESTADOS_COBRANCA_FINANCEIRA,
  getEstadoCobrancaFinanceiraGrupoExibicao,
  classNameBibliotecaClienteFluxoFinanceiro,
  financeiroDespesasBibGrupoDevePiscar,
  classNameResumoCobrancaPorFase,
} from './fluxoUi'

export { normalizarTextoFaturaBusca, numeroFaturaCorrespondeConsulta } from './faturaBusca'

export {
  parseDataFinanceiroParaDate,
  periodoFinanceiroFromDate,
  isoWeekStringFromDate,
  dateFromIsoWeekString,
  financeiroReferenciaDateFromFiltros,
  dataDentroPeriodoFinanceiro,
} from './periodo'

export { buildIvaControlesFromDados, buildRelatorioFinanceiroPeriodo } from './buildPeriodo'
