/** Módulo Financeiro — devedores, flags e UI de fluxo de cobrança (funções puras). */

export type {
  ClienteDevedor,
  ClienteDevedorFaturaPendente,
  FaturaPecasDevedorLike,
  RelatorioParaDevedorLike,
  FechamentoItemDevedorLike,
  FechamentoIvaDevedorLike,
  ClienteCadastroDevedorFlags,
} from './tipos'

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
} from './fluxoUi'
