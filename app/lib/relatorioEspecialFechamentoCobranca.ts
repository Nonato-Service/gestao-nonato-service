/**
 * @deprecated Preferir `app/modules/relatorios-especiais` — reexport de compatibilidade.
 */
export type {
  FechamentoItemBaseEspecial,
  LabelsFechamentoEspecial,
  RelatorioEspecialFechamentoShape,
} from '../modules/relatorios-especiais/fechamentoCobranca'
export {
  isRelatorioEspecialId,
  numeroPareceRelatorioEspecial,
  quantidadesFechamentoCobrancaEspecial,
  buildItensFechamentoBaseRelatorioEspecial,
  adaptRelatorioEspecialParaFechamentoShape,
  encontrarRelatorioEspecialPorOsInput,
} from '../modules/relatorios-especiais/fechamentoCobranca'
