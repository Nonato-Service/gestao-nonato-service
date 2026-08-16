/**
 * @deprecated Preferir `app/modules/financeiro` — reexport de compatibilidade.
 */
export type {
  FechamentoFluxoFinanceiroEntryLike,
  FechamentoFluxoFase,
  EstadoCobrancaFinanceiraVisual,
  EstadoCobrancaFinanceiraGrupoExibicao,
} from '../modules/financeiro/fluxoUi'

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
} from '../modules/financeiro/fluxoUi'
